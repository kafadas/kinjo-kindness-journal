import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface ReflectionData {
  id?: string;
  user_id: string;
  range_start: string;
  range_end: string;
  summary: string;
  suggestions: string;
  source: 'ai' | 'fallback';
  created_at?: string;
  // Rich insights data
  kindnessBalance?: {
    given: number;
    received: number;
  };
  activityHeatMap?: Array<{
    date: string;
    count: number;
    intensity: number;
  }>;
  dailySparkline?: Array<{
    date: string;
    count: number;
  }>;
  previousReflections?: Array<{
    summary: string;
    suggestions: string;
    range_start: string;
    range_end: string;
    created_at: string;
    source: string;
  }>;
  insights?: {
    weeklyPatterns: any;
    streakData: any;
    microKindness: string | null;
  };
}

export const useReflections = (rangeLabel: '7d' | '30d' | '90d' = '7d') => {
  const [reflection, setReflection] = useState<ReflectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [lastRegenerate, setLastRegenerate] = useState<number>(0);

  const fetchReflection = async (forceRegenerate = false) => {
    try {
      setLoading(true);
      setError(null);

      // Call the edge function with the new API format
      const { data, error: functionError } = await supabase.functions.invoke('generate-reflection', {
        body: { 
          range: rangeLabel // New format: just pass the range
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (functionError) {
        console.error('Function error:', functionError);
        toast({
          title: "Connection Error",
          description: "Unable to connect to reflection service. Please try again.",
          variant: "destructive",
        });
        setError('Unable to generate reflection. Please try again.');
        return;
      }

      // The function should always return 200 with data
      if (data) {
        setReflection(data);
        setError(null);
      } else {
        setError('No reflection data received');
      }
    } catch (err: any) {
      console.error('Error fetching reflection:', err);
      toast({
        title: "Network Error", 
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const regenerateReflection = async () => {
    // Debounce regeneration to prevent spam (60 seconds)
    const now = Date.now();
    if (now - lastRegenerate < 60000) {
      toast({
        title: "Please wait",
        description: "You can regenerate again in a moment.",
      });
      return;
    }

    setRegenerating(true);
    setLastRegenerate(now);
    
    try {
      // For regeneration, we'll delete the existing reflection server-side
      // The edge function handles this via upsert, so just call normally
      await fetchReflection(true);
      
      toast({
        title: "Reflection updated",
        description: "Your reflection has been regenerated with fresh insights.",
      });
    } catch (err) {
      console.error('Error regenerating reflection:', err);
      toast({
        title: "Regeneration failed",
        description: "Unable to regenerate reflection. Please try again.",
        variant: "destructive",
      });
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