import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Reflection } from '@/lib/db/types';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export const useReflections = (rangeLabel: '7d' | '30d' | '90d' = '7d') => {
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const getDateRange = (range: '7d' | '30d' | '90d') => {
    const end = endOfDay(new Date());
    let start: Date;
    
    switch (range) {
      case '7d':
        start = startOfDay(subDays(end, 6));
        break;
      case '30d':
        start = startOfDay(subDays(end, 29));
        break;
      case '90d':
        start = startOfDay(subDays(end, 89));
        break;
    }
    
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    };
  };

  const fetchReflection = async (forceRegenerate = false) => {
    try {
      setLoading(true);
      setError(null);

      const { start, end } = getDateRange(rangeLabel);

      if (forceRegenerate) {
        // Delete existing reflection first
        await supabase
          .from('reflections')
          .delete()
          .eq('range_start', start)
          .eq('range_end', end);
      }

      const { data, error: functionError } = await supabase.functions.invoke('generate-reflection', {
        body: { 
          range_start: start,
          range_end: end
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (functionError) {
        throw functionError;
      }

      setReflection(data);
    } catch (err: any) {
      console.error('Error fetching reflection:', err);
      setError(err.message || 'Failed to generate reflection');
    } finally {
      setLoading(false);
    }
  };

  const regenerateReflection = async () => {
    setRegenerating(true);
    try {
      await fetchReflection(true);
    } finally {
      setRegenerating(false);
    }
  };

  useEffect(() => {
    fetchReflection();
  }, [rangeLabel]);

  return {
    reflection,
    loading,
    error,
    regenerating,
    regenerateReflection,
    refetch: fetchReflection
  };
};