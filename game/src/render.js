// MIDNIGHT VAULT — rendering.
// One clear job: everything the player sees, drawn on one canvas.
// Style: dark night blues, warm gold loot, red danger, green EXIT — readable at a glance.

import { CANVAS_W, CANVAS_H, HUD_H, FLOOR, PALETTE } from './config.js';
import { cameraIsLive } from './cameras.js';

export function drawGame(ctx, game) {
  drawFloor(ctx);
  drawExit(ctx, game);
  drawCover(ctx, game.level.cover);
  drawWalls(ctx, game.level.walls);
  drawLoot(ctx, game);
  drawSmoke(ctx, game.smokes);
  for (const cam of game.cameras) drawCameraCone(ctx, cam, game.now);
  for (const guard of game.guards) drawGuardCone(ctx, guard);
  for (const cam of game.cameras) drawCamera(ctx, cam, game.now);
  for (const guard of game.guards) drawGuard(ctx, guard);
  drawThief(ctx, game.thief, game);
  drawHud(ctx, game);
  drawBanner(ctx, game);
  if (game.state === 'title') drawTitleScreen(ctx, game);
  if (game.state === 'caught') drawCaughtScreen(ctx, game);
  if (game.state === 'levelclear') drawLevelClearScreen(ctx, game);
  if (game.state === 'win') drawWinScreen(ctx, game);
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.night;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // Checkerboard marble floor.
  const tile = 46;
  for (let y = FLOOR.y; y < FLOOR.y + FLOOR.h; y += tile) {
    for (let x = FLOOR.x; x < FLOOR.x + FLOOR.w; x += tile) {
      const even = ((x - FLOOR.x) / tile + (y - FLOOR.y) / tile) % 2 === 0;
      ctx.fillStyle = even ? PALETTE.floorLight : PALETTE.floorDark;
      ctx.fillRect(x, y, Math.min(tile, FLOOR.x + FLOOR.w - x), Math.min(tile, FLOOR.y + FLOOR.h - y));
    }
  }
  // Gold-trimmed room edge.
  ctx.strokeStyle = PALETTE.wallTrim;
  ctx.lineWidth = 3;
  ctx.strokeRect(FLOOR.x - 4, FLOOR.y - 4, FLOOR.w + 8, FLOOR.h + 8);
  // A deep carpet runner down the middle of the room.
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(FLOOR.x + 560, FLOOR.y, 120, FLOOR.h);
  ctx.strokeStyle = 'rgba(242,193,78,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(FLOOR.x + 560, FLOOR.y, 120, FLOOR.h);
}

function drawWalls(ctx, walls) {
  for (const w of walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = PALETTE.wallTrim;
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  }
}

function drawCover(ctx, cover) {
  for (const c of cover) {
    if (c.kind === 'desk') {
      ctx.fillStyle = PALETTE.coverDesk;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(c.x + 6, c.y + 6, c.w - 12, 10);
      ctx.strokeStyle = '#241d45';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
    } else if (c.kind === 'plant') {
      ctx.fillStyle = PALETTE.coverPlant;
      roundRect(ctx, c.x, c.y, c.w, c.h, 10);
      ctx.fill();
      ctx.fillStyle = '#2f7a4d';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(c.x + 14 + i * ((c.w - 28) / 3), c.y + c.h / 2, 13, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (c.kind === 'safe') {
      ctx.fillStyle = PALETTE.coverVault;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = PALETTE.lootGold;
      ctx.lineWidth = 3;
      ctx.strokeRect(c.x + 5, c.y + 5, c.w - 10, c.h - 10);
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PALETTE.lootGold;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawExit(ctx, game) {
  const e = game.level.exit;
  const open = game.lootGrabbed;
  ctx.save();
  if (open) {
    ctx.shadowColor = PALETTE.exitGreen;
    ctx.shadowBlur = 26;
  }
  ctx.fillStyle = open ? '#0d5c2a' : '#123a22';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.restore();
  ctx.strokeStyle = PALETTE.exitGreen;
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = PALETTE.exitGreen;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? 'EXIT ★' : 'EXIT', e.x + e.w / 2, e.y + e.h / 2);
  if (!open) {
    // Right-aligned to the room edge so the long label never clips off-screen.
    ctx.fillStyle = 'rgba(244,241,230,0.75)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('LOCKED — GRAB THE GOLD FIRST', CANVAS_W - 16, e.y + e.h + 14);
  }
}

function drawLoot(ctx, game) {
  for (const spot of game.lootSpots) {
    if (spot.taken) continue;
    const pulse = 0.6 + 0.4 * Math.sin(game.now * 3 + spot.x);
    ctx.save();
    ctx.shadowColor = PALETTE.lootGold;
    ctx.shadowBlur = 18 * pulse;
    ctx.fillStyle = PALETTE.lootGold;
    if (spot.main) {
      // The main vault: a gold case with bars.
      ctx.fillRect(spot.x - 26, spot.y - 18, 52, 36);
      ctx.fillStyle = PALETTE.lootGoldDeep;
      ctx.fillRect(spot.x - 26, spot.y - 18, 52, 8);
      ctx.fillStyle = '#fff3b0';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$$$ ', spot.x, spot.y + 4);
    } else {
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff3b0';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', spot.x, spot.y + 4);
    }
    ctx.restore();
    // Crack progress ring while the thief works the case.
    if (spot.progress > 0 && spot.progress < 1) {
      ctx.strokeStyle = PALETTE.lootGold;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, 26, -Math.PI / 2, -Math.PI / 2 + spot.progress * Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(spot.label, spot.x, spot.y - 30);
    if (spot.main && !spot.cracked) {
      ctx.fillStyle = PALETTE.textDim;
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillText('hold still to crack — or use a lockpick [1]', spot.x, spot.y + 34);
    }
  }
}

function drawSmoke(ctx, smokes) {
  for (const s of smokes) {
    const alpha = Math.min(0.85, (s.left / 6) * 0.85);
    ctx.fillStyle = `rgba(201, 184, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(230, 222, 255, ${alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(s.x - 22, s.y - 12, s.r * 0.55, 0, Math.PI * 2);
    ctx.arc(s.x + 24, s.y + 14, s.r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawVisionCone(ctx, x, y, facing, range, halfAngle, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fill();
}

function drawGuardCone(ctx, guard) {
  let fill = PALETTE.coneIdle;
  if (guard.state === 'chase') fill = PALETTE.coneAlert;
  else if (guard.state === 'suspicious') fill = PALETTE.coneSuspicious;
  drawVisionCone(ctx, guard.x, guard.y, guard.facing, 210, (Math.PI * 34) / 180, fill);
}

function drawGuard(ctx, guard) {
  // Body: dark uniform with a cap brim pointing where he looks.
  ctx.fillStyle = PALETTE.guardDark;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 11, 0, Math.PI * 2);
  ctx.fill();
  const bx = guard.x + Math.cos(guard.facing) * 14;
  const by = guard.y + Math.sin(guard.facing) * 14;
  ctx.fillStyle = PALETTE.guardDark;
  ctx.beginPath();
  ctx.arc(bx, by, 5, 0, Math.PI * 2);
  ctx.fill();
  // Suspicion arc above the guard's head.
  if (guard.suspicion > 0.05) {
    const col = guard.suspicion > 0.8 ? PALETTE.danger : guard.suspicion > 0.4 ? '#ff9f28' : '#ffd65a';
    ctx.strokeStyle = col;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 21, -Math.PI / 2, -Math.PI / 2 + guard.suspicion * Math.PI * 2);
    ctx.stroke();
    if (guard.suspicion > 0.8) {
      ctx.fillStyle = PALETTE.danger;
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 26);
    }
  }
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GUARD', guard.x, guard.y + 28);
}

function drawCameraCone(ctx, cam, now) {
  if (!cameraIsLive(cam, now)) return;
  const fill = cam.spotted > 0.4 ? 'rgba(255,59,48,0.34)' : PALETTE.cameraCone;
  drawVisionCone(ctx, cam.x, cam.y, cam.angle, 230, (Math.PI * 26) / 180, fill);
}

function drawCamera(ctx, cam, now) {
  const live = cameraIsLive(cam, now);
  const blink = live && Math.sin(now * 6) > 0;
  ctx.fillStyle = live ? '#22263f' : '#3a3a44';
  ctx.fillRect(cam.x - 9, cam.y - 7, 18, 14);
  ctx.fillStyle = live ? (blink ? PALETTE.danger : '#7a1f1a') : '#555';
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = live ? PALETTE.dangerSoft : '#666';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cam.x, cam.y);
  ctx.lineTo(cam.x + Math.cos(cam.angle) * 18, cam.y + Math.sin(cam.angle) * 18);
  ctx.stroke();
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  // Floor-mounted cameras sit at the canvas bottom: label above them instead.
  const labelY = cam.y > 600 ? cam.y - 22 : cam.y + 22;
  ctx.fillText(live ? 'CCTV' : 'CCTV OFF', cam.x, labelY);
}

function drawThief(ctx, thief, game) {
  const sneaking = thief.sneaking;
  ctx.save();
  if (thief.invulnerable > 0 && Math.floor(game.now * 10) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.shadowColor = PALETTE.thief;
  ctx.shadowBlur = sneaking ? 6 : 14;
  ctx.fillStyle = PALETTE.thiefDark;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Hood point shows the direction of travel.
  const fx = thief.x + Math.cos(thief.facing) * 13;
  const fy = thief.y + Math.sin(thief.facing) * 13;
  ctx.fillStyle = '#dbeaff';
  ctx.beginPath();
  ctx.arc(fx, fy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(sneaking ? 'VESPER · SNEAKING' : 'VESPER', thief.x, thief.y + 27);
  // Cracking ring while working a case.
  if (thief.cracking) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, 20, -Math.PI / 2, -Math.PI / 2 + thief.crackProgress * Math.PI * 2);
    ctx.stroke();
  }
}

function drawHud(ctx, game) {
  // Top bar.
  ctx.fillStyle = PALETTE.hudBar;
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);
  ctx.strokeStyle = PALETTE.hudLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, HUD_H);
  ctx.lineTo(CANVAS_W, HUD_H);
  ctx.stroke();

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.lootGold;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('MIDNIGHT VAULT', 16, 24);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(game.level.name, 16, 47);

  // Loot tally.
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(`LOOT  $${game.loot.toLocaleString('en-US')}`, 420, 26);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`SCORE ${game.score}`, 420, 46);

  // Alarm meter — big, labelled, colour-coded.
  const ax = 560;
  const aw = 300;
  ctx.textAlign = 'left';
  ctx.fillStyle = game.alarm >= 70 ? PALETTE.danger : game.alarm >= 40 ? '#ff9f28' : PALETTE.text;
  ctx.font = 'bold 15px system-ui, sans-serif';
  const alarmLabel = game.alarm >= 100 ? 'ALARM — LOCKDOWN!' : game.alarm >= 70 ? 'ALARM — THEY KNOW!' : game.alarm >= 40 ? 'ALARM — SUSPICIOUS' : 'ALARM';
  ctx.fillText(`${alarmLabel}  ${Math.round(game.alarm)}%`, ax, 20);
  ctx.fillStyle = '#0a0e22';
  ctx.fillRect(ax, 32, aw, 18);
  ctx.fillStyle = game.alarm >= 70 ? PALETTE.danger : game.alarm >= 40 ? '#ff9f28' : PALETTE.exitGreen;
  ctx.fillRect(ax, 32, (aw * game.alarm) / 100, 18);
  ctx.strokeStyle = PALETTE.hudLine;
  ctx.lineWidth = 2;
  ctx.strokeRect(ax, 32, aw, 18);

  // Getaway countdown once the gold is grabbed.
  if (game.lootGrabbed && game.state === 'play') {
    ctx.fillStyle = game.getawayLeft < 10 ? PALETTE.danger : PALETTE.exitGreen;
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`GETAWAY ${Math.ceil(game.getawayLeft)}s — REACH THE EXIT!`, 1010, 26);
  } else {
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Grab the gold, then run for the EXIT', 1010, 26);
  }
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('WASD move · SHIFT sneak · 1/2/3 tools · SPACE use · click to walk', CANVAS_W - 16, 47);

  // Tool belt, bottom-left.
  const tools = [
    { key: '1', name: 'LOCKPICK', n: game.belt.lockpick, color: '#ffd23e' },
    { key: '2', name: 'EMP', n: game.belt.emp, color: '#7ee7ff' },
    { key: '3', name: 'SMOKE', n: game.belt.smoke, color: '#c9b8ff' },
  ];
  let tx = 16;
  const ty = CANVAS_H - 44;
  tools.forEach((t) => {
    const selected = game.belt.selected === t.name.toLowerCase();
    ctx.fillStyle = selected ? 'rgba(255,210,62,0.25)' : 'rgba(10,14,34,0.8)';
    ctx.fillRect(tx, ty, 118, 32);
    ctx.strokeStyle = selected ? t.color : PALETTE.hudLine;
    ctx.lineWidth = selected ? 3 : 1;
    ctx.strokeRect(tx, ty, 118, 32);
    ctx.fillStyle = t.color;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`[${t.key}] ${t.name} ×${t.n}`, tx + 8, ty + 17);
    tx += 128;
  });
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('SPACE uses the selected tool', tx + 6, ty + 17);
}

function drawBanner(ctx, game) {
  if (!game.banner || game.now > game.banner.until) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, (game.banner.until - game.now) * 2);
  ctx.fillStyle = 'rgba(10,14,34,0.85)';
  const w = 560;
  ctx.fillRect((CANVAS_W - w) / 2, 84, w, 44);
  ctx.strokeStyle = game.banner.color || PALETTE.lootGold;
  ctx.lineWidth = 2;
  ctx.strokeRect((CANVAS_W - w) / 2, 84, w, 44);
  ctx.fillStyle = game.banner.color || PALETTE.lootGold;
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(game.banner.text, CANVAS_W / 2, 107);
  ctx.restore();
}

function dimScreen(ctx) {
  ctx.fillStyle = 'rgba(6, 8, 20, 0.78)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawTitleScreen(ctx, game) {
  dimScreen(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.lootGold;
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText('MIDNIGHT VAULT', CANVAS_W / 2, 170);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '26px system-ui, sans-serif';
  ctx.fillText('A stealth heist in three rooms. Steal the gold. Don’t get seen.', CANVAS_W / 2, 220);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('WASD / arrows — move      SHIFT — sneak (harder to spot)', CANVAS_W / 2, 290);
  ctx.fillText('1 Lockpick · 2 EMP (kills cameras) · 3 Smoke (breaks line of sight) — SPACE uses a tool', CANVAS_W / 2, 320);
  ctx.fillText('Click anywhere to walk there. Stand by the gold case to crack it — a lockpick cracks it instantly.', CANVAS_W / 2, 350);
  ctx.fillText('Guards chase when they fully spot you. Cameras raise the alarm. Grab the gold, then reach the green EXIT.', CANVAS_W / 2, 380);
  const blink = Math.sin(game.now * 4) > -0.2;
  if (blink) {
    ctx.fillStyle = PALETTE.exitGreen;
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('CLICK OR PRESS ENTER TO START', CANVAS_W / 2, 460);
  }
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('An original game by Vesper Works — sounds synthesized live, no files fetched.', CANVAS_W / 2, 520);
}

function drawCaughtScreen(ctx, game) {
  dimScreen(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.danger;
  ctx.font = 'bold 58px system-ui, sans-serif';
  ctx.fillText('BUSTED!', CANVAS_W / 2, 260);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText(game.caughtReason || 'A guard grabbed you in the dark.', CANVAS_W / 2, 310);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(`Loot kept: $${game.loot.toLocaleString('en-US')}   ·   Score: ${game.score}`, CANVAS_W / 2, 350);
  ctx.fillStyle = PALETTE.exitGreen;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('Press R to retry this room — or ENTER for the title screen', CANVAS_W / 2, 420);
}

function drawLevelClearScreen(ctx, game) {
  dimScreen(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.exitGreen;
  ctx.font = 'bold 54px system-ui, sans-serif';
  ctx.fillText('CLEAN GETAWAY!', CANVAS_W / 2, 250);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText(`${game.level.name} — loot $${game.levelLoot.toLocaleString('en-US')}${game.ghostBonus ? '  ·  GHOST BONUS +500 (never spotted!)' : ''}`, CANVAS_W / 2, 305);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(`Total loot $${game.loot.toLocaleString('en-US')}   ·   Score ${game.score}`, CANVAS_W / 2, 345);
  ctx.fillStyle = PALETTE.exitGreen;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('Press ENTER for the next room', CANVAS_W / 2, 420);
}

function drawWinScreen(ctx, game) {
  dimScreen(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.lootGold;
  ctx.font = 'bold 58px system-ui, sans-serif';
  ctx.fillText('THE VAULT IS YOURS', CANVAS_W / 2, 230);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText('Three rooms. Three clean getaways. Vesper vanishes into the night.', CANVAS_W / 2, 285);
  ctx.fillStyle = PALETTE.lootGold;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(`TOTAL LOOT  $${game.loot.toLocaleString('en-US')}      FINAL SCORE  ${game.score}`, CANVAS_W / 2, 340);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Press ENTER to play again', CANVAS_W / 2, 410);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
