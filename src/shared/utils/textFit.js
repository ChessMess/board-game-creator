// Measured text fitting for SVG boards.
//
// Measures real glyph advance via a hidden SVG <text> + getComputedTextLength()
// (the same engine that paints the board, so synthetic-oblique and variable-
// font advances match). Advance scales linearly with font-size, so each unique
// string is measured ONCE at a 100px reference and every other size is derived
// arithmetically; letter-spacing is added separately (it is size-independent).
//
// fitText() greedily word-wraps (hard-breaking over-long words) and binary-
// searches the largest font-size whose block fits the box in width AND height,
// modelling line height on cap-height (the board's guide boxes were drawn around
// caps, not the em square). Manual sizing is expressed as minFontSize == max.

const REF_SIZE = 100;
const XLINK_NS = "http://www.w3.org/2000/svg";

let probeSvg = null;
let probeText = null;

function ensureProbe() {
  if (probeSvg || typeof document === "undefined") return;
  probeSvg = document.createElementNS(XLINK_NS, "svg");
  probeSvg.setAttribute("aria-hidden", "true");
  // Non-zero, off-screen, hidden (NOT display:none — that zeroes text length).
  probeSvg.style.cssText =
    "position:absolute;left:-99999px;top:0;width:3000px;height:400px;visibility:hidden;pointer-events:none;overflow:hidden;";
  probeText = document.createElementNS(XLINK_NS, "text");
  probeText.setAttribute("x", "0");
  probeText.setAttribute("y", "200");
  probeSvg.appendChild(probeText);
  document.body.appendChild(probeSvg);
}

const advanceCache = new Map(); // key -> advance px at REF_SIZE (letter-spacing 0)
const capCache = new Map(); // fontKey -> cap-height ratio

// Drop cached measurements — call when web fonts finish loading, since anything
// measured against fallback metrics is now wrong.
export function clearMeasureCache() {
  advanceCache.clear();
  capCache.clear();
}

const fontKey = (f) => `${f.family}|${f.weight}|${f.style}`;

function applyProbeFont(font) {
  probeText.style.fontFamily = font.family;
  probeText.style.fontWeight = font.weight;
  probeText.style.fontStyle = font.style;
  probeText.style.fontSize = REF_SIZE + "px";
  probeText.style.letterSpacing = "0px";
}

function measureAdvance(text, font) {
  if (!text) return 0;
  const key = `${fontKey(font)}|${text}`;
  const cached = advanceCache.get(key);
  if (cached !== undefined) return cached;
  ensureProbe();
  if (!probeText) return text.length * REF_SIZE * 0.5; // non-browser fallback
  applyProbeFont(font);
  probeText.textContent = text;
  let adv;
  try {
    adv = probeText.getComputedTextLength();
  } catch {
    adv = text.length * REF_SIZE * 0.5;
  }
  advanceCache.set(key, adv);
  return adv;
}

function capRatio(font) {
  const key = fontKey(font);
  const cached = capCache.get(key);
  if (cached !== undefined) return cached;
  ensureProbe();
  let ratio = 0.72;
  if (probeText) {
    applyProbeFont(font);
    probeText.textContent = "H";
    try {
      const h = probeText.getBBox().height;
      if (h > 0 && isFinite(h)) ratio = h / REF_SIZE;
    } catch {
      /* keep default */
    }
  }
  capCache.set(key, ratio);
  return ratio;
}

// Width of `text` at `size`, derived from the reference-size advance.
function widthAt(text, font, size, letterSpacing) {
  const adv = (measureAdvance(text, font) / REF_SIZE) * size;
  const ls = (letterSpacing || 0) * Math.max(0, text.length - 1);
  return adv + ls;
}

// Longest prefix of `word` that fits `avail`, at least 1 char (binary search).
function longestPrefix(word, font, size, ls, avail) {
  let lo = 1,
    hi = word.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (widthAt(word.slice(0, mid), font, size, ls) <= avail) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

// Word-wrap text into lines respecting a character limit per line.
export function wrapText(text, maxChars = 26) {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    if (current && (current.length + 1 + word.length) > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function fitText(
  text,
  {
    box,
    font,
    maxFontSize,
    minFontSize = Math.max(6, maxFontSize * 0.45),
    scaleX = 1,
    lineHeightRatio = 1.0,
    maxLines = Infinity,
  },
) {
  const value = text == null ? "" : String(text);
  if (!value.trim()) {
    return {
      lines: [],
      fontSize: maxFontSize,
      lineHeight: maxFontSize * lineHeightRatio,
      overflow: false,
    };
  }

  const ls = font.letterSpacing || 0;
  const avail = box.w / scaleX; // wrap in untransformed units; scaleX paints wider/narrower
  const words = value.trim().split(/\s+/);

  const layout = (size) => {
    const lines = [];
    let cur = "";
    for (let word of words) {
      const cand = cur ? cur + " " + word : word;
      if (widthAt(cand, font, size, ls) <= avail) {
        cur = cand;
        continue;
      }
      if (cur) {
        lines.push(cur);
        cur = "";
      }
      if (widthAt(word, font, size, ls) <= avail) {
        cur = word;
        continue;
      }
      // Hard-break a word too long for the line.
      while (widthAt(word, font, size, ls) > avail && word.length > 1) {
        const k = longestPrefix(word, font, size, ls, avail);
        lines.push(word.slice(0, k));
        word = word.slice(k);
      }
      cur = word;
    }
    if (cur) lines.push(cur);

    const lineHeight = size * lineHeightRatio;
    const height = (lines.length - 1) * lineHeight + capRatio(font) * size;
    const widest = lines.reduce(
      (m, l) => Math.max(m, widthAt(l, font, size, ls)),
      0,
    );
    const fits =
      lines.length <= maxLines && height <= box.h && widest <= avail + 0.5;
    return { lines, lineHeight, fits };
  };

  let r = layout(maxFontSize);
  if (r.fits) {
    return {
      lines: r.lines,
      fontSize: maxFontSize,
      lineHeight: r.lineHeight,
      overflow: false,
    };
  }

  let lo = minFontSize,
    hi = maxFontSize;
  while (hi - lo > 0.5) {
    const mid = (lo + hi) / 2;
    if (layout(mid).fits) lo = mid;
    else hi = mid;
  }
  r = layout(lo);
  return {
    lines: r.lines,
    fontSize: lo,
    lineHeight: r.lineHeight,
    overflow: !r.fits,
  };
}
