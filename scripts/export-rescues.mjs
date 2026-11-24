// From the repository root: node scripts/export-rescues.mjs [output.html]
// Requires Node 22+ and esbuild (npm install --no-save --package-lock=false esbuild@0.27.7).
import {createRequire} from 'node:module';
import {readFileSync, openSync, closeSync, writeSync, renameSync, unlinkSync, statSync} from 'node:fs';
import {basename, dirname, extname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tasks} from '../docs/rescue-data.js';
import {rescueClip} from '../docs/rescue-voice.js';
import {rescuePoster} from '../docs/rescue-scene.js';

const require = createRequire(import.meta.url);
const {build} = require('esbuild');
const docs = fileURLToPath(new URL('../docs/', import.meta.url));
const destination = resolve(process.argv[2] ?? resolve(docs, '../../Слоговые спасения.html'));
const mime = new Map([
  ['.jpg', 'image/jpeg'], ['.m4a', 'audio/mp4'], ['.mp4', 'video/mp4'], ['.ttf', 'font/ttf']
]);

const assets = new Set(['assets/rescue/cover-3d.jpg']);
const kinds = ['assemble', 'check', 'hint', 'wrong', 'outcome', 'prompt', 'word', 'start', 'next'];
for (const task of tasks) {
  const id = String(task.id).padStart(3, '0');
  assets.add(rescuePoster(task));
  for (const name of ['r' + id + '-end.jpg', 'r' + id + '.mp4']) {
    assets.add('assets/rescue-cinema/' + name);
  }
  for (const kind of [...kinds, ...task.pieces.map(piece => 'piece:' + piece)]) {
    const clip = rescueClip(task, kind);
    if (clip) assets.add(clip);
  }
}
const missing = [...assets].filter(path => !statSync(resolve(docs, path), {throwIfNoEntry:false})?.size);
if (missing.length) throw Error('Missing ' + missing.length + ' rescue assets, beginning with ' + missing.slice(0, 3).join(', '));

// Keep base64 in individual DOM nodes. Only the currently requested files become binary blobs.
const blobResolver = `
const urls = new Map();
function offlineAsset(path) {
  const id = 'asset-' + path;
  const node = document.getElementById(id);
  if (!node) throw new Error('Missing embedded resource ' + path);
  if (urls.has(id)) {
    const url = urls.get(id);
    urls.delete(id);
    urls.set(id, url);
    return url;
  }
  const encoded = node.textContent;
  const bytes = Uint8Array.fromBase64 ? Uint8Array.fromBase64(encoded)
    : Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], {type: node.dataset.mime}));
  urls.set(id, url);
  // Leave room for the whole chapter gallery, narration, current movie and both posters.
  if (urls.size > 28) {
    const oldest = urls.keys().next().value;
    URL.revokeObjectURL(urls.get(oldest));
    urls.delete(oldest);
  }
  return url;
}
`;

const entry = `
import {createRescue} from './rescue-ui.js';
const root = document.getElementById('app');
const soundKey = 'bukvobum-rescues-sound-v1';
let muted = false;
try { muted = localStorage.getItem(soundKey) === 'off'; } catch {}
function route() {
  const hash = location.hash.slice(1).replace(/^rescue\\/?/, '');
  game.open(hash || 'map');
}
const game = createRescue({
  root, onHome: () => game.open('map'),
  getSettings: () => ({muted, voice: .9, effects: .35}),
  onToggleSound: () => {
    muted = !muted;
    try { localStorage.setItem(soundKey, muted ? 'off' : 'on'); } catch {}
  },
  onRoute: path => {
    try { history.replaceState(null, '', '#' + path); } catch {}
  },
});
window.addEventListener('hashchange', route);
route();
`;

const result = await build({
  stdin: {contents: entry, resolveDir: docs, sourcefile: 'offline-entry.js'}, bundle: true,
  write: false, format: 'iife', target: 'safari15', charset: 'utf8', legalComments: 'none',
  plugins: [{
    name: 'embedded-media',
    setup(builder) {
      builder.onLoad({filter: /[/\\]rescue-scene\.js$/}, args => {
        const source = readFileSync(args.path, 'utf8');
        const declaration = 'export function cinemaAsset(relativePath) {\n  return relativePath;\n}';
        if (!source.includes(declaration)) throw Error('Update the standalone cinemaAsset adapter');
        return {contents: blobResolver + source.replace(declaration, 'export {offlineAsset as cinemaAsset};\nconst cinemaAsset = offlineAsset;'),
          resolveDir: dirname(args.path), loader: 'js'};
      });
    },
  }],
});
const script = result.outputFiles[0].text.replaceAll('</script', '<\\/script');
const css = ['game.css', 'rescue.css'].map(name => readFileSync(resolve(docs, name), 'utf8')).join('\n')
  .replace(/url\((['"]?)(assets\/[^)"']+)\1\)/g, (_, quote, path) => {
    const type = mime.get(extname(path));
    if (!type) throw Error('Unknown CSS resource type ' + path);
    return 'url("data:' + type + ';base64,' + readFileSync(resolve(docs, path)).toString('base64') + '")';
  });

const temporary = resolve(dirname(destination), '.' + basename(destination) + '.' + process.pid + '.tmp');
const fd = openSync(temporary, 'wx');
let closed = false;
try {
  writeSync(fd, '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#faf6eb"><title>Слоговые спасения · Буквобум</title><style>' +
    css + '\n.rs-page:has(.rs-cover) [data-rs="home"]{visibility:hidden}</style></head><body><div id="app" aria-live="off"></div><noscript>Для игры нужен JavaScript.</noscript>\n');
  for (const path of [...assets].sort()) {
    if (!/^[\w./-]+$/.test(path) || !mime.has(extname(path))) throw Error('Unsupported asset path ' + path);
    const encoded = readFileSync(resolve(docs, path)).toString('base64');
    writeSync(fd, '<script type="application/octet-stream" id="asset-' + path + '" data-mime="' +
      mime.get(extname(path)) + '">' + encoded + '</script>\n');
  }
  writeSync(fd, '<script>\n' + script + '\n</script></body></html>\n');
  closeSync(fd);
  closed = true;
  renameSync(temporary, destination);
} finally {
  if (!closed) closeSync(fd);
  if (statSync(temporary, {throwIfNoEntry:false})) unlinkSync(temporary);
}
console.log(destination, tasks.length + ' игр, ' + assets.size + ' ресурсов, ' +
  (statSync(destination).size / 1024 / 1024).toFixed(1) + ' МиБ');
