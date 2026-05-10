import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import logo from "@/assets/bet-control-logo.png";
import {
  hasPin,
  isUnlocked,
  markPinAsked,
  markUnlocked,
  savePin,
  verifyPin,
  wasPinAsked,
  clearPin,
} from "@/lib/pin";

type Mode = "loading" | "setup" | "lock" | "ok";

export function PinGate({ email, children }: { email: string; children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("loading");

  useEffect(() => {
    if (hasPin(email)) {
      setMode(isUnlocked() ? "ok" : "lock");
    } else if (!wasPinAsked(email)) {
      setMode("setup");
    } else {
      setMode("ok");
    }
  }, [email]);

  if (mode === "loading") return null;
  if (mode === "setup") return <SetupScreen email={email} onDone={() => setMode("ok")} />;
  if (mode === "lock") return <LockScreen email={email} onUnlock={() => setMode("ok")} />;
  return <>{children}</>;
}

function PinDots({ length, max = 4 }: { length: number; max?: number }) {
  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full border-2 ${
            i < length ? "bg-primary border-primary" : "border-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

function Keypad({ onDigit, onBack }: { onDigit: (d: string) => void; onBack: () => void }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "<"];
  return (
    <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
      {keys.map((k, i) => {
        if (k === "") return <div key={i} />;
        if (k === "<")
          return (
            <button
              key={i}
              onClick={onBack}
              className="h-14 rounded-xl bg-card border border-border text-xl font-bold hover:bg-accent"
            >
              ⌫
            </button>
          );
        return (
          <button
            key={i}
            onClick={() => onDigit(k)}
            className="h-14 rounded-xl bg-card border border-border text-xl font-bold hover:bg-accent"
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}

function SetupScreen({ email, onDone }: { email: string; onDone: () => void }) {
  const [step, setStep] = useState<"ask" | "pin1" | "pin2">("ask");
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");

  const handleDigit = (d: string) => {
    if (step === "pin1" && pin1.length < 4) {
      const next = pin1 + d;
      setPin1(next);
      if (next.length === 4) setTimeout(() => setStep("pin2"), 150);
    } else if (step === "pin2" && pin2.length < 4) {
      const next = pin2 + d;
      setPin2(next);
      if (next.length === 4) {
        setTimeout(async () => {
          if (next !== pin1) {
            toast.error("PIN não confere. Tente novamente.");
            setPin1("");
            setPin2("");
            setStep("pin1");
            return;
          }
          await savePin(pin1, email);
          markPinAsked(email);
          toast.success("PIN criado!");
          onDone();
        }, 150);
      }
    }
  };

  const handleBack = () => {
    if (step === "pin1") setPin1((s) => s.slice(0, -1));
    else if (step === "pin2") setPin2((s) => s.slice(0, -1));
  };

  if (step === "ask") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-5 text-center">
          <img src={logo} alt="Bet Control" style={{ width: "55%" }} className="mx-auto" />
          <h2 className="text-xl font-bold">Criar PIN de acesso rápido?</h2>
          <p className="text-sm text-muted-foreground">
            Use 4 dígitos para entrar mais rápido nas próximas vezes.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setStep("pin1")}
              className="w-full font-bold py-3 rounded-xl text-white"
              style={{ background: "#2563eb" }}
            >
              Sim, criar PIN
            </button>
            <button
              onClick={() => {
                markPinAsked(email);
                onDone();
              }}
              className="w-full text-sm text-muted-foreground hover:text-foreground py-2"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    );
  }

  const current = step === "pin1" ? pin1 : pin2;
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <img src={logo} alt="Bet Control" style={{ width: "55%" }} className="mx-auto" />
        <h2 className="text-lg font-bold">
          {step === "pin1" ? "Defina seu PIN" : "Confirme o PIN"}
        </h2>
        <PinDots length={current.length} />
        <Keypad onDigit={handleDigit} onBack={handleBack} />
      </div>
    </div>
  );
}

function LockScreen({ email, onUnlock }: { email: string; onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const nav = useNavigate();
  const checking = useRef(false);

  const handleDigit = async (d: string) => {
    if (checking.current || pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      checking.current = true;
      const ok = await verifyPin(next, email);
      checking.current = false;
      if (ok) {
        markUnlocked();
        onUnlock();
      } else {
        setShake(true);
        setTimeout(() => {
          setPin("");
          setShake(false);
        }, 500);
        toast.error("PIN incorreto");
      }
    }
  };

  const handleBack = () => setPin((s) => s.slice(0, -1));

  const forgotPin = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) toast.error(error.message);
    else toast.success("Email de redefinição enviado");
  };

  const usePassword = async () => {
    clearPin(email);
    await supabase.auth.signOut();
    nav({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className={`w-full max-w-sm space-y-6 text-center ${shake ? "animate-pulse" : ""}`}>
        <img src={logo} alt="Bet Control" style={{ width: "55%" }} className="mx-auto" />
        <div>
          <h2 className="text-lg font-bold">Digite seu PIN</h2>
          <p className="text-xs text-muted-foreground mt-1">{email}</p>
        </div>
        <PinDots length={pin.length} />
        <Keypad onDigit={handleDigit} onBack={handleBack} />
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={forgotPin}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Esqueci meu PIN
          </button>
          <button
            onClick={usePassword}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Entrar com senha
          </button>
        </div>
      </div>
    </div>
  );
}
