// The rescue game uses only the same prerecorded Russian narrator as the alphabet.
import {LEVELS} from './data.js?v=variety-v1';

const words = new Map();
for (const [index, level] of LEVELS.entries()) {
  for (const [position, word] of level.words.entries()) {
    words.set(word.toLocaleUpperCase('ru'), `audio/${index}-word-${position}.m4a`);
  }
}
for (const [word, clip] of Object.entries({
  ПАПА: 'papa', САМ: 'sam', КИНО: 'kino', ТАБУРЕТКА: 'taburetka'
})) {
  words.set(word, `assets/rescue-voice/${clip}.m4a`);
}

const shared = {
  assemble: 'assemble',
  check: 'read',
  wrong: 'again',
  hint: 'together',
  outcome: 'magic',
  start: 'welcome',
  next: 'next'
};

export function rescueClip(task, kind) {
  if (task?.id === 1 && kind === 'piece:А') return 'assets/rescue-voice/vowel-a.m4a';
  if (task?.id === 1 && kind === 'piece:У') return 'assets/rescue-voice/vowel-u.m4a';
  if (kind === 'word') return words.get(task?.target) ?? null;
  if (kind === 'prompt') return null;
  const name = kind === 'outcome' && task?.id % 2 === 0 ? 'hooray' : shared[kind];
  return name ? `assets/rescue-voice/${name}.m4a` : null;
}
