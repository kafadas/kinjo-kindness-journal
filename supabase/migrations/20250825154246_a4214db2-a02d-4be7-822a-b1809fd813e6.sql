-- Add new columns to reflections table
ALTER TABLE public.reflections 
ADD COLUMN period text NOT NULL DEFAULT '7d',
ADD COLUMN model text NOT NULL DEFAULT 'rule',
ADD COLUMN computed jsonb DEFAULT '{}'::jsonb,
ADD COLUMN regenerated_at timestamptz DEFAULT now();

-- Add check constraints
ALTER TABLE public.reflections 
ADD CONSTRAINT reflections_period_check CHECK (period IN ('7d','30d','90d','365d')),
ADD CONSTRAINT reflections_model_check CHECK (model IN ('rule','ai'));

-- Backfill existing rows
UPDATE public.reflections 
SET period = '7d', model = 'rule', regenerated_at = COALESCE(created_at, now())
WHERE period IS NULL OR model IS NULL;

-- Add unique constraint for one row per user/period/range
ALTER TABLE public.reflections 
ADD CONSTRAINT reflections_user_period_range_unique 
UNIQUE (user_id, period, range_start, range_end);

-- Add performance index
CREATE INDEX idx_reflections_user_period_range 
ON public.reflections (user_id, period, range_start, range_end);