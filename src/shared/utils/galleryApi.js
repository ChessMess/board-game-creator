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
} from "./firebaseCore";

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

async function hashObject(obj) {
  const str = JSON.stringify(obj);
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Builds a submit/fetch/moderate API for one entity type (heroes, leaders, ...)
// backed by a shared Firebase RTDB shape: {entityPath}/pending/{hash} and
// {entityPath}/approved/{id}.
export function createGalleryApi({
  entityPath,
  itemLabel,
  shortLabel = itemLabel,
  shortLabelPlural,
  hashFields,
  buildPayload,
  rejectIfDefault,
  maxPortraitBytes = 2_000_000,
  cooldownMs = 60_000,
}) {
  let lastSubmitTime = 0;

  async function submit(item) {
    assertFirebaseAvailable(`${capitalize(shortLabel)} sharing`);
    let user = auth.currentUser;
    if (!user) {
      const result = await signInWithGoogle();
      user = result.user;
    }
    if (!user) throw new Error(`Sign-in required to share a ${itemLabel}.`);

    const rejectReason = rejectIfDefault(item);
    if (rejectReason) throw new Error(rejectReason);

    const now = Date.now();
    if (now - lastSubmitTime < cooldownMs) {
      const secs = Math.ceil((cooldownMs - (now - lastSubmitTime)) / 1000);
      throw new Error(`Please wait ${secs}s before submitting again.`);
    }

    let portrait = null;
    if (
      item.portraitDataUrl &&
      /^data:image\/(png|jpeg|gif|webp);base64,/.test(item.portraitDataUrl)
    ) {
      portrait = item.portraitDataUrl;
    }

    const payload = buildPayload(item, { user, portrait });

    if (portrait && portrait.length > maxPortraitBytes) {
      throw new Error(
        `${capitalize(shortLabel)} data is too large to share. Try using a smaller portrait image.`,
      );
    }

    // Use content hash as key — check for duplicates before writing
    const hash = await hashObject(hashFields(item));
    const pendingRef = ref(db, `${entityPath}/pending/${hash}`);
    const existing = await get(pendingRef);
    if (existing.exists()) {
      throw new Error(
        `This ${itemLabel} has already been submitted and is awaiting review.`,
      );
    }
    const approvedRef = ref(db, `${entityPath}/approved/${hash}`);
    const approved = await get(approvedRef);
    if (approved.exists()) {
      throw new Error(`This ${itemLabel} is already in the community gallery.`);
    }
    await set(pendingRef, payload);
    lastSubmitTime = Date.now();
    return hash;
  }

  async function fetchApproved(limit = 50) {
    assertFirebaseAvailable("Gallery");
    const q = query(
      ref(db, `${entityPath}/approved`),
      orderByChild("createdAt"),
      limitToLast(limit),
    );
    const snapshot = await get(q);
    if (!snapshot.exists()) return [];
    const items = [];
    snapshot.forEach((child) => {
      items.push({ id: child.key, ...child.val() });
    });
    // newest first
    items.reverse();
    return items;
  }

  async function fetchPending() {
    assertFirebaseAvailable("Admin moderation");
    const snapshot = await get(ref(db, `${entityPath}/pending`));
    if (!snapshot.exists()) return [];
    const items = [];
    snapshot.forEach((child) => {
      items.push({ id: child.key, ...child.val() });
    });
    items.reverse();
    return items;
  }

  async function approve(id) {
    assertFirebaseAvailable("Admin moderation");
    const snapshot = await get(ref(db, `${entityPath}/pending/${id}`));
    if (!snapshot.exists())
      throw new Error(`${capitalize(shortLabel)} not found in pending`);
    const data = snapshot.val();
    data.approvedAt = serverTimestamp();
    // Atomic multi-path update: write to approved + delete from pending in one operation
    await update(ref(db), {
      [`${entityPath}/approved/${id}`]: data,
      [`${entityPath}/pending/${id}`]: null,
    });
  }

  async function reject(id) {
    assertFirebaseAvailable("Admin moderation");
    await remove(ref(db, `${entityPath}/pending/${id}`));
  }

  async function deleteApproved(id) {
    assertFirebaseAvailable("Gallery moderation");
    await remove(ref(db, `${entityPath}/approved/${id}`));
  }

  async function withdrawPending(hash) {
    assertFirebaseAvailable("Withdraw submission");
    const user = auth.currentUser;
    if (!user) throw new Error("Sign-in required to withdraw a submission.");
    const snapshot = await get(ref(db, `${entityPath}/pending/${hash}`));
    if (!snapshot.exists()) return; // already gone — silently OK
    const data = snapshot.val();
    if (data.submittedBy !== user.uid)
      throw new Error("You can only withdraw your own submissions.");
    await remove(ref(db, `${entityPath}/pending/${hash}`));
  }

  async function isPendingHashValid(hash) {
    assertFirebaseAvailable("Pending check");
    const snapshot = await get(ref(db, `${entityPath}/pending/${hash}`));
    return snapshot.exists();
  }

  async function deleteOwn(id) {
    assertFirebaseAvailable(`${capitalize(shortLabel)} deletion`);
    const user = auth.currentUser;
    if (!user) throw new Error(`Sign-in required to remove a ${shortLabel}.`);
    const snapshot = await get(ref(db, `${entityPath}/approved/${id}`));
    if (!snapshot.exists())
      throw new Error(`${capitalize(shortLabel)} not found in gallery.`);
    const data = snapshot.val();
    if (data.submittedBy !== user.uid) {
      throw new Error(`You can only remove ${shortLabelPlural} you submitted.`);
    }
    await remove(ref(db, `${entityPath}/approved/${id}`));
  }

  return {
    submit,
    fetchApproved,
    fetchPending,
    approve,
    reject,
    deleteApproved,
    withdrawPending,
    isPendingHashValid,
    deleteOwn,
  };
}
