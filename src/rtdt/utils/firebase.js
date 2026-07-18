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
import { sanitizeString } from "./heroIO";

/* ── Submit a hero to pending (requires sign-in) ── */

const SUBMIT_COOLDOWN_MS = 60_000; // 1 minute between submissions
let lastSubmitTime = 0;

async function hashHero(hero) {
  const str = JSON.stringify({
    name: hero.name,
    warriors: hero.warriors,
    spirit: hero.spirit,
    virtues: (hero.virtues || []).map((v) => ({
      name: v.name,
      line1: v.line1,
      line2: v.line2,
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

export async function submitHero(hero) {
  assertFirebaseAvailable("Hero sharing");
  // Require Google sign-in
  let user = auth.currentUser;
  if (!user) {
    const result = await signInWithGoogle();
    user = result.user;
  }
  if (!user) throw new Error("Sign-in required to share a hero.");

  // Reject default/empty heroes
  const DEFAULT_NAMES = ["HERO NAME", ""];
  const DEFAULT_VIRTUE_NAMES = [
    "VIRTUE",
    "VIRTUE 1",
    "VIRTUE 2",
    "VIRTUE 3",
    "VIRTUE 4",
    "VIRTUE 5",
    "VIRTUE 6",
  ];
  const heroName = (hero.name || "").trim().toUpperCase();
  if (DEFAULT_NAMES.includes(heroName)) {
    throw new Error("Please give your hero a name before sharing.");
  }
  const virtues = hero.virtues || [];
  if (virtues.length === 0) {
    throw new Error("Please add at least one virtue before sharing.");
  }
  const allDefault = virtues.every((v) =>
    DEFAULT_VIRTUE_NAMES.includes((v.name || "").trim().toUpperCase()),
  );
  if (allDefault) {
    throw new Error("Please customize your virtue names before sharing.");
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
    hero.portraitDataUrl &&
    /^data:image\/(png|jpeg|gif|webp);base64,/.test(hero.portraitDataUrl)
  ) {
    portrait = hero.portraitDataUrl;
  }

  const sanitizedVirtues = (hero.virtues || []).map((v) => ({
    name: sanitizeString(v.name || ""),
    type: ["advantage", "standard", "champion"].includes(v.type)
      ? v.type
      : "standard",
    description: sanitizeString(v.description || ""),
    kingdom: sanitizeString(v.kingdom || ""),
  }));

  const payload = {
    name: sanitizeString(hero.name || "HERO NAME"),
    schemaVersion: hero.schemaVersion || 2,
    warriors: hero.warriors,
    spirit: hero.spirit,
    portraitDataUrl: portrait,
    flavorText: sanitizeString(hero.flavorText || ""),
    bannerAction: sanitizeString(hero.bannerAction || ""),
    author_name: sanitizeString(hero.author_name || ""),
    revision_no: sanitizeString(hero.revision_no || ""),
    description: sanitizeString(hero.description || ""),
    virtues: sanitizedVirtues,
    theme: hero.theme || "orphaned_scion",
    customTheme: hero.theme === "custom" && hero.customTheme ? hero.customTheme : null,
    submittedBy: user.uid,
    createdAt: serverTimestamp(),
  };

  // Reject oversized payloads (>2MB) to protect free-tier storage
  if (portrait && portrait.length > 2_000_000) {
    throw new Error(
      "Hero data is too large to share. Try using a smaller portrait image.",
    );
  }

  // Use content hash as key — check for duplicates before writing
  const hash = await hashHero(hero);
  const heroRef = ref(db, `heroes/pending/${hash}`);
  const existing = await get(heroRef);
  if (existing.exists()) {
    throw new Error("This hero has already been submitted and is awaiting review.");
  }
  const approvedRef = ref(db, `heroes/approved/${hash}`);
  const approved = await get(approvedRef);
  if (approved.exists()) {
    throw new Error("This hero is already in the community gallery.");
  }
  await set(heroRef, payload);
  lastSubmitTime = Date.now();
  return hash;
}

/* ── Public: Read approved heroes ── */

export async function fetchApprovedHeroes(limit = 50) {
  assertFirebaseAvailable("Gallery");
  const q = query(
    ref(db, "heroes/approved"),
    orderByChild("createdAt"),
    limitToLast(limit),
  );
  const snapshot = await get(q);
  if (!snapshot.exists()) return [];
  const heroes = [];
  snapshot.forEach((child) => {
    heroes.push({ id: child.key, ...child.val() });
  });
  // newest first
  heroes.reverse();
  return heroes;
}

/* ── Admin: Moderation ── */

export async function fetchPendingHeroes() {
  assertFirebaseAvailable("Admin moderation");
  const snapshot = await get(ref(db, "heroes/pending"));
  if (!snapshot.exists()) return [];
  const heroes = [];
  snapshot.forEach((child) => {
    heroes.push({ id: child.key, ...child.val() });
  });
  heroes.reverse();
  return heroes;
}

export async function approveHero(id) {
  assertFirebaseAvailable("Admin moderation");
  const snapshot = await get(ref(db, `heroes/pending/${id}`));
  if (!snapshot.exists()) throw new Error("Hero not found in pending");
  const heroData = snapshot.val();
  heroData.approvedAt = serverTimestamp();
  // Atomic multi-path update: write to approved + delete from pending in one operation
  await update(ref(db), {
    [`heroes/approved/${id}`]: heroData,
    [`heroes/pending/${id}`]: null,
  });
}

export async function rejectHero(id) {
  assertFirebaseAvailable("Admin moderation");
  await remove(ref(db, `heroes/pending/${id}`));
}

export async function deleteApprovedHero(id) {
  assertFirebaseAvailable("Gallery moderation");
  await remove(ref(db, `heroes/approved/${id}`));
}

export async function withdrawPendingHero(hash) {
  assertFirebaseAvailable("Withdraw submission");
  const user = auth.currentUser;
  if (!user) throw new Error("Sign-in required to withdraw a submission.");
  const snapshot = await get(ref(db, `heroes/pending/${hash}`));
  if (!snapshot.exists()) return; // already gone — silently OK
  const data = snapshot.val();
  if (data.submittedBy !== user.uid) throw new Error("You can only withdraw your own submissions.");
  await remove(ref(db, `heroes/pending/${hash}`));
}

export async function isPendingHashValid(hash) {
  assertFirebaseAvailable("Pending check");
  const snapshot = await get(ref(db, `heroes/pending/${hash}`));
  return snapshot.exists();
}

export async function deleteOwnHero(id) {
  assertFirebaseAvailable("Hero deletion");
  const user = auth.currentUser;
  if (!user) throw new Error("Sign-in required to remove a hero.");
  const snapshot = await get(ref(db, `heroes/approved/${id}`));
  if (!snapshot.exists()) throw new Error("Hero not found in gallery.");
  const heroData = snapshot.val();
  if (heroData.submittedBy !== user.uid) {
    throw new Error("You can only remove heroes you submitted.");
  }
  await remove(ref(db, `heroes/approved/${id}`));
}
