export function normalizeRtdbRoot(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  // Prevent common mistakes: scanning Expo dev URL QR (exp://...), or other URLs.
  if (raw.includes("://")) return null;

  // The Realtime Database path rules disallow these characters.
  if (/[.#$\[\]]/.test(raw)) return null;

  // In this app, we treat qrCode as the root key (single segment), not a multi-segment path.
  if (raw.includes("/")) return null;

  return raw;
}