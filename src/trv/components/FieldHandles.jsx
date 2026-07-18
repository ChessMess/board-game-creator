import { useState, useEffect } from "react";

// HTML overlay drawing the selection outline + resize/rotate handles for the
// selected field. Deliberately NOT part of the board SVG, so exports/snapshots
// never contain handle artifacts. Positions are projected from the field
// group's own getScreenCTM (which includes its move/rotate), recomputed on
// selection, edits (leader), zoom, scroll, and resize.
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
      if (!g) {
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
      const nw = project(bbox.x, bbox.y);
      const ne = project(bbox.x + bbox.width, bbox.y);
      const se = project(bbox.x + bbox.width, bbox.y + bbox.height);
      const sw = project(bbox.x, bbox.y + bbox.height);
      const topMid = { x: (nw.x + ne.x) / 2, y: (nw.y + ne.y) / 2 };
      const center = { x: (nw.x + se.x) / 2, y: (nw.y + se.y) / 2 };
      const leftMid = { x: (nw.x + sw.x) / 2, y: (nw.y + sw.y) / 2 };
      const rightMid = { x: (ne.x + se.x) / 2, y: (ne.y + se.y) / 2 };
      // Push the width grips outward past the corner handles so they don't
      // stack on top of them (short single-line boxes cluster all handles).
      const edgeOut = (p, dist) => {
        const ox = p.x - center.x;
        const oy = p.y - center.y;
        const l = Math.hypot(ox, oy) || 1;
        return { x: p.x + (ox / l) * dist, y: p.y + (oy / l) * dist };
      };
      const leftGrab = edgeOut(leftMid, 20);
      const rightGrab = edgeOut(rightMid, 20);
      let nx = topMid.x - center.x;
      let ny = topMid.y - center.y;
      const len = Math.hypot(nx, ny) || 1;
      nx /= len;
      ny /= len;
      const rot = { x: topMid.x + nx * 26, y: topMid.y + ny * 26 };
      setGeom({ nw, ne, se, sw, topMid, leftGrab, rightGrab, rot });
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
  const { nw, ne, se, sw, topMid, leftGrab, rightGrab, rot } = geom;

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

  // Edge grips adjust only the box width (re-wraps text). A big transparent
  // hit area makes them easy to grab; a tall blue bar is the visible affordance.
  const widthHandle = (pos, key) => (
    <div
      key={key}
      onPointerDown={(e) => editor.beginWidth(e, selectedId)}
      title="Drag to change width (re-wraps text)"
      style={{
        position: "fixed",
        left: pos.x - 13,
        top: pos.y - 17,
        width: 26,
        height: 34,
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
          height: 24,
          background: "#38bdf8",
          border: "1px solid #fff",
          borderRadius: 2,
          boxShadow: "0 0 2px rgba(0,0,0,0.4)",
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
      {widthHandle(leftGrab, "wl")}
      {widthHandle(rightGrab, "wr")}
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
