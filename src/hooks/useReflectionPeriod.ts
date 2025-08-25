import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getProfile } from '@/lib/db';

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

export const useReflectionPeriod = (period: ReflectionPeriod) => {
  const [reflection, setReflection] = useState<ReflectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [lastRegenerateTime, setLastRegenerateTime] = useState<number>(0);

  const { user } = useAuth();

  const fetchReflection = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      // Get user profile for timezone
      const profile = await getProfile();
      const timezone = profile?.timezone || 'UTC';

      const { data, error: rpcError } = await supabase.rpc('get_reflection_period', {
        p_user: user.id,
        p_period: period,
        p_tz: timezone
      });

      if (rpcError) {
        console.error('Error fetching reflection:', rpcError);
        setError(rpcError.message);
        return;
      }

      if (data && data.length > 0) {
        setReflection(data[0]);
      } else {
        setReflection(null);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load reflection');
    } finally {
      setLoading(false);
    }
  }, [user?.id, period]);

  const regenerateReflection = useCallback(async () => {
    const now = Date.now();
    if (now - lastRegenerateTime < 60000) { // 60 second debounce
      return;
    }

    if (!user?.id) return;
    
    setRegenerating(true);
    setLastRegenerateTime(now);

    try {
      // Get user profile for timezone
      const profile = await getProfile();
      const timezone = profile?.timezone || 'UTC';

      const { data, error: rpcError } = await supabase.rpc('generate_reflection_period', {
        p_user: user.id,
        p_period: period,
        p_tz: timezone
      });

      if (rpcError) {
        console.error('Error regenerating reflection:', rpcError);
        setError(rpcError.message);
        return;
      }

      if (data && data.length > 0) {
        setReflection(data[0]);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to regenerate reflection');
    } finally {
      setRegenerating(false);
    }
  }, [user?.id, period, lastRegenerateTime]);

  useEffect(() => {
    fetchReflection();
  }, [fetchReflection]);

  return {
    reflection,
    loading,
    error,
    regenerating,
    regenerateReflection,
    refetch: fetchReflection
  };
};