import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Database, Bot, AlertCircle } from 'lucide-react';
import { useReflection, type ReflectionPeriod } from '@/hooks/useReflection';
import { format } from 'date-fns';

const DevReflectionCheck: React.FC = () => {
  const [reflections, setReflections] = useState<Record<ReflectionPeriod, any>>({
    '7d': null,
    '30d': null,
    '90d': null,
    '365d': null
  });
  const [loading, setLoading] = useState<Record<ReflectionPeriod, boolean>>({
    '7d': false,
    '30d': false,
    '90d': false,
    '365d': false
  });

  const { getReflection, regenerateWithAI } = useReflection();

  const periods: { value: ReflectionPeriod; label: string }[] = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '365d', label: '1 Year' }
  ];

  const loadReflection = async (period: ReflectionPeriod) => {
    setLoading(prev => ({ ...prev, [period]: true }));
    try {
      const data = await getReflection(period);
      setReflections(prev => ({ ...prev, [period]: data }));
    } finally {
      setLoading(prev => ({ ...prev, [period]: false }));
    }
  };

  const regenerateReflection = async (period: ReflectionPeriod) => {
    setLoading(prev => ({ ...prev, [period]: true }));
    try {
      const data = await regenerateWithAI(period);
      if (data) {
        setReflections(prev => ({ ...prev, [period]: data }));
      }
    } finally {
      setLoading(prev => ({ ...prev, [period]: false }));
    }
  };

  const loadAllReflections = async () => {
    for (const period of periods) {
      await loadReflection(period.value);
    }
  };

  useEffect(() => {
    // Auto-load all reflections on mount
    loadAllReflections();
  }, []);

  const renderReflectionCard = (period: ReflectionPeriod, label: string) => {
    const reflection = reflections[period];
    const isLoading = loading[period];

    return (
      <Card key={period} className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {label} Reflection
            </CardTitle>
            <div className="flex items-center gap-2">
              {reflection && (
                <Badge variant={reflection.model === 'ai' ? 'default' : 'secondary'}>
                  {reflection.model === 'ai' ? 'AI' : 'Rule'}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadReflection(period)}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => regenerateReflection(period)}
                disabled={isLoading}
              >
                <Bot className="h-4 w-4" />
                AI
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading...
            </div>
          ) : reflection ? (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Period:</span> {reflection.period}
                </div>
                <div>
                  <span className="font-medium">Model:</span> {reflection.model}
                </div>
                <div>
                  <span className="font-medium">Range:</span> {reflection.range_start} to {reflection.range_end}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {format(new Date(reflection.created_at), 'MMM d, HH:mm')}
                </div>
              </div>

              <Separator />

              {/* Summary */}
              <div>
                <h4 className="font-medium mb-2">Summary:</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {reflection.summary || 'No summary'}
                </p>
              </div>

              {/* Suggestions */}
              <div>
                <h4 className="font-medium mb-2">Suggestions:</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {reflection.suggestions || 'No suggestions'}
                </p>
              </div>

              {/* Computed Data */}
              {reflection.computed && (
                <div>
                  <h4 className="font-medium mb-2">Computed Data:</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(reflection.computed, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <AlertCircle className="h-6 w-6 mr-2" />
              No reflection data
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Dev: Reflection Check
            </h1>
            <p className="text-muted-foreground">
              Raw reflection data from get_or_generate_reflection RPC for all periods
            </p>
          </div>
          <Button onClick={loadAllReflections} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload All
          </Button>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Development Tool</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                This page is for development purposes only. It shows raw reflection data and allows testing 
                the AI regeneration functionality. Use the "AI" button to force regeneration with AI if available.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reflection Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {periods.map(period => renderReflectionCard(period.value, period.label))}
      </div>
    </div>
  );
};

export default DevReflectionCheck;