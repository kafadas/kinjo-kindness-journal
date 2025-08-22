import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  seedPerson?: string;
  seedCategory?: string;
}

export const CaptureModal: React.FC<CaptureModalProps> = ({
  isOpen,
  onClose,
  seedPerson,
  seedCategory,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-xl">
              Capture a Moment of Kindness
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Textarea
              placeholder="What kindness did you experience or share today?"
              className="min-h-32 resize-none"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onClose}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};