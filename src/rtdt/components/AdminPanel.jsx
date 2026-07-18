import {
  fetchPendingHeroes,
  approveHero,
  rejectHero,
} from "../utils/firebase";
import { validateHeroData } from "../utils/heroIO";
import AdminPanel from "../../shared/components/AdminPanel";

export default function HeroAdminPanel({ onClose, confirm }) {
  return (
    <AdminPanel
      onClose={onClose}
      confirm={confirm}
      title="Admin — Moderation"
      itemLabel="hero"
      fetchPending={fetchPendingHeroes}
      approveItem={approveHero}
      rejectItem={rejectHero}
      validateData={(data) => {
        const result = validateHeroData(data);
        return result.valid ? { valid: true, item: result.hero } : result;
      }}
      getName={(hero) => hero.name}
      defaultName="HERO NAME"
      getDescription={(hero) => hero.description}
      renderMeta={(hero) => (
        <>
          <span>
            W:{hero.warriors} S:{hero.spirit}
          </span>
          {hero.author_name && <span>by {hero.author_name}</span>}
          {hero.revision_no && <span>{hero.revision_no}</span>}
          {hero.virtues && (
            <span>
              {hero.virtues.length} virtue{hero.virtues.length !== 1 ? "s" : ""}
              : {hero.virtues.map((v) => v.name).join(", ")}
            </span>
          )}
        </>
      )}
      handoffStorageKey="rtdt-hero-handoff"
      handoffField="hero"
      previewPath="rtdt"
    />
  );
}
