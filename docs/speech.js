// A single narration channel: a new request replaces the previous one.
// Incidental character noises never cut an instruction short.
export function createSpeech(audio, voice, getSettings, onBlocked = () => {}) {
  let attempt = 0;
  function stop() {
    attempt++;
    audio.pause();
    try { audio.currentTime = 0; } catch {}
  }
  function play(file, {ambient = false} = {}) {
    if (ambient && !audio.paused && !audio.ended) return;
    stop();
    const settings = getSettings();
    if (!voice.ready || settings.muted || settings.voice <= 0) return;
    if (!/^[a-z0-9-]+$/.test(file)) throw new Error('Invalid speech clip');
    const thisAttempt = attempt;
    audio.src = 'audio/' + file + '.m4a?v=' + encodeURIComponent(voice.version);
    audio.volume = Math.max(0, Math.min(1, settings.voice));
    audio.play().catch(error => {
      if (thisAttempt !== attempt || error.name === 'AbortError') return;
      onBlocked();
    });
  }
  return {play, stop};
}
