export const MAX_VIRTUES = 6;

export const DEFAULT_HERO_NAME = 'HERO NAME';
export const DEFAULT_VIRTUE_NAMES = [
  'VIRTUE',
  'VIRTUE 1',
  'VIRTUE 2',
  'VIRTUE 3',
  'VIRTUE 4',
  'VIRTUE 5',
  'VIRTUE 6',
];

export function createEmptyVirtue(name = 'VIRTUE') {
  return {
    name,
    type: 'standard',        // 'advantage' | 'standard' | 'champion'
    description: 'Virtue ability description here.',
    kingdom: '',
  };
}

export const defaultHero = {
  schemaVersion: 3,
  name: 'HERO NAME',
  warriors: 7,
  spirit: 1,
  portraitDataUrl: null,
  flavorText: 'Italicised flavour text, vague and mysterious.',
  bannerAction: 'Gain 1 potion',
  moveSubtitle: '(SPLIT AS NEEDED)',
  moveInstructions: 'Spend 1 * to double your move',
  battleSubtitle: 'Battle a foe on your space',
  questSubtitle: 'explore a dungeon or Complete a quest',
  cleanseSubtitle: 'Remove all skulls from your space',
  reinforceSubtitle: 'ON A SPACE WITH A BUILDING',
  bazaarInstructions: 'Free: Gain 1 gear\n2 *: Gain 1 treasure',
  villageInstructions: 'Free: Gain 6 #\n1 *: Gain 12 #',
  sanctuaryInstructions: 'Free: Gain 1 *\n5 *: Remove all your\ncorruptions',
  citadelInstructions: 'Free: Gain 1 potion\n5 *: Gain 1 virtue',
  endOfTurnAction: 'Drop 1 ^ into the Tower',
  virtues: [
    {
      name: 'VIRTUE 1',
      type: 'advantage',
      description: '+1 HUMANOID Advantage',
      kingdom: '',
    },
    {
      name: 'VIRTUE 2',
      type: 'standard',
      description: 'Virtue ability description here.',
      kingdom: '',
    },
  ],
  author_name: '',
  revision_no: '',
  description: '',
  contact: '',
  theme: 'orphaned_scion',
  customTheme: null,
};
