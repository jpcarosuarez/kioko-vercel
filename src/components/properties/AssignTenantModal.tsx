import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Property, User, UserRole } from '@/types/models';
import { toast } from 'sonner';

interface AssignTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  tenants: User[];
  onAssign: (propertyId: string, tenantId: string) => Promise<void>;
}

export const AssignTenantModal: React.FC<AssignTenantModalProps> = ({
  isOpen,
  onClose,
  property,
  tenants,
  onAssign
}) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTenantId(property?.tenantId || '');
    } else {
      setSelectedTenantId('');
    }
  }, [isOpen, property]);

  const handleSubmit = async () => {
    if (!property) return;

    try {
      setIsSubmitting(true);
      await onAssign(property.id, selectedTenantId);
      toast.success('Inquilino asignado correctamente');
      onClose();
    } catch (error) {
      console.error('Error assigning tenant:', error);
      toast.error('Error al asignar inquilino');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = async () => {
    if (!property) return;

    try {
      setIsSubmitting(true);
      await onAssign(property.id, '');
      toast.success('Inquilino removido correctamente');
      onClose();
    } catch (error) {
      console.error('Error clearing tenant:', error);
      toast.error('Error al remover inquilino');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare tenant options for combobox
  const tenantOptions = tenants.map(tenant => ({
    value: tenant.id,
    label: `${tenant.name} (${tenant.email})`
  }));

  const currentTenant = tenants.find(t => t.id === property?.tenantId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Inquilino</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Propiedad:</strong> {property?.address}
            </p>
            {currentTenant && (
              <p className="text-sm text-gray-600 mb-4">
                <strong>Inquilino actual:</strong> {currentTenant.name} ({currentTenant.email})
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Seleccionar Inquilino
            </label>
            <Combobox
              options={tenantOptions}
              value={selectedTenantId}
              onValueChange={setSelectedTenantId}
              placeholder="Buscar y seleccionar inquilino"
              searchPlaceholder="Buscar inquilino..."
              emptyText="No se encontraron inquilinos"
              allowClear={true}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {property?.tenantId && (
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isSubmitting}
                className="text-red-600 hover:text-red-700"
              >
                Remover Inquilino
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !selectedTenantId}
            >
              {isSubmitting ? 'Asignando...' : 'Asignar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
