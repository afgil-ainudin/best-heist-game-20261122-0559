// MIDNIGHT VAULT — guards.
// One clear job: guard patrols, vision cones, suspicion and the chase.

import { GUARD, ALARM, clamp, dist, angleTo, angleDiff } from './config.js';
import { lineOfSightBlocked } from './geometry.js';

export function createGuard(def, index) {
  return {
    id: index,
    path: def.path,
    waypoint: 0,
    x: def.path[0][0],
    y: def.path[0][1],
    facing: 0,
    speed: def.speed || GUARD.patrolSpeed,
    pause: def.pause || 1,
    pauseLeft: 0,
    suspicion: 0,      // 0..1, fills while the thief is in the cone
    state: 'patrol',   // patrol | suspicious | chase
    chaseX: 0,
    chaseY: 0,
    lastSeenX: 0,
    lastSeenY: 0,
  };
}

// Can this guard see the thief right now?
export function guardCanSee(guard, thief, solids, smokes) {
  const d = dist(guard.x, guard.y, thief.x, thief.y);
  if (d > GUARD.viewRange) return false;
  const toThief = angleTo(guard.x, guard.y, thief.x, thief.y);
  if (Math.abs(angleDiff(toThief, guard.facing)) > GUARD.viewHalfAngle) return false;
  if (lineOfSightBlocked(guard.x, guard.y, thief.x, thief.y, solids, smokes)) return false;
  return true;
}

export function updateGuard(guard, dt, thief, solids, smokes, alarm) {
  const seen = guardCanSee(guard, thief, solids, smokes);
  const d = dist(guard.x, guard.y, thief.x, thief.y);

  if (seen) {
    // Closer and louder (running) is easier to spot; sneaking is harder.
    let rate = 0.85;
    if (d < 90) rate = 1.6;
    else if (d < 150) rate = 1.15;
    if (thief.sneaking) rate *= 0.45;
    guard.suspicion = clamp(guard.suspicion + rate * dt, 0, 1);
    guard.lastSeenX = thief.x;
    guard.lastSeenY = thief.y;
  } else {
    guard.suspicion = clamp(guard.suspicion - 0.35 * dt, 0, 1);
  }

  // State machine: a full spot starts a chase; a high alarm makes every guard hunt.
  // Hysteresis: once chasing, the guard keeps chasing until suspicion really drops,
  // so one flicker at the cone's edge does not cancel the chase.
  if (guard.suspicion >= 1) {
    guard.state = 'chase';
    guard.chaseX = thief.x;
    guard.chaseY = thief.y;
  } else if (alarm >= ALARM.chaseAt) {
    guard.state = 'chase';
    guard.chaseX = thief.x;
    guard.chaseY = thief.y;
  } else if (guard.state === 'chase' && guard.suspicion > 0.5) {
    guard.state = 'chase';
    guard.chaseX = thief.x;
    guard.chaseY = thief.y;
  } else if (guard.suspicion > 0.35 || alarm >= ALARM.warnAt) {
    guard.state = 'suspicious';
  } else {
    guard.state = 'patrol';
  }

  if (guard.state === 'chase') {
    moveToward(guard, guard.chaseX, guard.chaseY, GUARD.chaseSpeed, dt);
    guard.facing = angleTo(guard.x, guard.y, guard.chaseX, guard.chaseY);
    // Re-check after moving: a guard standing on the thief can see them.
    const seesNow = guardCanSee(guard, thief, solids, smokes);
    if (seesNow) {
      guard.chaseX = thief.x;
      guard.chaseY = thief.y;
    } else if (dist(guard.x, guard.y, guard.chaseX, guard.chaseY) < 12) {
      // Reached the last seen spot with nobody there: give up the chase and look around.
      guard.suspicion = 0.5;
      guard.state = 'suspicious';
    }
    return seen;
  }

  if (guard.state === 'suspicious') {
    // Hurry toward where the thief was last seen, then scan the area.
    if (dist(guard.x, guard.y, guard.lastSeenX, guard.lastSeenY) > 14) {
      moveToward(guard, guard.lastSeenX, guard.lastSeenY, guard.speed * 1.5, dt);
      guard.facing = angleTo(guard.x, guard.y, guard.lastSeenX, guard.lastSeenY);
    } else {
      guard.facing += dt * 1.4; // sweep the area instead of staring at one spot
    }
    return seen;
  }

  // Patrol: walk the waypoint loop, pausing at each corner to scan.
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    guard.facing += Math.sin(performance.now() / 900 + guard.id * 2) * 0.35 * dt;
    return seen;
  }
  const target = guard.path[guard.waypoint];
  moveToward(guard, target[0], target[1], guard.speed, dt);
  guard.facing = angleTo(guard.x, guard.y, target[0], target[1]);
  if (dist(guard.x, guard.y, target[0], target[1]) < 8) {
    guard.waypoint = (guard.waypoint + 1) % guard.path.length;
    guard.pauseLeft = guard.pause;
  }
  return seen;
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < 1) return;
  const step = Math.min(d, speed * dt);
  guard.x += (dx / d) * step;
  guard.y += (dy / d) * step;
}

// Has this guard caught the thief? Only a chasing guard can grab.
export function guardCatchesThief(guard, thief) {
  if (guard.state !== 'chase') return false;
  return dist(guard.x, guard.y, thief.x, thief.y) < GUARD.catchRadius;
}
