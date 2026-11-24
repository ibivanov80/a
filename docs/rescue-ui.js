import {chapters, tasks} from './rescue-data.js';
import {neighbours} from './rescue-options.js';
import {rescueClip, rescuePrompt} from './rescue-voice.js?v=denis-riddles-1';
import {cinemaAsset, mountRescueScene, rescuePoster} from './rescue-scene.js?v=denis-riddles-1';
import {createRescueFoley} from './rescue-foley.js';

const storageKey = 'bukvobum-rescues-v1';
const byId = new Map(tasks.map(task => [task.id, task]));
const escape = value => String(value).replace(/[&<>"']/g, c =>
  ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[c]);
const icons = {back:'‹', map:'▦', undo:'↶', hint:'?', next:'▶', replay:'↻'};
const icon = name => `<span class="rs-symbol" aria-hidden="true">${icons[name]}</span>`;

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

export function createRescue({root, onHome, audio = new Audio(), onRoute = () => {},
  getSettings = () => ({}), onToggleSound, onEffect = () => {}}) {
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
  let misses = 0;
  let mergedModel = false;
  const foley = createRescueFoley(getSettings);
  let scene = null;
  let playing = 0;
  let currentClip = null;
  let afterClip = null;
  let demo = false;
  let pausedByBackground = false;

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
    playing++;
    currentClip = null;
    afterClip = null;
    audio.pause();
    audio.onended = null;
    audio.onerror = null;
  }
  function leaveScreen(keepSpeech = false) {
    if (!keepSpeech) stopSpeech();
    foley.stop();
    scene?.destroy();
    scene = null;
  }
  function focusTitle() {
    root.querySelector('[data-rs-heading]')?.focus({preventScroll:true});
    window.scrollTo(0, 0);
  }
  function status(text) {
    const el = root.querySelector('[data-rs-status]');
    if (el) el.textContent = text;
  }
  function soundOff() {
    const settings = getSettings();
    return settings.muted || settings.voice === 0;
  }
  function wordListenLabel() {
    return task.mode === 'phrase' ? 'Послушать фразу' : 'Послушать слово';
  }
  function speak(kind, {explicit = false, after} = {}) {
    stopSpeech();
    const retry = root.querySelector('.rs-audio-retry');
    if (retry) {
      retry.classList.remove('rs-audio-retry');
      status('');
    }
    if (!task || soundOff() || document.hidden) {
      if (explicit && soundOff()) status('Включи звук вверху экрана.');
      return;
    }
    const url = rescueClip(task, kind);
    if (!url) {
      if (explicit) status('Прочитайте вместе со взрослым.');
      return;
    }
    const attempt = playing;
    currentClip = kind;
    afterClip = after;
    function finishClip() {
      if (playing !== attempt || currentClip !== kind) return;
      const next = afterClip;
      currentClip = null;
      afterClip = null;
      next?.();
    }
    function playbackFailed(error) {
      if (playing !== attempt || currentClip !== kind || error?.name === 'AbortError') return;
      if (kind === 'prompt' || kind === 'word') {
        // The child can start a deep-linked riddle with a tap if iPad blocks autoplay.
        afterClip = null;
        const replay = root.querySelector(kind === 'prompt' ? '[data-rs="listen"]' : '[data-rs="word"]');
        replay?.classList.add('rs-audio-retry');
        status(error?.name === 'NotAllowedError' ? 'Нажми на динамик, чтобы послушать.'
          : 'Не удалось загрузить запись. Нажми на динамик ещё раз.');
      } else if (explicit) status('Нажми на динамик ещё раз.');
      finishClip();
    }
    audio.volume = Math.max(0, Math.min(1, getSettings().voice ?? .9));
    audio.src = cinemaAsset(url);
    audio.onended = finishClip;
    audio.onerror = playbackFailed;
    audio.play().catch(playbackFailed);
  }
  function spokenInstruction() {
    if (rescueClip(task, 'prompt')) return 'prompt';
    if (view === 'check') return 'check';
    if (task.mode !== 'phrase' && rescueClip(task, 'assemble')) return 'assemble';
    return null;
  }
  function listenWord() {
    if (view === 'task' || view === 'check') markAssisted();
    speak('word', {explicit: true});
  }
  function soundControl() {
    if (!onToggleSound) return '';
    const off = soundOff();
    return `<button type="button" class="rs-sound" data-rs="mute" aria-label="${off ? 'Включить звук' : 'Выключить звук'}" aria-pressed="${!off}">${speaker(off)}<span>${off ? 'Без звука' : 'Звук'}</span></button>`;
  }
  function speaker(off = false) {
    return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h4l5-4v14l-5-4H3z"/>${off ? '<path d="m16 9 5 6m0-6-5 6"/>' : '<path d="M16 8q4 4 0 8m3-11q7 7 0 14"/>'}</svg>`;
  }
  function header(backAction, backText, rightText) {
    return `<header class="rs-top"><button type="button" class="rs-back" data-rs="${backAction}">${icon(backAction === 'map' ? 'map' : 'back')}${backText}</button><strong>${escape(rightText)}</strong>${soundControl()}</header>`;
  }
  function renderStage(state) {
    const frame = root.querySelector('.rs-frame');
    scene = mountRescueScene(frame, task, {
      state, prompt: rescuePrompt(task), reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onStart() { if (view === 'win') foley.play(task); },
      onEnd() { foley.stop(); }
    });
  }
  function renderMap() {
    leaveScreen();
    view = 'map';
    task = null;
    onRoute('map');
    const next = byId.get(progress.last) || tasks[0];
    const began = progress.done.size > 0 || next.id !== tasks[0].id;
    const cards = chapters.map(item => {
      const deck = tasks.filter(t => t.chapter === item.id);
      const count = deck.filter(t => progress.done.has(t.id)).length;
      const preview = deck[(item.id - 1) % deck.length];
      return `<button class="rs-chapter" data-rs="chapter" data-id="${item.id}">
        <img src="${rescuePoster(preview)}" alt="" loading="lazy" width="160" height="90">
        <span><small>Шаг ${item.id} · ${count} из ${deck.length}</small><b>${escape(item.title)}</b><span>${escape(item.skill)}</span></span>
      </button>`;
    }).join('');
    document.title = 'Слоговые спасения · Буквобум';
    root.innerHTML = `<main class="rs-page">${header('home','К азбуке','Буквобум')}
      <section class="rs-cover"><div class="rs-cover-copy"><p class="rs-count">Пройдено ${progress.done.size} из ${tasks.length}</p>
      <h1 tabindex="-1" data-rs-heading>Слоговые спасения</h1>
      <p>Собирай слова и помогай героям приключений.</p>
      <button class="rs-primary" data-rs="start" data-id="${next.id}">${began ? 'Продолжить игру' : 'Начать спасение'}</button></div>
      <img src="${cinemaAsset('assets/rescue/cover-3d.jpg')}" alt="Волк ждёт помощи в ледяной ловушке." width="640" height="360"></section>
      <h2 class="rs-subtitle">Выбери шаг</h2><section class="rs-chapters" aria-label="Шаги программы">${cards}</section>
      ${memoryOnly ? '<p>Браузер сохраняет результат только до закрытия страницы.</p>' : ''}</main>`;
    focusTitle();
  }

  function showChapter(id) {
    const match = chapters.find(item => item.id === id);
    if (!match) return renderMap();
    leaveScreen();
    chapter = match;
    task = null;
    view = 'chapter';
    onRoute('chapter/' + id);
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

  function begin(id, firstOfSession = false) {
    const match = byId.get(id);
    if (!match) return renderMap();
    leaveScreen();
    task = match;
    chapter = chapters.find(item => item.id === task.chapter);
    chosen = [];
    bank = shuffled([...task.pieces, ...task.distractors]);
    assisted = progress.assisted.has(task.id);
    demo = task.id === tasks[0].id && !progress.done.has(task.id);
    attempted = false;
    misses = 0;
    mergedModel = false;
    progress.last = id;
    onRoute(String(id));
    save();
    view = task.transfer ? 'check' : 'task';
    document.title = chapter.title + ' · Слоговые спасения';
    const instruction = view === 'check' ? 'Выбери ответ' :
      task.mode === 'letters' ? 'Нажимай на буквы' :
      task.mode === 'phrase' ? 'Собери фразу' : 'Собери слово из слогов';
    const spoken = spokenInstruction();
    const listenLabel = spoken === 'prompt' ? 'Послушать загадку' :
      spoken ? 'Повторить инструкцию' : 'Показать подсказку со звуком';
    const listenButton = spoken || rescueClip(task, 'hint') ?
      `<button class="rs-playvoice" data-rs="listen" aria-label="${listenLabel}" title="${listenLabel}">${speaker()}</button>` : '';
    root.innerHTML = `<main class="rs-page rs-game">${header('map','Все игры', 'Спасение ' + task.id + ' из ' + tasks.length)}
      <section class="rs-work">
        <figure class="rs-frame" aria-label="${escape(rescuePrompt(task))}"></figure>
        <div class="rs-puzzle"><div class="rs-question">
          <h1 tabindex="-1" data-rs-heading>${escape(rescuePrompt(task))}</h1>
          ${spoken === 'prompt' ? listenButton : ''}
        </div>
        <div class="rs-instruction"><p class="rs-command" data-rs-prompt>${instruction}</p>${spoken === 'prompt' ? '' : listenButton}</div>
        ${task.transfer ? `<div class="rs-check" role="group" aria-label="Варианты ответа">${checkOptions(task).map(word =>
          `<button class="rs-choice" data-rs="check-word" data-word="${escape(word)}">${escape(word)}</button>`).join('')}</div>` : ''}
        <div class="rs-assembly" ${view === 'check' ? 'hidden' : ''}>
          ${task.id <= 5 ? `<div class="rs-first-model" aria-label="Образец слова">${escape(task.target)}</div>` : ''}
          <div class="rs-slots" aria-label="Собранное слово"></div>
          <div class="rs-bank" role="group" aria-label="Карточки">${bank.map((piece,i) =>
            `<button class="rs-tile" data-rs="tile" data-index="${i}">${escape(piece)}</button>`).join('')}</div>
        </div>
        <div class="rs-tools"><button data-rs="hint">${icon('hint')} Помоги</button><button data-rs="undo" hidden disabled>${icon('undo')} Назад</button></div>
        <div class="rs-model" hidden></div><p class="rs-feedback" role="status" aria-live="polite" data-rs-status></p>
        </div>
      </section></main>`;
    renderStage('before');
    updateBoard();
    focusTitle();
    if (spoken) speak(spoken);
    else if (firstOfSession) speak('next');
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
      button.classList.toggle('rs-guided', demo && !button.disabled && bank[i] === task.pieces[chosen.length]);
    });
    const undo = root.querySelector('[data-rs="undo"]');
    undo.disabled = chosen.length === 0;
    undo.hidden = chosen.length === 0;
  }
  function checkWord(button, keyboardClick) {
    if (view !== 'check') return;
    attempted = true;
    if (button.dataset.word !== task.target) {
      markAssisted();
      status('Прочитай до конца и выбери слово, которое подходит к загадке.');
      button.classList.add('rs-again');
      speak('wrong');
      return;
    }
    stopSpeech();
    view = 'task';
    root.querySelector('.rs-check').hidden = true;
    root.querySelector('.rs-assembly').hidden = false;
    root.querySelector('[data-rs-prompt]').textContent = ask(task);
    if (task.mode !== 'phrase' && rescueClip(task, 'assemble')) speak('assemble');
    const listen = root.querySelector('[data-rs="listen"]');
    if (listen && !rescueClip(task, 'prompt')) {
      listen.title = spokenInstruction() ? 'Повторить инструкцию' : 'Показать подсказку со звуком';
      listen.setAttribute('aria-label', listen.title);
    }
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
      misses++;
      if (misses >= 2 && !task.transfer) {
        demo = true;
        updateBoard();
      }
      status(demo ? 'Попробуй карточку под ладошкой.' : 'Попробуй другую карточку.');
      button.classList.add('rs-again');
      speak('wrong');
      return;
    }
    const pieceKind = 'piece:' + bank[index];
    const voiced = task.id === 1 && Boolean(rescueClip(task, pieceKind));
    chosen.push(index);
    misses = 0;
    if (!voiced) onEffect('pop');
    if (chosen.length === task.pieces.length) return win(voiced ? pieceKind : null);
    if (voiced) speak(pieceKind);
    else if (currentClip !== 'prompt') stopSpeech();
    const from = button.getBoundingClientRect();
    updateBoard();
    const filled = root.querySelectorAll('.rs-slot.filled');
    const slot = filled[filled.length - 1];
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && slot.animate) {
      const to = slot.getBoundingClientRect();
      slot.animate([
        {transform: `translate(${from.x - to.x}px, ${from.y - to.y}px)`, background: '#ffdf8c'},
        {transform: 'translate(0,0)', background: '#c5dfbd'}
      ], {duration: 240, easing: 'ease-out'});
    }
    const assembled = pieceGroups(task)
      .map(group => group.filter(i => i < chosen.length).map(i => bank[chosen[i]]).join(''))
      .filter(Boolean).join(' ');
    status('Собрано ' + assembled + '. Выбирай дальше.');
    if (keyboardClick) root.querySelector('[data-rs="tile"]:not(:disabled)')?.focus();
  }
  function hint() {
    if (task.transfer && !attempted) {
      status('Попробуй выбрать ответ. Или открой образец, чтобы прочитать вместе.');
      speak('hint', {explicit:true});
      const model = root.querySelector('.rs-model');
      model.hidden = false;
      model.innerHTML = '<button data-rs="show-model">Открыть образец</button>';
      return;
    }
    renderModel();
  }
  function renderModel(readWhole = false) {
    markAssisted();
    const model = root.querySelector('.rs-model');
    model.hidden = false;
    const words = pieceGroups(task).map(group => group.map(i => escape(task.pieces[i])).join(' · ')).join('　');
    demo = view === 'task';
    updateBoard();
    const sounds = task.id === 1 && !mergedModel ? task.pieces.filter(piece => rescueClip(task, 'piece:' + piece))
      .map(piece => `<button data-rs="piece" data-piece="${escape(piece)}" aria-label="Послушать звук ${escape(piece)}">${speaker()} ${escape(piece)}</button>`).join('') : '';
    model.innerHTML = `<span>Прочитаем вместе</span><b>${mergedModel ? escape(task.target) : words}</b>
      ${sounds}
      <button data-rs="blend">${mergedModel ? 'Разложить на карточки' : 'Соединить и прочитать'}</button>
      ${rescueClip(task,'word') ? `<button data-rs="word">${speaker()} ${wordListenLabel()}</button>` : ''}`;
    status(view === 'check' ? 'Найди это слово среди ответов.' : 'Следующая карточка — ' + task.pieces[chosen.length] + '.');
    if (readWhole && rescueClip(task,'word')) speak('word');
    else if (rescueClip(task,'hint')) speak('hint');
  }
  function win(lastPiece) {
    const finishingFirstPiece = lastPiece && currentClip === 'piece:' + task.pieces[0];
    view = 'win';
    if (task.transfer && !assisted && !progress.done.has(task.id)) progress.independent.add(task.id);
    progress.done.add(task.id);
    const next = tasks[tasks.indexOf(task) + 1];
    progress.last = next?.id || tasks.find(item => !progress.done.has(item.id))?.id || task.id;
    save();
    leaveScreen(finishingFirstPiece);
    const replayLabel = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Смотреть' : 'Ещё раз';
    root.innerHTML = `<main class="rs-page rs-game">${header('map','Все игры','Спасение ' + task.id + ' из ' + tasks.length)}
      <section class="rs-work rs-win">
        <figure class="rs-frame" aria-label="${escape(task.outcome)}"></figure>
        <div class="rs-puzzle"><div class="rs-question">
          <h1 class="rs-answer" tabindex="-1" data-rs-heading>${escape(task.target)}</h1>
          ${rescueClip(task,'word') ? `<button class="rs-playvoice" data-rs="word" title="${wordListenLabel()}" aria-label="${wordListenLabel()}">${speaker()}</button>` : ''}
        </div>
        <p class="rs-outcome">${escape(task.outcome)}</p>
        <div class="rs-end-actions"><button class="rs-primary rs-next" data-rs="next">${next ? 'Дальше' : 'К играм'} ${icon('next')}</button>
        <button class="rs-quiet" data-rs="replay">${icon('replay')} ${replayLabel}</button></div>
        <p class="rs-feedback" role="status" data-rs-status></p>
        </div>
      </section></main>`;
    renderStage('reward');
    focusTitle();
    if (!lastPiece) playEnding();
    else if (finishingFirstPiece) afterClip = () => speak(lastPiece, {after: playEnding});
    else speak(lastPiece, {after: playEnding});
  }
  function playEnding() {
    const outcome = rescueClip(task,'outcome');
    if (rescueClip(task,'word')) speak('word', {after: outcome ? () => speak('outcome') : undefined});
    else if (outcome) speak('outcome');
  }
  function visibility() {
    if (document.hidden) {
      stopSpeech();
      foley.stop();
      root.querySelector('video')?.pause();
      pausedByBackground = true;
    } else if (pausedByBackground) {
      pausedByBackground = false;
      if (view === 'win') status('Можно посмотреть спасение ещё раз.');
    }
  }
  function onClick(event) {
    const el = event.target.closest('button[data-rs]');
    if (!opened || !el || !root.contains(el) || el.disabled) return;
    if (event.isTrusted) foley.arm();
    switch (el.dataset.rs) {
      case 'home': destroy(); onHome(); break;
      case 'map': renderMap(); break;
      case 'chapter': showChapter(Number(el.dataset.id)); break;
      case 'currentChapter': showChapter(task.chapter); break;
      case 'start': begin(Number(el.dataset.id), true); break;
      case 'check-word': checkWord(el, event.detail === 0); break;
      case 'tile': pick(Number(el.dataset.index), event.detail === 0); break;
      case 'undo':
        if (!chosen.length || view !== 'task') break;
        chosen.pop();
        updateBoard();
        status('Последняя карточка вернулась.');
        break;
      case 'hint': hint(); break;
      case 'listen':
        if (spokenInstruction()) speak(spokenInstruction(), {explicit:true});
        else hint();
        break;
      case 'mute': {
        onToggleSound?.();
        el.outerHTML = soundControl();
        if (soundOff()) { stopSpeech(); foley.stop(); }
        else if (view === 'win') playEnding();
        else if (task) speak(spokenInstruction() || 'next');
        break;
      }
      case 'show-model': renderModel(); break;
      case 'piece': speak('piece:' + el.dataset.piece, {explicit:true}); break;
      case 'blend': mergedModel = !mergedModel; renderModel(mergedModel); break;
      case 'word': listenWord(); break;
      case 'replay': foley.stop(); scene?.replay(); playEnding(); break;
      case 'next': {
        if (view !== 'win') break;
        const next = tasks[tasks.indexOf(task) + 1];
        if (!next) renderMap();
        else begin(next.id);
        break;
      }
    }
  }
  function destroy() {
    if (!opened) return;
    leaveScreen();
    root.removeEventListener('click', onClick);
    document.removeEventListener('visibilitychange', visibility);
    opened = false;
  }
  function open(id) {
    destroy();
    opened = true;
    root.addEventListener('click', onClick);
    document.addEventListener('visibilitychange', visibility);
    if (id === 'map') renderMap();
    else if (typeof id === 'string' && id.startsWith('chapter/')) showChapter(Number(id.slice(8)) || 1);
    else begin(byId.has(Number(id)) ? Number(id) : progress.last, true);
  }
  return {open, destroy};
}
