export const defaultCrewLeader = {
  schemaVersion: 2,
  crewLeaderName: '',
  crewLeaderTitle: '',
  portraitDataUrl: null,

  // Special ability (top of front board, unique per leader)
  specialAbilityName: '',
  specialAbilityDescription: '',

  // 4 positional effect slots — sorted by dice value (lowest → slot 0)
  slots: [
    { effectName: '', dice: '', description: '' },
    { effectName: '', dice: '', description: '' },
    { effectName: '', dice: '', description: '' },
    { effectName: '', dice: '', description: '' },
  ],

  // Command token count (0–9)
  commandTokens: 0,

  // Board theme
  accentColor: '#00ff00',
  nameColor: '#fff6d3',

  // Per-field manual style/transform overrides (sparse; keyed by field id).
  // Each entry may hold: { dx, dy, rotation, fontSize, w, color, italic, bold }.
  // (w = fit-box width override from the edge handles.) Empty means every field
  // uses its registry default + auto-fit.
  fieldStyles: {},

  // Metadata (back of board)
  author_name: '',
  revision_no: '',
  contact_info: '',
  author_description: '',
};
