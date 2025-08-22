import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { usePeople } from '@/hooks/usePeople'
import type { CreatePerson } from '@/lib/db/types'

interface AddPersonModalProps {
  children?: React.ReactNode
  onPersonCreated?: (personId: string) => void
}

export const AddPersonModal = ({ children, onPersonCreated }: AddPersonModalProps) => {
  const [open, setOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [aliases, setAliases] = useState('')
  const [avatarType, setAvatarType] = useState<'initials' | 'emoji' | 'photo'>('initials')
  const [avatarValue, setAvatarValue] = useState('')

  const { createPerson, isCreating } = usePeople()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!displayName.trim()) return

    createPerson(
      {
        display_name: displayName.trim(),
        aliases: aliases ? aliases.split(',').map(a => a.trim()).filter(Boolean) : [],
        avatar_type: avatarType,
        avatar_value: avatarValue || null
      } as CreatePerson,
      {
        onSuccess: (person) => {
          setOpen(false)
          setDisplayName('')
          setAliases('')
          setAvatarValue('')
          setAvatarType('initials')
          onPersonCreated?.(person.id)
        }
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Person
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Person</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter their name"
              required
            />
          </div>

          <div>
            <Label htmlFor="aliases">Aliases (optional)</Label>
            <Input
              id="aliases"
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              placeholder="Mom, Mother, etc. (comma separated)"
            />
          </div>

          <div>
            <Label htmlFor="avatarType">Avatar Type</Label>
            <Select value={avatarType} onValueChange={(value: any) => setAvatarType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select avatar type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="initials">Initials</SelectItem>
                <SelectItem value="emoji">Emoji</SelectItem>
                <SelectItem value="photo">Photo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {avatarType === 'emoji' && (
            <div>
              <Label htmlFor="avatarValue">Emoji</Label>
              <Input
                id="avatarValue"
                value={avatarValue}
                onChange={(e) => setAvatarValue(e.target.value)}
                placeholder="👤"
                maxLength={2}
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !displayName.trim()} className="flex-1">
              {isCreating ? 'Adding...' : 'Add Person'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}