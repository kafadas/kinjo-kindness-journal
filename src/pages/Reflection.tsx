import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Lightbulb, Heart, Calendar, Star } from 'lucide-react';

export const Reflection: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold mb-2">
          Weekly Reflection
        </h1>
        <p className="text-muted-foreground">
          Take time to reflect on your kindness journey
        </p>
      </div>

      {/* Current Week Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            This Week's Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">12</div>
              <div className="text-sm text-muted-foreground">Acts of Kindness</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">8</div>
              <div className="text-sm text-muted-foreground">People Touched</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">5</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">7</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">Family</Badge>
            <Badge variant="outline">Work</Badge>
            <Badge variant="outline">Community</Badge>
            <Badge variant="outline">Friends</Badge>
            <Badge variant="outline">Self-care</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Reflection Prompts */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Moments That Mattered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">
                  What was your most meaningful act of kindness this week?
                </p>
                <Textarea
                  placeholder="Reflect on the moment that brought you the most joy or fulfillment..."
                  className="min-h-24 resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Insights & Learnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">
                  What did you learn about yourself or others?
                </p>
                <Textarea
                  placeholder="Any patterns, surprises, or insights from your week..."
                  className="min-h-24 resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gratitude & Intentions */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Gratitude
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">
                  What kindness are you most grateful for this week?
                </p>
                <Textarea
                  placeholder="Acknowledge the kindness you received..."
                  className="min-h-24 resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Gentle Intentions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">
                  How would you like to spread kindness next week?
                </p>
                <Textarea
                  placeholder="Set gentle intentions for the week ahead..."
                  className="min-h-24 resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Past Reflections */}
      <Card>
        <CardHeader>
          <CardTitle>Previous Reflections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-2 border-primary/20 pl-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">March 18-24</Badge>
                <span className="text-xs text-muted-foreground">2 weeks ago</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                <strong>Key insight:</strong> Small gestures have the biggest impact on my day.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Intention set:</strong> Practice more active listening with family.
              </p>
            </div>
            
            <div className="border-l-2 border-primary/20 pl-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">March 11-17</Badge>
                <span className="text-xs text-muted-foreground">3 weeks ago</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                <strong>Key insight:</strong> Kindness to myself makes it easier to be kind to others.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Intention set:</strong> Include one act of self-kindness daily.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <Button variant="outline">
          Save Draft
        </Button>
        <Button>
          Complete Reflection
        </Button>
      </div>
    </div>
  );
};