import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chapters, tasks} from '../docs/rescue-data.js';
import {neighbours} from '../docs/rescue-options.js';
import {rescuePoster} from '../docs/rescue-scene.js';

const publicRoot = new URL('../docs/', import.meta.url);
const films = new Set();
assert.equal(chapters.length, 10);
assert.equal(tasks.length, 300);
assert.equal(new Set(tasks.map(t => t.outcome)).size, tasks.length, 'Every mission needs a distinct payoff');

const vowels = /[АЕЁИОУЫЭЮЯ]/g;
for (const [index, chapter] of chapters.entries()) {
  assert.equal(chapter.id, index + 1);
  const lessons = tasks.filter(task => task.chapter === chapter.id);
  assert.equal(lessons.length, 30);
  assert(lessons.some(task => task.transfer), 'Each step needs independent practice');
}

for (const [index, task] of tasks.entries()) {
  const label = 'Mission ' + task.id + ', ' + task.target;
  assert.equal(task.id, index + 1, label);
  assert.equal(task.chapter, Math.floor(index / 30) + 1, label);
  assert.match(task.target, /^[А-ЯЁ]+(?: [А-ЯЁ]+)*$/u, label);
  assert.equal(task.pieces.join(''), task.target.replaceAll(' ', ''), label);
  assert(task.pieces.length > 1 && task.prompt && task.outcome && task.prop && task.trick, label);
  assert(Array.isArray(task.distractors), label);
  assert(task.distractors.every(piece => !task.pieces.includes(piece)), label);
  if (task.transfer) {
    const options = neighbours.get(task.target);
    assert.equal(new Set([task.target, ...(options || [])]).size, 3, label + ' reading choices');
  }
  const pieces = [...task.pieces];
  for (const word of task.target.split(' ')) {
    let built = '';
    while (built.length < word.length && pieces.length) {
      const piece = pieces.shift();
      assert.match(piece, /^[А-ЯЁ]+$/u, label);
      if (task.mode === 'letters') assert.equal(piece.length, 1, label);
      else if (!(task.mode === 'phrase' && piece === word && ['В','К','С'].includes(word))) {
        assert.equal((piece.match(vowels) || []).length, 1, label + ' — ' + piece);
      }
      built += piece;
    }
    assert.equal(built, word, label + ' word boundaries');
  }
}
for (const task of tasks) {
  const stem = 'assets/rescue-cinema/r' + String(task.id).padStart(3, '0');
  assert.equal(rescuePoster(task), stem + '-start.jpg', 'Starting scene ' + task.id);
  for (const suffix of ['-start.jpg', '-end.jpg']) {
    const frame = readFileSync(new URL(stem + suffix, publicRoot));
    assert.equal(frame.readUInt16BE(0), 0xffd8, 'Expected JPEG ' + stem + suffix);
    assert.equal(frame.readUInt16BE(frame.length - 2), 0xffd9, 'Incomplete JPEG ' + stem + suffix);
  }
  const film = readFileSync(new URL(stem + '.mp4', publicRoot));
  assert.equal(film.toString('ascii', 4, 8), 'ftyp', 'Expected MP4 ' + stem);
  assert(film.includes(Buffer.from('avc1')), 'Expected H.264 video ' + stem);
  const digest = createHash('sha256').update(film).digest('hex');
  assert(!films.has(digest), 'Repeated film ' + stem);
  films.add(digest);
}
assert(tasks.some(t => t.target === 'ВОЛК' && t.scene === 'wolf' && t.pieces.join('/') === 'В/О/Л/К'));
assert(tasks.some(t => t.target === 'ВОЛЧОНОК' && t.pieces.join('/') === 'ВОЛ/ЧО/НОК' && t.scene !== 'wolf'));
console.log('300 graded rescues validated, including syllable nuclei, word boundaries, independent practice, distinct payoffs, wolf, cub and media.');
