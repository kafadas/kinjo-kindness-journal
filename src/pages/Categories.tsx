import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Briefcase, Home, Coffee, Star, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockCategories = [
  {
    id: 1,
    name: "Family",
    icon: Home,
    color: "text-red-500",
    bgColor: "bg-red-50",
    entriesCount: 25,
    givenCount: 15,
    receivedCount: 10,
    lastEntry: "3 days ago",
  },
  {
    id: 2,
    name: "Work",
    icon: Briefcase,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    entriesCount: 18,
    givenCount: 12,
    receivedCount: 6,
    lastEntry: "1 day ago",
  },
  {
    id: 3,
    name: "Community",
    icon: Users,
    color: "text-green-500",
    bgColor: "bg-green-50",
    entriesCount: 15,
    givenCount: 10,
    receivedCount: 5,
    lastEntry: "2 hours ago",
  },
  {
    id: 4,
    name: "Friends",
    icon: Coffee,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    entriesCount: 22,
    givenCount: 13,
    receivedCount: 9,
    lastEntry: "5 days ago",
  },
  {
    id: 5,
    name: "Self-care",
    icon: Star,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
    entriesCount: 8,
    givenCount: 8,
    receivedCount: 0,
    lastEntry: "1 week ago",
  },
];

export const Categories: React.FC = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId: number) => {
    navigate(`/categories/${categoryId}`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">
          Categories
        </h1>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {mockCategories.length}
            </div>
            <div className="text-sm text-muted-foreground">Active Categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {mockCategories.reduce((sum, cat) => sum + cat.entriesCount, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Entries</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {Math.max(...mockCategories.map(cat => cat.entriesCount))}
            </div>
            <div className="text-sm text-muted-foreground">Most Active</div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Card 
              key={category.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/30"
              onClick={() => handleCategoryClick(category.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center`}>
                    <IconComponent className={`h-6 w-6 ${category.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      {category.name}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {category.entriesCount} entries
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {category.givenCount} given
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {category.receivedCount} received
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Last entry: {category.lastEntry}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((category.entriesCount / 30) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {mockCategories.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No categories yet</h3>
            <p className="text-muted-foreground mb-4">
              Create categories to organize your kindness entries.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Category
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};