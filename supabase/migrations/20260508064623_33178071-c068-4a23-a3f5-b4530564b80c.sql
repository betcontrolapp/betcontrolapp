
-- Teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teams read all" ON public.teams;
CREATE POLICY "teams read all" ON public.teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "teams insert auth" ON public.teams;
CREATE POLICY "teams insert auth" ON public.teams FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "teams update admin" ON public.teams;
CREATE POLICY "teams update admin" ON public.teams FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'mix.maketing.bc@gmail.com');

DROP POLICY IF EXISTS "teams delete admin" ON public.teams;
CREATE POLICY "teams delete admin" ON public.teams FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'mix.maketing.bc@gmail.com');

-- Add columns to bets
ALTER TABLE public.bets
  ADD COLUMN IF NOT EXISTS bilhete TEXT,
  ADD COLUMN IF NOT EXISTS time1 TEXT,
  ADD COLUMN IF NOT EXISTS time2 TEXT;

-- Seed teams
INSERT INTO public.teams (name) VALUES
  ('Flamengo'),('Vasco'),('Palmeiras'),('Corinthians'),('Santos'),
  ('São Paulo'),('Atlético MG'),('Grêmio'),('Internacional'),('Botafogo'),
  ('Real Madrid'),('Barcelona'),('Manchester City'),('Liverpool'),('PSG')
ON CONFLICT (name) DO NOTHING;
