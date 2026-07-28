import { useRef } from "react";
import boardBg from "../assets/trv_board_bg.svg";
import {
  PORTRAIT,
  BACK_APP_TITLE_POS,
  BACK_HEADSHOT,
  BACK_VERSION_POS,
  BACK_AUTHOR_NAME_POS,
  BACK_CONTACT_POS,
  BACK_AUTHOR_DESC_POS,
} from "../utils/boardLayout";
import {
  FIELD_REGISTRY,
  getFieldValue,
  resolveFieldStyle,
  defaultBoxWidth,
} from "../utils/fieldRegistry";
import { fitText, clearMeasureCache, wrapText } from "../../shared/utils/textFit";
import { useFontsReady } from "../../shared/hooks/useFontsReady";
import { TRV_FONT_SPECS } from "../../shared/utils/fontReady";

// 5-point star polygon centered at origin, radius 12
const STAR_POINTS = (() => {
  const R = 12,
    r = 5,
    pts = [];
  for (let i = 0; i < 5; i++) {
    const aOuter = Math.PI / 2 + (2 * Math.PI * i) / 5;
    const aInner = aOuter + Math.PI / 5;
    pts.push(`${R * Math.cos(aOuter)},${-R * Math.sin(aOuter)}`);
    pts.push(`${r * Math.cos(aInner)},${-r * Math.sin(aInner)}`);
  }
  return pts.join(" ");
})();

// Group transform composing manual move/rotate with the field's baked scaleX.
// With no override (dx=dy=rotation=0, scaleX=1) this is the identity, so the
// default board renders exactly as before.
function fieldGroupTransform(field, { dx, dy, rotation }) {
  const { x, y } = field.anchor;
  return `translate(${dx} ${dy}) rotate(${rotation} ${x} ${y}) translate(${x} ${y}) scale(${field.scaleX} 1) translate(${-x} ${-y})`;
}

// Convert a field's guide box + anchor into the usable fit box {w,h}: measured
// from the text anchor toward the box edges, and (for upward-growing display
// fields) into an optional gap above the guide.
function usableBox(field) {
  const g = field.fitBox;
  const a = field.anchor;
  const gBottom = g.y + g.h;
  // Width (shared with the edge-handle drag so both agree on the baseline).
  const w = defaultBoxWidth(field);
  // Single-line fields are placed by their fixed baseline, so only width binds
  // (their design size already sat in the box). Multi-line blocks are bounded
  // by height in their growth direction: upward for bottom-anchored, down for top.
  const singleLine = (field.maxLines ?? (field.multiline ? 40 : 1)) <= 1;
  let h;
  if (singleLine) h = Infinity;
  else if (field.anchorV === "bottom") h = a.y - g.y + (field.gapBonus || 0);
  else h = gBottom - a.y;
  return { w, h };
}

// Measured auto-fit for a field. A manual font-size override pins the size
// (min == max), so the text lays out at exactly that size and may overflow —
// the user's explicit choice — while unset fields shrink to fit their box.
function fitField(field, value, style, override) {
  const manual = override && override.fontSize != null;
  const base = style.fontSize;
  const ub = usableBox(field);
  // A manual width override (from the edge handles) replaces the field's default
  // box width, re-wrapping the text within it.
  const box =
    override && override.w != null ? { w: override.w, h: ub.h } : ub;
  return fitText(value, {
    box,
    font: {
      family: style.fontFamily,
      weight: style.fontWeight,
      style: style.fontStyle,
      letterSpacing: field.letterSpacing || 0,
    },
    maxFontSize: base,
    minFontSize: manual ? base : Math.max(6, base * 0.4),
    scaleX: field.scaleX,
    lineHeightRatio: field.lineHeightRatio ?? 1.0,
    maxLines: field.maxLines ?? (field.multiline ? 40 : 1),
  });
}

// Renders one text block (shadow copy or real text) for a set of pre-wrapped lines.
function TextLines({ x, y, textAnchor, lineHeight, lines, style, fill, dx = 0, dy = 0, filter }) {
  return (
    <text
      x={x + dx}
      y={y + dy}
      textAnchor={textAnchor}
      filter={filter}
      style={{ ...style, fill }}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x + dx} dy={i === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

// A registry-driven text field with measured auto-fit. anchorV "bottom" keeps
// the last line's baseline at the anchor and grows earlier lines upward.
function FieldText({ field, value, style, override }) {
  const { x, y, textAnchor } = field.anchor;
  const { fill, fontFamily, fontWeight, fontStyle, letterSpacing, shadowOn, shadowColor, shadowSize, shadowOffset } = style;
  const { lines, fontSize, lineHeight } = fitField(field, value, style, override);
  const yOffset =
    field.anchorV === "bottom" ? -(lines.length - 1) * lineHeight : 0;
  const textStyle = { fontFamily, fontWeight, fontStyle, fontSize, letterSpacing };
  const shadowFilterId = `shadow-${field.id}`;
  return (
    <g data-field-id={field.id} transform={fieldGroupTransform(field, style)}>
      {shadowOn && (
        <>
          {/* feGaussianBlur/filter are never-rendered elements — no <defs> needed */}
          <filter id={shadowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={shadowSize * 0.5} />
          </filter>
          <TextLines
            x={x}
            y={y + yOffset}
            textAnchor={textAnchor}
            lineHeight={lineHeight}
            lines={lines}
            style={textStyle}
            fill={shadowColor}
            dx={shadowOffset}
            dy={shadowOffset * 1.4}
            filter={`url(#${shadowFilterId})`}
          />
        </>
      )}
      <TextLines
        x={x}
        y={y + yOffset}
        textAnchor={textAnchor}
        lineHeight={lineHeight}
        lines={lines}
        style={textStyle}
        fill={fill}
      />
    </g>
  );
}

// Dice value — a filled star polygon for command tokens, otherwise shrink-to-fit text.
function DiceField({ field, value, style, override }) {
  const { x, y } = field.anchor;
  const { fill, fontFamily, fontWeight, fontStyle, shadowOn, shadowColor, shadowSize, shadowOffset } = style;
  if (value === "★") {
    return (
      <g data-field-id={field.id} transform={fieldGroupTransform(field, style)}>
        <polygon
          points={STAR_POINTS}
          transform={`translate(${x}, ${y - 12})`}
          fill={fill}
        />
      </g>
    );
  }
  const { fontSize } = fitField(field, value, style, override);
  const textStyle = { fontFamily, fontWeight, fontStyle, fontSize };
  const shadowFilterId = `shadow-${field.id}`;
  return (
    <g data-field-id={field.id} transform={fieldGroupTransform(field, style)}>
      {shadowOn && (
        <>
          <filter id={shadowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={shadowSize * 0.5} />
          </filter>
          <text
            x={x + shadowOffset}
            y={y + shadowOffset * 1.4}
            textAnchor="middle"
            filter={`url(#${shadowFilterId})`}
            style={{ ...textStyle, fill: shadowColor }}
          >
            {value}
          </text>
        </>
      )}
      <text x={x} y={y} textAnchor="middle" style={{ ...textStyle, fill }}>
        {value}
      </text>
    </g>
  );
}

// Multi-line text block — Acumin Variable Concept (back-of-board metadata only)
function TextBlock({
  x,
  y,
  text,
  maxChars = 20,
  fontSize = "9px",
  fontWeight = 300,
  anchor = "middle",
}) {
  if (!text) return null;
  const lines = wrapText(text, maxChars);
  const lineHeight = Math.round(parseFloat(fontSize) * 1.3);
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      style={{
        fontFamily: "'Acumin Variable Concept', sans-serif",
        fontWeight,
        fontSize,
        fill: "#fff6d3",
      }}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export default function CrewLeaderBoard({ leader }) {
  const accent = leader.accentColor || "#00ff00";
  const nameClr = leader.nameColor || "#fff6d3";
  const fieldStyles = leader.fieldStyles || {};

  // Re-fit once real fonts load: drop fallback-metric measurements so the fits
  // below (which run during render) use correct glyph advances.
  const fontsReady = useFontsReady(TRV_FONT_SPECS);
  const clearedRef = useRef(false);
  if (fontsReady && !clearedRef.current) {
    clearMeasureCache();
    clearedRef.current = true;
  }

  return (
    <svg
      viewBox="0 0 1027.3709 789.92139"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      {/* Background — full punchboard */}
      <image href={boardBg} width="1027.3709" height="789.92139" />

      {/* ══════════════════════════════════════════════════════════ */}
      {/* LEFT SIDE = FRONT (game face — all editable content)     */}
      {/* ══════════════════════════════════════════════════════════ */}

      {/* Portrait */}
      <defs>
        <clipPath id="trvPortraitClip">
          {(() => {
            const B = 5; // bleed beyond guide to cover background frame art
            const C = 15; // chamfer inset for cut corners
            const l = PORTRAIT.x - B,
              t = PORTRAIT.y - B;
            const r = PORTRAIT.x + PORTRAIT.w + B,
              b = PORTRAIT.y + PORTRAIT.h + B;
            return (
              <polygon
                points={`${l + C},${t} ${r - C},${t} ${r},${t + C} ${r},${b - C} ${r - C},${b} ${l + C},${b} ${l},${b - C} ${l},${t + C}`}
              />
            );
          })()}
        </clipPath>
        <clipPath id="trvHeadshotClip">
          <ellipse
            cx={BACK_HEADSHOT.x + BACK_HEADSHOT.w / 2}
            cy={BACK_HEADSHOT.y + BACK_HEADSHOT.h / 2}
            rx={BACK_HEADSHOT.w / 2}
            ry={BACK_HEADSHOT.h / 2}
          />
        </clipPath>
      </defs>
      {leader.portraitDataUrl && (
        <image
          href={leader.portraitDataUrl}
          x={PORTRAIT.x - 5}
          y={PORTRAIT.y - 5}
          width={PORTRAIT.w + 10}
          height={PORTRAIT.h + 10}
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#trvPortraitClip)"
        />
      )}

      {/* Front editable fields — registry-driven, per-field style overrides */}
      {FIELD_REGISTRY.map((field) => {
        const value = getFieldValue(leader, field);
        if (field.kind === "number") {
          if (!(Number(value) > 0)) return null;
        } else if (!value) {
          return null;
        }
        const override = fieldStyles[field.id];
        const style = resolveFieldStyle(field, override, {
          accent,
          name: nameClr,
        });
        return field.kind === "dice" ? (
          <DiceField
            key={field.id}
            field={field}
            value={String(value)}
            style={style}
            override={override}
          />
        ) : (
          <FieldText
            key={field.id}
            field={field}
            value={String(value)}
            style={style}
            override={override}
          />
        );
      })}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* BACK METADATA (RIGHT side of board)                      */}
      {/* ══════════════════════════════════════════════════════════ */}

      {/* App title */}
      <text
        x={BACK_APP_TITLE_POS.x}
        y={BACK_APP_TITLE_POS.y}
        textAnchor={BACK_APP_TITLE_POS.anchor}
        style={{
          fontFamily: "'Compacta TRV', sans-serif",
          fontWeight: 400,
          fontSize: "22px",
          fill: "#fff6d3",
        }}
      >
        CREW LEADER CREATOR
      </text>

      {/* Back headshot */}
      {leader.portraitDataUrl && (
        <image
          href={leader.portraitDataUrl}
          x={BACK_HEADSHOT.x}
          y={BACK_HEADSHOT.y}
          width={BACK_HEADSHOT.w}
          height={BACK_HEADSHOT.h}
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#trvHeadshotClip)"
        />
      )}

      {/* Crew leader name — below headshot */}
      {leader.crewLeaderName && (
        <text
          x={BACK_HEADSHOT.x + BACK_HEADSHOT.w / 2}
          y={BACK_HEADSHOT.y + BACK_HEADSHOT.h + 20}
          textAnchor="middle"
          style={{
            fontFamily: "'Compacta TRV', sans-serif",
            fontWeight: 400,
            fontStyle: "italic",
            fontSize: "20px",
            fill: "#fff6d3",
          }}
        >
          {leader.crewLeaderName}
        </text>
      )}

      {/* Version */}
      {leader.revision_no && (
        <text
          x={BACK_VERSION_POS.x}
          y={BACK_VERSION_POS.y}
          textAnchor={BACK_VERSION_POS.anchor}
          style={{
            fontFamily: "'Acumin Variable Concept', sans-serif",
            fontWeight: 300,
            fontSize: "14px",
            fill: "#fff6d3",
          }}
        >
          {"Version: " + leader.revision_no}
        </text>
      )}

      {/* Author name */}
      {leader.author_name && (
        <text
          x={BACK_AUTHOR_NAME_POS.x}
          y={BACK_AUTHOR_NAME_POS.y}
          textAnchor={BACK_AUTHOR_NAME_POS.anchor}
          style={{
            fontFamily: "'Acumin Variable Concept', sans-serif",
            fontWeight: 600,
            fontSize: "18px",
            fill: "#fff6d3",
          }}
        >
          {"Designed by: " + leader.author_name}
        </text>
      )}

      {/* Contact info */}
      {leader.contact_info && (
        <text
          x={BACK_CONTACT_POS.x}
          y={BACK_CONTACT_POS.y}
          textAnchor={BACK_CONTACT_POS.anchor}
          style={{
            fontFamily: "'Acumin Variable Concept', sans-serif",
            fontWeight: 300,
            fontSize: "13px",
            fill: "#fff6d3",
          }}
        >
          {"Contact: " + leader.contact_info}
        </text>
      )}

      {/* Author description */}
      <TextBlock
        x={BACK_AUTHOR_DESC_POS.x}
        y={BACK_AUTHOR_DESC_POS.y}
        text={leader.author_description}
        maxChars={35}
        fontSize="14px"
      />
    </svg>
  );
}
