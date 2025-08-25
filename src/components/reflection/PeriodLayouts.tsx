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
import { format } from 'date-fns';
import { DateRangeBadge } from '@/components/ui/DateRangeBadge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
          className="bg-primary/60 transition-all duration-300" 
          style={{ width: `${receivedPercent}%` }}
        />
      </div>
    </div>
  );
};

// Interactive Weekday Dots Component with real data and tooltips
const WeekdayDots: React.FC<{ 
  dailyData: Array<{total: number; given: number; received: number}>;
}> = ({ dailyData }) => {
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Calculate max count for scaling
  const maxCount = Math.max(...dailyData.map(d => d.total), 1);
  
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between gap-2">
        {weekdays.map((day, index) => {
          const dayData = dailyData[index] || { total: 0, given: 0, received: 0 };
          const hasActivity = dayData.total > 0;
          
          // Scale size and opacity based on activity
          const scale = hasActivity ? Math.max(0.6, dayData.total / maxCount) : 0.3;
          const opacity = hasActivity ? Math.max(0.7, dayData.total / maxCount) : 0.3;
          
          const tooltipContent = hasActivity 
            ? `${day} — ${dayData.total} moments (${dayData.given} given, ${dayData.received} received)`
            : `${day} — No activity`;
          
          return (
            <div key={day} className="flex flex-col items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`w-6 h-6 rounded-full border-2 transition-all duration-200 cursor-help ${
                      hasActivity 
                        ? 'bg-primary border-primary text-primary-foreground shadow-md' 
                        : 'bg-muted border-muted-foreground/20'
                    }`}
                    style={{ 
                      transform: `scale(${scale})`,
                      opacity: opacity 
                    }}
                    aria-label={`${day}: ${hasActivity ? `${dayData.total} moments` : 'no activity'}`}
                  >
                    {hasActivity && (
                      <div className="w-full h-full flex items-center justify-center text-xs font-medium">
                        {dayData.total}
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-background border text-foreground">
                  <p className="text-sm">{tooltipContent}</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-xs text-muted-foreground font-medium">{day}</span>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

// 7d Layout: Weekly check-in with real weekday data
export const WeeklyLayout: React.FC<{ reflection: ReflectionData; dateRange?: any }> = ({ reflection, dateRange }) => {
  const computed = reflection.computed || {};
  const givenCount = computed.given_count || 0;
  const receivedCount = computed.received_count || 0;
  const totalMoments = computed.total_moments || 0;
  const activeDays = computed.active_days || 0;
  
  // Extract daily weekday data (array of 7 objects for Mon-Sun)
  const dailyWeekdayData = computed.daily_by_weekday || Array(7).fill({ total: 0, given: 0, received: 0 });
  
  // Transform backend data to expected format
  const weekdayData = dailyWeekdayData.map((day: any) => ({
    total: day?.total || 0,
    given: day?.given || 0,
    received: day?.received || 0
  }));
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Weekly Check-in</h2>
        <p className="text-muted-foreground">A gentle look at your week of kindness</p>
        <div className="mt-3 flex justify-center gap-2">
          {dateRange && (
            <DateRangeBadge 
              start={dateRange?.startDate} 
              end={dateRange?.endDate} 
            />
          )}
          <Badge variant={reflection.model === 'ai' ? 'default' : 'secondary'}>
            {reflection.model === 'ai' ? 'AI-assisted' : 'Rule-based'}
          </Badge>
        </div>
      </div>

      {/* Kindness Balance using real data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-primary" />
            Kindness Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KindnessBalanceBar given={givenCount} received={receivedCount} />
        </CardContent>
      </Card>

      {/* Interactive weekday dots with real data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            This Week's Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <WeekdayDots dailyData={weekdayData} />
          <p className="text-xs text-muted-foreground text-center">
            Hover over dots to see daily breakdown • Size reflects activity level
          </p>
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
export const MonthlyLayout: React.FC<{ reflection: ReflectionData; dateRange?: any }> = ({ reflection, dateRange }) => {
  const { 
    total = 0, 
    total_moments = 0,
    top_categories = [],
    most_active_day_of_week = 'None',
    activeDays = 0 
  } = reflection.computed || {};
  
  // Use total_moments if available, fallback to total
  const totalMoments = total_moments || total;
  
  // Get top category from categories array
  const topCategory = Array.isArray(top_categories) && top_categories.length > 0 
    ? top_categories[0].name 
    : 'Various';
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Month in Focus</h2>
        <p className="text-muted-foreground">Patterns and highlights from the past 30 days</p>
        <div className="mt-3 flex justify-center gap-2">
          {dateRange && (
            <DateRangeBadge 
              start={dateRange?.startDate} 
              end={dateRange?.endDate} 
            />
          )}
          <Badge variant={reflection.model === 'ai' ? 'default' : 'secondary'}>
            {reflection.model === 'ai' ? 'AI-assisted' : 'Rule-based'}
          </Badge>
        </div>
      </div>

      {/* 3 Stat Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">{totalMoments}</div>
            <div className="text-sm text-muted-foreground">Total Moments</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              <DiscreetText variant="name" text={most_active_day_of_week} />
            </div>
            <div className="text-sm text-muted-foreground">Most Active Day</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              <DiscreetText variant="name" text={topCategory} />
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
export const QuarterlyLayout: React.FC<{ reflection: ReflectionData; dateRange?: any }> = ({ reflection, dateRange }) => {
  const { 
    total_moments = 0,
    top_categories = [],
    tags_top = []
  } = reflection.computed || {};
  
  // Create themes from top tags and category names
  const tagThemes = Array.isArray(tags_top) ? tags_top.slice(0, 3) : [];
  const categoryThemes = Array.isArray(top_categories) 
    ? top_categories.slice(0, 2).map((cat: any) => cat.name || cat)
    : [];
  
  // Combine and deduplicate
  const allThemes = [...tagThemes, ...categoryThemes];
  const uniqueThemes = [...new Set(allThemes)].slice(0, 5);
  
  // Fallback themes if no data
  const themes = uniqueThemes.length > 0 ? uniqueThemes : ['Connection', 'Growth', 'Presence'];
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Quarterly Themes</h2>
        <p className="text-muted-foreground">Emerging patterns over the past 90 days</p>
        <div className="mt-3 flex justify-center gap-2">
          {dateRange && (
            <DateRangeBadge 
              start={dateRange?.startDate} 
              end={dateRange?.endDate} 
            />
          )}
          <Badge variant={reflection.model === 'ai' ? 'default' : 'secondary'}>
            {reflection.model === 'ai' ? 'AI-assisted' : 'Rule-based'}
          </Badge>
        </div>
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
                <DiscreetText variant="name" text={String(theme)} />
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
export const YearlyLayout: React.FC<{ reflection: ReflectionData; dateRange?: any }> = ({ reflection, dateRange }) => {
  const { toast } = useToast();
  
  const computed = reflection.computed || {};
  const { 
    total_moments = 0,
    milestones = {},
    top_connections = []
  } = computed;
  
  // Extract milestone data
  const bestStreak = milestones?.best_streak || 0;
  const bestStreakStart = milestones?.best_streak_start;
  const bestStreakEnd = milestones?.best_streak_end;
  const kindestMonth = milestones?.kindest_month || 'None';
  
  // Format streak dates if available
  const formatStreakDates = () => {
    if (bestStreak === 0 || !bestStreakStart || !bestStreakEnd) {
      return 'No streak yet — each moment counts';
    }
    
    const startDate = format(new Date(bestStreakStart), 'MMM d');
    const endDate = format(new Date(bestStreakEnd), 'MMM d');
    
    if (bestStreakStart === bestStreakEnd) {
      // Single day streak
      return `${bestStreak} day${bestStreak !== 1 ? 's' : ''} · ${format(new Date(bestStreakStart), 'MMM d, yyyy')}`;
    }
    
    // Multi-day streak with date range
    return `${bestStreak} days · ${startDate}–${endDate}`;
  };
  
  // Extract top connections (limit to 3 for display)
  const topConnections = (top_connections || []).slice(0, 3).map((conn: any) => conn.display_name || 'Unknown');

  // Handle PDF download
  const handleDownloadPDF = async () => {
    try {
      toast({
        title: "Generating your yearly summary...",
        description: "This may take a moment",
      });

      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;
      
      const { data, error } = await supabase.functions.invoke('export-pdf', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: new URLSearchParams({
          start: startDate,
          end: endDate,
          summary: '1'
        }).toString(),
      });

      if (error) {
        console.error('Export error:', error);
        toast({
          title: "Export failed",
          description: "There was an issue generating your summary. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Create a blob from the HTML response and open in new window for printing
      const htmlContent = await fetch(data).then(r => r.text());
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          URL.revokeObjectURL(url);
        };
        
        toast({
          title: "Summary ready!",
          description: "Your yearly summary is ready to download or print.",
        });
      } else {
        toast({
          title: "Popup blocked",
          description: "Please allow popups and try again, or download directly.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Something went wrong. Please try again in a moment.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Year in Kindness</h2>
        <p className="text-muted-foreground">A celebration of your journey over the past year</p>
        <div className="mt-3 flex justify-center gap-2">
          {dateRange && (
            <DateRangeBadge 
              start={dateRange?.startDate} 
              end={dateRange?.endDate} 
            />
          )}
          <Badge variant={reflection.model === 'ai' ? 'default' : 'secondary'}>
            {reflection.model === 'ai' ? 'AI-assisted' : 'Rule-based'}
          </Badge>
        </div>
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
                {topConnections.length > 0 ? (
                  topConnections.map((person: string, index: number) => (
                    <Badge key={index} variant="outline">
                      <DiscreetText variant="name" text={person} />
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Start connecting with people to see highlights</span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm mb-1">Most balanced month</h4>
                <p className="text-2xl font-bold text-primary">
                  <DiscreetText variant="name" text={kindestMonth} />
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-1">Best streak</h4>
                {bestStreak > 0 ? (
                  <>
                    <p className="text-2xl font-bold text-primary">{bestStreak} days</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatStreakDates()}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No streak yet — each moment counts</p>
                )}
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
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleDownloadPDF}
          >
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