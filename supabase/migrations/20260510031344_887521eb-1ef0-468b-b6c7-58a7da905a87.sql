DROP POLICY IF EXISTS "teams insert auth" ON public.teams;
CREATE POLICY "teams insert auth" ON public.teams
FOR INSERT TO authenticated
WITH CHECK (true);