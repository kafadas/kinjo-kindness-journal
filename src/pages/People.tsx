import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, Search, Plus, ArrowRight, MessageSquare, Group } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDiscreetMode } from '@/contexts/DiscreetModeContext';
import { DiscreetText } from '@/components/ui/DiscreetText';
import { usePeople } from '@/hooks/usePeople';
import { AddPersonModal } from '@/components/modals/AddPersonModal';
import { CaptureModal } from '@/components/modals/CaptureModal';
import { AddToGroupModal } from '@/components/modals/AddToGroupModal';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingGrid } from '@/components/ui/loading-card';
import { formatDistanceToNow } from 'date-fns';

export const People: React.FC = () => {
  const navigate = useNavigate();
  const { isDiscreetMode } = useDiscreetMode();
  const [searchTerm, setSearchTerm] = useState('');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [addToGroupOpen, setAddToGroupOpen] = useState(false);
  
  const { people, isLoading, searchPeople } = usePeople();

  const filteredPeople = searchPeople(searchTerm).filter(person => !person.merged_into);

  const handlePersonClick = (personId: string) => {
    navigate(`/people/${personId}`);
  };

  const handleLogMoment = (e: React.MouseEvent, person: any) => {
    e.stopPropagation();
    setSelectedPerson(person);
    setCaptureOpen(true);
  };

  const handleAddToGroup = (e: React.MouseEvent, person: any) => {
    e.stopPropagation();
    setSelectedPerson(person);
    setAddToGroupOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderAvatar = (person: any) => {
    if (person.avatar_type === 'emoji' && person.avatar_value) {
      return <div className="text-lg">{person.avatar_value}</div>;
    }
    return (
      <AvatarFallback className="bg-primary/10 text-primary font-medium">
        {getInitials(person.display_name)}
      </AvatarFallback>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-semibold">People</h1>
          <AddPersonModal />
        </div>
        <LoadingGrid count={6} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">
          People
        </h1>
        <AddPersonModal />
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* People Grid */}
      {filteredPeople.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.map((person) => (
            <Card 
              key={person.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/30"
              onClick={() => handlePersonClick(person.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {renderAvatar(person)}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      <DiscreetText text={person.display_name} variant="name" />
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {person.aliases && person.aliases.length > 0 
                        ? `Also: ${person.aliases.slice(0, 2).join(', ')}`
                        : 'No aliases'
                      }
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last recorded:</span>
                    <span className="text-xs">
                      {person.last_recorded_moment_at 
                        ? formatDistanceToNow(new Date(person.last_recorded_moment_at), { addSuffix: true })
                        : 'Never'
                      }
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 flex items-center gap-2"
                      onClick={(e) => handleLogMoment(e, person)}
                    >
                      <MessageSquare className="h-3 w-3" />
                      Log Moment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 flex items-center gap-2"
                      onClick={(e) => handleAddToGroup(e, person)}
                    >
                      <Group className="h-3 w-3" />
                      Add to Group
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="No people found"
          description={searchTerm 
            ? `No people match "${searchTerm}". Try a different search or add a new person.`
            : "Start tracking the wonderful people in your kindness journey."
          }
          action={{
            label: searchTerm ? "Clear search" : "Add Your First Person",
            onClick: () => searchTerm ? setSearchTerm('') : null
          }}
        >
          {!searchTerm && <AddPersonModal />}
        </EmptyState>
      )}

      {/* Modals */}
      <CaptureModal
        isOpen={captureOpen}
        onClose={() => {
          setCaptureOpen(false);
          setSelectedPerson(null);
        }}
        seedPerson={selectedPerson?.display_name}
      />

      {selectedPerson && (
        <AddToGroupModal
          isOpen={addToGroupOpen}
          onClose={() => {
            setAddToGroupOpen(false);
            setSelectedPerson(null);
          }}
          personId={selectedPerson.id}
          personName={selectedPerson.display_name}
        />
      )}
    </div>
  );
};