import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Target, Calendar, Award, Star, Users } from 'lucide-react';

export const Streaks: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold mb-2">
          Streaks & Milestones
        </h1>
        <p className="text-muted-foreground">
          Celebrate your consistency in spreading kindness
        </p>
      </div>

      {/* Current Streaks */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            Current Streaks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">7</div>
              <div className="text-sm font-medium mb-1">Day Streak</div>
              <div className="text-xs text-muted-foreground">Keep it going!</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">3</div>
              <div className="text-sm font-medium mb-1">Week Streak</div>
              <div className="text-xs text-muted-foreground">Consistent kindness</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-muted/30">
              <div className="text-3xl font-bold text-muted-foreground mb-2">-</div>
              <div className="text-sm font-medium mb-1">Month Streak</div>
              <div className="text-xs text-muted-foreground">Not yet achieved</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Recent Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">100 Acts of Kindness</div>
                <div className="text-sm text-muted-foreground">Achieved 2 days ago</div>
              </div>
              <Badge>Achieved</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-success-soft rounded-lg">
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <div className="font-medium">20 People Touched</div>
                <div className="text-sm text-muted-foreground">Achieved 1 week ago</div>
              </div>
              <Badge variant="secondary">Achieved</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-medium">30 Day Streak</div>
                <div className="text-sm text-muted-foreground">23 days to go</div>
              </div>
              <Badge variant="outline">In Progress</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Progress Towards Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Progress Towards Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Monthly Goal (25 acts)</span>
                <span className="text-sm text-muted-foreground">18/25</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '72%' }}></div>
              </div>
              <div className="text-xs text-muted-foreground">7 more to reach your goal</div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">New People (5 this month)</span>
                <span className="text-sm text-muted-foreground">3/5</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
              <div className="text-xs text-muted-foreground">2 more people to connect with</div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Categories Used (6 total)</span>
                <span className="text-sm text-muted-foreground">5/6</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '83%' }}></div>
              </div>
              <div className="text-xs text-muted-foreground">Try kindness in one more area</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Achievements */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: '🎯', title: 'First Entry', achieved: true },
              { icon: '🔥', title: '7 Day Streak', achieved: true },
              { icon: '❤️', title: '50 Acts', achieved: true },
              { icon: '👥', title: '10 People', achieved: true },
              { icon: '⭐', title: '100 Acts', achieved: true },
              { icon: '🏆', title: '20 People', achieved: true },
              { icon: '📅', title: '30 Day Streak', achieved: false },
              { icon: '💫', title: '200 Acts', achieved: false },
              { icon: '🌟', title: '6 Months', achieved: false },
              { icon: '👑', title: 'Year of Kindness', achieved: false },
            ].map((achievement, index) => (
              <div 
                key={index}
                className={`text-center p-3 border rounded-lg ${
                  achievement.achieved 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'bg-muted/30 border-muted'
                }`}
              >
                <div className="text-2xl mb-1">{achievement.icon}</div>
                <div className={`text-xs font-medium ${
                  achievement.achieved ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {achievement.title}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};