// MIDNIGHT VAULT — keyboard and mouse.
// One clear job: turn raw browser input into a small, testable state object.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const state = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    useTool: false,
    toolKey: null, // 'lockpick' | 'emp' | 'smoke'
    click: null,   // {x, y} of the latest click, consumed by the game
    anyKey: false,
  };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
  };

  function refresh() {
    state.up = keys.has('KeyW') || keys.has('ArrowUp');
    state.down = keys.has('KeyS') || keys.has('ArrowDown');
    state.left = keys.has('KeyA') || keys.has('ArrowLeft');
    state.right = keys.has('KeyD') || keys.has('ArrowRight');
    state.sneak = keys.has('ShiftLeft') || keys.has('ShiftRight');
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    keys.add(e.code);
    pressed.add(e.code);
    state.anyKey = true;
    if (e.code === 'Space') state.useTool = true;
    if (e.code === 'Digit1') state.toolKey = 'lockpick';
    if (e.code === 'Digit2') state.toolKey = 'emp';
    if (e.code === 'Digit3') state.toolKey = 'smoke';
    if (e.code === 'Enter') state.anyKey = true;
    refresh();
  });

  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
    refresh();
  });

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    state.click = { x, y };
    state.anyKey = true;
  });

  window.addEventListener('blur', () => {
    keys.clear();
    refresh();
  });

  state.consumeClick = function consumeClick() {
    const c = state.click;
    state.click = null;
    return c;
  };

  state.consumeUseTool = function consumeUseTool() {
    const u = state.useTool;
    state.useTool = false;
    return u;
  };

  state.consumeToolKey = function consumeToolKey() {
    const t = state.toolKey;
    state.toolKey = null;
    return t;
  };

  state.consumeAnyKey = function consumeAnyKey() {
    const a = state.anyKey;
    state.anyKey = false;
    return a;
  };

  state.consumePressed = function consumePressed(code) {
    if (pressed.has(code)) {
      pressed.delete(code);
      return true;
    }
    return false;
  };

  // Edge-triggered presses live for one frame only: the loop clears them
  // after each update so a key from an earlier screen can never leak into
  // the next one (e.g. the Enter that started the game skipping "BUSTED!").
  state.clearPressed = function clearPressed() {
    pressed.clear();
  };

  return state;
}
