// PIN helpers — SHA-256 hash com salt do email. Não substitui senha, só agiliza re-login no dispositivo.
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const pinKey = (email: string) => `bc_pin_${email.toLowerCase()}`;
export const pinAskedKey = (email: string) => `bc_pin_asked_${email.toLowerCase()}`;
export const UNLOCKED_FLAG = "bc_unlocked";

export async function hashPin(pin: string, email: string) {
  return sha256(`${pin}::${email.toLowerCase()}::bet-control`);
}

export async function savePin(pin: string, email: string) {
  const h = await hashPin(pin, email);
  localStorage.setItem(pinKey(email), h);
  sessionStorage.setItem(UNLOCKED_FLAG, "1");
}

export async function verifyPin(pin: string, email: string) {
  const stored = localStorage.getItem(pinKey(email));
  if (!stored) return false;
  const h = await hashPin(pin, email);
  return h === stored;
}

export function clearPin(email: string) {
  localStorage.removeItem(pinKey(email));
  localStorage.removeItem(pinAskedKey(email));
  sessionStorage.removeItem(UNLOCKED_FLAG);
}

export function hasPin(email: string) {
  return !!localStorage.getItem(pinKey(email));
}

export function markPinAsked(email: string) {
  localStorage.setItem(pinAskedKey(email), "1");
}

export function wasPinAsked(email: string) {
  return !!localStorage.getItem(pinAskedKey(email));
}

export function isUnlocked() {
  return sessionStorage.getItem(UNLOCKED_FLAG) === "1";
}

export function markUnlocked() {
  sessionStorage.setItem(UNLOCKED_FLAG, "1");
}
