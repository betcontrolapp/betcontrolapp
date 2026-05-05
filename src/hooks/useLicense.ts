import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useLicense(userId: string | undefined) {
  const [state, setState] = useState<{
    valid: boolean;
    expiresAt: string | null;
    plan: string | null;
    active: boolean;
    loading: boolean;
  }>({ valid: false, expiresAt: null, plan: null, active: false, loading: true });

  useEffect(() => {
    if (!userId) {
      setState({ valid: false, expiresAt: null, plan: null, active: false, loading: false });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("licenses")
        .select("plan, active, expires_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (!data) {
        setState({ valid: false, expiresAt: null, plan: null, active: false, loading: false });
        return;
      }
      const valid = data.active && new Date(data.expires_at).getTime() > Date.now();
      setState({
        valid,
        expiresAt: data.expires_at,
        plan: data.plan,
        active: data.active,
        loading: false,
      });
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return state;
}
