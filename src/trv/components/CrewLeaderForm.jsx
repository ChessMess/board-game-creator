import { useState } from "react";
import CollapsibleSection from "../../shared/components/CollapsibleSection";
import { getField, resolveFieldStyle } from "../utils/fieldRegistry";
import { DEFAULT_EFFECT_NAMES } from "../data/defaultCrewLeader";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const inputClass =
  "mt-1 block w-full rounded bg-gray-700 border border-gray-600 px-2 py-1.5 text-gray-100 text-xs focus:outline-none focus:border-amber-500";

const labelClass = "block text-xs text-gray-400";

function Field({
  label,
  value,
  onChange,
  placeholder = "",
  maxLength,
  type = "text",
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder = "",
  maxLength,
  rows = 3,
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <textarea
        className={inputClass + " resize-none"}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </label>
  );
}

// Compact per-field style controls: color, bold, italic, size, reset.
// Values shown are the effective style (registry default unless overridden).
function FieldStyleStrip({ fieldId, override = {}, accent, nameColor, onChange, onReset }) {
  const field = getField(fieldId);
  if (!field) return null;
  const def = resolveFieldStyle(field, {}, { accent, name: nameColor });
  const effColor = override.color ?? def.fill ?? "#ffffff";
  const effSize = Math.round(override.fontSize ?? field.font.size);
  const effItalic = override.italic ?? field.font.style === "italic";
  const effBold = override.bold ?? field.font.weight >= 700;
  const effShadow = override.shadow ?? true;
  const effShadowColor = override.shadowColor ?? "#000000";
  const effShadowSize = override.shadowSize ?? 1;
  const effShadowOffset = override.shadowOffset ?? 1;
  const hasOverride = Object.keys(override).length > 0;
  const tgl = (active) =>
    "h-6 w-6 shrink-0 rounded border text-xs leading-none transition-colors " +
    (active
      ? "bg-amber-600 border-amber-500 text-white"
      : "bg-gray-700 border-gray-600 text-gray-400 hover:text-amber-400");
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      <input
        type="color"
        value={effColor}
        onChange={(e) => onChange(fieldId, { color: e.target.value })}
        title="Text color"
        className="h-6 w-6 shrink-0 rounded border border-gray-600 bg-gray-700 cursor-pointer p-0"
      />
      <button
        type="button"
        aria-pressed={effBold}
        title="Bold"
        onClick={() => onChange(fieldId, { bold: !effBold })}
        className={tgl(effBold) + " font-bold"}
      >
        B
      </button>
      <button
        type="button"
        aria-pressed={effItalic}
        title="Italic"
        onClick={() => onChange(fieldId, { italic: !effItalic })}
        className={tgl(effItalic) + " italic"}
      >
        I
      </button>
      <input
        type="number"
        min={6}
        max={200}
        value={effSize}
        title="Font size (px)"
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(fieldId, { fontSize: Number.isFinite(v) ? v : undefined });
        }}
        className="h-6 w-14 rounded bg-gray-700 border border-gray-600 px-1 text-gray-100 text-xs focus:outline-none focus:border-amber-500"
      />
      <span className="text-[10px] text-gray-500">px</span>
      <button
        type="button"
        aria-pressed={effShadow}
        title="Shadow"
        onClick={() => onChange(fieldId, { shadow: !effShadow })}
        className={tgl(effShadow)}
      >
        S
      </button>
      {effShadow && (
        <span className="inline-flex shrink-0 items-center gap-1.5">
          <input
            type="color"
            value={effShadowColor}
            onChange={(e) => onChange(fieldId, { shadowColor: e.target.value })}
            title="Shadow color"
            className="h-6 w-6 shrink-0 rounded border border-gray-600 bg-gray-700 cursor-pointer p-0"
          />
          <input
            type="number"
            min={0}
            max={5}
            step={0.5}
            value={effShadowSize}
            title="Shadow size (blur)"
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              onChange(fieldId, { shadowSize: Number.isFinite(v) ? v : undefined });
            }}
            className="h-6 w-12 rounded bg-gray-700 border border-gray-600 px-1 text-gray-100 text-xs focus:outline-none focus:border-amber-500"
          />
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={effShadowOffset}
            title="Shadow offset (distance)"
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              onChange(fieldId, { shadowOffset: Number.isFinite(v) ? v : undefined });
            }}
            className="h-6 w-12 rounded bg-gray-700 border border-gray-600 px-1 text-gray-100 text-xs focus:outline-none focus:border-amber-500"
          />
        </span>
      )}
      {hasOverride && (
        <button
          type="button"
          title="Reset this field's styling"
          onClick={() => onReset(fieldId)}
          className="ml-auto h-6 px-1.5 rounded border border-gray-600 text-gray-400 hover:text-amber-400 text-xs"
        >
          Reset
        </button>
      )}
    </div>
  );
}

function SlotSection({ index, slot, updateSlot, styleStrip }) {
  return (
    <div className="space-y-2 pt-2 border-t border-gray-700 first:border-t-0 first:pt-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
        Slot {index + 1}
      </p>

      <label className="block">
        <span className={labelClass}>Effect Name</span>
        <select
          className={inputClass}
          value={
            DEFAULT_EFFECT_NAMES.includes(slot.effectName)
              ? slot.effectName
              : "__custom__"
          }
          onChange={(e) => {
            if (e.target.value === "__custom__") {
              updateSlot("effectName", "");
            } else {
              updateSlot("effectName", e.target.value);
            }
          }}
        >
          {DEFAULT_EFFECT_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
          <option value="__custom__">Custom...</option>
        </select>
      </label>
      {!DEFAULT_EFFECT_NAMES.includes(slot.effectName) && (
        <Field
          label="Custom Effect Name"
          value={slot.effectName}
          onChange={(v) => updateSlot("effectName", v)}
          placeholder="EFFECT NAME"
          maxLength={20}
        />
      )}
      {styleStrip(`effect${index}`)}

      <label className="block">
        <span className={labelClass}>Dice Value</span>
        <div className="mt-1 flex gap-1">
          <input
            type="text"
            className="min-w-0 flex-1 rounded bg-gray-700 border border-gray-600 px-2 py-1.5 text-gray-100 text-xs focus:outline-none focus:border-amber-500 disabled:opacity-50"
            value={slot.dice === "★" ? "" : slot.dice}
            onChange={(e) => updateSlot("dice", e.target.value)}
            placeholder="ANY"
            maxLength={5}
            disabled={slot.dice === "★"}
          />
          <button
            type="button"
            onClick={() => updateSlot("dice", slot.dice === "★" ? "" : "★")}
            aria-pressed={slot.dice === "★"}
            title="Command token (★)"
            className={
              "shrink-0 w-8 rounded border text-sm transition-colors " +
              (slot.dice === "★"
                ? "bg-amber-600 border-amber-500 text-white"
                : "bg-gray-700 border-gray-600 text-gray-400 hover:text-amber-400 hover:border-amber-500")
            }
          >
            ★
          </button>
        </div>
      </label>
      {styleStrip(`dice${index}`)}

      <TextArea
        label="Description"
        value={slot.description}
        onChange={(v) => updateSlot("description", v)}
        placeholder="Rules text for this effect..."
        maxLength={200}
        rows={2}
      />
      {styleStrip(`desc${index}`)}
    </div>
  );
}

export default function CrewLeaderForm({
  leader,
  updateLeader,
  updateSlot,
  updateFieldStyle,
  resetFieldStyle,
  clearAllFieldStyles,
}) {
  const [openSections, setOpenSections] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("trv-sections"));
      if (saved) return saved;
    } catch {}
    return {
      identity: true,
      theme: false,
      special: false,
      slots: true,
      back: false,
      info: false,
    };
  });

  const toggle = (key) =>
    setOpenSections((s) => {
      const next = { ...s, [key]: !s[key] };
      localStorage.setItem("trv-sections", JSON.stringify(next));
      return next;
    });

  const loadPortraitFile = (file) => {
    if (!file || !ALLOWED_IMAGE_TYPES.has(file.type)) return;
    const reader = new FileReader();
    reader.onload = (e) => updateLeader("portraitDataUrl", e.target.result);
    reader.readAsDataURL(file);
  };

  const slots = leader.slots || [];
  const accent = leader.accentColor || "#00ff00";
  const nameColor = leader.nameColor || "#fff6d3";
  const fieldStyles = leader.fieldStyles || {};
  const overrideCount = Object.keys(fieldStyles).length;

  const styleStrip = (fieldId) => (
    <FieldStyleStrip
      fieldId={fieldId}
      override={fieldStyles[fieldId] || {}}
      accent={accent}
      nameColor={nameColor}
      onChange={updateFieldStyle}
      onReset={resetFieldStyle}
    />
  );

  return (
    <div className="space-y-5">
      {overrideCount > 0 && (
        <button
          type="button"
          onClick={clearAllFieldStyles}
          className="w-full rounded border border-gray-600 bg-gray-800 hover:border-amber-500 hover:text-amber-400 text-gray-300 text-[11px] py-1.5 uppercase tracking-wider transition-colors"
        >
          Clear all manual styling ({overrideCount})
        </button>
      )}

      {/* ── Crew Leader Identity ── */}
      <CollapsibleSection
        title="Crew Leader"
        isOpen={openSections.identity}
        onToggle={() => toggle("identity")}
      >
        <div className="space-y-3">
          <div>
            <Field
              label="Name"
              value={leader.crewLeaderName}
              onChange={(v) => updateLeader("crewLeaderName", v)}
              placeholder="CREW LEADER"
              maxLength={30}
            />
            {styleStrip("name")}
          </div>
          <div>
            <Field
              label="Nickname / Catchphrase"
              value={leader.crewLeaderTitle}
              onChange={(v) => updateLeader("crewLeaderTitle", v)}
              placeholder="e.g. THE STREET SERGEANT"
              maxLength={40}
            />
            {styleStrip("title")}
          </div>

          {/* Portrait upload */}
          <div>
            <span className={labelClass}>Portrait</span>
            {leader.portraitDataUrl ? (
              <div className="mt-1 relative">
                <img
                  src={leader.portraitDataUrl}
                  alt="Portrait preview"
                  className="w-full rounded border border-gray-600 object-cover"
                  style={{ maxHeight: "140px", objectFit: "cover" }}
                />
                <button
                  type="button"
                  onClick={() => updateLeader("portraitDataUrl", null)}
                  className="mt-1 text-[10px] text-red-400 hover:text-red-300 underline"
                >
                  Remove portrait
                </button>
              </div>
            ) : (
              <label className="mt-1 flex items-center justify-center rounded border border-dashed border-gray-600 hover:border-amber-500 py-4 cursor-pointer text-xs text-gray-500 hover:text-amber-400 transition-colors">
                <span>Click to upload portrait</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => loadPortraitFile(e.target.files?.[0])}
                />
              </label>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Special Ability ── */}
      <CollapsibleSection
        title="Special Ability"
        isOpen={openSections.special}
        onToggle={() => toggle("special")}
      >
        <div className="space-y-3">
          <div>
            <Field
              label="Ability Name"
              value={leader.specialAbilityName}
              onChange={(v) => updateLeader("specialAbilityName", v)}
              placeholder="e.g. JURY RIGGING"
              maxLength={30}
            />
            {styleStrip("abilityName")}
          </div>
          <div>
            <TextArea
              label="Ability Description"
              value={leader.specialAbilityDescription}
              onChange={(v) =>
                updateLeader("specialAbilityDescription", v)
              }
              placeholder="Rules text for special ability..."
              maxLength={300}
              rows={4}
            />
            {styleStrip("abilityDesc")}
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Effect Slots (2×2 grid) ── */}
      <CollapsibleSection
        title="Effect Slots"
        isOpen={openSections.slots}
        onToggle={() => toggle("slots")}
      >
        <div className="space-y-4">
          <p className="text-[10px] text-gray-500 leading-relaxed">
            4 effect slots sorted by dice value (lowest in Slot 1). Dice values:
            single digit (<span className="font-mono text-gray-300">6</span>),
            range (<span className="font-mono text-gray-300">1-3</span>),{" "}
            <span className="font-mono text-gray-300">ANY</span>, or{" "}
            <span className="font-mono text-gray-300">★</span> (command token).
          </p>
          {slots.map((slot, i) => (
            <SlotSection
              key={i}
              index={i}
              slot={slot}
              updateSlot={(field, value) => updateSlot(i, field, value)}
              styleStrip={styleStrip}
            />
          ))}

          {/* Command tokens */}
          <div className="pt-2 border-t border-gray-700">
            <label className="block">
              <span className={labelClass}>Command Tokens (0–9)</span>
              <input
                type="number"
                min={0}
                max={9}
                className={inputClass + " w-20"}
                value={leader.commandTokens}
                onChange={(e) =>
                  updateLeader(
                    "commandTokens",
                    Math.min(9, Math.max(0, parseInt(e.target.value) || 0)),
                  )
                }
              />
            </label>
            {leader.commandTokens > 0 && styleStrip("commandTokens")}
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Board Theme ── */}
      <CollapsibleSection
        title="Board Theme"
        isOpen={openSections.theme}
        onToggle={() => toggle("theme")}
      >
        <div className="space-y-3">
          <label className="block">
            <span className={labelClass}>Accent Color</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={leader.accentColor || "#00ff00"}
                onChange={(e) => updateLeader("accentColor", e.target.value)}
                className="h-8 w-10 rounded border border-gray-600 bg-gray-700 cursor-pointer"
              />
              <span className="text-xs text-gray-300 font-mono">
                {(leader.accentColor || "#00ff00").toUpperCase()}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-gray-500">
              Default for dice values and title (per-field color overrides win).
            </p>
          </label>
          <label className="block">
            <span className={labelClass}>Name Color</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={leader.nameColor || "#fff6d3"}
                onChange={(e) => updateLeader("nameColor", e.target.value)}
                className="h-8 w-10 rounded border border-gray-600 bg-gray-700 cursor-pointer"
              />
              <span className="text-xs text-gray-300 font-mono">
                {(leader.nameColor || "#fff6d3").toUpperCase()}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-gray-500">
              Default for the crew leader name (per-field color overrides win).
            </p>
          </label>
        </div>
      </CollapsibleSection>

      {/* ── Info / Back Metadata ── */}
      <CollapsibleSection
        title="Author Info"
        isOpen={openSections.info}
        onToggle={() => toggle("info")}
      >
        <div className="space-y-3">
          <Field
            label="Designer"
            value={leader.author_name}
            onChange={(v) => updateLeader("author_name", v)}
            placeholder="Your name"
          />
          <Field
            label="Revision"
            value={leader.revision_no}
            onChange={(v) => updateLeader("revision_no", v)}
            placeholder="v1.0"
          />
          <Field
            label="Contact"
            value={leader.contact_info}
            onChange={(v) => updateLeader("contact_info", v)}
            placeholder="URL or email"
          />
          <TextArea
            label="Description"
            value={leader.author_description}
            onChange={(v) => updateLeader("author_description", v)}
            placeholder="About the designer..."
            maxLength={300}
            rows={3}
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}
