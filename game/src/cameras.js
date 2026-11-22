// MIDNIGHT VAULT — CCTV cameras.
// One clear job: camera sweep, red vision cones, spotting and EMP disable.

import { CAMERA, clamp, dist, angleTo, angleDiff } from './config.js';
import { lineOfSightBlocked } from './geometry.js';

export function createCamera(def, index) {
  return {
    id: index,
    x: def.x,
    y: def.y,
    base: def.base,
    sweep: def.sweep,
    speed: def.speed,
    angle: def.base,
    phase: index * 1.7,
    disabledUntil: 0, // game clock seconds; 0 means live
    spotted: 0,       // 0..1, fills while the thief is in the cone
  };
}

export function cameraIsLive(camera, now) {
  return now >= camera.disabledUntil;
}

export function updateCamera(camera, dt, now, thief, solids, smokes) {
  // Sweep back and forth across the base angle.
  camera.angle = camera.base + Math.sin(now * camera.speed + camera.phase) * camera.sweep;
  if (!cameraIsLive(camera, now)) {
    camera.spotted = Math.max(0, camera.spotted - dt);
    return false;
  }
  const d = dist(camera.x, camera.y, thief.x, thief.y);
  let seen = false;
  if (d < CAMERA.range) {
    const toThief = angleTo(camera.x, camera.y, thief.x, thief.y);
    if (Math.abs(angleDiff(toThief, camera.angle)) < CAMERA.halfAngle) {
      if (!lineOfSightBlocked(camera.x, camera.y, thief.x, thief.y, solids, smokes)) {
        seen = true;
      }
    }
  }
  if (seen) {
    let rate = thief.sneaking ? 0.5 : 1.0;
    if (d < 100) rate = 1.5;
    camera.spotted = clamp(camera.spotted + rate * dt, 0, 1);
  } else {
    camera.spotted = clamp(camera.spotted - 0.4 * dt, 0, 1);
  }
  return seen;
}

// EMP blast: every live camera inside the radius goes dark for `seconds`.
export function empDisableCameras(cameras, x, y, radius, now, seconds) {
  let hit = 0;
  for (const cam of cameras) {
    if (dist(cam.x, cam.y, x, y) <= radius && cameraIsLive(cam, now)) {
      cam.disabledUntil = now + seconds;
      cam.spotted = 0;
      hit++;
    }
  }
  return hit;
}
