import { useState, useEffect } from "react";
import { ensureFontsLoaded, fontsAreLoaded } from "../utils/fontReady";

// Returns true once the given font specs are loaded. Flips from false→true when
// web fonts finish loading, letting a board re-run measured fitting against real
// glyph metrics instead of fallback ones.
export function useFontsReady(specs) {
  const [ready, setReady] = useState(() => fontsAreLoaded(specs));
  useEffect(() => {
    if (ready) return;
    let alive = true;
    ensureFontsLoaded(specs).then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [ready, specs]);
  return ready;
}
