import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, User, FolderOpen } from 'lucide-react'
import { usePeople } from '@/hooks/usePeople'
import { useCategories } from '@/hooks/useCategories'
import type { MomentWithRelations } from '@/lib/db/types'

interface BulkActionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedMoments: MomentWithRelations[]
  onBulkUpdate: (updates: any) => void
  isUpdating: boolean
}

export const BulkActionModal = ({ isOpen, onClose, selectedMoments, onBulkUpdate, isUpdating }: BulkActionModalProps) => {
  const [actionType, setActionType] = useState<'category' | 'person' | ''>('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedPersonId, setSelectedPersonId] = useState('')

  const { people } = usePeople()
  const { categories } = useCategories()

  const handleSubmit = () => {
    if (!actionType) return

    const updates: any = {}
    
    if (actionType === 'category' && selectedCategoryId) {
      updates.category_id = selectedCategoryId
    } else if (actionType === 'person' && selectedPersonId) {
      updates.person_id = selectedPersonId
    }

    if (Object.keys(updates).length > 0) {
      onBulkUpdate(updates)
      handleClose()
    }
  }

  const handleClose = () => {
    setActionType('')
    setSelectedCategoryId('')
    setSelectedPersonId('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Actions</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will update <strong>{selectedMoments.length} moments</strong>. 
              This action cannot be undone.
            </AlertDescription>
          </Alert>

          <div>
            <Label>Action Type</Label>
            <Select value={actionType} onValueChange={(value: any) => setActionType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Reassign Category
                  </div>
                </SelectItem>
                <SelectItem value="person">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Reassign Person
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {actionType === 'category' && (
            <div>
              <Label>New Category</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {actionType === 'person' && (
            <div>
              <Label>New Person</Label>
              <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {people.filter(p => !p.merged_into).map(person => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1"
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={
                isUpdating || 
                !actionType || 
                (actionType === 'category' && !selectedCategoryId) ||
                (actionType === 'person' && !selectedPersonId)
              }
              className="flex-1"
            >
              {isUpdating ? 'Updating...' : `Update ${selectedMoments.length} Moments`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}