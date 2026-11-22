// MIDNIGHT VAULT — bootstrap.
// One clear job: wire the canvas, the input, the sounds and the loop together.

import { CANVAS_W, CANVAS_H } from './config.js';
import { createGame, updateGame } from './game.js';
import { createInput } from './input.js';
import { createSoundBank } from './audio.js';
import { drawGame } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const input = createInput(canvas);
const sounds = createSoundBank();
const game = createGame();

// ?shot=cover|chase|getaway|win poses the game for a screenshot.
// Without it, the game opens on its title screen.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(game, shot);
  // Freeze the staged moment: screenshots should not drift while the shot is taken.
  game.frozen = true;
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (!game.frozen) {
    updateGame(game, dt, input, sounds);
    input.clearPressed();
  } else {
    // A frozen shot still breathes: cones sweep and the alarm light blinks.
    game.now += dt;
  }
  drawGame(ctx, game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Test hook: the play-test driver reads state and drives the game through this.
window.__vault = { game, input, stageShot };
