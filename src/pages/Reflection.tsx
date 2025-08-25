import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Heart } from 'lucide-react';
import { useReflection, type ReflectionPeriod } from '@/hooks/useReflection';
import { WeeklyLayout, MonthlyLayout, QuarterlyLayout, YearlyLayout } from '@/components/reflection/PeriodLayouts';
import { LoadingCard } from '@/components/ui/loading-card';
import { EmptyState } from '@/components/ui/empty-state';
import { DateRangeBadge } from '@/components/ui/DateRangeBadge';

const Reflection: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReflectionPeriod>('7d');
  const { reflection, isLoading, error, regenerateWithAI, isRegenerating, dateRange } = useReflection(selectedPeriod);

  const periods = [
    { value: '7d' as ReflectionPeriod, label: '7 days', title: 'Weekly' },
    { value: '30d' as ReflectionPeriod, label: '30 days', title: 'Monthly' },
    { value: '90d' as ReflectionPeriod, label: '90 days', title: 'Quarterly' },
    { value: '365d' as ReflectionPeriod, label: '1 year', title: 'Yearly' }
  ];

  const renderPeriodContent = () => {
    if (!reflection) return null;

    switch (selectedPeriod) {
      case '7d':
        return <WeeklyLayout reflection={reflection} dateRange={dateRange} />;
      case '30d':
        return <MonthlyLayout reflection={reflection} dateRange={dateRange} />;
      case '90d':
        return <QuarterlyLayout reflection={reflection} dateRange={dateRange} />;
      case '365d':
        return <YearlyLayout reflection={reflection} dateRange={dateRange} />;
      default:
        return <WeeklyLayout reflection={reflection} dateRange={dateRange} />;
    }
  };

  const renderSkeletonContent = () => (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Reflection</h1>
              <div className="h-4 w-48 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
          
          {/* Period chips skeleton */}
          <div className="flex flex-wrap gap-2">
            {periods.map((period) => (
              <div 
                key={period.value}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedPeriod === period.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {period.label}
              </div>
            ))}
          </div>
        </div>
        
        {/* Content skeletons */}
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </div>
    </div>
  );

  if (isLoading) {
    return renderSkeletonContent();
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      {/* Header with period chips */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Reflection</h1>
            <DateRangeBadge 
              start={dateRange.startDate} 
              end={dateRange.endDate} 
              className="mb-2" 
            />
            <p className="text-muted-foreground">
              Your journey of kindness, captured in gentle moments
            </p>
          </div>
          
          {reflection && (
            <div className="flex items-center gap-2">
              <Badge variant={reflection.model === 'ai' ? 'default' : 'secondary'}>
                {reflection.model === 'ai' ? 'AI Enhanced' : 'Rule-based'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={regenerateWithAI}
                disabled={isRegenerating}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </Button>
            </div>
          )}
        </div>

        {/* Period Selection */}
        <div className="flex flex-wrap gap-2">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedPeriod === period.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">{error.message || 'An error occurred'}</p>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {reflection ? (
        renderPeriodContent()
      ) : !isLoading && !error ? (
        <EmptyState
          icon={Heart}
          title="No reflection available"
          description="We couldn't generate a reflection for this period. This might be because you don't have any moments recorded yet."
        />
      ) : null}
    </div>
  );
};

export default Reflection;