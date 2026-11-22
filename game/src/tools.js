// MIDNIGHT VAULT — the thief's tools.
// One clear job: lockpick, EMP and smoke — what each costs and what it does.

export function createToolBelt(startCounts) {
  return {
    selected: 'emp',
    lockpick: startCounts.lockpick,
    emp: startCounts.emp,
    smoke: startCounts.smoke,
  };
}

// Lockpick: instant-cracks a vault the thief stands next to, or the loot case.
// Returns 'cracked' | 'none-nearby' | 'empty'.
export function useLockpick(belt, thief, lootSpots) {
  if (belt.lockpick <= 0) return 'empty';
  for (const spot of lootSpots) {
    if (!spot.taken && !spot.cracked && dist2(thief, spot) < 70 * 70) {
      belt.lockpick--;
      spot.cracked = true;
      spot.progress = 1;
      return 'cracked';
    }
  }
  return 'none-nearby';
}

// EMP: disables every live camera within 220px for 8 seconds. Costs one charge.
export function useEmp(belt, thief, cameras, now, disableFn) {
  if (belt.emp <= 0) return 'empty';
  belt.emp--;
  const hit = disableFn(cameras, thief.x, thief.y, 220, now, 8);
  return hit > 0 ? 'zapped' : 'no-camera';
}

// Smoke: drops a cloud at the thief that blocks every line of sight for 6 seconds.
export function useSmoke(belt, thief, smokes) {
  if (belt.smoke <= 0) return 'empty';
  belt.smoke--;
  smokes.push({ x: thief.x, y: thief.y, r: 95, left: 6 });
  return 'puffed';
}

function dist2(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}
