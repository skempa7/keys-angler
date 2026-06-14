// Tiny haptic tap on key actions (no-op where unsupported / on desktop).
export const haptic = (ms = 12) => {
  try { navigator.vibrate?.(ms) } catch { /* unsupported */ }
}
