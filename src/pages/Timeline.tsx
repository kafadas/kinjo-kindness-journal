import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, ArrowUp, ArrowDown, Search, Filter } from 'lucide-react';
import { useDiscreetMode } from '@/contexts/DiscreetModeContext';

const mockEntries = [
  {
    id: 1,
    description: "Helped my neighbor Sarah carry her groceries when I saw her struggling with heavy bags",
    person: "Sarah",
    category: "Community",
    type: "given",
    date: "2 hours ago",
  },
  {
    id: 2,
    description: "My colleague brought me coffee when they noticed I was having a tough morning",
    person: "Alex",
    category: "Work",
    type: "received",
    date: "1 day ago",
  },
  {
    id: 3,
    description: "Listened to my friend talk through their worries about their new job",
    person: "Jamie",
    category: "Friends",
    type: "given",
    date: "2 days ago",
  },
];

export const Timeline: React.FC = () => {
  const { isDiscreetMode } = useDiscreetMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">
          Timeline
        </h1>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {showFilters && (
            <div className="space-y-3 pt-3 border-t">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">All Types</Badge>
                <Badge variant="outline">Given</Badge>
                <Badge variant="outline">Received</Badge>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">All Categories</Badge>
                <Badge variant="outline">Family</Badge>
                <Badge variant="outline">Work</Badge>
                <Badge variant="outline">Community</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline Entries */}
      <div className="space-y-4">
        {mockEntries.map((entry) => (
          <Card key={entry.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Type Indicator */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  entry.type === 'given' ? 'bg-primary/10' : 'bg-success-soft'
                }`}>
                  {entry.type === 'given' ? (
                    <ArrowUp className={`h-5 w-5 ${entry.type === 'given' ? 'text-primary' : 'text-success'}`} />
                  ) : (
                    <ArrowDown className="h-5 w-5 text-success" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant={entry.type === 'given' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {entry.type === 'given' ? 'Given' : 'Received'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {entry.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {entry.date}
                    </span>
                  </div>

                  <p className={`text-foreground mb-2 ${isDiscreetMode ? 'discreet-blur' : ''}`}>
                    {entry.description}
                  </p>

                  {entry.person && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Heart className="h-3 w-3" />
                      <span className={isDiscreetMode ? 'discreet-blur' : ''}>
                        {entry.person}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockEntries.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No entries yet</h3>
            <p className="text-muted-foreground mb-4">
              Start capturing your moments of kindness to see your timeline.
            </p>
            <Button>
              Add Your First Entry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};