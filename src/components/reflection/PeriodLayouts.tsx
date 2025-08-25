import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Activity, 
  Calendar, 
  BookOpen, 
  Lightbulb,
  Target,
  Users,
  TrendingUp,
  Trophy,
  MapPin,
  User,
  Download
} from 'lucide-react';
import { DiscreetText } from '@/components/ui/DiscreetText';
import { format, parseISO } from 'date-fns';

interface ReflectionData {
  summary: string | null;
  suggestions: string | null;
  computed: any;
  model: string;
  period: string;
}

// Mini Kindness Balance Bar Component
const KindnessBalanceBar: React.FC<{ given: number; received: number }> = ({ given, received }) => {
  const total = given + received;
  const givenPercent = total > 0 ? (given / total) * 100 : 50;
  const receivedPercent = total > 0 ? (received / total) * 100 : 50;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Given: {given}</span>
        <span>Received: {received}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        <div 
          className="bg-primary transition-all duration-300" 
          style={{ width: `${givenPercent}%` }}
        />
        <div 
          className="bg-secondary transition-all duration-300" 
          style={{ width: `${receivedPercent}%` }}
        />
      </div>
    </div>
  );
};

// Activity Dots Component
const ActivityDots: React.FC<{ activeDays?: number; totalDays?: number }> = ({ 
  activeDays = 0, 
  totalDays = 7 
}) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <div className="flex items-center justify-between gap-2">
      {days.map((day, index) => {
        const isActive = index < activeDays;
        return (
          <div key={day} className="flex flex-col items-center gap-1">
            <div
              className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                isActive 
                  ? 'bg-primary border-primary' 
                  : 'bg-muted border-muted-foreground/20'
              }`}
              aria-label={`${day}: ${isActive ? 'active' : 'quiet'}`}
            />
            <span className="text-xs text-muted-foreground font-medium">{day}</span>
          </div>
        );
      })}
    </div>
  );
};

// 7d Layout: Weekly check-in
export const WeeklyLayout: React.FC<{ reflection: ReflectionData }> = ({ reflection }) => {
  const { given = 0, received = 0, total = 0 } = reflection.computed || {};
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Weekly Check-in</h2>
        <p className="text-muted-foreground">A gentle look at your week of kindness</p>
      </div>

      {/* Mini Kindness Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-primary" />
            Kindness Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KindnessBalanceBar given={given} received={received} />
        </CardContent>
      </Card>

      {/* Activity dots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            This Week's Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityDots activeDays={reflection.computed?.activeDays} />
        </CardContent>
      </Card>

      {/* Journey & Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Your Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DiscreetText 
              variant="body"
              text={reflection.summary || ''} 
              className="text-muted-foreground leading-relaxed"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-primary" />
              Gentle Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DiscreetText 
              variant="body"
              text={reflection.suggestions || ''} 
              className="text-muted-foreground leading-relaxed"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// 30d Layout: Month in focus
export const MonthlyLayout: React.FC<{ reflection: ReflectionData }> = ({ reflection }) => {
  const { total = 0, top_category = '', activeDays = 0 } = reflection.computed || {};
  const mostActiveDay = 'Wednesday'; // Could be computed from data
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Month in Focus</h2>
        <p className="text-muted-foreground">Patterns and highlights from the past 30 days</p>
      </div>

      {/* 3 Stat Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">{total}</div>
            <div className="text-sm text-muted-foreground">Total Moments</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              <DiscreetText variant="name" text={mostActiveDay} />
            </div>
            <div className="text-sm text-muted-foreground">Most Active Day</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              <DiscreetText variant="name" text={top_category || 'Various'} />
            </div>
            <div className="text-sm text-muted-foreground">Top Category</div>
          </CardContent>
        </Card>
      </div>

      {/* Journey with micro-challenge CTA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            Your Journey
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DiscreetText 
            variant="body"
            text={reflection.summary || ''} 
            className="text-muted-foreground leading-relaxed"
          />
          
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
            <h4 className="font-medium mb-2 text-primary">One small act to try this week:</h4>
            <DiscreetText 
              variant="body"
              text={reflection.suggestions || ''} 
              className="text-muted-foreground text-sm"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// 90d Layout: Quarterly themes
export const QuarterlyLayout: React.FC<{ reflection: ReflectionData }> = ({ reflection }) => {
  // Mock themes - in real implementation these would come from computed data
  const themes = ['Connection', 'Growth', 'Presence'];
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Quarterly Themes</h2>
        <p className="text-muted-foreground">Emerging patterns over the past 90 days</p>
      </div>

      {/* Theme Chips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Emerging Themes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {themes.map((theme, index) => (
              <Badge key={index} variant="secondary" className="text-base px-3 py-1">
                <DiscreetText variant="name" text={theme} />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Consistency paragraph */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Consistency & Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DiscreetText 
            variant="body"
            text={reflection.summary || ''} 
            className="text-muted-foreground leading-relaxed mb-4"
          />
          
          <div className="text-sm text-muted-foreground">
            <DiscreetText 
              variant="body"
              text={reflection.suggestions || ''} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// 365d Layout: Year in kindness
export const YearlyLayout: React.FC<{ reflection: ReflectionData }> = ({ reflection }) => {
  const { total = 0 } = reflection.computed || {};
  
  // Mock data - in real implementation these would come from computed data
  const topConnections = ['Alice', 'Bob', 'Charlie'];
  const mostBalancedMonth = 'June';
  const bestStreak = 15;
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Year in Kindness</h2>
        <p className="text-muted-foreground">A celebration of your journey over the past year</p>
      </div>

      {/* Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Year Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Top 3 people you showed up for:</h4>
              <div className="flex flex-wrap gap-2">
                {topConnections.map((person, index) => (
                  <Badge key={index} variant="outline">
                    <DiscreetText variant="name" text={person} />
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm mb-1">Most balanced month</h4>
                <p className="text-2xl font-bold text-primary">
                  <DiscreetText variant="name" text={mostBalancedMonth} />
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-1">Best streak</h4>
                <p className="text-2xl font-bold text-primary">{bestStreak} days</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journey */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            Your Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DiscreetText 
            variant="body"
            text={reflection.summary || ''} 
            className="text-muted-foreground leading-relaxed"
          />
        </CardContent>
      </Card>

      {/* Download PDF Button */}
      <Card>
        <CardContent className="p-4 text-center">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Yearly Summary
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Get a beautiful PDF summary of your year in kindness
          </p>
        </CardContent>
      </Card>
    </div>
  );
};