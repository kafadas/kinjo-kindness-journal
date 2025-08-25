import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, RefreshCw, Calendar, Lightbulb } from 'lucide-react';
import { useReflections } from '@/hooks/useReflections';
import { useDiscreetMode } from '@/contexts/DiscreetModeContext';
import { DiscreetText } from '@/components/ui/DiscreetText';
import { LoadingCard } from '@/components/ui/loading-card';
import { EmptyState } from '@/components/ui/empty-state';
import { format, subDays } from 'date-fns';

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

  if (error) {
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
          icon={BookOpen}
          title="Unable to generate reflection"
          description={error}
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
          icon={BookOpen}
          title="No reflection available"
          description="We couldn't find any data for this time period to reflect on."
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
            </CardContent>
          </Card>

        </>
      )}
    </div>
  );
};