import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useGroups } from '@/hooks/useGroups'

interface CreateGroupModalProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

interface GroupFormData {
  name: string
  emoji: string
}

export const CreateGroupModal = ({ trigger, onSuccess }: CreateGroupModalProps) => {
  const [open, setOpen] = React.useState(false)
  const { createGroup, isCreating } = useGroups()
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<GroupFormData>()

  const onSubmit = (data: GroupFormData) => {
    createGroup({
      name: data.name,
      emoji: data.emoji || '👥'
    }, {
      onSuccess: () => {
        setOpen(false)
        reset()
        onSuccess?.()
      }
    })
  }

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Create Group
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              placeholder="e.g., Family, Work Team, Book Club"
              {...register('name', { required: 'Group name is required' })}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="emoji">Emoji (optional)</Label>
            <Input
              id="emoji"
              placeholder="👥"
              maxLength={2}
              {...register('emoji')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Choose an emoji to represent this group
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}