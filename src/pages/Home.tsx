import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Users, Folder, Clock, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DiscreetText } from '@/components/ui/DiscreetText';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleTileClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-semibold text-foreground mb-2">
          Welcome back
        </h1>
        <p className="text-muted-foreground">
          Your kindness journey continues
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary mb-1">12</div>
            <div className="text-sm text-muted-foreground">This Week</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary mb-1">87</div>
            <div className="text-sm text-muted-foreground">Total Acts</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary mb-1">15</div>
            <div className="text-sm text-muted-foreground">People</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary mb-1">7</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Navigation Tiles */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/30"
          onClick={() => handleTileClick('/timeline')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-3">
              Review your recent acts of kindness and reflect on meaningful moments.
            </p>
            <div className="text-xs text-muted-foreground">
              <DiscreetText text='Latest: "Helped neighbor with groceries"' variant="body" /> • 2 hours ago
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/30"
          onClick={() => handleTileClick('/people')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              People
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-3">
              Explore connections and the people who bring kindness to your life.
            </p>
            <div className="text-xs text-muted-foreground">
              <DiscreetText text="Most connected: Sarah, Mom, Alex" variant="body" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/30"
          onClick={() => handleTileClick('/categories')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Folder className="h-5 w-5 text-primary" />
              </div>
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-3">
              See how kindness flows through different areas of your life.
            </p>
            <div className="text-xs text-muted-foreground">
              Most active: Family, Community, Work
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/30"
          onClick={() => handleTileClick('/trends')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-3">
              Discover gentle patterns and trends in your kindness journey.
            </p>
            <div className="text-xs text-muted-foreground">
              Peak days: Tuesday & Saturday
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/30 md:col-span-2 lg:col-span-2"
          onClick={() => handleTileClick('/reflection')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              Weekly Reflection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-3">
              Take time to reflect on the week's experiences and set gentle intentions.
            </p>
            <div className="text-xs text-muted-foreground">
              This week's theme: Small gestures, big impact
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};