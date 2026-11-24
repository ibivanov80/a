import {chapters, tasks} from './rescue-data.js';
import {neighbours} from './rescue-options.js';
import {LEVELS} from './data.js?v=variety-v1';

const storageKey = 'bukvobum-rescues-v1';
const byId = new Map(tasks.map(task => [task.id, task]));
const recordings = new Map();
LEVELS.forEach((level, index) => level.words.forEach((word, position) => {
  recordings.set(word.toLocaleUpperCase('ru'), index + '-word-' + position);
}));
const escape = value => String(value).replace(/[&<>"']/g, c =>
  ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[c]);
const imagePath = (scene, suffix = '.jpg') => 'assets/rescue/' + encodeURIComponent(scene) + suffix;

function readProgress() {
  let value;
  try { value = JSON.parse(localStorage.getItem(storageKey)); } catch {}
  const validIds = ids => Array.isArray(ids) ? ids.filter(id => byId.has(id)) : [];
  return {
    done: new Set(validIds(value?.done)),
    independent: new Set(validIds(value?.independent)),
    assisted: new Set(validIds(value?.assisted)),
    last: byId.has(value?.last) ? value.last : tasks[0].id
  };
}

function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; --i) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function checkOptions(task) {
  const alternatives = neighbours.get(task.target) ?? [...new Set(tasks
    .filter(other => other.chapter === task.chapter && other.target !== task.target)
    .map(other => other.target))].slice(0, 2);
  return shuffled([task.target, ...alternatives]);
}

function pieceGroups(task) {
  const words = task.target.trim().split(/\s+/);
  let end = 0;
  let next = 0;
  return words.map(word => {
    end += word.length;
    const group = [];
    let consumed = task.pieces.slice(0, next).join('').length;
    while (consumed < end && next < task.pieces.length) {
      group.push(next);
      consumed += task.pieces[next++].length;
    }
    return group;
  });
}

function ask(task) {
  if (task.mode === 'letters') return 'Выбери буквы по порядку.';
  if (task.mode === 'phrase') return 'Собери фразу из карточек.';
  return 'Соедини слоги в слово.';
}

export function createRescue({root, onHome, getSettings = () => ({}), onEffect = () => {}}) {
  let progress = readProgress();
  let memoryOnly = false;
  let opened = false;
  let view = 'map';
  let chapter = null;
  let task = null;
  let bank = [];
  let chosen = [];
  let assisted = false;
  let attempted = false;
  let mergedModel = false;
  let clip = null;
  let utterance = null;
  let watched = false;

  function save() {
    const stored = readProgress();
    stored.done.forEach(id => progress.done.add(id));
    stored.independent.forEach(id => progress.independent.add(id));
    stored.assisted.forEach(id => progress.assisted.add(id));
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        done: [...progress.done], independent: [...progress.independent],
        assisted: [...progress.assisted], last: progress.last
      }));
    } catch { memoryOnly = true; }
  }

  function markAssisted() {
    assisted = true;
    if (task.transfer && !progress.assisted.has(task.id) && !progress.done.has(task.id)) {
      progress.assisted.add(task.id);
      save();
    }
  }
  function stopSpeech() {
    if (clip) {
      clip.onerror = null;
      clip.pause();
      clip = null;
    }
    if (utterance) {
      utterance.onerror = null;
      window.speechSynthesis?.cancel();
      utterance = null;
    }
  }
  function leaveScreen() {
    stopSpeech();
    root.querySelector('.rs-frame video')?.pause();
  }
  function focusTitle() {
    root.querySelector('[data-rs-heading]')?.focus({preventScroll:true});
    window.scrollTo(0, 0);
  }
  function status(text) {
    const el = root.querySelector('[data-rs-status]');
    if (el) el.textContent = text;
  }
  function systemSpeech(text) {
    const settings = getSettings();
    if (settings.muted || settings.voice === 0) {
      status('Звук выключен в настройках игры.');
      return;
    }
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      status('В этом браузере голос недоступен. Можно прочитать вместе со взрослым.');
      return;
    }
    stopSpeech();
    const voice = new SpeechSynthesisUtterance(text);
    voice.lang = 'ru-RU';
    const russian = window.speechSynthesis.getVoices().find(v => /^ru\b/i.test(v.lang));
    if (russian) voice.voice = russian;
    voice.rate = 0.87;
    voice.volume = Math.min(1, Math.max(0, settings.voice ?? 0.9));
    utterance = voice;
    voice.onerror = event => {
      if (utterance === voice && event.error !== 'interrupted' && event.error !== 'canceled')
        status('Голос недоступен. Прочитайте задание вместе.');
    };
    window.speechSynthesis.speak(voice);
  }
  function listenWord() {
    if (view === 'task' || view === 'check') markAssisted();
    const settings = getSettings();
    const sound = recordings.get(task.target);
    if (!sound) return systemSpeech(task.target.toLocaleLowerCase('ru'));
    stopSpeech();
    if (settings.muted || settings.voice === 0) return status('Звук выключен в настройках игры.');
    const audio = new Audio('audio/' + sound + '.m4a');
    audio.volume = Math.min(1, Math.max(0, settings.voice ?? 0.9));
    clip = audio;
    audio.play().catch(() => {
      if (clip === audio) status('Запись не открылась. Прочитайте слово вместе.');
    });
  }
  function header(backAction, backText, rightText) {
    return `<header class="rs-top"><button type="button" class="rs-back" data-rs="${backAction}"><span aria-hidden="true">‹</span>${backText}</button><strong>${escape(rightText)}</strong></header>`;
  }

  function renderMap() {
    leaveScreen();
    view = 'map';
    task = null;
    const next = byId.get(progress.last) || tasks[0];
    const began = progress.done.size > 0 || next.id !== tasks[0].id;
    const cards = chapters.map(item => {
      const deck = tasks.filter(t => t.chapter === item.id);
      const count = deck.filter(t => progress.done.has(t.id)).length;
      const preview = deck[(item.id - 1) % deck.length];
      return `<button class="rs-chapter" data-rs="chapter" data-id="${item.id}">
        <img src="${imagePath(preview.scene)}" alt="" loading="lazy" width="160" height="90">
        <span><small>Шаг ${item.id} · ${count} из ${deck.length}</small><b>${escape(item.title)}</b><span>${escape(item.skill)}</span></span>
      </button>`;
    }).join('');
    document.title = 'Слоговые спасения · Буквобум';
    root.innerHTML = `<main class="rs-page">${header('home','К азбуке','Буквобум')}
      <section class="rs-cover"><div class="rs-cover-copy"><p class="rs-count">Пройдено ${progress.done.size} из ${tasks.length}</p>
      <h1 tabindex="-1" data-rs-heading>Слоговые спасения</h1>
      <p>Собирай слова и помогай героям приключений.</p>
      <button class="rs-primary" data-rs="start" data-id="${next.id}">${began ? 'Продолжить игру' : 'Начать спасение'}</button></div>
      <img src="${imagePath('cover')}" alt="Волк ждёт помощи в ледяной ловушке." width="640" height="360"></section>
      <h2 class="rs-subtitle">Выбери шаг</h2><section class="rs-chapters" aria-label="Шаги программы">${cards}</section>
      ${memoryOnly ? '<p>Браузер сохраняет результат только до закрытия страницы.</p>' : ''}</main>`;
    focusTitle();
  }

  function showChapter(id) {
    const match = chapters.find(item => item.id === id);
    if (!match) return;
    leaveScreen();
    chapter = match;
    task = null;
    view = 'chapter';
    const deck = tasks.filter(item => item.chapter === id);
    const done = deck.filter(item => progress.done.has(item.id)).length;
    const next = deck.find(item => !progress.done.has(item.id)) || deck[0];
    const checks = deck.filter(item => item.transfer);
    const independent = checks.filter(item => progress.independent.has(item.id)).length;
    const withHelp = checks.filter(item => progress.done.has(item.id) && !progress.independent.has(item.id)).length;
    document.title = chapter.title + ' · Слоговые спасения';
    root.innerHTML = `<main class="rs-page">${header('map','Все шаги','Слоговые спасения')}
      <div class="rs-detail"><p class="rs-count">Шаг ${chapter.id} · Пройдено ${done} из ${deck.length}</p>
      <h1 tabindex="-1" data-rs-heading>${escape(chapter.title)}</h1><p>${escape(chapter.skill)}</p>
      ${checks.length ? `<p class="rs-stats">Из ${checks.length} проверочных заданий при первом прохождении самостоятельно решено ${independent}, с поддержкой — ${withHelp}.</p>` : ''}
      <button class="rs-primary" data-rs="start" data-id="${next.id}">${done === deck.length ? 'Сыграть ещё раз' : 'Играть'}</button></div>
      <div class="rs-levels" aria-label="Задания">${deck.map((item,index) =>
        `<button class="rs-level" data-rs="start" data-id="${item.id}" aria-label="Задание ${index + 1}${progress.done.has(item.id) ? ', пройдено' : ''}">
        <span>${String(index + 1).padStart(2,'0')}</span>${progress.done.has(item.id) ? '<i aria-hidden="true">✓</i>' : ''}</button>`).join('')}</div></main>`;
    focusTitle();
  }

  function begin(id) {
    const match = byId.get(id);
    if (!match) return renderMap();
    leaveScreen();
    task = match;
    chapter = chapters.find(item => item.id === task.chapter);
    chosen = [];
    bank = shuffled([...task.pieces, ...task.distractors]);
    assisted = progress.assisted.has(task.id);
    watched = false;
    attempted = false;
    mergedModel = false;
    progress.last = id;
    save();
    view = task.transfer ? 'check' : 'task';
    const deck = tasks.filter(item => item.chapter === task.chapter);
    document.title = chapter.title + ' · Слоговые спасения';
    root.innerHTML = `<main class="rs-page rs-game">${header('currentChapter','К заданиям', 'Шаг ' + chapter.id + ' · ' + (deck.indexOf(task) + 1) + ' из ' + deck.length)}
      <section class="rs-work">
        <figure class="rs-frame"><img class="rs-scene" src="${imagePath(task.scene)}" alt="${escape(task.prompt)}" width="640" height="360"></figure>
        <div class="rs-puzzle"><h1 tabindex="-1" data-rs-heading>${escape(task.prompt)}</h1>
          <div class="rs-instruction"><p data-rs-prompt>${view === 'check' ? 'Прочитай и выбери ответ.' : ask(task)}</p><button class="rs-listen" data-rs="listen" aria-label="Послушать задание системным голосом">Послушать · голос устройства</button></div>
          ${task.chapter === 1 ? '<details class="rs-demo"><summary>Как соединить звуки?</summary><p>Потяни звук «м-м-м» и сразу добавь «у». Веди пальцем слева направо и скажи слитно.</p><b>м-м-му → му</b><p>Теперь попробуй сам.</p></details>' : ''}
          ${task.transfer ? `<div class="rs-check" role="group" aria-label="Выбери подходящий ответ">${checkOptions(task).map(word =>
            `<button class="rs-choice" data-rs="check-word" data-word="${escape(word)}">${escape(word)}</button>`).join('')}</div>` : ''}
          <div class="rs-assembly" ${view === 'check' ? 'hidden' : ''}><div class="rs-slots" aria-label="Собранное слово"></div>
          <div class="rs-bank" role="group" aria-label="Карточки">${bank.map((piece,i) =>
            `<button class="rs-tile" data-rs="tile" data-index="${i}">${escape(piece)}</button>`).join('')}</div>
          </div><div class="rs-tools"><button data-rs="undo" ${view === 'check' ? 'hidden' : ''} disabled>Отменить ход</button><button data-rs="hint">Подсказка</button></div>
          <div class="rs-model" hidden></div><p class="rs-feedback" role="status" aria-live="polite" data-rs-status></p>
        </div>
      </section></main>`;
    updateBoard();
    focusTitle();
  }
  function updateBoard() {
    const slots = root.querySelector('.rs-slots');
    slots.innerHTML = pieceGroups(task).map(group =>
      `<span class="rs-wordgroup">${group.map(i => {
        const text = i < chosen.length ? bank[chosen[i]] : '';
        return `<span class="rs-slot ${text ? 'filled' : ''} ${i === chosen.length ? 'current' : ''}" style="--letters:${task.pieces[i].length}" aria-label="${text ? escape(text) : 'Свободное место'}">${escape(text)}</span>`;
      }).join('')}</span>`).join('');
    root.querySelectorAll('[data-rs="tile"]').forEach((button, i) => {
      button.disabled = chosen.includes(i);
      button.classList.remove('rs-again');
    });
    root.querySelector('[data-rs="undo"]').disabled = chosen.length === 0;
  }
  function checkWord(button, keyboardClick) {
    if (view !== 'check') return;
    attempted = true;
    if (button.dataset.word !== task.target) {
      markAssisted();
      status('Прочитай до конца и выбери слово, которое подходит к загадке.');
      button.classList.add('rs-again');
      return;
    }
    stopSpeech();
    view = 'task';
    root.querySelector('.rs-check').hidden = true;
    root.querySelector('.rs-assembly').hidden = false;
    root.querySelector('[data-rs="undo"]').hidden = false;
    root.querySelector('[data-rs-prompt]').textContent = ask(task);
    status('Верно! Теперь собери прочитанное.');
    onEffect('pop');
    if (keyboardClick) root.querySelector('[data-rs="tile"]')?.focus();
  }
  function pick(index, keyboardClick) {
    if (view !== 'task' || chosen.includes(index) || !bank[index]) return;
    attempted = true;
    const button = root.querySelector(`[data-rs="tile"][data-index="${index}"]`);
    if (bank[index] !== task.pieces[chosen.length]) {
      markAssisted();
      status('Попробуй другую карточку. Собранная часть осталась на месте.');
      button.classList.add('rs-again');
      return;
    }
    stopSpeech();
    chosen.push(index);
    onEffect('pop');
    if (chosen.length === task.pieces.length) return win();
    updateBoard();
    const assembled = pieceGroups(task)
      .map(group => group.filter(i => i < chosen.length).map(i => bank[chosen[i]]).join(''))
      .filter(Boolean).join(' ');
    status('Собрано ' + assembled + '. Выбирай дальше.');
    if (keyboardClick) root.querySelector('[data-rs="tile"]:not(:disabled)')?.focus();
  }
  function hint() {
    if (task.transfer && !attempted) {
      status('Попробуй выбрать ответ. Или открой образец, чтобы прочитать вместе.');
      const model = root.querySelector('.rs-model');
      model.hidden = false;
      model.innerHTML = '<button data-rs="show-model">Открыть образец</button>';
      return;
    }
    renderModel();
  }
  function renderModel() {
    markAssisted();
    const model = root.querySelector('.rs-model');
    model.hidden = false;
    const words = pieceGroups(task).map(group => group.map(i => escape(task.pieces[i])).join(' · ')).join('　');
    const voiceLabel = recordings.has(task.target) ? 'Послушать слово' : 'Послушать · голос устройства';
    model.innerHTML = `<span>Прочитаем вместе</span><b>${mergedModel ? escape(task.target) : words}</b>
      <button data-rs="blend">${mergedModel ? 'Разложить на карточки' : 'Соединить и прочитать'}</button>
      <button data-rs="word">${voiceLabel}</button>`;
    status(view === 'check' ? 'Найди это слово среди ответов.' : 'Следующая карточка — ' + task.pieces[chosen.length] + '.');
  }
  function win() {
    view = 'win';
    if (task.transfer && !assisted && !progress.done.has(task.id)) progress.independent.add(task.id);
    progress.done.add(task.id);
    const next = tasks[tasks.indexOf(task) + 1];
    progress.last = next?.id || tasks.find(item => !progress.done.has(item.id))?.id || task.id;
    save();
    stopSpeech();
    onEffect('gentle');
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const label = !next ? 'К карте спасений' : next.chapter !== task.chapter ? 'К следующему шагу' : 'Ещё спасение';
    root.innerHTML = `<main class="rs-page rs-game">${header('currentChapter','К заданиям','Слово собрано')}
      <section class="rs-work rs-win"><figure class="rs-frame">
        <img class="rs-scene" src="${imagePath(task.scene,'-end.jpg')}" alt="${escape(task.outcome)}" width="640" height="360">
        <video playsinline muted preload="none" poster="${imagePath(task.scene)}" aria-label="${escape(task.outcome)}" hidden></video>
        <span class="rescue-prop rs-still-prop" data-trick="${escape(task.trick)}" aria-hidden="true">${escape(task.prop)}</span>
      </figure><div class="rs-puzzle"><h1 class="rs-answer" tabindex="-1" data-rs-heading>${escape(task.target)}</h1>
        <p class="rs-outcome">${escape(task.outcome)}</p>
        <div class="rs-end-actions"><button class="rs-primary" data-rs="next">${label}</button>
        <button class="rs-quiet" data-rs="replay">${reduceMotion ? 'Смотреть спасение' : 'Смотреть ещё раз'}</button></div>
        <button class="rs-listen" data-rs="word">${recordings.has(task.target) ? 'Послушать слово' : 'Послушать слово · голос устройства'}</button>
        <p class="rs-feedback" role="status" data-rs-status></p>
      </div></section></main>`;
    focusTitle();
    if (!reduceMotion) playMovie();
  }
  function playMovie() {
    if (view !== 'win') return;
    const frame = root.querySelector('.rs-frame');
    const video = frame.querySelector('video');
    const replay = root.querySelector('[data-rs="replay"]');
    // Keep the final still available on devices which block playback.
    const restore = () => {
      if (!video.isConnected) return;
      video.hidden = true;
      const prop = frame.querySelector('.rescue-prop');
      if (prop) {
        prop.hidden = false;
        prop.classList.add('rs-still-prop');
      }
      replay.textContent = 'Смотреть ещё раз';
    };
    if (!watched) video.src = imagePath(task.scene,'.mp4');
    watched = true;
    video.pause();
    video.currentTime = 0;
    video.muted = true;
    video.hidden = false;
    video.onended = restore;
    video.onerror = () => {
      restore();
      status('Видео не открылось. Спасение показано на картинке.');
    };
    frame.querySelector('.rescue-prop')?.remove();
    const prop = document.createElement('span');
    prop.className = 'rescue-prop';
    prop.hidden = true;
    video.onplaying = () => { prop.hidden = false; };
    prop.dataset.trick = task.trick;
    prop.textContent = task.prop;
    prop.setAttribute('aria-hidden','true');
    frame.append(prop);
    video.play().catch(error => {
      if (error.name === 'AbortError') return;
      restore();
      if (video.isConnected) status('Нажми «Смотреть ещё раз», чтобы запустить видео.');
    });
  }
  function onClick(event) {
    const el = event.target.closest('button[data-rs]');
    if (!opened || !el || !root.contains(el) || el.disabled) return;
    switch (el.dataset.rs) {
      case 'home': destroy(); onHome(); break;
      case 'map': renderMap(); break;
      case 'chapter': showChapter(Number(el.dataset.id)); break;
      case 'currentChapter': showChapter(task.chapter); break;
      case 'start': begin(Number(el.dataset.id)); break;
      case 'check-word': checkWord(el, event.detail === 0); break;
      case 'tile': pick(Number(el.dataset.index), event.detail === 0); break;
      case 'undo':
        if (!chosen.length || view !== 'task') break;
        chosen.pop();
        updateBoard();
        status('Последняя карточка вернулась.');
        break;
      case 'hint': hint(); break;
      case 'listen': systemSpeech(task.prompt + ' ' + (view === 'check' ? 'Прочитай и выбери ответ.' : ask(task))); break;
      case 'show-model': renderModel(); break;
      case 'blend': mergedModel = !mergedModel; renderModel(); break;
      case 'word': listenWord(); break;
      case 'replay': playMovie(); break;
      case 'next': {
        if (view !== 'win') break;
        const next = tasks[tasks.indexOf(task) + 1];
        if (!next) renderMap();
        else if (next.chapter !== task.chapter) showChapter(next.chapter);
        else begin(next.id);
        break;
      }
    }
  }
  function destroy() {
    if (!opened) return;
    leaveScreen();
    root.removeEventListener('click', onClick);
    opened = false;
  }
  function open(id) {
    destroy();
    opened = true;
    root.addEventListener('click', onClick);
    if (byId.has(Number(id))) begin(Number(id));
    else renderMap();
  }
  return {open, destroy};
}
