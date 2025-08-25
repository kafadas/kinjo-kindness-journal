import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  RefreshCw, 
  Calendar, 
  Lightbulb, 
  Activity, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Heart,
  Trophy,
  Star,
  Clock,
  MapPin,
  User,
  Target
} from 'lucide-react';
import { useReflectionPeriod, type ReflectionPeriod } from '@/hooks/useReflectionPeriod';
import { useDiscreetMode } from '@/contexts/DiscreetModeContext';
import { DiscreetText } from '@/components/ui/DiscreetText';
import { LoadingCard } from '@/components/ui/loading-card';
import { EmptyState } from '@/components/ui/empty-state';
import { format, parseISO } from 'date-fns';

// Micro-sparkline component for consistency metrics
const MicroSparkline: React.FC<{ data: number[]; color?: string }> = ({ data, color = 'rgb(79, 70, 229)' }) => {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data, 1);
  const points = data.map((value, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * 60;
    const y = 16 - (value / maxValue) * 12;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width="60" height="16" className="inline-block">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
};

// Activity dots for 7-day view
const ActivityDots: React.FC<{ computed: any }> = ({ computed }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Generate dummy data for now - this would come from computed.daily_activity
  const dailyActivity = Array.from({ length: 7 }, (_, i) => ({
    day: days[i],
    count: Math.floor(Math.random() * 5),
    active: Math.random() > 0.3
  }));
  
  return (
    <div className="flex items-center justify-between gap-2">
      {dailyActivity.map((day, index) => (
        <div key={day.day} className="flex flex-col items-center gap-1">
          <div
            className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
              day.active 
                ? 'bg-primary border-primary' 
                : 'bg-muted border-muted-foreground/20'
            }`}
            aria-label={`${day.day}: ${day.count} moments`}
          />
          <span className="text-xs text-muted-foreground font-medium">{day.day}</span>
          {day.count > 0 && (
            <span className="text-xs text-muted-foreground">{day.count}</span>
          )}
        </div>
      ))}
    </div>
  );
};

// Hero section with kindness balance and active days
const HeroSection: React.FC<{ computed: any }> = ({ computed }) => {
  const totalMoments = computed?.total_moments || 0;
  const givenCount = computed?.given_count || 0;
  const receivedCount = computed?.received_count || 0;
  const activeDays = computed?.active_days || 0;
  const quietDays = computed?.quiet_days || 0;
  
  const givenPercent = totalMoments > 0 ? (givenCount / totalMoments) * 100 : 50;
  const receivedPercent = totalMoments > 0 ? (receivedCount / totalMoments) * 100 : 50;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Kindness Balance */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-primary" />
            <span className="font-medium">Kindness Balance</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Given: {givenCount}</span>
              <span className="text-muted-foreground">Received: {receivedCount}</span>
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
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{givenPercent.toFixed(0)}% given</span>
              <span>{receivedPercent.toFixed(0)}% received</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Active vs Quiet Days */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-medium">Active vs Quiet Days</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active: {activeDays}</span>
              <span className="text-muted-foreground">Quiet: {quietDays}</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-muted">
              <div 
                className="bg-primary transition-all duration-300" 
                style={{ width: `${(activeDays / (activeDays + quietDays || 1)) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Period-specific sections
const SevenDayContent: React.FC<{ reflection: any }> = ({ reflection }) => (
  <div className="space-y-6">
    {/* Activity this week */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Activity this week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ActivityDots computed={reflection.computed} />
      </CardContent>
    </Card>
    
    {/* Journey and Suggestions */}
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

const ThirtyDayContent: React.FC<{ reflection: any }> = ({ reflection }) => {
  const consistencyScore = reflection.computed?.consistency_score || 0;
  const weeklyData = reflection.computed?.week_to_week_change_pct || [0, 0, 0, 0];
  const newPeopleCount = reflection.computed?.new_people_count || 0;
  const topPeople = reflection.computed?.top_people || [];
  
  return (
    <div className="space-y-6">
      {/* Consistency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Consistency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <MicroSparkline data={weeklyData} />
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {consistencyScore}% consistent
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      {/* New Connections */}
      {newPeopleCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              New Connections ({newPeopleCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topPeople.slice(0, 3).map((person: any, index: number) => (
                <Badge key={index} variant="outline">
                  <DiscreetText variant="name" text={person.display_name} />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Journey and Suggestions */}
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

const NinetyDayContent: React.FC<{ reflection: any }> = ({ reflection }) => {
  const shiftingCategories = reflection.computed?.shifting_categories || [];
  const longestGapClosed = reflection.computed?.longest_gap_closed;
  const topTags = reflection.computed?.tags_top || [];
  
  return (
    <div className="space-y-6">
      {/* What shifted */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            What shifted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                Rising categories
              </h4>
              <div className="space-y-1">
                {shiftingCategories.filter((c: any) => c.delta > 0).slice(0, 3).map((cat: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <DiscreetText variant="name" text={cat.name} />
                    <span className="text-green-500">+{cat.delta.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-orange-500" />
                Declining categories
              </h4>
              <div className="space-y-1">
                {shiftingCategories.filter((c: any) => c.delta < 0).slice(0, 3).map((cat: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <DiscreetText variant="name" text={cat.name} />
                    <span className="text-orange-500">{cat.delta.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Longest gap closed */}
      {longestGapClosed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Longest gap you closed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              <DiscreetText variant="name" text={longestGapClosed.name} /> 
              {" "}• {longestGapClosed.days} days since last contact
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Journey and Suggestions */}
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

const YearContent: React.FC<{ reflection: any }> = ({ reflection }) => {
  const milestones = reflection.computed?.milestones || {};
  const seasonality = reflection.computed?.seasonality || 'None';
  const topConnections = reflection.computed?.top_connections || [];
  
  return (
    <div className="space-y-6">
      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {milestones.first_moment_date ? format(parseISO(milestones.first_moment_date), 'MMM d, yyyy') : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">First moment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">{milestones.best_streak || 0}</div>
              <div className="text-sm text-muted-foreground">Best streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                <DiscreetText variant="name" text={milestones.kindest_month || 'None'} />
              </div>
              <div className="text-sm text-muted-foreground">Kindest month</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Seasons of kindness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Seasons of kindness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="text-base px-3 py-1">
            <DiscreetText variant="name" text={seasonality} />
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">Your peak month for kindness moments</p>
        </CardContent>
      </Card>
      
      {/* Top connections */}
      {topConnections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Top connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topConnections.slice(0, 5).map((connection: any, index: number) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  <DiscreetText variant="name" text={connection.display_name} />
                  <span className="text-xs text-muted-foreground">({connection.shared_count})</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Journey and Suggestions */}
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

export const Reflection: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReflectionPeriod>('7d');
  const { reflection, loading, error, regenerating, regenerateReflection } = useReflectionPeriod(selectedPeriod);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold mb-2">
            Your Reflection
          </h1>
          <p className="text-muted-foreground">
            Taking time to reflect on your kindness journey
          </p>
        </div>
        <LoadingCard />
      </div>
    );
  }

  if (error && !reflection) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold mb-2">
            Your Reflection
          </h1>
          <p className="text-muted-foreground">
            Taking time to reflect on your kindness journey
          </p>
        </div>
        <EmptyState
          icon={Heart}
          title="Let's start your kindness journey"
          description="Every small act of kindness creates ripples of positive change. Begin with something simple - a smile, a thank you, or reaching out to someone you care about."
          action={{
            label: "Try Again",
            onClick: () => window.location.reload()
          }}
        />
      </div>
    );
  }

  const periodLabels = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days', 
    '90d': 'Last 90 days',
    '365d': 'Last year'
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold mb-2">
              Your Reflection
            </h1>
            <p className="text-muted-foreground">
              Taking time to reflect on your kindness journey
            </p>
          </div>
          
          {reflection && (
            <Button
              variant="outline"
              size="sm"
              onClick={regenerateReflection}
              disabled={regenerating}
              className="gap-2 self-start sm:self-auto"
            >
              <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Regenerating...' : 'Regenerate'}
            </Button>
          )}
        </div>
      </div>

      {!reflection ? (
        <EmptyState
          icon={Heart}
          title="Let's start your kindness journey"
          description="Every small act of kindness creates ripples of positive change. Begin with something simple - a smile, a thank you, or reaching out to someone you care about."
        />
      ) : (
        <>
          {/* Hero Section */}
          <HeroSection computed={reflection.computed} />
          
          {/* Period Tabs */}
          <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as ReflectionPeriod)}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="7d" className="text-sm">Last 7 days</TabsTrigger>
              <TabsTrigger value="30d" className="text-sm">Last 30 days</TabsTrigger>
              <TabsTrigger value="90d" className="text-sm">Last 90 days</TabsTrigger>
              <TabsTrigger value="365d" className="text-sm">Last year</TabsTrigger>
            </TabsList>
            
            <TabsContent value="7d" className="mt-0">
              <SevenDayContent reflection={reflection} />
            </TabsContent>
            
            <TabsContent value="30d" className="mt-0">
              <ThirtyDayContent reflection={reflection} />
            </TabsContent>
            
            <TabsContent value="90d" className="mt-0">
              <NinetyDayContent reflection={reflection} />
            </TabsContent>
            
            <TabsContent value="365d" className="mt-0">
              <YearContent reflection={reflection} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};