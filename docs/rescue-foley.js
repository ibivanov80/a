// Quiet, timed effects for physical movement. The narrator has a separate volume.
let context;
let noise;

function getContext() {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return null;
  if (!context || context.state === 'closed') {
    context = new Context();
    noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return context;
}

export function createRescueFoley(getSettings) {
  let mix = null;
  let notes = [];
  const volume = () => getSettings().muted ? 0 : (getSettings().effects ?? 0.35);

  function arm() {
    if (volume() <= 0) return;
    try { getContext()?.resume().catch(() => {}); } catch {}
  }

  function stop() {
    for (const node of notes) {
      try { node.stop(); } catch {}
    }
    notes = [];
    mix?.disconnect();
    mix = null;
  }

  function sound(at, duration, from, to, amplitude, texture) {
    const source = texture === 'air' ? context.createBufferSource() : context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    if (texture === 'air') {
      source.buffer = noise;
      source.loop = true;
      filter.type = 'bandpass';
      filter.Q.value = 0.8;
      filter.frequency.setValueAtTime(from, at);
      filter.frequency.exponentialRampToValueAtTime(to, at + duration);
    } else {
      source.type = 'sine';
      source.frequency.setValueAtTime(from, at);
      source.frequency.exponentialRampToValueAtTime(to, at + duration);
      filter.type = 'lowpass';
      filter.frequency.value = 4200;
    }
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(amplitude, at + Math.min(0.035, duration / 7));
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(filter).connect(gain).connect(mix);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start(at);
    source.stop(at + duration + 0.015);
    notes.push(source);
  }

  function play(task) {
    stop();
    if (volume() <= 0 || !context || context.state !== 'running') return;
    mix = context.createGain();
    mix.gain.value = Math.min(1, Math.max(0, volume())) * 0.52;
    mix.connect(context.destination);
    const t = context.currentTime;
    const rustle = (s, d, f, dest, a) => sound(t + s,d,f,dest,a,'air');
    const plop = (s, d, f, dest, a) => sound(t + s,d,f,dest,a,'body');
    const paw = (s, strength) => {
      plop(s,.12,135,60,strength);
      rustle(s,.14,1360,430,strength * 0.6);
    };
    const drops = (s) => {
      [440,690,530].forEach((hz,i) => plop(s + i * .17,.13,hz,hz * 1.7,.24 / (1 + .25*i)));
    };
    if (task.id === 1) {
      // Two soft owl hoots through the megaphone, followed by wings and the falling leaf.
      plop(1.83,.27,410,342,.35);
      plop(2.10,.39,378,290,.39);
      rustle(2.12,.40,860,1760,.31);
      [2.68,2.91,3.21,3.54].forEach(s => rustle(s,.17,1500,640,.28));
      paw(4.04,.28);
      rustle(4.80,.21,1600,660,.22);
    } else if (task.id === 300) {
      paw(1.29,.34);
      paw(2.49,.46);
      [2.83,3.23,3.60,3.91,4.20,4.46,4.69,4.91,5.11,5.30,5.47,5.62].forEach((s,i) => {
        plop(s,.13,265+i*6,196+i*4,.23/(1+i*.12));
        rustle(s,.16,1120,440,.21/(1+i*.14));
      });
    } else if (task.scene === 'wolf' || task.scene === 'penguin') {
      [0,.08,.21].forEach((delay,i) => rustle(2.02 + delay,.08,2950 - i*250,890,.53));
      drops(2.55);
      [3.12,3.3,3.58,3.77,4.04,4.23,4.47].forEach((s,i) => paw(s,.4 - i*.038));
    } else if (task.scene === 'cub') {
      rustle(1.43,.52,2900,640,.42);
      rustle(2.65,.32,740,2100,.38);
      paw(3.40,.46);
      paw(4.48,.31);
    } else if (['frog','cat','bear','mouse'].includes(task.scene)) {
      plop(.85,.18,240,165,.19);
      drops(2.15);
      plop(2.72,.32,155,55,.32);
      rustle(2.72,.42,1080,360,.35);
      plop(4.46,.14,420,600,.19);
    } else {
      rustle(.81,.3,900,1850,.31);
      rustle(2.03,.22,2200,460,.46);
      [2.65,2.88,3.1].forEach(s => rustle(s,.19,860,1800,.34));
      paw(4.47,.3);
    }
    // Accent the prop's movement with a short audible consequence.
    if (task.trick === 'spin') rustle(4.7,.4,1700,540,.25);
    if (task.trick === 'bounce') paw(4.84,.16);
    if (task.trick === 'splash') drops(4.80);
  }
  return {arm,play,stop};
}
