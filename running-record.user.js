// ==UserScript==
// @name         Запись котов на свободных бегитах СК
// @author       Волчий Вой
// @version      1.0
// @description  Записывает имена и ID котиков
// @match        https://catwar.su/cw3/*
// @match        https://catwar.net/cw3/*
// @run-at       document-idle
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/laika7/cw-guard/main/running-record.user.js
// @updateURL    https://raw.githubusercontent.com/laika7/cw-guard/main/running-record.user.js
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'cw3_cat_scribe_v1';
  const UI_KEY = 'cw3_cat_scribe_ui_v1';

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { cats: [], seen: {} };
      const obj = JSON.parse(raw);
      return {
        cats: Array.isArray(obj.cats) ? obj.cats : [],
        seen: obj.seen && typeof obj.seen === 'object' ? obj.seen : {}
      };
    } catch (_) {
      return { cats: [], seen: {} };
    }
  }

  function saveData(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
  }

  function loadUI() {
    try {
      const raw = localStorage.getItem(UI_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) { return null; }
  }

  function saveUI(ui) {
    try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch (_) {}
  }

  let data = loadData();

  function parseCatsOnField() {
    const result = [];
    const links = document.querySelectorAll('#cages .cat_tooltip u a[href^="/cat"]');
    const seenIds = new Set();
    links.forEach(a => {
      const m = a.getAttribute('href').match(/^\/cat(\d+)/);
      if (!m) return;
      const id = m[1];
      const name = (a.textContent || '').trim();
      if (!name || seenIds.has(id)) return;
      seenIds.add(id);
      result.push({ id, name });
    });
    return result;
  }

  const style = document.createElement('style');
  style.textContent = `
    #cw-scribe {
      position: fixed;
      z-index: 999999;
      top: 80px;
      left: 80px;
      width: 340px;
      height: 460px;
      min-width: 240px;
      min-height: 200px;
      background: #1a1a1a;
      color: #f2f2f2;
      border: 1px solid #f2f2f2;
      border-radius: 8px;
      font: 12px/1.35 Verdana, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      user-select: none;
    }
    #cw-scribe.collapsed { height: 34px !important; min-height: 34px; }
    #cw-scribe.hidden { display: none; }
    #cw-scribe-head {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 8px;
      background: #000;
      border-bottom: 1px solid #f2f2f2;
      cursor: move;
      flex: 0 0 auto;
    }
    #cw-scribe-title {
      font-weight: bold;
      font-size: 12px;
      flex: 1 1 auto;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #ffffff;
    }
    #cw-scribe-head button {
      background: #1a1a1a;
      color: #ffffff;
      border: 1px solid #ffffff;
      border-radius: 4px;
      padding: 1px 7px;
      font: 12px Verdana, sans-serif;
      cursor: pointer;
      line-height: 18px;
    }
    #cw-scribe-head button:hover { background: #ffffff; color: #000000; }
    #cw-scribe-toolbar {
      display: flex;
      gap: 6px;
      padding: 6px 8px;
      border-bottom: 1px solid #ffffff;
      flex: 0 0 auto;
      background: #000000;
    }
    #cw-scribe-toolbar button {
      flex: 1 1 auto;
      background: #1a1a1a;
      color: #ffffff;
      border: 1px solid #ffffff;
      border-radius: 5px;
      padding: 5px 6px;
      font: 12px Verdana, sans-serif;
      cursor: pointer;
    }
    #cw-scribe-toolbar button:hover { background: #ffffff; color: #000000; }
    #cw-scribe-list {
      flex: 1 1 auto;
      overflow: auto;
      padding: 8px;
      background: #1a1a1a;
    }
    #cw-scribe-list::-webkit-scrollbar { width: 10px; }
    #cw-scribe-list::-webkit-scrollbar-track { background: #000; }
    #cw-scribe-list::-webkit-scrollbar-thumb { background: #666; border-radius: 5px; }
    #cw-scribe-list::-webkit-scrollbar-thumb:hover { background: #999; }
    .cw-scribe-section {
      margin-bottom: 18px;
    }
    .cw-scribe-section-title {
      font-weight: bold;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 11px;
      margin: 0 0 6px;
      border-bottom: 1px solid #666;
      padding-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .cw-scribe-section-title .cw-copy-btn {
      margin-left: auto;
    }
    .cw-scribe-text {
      color: #e8e8e8;
      word-break: break-word;
      white-space: pre-wrap;
    }
    .cw-copy-btn {
      background: #1a1a1a;
      color: #ffffff;
      border: 1px solid #ffffff;
      border-radius: 4px;
      padding: 1px 8px;
      font: 11px Verdana, sans-serif;
      cursor: pointer;
      line-height: 16px;
    }
    .cw-copy-btn:hover { background: #ffffff; color: #000000; }
    .cw-copy-btn.copied { background: #ffffff; color: #000000; }
    .cw-scribe-empty {
      color: #888;
      text-align: center;
      padding: 24px 8px;
      font-style: italic;
    }
    #cw-scribe-footer {
      flex: 0 0 auto;
      padding: 6px 8px;
      border-top: 1px solid #ffffff;
      background: #000000;
      display: flex;
      gap: 6px;
    }
    #cw-scribe-footer button {
      flex: 1 1 auto;
      background: #5a1a1a;
      color: #ffffff;
      border: 1px solid #ff4444;
      border-radius: 5px;
      padding: 5px;
      font: 12px Verdana, sans-serif;
      cursor: pointer;
    }
    #cw-scribe-footer button:hover { background: #ff4444; color: #000000; }
    #cw-scribe-resize {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 16px;
      height: 16px;
      cursor: nwse-resize;
      background-color: #000;
      background-image:
        linear-gradient(135deg, transparent 45%, #fff 45%, #fff 55%, transparent 55%),
        linear-gradient(135deg, transparent 45%, #fff 45%, #fff 55%, transparent 55%);
      background-size: 8px 8px, 8px 8px;
      background-position: 0 0, 4px 4px;
      border-top-left-radius: 4px;
    }
    #cw-scribe-count { color: #ffffff; }
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'cw-scribe';
  root.innerHTML = `
    <div id="cw-scribe-head">
      <span id="cw-scribe-title">Коты на локации <span id="cw-scribe-count"></span></span>
      <button id="cw-scribe-min" type="button">-</button>
      <button id="cw-scribe-close" type="button">x</button>
    </div>
    <div id="cw-scribe-toolbar">
      <button id="cw-scribe-record" type="button">Записать</button>
    </div>
    <div id="cw-scribe-list"></div>
    <div id="cw-scribe-footer">
      <button id="cw-scribe-clear" type="button">Очистить всё</button>
    </div>
    <div id="cw-scribe-resize"></div>
  `;
  document.body.appendChild(root);

  const $ = id => document.getElementById(id);
  const listEl = $('cw-scribe-list');
  const countEl = $('cw-scribe-count');

  function makeCopyButton(getText) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cw-copy-btn';
    btn.textContent = 'Копировать';
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      copyToClipboard(getText());
      btn.classList.add('copied');
      btn.textContent = 'Скопировано';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.textContent = 'Копировать';
      }, 900);
    });
    return btn;
  }

  function renderList() {
    listEl.innerHTML = '';
    if (!data.cats.length) {
      const empty = document.createElement('div');
      empty.className = 'cw-scribe-empty';
      empty.textContent = 'Свободных бегитов пока нет...';
      listEl.appendChild(empty);
      countEl.textContent = '';
      return;
    }

    const namesText = data.cats.map(c => c.name).join(', ');
    const idsText = data.cats.map(c => c.id).join(', ');

    const namesSection = document.createElement('div');
    namesSection.className = 'cw-scribe-section';

    const namesTitle = document.createElement('div');
    namesTitle.className = 'cw-scribe-section-title';
    namesTitle.appendChild(document.createTextNode('Имена'));
    namesTitle.appendChild(makeCopyButton(() => namesText));
    namesSection.appendChild(namesTitle);

    const namesBody = document.createElement('div');
    namesBody.className = 'cw-scribe-text';
    namesBody.textContent = namesText;
    namesSection.appendChild(namesBody);

    listEl.appendChild(namesSection);

    const idsSection = document.createElement('div');
    idsSection.className = 'cw-scribe-section';

    const idsTitle = document.createElement('div');
    idsTitle.className = 'cw-scribe-section-title';
    idsTitle.appendChild(document.createTextNode('ID'));
    idsTitle.appendChild(makeCopyButton(() => idsText));
    idsSection.appendChild(idsTitle);

    const idsBody = document.createElement('div');
    idsBody.className = 'cw-scribe-text';
    idsBody.textContent = idsText;
    idsSection.appendChild(idsBody);

    listEl.appendChild(idsSection);

    countEl.textContent = '(' + data.cats.length + ')';
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(ta);
  }

  function recordCats() {
    const found = parseCatsOnField();
    if (!found.length) return;
    let added = 0;
    found.forEach(c => {
      if (!data.seen[c.id]) {
        data.seen[c.id] = c.name;
        data.cats.push({ id: c.id, name: c.name });
        added++;
      }
    });
    if (!added) return;
    saveData(data);
    renderList();
  }

  $('cw-scribe-record').addEventListener('click', recordCats);

  $('cw-scribe-clear').addEventListener('click', () => {
    if (!data.cats.length) return;
    if (confirm('Точно очистить весь список котов?')) {
      data = { cats: [], seen: {} };
      saveData(data);
      renderList();
    }
  });

  const UI = loadUI() || {
    x: 80, y: 80, w: 340, h: 460,
    collapsed: false
  };

  function applyUI() {
    root.style.left = UI.x + 'px';
    root.style.top = UI.y + 'px';
    root.style.width = UI.w + 'px';
    root.style.height = UI.h + 'px';
    root.classList.toggle('collapsed', !!UI.collapsed);
  }

  function setCollapsed(v) {
    UI.collapsed = v;
    saveUI(UI);
    applyUI();
  }

  $('cw-scribe-min').addEventListener('click', e => {
    e.stopPropagation();
    setCollapsed(!UI.collapsed);
  });
  $('cw-scribe-close').addEventListener('click', e => {
    e.stopPropagation();
    root.remove();
  });

  $('cw-scribe-head').addEventListener('dblclick', e => {
    if (e.target.tagName === 'BUTTON') return;
    setCollapsed(!UI.collapsed);
  });

  (function makeDraggable() {
    const head = $('cw-scribe-head');
    let dragging = false;
    let sx = 0, sy = 0, ox = 0, oy = 0;

    head.addEventListener('mousedown', e => {
      if (e.target.tagName === 'BUTTON') return;
      dragging = true;
      sx = e.clientX;
      sy = e.clientY;
      ox = UI.x;
      oy = UI.y;
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      let nx = ox + (e.clientX - sx);
      let ny = oy + (e.clientY - sy);
      nx = Math.max(0, Math.min(window.innerWidth - 60, nx));
      ny = Math.max(0, Math.min(window.innerHeight - 40, ny));
      UI.x = nx;
      UI.y = ny;
      root.style.left = nx + 'px';
      root.style.top = ny + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        saveUI(UI);
      }
    });
  })();

  (function makeResizable() {
    const handle = $('cw-scribe-resize');
    let resizing = false;
    let sx = 0, sy = 0, ow = 0, oh = 0;

    handle.addEventListener('mousedown', e => {
      if (UI.collapsed) return;
      resizing = true;
      sx = e.clientX;
      sy = e.clientY;
      ow = UI.w;
      oh = UI.h;
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('mousemove', e => {
      if (!resizing) return;
      let nw = ow + (e.clientX - sx);
      let nh = oh + (e.clientY - sy);
      nw = Math.max(240, Math.min(900, nw));
      nh = Math.max(180, Math.min(900, nh));
      UI.w = nw;
      UI.h = nh;
      root.style.width = nw + 'px';
      root.style.height = nh + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (resizing) {
        resizing = false;
        saveUI(UI);
      }
    });
  })();

  applyUI();
  renderList();
})();
