// Memoized base64 @font-face CSS for standalone SVG rasterization.
//
// When an SVG is loaded through an <img>/blob URL it becomes an isolated
// document — the page's @font-face rules do NOT cascade in. To render custom
// fonts in exported PNG/PDF we inline the font files as base64 @font-face rules
// inside the SVG clone. This is fetched + encoded once per font set and reused.
//
// INVARIANT: the descriptors below must mirror src/index.css exactly (same
// family / weight / style), so the rasterized output synthesizes obliques the
// same way the on-screen board does and the two stay pixel-consistent.

import compactaTrvUrl from "../../trv/assets/fonts/CompactaTRV.otf";
import compactaBtUrl from "../../trv/assets/fonts/CompactaBT-BoldItalic.otf";
import acuminUrl from "../../trv/assets/fonts/AcuminVariableConcept.otf";

async function fetchAsBase64DataUrl(url, mime = "font/otf") {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // Chunked to avoid a multi-MB per-character string concat.
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

const TRV_FACES = [
  { family: "Compacta TRV", url: compactaTrvUrl, weight: 400, style: "normal" },
  { family: "Compacta BT", url: compactaBtUrl, weight: 700, style: "italic" },
  {
    family: "Acumin Variable Concept",
    url: acuminUrl,
    weight: "100 900",
    style: "normal",
  },
];

async function buildCss(faces) {
  const parts = await Promise.all(
    faces.map(async (f) => {
      const data = await fetchAsBase64DataUrl(f.url);
      return `@font-face{font-family:'${f.family}';src:url('${data}') format('opentype');font-weight:${f.weight};font-style:${f.style};}`;
    }),
  );
  return parts.join("\n");
}

const cssCache = new Map();

// setKey: 'trv' embeds the TRV OTFs; 'rtdt' returns "" for now (Karma/Aleo load
// from Google Fonts and are not embedded yet — tracked as a follow-on).
export function getEmbeddedFontCSS(setKey = "trv") {
  if (cssCache.has(setKey)) return cssCache.get(setKey);
  const p = setKey === "trv" ? buildCss(TRV_FACES) : Promise.resolve("");
  cssCache.set(setKey, p);
  return p;
}
