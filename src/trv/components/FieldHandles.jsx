import { useState, useEffect } from "react";
import { getField, defaultBoxWidth } from "../utils/fieldRegistry";

// HTML overlay drawing the selection outline + resize/rotate/width handles for
// the selected field. Deliberately NOT part of the board SVG, so exports and
// snapshots never contain handle artifacts. Positions are projected from the
// field group's own getScreenCTM (which includes its move/rotate), recomputed
// on selection, edits (leader), zoom, scroll, and resize.
export default function FieldHandles({
  selectedId,
  leader,
  zoom,
  svgSelector,
  editor,
}) {
  const [geom, setGeom] = useState(null);

  useEffect(() => {
    if (!selectedId) {
      setGeom(null);
      return;
    }
    let raf = 0;
    const compute = () => {
      const svg = document.querySelector(svgSelector);
      const g = svg?.querySelector(`[data-field-id="${selectedId}"]`);
      const field = getField(selectedId);
      if (!g || !field) {
        setGeom(null);
        return;
      }
      let bbox;
      try {
        bbox = g.getBBox();
      } catch {
        return;
      }
      const ctm = g.getScreenCTM();
      if (!ctm || bbox.width === 0) {
        setGeom(null);
        return;
      }
      const project = (x, y) => {
        const p = new DOMPoint(x, y).matrixTransform(ctm);
        return { x: p.x, y: p.y };
      };
      // The selection box spans the CONTAINER (the fit-box width, from w) for
      // every field — so the orange outline and corner handles always match the
      // blue width nubs and widen together. Height is the text block's own
      // extent. One coherent box carries every handle. Local edge offsets undo
      // the field's anamorphic horizontal scaleX.
      const a = field.anchor;
      const scaleX = field.scaleX || 1;
      const w = leader.fieldStyles?.[selectedId]?.w ?? defaultBoxWidth(field);
      let leftLocal, rightLocal;
      if (a.textAnchor === "start") {
        leftLocal = a.x;
        rightLocal = a.x + w / scaleX;
      } else if (a.textAnchor === "end") {
        leftLocal = a.x - w / scaleX;
        rightLocal = a.x;
      } else {
        leftLocal = a.x - w / (2 * scaleX);
        rightLocal = a.x + w / (2 * scaleX);
      }
      const topLocal = bbox.y;
      const botLocal = bbox.y + bbox.height;
      const nw = project(leftLocal, topLocal);
      const ne = project(rightLocal, topLocal);
      const se = project(rightLocal, botLocal);
      const sw = project(leftLocal, botLocal);
      const topMid = { x: (nw.x + ne.x) / 2, y: (nw.y + ne.y) / 2 };
      const center = { x: (nw.x + se.x) / 2, y: (nw.y + se.y) / 2 };
      let nx = topMid.x - center.x;
      let ny = topMid.y - center.y;
      const len = Math.hypot(nx, ny) || 1;
      nx /= len;
      ny /= len;
      const rot = { x: topMid.x + nx * 26, y: topMid.y + ny * 26 };

      // Width nubs on the resizable container edge(s): a start box's left edge
      // and an end box's right edge are fixed by the layout, so no nub there.
      const midY = (topLocal + botLocal) / 2;
      const leftNub =
        a.textAnchor !== "start" ? project(leftLocal, midY) : null;
      const rightNub =
        a.textAnchor !== "end" ? project(rightLocal, midY) : null;

      setGeom({ nw, ne, se, sw, topMid, rot, leftNub, rightNub });
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [selectedId, leader, zoom, svgSelector]);

  if (!geom) return null;
  const { nw, ne, se, sw, topMid, rot, leftNub, rightNub } = geom;

  const corner = (pos, key, cursor) => (
    <div
      key={key}
      onPointerDown={(e) => editor.beginResize(e, selectedId)}
      style={{
        position: "fixed",
        left: pos.x - 6,
        top: pos.y - 6,
        width: 12,
        height: 12,
        background: "#f59e0b",
        border: "1px solid #fff",
        borderRadius: 2,
        cursor,
        pointerEvents: "auto",
        touchAction: "none",
        zIndex: 51,
      }}
    />
  );

  // Width nub: a large transparent hit area (easy to grab) with a small blue
  // bar centered on the true box edge.
  const widthHandle = (pos, key) => (
    <div
      key={key}
      onPointerDown={(e) => editor.beginWidth(e, selectedId)}
      title="Drag to change width (re-wraps text)"
      style={{
        position: "fixed",
        left: pos.x - 12,
        top: pos.y - 15,
        width: 24,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        cursor: "ew-resize",
        pointerEvents: "auto",
        touchAction: "none",
        zIndex: 53,
      }}
    >
      <div
        style={{
          width: 8,
          height: 22,
          background: "#38bdf8",
          border: "1px solid #fff",
          borderRadius: 2,
          boxShadow: "0 0 2px rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50 }}>
      <svg
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <polygon
          points={`${nw.x},${nw.y} ${ne.x},${ne.y} ${se.x},${se.y} ${sw.x},${sw.y}`}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <line
          x1={topMid.x}
          y1={topMid.y}
          x2={rot.x}
          y2={rot.y}
          stroke="#f59e0b"
          strokeWidth="1.5"
        />
      </svg>
      {corner(nw, "nw", "nwse-resize")}
      {corner(ne, "ne", "nesw-resize")}
      {corner(se, "se", "nwse-resize")}
      {corner(sw, "sw", "nesw-resize")}
      {leftNub && widthHandle(leftNub, "wl")}
      {rightNub && widthHandle(rightNub, "wr")}
      <div
        onPointerDown={(e) => editor.beginRotate(e, selectedId)}
        title="Rotate (Shift = free)"
        style={{
          position: "fixed",
          left: rot.x - 7,
          top: rot.y - 7,
          width: 14,
          height: 14,
          background: "#10b981",
          border: "2px solid #fff",
          borderRadius: "50%",
          cursor: "grab",
          pointerEvents: "auto",
          touchAction: "none",
          zIndex: 51,
        }}
      />
    </div>
  );
}
