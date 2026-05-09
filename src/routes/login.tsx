import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import logo from "@/assets/bet-control-logo.png";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/" });
    });
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        if (password !== confirm) throw new Error("Senhas não coincidem");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada!");
        nav({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4 text-[1.2em]">
        <div className="text-center flex flex-col items-center">
          <img src={logo} alt="Bet Control" style={{ height: 64 }} className="w-auto" />
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {mode === "register" && (
            <Input
              type="password"
              placeholder="Confirmar senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          )}
          <Button type="submit" className="w-full font-bold" disabled={loading}>
            {mode === "login" ? "ENTRAR" : "CRIAR CONTA"}
          </Button>
        </form>
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="w-full text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "login" ? "Não tem conta? Criar" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
