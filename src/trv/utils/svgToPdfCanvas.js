// TRV export helper — thin wrapper over the shared SVG rasterizer.
// Renders the live board SVG to a canvas with the TRV fonts embedded, so the
// browser paints the custom Fontself glyphs correctly (bypassing jsPDF/svg2pdf
// font issues). See src/shared/utils/svgRaster.js for the decode-safety and
// background-memoization details.

import { svgElementToCanvas } from "../../shared/utils/svgRaster";
import { getEmbeddedFontCSS } from "../../shared/utils/embeddedFonts";

export async function svgToCanvas(svgEl, width, height, scale = 3) {
  const fontCSS = await getEmbeddedFontCSS("trv");
  return svgElementToCanvas(svgEl, { width, height, scale, fontCSS });
}
