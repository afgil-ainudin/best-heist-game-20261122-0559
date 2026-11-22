// MIDNIGHT VAULT — sounds.
// One clear job: every sound effect, synthesized live with WebAudio. No audio files.

export function createSoundBank() {
  let ctx = null;
  let muted = false;
  let alarmOsc = null;
  let alarmGain = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    const c = ensure();
    if (!c || muted) return;
    const t = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noise(dur, vol, filterFreq, when = 0) {
    const c = ensure();
    if (!c || muted) return;
    const t = c.currentTime + when;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filterFreq;
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(c.destination);
    src.start(t);
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    pickup() { tone(880, 0.12, 'sine', 0.16); tone(1318, 0.18, 'sine', 0.14, 0.09); },
    gold() { tone(659, 0.14, 'triangle', 0.18); tone(988, 0.16, 'triangle', 0.18, 0.1); tone(1318, 0.3, 'triangle', 0.16, 0.2); },
    spotted() { tone(220, 0.28, 'sawtooth', 0.14, 0, 440); tone(440, 0.2, 'square', 0.08, 0.05); },
    caught() { tone(160, 0.6, 'sawtooth', 0.2, 0, 55); noise(0.4, 0.12, 500); },
    emp() { noise(0.35, 0.2, 3200); tone(1200, 0.3, 'square', 0.08, 0, 120); },
    smoke() { noise(0.6, 0.14, 700); },
    lockpick() { tone(1500, 0.05, 'square', 0.08); tone(1900, 0.05, 'square', 0.08, 0.08); tone(2400, 0.08, 'square', 0.08, 0.16); },
    step() { noise(0.05, 0.05, 400); },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, 'triangle', 0.16, i * 0.13));
    },
    levelClear() { tone(784, 0.2, 'triangle', 0.16); tone(1046, 0.34, 'triangle', 0.16, 0.14); },
    // A soft two-tone siren while the alarm runs high; call with the alarm level 0..100.
    setAlarm(level) {
      const c = ensure();
      if (!c) return;
      if (level < 55) {
        if (alarmOsc) { try { alarmOsc.stop(); } catch (_) {} alarmOsc = null; }
        return;
      }
      if (!alarmOsc) {
        alarmOsc = c.createOscillator();
        alarmGain = c.createGain();
        alarmOsc.type = 'sine';
        alarmOsc.frequency.value = 620;
        alarmGain.gain.value = 0.0;
        alarmOsc.connect(alarmGain).connect(c.destination);
        alarmOsc.start();
      }
      const lfo = 620 + Math.sin(c.currentTime * 3.2) * 160;
      alarmOsc.frequency.setValueAtTime(lfo, c.currentTime);
      alarmGain.gain.setTargetAtTime(muted ? 0 : 0.035, c.currentTime, 0.2);
    },
  };
}
