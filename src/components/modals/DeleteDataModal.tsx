import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

interface DeleteDataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deleteType: 'moments' | 'account'
}

export const DeleteDataModal = ({ open, onOpenChange, deleteType }: DeleteDataModalProps) => {
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const { user } = useAuth()

  const expectedText = deleteType === 'moments' ? 'DELETE MOMENTS' : 'DELETE ACCOUNT'
  const isConfirmed = confirmText === expectedText

  const handleDelete = async () => {
    if (!isConfirmed) return

    setIsDeleting(true)
    try {
      if (deleteType === 'moments') {
        const { data, error } = await supabase.functions.invoke('delete-data', {
          body: { deleteType: 'moments' }
        })

        if (error) throw error

        toast.success('All moments deleted successfully')
        onOpenChange(false)
        
        // Refresh the page to reflect changes
        setTimeout(() => {
          window.location.reload()
        }, 1000)

      } else {
        const { data, error } = await supabase.functions.invoke('delete-account')

        if (error) throw error

        toast.success('Account deleted successfully')
        onOpenChange(false)
        
        // Clear session and redirect to landing page
        await supabase.auth.signOut()
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      if (process.env.NODE_ENV === 'development') {
        toast.error(`Delete failed: ${error.message}`)
      } else {
        toast.error('Delete failed. Please try again.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const getTitle = () => {
    return deleteType === 'moments' 
      ? 'Delete All Moments' 
      : 'Delete Account'
  }

  const getDescription = () => {
    return deleteType === 'moments'
      ? 'This will permanently delete all your kindness moments while keeping your account, people, and categories.'
      : 'This will permanently delete your account and all associated data including moments, people, categories, and settings.'
  }

  const getWarningText = () => {
    return deleteType === 'moments'
      ? 'All your recorded moments will be lost forever. People and categories will remain for future use.'
      : 'Your entire account and all data will be permanently deleted. This action cannot be undone.'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-destructive/20 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <strong>Warning:</strong> {getWarningText()}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirm-text" className="text-sm font-medium">
              Type "{expectedText}" to confirm:
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expectedText}
              className="font-mono"
            />
          </div>

          {deleteType === 'account' && (
            <Alert className="border-destructive/20 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                Account deletion will log you out and redirect you to the Kinjo landing page.
                You will lose access to all your Kinjo data immediately.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {isDeleting 
              ? (deleteType === 'moments' ? 'Deleting Moments...' : 'Deleting Account...') 
              : (deleteType === 'moments' ? 'Delete Moments' : 'Delete Account')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}