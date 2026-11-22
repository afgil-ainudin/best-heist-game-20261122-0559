// MIDNIGHT VAULT — the three rooms.
// One clear job: every room's walls, cover, patrols, cameras, loot and exits.
// Coordinates are canvas pixels. The floor runs x 16..1264, y 76..704.

export const LEVELS = [
  {
    id: 1,
    name: 'ROOM 1 — THE LOBBY',
    brief: 'Cross the lobby. The gold case waits by the far wall — then run for the EXIT.',
    start: { x: 90, y: 640 },
    exit: { x: 1180, y: 96, w: 72, h: 40 },
    mainLoot: { x: 1080, y: 620, value: 5000, label: 'GOLD CASE' },
    sideLoot: [
      { x: 620, y: 140, value: 800, label: 'SILVER' },
      { x: 240, y: 300, value: 800, label: 'SILVER' },
    ],
    tools: { lockpick: 2, emp: 2, smoke: 2 },
    // Interior walls (the outer room edge is the floor boundary).
    walls: [
      { x: 420, y: 76, w: 26, h: 190, label: 'pillar' },
      { x: 420, y: 420, w: 26, h: 284, label: 'pillar' },
      { x: 820, y: 76, w: 26, h: 150, label: 'pillar' },
      { x: 820, y: 380, w: 26, h: 324, label: 'pillar' },
    ],
    // Cover blocks line of sight and movement: desks, planters, safes.
    cover: [
      { x: 180, y: 130, w: 150, h: 60, kind: 'desk' },
      { x: 560, y: 300, w: 170, h: 64, kind: 'desk' },
      { x: 950, y: 470, w: 150, h: 60, kind: 'desk' },
      { x: 640, y: 560, w: 120, h: 56, kind: 'plant' },
      { x: 1040, y: 220, w: 90, h: 90, kind: 'safe' },
      { x: 240, y: 500, w: 110, h: 54, kind: 'plant' },
    ],
    guards: [
      { path: [[300, 220], [700, 220], [700, 480], [300, 480]], speed: 62, pause: 1.2 },
      { path: [[980, 180], [980, 560], [1120, 560], [1120, 180]], speed: 70, pause: 0.8 },
    ],
    cameras: [
      { x: 446, y: 90, base: Math.PI / 2, sweep: 0.9, speed: 0.55 },
      { x: 846, y: 690, base: -Math.PI / 2, sweep: 0.9, speed: 0.7 },
    ],
  },
  {
    id: 2,
    name: 'ROOM 2 — THE VAULT HALL',
    brief: 'Three guards, three cameras. Two routes around the vault hall — low past the planters, or high along the desks.',
    start: { x: 90, y: 640 },
    exit: { x: 1180, y: 96, w: 72, h: 40 },
    mainLoot: { x: 640, y: 380, value: 9000, label: 'VAULT GOLD' },
    sideLoot: [
      { x: 200, y: 150, value: 1200, label: 'GOLD BAR' },
      { x: 1120, y: 620, value: 1200, label: 'GOLD BAR' },
      { x: 1120, y: 150, value: 1200, label: 'GOLD BAR' },
    ],
    tools: { lockpick: 2, emp: 3, smoke: 2 },
    walls: [
      { x: 330, y: 76, w: 26, h: 220, label: 'pillar' },
      { x: 330, y: 470, w: 26, h: 234, label: 'pillar' },
      { x: 900, y: 76, w: 26, h: 220, label: 'pillar' },
      { x: 900, y: 470, w: 26, h: 234, label: 'pillar' },
      { x: 560, y: 76, w: 130, h: 26, label: 'beam' },
    ],
    cover: [
      { x: 120, y: 260, w: 150, h: 60, kind: 'desk' },
      { x: 120, y: 460, w: 150, h: 60, kind: 'desk' },
      { x: 990, y: 260, w: 150, h: 60, kind: 'desk' },
      { x: 990, y: 460, w: 150, h: 60, kind: 'desk' },
      { x: 480, y: 520, w: 110, h: 56, kind: 'plant' },
      { x: 690, y: 150, w: 110, h: 56, kind: 'plant' },
      { x: 560, y: 300, w: 160, h: 160, kind: 'safe' },
    ],
    guards: [
      { path: [[240, 200], [240, 580], [420, 580], [420, 200]], speed: 66, pause: 1.0 },
      { path: [[640, 150], [1020, 150], [1020, 600], [640, 600]], speed: 72, pause: 0.6 },
      { path: [[1080, 240], [760, 240], [760, 520], [1080, 520]], speed: 60, pause: 1.4 },
    ],
    cameras: [
      { x: 356, y: 90, base: Math.PI / 2, sweep: 1.0, speed: 0.6 },
      { x: 926, y: 90, base: Math.PI / 2, sweep: 1.0, speed: 0.8 },
      { x: 640, y: 690, base: -Math.PI / 2, sweep: 0.8, speed: 0.5 },
    ],
  },
  {
    id: 3,
    name: 'ROOM 3 — THE STRONGROOM',
    brief: 'The strongroom. Four guards, four cameras, one vault. Grab it, then run the gauntlet to the EXIT.',
    start: { x: 90, y: 640 },
    exit: { x: 1180, y: 96, w: 72, h: 40 },
    mainLoot: { x: 640, y: 360, value: 15000, label: 'THE STRONGROOM' },
    sideLoot: [
      { x: 180, y: 140, value: 2000, label: 'GOLD BAR' },
      { x: 1100, y: 620, value: 2000, label: 'GOLD BAR' },
    ],
    tools: { lockpick: 3, emp: 3, smoke: 3 },
    walls: [
      { x: 300, y: 76, w: 26, h: 180, label: 'pillar' },
      { x: 300, y: 430, w: 26, h: 274, label: 'pillar' },
      { x: 950, y: 76, w: 26, h: 180, label: 'pillar' },
      { x: 950, y: 430, w: 26, h: 274, label: 'pillar' },
      { x: 480, y: 76, w: 26, h: 120, label: 'pillar' },
      { x: 780, y: 560, w: 26, h: 144, label: 'pillar' },
    ],
    cover: [
      { x: 140, y: 280, w: 130, h: 56, kind: 'desk' },
      { x: 140, y: 480, w: 130, h: 56, kind: 'desk' },
      { x: 1000, y: 280, w: 130, h: 56, kind: 'desk' },
      { x: 1000, y: 480, w: 130, h: 56, kind: 'desk' },
      { x: 420, y: 180, w: 100, h: 52, kind: 'plant' },
      { x: 760, y: 480, w: 100, h: 52, kind: 'plant' },
      { x: 560, y: 280, w: 160, h: 160, kind: 'safe' },
      { x: 420, y: 560, w: 120, h: 52, kind: 'desk' },
    ],
    guards: [
      { path: [[220, 180], [220, 580], [420, 580], [420, 180]], speed: 70, pause: 0.8 },
      { path: [[560, 150], [940, 150], [940, 620], [560, 620]], speed: 76, pause: 0.5 },
      { path: [[1080, 200], [1080, 560], [860, 560], [860, 200]], speed: 68, pause: 1.0 },
      { path: [[640, 250], [640, 620], [480, 620], [480, 250]], speed: 64, pause: 1.2 },
    ],
    cameras: [
      { x: 326, y: 90, base: Math.PI / 2, sweep: 1.0, speed: 0.7 },
      { x: 976, y: 90, base: Math.PI / 2, sweep: 1.0, speed: 0.9 },
      { x: 506, y: 690, base: -Math.PI / 2, sweep: 0.9, speed: 0.6 },
      { x: 806, y: 690, base: -Math.PI / 2, sweep: 0.9, speed: 0.75 },
    ],
  },
];
