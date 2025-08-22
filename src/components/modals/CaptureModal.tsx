import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { useCapture } from '@/hooks/useCapture';

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
  const [text, setText] = useState('');
  const { capture, loading } = useCapture();

  const handleSubmit = async () => {
    if (!text.trim()) return;

    try {
      await capture({
        text: text.trim(),
        seedPerson,
        seedCategory,
      });
      setText('');
      onClose();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleClose = () => {
    setText('');
    onClose();
  };
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
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !text.trim()}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};