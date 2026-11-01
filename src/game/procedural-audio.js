// 原創 Web Audio 合成；不下載音檔、不匯入 three.js，也不主動接入遊戲。
// 主音量 v 為 0～1；S2 的 0～100 請除以 100 再傳入。
const clamp = value => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
const AMBIENCE = Object.freeze({ lobby: 55, 'power-room': 65, production: 73, 'chase-corridor': 82, exit: 49 });

// Ryan 工廠事件音型由同一組 tone／master／生命週期管理，避免第二個 context。
const CUES = Object.freeze({
  power:[[82,.32,'sine',.06,0],[123,.32,'triangle',.045,.12],[165,.4,'sine',.035,.24]],
  chase:[[145,.36,'sawtooth',.05,0],[119,.42,'triangle',.04,.13]],
  caught:[[76,.52,'sawtooth',.08,0],[52,.7,'sine',.06,.08]],
  hide:[[88,.16,'triangle',.035,0],[62,.2,'sine',.03,.1]],
  unhide:[[105,.18,'triangle',.03,0]],
  escape:[[220,.34,'triangle',.045,0],[330,.42,'sine',.04,.18],[440,.7,'sine',.035,.38]],
  door:[[92,.3,'square',.045,0],[68,.38,'sawtooth',.035,.16]],
  train:[[55,.5,'sawtooth',.04,0],[82,.5,'triangle',.04,.22],[110,.7,'sine',.035,.42]],
});

export function createAudio(options = {}) {
  const Context = Object.hasOwn(options, 'AudioContext') ? options.AudioContext : (globalThis.AudioContext ?? globalThis.webkitAudioContext);
  const later = options.setTimeout ?? globalThis.setTimeout;
  const cancel = options.clearTimeout ?? globalThis.clearTimeout;
  let context = null, master = null, ready = false, disposed = false, pendingUnlock = null;
  let volume = 0.35, ambience = null, intensity = 0, heartbeatTimer = null, noise = null;
  const voices = new Set(), ambient = new Map();
  const canPlay = () => ready && !disposed && context?.state === 'running';
  function disconnect(node) { try { node.disconnect(); } catch { /* 已斷開可忽略。 */ } }
  function release(voice) {
    if (!voices.delete(voice)) return;
    for (const node of voice.nodes) disconnect(node);
  }
  function endVoice(voice) {
    try { voice.source.stop(); } catch { /* 已停止可忽略。 */ }
    release(voice);
  }
  function automate(param, value) {
    const now = context.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + 0.03);
  }
  function envelope(gain, start, duration, peak) {
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + Math.min(0.012, duration / 4));
    gain.gain.linearRampToValueAtTime(0, start + duration);
  }
  function tone(frequency, duration, peak, { delay = 0, end = frequency, type = 'sine', heartbeat = false } = {}) {
    if (!canPlay() || voices.size >= 16) return false;
    const source = context.createOscillator(), gain = context.createGain();
    const start = context.currentTime + delay;
    source.type = type; source.frequency.setValueAtTime(frequency, start);
    source.frequency.exponentialRampToValueAtTime(Math.max(1, end), start + duration);
    envelope(gain, start, duration, peak);
    source.connect(gain); gain.connect(master);
    const voice = { source, nodes: [source, gain], heartbeat }; voices.add(voice);
    source.onended = () => release(voice);
    source.start(start); source.stop(start + duration + 0.01); return true;
  }
  function rustle(duration, peak, frequency) {
    if (!canPlay() || voices.size >= 16) return false;
    if (!noise) {
      noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.6), context.sampleRate);
      const samples = noise.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    source.buffer = noise; filter.type = 'lowpass'; filter.frequency.setValueAtTime(frequency, context.currentTime);
    envelope(gain, context.currentTime, duration, peak);
    source.connect(filter); filter.connect(gain); gain.connect(master);
    const voice = { source, nodes: [source, filter, gain] }; voices.add(voice);
    source.onended = () => release(voice);
    source.start(); source.stop(context.currentTime + duration + 0.01); return true;
  }
  function stopAmbience() {
    for (const [source, gain] of ambient) { try { source.stop(); } catch { /* 已停止。 */ } disconnect(source); disconnect(gain); }
    ambient.clear();
  }
  function startAmbience() {
    if (!canPlay() || !ambience || ambient.size) return;
    const frequency = AMBIENCE[ambience] ?? AMBIENCE.lobby;
    for (const [ratio, peak] of [[1, 0.025], [1.503, 0.012]]) {
      const source = context.createOscillator(), gain = context.createGain();
      source.type = 'sine'; source.frequency.value = frequency * ratio;
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(peak, context.currentTime + 0.4);
      source.connect(gain); gain.connect(master); ambient.set(source, gain);
      source.onended = () => { ambient.delete(source); disconnect(source); disconnect(gain); }; source.start();
    }
  }
  function clearHeartbeat() { if (heartbeatTimer !== null) cancel(heartbeatTimer); heartbeatTimer = null; }
  function beat() {
    heartbeatTimer = null;
    if (!canPlay() || intensity <= 0) return;
    const peak = 0.035 + 0.085 * intensity;
    tone(76, 0.13, peak, { end: 42, heartbeat: true });
    tone(68, 0.12, peak * 0.65, { delay: 0.19, end: 39, heartbeat: true });
    heartbeatTimer = later(beat, 1500 - 850 * intensity);
  }
  function setMasterVolume(value) {
    volume = clamp(value); if (master && !disposed) automate(master.gain, volume); return volume;
  }
  function setAmbience(areaId) {
    const next = typeof areaId === 'string' && areaId ? areaId : null;
    if (next === ambience) { startAmbience(); return; }
    stopAmbience(); ambience = next; startAmbience();
  }
  function setHeartbeat(value) {
    const next = clamp(value);
    // 重送同值不重建節點；零值也終止已排程的雙拍。
    if (next === intensity) return;
    intensity = next;
    if (intensity === 0) {
      clearHeartbeat();
      for (const voice of [...voices]) if (voice.heartbeat) endVoice(voice);
    } else if (canPlay() && heartbeatTimer === null) beat();
  }
  async function unlock() {
    if (disposed || typeof Context !== 'function') return false;
    if (pendingUnlock) return pendingUnlock;
    pendingUnlock = (async () => {
      try {
        if (!context) { context = new Context(); master = context.createGain(); master.gain.value = volume; master.connect(context.destination); }
        if (context.state !== 'running') await context.resume();
        ready = context.state === 'running' && !disposed;
        if (ready) { startAmbience(); if (intensity > 0 && heartbeatTimer === null) beat(); }
        return ready;
      } catch { ready = false; return false; }
    })();
    try { return await pendingUnlock; } finally { pendingUnlock = null; }
  }
  function stop() {
    clearHeartbeat(); intensity = 0; ambience = null; stopAmbience();
    for (const voice of [...voices]) endVoice(voice);
  }
  async function dispose() {
    if (disposed) return;
    stop(); disposed = true; ready = false; noise = null;
    if (master) disconnect(master);
    try { if (context && context.state !== 'closed') await context.close(); } catch { /* 關閉失敗不阻擋離頁。 */ }
  }
  return {
    unlock, setMasterVolume, setAmbience, setHeartbeat,
    playCue: cue => {
      if (!canPlay() || !Object.hasOwn(CUES, cue)) return false;
      let played=false;
      for (const [frequency,duration,type,peak,delay] of CUES[cue]) played=tone(frequency,duration,peak,{type,delay}) || played;
      return played;
    },
    playFootstep: () => rustle(0.11, 0.1, 550),
    playAlarm: () => { if (!canPlay()) return false; const played = tone(440, 0.2, 0.075, { type: 'triangle', end: 660 }); if (played) tone(660, 0.2, 0.06, { delay: 0.25, type: 'triangle', end: 440 }); return played; },
    playDoor: () => { if (!canPlay()) return false; const played = rustle(0.45, 0.09, 800); if (played) tone(150, 0.4, 0.04, { end: 55 }); return played; },
    stop, dispose,
    getStatus: () => ({ supported: typeof Context === 'function', contextState: disposed ? 'closed' : (context?.state ?? 'locked'), volume, ambience, heartbeatIntensity: intensity, voices: voices.size, ambientNodes: ambient.size }),
  };
}
