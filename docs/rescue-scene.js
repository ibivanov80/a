// Only the current rescue is loaded. The standalone edition can supply a blob URL resolver.
export function cinemaAsset(relativePath) {
  return relativePath;
}

const library = 'assets/rescue-cinema/';
const frameId = task => 'r' + String(task.id).padStart(3, '0');

export function rescuePoster(task) {
  return cinemaAsset(library + frameId(task) + '-start.jpg');
}

export function mountRescueScene(figure, task, {state = 'before', prompt = task.prompt, reducedMotion = false, onStart, onEnd} = {}) {
  const before = state === 'before';
  const startFrame = rescuePoster(task);
  const finalFrame = cinemaAsset(library + frameId(task) + '-end.jpg');
  const poster = document.createElement('img');
  poster.className = 'rs-scene';
  poster.width = 720;
  poster.height = 404;
  poster.alt = before ? prompt : task.outcome;
  poster.src = before ? startFrame : finalFrame;
  figure.replaceChildren(poster);
  if (before) return {replay() {}, destroy() {}};

  const video = document.createElement('video');
  video.className = 'rs-cinema-video';
  video.playsInline = true;
  video.muted = true;
  video.preload = 'none';
  video.hidden = true;
  video.poster = startFrame;
  video.setAttribute('aria-label', task.outcome);
  video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none';
  figure.style.position = 'relative';
  figure.append(video);
  let alive = true;
  let active = false;
  let generation = 0;
  function finish() {
    if (!alive) return;
    video.hidden = true;
    if (active) onEnd?.();
    active = false;
  }
  video.addEventListener('playing', () => {
    if (!alive || active) return;
    active = true;
    video.hidden = false;
    onStart?.();
  });
  video.addEventListener('ended', finish);
  video.addEventListener('error', finish);
  function replay() {
    if (!alive) return;
    const attempt = ++generation;
    video.pause();
    finish();
    if (!video.hasAttribute('src')) video.src = cinemaAsset(library + frameId(task) + '.mp4');
    video.currentTime = 0;
    video.hidden = false;
    video.play().catch(() => { if (attempt === generation) finish(); });
  }
  function destroy() {
    generation++;
    alive = false;
    video.pause();
    if (active) onEnd?.();
    active = false;
    video.removeAttribute('src');
    video.load();
  }
  if (!reducedMotion) replay();
  return {replay, destroy};
}
