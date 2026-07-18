import {
  SLOT_POSITIONS,
  ADV_HOME, ADV_HOME_SLOT,
  STD_HOME, STD_HOME_SLOT,
  CHP_HOME, CHP_HOME_SLOT,
  ADV_TITLE_OFFSET, ADV_DESC_OFFSET,
  STD_TITLE_OFFSET, STD_DESC_OFFSET,
  CHP_TITLE_OFFSET, CHP_DESC_OFFSET,
  MOVE_SUBTITLE_POS, MOVE_INSTRUCTIONS_POS,
  BATTLE_SUBTITLE_POS, QUEST_SUBTITLE_POS,
  CLEANSE_SUBTITLE_POS, REINFORCE_SUBTITLE_POS,
  CITADEL_INSTRUCTIONS_POS, SANCTUARY_INSTRUCTIONS_POS,
  VILLAGE_INSTRUCTIONS_POS, BAZAAR_INSTRUCTIONS_POS,
  END_OF_TURN_POS,
} from '../utils/boardLayout';
import { IconTextLine, IconTextBlock } from '../utils/iconText';
import { wrapText } from '../../shared/utils/textFit';

function splitFlavor(text) {
  if (!text) return ['', '', ''];
  if (text.length <= 40) return [text, '', ''];
  const mid1 = text.lastIndexOf(' ', 40);
  const s1 = mid1 > 0 ? mid1 : 40;
  const line1 = text.slice(0, s1);
  const rest = text.slice(s1 === mid1 ? s1 + 1 : s1);
  if (rest.length <= 40) return [line1, rest, ''];
  const mid2 = rest.lastIndexOf(' ', 40);
  const s2 = mid2 > 0 ? mid2 : 40;
  return [line1, rest.slice(0, s2), rest.slice(s2 === mid2 ? s2 + 1 : s2)];
}

// Empty placeholder path data (from virtue_empty.svg, single path)
const EMPTY_PATH_D = "M 0,0 C -2.894,0 -5.242,2.344 -5.242,5.237 L -5.25,6.654 c 0,1.768 -1.442,3.198 -3.211,3.198 h -3.718 c -2.893,0 -5.237,2.348 -5.237,5.241 v 2.585 c 0,1.936 -1.12,3.64 -2.842,4.352 -2.55,1.039 -4.336,3.606 -4.336,6.225 v 5.353 c 0,1.713 -0.708,3.533 -2.107,5.4 -0.421,0.571 -0.412,1.344 0.025,1.932 1.276,1.696 1.945,3.507 1.945,5.242 l 0.137,6.679 c 0,2.735 1.726,5.242 4.284,6.267 1.731,0.696 2.894,2.447 2.894,4.371 v 2.584 c 0,2.893 2.353,5.241 5.237,5.241 h 3.516 c 1.837,0 3.361,1.494 3.395,3.331 l 0.026,1.258 c 0,2.92 2.357,5.268 5.242,5.268 h 137.613 c 2.885,0 5.241,-2.348 5.241,-5.242 l 0.026,-1.284 c 0.034,-1.837 1.555,-3.331 3.391,-3.331 h 3.516 c 2.885,0 5.241,-2.348 5.241,-5.241 v -2.584 c 0,-1.924 1.159,-3.675 2.894,-4.371 2.558,-1.025 4.28,-3.532 4.28,-6.232 l 0.142,-6.749 c 0,-1.7 0.67,-3.511 1.944,-5.207 0.439,-0.588 0.446,-1.361 0.026,-1.932 -1.4,-1.867 -2.112,-3.687 -2.112,-5.4 v -5.353 c 0,-2.619 -1.782,-5.186 -4.332,-6.225 -1.725,-0.712 -2.842,-2.416 -2.842,-4.352 v -2.585 c 0,-2.893 -2.356,-5.241 -5.241,-5.241 h -3.718 c -1.763,0 -3.206,-1.43 -3.215,-3.198 V 5.246 C 142.854,2.344 140.498,0 137.613,0 Z";

function EmptyPlaceholder({ slotPos, themeColors }) {
  return (
    <path
      d={EMPTY_PATH_D}
      style={{ fill: themeColors.emptyPlaceholderFill, fillOpacity: 1, fillRule: 'nonzero', stroke: 'none' }}
      opacity="0.55"
      transform={`matrix(1.3333333,0,0,-1.3333333,${slotPos.x},${slotPos.y})`}
    />
  );
}

function AdvantageArtwork({ slotPos, url }) {
  const dx = slotPos.x - ADV_HOME_SLOT.x;
  const dy = slotPos.y - ADV_HOME_SLOT.y;
  return (
    <image
      href={url}
      x={ADV_HOME.x + dx}
      y={ADV_HOME.y + dy}
      width={ADV_HOME.w}
      height={ADV_HOME.h}
    />
  );
}

function StandardArtwork({ slotPos, url }) {
  const dx = slotPos.x - STD_HOME_SLOT.x;
  const dy = slotPos.y - STD_HOME_SLOT.y;
  return (
    <image
      href={url}
      x={STD_HOME.x + dx}
      y={STD_HOME.y + dy}
      width={STD_HOME.w}
      height={STD_HOME.h}
    />
  );
}

function AdvantageDefaultArtwork({ slotPos, url }) {
  const dx = slotPos.x - ADV_HOME_SLOT.x;
  const dy = slotPos.y - ADV_HOME_SLOT.y;
  return (
    <image
      href={url}
      x={ADV_HOME.x + dx}
      y={ADV_HOME.y + dy}
      width={ADV_HOME.w}
      height={ADV_HOME.h}
    />
  );
}

function StandardDefaultArtwork({ slotPos, url }) {
  const dx = slotPos.x - STD_HOME_SLOT.x;
  const dy = slotPos.y - STD_HOME_SLOT.y;
  return (
    <image
      href={url}
      x={STD_HOME.x + dx}
      y={STD_HOME.y + dy}
      width={STD_HOME.w}
      height={STD_HOME.h}
    />
  );
}

function ChampionArtwork({ slotPos, url }) {
  const dx = slotPos.x - CHP_HOME_SLOT.x;
  const dy = slotPos.y - CHP_HOME_SLOT.y;
  return (
    <image
      href={url}
      x={CHP_HOME.x + dx}
      y={CHP_HOME.y + dy}
      width={CHP_HOME.w}
      height={CHP_HOME.h}
    />
  );
}

function VirtueTitle({ slotPos, offset, children, fontSize = '11.25px', themeColors }) {
  return (
    <text
      transform={`matrix(1.3333333,0,0,1.0666667,${slotPos.x + offset.x},${slotPos.y + offset.y})`}
      textAnchor="middle"
      style={{
        fontFamily: 'Karma, serif',
        fontWeight: 700,
        fontSize,
        fill: themeColors.virtueTitleFill,
      }}
    >
      <tspan x="0" y="0">{children}</tspan>
    </text>
  );
}

function VirtueSlot({ slotIndex, virtue, slotPos, hero, themedUrls, themeColors }) {
  if (!virtue) {
    return <EmptyPlaceholder slotPos={slotPos} themeColors={themeColors} />;
  }

  const isChampion = virtue.type === 'champion';
  const isAdvantage = virtue.type === 'advantage' || virtue.type === 'advantage_default';
  const isStandard = virtue.type === 'standard' || virtue.type === 'standard_default';

  // Champion uses its own artwork frame and text offsets
  if (isChampion) {
    const kingdom = virtue.kingdom || '';
    const titleLine1 = kingdom ? 'CHAMPION OF' : 'CHAMPION';
    const titleLine2 = kingdom ? `THE ${kingdom}` : 'ABILITY';
    return (
      <g>
        <ChampionArtwork slotPos={slotPos} url={themedUrls.championUrl} />
        {/* 2-line champion title (centered) */}
        <text
          transform={`matrix(1.3333333,0,0,1.0666667,${slotPos.x + CHP_TITLE_OFFSET.x},${slotPos.y + CHP_TITLE_OFFSET.y})`}
          textAnchor="middle"
          style={{
            fontFamily: 'Karma, serif',
            fontWeight: 700,
            fontSize: '9.5px',
            fill: themeColors.virtueTitleFill,
          }}
        >
          <tspan x="0" y="0">{titleLine1}</tspan>
          <tspan x="0" y="12">{titleLine2}</tspan>
        </text>
        {/* Champion body text */}
        <text
          transform={`matrix(1.3333333,0,0,1.3333333,${slotPos.x + CHP_DESC_OFFSET.x},${slotPos.y + CHP_DESC_OFFSET.y})`}
          textAnchor="middle"
          style={{
            fontFamily: 'Karma, serif',
            fontWeight: 700,
            fontSize: '9px',
            fill: themeColors.textPrimary,
          }}
        >
          {wrapText(virtue.description).map((line, i) => (
            <tspan key={i} x="0" y={i * 10.5}>{line}</tspan>
          ))}
        </text>
      </g>
    );
  }

  const titleOffset = isAdvantage ? ADV_TITLE_OFFSET : STD_TITLE_OFFSET;
  const descOffset = isAdvantage ? ADV_DESC_OFFSET : STD_DESC_OFFSET;

  return (
    <g>
      {virtue.type === 'advantage' && <AdvantageArtwork slotPos={slotPos} url={themedUrls.advantageUrl} />}
      {virtue.type === 'advantage_default' && <AdvantageDefaultArtwork slotPos={slotPos} url={themedUrls.advantageDefaultUrl} />}
      {virtue.type === 'standard' && <StandardArtwork slotPos={slotPos} url={themedUrls.standardUrl} />}
      {virtue.type === 'standard_default' && <StandardDefaultArtwork slotPos={slotPos} url={themedUrls.standardDefaultUrl} />}

      {/* Virtue name */}
      <VirtueTitle slotPos={slotPos} offset={titleOffset} themeColors={themeColors}>
        {virtue.name}
      </VirtueTitle>

      {/* Body text */}
      <text
        transform={`matrix(1.3333333,0,0,1.3333333,${slotPos.x + descOffset.x},${slotPos.y + descOffset.y})`}
        textAnchor="middle"
        style={{
          fontFamily: 'Karma, serif',
          fontWeight: 700,
          fontSize: '9px',
          fill: themeColors.textPrimary,
        }}
      >
        {wrapText(virtue.description).map((line, i) => (
          <tspan key={i} x="0" y={i * 10.5}>{line}</tspan>
        ))}
      </text>
    </g>
  );
}

export default function HeroBoard({ hero, themedUrls, themeColors }) {
  return (
    <svg
      viewBox="0 0 1213.228 807.6853"
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: 'Karma, serif' }}
    >
      {/* Themed background */}
      <image href={themedUrls.boardBgUrl} width="1213.228" height="807.6853" />

      {/* Portrait */}
      <defs>
        <clipPath id="portraitClip">
          <rect x="-18.59" y="112.27" width="355.53" height="524.08" />
        </clipPath>
      </defs>
      {hero.portraitDataUrl && (
        <image
          href={hero.portraitDataUrl}
          x="-18.59"
          y="112.27"
          width="355.53"
          height="524.08"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#portraitClip)"
        />
      )}

      {/* 6 virtue slots */}
      {SLOT_POSITIONS.map((pos, i) => (
        <VirtueSlot
          key={i}
          slotIndex={i}
          virtue={hero.virtues[i]}
          slotPos={pos}
          hero={hero}
          themedUrls={themedUrls}
          themeColors={themeColors}
        />
      ))}

      {/* Hero name */}
      <text
        transform="matrix(1.333,0,0,1.235,28.66,50.53)"
        style={{
          fontFamily: 'Karma, serif',
          fontWeight: 700,
          fontSize: '25.92px',
          fill: themeColors.textPrimary,
        }}
      >
        <tspan x="0" y="0">{hero.name}</tspan>
      </text>

      {/* Starts-with warriors value */}
      <text
        transform="matrix(1.3333333,0,0,1.3333333,104.18,89.68)"
        textAnchor="end"
        style={{
          fontFamily: 'Karma, serif',
          fontWeight: 700,
          fontSize: '7.5px',
          fill: themeColors.textSecondary,
        }}
      >
        <tspan x="0" y="0">{hero.warriors}</tspan>
      </text>

      {/* Starts-with spirit value */}
      <text
        transform="matrix(1.3333333,0,0,1.3333333,138.40,89.50)"
        style={{
          fontFamily: 'Karma, serif',
          fontWeight: 700,
          fontSize: '7.5px',
          fill: themeColors.textSecondary,
        }}
      >
        <tspan x="0" y="0">{hero.spirit}</tspan>
      </text>

      {/* Banner action text */}
      <g transform="matrix(1.333,0,0,1.333,410.58,90.96)">
        <IconTextLine
          text={hero.bannerAction}
          x={0} y={0}
          textAnchor="start"
          fontSize={9}
          style={{ fontFamily: 'Karma, serif', fontWeight: 600, fontSize: '9px', fill: themeColors.textPrimary }}
        />
      </g>

      {/* Flavor text */}
      {(() => {
        const [ln1, ln2, ln3] = splitFlavor(hero.flavorText ?? '');
        return (
          <g opacity={themeColors.flavorOpacity}>
            <text
              transform="matrix(1.333,0,0,1.359,159,664.92)"
              textAnchor="middle"
              style={{
                fontFamily: 'Aleo, serif',
                fontStyle: 'italic',
                fontWeight: 'normal',
                fontSize: '9.45px',
                fill: themeColors.textPrimary,
              }}
            >
              <tspan x="0" y="0">{ln1}</tspan>
              <tspan x="0" y="12.2661">{ln2}</tspan>
              <tspan x="0" y="24.5322">{ln3}</tspan>
            </text>
          </g>
        );
      })()}

      {/* ---- Board text overlays (replace hidden baked text) ---- */}

      {/* Move subtitle */}
      <text
        transform={`matrix(1.3333333,0,0,1.3333333,${MOVE_SUBTITLE_POS.x},${MOVE_SUBTITLE_POS.y})`}
        style={{ fontFamily: 'Karma, serif', fontWeight: 700, fontSize: '6px', fill: themeColors.textPrimary }}
      >
        <tspan x="0" y="0">{hero.moveSubtitle}</tspan>
      </text>

      {/* Move instructions */}
      <g transform={`matrix(1.3333333,0,0,1.3333333,${MOVE_INSTRUCTIONS_POS.x},${MOVE_INSTRUCTIONS_POS.y})`}>
        <IconTextLine
          text={hero.moveInstructions}
          x={0} y={0}
          textAnchor="start"
          fontSize={7}
          style={{ fontFamily: 'Karma, serif', fontWeight: 600, fontSize: '7px', fill: themeColors.textPrimary }}
        />
      </g>

      {/* Heroic subtitles — left-aligned */}
      <text
        transform={`matrix(1.3333333,0,0,1.3333333,${CLEANSE_SUBTITLE_POS.x},${CLEANSE_SUBTITLE_POS.y})`}
        style={{ fontFamily: 'Karma, serif', fontWeight: 600, fontSize: '7px', fill: themeColors.textPrimary }}
      >
        <tspan x="0" y="0">{hero.cleanseSubtitle}</tspan>
      </text>

      <text
        transform={`matrix(1.3333333,0,0,1.3333333,${BATTLE_SUBTITLE_POS.x},${BATTLE_SUBTITLE_POS.y})`}
        style={{ fontFamily: 'Karma, serif', fontWeight: 600, fontSize: '7px', fill: themeColors.textPrimary }}
      >
        <tspan x="0" y="0">{hero.battleSubtitle}</tspan>
      </text>

      {/* Quest subtitle — left-aligned, may wrap */}
      <text
        transform={`matrix(1.3333333,0,0,1.3333333,${QUEST_SUBTITLE_POS.x},${QUEST_SUBTITLE_POS.y})`}
        style={{ fontFamily: 'Karma, serif', fontWeight: 600, fontSize: '7px', fill: themeColors.textPrimary }}
      >
        {wrapText(hero.questSubtitle, 28).map((line, i) => (
          <tspan key={i} x="0" y={i * 9}>{line}</tspan>
        ))}
      </text>

      <text
        transform={`matrix(1.3333333,0,0,1.3333333,${REINFORCE_SUBTITLE_POS.x},${REINFORCE_SUBTITLE_POS.y})`}
        style={{ fontFamily: 'Karma, serif', fontWeight: 600, fontSize: '7px', fill: themeColors.textPrimary }}
      >
        <tspan x="0" y="0">{hero.reinforceSubtitle}</tspan>
      </text>

      {/* Location instructions — left-aligned, with icon substitution */}
      <g transform={`matrix(1.3333333,0,0,1.3333333,${CITADEL_INSTRUCTIONS_POS.x},${CITADEL_INSTRUCTIONS_POS.y})`}>
        <IconTextBlock
          text={hero.citadelInstructions}
          x={0} y={0}
          textAnchor="start"
          fontSize={7}
          lineHeight={9}
          style={{ fontFamily: 'Karma, serif', fontWeight: 600, fontSize: '7px', fill: themeColors.textPrimary }}
        />
      </g>

      <g transform={`matrix(1.3333333,0,0,1.3333333,${SANCTUARY_INSTRUCTIONS_POS.x},${SANCTUARY_INSTRUCTIONS_POS.y})`}>
        <IconTextBlock
          text={hero.sanctuaryInstructions}
          x={0} y={0}
          textAnchor="start"
          fontSize={7}
          lineHeight={9}
          style={{ fontFamily: 'Karma, serif', fontWeight: 600, fontSize: '7px', fill: themeColors.textPrimary }}
        />
      </g>

      <g transform={`matrix(1.3333333,0,0,1.3333333,${VILLAGE_INSTRUCTIONS_POS.x},${VILLAGE_INSTRUCTIONS_POS.y})`}>
        <IconTextBlock
          text={hero.villageInstructions}
          x={0} y={0}
          textAnchor="start"
          fontSize={7}
          lineHeight={9}
          style={{ fontFamily: 'Karma, serif', fontWeight: 600, fontSize: '7px', fill: themeColors.textPrimary }}
        />
      </g>

      <g transform={`matrix(1.3333333,0,0,1.3333333,${BAZAAR_INSTRUCTIONS_POS.x},${BAZAAR_INSTRUCTIONS_POS.y})`}>
        <IconTextBlock
          text={hero.bazaarInstructions}
          x={0} y={0}
          textAnchor="start"
          fontSize={7}
          lineHeight={9}
          style={{ fontFamily: 'Karma, serif', fontWeight: 600, fontSize: '7px', fill: themeColors.textPrimary }}
        />
      </g>

      {/* End of turn action — left-aligned */}
      <g transform={`matrix(1.3333333,0,0,1.3333333,${END_OF_TURN_POS.x},${END_OF_TURN_POS.y})`}>
        <IconTextLine
          text={hero.endOfTurnAction}
          x={0} y={0}
          textAnchor="start"
          fontSize={7}
          style={{ fontFamily: 'Karma, serif', fontWeight: 600, fontSize: '7px', fill: themeColors.textPrimary }}
        />
      </g>

    </svg>
  );
}
