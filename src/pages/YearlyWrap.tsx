import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Heart, Users, TrendingUp, Award, Share2 } from 'lucide-react';

export const YearlyWrap: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-semibold mb-2">
          Your 2024 Kindness Journey
        </h1>
        <p className="text-muted-foreground">
          A beautiful year of spreading joy and compassion
        </p>
      </div>

      {/* Year Overview */}
      <Card className="mb-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="p-8">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">487</div>
              <div className="text-sm text-muted-foreground">Acts of Kindness</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">89</div>
              <div className="text-sm text-muted-foreground">People Touched</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">12</div>
              <div className="text-sm text-muted-foreground">Categories Explored</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">52</div>
              <div className="text-sm text-muted-foreground">Weeks Active</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Your Kindness Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Family', count: 125, percentage: 26 },
                { name: 'Community', count: 98, percentage: 20 },
                { name: 'Work', count: 87, percentage: 18 },
                { name: 'Friends', count: 76, percentage: 16 },
                { name: 'Strangers', count: 54, percentage: 11 },
              ].map((category, index) => (
                <div key={category.name} className="flex items-center gap-3">
                  <div className="w-8 text-center font-medium text-primary">#{index + 1}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-sm text-muted-foreground">{category.count} acts</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Journey */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Monthly Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
              ].map((month, index) => {
                const values = [32, 28, 45, 41, 38, 52, 49, 43, 39, 47, 35, 38];
                const value = values[index];
                const maxValue = Math.max(...values);
                const percentage = (value / maxValue) * 100;
                
                return (
                  <div key={month} className="flex items-center gap-3">
                    <div className="w-8 text-sm font-medium">{month}</div>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-8 text-sm text-muted-foreground">{value}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Special Moments */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Year's Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-lg font-semibold mb-1">Best Month</div>
              <div className="text-2xl font-bold text-primary mb-1">June</div>
              <div className="text-sm text-muted-foreground">52 acts of kindness</div>
            </div>
            <div className="text-center p-4 bg-success-soft rounded-lg">
              <div className="text-lg font-semibold mb-1">Longest Streak</div>
              <div className="text-2xl font-bold text-success mb-1">23 days</div>
              <div className="text-sm text-muted-foreground">September</div>
            </div>
            <div className="text-center p-4 bg-warning-soft rounded-lg">
              <div className="text-lg font-semibold mb-1">Most Active Day</div>
              <div className="text-2xl font-bold text-warning mb-1">Tuesday</div>
              <div className="text-sm text-muted-foreground">67 total acts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top People */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Most Connected People
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: 'Mom', interactions: 45, relationship: 'Family' },
              { name: 'Sarah (Neighbor)', interactions: 32, relationship: 'Community' },
              { name: 'Alex (Colleague)', interactions: 28, relationship: 'Work' },
              { name: 'Jamie', interactions: 24, relationship: 'Friend' },
              { name: 'Dad', interactions: 21, relationship: 'Family' },
              { name: 'Local Coffee Shop Staff', interactions: 18, relationship: 'Community' },
            ].map((person, index) => (
              <div key={person.name} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{person.name}</div>
                  <div className="text-sm text-muted-foreground">{person.interactions} interactions</div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {person.relationship}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personal Growth */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Your Growth Story
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-center">
            <p className="text-lg text-muted-foreground">
              This year, you've grown into a true beacon of kindness in your community.
            </p>
            <div className="flex justify-center gap-6 flex-wrap">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">+67%</div>
                <div className="text-sm text-muted-foreground">More giving than receiving</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">+156%</div>
                <div className="text-sm text-muted-foreground">Growth from last year</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">92%</div>
                <div className="text-sm text-muted-foreground">Of days with kindness</div>
              </div>
            </div>
            <p className="text-muted-foreground">
              You've touched 89 lives with your kindness this year. That's nearly 2 people every week! 
              Your consistency and genuine care have made a real difference in the world.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button variant="outline" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share Your Journey
        </Button>
        <Button>
          Start 2025 Strong
        </Button>
      </div>
    </div>
  );
};