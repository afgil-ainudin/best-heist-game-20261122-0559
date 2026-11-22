// MIDNIGHT VAULT — game state and rules.
// One clear job: the loop's update — movement, cracking, alarm, tools, getaway, win and loss.

import { CANVAS_W, CANVAS_H, FLOOR, PLAYER, GUARD, ALARM, GETAWAY_SECONDS, clamp, dist } from './config.js';
import { LEVELS } from './levels.js';
import { createGuard, updateGuard, guardCatchesThief } from './guards.js';
import { createCamera, updateCamera, cameraIsLive, empDisableCameras } from './cameras.js';
import { createToolBelt, useLockpick, useEmp, useSmoke } from './tools.js';
import { resolveCircleVsRects, clampCircleToFloor } from './geometry.js';

export function createGame() {
  const game = {
    state: 'title', // title | play | caught | levelclear | win
    levelIndex: 0,
    level: LEVELS[0],
    thief: null,
    guards: [],
    cameras: [],
    lootSpots: [],
    solids: [],
    belt: null,
    smokes: [],
    alarm: 0,
    maxAlarmThisLevel: 0,
    loot: 0,
    levelLoot: 0,
    score: 0,
    ghostBonus: false,
    lootGrabbed: false,
    getawayLeft: GETAWAY_SECONDS,
    now: 0,
    banner: null,
    caughtReason: '',
    levelStartLoot: 0,
    levelStartScore: 0,
    moveTarget: null,
    stepTimer: 0,
  };
  loadLevel(game, 0);
  return game;
}

export function loadLevel(game, index) {
  game.levelIndex = index;
  game.level = LEVELS[index];
  game.thief = {
    x: game.level.start.x,
    y: game.level.start.y,
    r: PLAYER.radius,
    facing: -Math.PI / 2,
    sneaking: false,
    cracking: false,
    crackProgress: 0,
    invulnerable: 0,
  };
  game.guards = game.level.guards.map((g, i) => createGuard(g, i));
  game.cameras = game.level.cameras.map((c, i) => createCamera(c, i));
  game.lootSpots = [
    { ...game.level.mainLoot, main: true, taken: false, cracked: false, progress: 0 },
    ...game.level.sideLoot.map((s) => ({ ...s, main: false, taken: false, cracked: true, progress: 1 })),
  ];
  game.solids = [...game.level.walls, ...game.level.cover];
  game.belt = createToolBelt(game.level.tools);
  game.smokes = [];
  game.alarm = 0;
  game.maxAlarmThisLevel = 0;
  game.lootGrabbed = false;
  game.getawayLeft = GETAWAY_SECONDS;
  game.levelLoot = 0;
  game.ghostBonus = false;
  game.moveTarget = null;
  game.levelStartLoot = game.loot;
  game.levelStartScore = game.score;
  showBanner(game, `${game.level.name} — ${game.level.brief}`, '#f2c14e', 5);
}

export function showBanner(game, text, color, seconds) {
  game.banner = { text, color, until: game.now + seconds };
}

function startGame(game, sounds) {
  game.state = 'play';
  sounds.unlock();
  showBanner(game, `${game.level.name} — stay out of the cones!`, '#f2c14e', 4);
}

export function updateGame(game, dt, input, sounds) {
  game.now += dt;

  if (game.state === 'title') {
    if (input.consumeAnyKey() || input.consumeClick()) {
      startGame(game, sounds);
      input.consumeUseTool(); // don't let the starting keypress fire a tool
    }
    idleDrift(game, dt);
    return;
  }

  if (game.state === 'caught') {
    if (input.consumePressed('KeyR')) retryLevel(game);
    else if (input.consumePressed('Enter')) backToTitle(game);
    return;
  }

  if (game.state === 'levelclear') {
    if (input.consumePressed('Enter')) nextLevel(game);
    return;
  }

  if (game.state === 'win') {
    if (input.consumePressed('Enter')) backToTitle(game);
    return;
  }

  // --- play state ---
  const thief = game.thief;
  const toolKey = input.consumeToolKey();
  if (toolKey) game.belt.selected = toolKey;

  // Tool use (SPACE) or a click on the thief's own tile uses the selected tool.
  if (input.consumeUseTool()) useSelectedTool(game, sounds);

  // Click-to-move: a click sets a walk target; keys override it.
  const click = input.consumeClick();
  if (click) {
    if (game.state === 'play') {
      game.moveTarget = { x: click.x, y: click.y };
    }
  }

  // Movement.
  let mx = 0;
  let my = 0;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (mx !== 0 || my !== 0) game.moveTarget = null;

  if (mx === 0 && my === 0 && game.moveTarget) {
    const dx = game.moveTarget.x - thief.x;
    const dy = game.moveTarget.y - thief.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 8) game.moveTarget = null;
    else { mx = dx / d; my = dy / d; }
  }

  thief.sneaking = !!input.sneak;
  const speed = thief.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  if (mx !== 0 || my !== 0) {
    const len = Math.sqrt(mx * mx + my * my);
    thief.x += (mx / len) * speed * dt;
    thief.y += (my / len) * speed * dt;
    thief.facing = Math.atan2(my, mx);
    thief.cracking = false;
    game.stepTimer -= dt;
    if (game.stepTimer <= 0) {
      game.stepTimer = thief.sneaking ? 0.55 : 0.34;
      sounds.step();
    }
  }
  clampCircleToFloor(thief, FLOOR);
  resolveCircleVsRects(thief, game.solids);
  if (thief.invulnerable > 0) thief.invulnerable -= dt;

  // --- cracking the main vault: stand still next to it ---
  const main = game.lootSpots.find((s) => s.main);
  thief.cracking = false;
  if (main && !main.taken && !main.cracked) {
    const d = dist(thief.x, thief.y, main.x, main.y);
    if (d < 78 && mx === 0 && my === 0) {
      thief.cracking = true;
      main.progress = clamp(main.progress + dt / 2.5, 0, 1);
      thief.crackProgress = main.progress;
      if (main.progress >= 1) {
        main.cracked = true;
        sounds.lockpick();
        showBanner(game, 'VAULT CRACKED — grab the gold!', '#ffd23e', 3);
      }
    } else {
      main.progress = Math.max(0, main.progress - dt * 0.5);
    }
  }

  // --- grabbing loot ---
  for (const spot of game.lootSpots) {
    if (spot.taken || !spot.cracked) continue;
    if (dist(thief.x, thief.y, spot.x, spot.y) < 34) {
      spot.taken = true;
      game.loot += spot.value;
      game.levelLoot += spot.value;
      game.score += spot.value;
      if (spot.main) {
        game.lootGrabbed = true;
        game.alarm = clamp(game.alarm + ALARM.lootBump, 0, 100);
        sounds.gold();
        showBanner(game, 'GOLD SECURED — GET TO THE EXIT!', '#2ee66b', 4);
      } else {
        sounds.pickup();
      }
    }
  }

  // --- tools and smoke timers ---
  for (const s of game.smokes) s.left -= dt;
  game.smokes = game.smokes.filter((s) => s.left > 0);

  // --- watchers: guards and cameras ---
  let anyoneSees = false;
  let spottedNow = false;
  for (const guard of game.guards) {
    const prevState = guard.state;
    const seen = updateGuard(guard, dt, thief, game.solids, game.smokes, game.alarm);
    if (seen) anyoneSees = true;
    if (guard.state === 'chase' && prevState !== 'chase') {
      spottedNow = true;
      game.alarm = clamp(game.alarm + ALARM.spottedSting, 0, 100);
    }
    // Guards also collide with the room, so a chase can be broken by cover.
    applyGuardCollision(game, guard);
  }
  for (const cam of game.cameras) {
    const seen = updateCamera(cam, dt, game.now, thief, game.solids, game.smokes);
    if (seen) anyoneSees = true;
    if (cam.spotted >= 1 && cameraIsLive(cam, game.now)) {
      // A camera that fully locks on trips the alarm hard.
      game.alarm = clamp(game.alarm + 30 * dt, 0, 100);
    }
  }
  if (spottedNow) {
    sounds.spotted();
    showBanner(game, 'SPOTTED! Break line of sight!', '#ff3b30', 2.5);
  }

  // --- alarm meter ---
  if (anyoneSees) game.alarm = clamp(game.alarm + ALARM.risePerSecond * dt, 0, 100);
  else game.alarm = clamp(game.alarm - ALARM.fallPerSecond * dt, 0, 100);
  game.maxAlarmThisLevel = Math.max(game.maxAlarmThisLevel, game.alarm);
  sounds.setAlarm(game.alarm);

  // --- getaway countdown ---
  if (game.lootGrabbed) {
    game.getawayLeft -= dt;
    if (game.getawayLeft <= 0) {
      game.getawayLeft = 0;
      game.alarm = 100; // lockdown: every guard converges
    }
  }

  // --- caught? ---
  for (const guard of game.guards) {
    if (guardCatchesThief(guard, thief)) {
      game.state = 'caught';
      game.caughtReason = guard.state === 'chase'
        ? 'A guard ran you down after spotting you. Read the cones before you move.'
        : 'Caught in the dark.';
      sounds.caught();
      sounds.setAlarm(0);
      return;
    }
  }

  // --- reaching the EXIT after grabbing the gold ---
  if (game.lootGrabbed) {
    const e = game.level.exit;
    if (thief.x > e.x - 10 && thief.x < e.x + e.w + 10 && thief.y > e.y - 10 && thief.y < e.y + e.h + 10) {
      levelCleared(game, sounds);
    }
  }
}

// Guards need their collision applied to the real object (resolveCircleVsRects mutates).
function applyGuardCollision(game, guard) {
  const body = { x: guard.x, y: guard.y, r: GUARD.radius };
  resolveCircleVsRects(body, game.solids);
  guard.x = body.x;
  guard.y = body.y;
  const floored = { x: guard.x, y: guard.y, r: GUARD.radius };
  clampCircleToFloor(floored, FLOOR);
  guard.x = floored.x;
  guard.y = floored.y;
}

function levelCleared(game, sounds) {
  game.ghostBonus = game.maxAlarmThisLevel < 55;
  if (game.ghostBonus) game.score += 500;
  game.score += Math.max(0, Math.round(game.getawayLeft)) * 10;
  sounds.levelClear();
  sounds.setAlarm(0);
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.state = 'win';
    sounds.win();
  } else {
    game.state = 'levelclear';
  }
}

export function retryLevel(game) {
  game.loot = game.levelStartLoot;
  game.score = game.levelStartScore;
  loadLevel(game, game.levelIndex);
  game.state = 'play';
}

export function nextLevel(game) {
  loadLevel(game, game.levelIndex + 1);
  game.state = 'play';
}

export function backToTitle(game) {
  game.loot = 0;
  game.score = 0;
  loadLevel(game, 0);
  game.state = 'title';
}

// Guards and cameras keep sweeping on the title screen so the backdrop lives.
function idleDrift(game, dt) {
  const dummy = { x: -1000, y: -1000, sneaking: true };
  for (const guard of game.guards) {
    updateGuard(guard, dt, dummy, game.solids, game.smokes, 0);
  }
  for (const cam of game.cameras) {
    updateCamera(cam, dt, game.now, dummy, game.solids, game.smokes);
  }
}

function useSelectedTool(game, sounds) {
  const belt = game.belt;
  if (belt.selected === 'lockpick') {
    const res = useLockpick(belt, game.thief, game.lootSpots);
    if (res === 'cracked') {
      sounds.lockpick();
      showBanner(game, 'LOCKPICK — vault cracked instantly!', '#ffd23e', 2.5);
    } else if (res === 'empty') {
      showBanner(game, 'No lockpicks left!', '#ff3b30', 2);
    } else {
      showBanner(game, 'No locked case nearby.', '#9aa3c7', 2);
    }
  } else if (belt.selected === 'emp') {
    const res = useEmp(belt, game.thief, game.cameras, game.now, empDisableCameras);
    if (res === 'zapped') {
      sounds.emp();
      showBanner(game, 'EMP — cameras dark for 8 seconds!', '#7ee7ff', 2.5);
    } else if (res === 'empty') {
      showBanner(game, 'No EMP charges left!', '#ff3b30', 2);
    } else {
      showBanner(game, 'EMP fired — no camera in range.', '#9aa3c7', 2);
    }
  } else if (belt.selected === 'smoke') {
    const res = useSmoke(belt, game.thief, game.smokes);
    if (res === 'puffed') {
      sounds.smoke();
      showBanner(game, 'SMOKE — they can’t see through it!', '#c9b8ff', 2.5);
    } else {
      showBanner(game, 'No smoke left!', '#ff3b30', 2);
    }
  }
}
