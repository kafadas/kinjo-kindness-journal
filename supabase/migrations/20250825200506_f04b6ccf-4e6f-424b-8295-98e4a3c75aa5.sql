-- Force invalidation of all cached reflections to regenerate with correct field structure
-- This will cause all reflections to be regenerated with the updated field names and daily_by_weekday data

UPDATE public.reflections 
SET regenerated_at = '1970-01-01 00:00:00+00'::timestamp with time zone
WHERE TRUE;

-- Alternatively, we can delete all cached reflections to force fresh generation
-- DELETE FROM public.reflections WHERE TRUE;