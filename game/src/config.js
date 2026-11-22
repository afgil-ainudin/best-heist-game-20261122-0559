// MIDNIGHT VAULT — shared constants and palette.
// One clear job: every number and colour the rest of the game agrees on.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const HUD_H = 64;
export const FLOOR = { x: 16, y: HUD_H + 12, w: CANVAS_W - 32, h: CANVAS_H - HUD_H - 28 };

export const PALETTE = {
  night: '#0a0e22',        // room floor, deep night blue
  floorLight: '#121838',   // checker light tile
  floorDark: '#0d1230',    // checker dark tile
  carpet: '#1a1440',       // rug zones
  wall: '#2c3358',         // wall face
  wallTrim: '#f2c14e',     // gold trim on walls
  coverDesk: '#3a2f5e',    // desks and counters
  coverPlant: '#173d2a',   // planters
  coverVault: '#4a4030',   // vault doors and safes
  safe: '#39d98a',         // safe cover / safe zones
  danger: '#ff3b30',       // guards, alert, alarm
  dangerSoft: '#ff7a59',
  coneIdle: 'rgba(255, 214, 90, 0.20)',   // guard cone at rest
  coneSuspicious: 'rgba(255, 150, 40, 0.34)',
  coneAlert: 'rgba(255, 59, 48, 0.42)',
  cameraCone: 'rgba(255, 59, 48, 0.16)',
  cameraOff: 'rgba(120, 120, 130, 0.10)',
  lootGold: '#ffd23e',     // gold loot glow
  lootGoldDeep: '#c98f1b',
  exitGreen: '#2ee66b',
  thief: '#4aa8ff',        // the thief, Vesper
  thiefDark: '#1d5fb8',
  guard: '#8a93b8',        // guard uniform
  guardDark: '#3c4266',
  text: '#f4f1e6',
  textDim: '#9aa3c7',
  hudBar: '#141a38',
  hudLine: '#2e3766',
};

export const PLAYER = {
  radius: 14,
  walkSpeed: 170,
  sneakSpeed: 95,
  chaseEscape: 0, // filled in by game.js
};

export const GUARD = {
  radius: 15,
  patrolSpeed: 62,
  chaseSpeed: 168,
  viewRange: 210,
  viewHalfAngle: (Math.PI * 34) / 180,
  catchRadius: 30,
};

export const CAMERA = {
  range: 230,
  halfAngle: (Math.PI * 26) / 180,
};

export const ALARM = {
  risePerSecond: 34,   // while any watcher sees the thief
  fallPerSecond: 9,    // while nobody sees the thief
  chaseAt: 100,        // lockdown: every guard chases
  warnAt: 55,          // guards turn suspicious and hurry
  lootBump: 18,        // grabbing the main vault bumps the alarm
  spottedSting: 22,    // a full guard spot adds this at once
};

export const TOOLS = {
  lockpick: { key: '1', name: 'Lockpick', start: 2, color: '#ffd23e' },
  emp: { key: '2', name: 'EMP', start: 2, color: '#7ee7ff' },
  smoke: { key: '3', name: 'Smoke', start: 2, color: '#c9b8ff' },
};

export const GETAWAY_SECONDS = 45;

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function dist(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
