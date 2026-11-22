// MIDNIGHT VAULT — staged screenshot states.
// One clear job: pose the real game into the exact moments the screenshots show.
// Every shot is the game itself, running its own code — no composited images.

import { loadLevel } from './game.js';
import { clamp } from './config.js';

export function stageShot(game, name) {
  if (name === 'cover') {
    // Room 1, mid-heist: thief crossing the open floor, alarm part-filled at 35%,
    // both guards sweeping, both cameras live, gold case glowing, EXIT locked.
    loadLevel(game, 0);
    game.state = 'play';
    game.thief.x = 600;
    game.thief.y = 400;
    game.thief.facing = Math.PI / 4;
    game.alarm = 35;
    game.maxAlarmThisLevel = 35;
    game.loot = 800;
    game.score = 800;
    game.levelLoot = 800;
    game.lootSpots[1].taken = true; // one side stash already pocketed
    const g0 = game.guards[0];
    g0.x = 480; g0.y = 220; g0.facing = Math.PI / 2; g0.suspicion = 0.15; g0.state = 'patrol';
    const g1 = game.guards[1];
    g1.x = 1020; g1.y = 420; g1.facing = Math.PI; g1.suspicion = 0.45; g1.state = 'suspicious';
    g1.lastSeenX = 700; g1.lastSeenY = 420;
    game.banner = null;
    return true;
  }

  if (name === 'chase') {
    // Room 2, the fair caught moment: alarm high, a guard has spotted Vesper
    // and is closing in while the second guard hurries over.
    loadLevel(game, 1);
    game.state = 'play';
    game.thief.x = 640;
    game.thief.y = 560;
    game.thief.facing = -Math.PI / 2;
    game.alarm = 82;
    game.maxAlarmThisLevel = 82;
    game.loot = 1200;
    game.score = 1200;
    const g0 = game.guards[0];
    g0.x = 640; g0.y = 480; g0.facing = Math.PI / 2; g0.suspicion = 1; g0.state = 'chase';
    g0.chaseX = 640; g0.chaseY = 560;
    const g1 = game.guards[1];
    g1.x = 900; g1.y = 300; g1.facing = Math.PI * 0.75; g1.suspicion = 0.7; g1.state = 'suspicious';
    g1.lastSeenX = 640; g1.lastSeenY = 560;
    game.banner = { text: 'SPOTTED! Break line of sight!', color: '#ff3b30', until: game.now + 30 };
    return true;
  }

  if (name === 'getaway') {
    // Room 3, the payoff: the strongroom gold is taken, the EXIT glows green,
    // the getaway clock runs and every guard converges.
    loadLevel(game, 2);
    game.state = 'play';
    game.thief.x = 1000;
    game.thief.y = 180;
    game.thief.facing = Math.PI / 4;
    game.lootSpots[0].taken = true;
    game.lootGrabbed = true;
    game.getawayLeft = 21;
    game.alarm = 58;
    game.maxAlarmThisLevel = 58;
    game.loot = 17200;
    game.levelLoot = 15000;
    game.score = 17200;
    const g0 = game.guards[0];
    g0.x = 700; g0.y = 300; g0.facing = Math.PI / 4; g0.suspicion = 0.9; g0.state = 'chase';
    g0.chaseX = 1000; g0.chaseY = 180;
    const g1 = game.guards[1];
    g1.x = 1100; g1.y = 420; g1.facing = -Math.PI / 2; g1.suspicion = 0.6; g1.state = 'suspicious';
    g1.lastSeenX = 1000; g1.lastSeenY = 180;
    game.banner = { text: 'GOLD SECURED — GET TO THE EXIT!', color: '#2ee66b', until: game.now + 30 };
    return true;
  }

  if (name === 'win') {
    // The end screen: all three rooms cleared, final tally on display.
    loadLevel(game, 2);
    game.state = 'win';
    game.banner = null; // no level intro banner over the end screen
    game.loot = 32400;
    game.score = 35100;
    return true;
  }

  return false;
}

export function clampShotAlarm(game) {
  game.alarm = clamp(game.alarm, 0, 100);
}
