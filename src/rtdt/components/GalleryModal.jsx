import {
  fetchApprovedHeroes,
  deleteApprovedHero,
  deleteOwnHero,
} from "../utils/firebase";
import { validateHeroData, heroToJson } from "../utils/heroIO";
import GalleryModal from "../../shared/components/GalleryModal";

export default function HeroGalleryModal({ onClose, onLoadHero, confirm }) {
  return (
    <GalleryModal
      onClose={onClose}
      onLoad={onLoadHero}
      confirm={confirm}
      title="Community Hero Gallery"
      itemLabel="hero"
      itemLabelPlural="heroes"
      fetchApproved={fetchApprovedHeroes}
      deleteApproved={deleteApprovedHero}
      deleteOwn={deleteOwnHero}
      validateData={(data) => {
        const result = validateHeroData(data);
        return result.valid ? { valid: true, item: result.hero } : result;
      }}
      toJson={heroToJson}
      getName={(hero) => hero.name}
      defaultName="HERO NAME"
      filenameFallback="hero"
      renderMeta={(hero) => (
        <>
          <span>W:{hero.warriors}</span>
          <span>S:{hero.spirit}</span>
          {hero.virtues && (
            <span>
              {hero.virtues.length} virtue{hero.virtues.length !== 1 ? "s" : ""}
            </span>
          )}
        </>
      )}
      renderTag={(hero) => (hero.virtues || []).map((v) => v.name).join(", ")}
    />
  );
}
