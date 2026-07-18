import {
  fetchApprovedLeaders,
  deleteApprovedLeader,
  deleteOwnLeader,
} from "../utils/firebase";
import { validateLeaderData, leaderToJson } from "../utils/leaderIO";
import GalleryModal from "../../shared/components/GalleryModal";

export default function LeaderGalleryModal({ onClose, onLoadLeader, confirm }) {
  return (
    <GalleryModal
      onClose={onClose}
      onLoad={onLoadLeader}
      confirm={confirm}
      title="Community Crew Leader Gallery"
      itemLabel="crew leader"
      itemLabelPlural="crew leaders"
      shortLabel="leader"
      shortLabelPlural="leaders"
      fetchApproved={fetchApprovedLeaders}
      deleteApproved={deleteApprovedLeader}
      deleteOwn={deleteOwnLeader}
      validateData={(data) => {
        const result = validateLeaderData(data);
        return result.valid ? { valid: true, item: result.leader } : result;
      }}
      toJson={leaderToJson}
      getName={(leader) => leader.crewLeaderName}
      defaultName="CREW LEADER"
      filenameFallback="crew-leader"
      renderMeta={(leader) => (
        <>
          <span>{(leader.slots || []).length} slots</span>
          {leader.commandTokens > 0 && <span>{leader.commandTokens} cmd</span>}
          {leader.accentColor && (
            <span
              className="w-3 h-3 rounded-full border border-gray-600 inline-block"
              style={{ backgroundColor: leader.accentColor }}
              title={`Accent: ${leader.accentColor}`}
            />
          )}
        </>
      )}
      renderTag={(leader) =>
        (leader.slots || [])
          .map((s) => s.effectName)
          .filter(Boolean)
          .join(", ")
      }
    />
  );
}
