import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Edit, MoreHorizontal } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDiscreetMode } from '@/contexts/DiscreetModeContext';

export const PersonDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isDiscreetMode } = useDiscreetMode();

  // Mock person data
  const person = {
    id: Number(id),
    name: "Sarah Johnson",
    initials: "SJ",
    relationship: "Neighbor",
    entriesCount: 12,
    givenCount: 8,
    receivedCount: 4,
    firstInteraction: "3 months ago",
    lastInteraction: "2 hours ago",
    categories: ["Community", "Friendship", "Support"],
    recentEntries: [
      {
        id: 1,
        description: "Helped carry heavy groceries to her apartment",
        type: "given",
        date: "2 hours ago",
        category: "Community"
      },
      {
        id: 2,
        description: "Brought homemade cookies to share",
        type: "received",
        date: "1 week ago",
        category: "Friendship"
      },
      {
        id: 3,
        description: "Listened to her concerns about her elderly mother",
        type: "given",
        date: "2 weeks ago",
        category: "Support"
      },
    ]
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/people')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-display text-2xl font-semibold">
          Person Details
        </h1>
      </div>

      {/* Person Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                {person.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className={`font-display text-xl font-semibold mb-1 ${isDiscreetMode ? 'discreet-blur' : ''}`}>
                {person.name}
              </h2>
              <p className="text-muted-foreground mb-2">{person.relationship}</p>
              <div className="flex flex-wrap gap-1">
                {person.categories.map((category) => (
                  <Badge key={category} variant="outline" className="text-xs">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {person.entriesCount}
            </div>
            <div className="text-sm text-muted-foreground">Total Entries</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {person.givenCount}
            </div>
            <div className="text-sm text-muted-foreground">Kindness Given</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {person.receivedCount}
            </div>
            <div className="text-sm text-muted-foreground">Kindness Received</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Last Interaction
            </div>
            <div className="text-sm font-medium">{person.lastInteraction}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Recent Interactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {person.recentEntries.map((entry) => (
            <div key={entry.id} className="border-l-2 border-primary/20 pl-4 py-2">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={entry.type === 'given' ? 'default' : 'secondary'} className="text-xs">
                  {entry.type === 'given' ? 'Given' : 'Received'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {entry.category}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {entry.date}
                </span>
              </div>
              <p className={`text-sm ${isDiscreetMode ? 'discreet-blur' : ''}`}>
                {entry.description}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};