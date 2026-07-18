// Unified SVG → canvas/PNG rasterization for both boards' export + snapshot.
//
// Two WebKit-specific hazards this addresses:
//   1. `img.onload` for an SVG source fires on document PARSE, not raster-
//      readiness. Nested <image> subresources (the board background wraps 18
//      lazily-decoding PNGs) may not have decoded yet, so a `drawImage` right
//      after `onload` bakes a partial frame — the "first export after refresh
//      is incomplete" bug. We `await img.decode()` at every load site.
//   2. Re-rasterizing the 7.5MB background on every export is wasteful and
//      widens the decode race. Background rasterization is memoized, and
//      `warmBoardAssets()` primes it at mount so export is a cache hit.

const XLINK = "http://www.w3.org/1999/xlink";

function nextFrames(n) {
  return new Promise((resolve) => {
    const step = (k) =>
      k <= 0 ? resolve() : requestAnimationFrame(() => step(k - 1));
    step(n);
  });
}

// Load an image and wait until it is actually decoded and safe to draw.
export async function loadImage(src) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  const loaded = new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image load failed"));
  });
  img.src = src;
  await loaded;
  if (typeof img.decode === "function") {
    // decode() is the real "ready to draw" contract; it can reject on SVG
    // images lacking intrinsic size in Safari, so fall back to an rAF settle.
    try {
      await img.decode();
    } catch {
      await nextFrames(2);
    }
  }
  return img;
}

const rasterCache = new Map();

// Rasterize an image URL (typically the board-background SVG) to a PNG data
// URL at the given scale. Memoized by url|w|h|scale (promise-memoized so
// concurrent callers dedupe).
export function rasterizeSvgUrl(href, w, h, scale = 3) {
  const key = `${href}|${w}|${h}|${scale}`;
  if (rasterCache.has(key)) return rasterCache.get(key);

  const p = (async () => {
    const img = await loadImage(href);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  })();

  rasterCache.set(key, p);
  return p;
}

// Render a live SVG element to a canvas: clone it, inline fonts + nested
// images, then draw the serialized SVG through the browser's own renderer.
export async function svgElementToCanvas(
  svgEl,
  { width, height, scale = 3, fontCSS = "", imageScale = 3 } = {},
) {
  const clone = svgEl.cloneNode(true);

  if (fontCSS) {
    const styleEl = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "style",
    );
    styleEl.textContent = fontCSS;
    clone.insertBefore(styleEl, clone.firstChild);
  }

  // Nested SVG-as-image doesn't render when the outer SVG is loaded as an
  // <img>; pre-rasterize every non-data <image> href to a PNG data URL.
  const images = Array.from(clone.querySelectorAll("image"));
  await Promise.all(
    images.map(async (imgEl) => {
      const href =
        imgEl.getAttribute("href") || imgEl.getAttributeNS(XLINK, "href");
      if (!href || href.startsWith("data:")) return;
      const iw = parseFloat(imgEl.getAttribute("width")) || width;
      const ih = parseFloat(imgEl.getAttribute("height")) || height;
      const png = await rasterizeSvgUrl(href, iw, ih, imageScale);
      if (imgEl.hasAttribute("href")) imgEl.setAttribute("href", png);
      if (imgEl.hasAttributeNS(XLINK, "href")) {
        imgEl.setAttributeNS(XLINK, "href", png);
      }
    }),
  );

  clone.setAttribute("width", width);
  clone.setAttribute("height", height);

  const svgString = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function svgElementToPngBlob(svgEl, opts) {
  const canvas = await svgElementToCanvas(svgEl, opts);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

// Fire-and-forget: prime the background raster (and, via getEmbeddedFontCSS in
// the caller, the font CSS) at mount so the first export/snapshot is a cache
// hit rather than a cold multi-MB decode on the click path.
export function warmBoardAssets({ svgSelector, width, height, scale = 3 } = {}) {
  try {
    const svgEl = document.querySelector(svgSelector);
    if (!svgEl) return;
    const imgEl = svgEl.querySelector("image");
    if (!imgEl) return;
    const href =
      imgEl.getAttribute("href") || imgEl.getAttributeNS(XLINK, "href");
    if (!href || href.startsWith("data:")) return;
    const iw = parseFloat(imgEl.getAttribute("width")) || width;
    const ih = parseFloat(imgEl.getAttribute("height")) || height;
    rasterizeSvgUrl(href, iw, ih, scale).catch(() => {});
  } catch {
    /* ignore */
  }
}
