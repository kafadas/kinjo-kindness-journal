import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Plus, Group } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { DiscreetText } from '@/components/ui/DiscreetText';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AddToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  personId: string;
  personName: string;
}

export const AddToGroupModal: React.FC<AddToGroupModalProps> = ({
  isOpen,
  onClose,
  personId,
  personName
}) => {
  const { 
    groups, 
    createGroupAsync, 
    addPersonToGroupAsync, 
    removePersonFromGroupAsync 
  } = useGroups();
  const { toast } = useToast();
  
  const [existingGroupIds, setExistingGroupIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupEmoji, setNewGroupEmoji] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch existing group memberships when modal opens
  useEffect(() => {
    if (isOpen && personId) {
      fetchExistingGroups();
    }
  }, [isOpen, personId]);

  const fetchExistingGroups = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('person_groups')
        .select('group_id')
        .eq('person_id', personId);

      if (error) throw error;
      
      const groupIds = data.map(pg => pg.group_id);
      setExistingGroupIds(groupIds);
      setSelectedGroupIds(groupIds);
    } catch (error) {
      console.error('Error fetching existing groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupToggle = (groupId: string, checked: boolean) => {
    setSelectedGroupIds(prev => 
      checked 
        ? [...prev, groupId]
        : prev.filter(id => id !== groupId)
    );
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    try {
      const newGroup = await createGroupAsync({
        name: newGroupName.trim(),
        emoji: newGroupEmoji.trim() || undefined
      });
      
      setSelectedGroupIds(prev => [...prev, newGroup.id]);
      setNewGroupName('');
      setNewGroupEmoji('');
      setIsCreatingGroup(false);
      
      toast({
        title: 'Group created',
        description: `"${newGroupName}" has been created and added to your selection.`
      });
    } catch (error) {
      toast({
        title: 'Error creating group',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Determine groups to add/remove
      const groupsToAdd = selectedGroupIds.filter(id => !existingGroupIds.includes(id));
      const groupsToRemove = existingGroupIds.filter(id => !selectedGroupIds.includes(id));
      
      // Execute changes with promises for proper error handling
      const promises = [];
      
      for (const groupId of groupsToAdd) {
        promises.push(addPersonToGroupAsync({ groupId, personId }));
      }
      for (const groupId of groupsToRemove) {
        promises.push(removePersonFromGroupAsync({ groupId, personId }));
      }
      
      await Promise.all(promises);
      
      toast({
        title: 'Groups updated',
        description: `${personName}'s group memberships have been updated.`
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Error updating groups',
        description: 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedGroupIds(existingGroupIds);
    setIsCreatingGroup(false);
    setNewGroupName('');
    setNewGroupEmoji('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Group className="h-5 w-5 text-primary" />
            Add to Groups
          </DialogTitle>
          <DialogDescription>
            <DiscreetText text={`Manage group memberships for ${personName}`} variant="body" />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading current group memberships...
            </div>
          ) : (
            <>
              {/* Existing Groups */}
              {groups && groups.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Groups</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {groups.map((group) => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`group-${group.id}`}
                          checked={selectedGroupIds.includes(group.id)}
                          onCheckedChange={(checked) => 
                            handleGroupToggle(group.id, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`group-${group.id}`} 
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          {group.emoji && <span>{group.emoji}</span>}
                          <DiscreetText text={group.name} variant="name" />
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Create New Group */}
              {!isCreatingGroup ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  onClick={() => setIsCreatingGroup(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Group
                </Button>
              ) : (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Create New Group</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <Input
                      placeholder="😊"
                      value={newGroupEmoji}
                      onChange={(e) => setNewGroupEmoji(e.target.value.slice(0, 2))}
                      className="col-span-1 text-center"
                    />
                    <Input
                      placeholder="Group name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsCreatingGroup(false);
                        setNewGroupName('');
                        setNewGroupEmoji('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleCreateGroup}
                      disabled={!newGroupName.trim()}
                    >
                      Create & Add
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Groups'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
