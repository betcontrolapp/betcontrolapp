
CREATE TABLE public.bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  descricao TEXT NOT NULL,
  esporte TEXT NOT NULL DEFAULT '⚽',
  investido NUMERIC(10,2) NOT NULL,
  retorno NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','ganhou','perdeu')),
  notes TEXT
);
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bets select" ON public.bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own bets insert" ON public.bets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own bets update" ON public.bets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own bets delete" ON public.bets FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'monthly',
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own license select" ON public.licenses FOR SELECT USING (auth.uid() = user_id);

-- Auto-create 30-day trial license for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_license()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.licenses (user_id, plan, active, expires_at)
  VALUES (NEW.id, 'monthly', true, NOW() + INTERVAL '30 days')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_license
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_license();
