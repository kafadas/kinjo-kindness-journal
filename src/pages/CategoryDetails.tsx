import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Edit, MoreHorizontal, Home } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export const CategoryDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock category data
  const category = {
    id: Number(id),
    name: "Family",
    icon: Home,
    color: "text-red-500",
    bgColor: "bg-red-50",
    description: "Moments of kindness with family members",
    entriesCount: 25,
    givenCount: 15,
    receivedCount: 10,
    firstEntry: "3 months ago",
    lastEntry: "3 days ago",
    topPeople: ["Mom", "Dad", "Sister"],
    recentEntries: [
      {
        id: 1,
        description: "Called mom just to check how her day was going",
        person: "Mom",
        type: "given",
        date: "3 days ago",
      },
      {
        id: 2,
        description: "Dad helped me fix my bike without me even asking",
        person: "Dad",
        type: "received",
        date: "1 week ago",
      },
      {
        id: 3,
        description: "Spent time listening to my sister's college worries",
        person: "Sister",
        type: "given",
        date: "2 weeks ago",
      },
    ]
  };

  const IconComponent = category.icon;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/categories')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-display text-2xl font-semibold">
          Category Details
        </h1>
      </div>

      {/* Category Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-lg ${category.bgColor} flex items-center justify-center`}>
              <IconComponent className={`h-8 w-8 ${category.color}`} />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold mb-1">
                {category.name}
              </h2>
              <p className="text-muted-foreground mb-2">{category.description}</p>
              <div className="text-sm text-muted-foreground">
                Active since {category.firstEntry}
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
              {category.entriesCount}
            </div>
            <div className="text-sm text-muted-foreground">Total Entries</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {category.givenCount}
            </div>
            <div className="text-sm text-muted-foreground">Kindness Given</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {category.receivedCount}
            </div>
            <div className="text-sm text-muted-foreground">Kindness Received</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Last Entry
            </div>
            <div className="text-sm font-medium">{category.lastEntry}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top People */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Connected People</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {category.topPeople.map((person, index) => (
                <div key={person} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="font-medium">{person}</span>
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Recent Entries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {category.recentEntries.map((entry) => (
              <div key={entry.id} className="border-l-2 border-primary/20 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={entry.type === 'given' ? 'default' : 'secondary'} className="text-xs">
                    {entry.type === 'given' ? 'Given' : 'Received'}
                  </Badge>
                  <span className="text-xs font-medium">{entry.person}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {entry.date}
                  </span>
                </div>
                <p className="text-sm">
                  {entry.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};