import { serverTimestamp } from "../../shared/utils/firebaseCore";
import { createGalleryApi } from "../../shared/utils/galleryApi";
import { sanitizeString } from "./leaderIO";
import {
  DEFAULT_CREW_LEADER_NAME,
  DEFAULT_EFFECT_NAMES,
} from "../data/defaultCrewLeader";

const DEFAULT_NAMES = [DEFAULT_CREW_LEADER_NAME, ""];

const api = createGalleryApi({
  entityPath: "leaders",
  itemLabel: "crew leader",
  shortLabel: "leader",
  shortLabelPlural: "leaders",

  hashFields: (leader) => ({
    crewLeaderName: leader.crewLeaderName,
    slots: (leader.slots || []).map((s) => ({
      effectName: s.effectName,
      dice: s.dice,
      description: s.description,
    })),
  }),

  buildPayload: (leader, { user, portrait }) => {
    const sanitizedSlots = (leader.slots || []).map((s) => ({
      effectName: sanitizeString(s.effectName || ""),
      dice: sanitizeString(s.dice || ""),
      description: sanitizeString(s.description || ""),
    }));

    return {
      crewLeaderName: sanitizeString(
        leader.crewLeaderName || DEFAULT_CREW_LEADER_NAME,
      ),
      crewLeaderTitle: sanitizeString(leader.crewLeaderTitle || ""),
      schemaVersion: leader.schemaVersion || 2,
      portraitDataUrl: portrait,
      specialAbilityName: sanitizeString(leader.specialAbilityName || ""),
      specialAbilityDescription: sanitizeString(
        leader.specialAbilityDescription || "",
      ),
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
  },

  rejectIfDefault: (leader) => {
    const leaderName = (leader.crewLeaderName || "").trim().toUpperCase();
    if (DEFAULT_NAMES.includes(leaderName)) {
      return "Please give your crew leader a name before sharing.";
    }
    const slots = leader.slots || [];
    const allDefault = slots.every((s) =>
      DEFAULT_EFFECT_NAMES.includes((s.effectName || "").trim().toUpperCase()),
    );
    if (allDefault && slots.every((s) => !(s.description || "").trim())) {
      return "Please customize your effect slots before sharing.";
    }
    return null;
  },

  maxPortraitBytes: 2_000_000,
  cooldownMs: 60_000,
});

export const submitLeader = api.submit;
export const fetchApprovedLeaders = api.fetchApproved;
export const fetchPendingLeaders = api.fetchPending;
export const approveLeader = api.approve;
export const rejectLeader = api.reject;
export const deleteApprovedLeader = api.deleteApproved;
export const withdrawPendingLeader = api.withdrawPending;
export const isPendingHashValid = api.isPendingHashValid;
export const deleteOwnLeader = api.deleteOwn;
