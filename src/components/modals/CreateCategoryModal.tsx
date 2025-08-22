import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useCategories } from '@/hooks/useCategories'
import type { CreateCategory } from '@/lib/db/types'

interface CreateCategoryModalProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export const CreateCategoryModal = ({ trigger, onSuccess }: CreateCategoryModalProps) => {
  const [open, setOpen] = React.useState(false)
  const { createCategory, isCreating } = useCategories()
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    name: string
    slug: string
  }>()

  const onSubmit = (data: { name: string; slug: string }) => {
    createCategory({
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
    } as CreateCategory)
    
    setOpen(false)
    reset()
    onSuccess?.()
  }

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add Category
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              placeholder="e.g., Family, Work, Community"
              {...register('name', { required: 'Category name is required' })}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="slug">URL Slug (optional)</Label>
            <Input
              id="slug"
              placeholder="e.g., family, work, community"
              {...register('slug')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank to auto-generate from name
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}