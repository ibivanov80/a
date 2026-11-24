import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {chapters, tasks} from '../docs/rescue-data.js';
import {neighbours} from '../docs/rescue-options.js';

const mediaDir = new URL('../docs/assets/rescue/', import.meta.url);
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
for (const scene of new Set(tasks.map(task => task.scene))) {
  for (const suffix of ['.jpg', '-end.jpg', '.mp4']) {
    assert(existsSync(new URL(scene + suffix, mediaDir)), 'Missing ' + scene + suffix);
  }
}
assert(tasks.some(t => t.target === 'ВОЛК' && t.scene === 'wolf' && t.pieces.join('/') === 'В/О/Л/К'));
assert(tasks.some(t => t.target === 'ВОЛЧОНОК' && t.pieces.join('/') === 'ВОЛ/ЧО/НОК' && t.scene !== 'wolf'));
console.log('300 graded rescues validated, including syllable nuclei, word boundaries, independent practice, distinct payoffs, wolf, cub and media.');
