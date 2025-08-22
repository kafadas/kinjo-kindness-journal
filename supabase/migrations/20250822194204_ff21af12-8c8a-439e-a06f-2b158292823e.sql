-- Add optional default_category_id column to people table
ALTER TABLE public.people 
ADD COLUMN default_category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;