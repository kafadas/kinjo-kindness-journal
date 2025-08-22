import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Merge, AlertTriangle } from 'lucide-react'
import { usePeople } from '@/hooks/usePeople'
import type { Person } from '@/lib/db/types'

interface MergePeopleModalProps {
  person: Person
  children?: React.ReactNode
}

export const MergePeopleModal = ({ person, children }: MergePeopleModalProps) => {
  const [open, setOpen] = useState(false)
  const [targetPersonId, setTargetPersonId] = useState('')

  const { people, mergePerson, isMerging } = usePeople()

  // Filter out the current person and already merged people
  const availablePeople = people.filter(p => 
    p.id !== person.id && !p.merged_into
  )

  const handleMerge = () => {
    if (!targetPersonId) return

    mergePerson(
      { fromPersonId: person.id, toPersonId: targetPersonId },
      {
        onSuccess: () => {
          setOpen(false)
          setTargetPersonId('')
        }
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Merge className="h-4 w-4" />
            Merge People
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Merge People</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will merge <strong>{person.display_name}</strong> into another person. 
              All moments will be transferred and this cannot be undone.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="targetPerson">Merge into</Label>
            <Select value={targetPersonId} onValueChange={setTargetPersonId}>
              <SelectTrigger>
                <SelectValue placeholder="Select person to merge into" />
              </SelectTrigger>
              <SelectContent>
                {availablePeople.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMerge}
              disabled={isMerging || !targetPersonId}
              variant="destructive"
              className="flex-1"
            >
              {isMerging ? 'Merging...' : 'Merge People'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}