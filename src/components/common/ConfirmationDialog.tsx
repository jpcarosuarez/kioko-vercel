import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { AlertTriangle, Trash2, UserX, Home, FileX } from 'lucide-react';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  type?: 'delete' | 'user' | 'property' | 'document' | 'general';
  isLoading?: boolean;
}

const iconMap = {
  delete: Trash2,
  user: UserX,
  property: Home,
  document: FileX,
  general: AlertTriangle
};

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'destructive',
  type = 'general',
  isLoading = false
}) => {
  const Icon = iconMap[type];

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            <div className={`
              flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
              ${variant === 'destructive' 
                ? 'bg-red-100 text-red-600' 
                : 'bg-blue-100 text-blue-600'
              }
            `}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                {title}
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription className="text-sm text-gray-600 mt-3">
          {description}
        </AlertDialogDescription>
        
        <AlertDialogFooter className="mt-6 space-x-3">
          <AlertDialogCancel asChild>
            <Button 
              variant="outline" 
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {cancelText}
            </Button>
          </AlertDialogCancel>
          
          <AlertDialogAction asChild>
            <Button
              variant={variant}
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Procesando...</span>
                </div>
              ) : (
                confirmText
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Specialized confirmation dialogs for common use cases
export const DeleteUserDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  userName: string;
  isLoading?: boolean;
}> = ({ open, onOpenChange, onConfirm, userName, isLoading }) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    onConfirm={onConfirm}
    title="Eliminar Usuario"
    description={`¿Está seguro de que desea eliminar al usuario "${userName}"? Esta acción no se puede deshacer y eliminará todos los datos asociados.`}
    confirmText="Eliminar Usuario"
    type="user"
    isLoading={isLoading}
  />
);

export const DeletePropertyDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  propertyAddress: string;
  isLoading?: boolean;
}> = ({ open, onOpenChange, onConfirm, propertyAddress, isLoading }) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    onConfirm={onConfirm}
    title="Eliminar Propiedad"
    description={`¿Está seguro de que desea eliminar la propiedad "${propertyAddress}"? Esta acción eliminará también todos los documentos asociados y no se puede deshacer.`}
    confirmText="Eliminar Propiedad"
    type="property"
    isLoading={isLoading}
  />
);

export const DeleteDocumentDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  documentName: string;
  isLoading?: boolean;
}> = ({ open, onOpenChange, onConfirm, documentName, isLoading }) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    onConfirm={onConfirm}
    title="Eliminar Documento"
    description={`¿Está seguro de que desea eliminar el documento "${documentName}"? El archivo será eliminado permanentemente de Google Drive y esta acción no se puede deshacer.`}
    confirmText="Eliminar Documento"
    type="document"
    isLoading={isLoading}
  />
);

export const TransferOwnershipDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  propertyAddress: string;
  newOwnerName: string;
  isLoading?: boolean;
}> = ({ open, onOpenChange, onConfirm, propertyAddress, newOwnerName, isLoading }) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    onConfirm={onConfirm}
    title="Transferir Propiedad"
    description={`¿Está seguro de que desea transferir la propiedad "${propertyAddress}" a "${newOwnerName}"? Todos los documentos asociados también serán transferidos.`}
    confirmText="Transferir Propiedad"
    variant="default"
    type="property"
    isLoading={isLoading}
  />
);

export default ConfirmationDialog;