import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { useReflection, type ReflectionPeriod } from '@/hooks/useReflection';
import { WeeklyLayout, MonthlyLayout, QuarterlyLayout, YearlyLayout } from '@/components/reflection/PeriodLayouts';
import { LoadingCard } from '@/components/ui/loading-card';
import { EmptyState } from '@/components/ui/empty-state';

const Reflection: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReflectionPeriod>('7d');
  const [reflection, setReflection] = useState<any>(null);
  const { loading, regenerating, error, getReflection, regenerateWithAI } = useReflection();

  const periods = [
    { value: '7d' as ReflectionPeriod, label: '7d', title: 'Weekly' },
    { value: '30d' as ReflectionPeriod, label: '30d', title: 'Monthly' },
    { value: '90d' as ReflectionPeriod, label: '90d', title: 'Quarterly' },
    { value: '365d' as ReflectionPeriod, label: '1y', title: 'Yearly' }
  ];

  const loadReflection = async (period: ReflectionPeriod) => {
    const data = await getReflection(period);
    setReflection(data);
  };

  const handleRegenerateWithAI = async () => {
    const data = await regenerateWithAI(selectedPeriod);
    if (data) {
      setReflection(data);
    }
  };

  useEffect(() => {
    loadReflection(selectedPeriod);
  }, [selectedPeriod]);

  const renderPeriodContent = () => {
    if (!reflection) return null;

    switch (selectedPeriod) {
      case '7d':
        return <WeeklyLayout reflection={reflection} />;
      case '30d':
        return <MonthlyLayout reflection={reflection} />;
      case '90d':
        return <QuarterlyLayout reflection={reflection} />;
      case '365d':
        return <YearlyLayout reflection={reflection} />;
      default:
        return <WeeklyLayout reflection={reflection} />;
    }
  };

  if (loading && !reflection) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      {/* Header with period chips */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Reflection</h1>
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
                onClick={handleRegenerateWithAI}
                disabled={regenerating}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Regenerating...' : 'Regenerate'}
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
            <p className="text-destructive mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => loadReflection(selectedPeriod)}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {reflection ? (
        renderPeriodContent()
      ) : !loading ? (
        <EmptyState
          icon={RefreshCw}
          title="No reflection available"
          description="We couldn't generate a reflection for this period. This might be because you don't have any moments recorded yet."
          action={{
            label: "Try Again",
            onClick: () => loadReflection(selectedPeriod)
          }}
        />
      ) : null}
    </div>
  );
};

export default Reflection;