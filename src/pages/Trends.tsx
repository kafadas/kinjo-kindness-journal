import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Heart, Users, BarChart3 } from 'lucide-react';

export const Trends: React.FC = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold mb-2">
          Insights & Trends
        </h1>
        <p className="text-muted-foreground">
          Discover gentle patterns in your kindness journey
        </p>
      </div>

      {/* Key Insights */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="text-lg font-semibold mb-1">15%</div>
            <div className="text-sm text-muted-foreground">Weekly Growth</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="text-lg font-semibold mb-1">Tuesday</div>
            <div className="text-sm text-muted-foreground">Most Active Day</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div className="text-lg font-semibold mb-1">3.2</div>
            <div className="text-sm text-muted-foreground">Daily Average</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="text-lg font-semibold mb-1">67%</div>
            <div className="text-sm text-muted-foreground">Given vs Received</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Pattern */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Weekly Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                const values = [2, 5, 3, 4, 2, 6, 1];
                const value = values[index];
                const maxValue = Math.max(...values);
                const percentage = (value / maxValue) * 100;
                
                return (
                  <div key={day} className="flex items-center gap-3">
                    <div className="w-20 text-sm font-medium">{day}</div>
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

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Family', count: 25, color: 'bg-red-500' },
                { name: 'Work', count: 18, color: 'bg-blue-500' },
                { name: 'Community', count: 15, color: 'bg-green-500' },
                { name: 'Friends', count: 22, color: 'bg-purple-500' },
                { name: 'Self-care', count: 8, color: 'bg-yellow-500' },
              ].map((category) => {
                const total = 88;
                const percentage = (category.count / total) * 100;
                
                return (
                  <div key={category.name} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                    <div className="flex-1 text-sm font-medium">{category.name}</div>
                    <div className="text-sm text-muted-foreground">{category.count}</div>
                    <Badge variant="outline" className="text-xs">
                      {percentage.toFixed(0)}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">87</div>
                  <div className="text-sm text-muted-foreground">This Month</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-muted-foreground mb-1">72</div>
                  <div className="text-sm text-muted-foreground">Last Month</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success mb-1">+21%</div>
                  <div className="text-sm text-muted-foreground">Growth</div>
                </div>
              </div>
              <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                You're on track for your most kind month yet! 🌟
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Giving vs Receiving */}
        <Card>
          <CardHeader>
            <CardTitle>Kindness Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kindness Given</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">58</span>
                  <Badge>67%</Badge>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full w-2/3"></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kindness Received</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">29</span>
                  <Badge variant="secondary">33%</Badge>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-secondary h-2 rounded-full w-1/3"></div>
              </div>

              <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                You're a natural giver! Remember to be open to receiving kindness too.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};