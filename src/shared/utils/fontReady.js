// Ensure custom @font-face faces are actually loaded before measuring or
// rasterizing text. `document.fonts.ready` alone is insufficient: a face that
// no rendered layout has requested was never "pending", so `ready` resolves
// with the font still absent. We must explicitly request each face first.

export const TRV_FONT_SPECS = [
  "italic 400 74px 'Compacta TRV'",
  "italic 700 30px 'Compacta BT'",
  "normal 300 12px 'Acumin Variable Concept'",
];

export const RTDT_FONT_SPECS = [
  "600 40px 'Karma'",
  "700 40px 'Karma'",
  "italic 400 40px 'Aleo'",
  "normal 400 40px 'AzkolsKerning7'",
];

const readyPromises = new Map();

// Resolves once every face in `specs` has loaded (or failed individually).
// Memoized per spec-set so repeated calls share one in-flight promise.
export function ensureFontsLoaded(specs = TRV_FONT_SPECS) {
  const key = specs.join("|");
  if (readyPromises.has(key)) return readyPromises.get(key);

  const p = (async () => {
    if (typeof document === "undefined" || !document.fonts) return;
    try {
      await Promise.all(
        specs.map((s) => document.fonts.load(s, "ABCabcg0123").catch(() => {})),
      );
      await document.fonts.ready;
    } catch {
      /* fall back to whatever metrics are available */
    }
  })();

  readyPromises.set(key, p);
  return p;
}

// Synchronous best-effort check — true if every face is already available.
export function fontsAreLoaded(specs = TRV_FONT_SPECS) {
  if (typeof document === "undefined" || !document.fonts) return true;
  try {
    return specs.every((s) => document.fonts.check(s));
  } catch {
    return true;
  }
}
