import { useState, useCallback } from 'react';
import { notifications } from '../lib/notifications';

interface AsyncOperationState {
  isLoading: boolean;
  error: string | null;
  data: any;
}

interface AsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
  resetOnSuccess?: boolean;
}

export function useAsyncOperation<T = any>(
  operation: (...args: any[]) => Promise<T>,
  options: AsyncOperationOptions = {}
) {
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showSuccessNotification = true,
    showErrorNotification = true,
    resetOnSuccess = false
  } = options;

  const [state, setState] = useState<AsyncOperationState>({
    isLoading: false,
    error: null,
    data: null
  });

  const execute = useCallback(async (...args: any[]) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const result = await operation(...args);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        data: resetOnSuccess ? null : result,
        error: null
      }));

      // Show success notification
      if (showSuccessNotification && successMessage) {
        notifications.success(successMessage);
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error(String(error));
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorInstance.message
      }));

      // Show error notification
      if (showErrorNotification) {
        const message = errorMessage || 'Ocurrió un error inesperado';
        notifications.error(message, errorInstance.message);
      }

      // Call error callback
      if (onError) {
        onError(errorInstance);
      }

      throw errorInstance;
    }
  }, [operation, onSuccess, onError, successMessage, errorMessage, showSuccessNotification, showErrorNotification, resetOnSuccess]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null
    });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}

// Specialized hooks for common operations

// Hook for CRUD operations
export function useCrudOperation<T = any>(
  operations: {
    create?: (...args: any[]) => Promise<T>;
    read?: (...args: any[]) => Promise<T>;
    update?: (...args: any[]) => Promise<T>;
    delete?: (...args: any[]) => Promise<T>;
  },
  entityName: string = 'elemento'
) {
  const createOperation = useAsyncOperation(
    operations.create || (() => Promise.reject(new Error('Create operation not implemented'))),
    {
      successMessage: `${entityName} creado exitosamente`,
      errorMessage: `Error al crear ${entityName}`,
      resetOnSuccess: true
    }
  );

  const readOperation = useAsyncOperation(
    operations.read || (() => Promise.reject(new Error('Read operation not implemented'))),
    {
      showSuccessNotification: false,
      errorMessage: `Error al cargar ${entityName}`
    }
  );

  const updateOperation = useAsyncOperation(
    operations.update || (() => Promise.reject(new Error('Update operation not implemented'))),
    {
      successMessage: `${entityName} actualizado exitosamente`,
      errorMessage: `Error al actualizar ${entityName}`
    }
  );

  const deleteOperation = useAsyncOperation(
    operations.delete || (() => Promise.reject(new Error('Delete operation not implemented'))),
    {
      successMessage: `${entityName} eliminado exitosamente`,
      errorMessage: `Error al eliminar ${entityName}`
    }
  );

  return {
    create: createOperation,
    read: readOperation,
    update: updateOperation,
    delete: deleteOperation
  };
}

// Hook for file upload operations
export function useFileUpload() {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [failedFiles, setFailedFiles] = useState<string[]>([]);

  const uploadOperation = useAsyncOperation(
    async (files: File[], uploadFunction: (file: File, onProgress: (progress: number) => void) => Promise<any>) => {
      const results = [];
      setUploadedFiles([]);
      setFailedFiles([]);
      setUploadProgress({});

      for (const file of files) {
        try {
          const result = await uploadFunction(file, (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          });
          
          results.push({ file: file.name, result, success: true });
          setUploadedFiles(prev => [...prev, file.name]);
          
          // Remove from progress when completed
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
          
        } catch (error) {
          results.push({ file: file.name, error, success: false });
          setFailedFiles(prev => [...prev, file.name]);
          
          // Remove from progress when failed
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }
      }

      return results;
    },
    {
      showSuccessNotification: false,
      showErrorNotification: false
    }
  );

  const reset = useCallback(() => {
    uploadOperation.reset();
    setUploadProgress({});
    setUploadedFiles([]);
    setFailedFiles([]);
  }, [uploadOperation]);

  return {
    ...uploadOperation,
    uploadProgress,
    uploadedFiles,
    failedFiles,
    reset
  };
}

// Hook for batch operations
export function useBatchOperation<T = any>(
  batchFunction: (items: any[]) => Promise<T[]>,
  operationName: string = 'operación'
) {
  const [progress, setProgress] = useState(0);
  const [processedItems, setProcessedItems] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const batchOperation = useAsyncOperation(
    async (items: any[]) => {
      setTotalItems(items.length);
      setProcessedItems(0);
      setProgress(0);

      // Show start notification
      notifications.batch.operationStarted(operationName, items.length);

      const results = [];
      let successful = 0;
      let failed = 0;

      for (let i = 0; i < items.length; i++) {
        try {
          const result = await batchFunction([items[i]]);
          results.push({ item: items[i], result: result[0], success: true });
          successful++;
        } catch (error) {
          results.push({ item: items[i], error, success: false });
          failed++;
        }

        setProcessedItems(i + 1);
        setProgress(((i + 1) / items.length) * 100);
      }

      // Show completion notification
      notifications.batch.operationCompleted(operationName, successful, failed);

      return results;
    },
    {
      showSuccessNotification: false,
      showErrorNotification: false
    }
  );

  const reset = useCallback(() => {
    batchOperation.reset();
    setProgress(0);
    setProcessedItems(0);
    setTotalItems(0);
  }, [batchOperation]);

  return {
    ...batchOperation,
    progress,
    processedItems,
    totalItems,
    reset
  };
}

export default useAsyncOperation;