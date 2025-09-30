import React from 'react';
import { Document } from '@/types/models';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, 
  AlertTriangle, 
  FileText, 
  HardDrive,
  Clock,
  User
} from 'lucide-react';

interface DocumentConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  document: Document | null;
  operation: 'delete' | 'sync' | 'batch-delete';
  documentCount?: number;
  loading?: boolean;
}

export const DocumentConfirmationDialog: React.FC<DocumentConfirmationDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  document,
  operation,
  documentCount = 1,
  loading = false
}) => {
  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      // Handle Firestore Timestamp
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      
      // Handle Date object
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      
      // Handle string or number timestamp
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  };

  // Get dialog content based on operation
  const getDialogContent = () => {
    switch (operation) {
      case 'delete':
        return {
          title: 'Eliminar Documento',
          description: 'Esta acción eliminará permanentemente el documento y no se puede deshacer.',
          confirmText: 'Eliminar',
          confirmVariant: 'destructive' as const,
          icon: <Trash2 className="h-6 w-6 text-red-600" />
        };
      
      case 'batch-delete':
        return {
          title: `Eliminar ${documentCount} Documentos`,
          description: `Esta acción eliminará permanentemente ${documentCount} documentos y no se puede deshacer.`,
          confirmText: 'Eliminar Todos',
          confirmVariant: 'destructive' as const,
          icon: <Trash2 className="h-6 w-6 text-red-600" />
        };
      
      case 'sync':
        return {
          title: 'Sincronizar con Google Drive',
          description: 'Esta acción actualizará los metadatos del documento con la información de Google Drive.',
          confirmText: 'Sincronizar',
          confirmVariant: 'default' as const,
          icon: <HardDrive className="h-6 w-6 text-blue-600" />
        };
      
      default:
        return {
          title: 'Confirmar Acción',
          description: '¿Estás seguro de que deseas continuar?',
          confirmText: 'Confirmar',
          confirmVariant: 'default' as const,
          icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />
        };
    }
  };

  const dialogContent = getDialogContent();

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {dialogContent.icon}
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {dialogContent.description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Document Details */}
        {document && operation !== 'batch-delete' && (
          <div className="space-y-4">
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{document.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    {document.description || 'Sin descripción'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{document.fileSize}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(document.uploadDate)}</span>
                </div>
              </div>

              {document.tags && document.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {document.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {document.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{document.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Batch Operation Details */}
        {operation === 'batch-delete' && documentCount > 1 && (
          <div className="space-y-4">
            <Separator />
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Advertencia</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Se eliminarán {documentCount} documentos y sus archivos de Google Drive.
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
        )}

        {/* Google Drive Warning for Delete Operations */}
        {(operation === 'delete' || operation === 'batch-delete') && (
          <div className="space-y-4">
            <Separator />
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-800">
                <HardDrive className="h-4 w-4" />
                <span className="font-medium">Google Drive</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                {operation === 'batch-delete' 
                  ? 'Los archivos también se eliminarán de Google Drive.'
                  : 'El archivo también se eliminará de Google Drive.'
                }
              </p>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={
              dialogContent.confirmVariant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600'
                : ''
            }
          >
            {loading ? 'Procesando...' : dialogContent.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DocumentConfirmationDialog;