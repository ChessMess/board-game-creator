import { useState } from "react";
import { useSnapshot } from "../../shared/hooks/useSnapshot";
import { sanitizeFilename as sanitizeFilenameBase } from "../../shared/utils/filenames";
import { rasterizeSvgUrl, loadImage } from "../../shared/utils/svgRaster";
import jsPDF from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import coverBg from "../assets/rtdt_cover2.jpg";

const sanitizeFilename = (name) =>
  sanitizeFilenameBase(name === "HERO NAME" ? null : name, "hero");

export function useExport({ hero, showAlert, showStatus }) {
  const [downloading, setDownloading] = useState(false);
  const snapshot = useSnapshot({
    subjectName: hero.name,
    svgSelector: "#hero-board-container svg",
    boardW: 1213,
    boardH: 808,
    filenameFallback: "hero",
    fontSetKey: "rtdt",
    showStatus,
  });

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const svgEl = document.querySelector("#hero-board-container svg");

      const images = svgEl.querySelectorAll("image");
      const origHrefs = [];
      for (const imgEl of images) {
        const href = imgEl.getAttribute("href") || "";
        origHrefs.push(href);
        if (href && !href.startsWith("data:")) {
          try {
            const w = parseFloat(imgEl.getAttribute("width")) || 1213;
            const h = parseFloat(imgEl.getAttribute("height")) || 808;
            const dataUrl = await rasterizeSvgUrl(href, w, h, 3);
            if (dataUrl) imgEl.setAttribute("href", dataUrl);
          } catch (e) {
            console.warn("Could not rasterize image for PDF:", e);
          }
        }
      }

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1213, 808],
      });
      await svg2pdf(svgEl, doc, { x: 0, y: 0, width: 1213, height: 808 });

      const imagesAfter = svgEl.querySelectorAll("image");
      imagesAfter.forEach((imgEl, i) => {
        if (origHrefs[i]) imgEl.setAttribute("href", origHrefs[i]);
      });

      // Page 2 — back side
      doc.addPage([1213, 808], "landscape");

      const coverImg = await loadImage(coverBg);
      const coverCanvas = document.createElement("canvas");
      coverCanvas.width = coverImg.naturalWidth;
      coverCanvas.height = coverImg.naturalHeight;
      coverCanvas.getContext("2d").drawImage(coverImg, 0, 0);
      const coverDataUrl = coverCanvas.toDataURL("image/jpeg", 0.92);
      const imgRatio = coverImg.naturalWidth / coverImg.naturalHeight;
      const pageRatio = 1213 / 808;
      let drawW, drawH;
      if (imgRatio > pageRatio) {
        drawW = 1213;
        drawH = 1213 / imgRatio;
      } else {
        drawH = 808;
        drawW = 808 * imgRatio;
      }
      const drawX = (1213 - drawW) / 2;
      const drawY = (808 - drawH) / 2;

      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, 1213, 808, "F");
      doc.addImage(coverDataUrl, "JPEG", drawX, drawY, drawW, drawH);

      doc.setGState(new doc.GState({ opacity: 0.5 }));
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, 1213, 808, "F");
      doc.setGState(new doc.GState({ opacity: 1 }));

      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(252, 211, 77);
      doc.text("Return to Dark Tower Hero Board Creator", 1213 / 2, 120, {
        align: "center",
      });

      const hasInfo =
        hero.author_name ||
        hero.revision_no ||
        hero.contact ||
        hero.description;
      if (hasInfo) {
        const boxX = 1213 * 0.035;
        const boxW = 1213 * 0.93;
        const boxY = 160;
        let textY = boxY + 40;

        let boxH = 60;
        if (hero.author_name) boxH += 30;
        if (hero.revision_no) boxH += 26;
        if (hero.contact) boxH += 26;
        if (hero.description) {
          const descLines = doc.splitTextToSize(hero.description, boxW - 60);
          boxH += 20 + descLines.length * 18;
        }

        doc.setGState(new doc.GState({ opacity: 0.5 }));
        doc.setFillColor(161, 98, 7);
        doc.roundedRect(boxX, boxY, boxW, boxH, 24, 24, "F");
        doc.setGState(new doc.GState({ opacity: 1 }));

        const labelX = boxX + 30;
        const centerX = 1213 / 2;

        if (hero.author_name) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          doc.setTextColor(243, 244, 246);
          const label = "Designed by: ";
          const labelW = doc.getTextWidth(label);
          doc.setTextColor(253, 230, 138);
          const nameW = doc.getTextWidth(hero.author_name);
          const totalW = labelW + nameW;
          const startX = centerX - totalW / 2;
          doc.setTextColor(243, 244, 246);
          doc.text(label, startX, textY);
          doc.setTextColor(253, 230, 138);
          doc.text(hero.author_name, startX + labelW, textY);
          textY += 30;
        }
        if (hero.revision_no) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(14);
          doc.setTextColor(209, 213, 219);
          const label = "Hero Version: ";
          const labelW = doc.getTextWidth(label);
          doc.setFont("courier", "normal");
          const valW = doc.getTextWidth(hero.revision_no);
          const totalW = labelW + valW;
          const startX = centerX - totalW / 2;
          doc.setFont("helvetica", "normal");
          doc.text(label, startX, textY);
          doc.setFont("courier", "normal");
          doc.text(hero.revision_no, startX + labelW, textY);
          textY += 26;
        }
        if (hero.contact) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(14);
          doc.setTextColor(209, 213, 219);
          doc.text("Contact: ", labelX, textY);
          const labelW = doc.getTextWidth("Contact: ");
          doc.setFont("courier", "normal");
          doc.text(hero.contact, labelX + labelW, textY);
          textY += 26;
        }
        if (hero.description) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(14);
          doc.setTextColor(229, 231, 235);
          textY += 10;
          const descLines = doc.splitTextToSize(hero.description, boxW - 60);
          doc.text(descLines, labelX, textY);
        }
      }

      doc.save(`${sanitizeFilename(hero.name)}-hero-board.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      showAlert({
        title: "PDF Export Failed",
        message: "PDF export failed. Please try again.",
      });
    } finally {
      setDownloading(false);
    }
  };

  return { downloading, handleDownloadPdf, ...snapshot };
}
