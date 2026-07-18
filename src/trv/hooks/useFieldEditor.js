import { useState, useRef, useCallback, useEffect } from "react";
import { getField, defaultBoxWidth } from "../utils/fieldRegistry";

// Whether a field wraps — only wrapping fields carry a width nub / fit-box.
const isWrapping = (field) =>
  (field.maxLines ?? (field.multiline ? 40 : 1)) > 1;

// Rotation snaps to this increment (Shift bypasses to free rotation).
const SNAP_DEG = 20;

const snap = (deg, free) => (free ? deg : Math.round(deg / SNAP_DEG) * SNAP_DEG);
const norm180 = (deg) => {
  let d = ((deg % 360) + 360) % 360;
  if (d > 180) d -= 360;
  return d;
};

// Owns the selected field and the active move/resize/rotate drag. All screen↔SVG
// mapping goes through the root SVG's getScreenCTM (which already reflects zoom
// and scroll); rotate/resize pivot on the field's anchor in board space.
export function useFieldEditor({ svgSelector, leader, updateFieldStyle }) {
  const [selectedId, setSelectedId] = useState(null);
  const dragRef = useRef(null);
  const leaderRef = useRef(leader);
  useEffect(() => {
    leaderRef.current = leader;
  }, [leader]);

  const getSvg = useCallback(
    () => document.querySelector(svgSelector),
    [svgSelector],
  );

  const toUser = (svg, clientX, clientY) => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  // Anchor position in board space (after the field's own translate), projected
  // to client px — the pivot for rotate/resize.
  const anchorPivot = (svg, field, override) => {
    const dx = override?.dx || 0;
    const dy = override?.dy || 0;
    const ctm = svg.getScreenCTM();
    return new DOMPoint(field.anchor.x + dx, field.anchor.y + dy).matrixTransform(
      ctm,
    );
  };

  const beginMove = useCallback(
    (e, id) => {
      const svg = getSvg();
      const field = getField(id);
      if (!svg || !field) return;
      const override = leaderRef.current.fieldStyles?.[id] || {};
      dragRef.current = {
        type: "move",
        id,
        startUser: toUser(svg, e.clientX, e.clientY),
        baseDx: override.dx || 0,
        baseDy: override.dy || 0,
      };
    },
    [getSvg],
  );

  const beginResize = useCallback(
    (e, id) => {
      e.stopPropagation();
      const svg = getSvg();
      const field = getField(id);
      if (!svg || !field) return;
      const override = leaderRef.current.fieldStyles?.[id] || {};
      const pivot = anchorPivot(svg, field, override);
      const el = svg.querySelector(`[data-field-id="${id}"] text`);
      const baseSize = el
        ? parseFloat(getComputedStyle(el).fontSize)
        : field.font.size;
      // For wrapping fields, resize scales the whole block: font AND wrap width
      // together (keeps the layout proportional and moves the width nubs with
      // the corners). Single-line fields have no width to scale.
      const wrapping = isWrapping(field);
      dragRef.current = {
        type: "resize",
        id,
        pivot,
        startDist: Math.hypot(e.clientX - pivot.x, e.clientY - pivot.y) || 1,
        baseSize,
        baseW: wrapping ? (override.w ?? defaultBoxWidth(field)) : null,
      };
    },
    [getSvg],
  );

  // Width handle: changes only the field's fit-box width (re-wrapping the text),
  // independent of the corner uniform-scale handles. The nub sits ON the box
  // edge, so we map the pointer straight to a box width ("edge follows pointer"):
  // grabbing yields the same width (no jump) and dragging keeps the edge under
  // the cursor (1:1 tracking). `side` locks a center-anchored field to the
  // grabbed edge so its mirror edge doesn't drive the width.
  const beginWidth = useCallback(
    (e, id) => {
      e.stopPropagation();
      const svg = getSvg();
      const field = getField(id);
      if (!svg || !field) return;
      const g = svg.querySelector(`[data-field-id="${id}"]`);
      const ctm = g && g.getScreenCTM();
      if (!g || !ctm) return;
      const local = new DOMPoint(e.clientX, e.clientY).matrixTransform(
        ctm.inverse(),
      );
      dragRef.current = {
        type: "width",
        id,
        side: local.x >= field.anchor.x ? "right" : "left",
      };
    },
    [getSvg],
  );

  const beginRotate = useCallback(
    (e, id) => {
      e.stopPropagation();
      const svg = getSvg();
      const field = getField(id);
      if (!svg || !field) return;
      const override = leaderRef.current.fieldStyles?.[id] || {};
      const pivot = anchorPivot(svg, field, override);
      dragRef.current = {
        type: "rotate",
        id,
        pivot,
        startAngle:
          (Math.atan2(e.clientY - pivot.y, e.clientX - pivot.x) * 180) / Math.PI,
        baseRot: override.rotation || 0,
      };
    },
    [getSvg],
  );

  // Board-level pointerdown: select + arm a move on a field, else deselect.
  const onBoardPointerDown = useCallback(
    (e) => {
      const hit = e.target.closest?.("[data-field-id]");
      if (hit) {
        const id = hit.getAttribute("data-field-id");
        setSelectedId(id);
        beginMove(e, id);
      } else {
        setSelectedId(null);
      }
    },
    [beginMove],
  );

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const svg = getSvg();
      if (!svg) return;
      if (d.type === "move") {
        const u = toUser(svg, e.clientX, e.clientY);
        updateFieldStyle(d.id, {
          dx: +(d.baseDx + (u.x - d.startUser.x)).toFixed(2),
          dy: +(d.baseDy + (u.y - d.startUser.y)).toFixed(2),
        });
      } else if (d.type === "resize") {
        const dist = Math.hypot(e.clientX - d.pivot.x, e.clientY - d.pivot.y);
        const size = Math.max(4, Math.min(400, (d.baseSize * dist) / d.startDist));
        const patch = { fontSize: +size.toFixed(1) };
        // Wrapping fields: scale the fit-box width by the same ratio so the
        // width nubs move with the corners and the wrap layout stays proportional.
        if (d.baseW != null) {
          const w = Math.max(8, Math.min(2000, (d.baseW * size) / d.baseSize));
          patch.w = +w.toFixed(1);
        }
        updateFieldStyle(d.id, patch);
      } else if (d.type === "width") {
        // Map the pointer into the field's LOCAL space (group CTM inverse handles
        // rotation), measure the signed distance from the anchor to the grabbed
        // edge, and convert to rendered box units by undoing the field's
        // horizontal scaleX (and doubling for a center-anchored box, which grows
        // from both edges). The grabbed edge tracks the pointer 1:1.
        const g = svg.querySelector(`[data-field-id="${d.id}"]`);
        const field = getField(d.id);
        const ctm = g && g.getScreenCTM();
        if (g && field && ctm) {
          const local = new DOMPoint(e.clientX, e.clientY).matrixTransform(
            ctm.inverse(),
          );
          const factor = field.anchor.textAnchor === "middle" ? 2 : 1;
          const reach =
            d.side === "left"
              ? field.anchor.x - local.x
              : local.x - field.anchor.x;
          const w = Math.max(
            8,
            Math.min(2000, Math.max(0, reach) * factor * field.scaleX),
          );
          updateFieldStyle(d.id, { w: +w.toFixed(1) });
        }
      } else if (d.type === "rotate") {
        const ang =
          (Math.atan2(e.clientY - d.pivot.y, e.clientX - d.pivot.x) * 180) /
          Math.PI;
        const rot = norm180(snap(d.baseRot + (ang - d.startAngle), e.shiftKey));
        updateFieldStyle(d.id, { rotation: +rot.toFixed(1) });
      }
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [getSvg, updateFieldStyle]);

  // Esc deselects; arrow keys nudge the selected field 1px (Shift = 10px).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setSelectedId(null);
        return;
      }
      if (!selectedId) return;
      const nudges = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const n = nudges[e.key];
      if (!n) return;
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const ov = leaderRef.current.fieldStyles?.[selectedId] || {};
      updateFieldStyle(selectedId, {
        dx: +((ov.dx || 0) + n[0] * step).toFixed(2),
        dy: +((ov.dy || 0) + n[1] * step).toFixed(2),
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, updateFieldStyle]);

  return {
    selectedId,
    setSelectedId,
    onBoardPointerDown,
    beginResize,
    beginWidth,
    beginRotate,
  };
}
