import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Property, User } from '@/types/models';
import { User as UserIcon, ArrowRight } from 'lucide-react';

interface TransferOwnershipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newOwnerId: string) => Promise<void>;
  property: Property | null;
  owners: User[];
}

export const TransferOwnershipDialog: React.FC<TransferOwnershipDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  property,
  owners
}) => {
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

  const handleTransfer = async () => {
    if (!selectedOwnerId || !property) return;

    try {
      setIsTransferring(true);
      await onConfirm(selectedOwnerId);
      setSelectedOwnerId('');
      onClose();
    } catch (error) {
      console.error('Error transferring ownership:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleClose = () => {
    if (!isTransferring) {
      setSelectedOwnerId('');
      onClose();
    }
  };

  const currentOwner = owners.find(owner => owner.id === property?.ownerId);
  const availableOwners = owners.filter(owner => owner.id !== property?.ownerId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Property Ownership</DialogTitle>
        </DialogHeader>

        {property && (
          <div className="space-y-6">
            {/* Property Information */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Property</h4>
              <p className="text-sm text-muted-foreground">{property.address}</p>
            </div>

            {/* Current Owner */}
            <div className="space-y-2">
              <Label>Current Owner</Label>
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {currentOwner ? `${currentOwner.name} (${currentOwner.email})` : 'Unknown Owner'}
                </span>
              </div>
            </div>

            {/* Transfer Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* New Owner Selection */}
            <div className="space-y-2">
              <Label htmlFor="new-owner">New Owner *</Label>
              <Select
                value={selectedOwnerId}
                onValueChange={setSelectedOwnerId}
                disabled={isTransferring}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new owner" />
                </SelectTrigger>
                <SelectContent>
                  {availableOwners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        <span>{owner.name} ({owner.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Warning Message */}
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This action will transfer ownership of the property and all 
                associated documents to the selected owner. This action cannot be undone.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isTransferring}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedOwnerId || isTransferring}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isTransferring ? 'Transferring...' : 'Transfer Ownership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferOwnershipDialog;