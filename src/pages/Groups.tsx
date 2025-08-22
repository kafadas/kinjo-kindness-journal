import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Users, Plus, Search, MoreVertical, UserMinus, 
  UserPlus, Edit, Trash2, Settings
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGroups } from '@/hooks/useGroups'
import { usePeople } from '@/hooks/usePeople'
import { useDiscreetMode } from '@/contexts/DiscreetModeContext'
import { maskName } from '@/lib/discreetMode'
import { CreateGroupModal } from '@/components/modals/CreateGroupModal'
import { DeleteConfirmDialog } from '@/components/modals/DeleteConfirmDialog'
import { LoadingGrid } from '@/components/ui/loading-card'
import { EmptyState } from '@/components/ui/empty-state'

export const Groups: React.FC = () => {
  const { 
    groups, 
    isLoading: groupsLoading, 
    deleteGroup, 
    isDeleting,
    addPersonToGroup,
    removePersonFromGroup 
  } = useGroups()
  const { people } = usePeople()
  const { isDiscreetMode } = useDiscreetMode()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null)
  const [selectedGroupForPerson, setSelectedGroupForPerson] = useState<string>('')

  const handleDeleteGroup = (groupId: string) => {
    setGroupToDelete(groupId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (groupToDelete) {
      deleteGroup(groupToDelete, {
        onSuccess: () => {
          setDeleteDialogOpen(false)
          setGroupToDelete(null)
        }
      })
    }
  }

  const handleAddPersonToGroup = (groupId: string, personId: string) => {
    addPersonToGroup({ groupId, personId })
  }

  const handleRemovePersonFromGroup = (groupId: string, personId: string) => {
    removePersonFromGroup({ groupId, personId })
  }

  // Filter groups based on search
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get people not in any group for adding
  const peopleInGroups = new Set(
    groups.flatMap(group => group.people?.map(p => p.id) || [])
  )
  const availablePeople = people.filter(person => !peopleInGroups.has(person.id))

  if (groupsLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <LoadingGrid count={6} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold mb-2">
            Groups Manager
          </h1>
          <p className="text-muted-foreground">
            Organize people into meaningful groups
          </p>
        </div>
        <CreateGroupModal />
      </div>

      {/* Search */}
      {groups.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Overview Stats */}
      {groups.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {groups.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Groups</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {groups.reduce((sum, group) => sum + (group.people?.length || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">People Organized</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {availablePeople.length}
              </div>
              <div className="text-sm text-muted-foreground">Unassigned People</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Groups Grid */}
      {filteredGroups.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <Card key={group.id} className="group hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                      {group.emoji || '👥'}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {maskName(group.name, isDiscreetMode)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {group.people?.length || 0} people
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Group
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Group
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Group Members */}
                  {group.people && group.people.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Members</div>
                      {group.people.slice(0, 3).map((person) => (
                        <div key={person.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <span className="text-sm font-medium">
                            {maskName(person.display_name, isDiscreetMode)}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemovePersonFromGroup(group.id, person.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {group.people.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{group.people.length - 3} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No members yet</p>
                    </div>
                  )}

                  {/* Add People */}
                  {availablePeople.length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="flex gap-2">
                        <Select
                          value={selectedGroupForPerson}
                          onValueChange={(personId) => {
                            if (personId) {
                              handleAddPersonToGroup(group.id, personId)
                              setSelectedGroupForPerson('')
                            }
                          }}
                        >
                          <SelectTrigger className="flex-1 h-8 text-xs">
                            <SelectValue placeholder="Add person..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePeople.map((person) => (
                              <SelectItem key={person.id} value={person.id}>
                                {maskName(person.display_name, isDiscreetMode)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : searchQuery ? (
        <EmptyState
          icon={Search}
          title="No groups found"
          description={`No groups match "${searchQuery}". Try a different search term.`}
        />
      ) : (
        <EmptyState
          icon={Users}
          title="No groups yet"
          description="Create groups to organize your people and track kindness within different circles of your life."
          action={{
            label: "Create Your First Group",
            onClick: () => {}
          }}
        >
          <CreateGroupModal 
            trigger={
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Group
              </Button>
            }
          />
        </EmptyState>
      )}

      {/* Unassigned People */}
      {availablePeople.length > 0 && groups.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Unassigned People
              <Badge variant="outline">{availablePeople.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availablePeople.map((person) => (
                <div key={person.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">
                    {maskName(person.display_name, isDiscreetMode)}
                  </span>
                  <Select
                    onValueChange={(groupId) => {
                      if (groupId) {
                        handleAddPersonToGroup(groupId, person.id)
                      }
                    }}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue placeholder="Add to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.emoji} {maskName(group.name, isDiscreetMode)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Group"
        description="Are you sure you want to delete this group? People will be unassigned but not deleted. This action cannot be undone."
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}