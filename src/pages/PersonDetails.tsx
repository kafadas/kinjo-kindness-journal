import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Edit, MoreHorizontal, MessageSquare, Merge, Group } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDiscreetMode } from '@/contexts/DiscreetModeContext';
import { DiscreetText } from '@/components/ui/DiscreetText';
import { usePersonDetails } from '@/hooks/usePeople';
import { MergePeopleModal } from '@/components/modals/MergePeopleModal';
import { AddToGroupModal } from '@/components/modals/AddToGroupModal';
import { CaptureModal } from '@/components/modals/CaptureModal';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingGrid } from '@/components/ui/loading-card';
import { formatDistanceToNow } from 'date-fns';

export const PersonDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isDiscreetMode } = useDiscreetMode();
  const [captureOpen, setCaptureOpen] = useState(false);
  const [addToGroupOpen, setAddToGroupOpen] = useState(false);

  const { person, moments, stats, isLoading } = usePersonDetails(id!);

  if (isLoading || !person) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/people')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-display text-2xl font-semibold">Loading...</h1>
        </div>
        <LoadingGrid count={4} />
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/people')} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-display text-2xl font-semibold">Person Details</h1>
      </div>

      {/* Person Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {person.avatar_type === 'emoji' && person.avatar_value ? (
                <div className="text-2xl">{person.avatar_value}</div>
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                  {getInitials(person.display_name)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold mb-1">
                <DiscreetText text={person.display_name} variant="name" />
              </h2>
              <p className="text-muted-foreground mb-2">
                {person.aliases && person.aliases.length > 0 
                  ? `Also known as: ${person.aliases.join(', ')}`
                  : 'No aliases'
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCaptureOpen(true)}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Log Moment
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAddToGroupOpen(true)}
              >
                <Group className="h-4 w-4 mr-1" />
                Add to Group
              </Button>
              <MergePeopleModal person={person}>
                <Button variant="outline" size="sm">
                  <Merge className="h-4 w-4" />
                </Button>
              </MergePeopleModal>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {stats?.total || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Moments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {stats?.given || 0}
            </div>
            <div className="text-sm text-muted-foreground">Kindness Given</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {stats?.received || 0}
            </div>
            <div className="text-sm text-muted-foreground">Kindness Received</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Last Moment
            </div>
            <div className="text-sm font-medium">
              {person.last_recorded_moment_at 
                ? formatDistanceToNow(new Date(person.last_recorded_moment_at), { addSuffix: true })
                : 'Never'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Recent Moments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {moments && moments.length > 0 ? (
            <div className="space-y-4">
              {moments.slice(0, 10).map((moment: any) => (
                <div key={moment.id} className="border-l-2 border-primary/20 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={moment.action === 'given' ? 'default' : 'secondary'} className="text-xs">
                      {moment.action === 'given' ? 'Given' : 'Received'}
                    </Badge>
                    {moment.category && (
                      <Badge variant="outline" className="text-xs">
                        {moment.category.name}
                      </Badge>
                    )}
                    {moment.significance && (
                      <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                        ⭐ Significant
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(moment.happened_at), { addSuffix: true })}
                    </span>
                  </div>
                  {moment.description && (
                    <DiscreetText text={moment.description} variant="body" className="text-sm" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Heart}
              title="No moments yet"
              description="Start logging your interactions with this person to build a beautiful record of your connection."
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CaptureModal
        isOpen={captureOpen}
        onClose={() => setCaptureOpen(false)}
        seedPersonId={person?.id}
        seedCategoryId={person?.default_category_id}
      />

      <AddToGroupModal
        isOpen={addToGroupOpen}
        onClose={() => setAddToGroupOpen(false)}
        personId={person.id}
        personName={person.display_name}
      />
    </div>
  );
};