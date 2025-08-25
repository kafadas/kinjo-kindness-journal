import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

export const useReflection = () => {
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRegenerateTime, setLastRegenerateTime] = useState<number>(0);

  const { user } = useAuth();

  const getReflection = useCallback(async (period: ReflectionPeriod): Promise<ReflectionData | null> => {
    if (!user?.id) return null;
    
    setLoading(true);
    setError(null);

    try {
      // Get user timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Call the deterministic RPC function
      const { data, error: rpcError } = await supabase.rpc('get_or_generate_reflection', {
        p_period: period,
        p_tz: timezone
      });

      if (rpcError) {
        console.error('Error fetching reflection:', rpcError);
        setError(rpcError.message);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load reflection');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const regenerateWithAI = useCallback(async (period: ReflectionPeriod): Promise<ReflectionData | null> => {
    const now = Date.now();
    if (now - lastRegenerateTime < 60000) { // 60 second debounce
      return null;
    }

    if (!user?.id) return null;
    
    setRegenerating(true);
    setLastRegenerateTime(now);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Call the edge function to try AI path
      const { data, error: functionError } = await supabase.functions.invoke('generate-reflection', {
        body: { period, tz: timezone }
      });

      if (functionError) {
        console.error('Error regenerating reflection:', functionError);
        setError(functionError.message);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to regenerate reflection');
      return null;
    } finally {
      setRegenerating(false);
    }
  }, [user?.id, lastRegenerateTime]);

  return {
    loading,
    regenerating,
    error,
    getReflection,
    regenerateWithAI
  };
};