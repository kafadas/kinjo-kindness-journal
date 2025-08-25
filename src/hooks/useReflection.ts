import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfDay, subDays, format } from 'date-fns';

export type ReflectionPeriod = '7d' | '30d' | '90d' | '365d';

interface ReflectionData {
  id: string;
  user_id: string;
  period: string;
  range_start: string;
  range_end: string;
  summary: string | null;
  suggestions: string | null;
  computed: any;
  model: string;
  created_at: string;
  regenerated_at: string;
}

// Helper to compute date range for period
export const computePeriodDateRange = (period: ReflectionPeriod, timezone: string = 'UTC') => {
  const now = new Date();
  let start: Date;
  let end: Date = startOfDay(now);

  switch (period) {
    case '7d':
      start = startOfDay(subDays(now, 6));
      break;
    case '30d':
      start = startOfDay(subDays(now, 29));
      break;
    case '90d':
      start = startOfDay(subDays(now, 89));
      break;
    case '365d':
      start = startOfDay(subDays(now, 364));
      break;
    default:
      start = startOfDay(subDays(now, 6));
  }

  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
    startDate: start,
    endDate: end
  };
};

export const useReflection = (period: ReflectionPeriod) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Get user timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dateRange = computePeriodDateRange(period, timezone);
  
  // Cache key includes user, period, and date range
  const cacheKey = ['reflection', user?.id, period, dateRange.start, dateRange.end];

  // Auto-fetch reflection data
  const { data: reflection, isLoading, error, refetch } = useQuery({
    queryKey: cacheKey,
    queryFn: async (): Promise<ReflectionData | null> => {
      if (!user?.id) return null;

      const { data, error: rpcError } = await supabase.rpc('get_or_generate_reflection', {
        p_period: period,
        p_tz: timezone
      });

      if (rpcError) {
        console.error('Error fetching reflection:', rpcError);
        throw new Error(rpcError.message);
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Regenerate with AI mutation
  const regenerateMutation = useMutation({
    mutationFn: async (): Promise<ReflectionData | null> => {
      if (!user?.id) return null;

      const { data, error: functionError } = await supabase.functions.invoke('generate-reflection', {
        body: { period, tz: timezone }
      });

      if (functionError) {
        console.error('Error regenerating reflection:', functionError);
        throw new Error(functionError.message);
      }

      return data;
    },
    onSuccess: (data) => {
      if (data) {
        // Update cache with new data
        queryClient.setQueryData(cacheKey, data);
      }
    }
  });

  const regenerateWithAI = () => {
    regenerateMutation.mutate();
  };

  return {
    reflection,
    isLoading,
    error,
    refetch,
    regenerateWithAI,
    isRegenerating: regenerateMutation.isPending,
    dateRange
  };
};