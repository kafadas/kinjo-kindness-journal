import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, Search, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDiscreetMode } from '@/contexts/DiscreetModeContext';

const mockPeople = [
  {
    id: 1,
    name: "Sarah Johnson",
    initials: "SJ",
    relationship: "Neighbor",
    entriesCount: 12,
    lastInteraction: "2 hours ago",
    categories: ["Community", "Friendship"],
  },
  {
    id: 2,
    name: "Alex Chen",
    initials: "AC",
    relationship: "Colleague",
    entriesCount: 8,
    lastInteraction: "1 day ago",
    categories: ["Work", "Support"],
  },
  {
    id: 3,
    name: "Mom",
    initials: "M",
    relationship: "Family",
    entriesCount: 25,
    lastInteraction: "3 days ago",
    categories: ["Family", "Care"],
  },
  {
    id: 4,
    name: "Jamie Rivera",
    initials: "JR",
    relationship: "Friend",
    entriesCount: 15,
    lastInteraction: "1 week ago",
    categories: ["Friends", "Support"],
  },
];

export const People: React.FC = () => {
  const navigate = useNavigate();
  const { isDiscreetMode } = useDiscreetMode();

  const handlePersonClick = (personId: number) => {
    navigate(`/people/${personId}`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">
          People
        </h1>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Person
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* People Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockPeople.map((person) => (
          <Card 
            key={person.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/30"
            onClick={() => handlePersonClick(person.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {person.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className={`text-base truncate ${isDiscreetMode ? 'discreet-blur' : ''}`}>
                    {person.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {person.relationship}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Entries:</span>
                  <span className="font-medium">{person.entriesCount}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last interaction:</span>
                  <span className="text-xs">{person.lastInteraction}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {person.categories.map((category) => (
                    <Badge key={category} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockPeople.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No people added yet</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking the wonderful people in your kindness journey.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Person
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};