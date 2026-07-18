import {
  db,
  auth,
  assertFirebaseAvailable,
  signInWithGoogle,
  ref,
  set,
  get,
  remove,
  update,
  query,
  orderByChild,
  limitToLast,
  serverTimestamp,
} from "../../shared/utils/firebaseCore";
import { sanitizeString } from "./leaderIO";

/* ── Submit a crew leader to pending (requires sign-in) ── */

const SUBMIT_COOLDOWN_MS = 60_000; // 1 minute between submissions
let lastSubmitTime = 0;

async function hashLeader(leader) {
  const str = JSON.stringify({
    crewLeaderName: leader.crewLeaderName,
    slots: (leader.slots || []).map((s) => ({
      effectName: s.effectName,
      dice: s.dice,
      description: s.description,
    })),
  });
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function submitLeader(leader) {
  assertFirebaseAvailable("Leader sharing");
  // Require Google sign-in
  let user = auth.currentUser;
  if (!user) {
    const result = await signInWithGoogle();
    user = result.user;
  }
  if (!user) throw new Error("Sign-in required to share a crew leader.");

  // Reject default/empty leaders
  const DEFAULT_NAMES = ["CREW LEADER", ""];
  const leaderName = (leader.crewLeaderName || "").trim().toUpperCase();
  if (DEFAULT_NAMES.includes(leaderName)) {
    throw new Error("Please give your crew leader a name before sharing.");
  }

  // Require at least one slot with a non-empty description
  const DEFAULT_EFFECT_NAMES = ["AIRSTRIKE", "NITRO", "DRIFT", "REPAIR"];
  const slots = leader.slots || [];
  const allDefault = slots.every((s) =>
    DEFAULT_EFFECT_NAMES.includes((s.effectName || "").trim().toUpperCase()),
  );
  if (allDefault && slots.every((s) => !(s.description || "").trim())) {
    throw new Error("Please customize your effect slots before sharing.");
  }

  // Client-side cooldown
  const now = Date.now();
  if (now - lastSubmitTime < SUBMIT_COOLDOWN_MS) {
    const secs = Math.ceil(
      (SUBMIT_COOLDOWN_MS - (now - lastSubmitTime)) / 1000,
    );
    throw new Error(`Please wait ${secs}s before submitting again.`);
  }

  // Sanitize portrait — only allow data: URIs with image MIME types
  let portrait = null;
  if (
    leader.portraitDataUrl &&
    /^data:image\/(png|jpeg|gif|webp);base64,/.test(leader.portraitDataUrl)
  ) {
    portrait = leader.portraitDataUrl;
  }

  const sanitizedSlots = (leader.slots || []).map((s) => ({
    effectName: sanitizeString(s.effectName || ""),
    dice: sanitizeString(s.dice || ""),
    description: sanitizeString(s.description || ""),
  }));

  const payload = {
    crewLeaderName: sanitizeString(leader.crewLeaderName || "CREW LEADER"),
    crewLeaderTitle: sanitizeString(leader.crewLeaderTitle || ""),
    schemaVersion: leader.schemaVersion || 2,
    portraitDataUrl: portrait,
    specialAbilityName: sanitizeString(leader.specialAbilityName || ""),
    specialAbilityDescription: sanitizeString(leader.specialAbilityDescription || ""),
    slots: sanitizedSlots,
    commandTokens:
      typeof leader.commandTokens === "number"
        ? Math.max(0, Math.min(9, Math.round(leader.commandTokens)))
        : 0,
    accentColor: /^#[0-9a-f]{6}$/i.test(leader.accentColor)
      ? leader.accentColor
      : "#00ff00",
    nameColor: /^#[0-9a-f]{6}$/i.test(leader.nameColor)
      ? leader.nameColor
      : "#fff6d3",
    author_name: sanitizeString(leader.author_name || ""),
    revision_no: sanitizeString(leader.revision_no || ""),
    contact_info: sanitizeString(leader.contact_info || ""),
    author_description: sanitizeString(leader.author_description || ""),
    submittedBy: user.uid,
    createdAt: serverTimestamp(),
  };

  // Reject oversized payloads (>2MB) to protect free-tier storage
  if (portrait && portrait.length > 2_000_000) {
    throw new Error(
      "Leader data is too large to share. Try using a smaller portrait image.",
    );
  }

  // Use content hash as key — check for duplicates before writing
  const hash = await hashLeader(leader);
  const leaderRef = ref(db, `leaders/pending/${hash}`);
  const existing = await get(leaderRef);
  if (existing.exists()) {
    throw new Error("This crew leader has already been submitted and is awaiting review.");
  }
  const approvedRef = ref(db, `leaders/approved/${hash}`);
  const approved = await get(approvedRef);
  if (approved.exists()) {
    throw new Error("This crew leader is already in the community gallery.");
  }
  await set(leaderRef, payload);
  lastSubmitTime = Date.now();
  return hash;
}

/* ── Public: Read approved leaders ── */

export async function fetchApprovedLeaders(limit = 50) {
  assertFirebaseAvailable("Gallery");
  const q = query(
    ref(db, "leaders/approved"),
    orderByChild("createdAt"),
    limitToLast(limit),
  );
  const snapshot = await get(q);
  if (!snapshot.exists()) return [];
  const leaders = [];
  snapshot.forEach((child) => {
    leaders.push({ id: child.key, ...child.val() });
  });
  // newest first
  leaders.reverse();
  return leaders;
}

/* ── Admin: Moderation ── */

export async function fetchPendingLeaders() {
  assertFirebaseAvailable("Admin moderation");
  const snapshot = await get(ref(db, "leaders/pending"));
  if (!snapshot.exists()) return [];
  const leaders = [];
  snapshot.forEach((child) => {
    leaders.push({ id: child.key, ...child.val() });
  });
  leaders.reverse();
  return leaders;
}

export async function approveLeader(id) {
  assertFirebaseAvailable("Admin moderation");
  const snapshot = await get(ref(db, `leaders/pending/${id}`));
  if (!snapshot.exists()) throw new Error("Leader not found in pending");
  const leaderData = snapshot.val();
  leaderData.approvedAt = serverTimestamp();
  await update(ref(db), {
    [`leaders/approved/${id}`]: leaderData,
    [`leaders/pending/${id}`]: null,
  });
}

export async function rejectLeader(id) {
  assertFirebaseAvailable("Admin moderation");
  await remove(ref(db, `leaders/pending/${id}`));
}

export async function deleteApprovedLeader(id) {
  assertFirebaseAvailable("Gallery moderation");
  await remove(ref(db, `leaders/approved/${id}`));
}

export async function withdrawPendingLeader(hash) {
  assertFirebaseAvailable("Withdraw submission");
  const user = auth.currentUser;
  if (!user) throw new Error("Sign-in required to withdraw a submission.");
  const snapshot = await get(ref(db, `leaders/pending/${hash}`));
  if (!snapshot.exists()) return;
  const data = snapshot.val();
  if (data.submittedBy !== user.uid) throw new Error("You can only withdraw your own submissions.");
  await remove(ref(db, `leaders/pending/${hash}`));
}

export async function isPendingHashValid(hash) {
  assertFirebaseAvailable("Pending check");
  const snapshot = await get(ref(db, `leaders/pending/${hash}`));
  return snapshot.exists();
}

export async function deleteOwnLeader(id) {
  assertFirebaseAvailable("Leader deletion");
  const user = auth.currentUser;
  if (!user) throw new Error("Sign-in required to remove a leader.");
  const snapshot = await get(ref(db, `leaders/approved/${id}`));
  if (!snapshot.exists()) throw new Error("Leader not found in gallery.");
  const leaderData = snapshot.val();
  if (leaderData.submittedBy !== user.uid) {
    throw new Error("You can only remove leaders you submitted.");
  }
  await remove(ref(db, `leaders/approved/${id}`));
}
