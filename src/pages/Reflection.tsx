import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BookOpen, RefreshCw, Calendar, Lightbulb, Sparkles, BarChart3, Activity, TrendingUp, ChevronDown, Heart } from 'lucide-react';
import { useReflections } from '@/hooks/useReflections';
import { useDiscreetMode } from '@/contexts/DiscreetModeContext';
import { DiscreetText } from '@/components/ui/DiscreetText';
import { LoadingCard } from '@/components/ui/loading-card';
import { EmptyState } from '@/components/ui/empty-state';
import { format, subDays, parseISO } from 'date-fns';

// Small visual components
const KindnessBalanceBar: React.FC<{ balance: { given: number; received: number } }> = ({ balance }) => {
  const total = balance.given + balance.received;
  if (total === 0) return null;
  
  const givenPercent = (balance.given / total) * 100;
  const receivedPercent = (balance.received / total) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Given: {balance.given}</span>
        <span className="text-muted-foreground">Received: {balance.received}</span>
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
  );
};

const ActivityHeatStrip: React.FC<{ heatMap: Array<{ date: string; count: number; intensity: number }> }> = ({ heatMap }) => {
  if (!heatMap || heatMap.length === 0) return null;
  
  return (
    <div className="flex gap-1">
      {heatMap.map((day, index) => (
        <div
          key={day.date}
          className={`w-4 h-4 rounded-sm transition-all duration-200 ${
            day.intensity === 0 ? 'bg-muted' :
            day.intensity === 1 ? 'bg-primary/20' :
            day.intensity === 2 ? 'bg-primary/40' :
            day.intensity === 3 ? 'bg-primary/60' :
            'bg-primary/80'
          }`}
          title={`${format(parseISO(day.date), 'MMM d')}: ${day.count} moments`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-2">
        Last 7 days
      </span>
    </div>
  );
};

const DailySparkline: React.FC<{ data: Array<{ date: string; count: number }> }> = ({ data }) => {
  if (!data || data.length === 0) return null;
  
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.count / maxCount) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="flex items-center gap-2">
      <svg width="100" height="24" className="text-primary">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          points={points}
        />
      </svg>
      <span className="text-xs text-muted-foreground">
        Daily activity
      </span>
    </div>
  );
};

const PreviousReflections: React.FC<{ reflections: any[] }> = ({ reflections }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!reflections || reflections.length === 0) return null;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-0 h-auto">
          <span className="text-sm font-medium">Previous Reflections ({reflections.length})</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 mt-3">
        {reflections.map((prev, index) => (
          <Card key={index} className="border-l-2 border-l-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(prev.range_start), 'MMM d')} - {format(parseISO(prev.range_end), 'MMM d')}
                </span>
                {prev.source === 'fallback' && (
                  <Badge variant="outline" className="text-xs">
                    Rules
                  </Badge>
                )}
              </div>
              <DiscreetText 
                variant="body"
                text={prev.summary} 
                className="text-sm text-muted-foreground line-clamp-2"
              />
            </CardContent>
          </Card>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

type RangeLabel = '7d' | '30d' | '90d';

const RANGE_OPTIONS: { label: RangeLabel; display: string }[] = [
  { label: '7d', display: 'Last 7 days' },
  { label: '30d', display: 'Last 30 days' },
  { label: '90d', display: 'Last 90 days' },
];

export const Reflection: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<RangeLabel>('7d');
  const { reflection, loading, error, regenerating, regenerateReflection } = useReflections(selectedRange);
  const { isDiscreetMode } = useDiscreetMode();

  const formatDateRange = (range: RangeLabel) => {
    const end = new Date();
    const days = range === '7d' ? 6 : range === '30d' ? 29 : 89;
    const start = subDays(end, days);
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
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
      <div className="p-6 max-w-4xl mx-auto">
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
          description={reflection?.insights?.microKindness || "Every small act of kindness creates ripples of positive change. Begin with something simple - a smile, a thank you, or reaching out to someone you care about."}
          action={{
            label: "Try Again",
            onClick: () => window.location.reload()
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold mb-2">
          Your Reflection
        </h1>
        <p className="text-muted-foreground">
          Taking time to reflect on your kindness journey
        </p>
      </div>

      {/* Range Selection */}
      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          {RANGE_OPTIONS.map(({ label, display }) => (
            <Button
              key={label}
              variant={selectedRange === label ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRange(label)}
              className="h-8"
            >
              {display}
            </Button>
          ))}
        </div>
      </div>

      {!reflection ? (
        <EmptyState
          icon={Heart}
          title="Let's start your kindness journey"
          description="Every small act of kindness creates ripples of positive change. Begin with something simple - a smile, a thank you, or reaching out to someone you care about."
          action={{
            label: "Try a different range",
            onClick: () => setSelectedRange('30d')
          }}
        />
      ) : (
        <>
          {/* Generated Reflection */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {formatDateRange(selectedRange)}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={regenerateReflection}
                  disabled={regenerating}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
                  {regenerating ? 'Regenerating...' : 'Regenerate'}
                </Button>
              </div>
              
              {/* Visual Insights Bar */}
              <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t">
                {reflection.kindnessBalance && (
                  <div className="flex-1 min-w-48">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Kindness Balance</span>
                    </div>
                    <KindnessBalanceBar balance={reflection.kindnessBalance} />
                  </div>
                )}
                
                <div className="flex gap-4">
                  {reflection.activityHeatMap && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Activity</span>
                      </div>
                      <ActivityHeatStrip heatMap={reflection.activityHeatMap} />
                    </div>
                  )}
                  
                  {reflection.dailySparkline && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Trend</span>
                      </div>
                      <DailySparkline data={reflection.dailySparkline} />
                    </div>
                  )}
                </div>
              </div>
              
              {reflection.source === 'fallback' && (
                <div className="mt-3">
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Generated without AI — using helpful rules
                  </Badge>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Your Journey
                </h3>
                <DiscreetText 
                  variant="body"
                  text={reflection.summary || ''} 
                  className="text-muted-foreground leading-relaxed"
                />
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Gentle Suggestions
                </h3>
                <DiscreetText 
                  variant="body"
                  text={reflection.suggestions || ''} 
                  className="text-muted-foreground leading-relaxed"
                />
              </div>

              {reflection.insights?.microKindness && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Heart className="h-4 w-4 text-primary" />
                      Micro-Kindness for This Week
                    </h3>
                    <p className="text-muted-foreground leading-relaxed italic">
                      "{reflection.insights.microKindness}"
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Previous Reflections */}
          {reflection.previousReflections && reflection.previousReflections.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <PreviousReflections reflections={reflection.previousReflections} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};