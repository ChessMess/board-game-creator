import {
  fetchPendingLeaders,
  approveLeader,
  rejectLeader,
} from "../utils/firebase";
import { validateLeaderData } from "../utils/leaderIO";
import AdminPanel from "../../shared/components/AdminPanel";

export default function LeaderAdminPanel({ onClose, confirm }) {
  return (
    <AdminPanel
      onClose={onClose}
      confirm={confirm}
      title="Admin — Crew Leader Moderation"
      itemLabel="crew leader"
      shortLabel="leader"
      fetchPending={fetchPendingLeaders}
      approveItem={approveLeader}
      rejectItem={rejectLeader}
      validateData={(data) => {
        const result = validateLeaderData(data);
        return result.valid ? { valid: true, item: result.leader } : result;
      }}
      getName={(leader) => leader.crewLeaderName}
      defaultName="CREW LEADER"
      getDescription={(leader) => leader.author_description}
      renderMeta={(leader) => (
        <>
          {leader.author_name && <span>by {leader.author_name}</span>}
          {leader.revision_no && <span>{leader.revision_no}</span>}
          {leader.slots && (
            <span>
              {leader.slots.length} slot{leader.slots.length !== 1 ? "s" : ""}:{" "}
              {leader.slots.map((s) => s.effectName).join(", ")}
            </span>
          )}
          {leader.commandTokens > 0 && (
            <span>{leader.commandTokens} cmd tokens</span>
          )}
        </>
      )}
      handoffStorageKey="trv-leader-handoff"
      handoffField="leader"
      previewPath="trv"
    />
  );
}
