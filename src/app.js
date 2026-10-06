(function(){
'use strict';

/* =====================================================================
   CORE · helpers
   ===================================================================== */
const $ = (s, r) => (r || document).querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 10);
const clone = o => o == null ? o : JSON.parse(JSON.stringify(o));
const nowISO = () => new Date().toISOString();
const safeJSON = x => JSON.stringify(x).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const store = (kind) => ({
  get(k){ try { return window[kind].getItem(k); } catch(e){ return null; } },
  set(k, v){ try { window[kind].setItem(k, v); return true; } catch(e){ return false; } },
  del(k){ try { window[kind].removeItem(k); } catch(e){} }
});
const LS = store('localStorage');
const plain = o => JSON.parse(JSON.stringify(o, (k, v) => k.charAt(0) === '_' ? undefined : v));

function el(tag, props, ...kids){
  const e = document.createElement(tag);
  if(props) for(const k in props){
    const v = props[k];
    if(v == null || v === false) continue;
    if(k === 'class') e.className = v;
    else if(k === 'text') e.textContent = v;
    else if(k === 'html') e.innerHTML = v;
    else if(k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if(k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if(typeof v === 'boolean' || (typeof v === 'number' && k in e)) e[k] = v;
    else e.setAttribute(k, v);
  }
  kids.flat(Infinity).forEach(c => { if(c == null || c === false) return; e.append(c.nodeType ? c : document.createTextNode(String(c))); });
  return e;
}
const NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs){ const e = document.createElementNS(NS, tag); for(const k in attrs) e.setAttribute(k, attrs[k]); return e; }
const ICON = {
  menu:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2.5 4h11M2.5 8h11M2.5 12h11"/></svg>',
  board:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="2" width="5" height="7" rx="1"/><rect x="9" y="2" width="5" height="4" rx="1"/><rect x="2" y="11" width="5" height="3" rx="1"/><rect x="9" y="8" width="5" height="6" rx="1"/></svg>',
  scope:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M2 3h12l-4.5 5.5V13l-3 1.2V8.5z"/></svg>',
  gantt:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2.5 4h6M5 8h7M8 12h5.5"/></svg>',
  notes:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M4 2h6l3 3v9H4z"/><path d="M6.5 8h4M6.5 10.5h4"/></svg>',
  clock:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="8" cy="8" r="5.8"/><path d="M8 4.8V8l2.2 1.4"/></svg>',
  info:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="8" cy="8" r="5.8"/><path d="M8 7.3v3.6M8 5.2v.1"/></svg>',
  close:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  more:'<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="3.5" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="12.5" cy="8" r="1.3"/></svg>',
  plus:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',
  image:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><circle cx="6" cy="6.5" r="1.2"/><path d="M2.5 12l3.8-3.6 2.7 2.4 2-1.7 2.5 2.3"/></svg>',
  down:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M8 2.5v8M4.5 7.5L8 11l3.5-3.5M3 13.5h10"/></svg>',
  up:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M8 11V3M4.5 6L8 2.5 11.5 6M3 13.5h10"/></svg>',
  share:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 10V2.5M5 5.2L8 2.3l3 2.9"/><path d="M5.5 7.5H4a1 1 0 00-1 1v4.5a1 1 0 001 1h8a1 1 0 001-1V8.5a1 1 0 00-1-1h-1.5"/></svg>',
  drive:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"><path d="M5.6 2.5h4.8l4.1 7.1-2.4 4.1H4l-2.5-4.1z"/><path d="M5.6 2.5l4.1 7.1H14.5M1.5 9.6l4.1-7.1M4 13.7l2.4-4.1"/></svg>',
  text:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 3.5h10M8 3.5V13"/></svg>',
  pen:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 13.5l1-3.5 7.5-7.5 2.5 2.5L6 12.5z"/></svg>',
  arrow:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13L13 3M7 3h6v6"/></svg>',
  box:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2.5" y="3.5" width="11" height="9" rx="1"/></svg>',
  move:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5v13M1.5 8h13M8 1.5L6 3.5M8 1.5l2 2M8 14.5l-2-2M8 14.5l2-2M1.5 8l2-2M1.5 8l2 2M14.5 8l-2-2M14.5 8l-2 2"/></svg>',
  undo:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3L2 6l3 3"/><path d="M2 6h7.5a4 4 0 010 8H6"/></svg>',
  edit:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 13.5l1-3.5 7.5-7.5 2.5 2.5L6 12.5z"/></svg>'
};
const icon = n => { const s = el('span', { html: ICON[n] }); s.style.display = 'contents'; return s; };

const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtClock(d){ let h = d.getHours(), m = d.getMinutes(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + String(m).padStart(2, '0') + ' ' + ap; }
function fmtDate(iso, withTime){
  if(!iso) return '';
  const d = new Date(iso), n = new Date();
  const day = MON[d.getMonth()] + ' ' + d.getDate() + (d.getFullYear() === n.getFullYear() ? '' : ', ' + d.getFullYear());
  return withTime === false ? day : day + ', ' + fmtClock(d);
}
function fmtAgo(iso){
  if(!iso) return '';
  const d = new Date(iso), s = (Date.now() - d) / 1000;
  if(s < 45) return 'just now';
  if(s < 3600) return Math.round(s / 60) + ' min ago';
  const n = new Date();
  if(d.toDateString() === n.toDateString()) return 'today ' + fmtClock(d);
  const y = new Date(n); y.setDate(n.getDate() - 1);
  if(d.toDateString() === y.toDateString()) return 'yesterday ' + fmtClock(d);
  return fmtDate(iso);
}
function hash(str){ let h = 0x811c9dc5; for(let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36) + str.length.toString(36); }
function plural(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); }
function host(url){ try { return new URL(url).hostname.replace(/^www\./, ''); } catch(e){ return 'the web'; } }

let toastTimer = null;
function toast(msg, ms){
  let t = $('.toast'); if(t) t.remove();
  t = el('div', { class:'toast', role:'status', text: msg }); document.body.append(t);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), ms || 2800);
}
function askConfirm(msg, okLabel){
  return new Promise(res => {
    const done = v => { scrim.remove(); document.removeEventListener('keydown', key, true); res(v); };
    const key = e => { if(e.key === 'Escape'){ e.stopPropagation(); done(false); } if(e.key === 'Enter'){ e.preventDefault(); done(true); } };
    const ok = el('button', { class:'btn primary', text: okLabel || 'OK', onclick(){ done(true); } });
    const scrim = el('div', { class:'scrim', onmousedown(e){ if(e.target === scrim) done(false); } },
      el('div', { class:'modal confirm', role:'alertdialog', 'aria-modal':'true' },
        el('div', { class:'modal-b' }, el('p', { class:'confirm-msg', text: msg }),
          el('div', { class:'confirm-btns' }, el('button', { class:'btn', text:'Cancel', onclick(){ done(false); } }), ok))));
    document.body.append(scrim); document.addEventListener('keydown', key, true); ok.focus();
  });
}
function modal(title, body, opts){
  const close = () => { scrim.remove(); if(opts && opts.onClose) opts.onClose(); };
  const scrim = el('div', { class:'scrim', onmousedown(e){ if(e.target === scrim) close(); } },
    el('div', { class:'modal' + (opts && opts.cls ? ' ' + opts.cls : ''), role:'dialog', 'aria-modal':'true', 'aria-label':title },
      el('div', { class:'modal-h' }, el('h3', { text:title }), opts && opts.head, el('button', { class:'icon-btn', 'aria-label':'Close', onclick: close }, icon('close'))),
      el('div', { class:'modal-b' }, body)));
  document.body.append(scrim);
  return { close, scrim };
}
function blobToDataURL(b){ return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(b); }); }
function dataURLtoBlob(d){
  const [h, b64] = d.split(','); const mime = (h.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
  const bin = atob(b64); const u = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new Blob([u], { type: mime });
}
function saveFile(name, text, type){
  const a = el('a', { href: URL.createObjectURL(new Blob([text], { type: type || 'text/html' })), download: name });
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
const slug = s => (s || 'project').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'project';

/* =====================================================================
   CORE · config, source, role
   ===================================================================== */
const CFG = Object.assign({ clientId:'', apiKey:'' }, window.DW_CONFIG || {});
const HAS_GOOGLE = !!CFG.clientId, HAS_KEY = !!CFG.apiKey;
const FONT_LINK = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=IBM+Plex+Mono:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap">';
const SRC = { css: $('#app-css').textContent, js: $('#app-js').textContent, tpl: JSON.parse($('#tpl-data').textContent) };
const EMBED = (() => { const e = $('#dw-embedded'); try { return e ? JSON.parse(e.textContent) : null; } catch(err){ return null; } })();
const VIEW_ID = new URLSearchParams(location.search).get('p');
const ROLE = EMBED ? 'offline' : VIEW_ID ? 'viewer' : 'owner';
const canEdit = () => ROLE === 'owner';
const TAB_IDS = ['moodboard', 'scope', 'gantt', 'notes'];
let W = null;

function buildOfflineDoc(p){
  return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
    + '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    + '<title>' + esc(p.name || 'Project') + '</title>\n' + FONT_LINK + '\n'
    + '<style id="app-css">' + SRC.css + '<\/style>\n</head>\n<body>\n<div id="app"></div>\n'
    + '<script type="application/json" id="dw-embedded">' + safeJSON({ v:2, exportedAt: nowISO(), project: p }) + '<\/script>\n'
    + '<script type="application/json" id="tpl-data">' + safeJSON(SRC.tpl) + '<\/script>\n'
    + '<script id="app-js">' + SRC.js + '<\/script>\n</body>\n</html>\n';
}

/* =====================================================================
   CORE · appearance (per viewer)
   ===================================================================== */
const FONTS = {
  default:  { label:'Default',  stack:"-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" },
  serif:    { label:'Serif',    stack:"'Source Serif 4',Georgia,'Times New Roman',serif" },
  mono:     { label:'Mono',     stack:"'IBM Plex Mono',ui-monospace,Menlo,Consolas,monospace" },
  readable: { label:'Readable', stack:"'Atkinson Hyperlegible',Verdana,Tahoma,sans-serif" }
};
let PREF = (() => { try { return Object.assign({ theme:'light', font:'default' }, JSON.parse(LS.get('ws-prefs') || '{}')); } catch(e){ return { theme:'light', font:'default' }; } })();
const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
const isDark = () => PREF.theme === 'dark' || (PREF.theme === 'system' && mq && mq.matches);
const fontStack = () => (FONTS[PREF.font] || FONTS.default).stack;
function applyPrefs(){
  const r = document.documentElement;
  if(PREF.theme === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', PREF.theme);
  r.style.setProperty('--font', fontStack());
  frames.forEach(f => { postFrame(f, { type:'theme', dark:isDark() }); postFrame(f, { type:'font', font:fontStack() }); });
}
function setPref(k, v){ PREF[k] = v; LS.set('ws-prefs', JSON.stringify(PREF)); applyPrefs(); renderSidebar(); }
if(mq && mq.addEventListener) mq.addEventListener('change', () => { if(PREF.theme === 'system') applyPrefs(); });
function appearanceControls(onChange){
  const wrap = el('div', { class:'appearance' });
  const draw = () => {
    wrap.textContent = '';
    wrap.append(el('div', { class:'seg', role:'group', 'aria-label':'Theme' },
      [['light','Light'], ['dark','Dark'], ['system','System']].map(([k, l]) => el('button', { class: PREF.theme === k ? 'on' : '', text:l, 'aria-pressed':String(PREF.theme === k), onclick(){ setPref('theme', k); draw(); onChange && onChange(); } }))));
    wrap.append(el('div', { class:'fonts', role:'group', 'aria-label':'Font' },
      Object.keys(FONTS).map(k => el('button', { class: PREF.font === k ? 'on' : '', 'aria-pressed':String(PREF.font === k), title: FONTS[k].label, onclick(){ setPref('font', k); draw(); onChange && onChange(); } },
        el('span', { class:'aa', text:'Ag', style:{ fontFamily: FONTS[k].stack } }), el('span', { class:'fl', text:FONTS[k].label })))));
  };
  draw(); return wrap;
}

/* =====================================================================
   STORAGE · this computer (IndexedDB cache)
   ===================================================================== */
const IDB = {
  db: null,
  open(){
    if(this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      const r = indexedDB.open('design-workspace', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => { this.db = r.result; res(this.db); };
      r.onerror = () => rej(r.error);
    });
  },
  async get(k){ const db = await this.open(); return new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
  async set(k, v){ const db = await this.open(); return new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); }
};
let cacheOK = true;
async function saveCache(){
  try { await IDB.set('workspace', plain(W)); cacheOK = true; } catch(e){ cacheOK = false; }
}

/* =====================================================================
   STORAGE · Google Drive (only files this app creates)
   ===================================================================== */
const API = 'https://www.googleapis.com/drive/v3', UP = 'https://www.googleapis.com/upload/drive/v3';
const publicMediaURL = id => API + '/files/' + encodeURIComponent(id) + '?alt=media&key=' + encodeURIComponent(CFG.apiKey);
// Sign-in lives on this site's server (api/auth/*): Google is visited once, the server keeps the
// sign-in in a secure cookie, and hands out short-lived Drive access whenever the app asks.
const AUTH = '/api/auth/';
const Drive = {
  token: null, exp: 0, rootId: null, indexId: null, refreshing: null,
  ok(){ return !!this.token && Date.now() < this.exp; },
  connect(){ location.assign(AUTH + 'start'); return new Promise(() => {}); },
  refresh(){
    if(!this.refreshing) this.refreshing = (async () => {
      let r;
      try { r = await fetch(AUTH + 'token', { method:'POST' }); } catch(e){ throw { code:'network' }; }
      if(r.status === 401){ this.token = null; throw { code:'auth' }; }
      if(!r.ok) throw { code:'network' };
      const t = await r.json();
      this.token = t.access_token; this.exp = Date.now() + (Number(t.expires_in || 3600) - 120) * 1000;
      LS.set('dw-drive', '1');
    })().finally(() => { this.refreshing = null; });
    return this.refreshing;
  },
  async signOut(){
    try { await fetch(AUTH + 'logout', { method:'POST' }); } catch(e){}
    this.token = null; this.rootId = null; this.indexId = null; LS.del('dw-drive');
  },
  async req(method, url, body, headers, retried){
    if(!this.ok()) await this.refresh();
    let r;
    try { r = await fetch(url, { method, headers: Object.assign({ Authorization: 'Bearer ' + this.token }, headers || {}), body }); }
    catch(e){ throw { code:'network' }; }
    if(r.status === 401){ this.token = null; if(!retried) return this.req(method, url, body, headers, true); throw { code:'auth' }; }
    if(r.status === 204) return null;
    if(!r.ok){ let t = ''; try { t = await r.text(); } catch(e){} throw { code:'http', status: r.status, text: t }; }
    const ct = r.headers.get('content-type') || '';
    return ct.includes('application/json') ? r.json() : r.blob();
  },
  json(method, path, obj){ return this.req(method, API + path, obj ? JSON.stringify(obj) : undefined, obj ? { 'Content-Type':'application/json' } : {}); },
  async findOne(q){
    const r = await this.json('GET', '/files?spaces=drive&pageSize=5&fields=files(id,name)&q=' + encodeURIComponent(q + ' and trashed = false'));
    return (r && r.files && r.files[0]) || null;
  },
  folder(name, parent, props){ return this.json('POST', '/files?fields=id', { name, mimeType:'application/vnd.google-apps.folder', parents: parent ? [parent] : undefined, appProperties: props }); },
  upload(meta, blob){
    const b = 'dw' + uid() + uid();
    const body = new Blob(['--' + b + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(meta) + '\r\n--' + b + '\r\nContent-Type: ' + (blob.type || 'application/octet-stream') + '\r\n\r\n', blob, '\r\n--' + b + '--']);
    return this.req('POST', UP + '/files?uploadType=multipart&fields=id', body, { 'Content-Type': 'multipart/related; boundary=' + b });
  },
  update(id, blob){ return this.req('PATCH', UP + '/files/' + id + '?uploadType=media&fields=id', blob, { 'Content-Type': blob.type || 'application/json' }); },
  async readJSON(id){ const r = await this.req('GET', API + '/files/' + id + '?alt=media'); return r instanceof Blob ? JSON.parse(await r.text()) : r; },
  async readImage(id){ const r = await this.req('GET', API + '/files/' + id + '?alt=media'); return blobToDataURL(r); },
  async ensureRoot(){
    if(this.rootId) return;
    let f = await this.findOne("appProperties has { key='dw' and value='root' }");
    if(!f) f = await this.folder('Anium.planning', null, { dw:'root' });
    this.rootId = f.id;
    const ix = await this.findOne("appProperties has { key='dw' and value='index' }");
    this.indexId = ix ? ix.id : null;
  },
  async saveIndex(){
    const data = { v:2, title: W.title, order: W.projects.map(p => p.id), projects: {} };
    W.projects.forEach(p => { if(p.drive && p.drive.fileId) data.projects[p.id] = { fileId: p.drive.fileId, folderId: p.drive.folderId, name: p.name }; });
    const blob = new Blob([JSON.stringify(data)], { type:'application/json' });
    if(this.indexId) await this.update(this.indexId, blob);
    else { const r = await this.upload({ name:'workspace.json', parents:[this.rootId], appProperties:{ dw:'index' } }, blob); this.indexId = r.id; }
  },
  async saveProject(p){
    p.drive = p.drive || {};
    if(!p.drive.folderId){
      const f = await this.folder(p.name || 'Untitled project', this.rootId, { dwProject: p.id });
      p.drive.folderId = f.id; p.drive.folderName = p.name; W._indexDirty = true;
    } else if(p.drive.folderName !== p.name){
      await this.json('PATCH', '/files/' + p.drive.folderId + '?fields=id', { name: p.name || 'Untitled project' });
      p.drive.folderName = p.name; W._indexDirty = true;
    }
    for(const im of Object.values(p.images)){
      if(im.src && !im.driveId){
        const blob = dataURLtoBlob(im.src);
        const ext = blob.type === 'image/png' ? '.png' : blob.type === 'image/webp' ? '.webp' : blob.type === 'image/gif' ? '.gif' : '.jpg';
        const r = await this.upload({ name: 'picture-' + im.id + ext, parents:[p.drive.folderId] }, blob);
        im.driveId = r.id;
      }
    }
    for(const id of (p._trash || []).splice(0)){ try { await this.json('PATCH', '/files/' + id, { trashed:true }); } catch(e){} }
    const blob = new Blob([JSON.stringify(serializeProject(p))], { type:'application/json' });
    if(p.drive.fileId) await this.update(p.drive.fileId, blob);
    else { const r = await this.upload({ name:'project.json', parents:[p.drive.folderId], appProperties:{ dw:'project', dwProject:p.id } }, blob); p.drive.fileId = r.id; W._indexDirty = true; }
    p._dirty = false;
  },
  async setShared(p, on){
    if(on){ const r = await this.json('POST', '/files/' + p.drive.folderId + '/permissions?fields=id', { type:'anyone', role:'reader', allowFileDiscovery:false }); p.drive.permId = r.id; p.drive.shared = true; }
    else {
      try { await this.req('DELETE', API + '/files/' + p.drive.folderId + '/permissions/' + (p.drive.permId || 'anyoneWithLink')); }
      catch(e){ if(!(e && e.status === 404)) throw e; }
      p.drive.shared = false; p.drive.permId = null;
    }
  },
  trash(id){ return this.json('PATCH', '/files/' + id, { trashed:true }); }
};
function serializeProject(p){
  const q = plain(p);
  Object.values(q.images || {}).forEach(im => { if(im.driveId) delete im.src; });
  return q;
}

/* =====================================================================
   CORE · images (per project)
   ===================================================================== */
const srcMaps = new Map();
const srcMap = p => { let m = srcMaps.get(p.id); if(!m){ m = new Map(); srcMaps.set(p.id, m); } return m; };
function imgURL(p, id){
  const im = p && p.images && p.images[id]; if(!im) return '';
  let u = im.src || '';
  if(!u && im.driveId && ROLE === 'viewer' && HAS_KEY) u = publicMediaURL(im.driveId);
  if(!u && im.url) u = im.url;
  if(u) srcMap(p).set(u, id);
  return u;
}
function compress(src){
  return new Promise(res => {
    if(!/^data:image\/(png|jpe?g|webp|bmp)/i.test(src)) return res({ data:src, w:0, h:0 });
    const im = new Image();
    im.onload = () => {
      const w = im.naturalWidth, h = im.naturalHeight, MAX = 2000;
      const s = Math.min(1, MAX / Math.max(w, h)), cw = Math.round(w * s), ch = Math.round(h * s);
      if(s === 1 && src.length < 600000) return res({ data:src, w, h });
      const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
      const g = cv.getContext('2d'); const png = /^data:image\/png/i.test(src);
      if(!png){ g.fillStyle = '#fff'; g.fillRect(0, 0, cw, ch); }
      g.drawImage(im, 0, 0, cw, ch);
      let out = png ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.86);
      if(png && out.length > 900000){ g.globalCompositeOperation = 'destination-over'; g.fillStyle = '#fff'; g.fillRect(0, 0, cw, ch); out = cv.toDataURL('image/jpeg', 0.88); }
      if(out.length > src.length) out = src;
      res({ data:out, w:cw, h:ch });
    };
    im.onerror = () => res({ data:src, w:0, h:0 });
    im.src = src;
  });
}
async function addDataImage(p, src, from){
  const c = await compress(src);
  const id = 'i' + hash(c.data);
  srcMap(p).set(src, id); srcMap(p).set(c.data, id);
  if(!p.images[id]) p.images[id] = { id, src:c.data, w:c.w, h:c.h, addedAt:nowISO(), caption:'', events:[], url: from || undefined };
  return id;
}
function addUrlImage(p, url){
  const id = 'u' + hash(url);
  srcMap(p).set(url, id);
  if(!p.images[id]){
    p.images[id] = { id, url, addedAt:nowISO(), caption:'', events:[] };
    keepCopy(p, id);
  }
  return id;
}
// Try to keep our own copy of a web picture (works when the site allows it); otherwise it stays a link.
async function keepCopy(p, id){
  const im = p.images[id]; if(!im || !im.url || im.src) return;
  try {
    const r = await fetch(im.url, { mode:'cors' }); if(!r.ok) return;
    const b = await r.blob(); if(!/^image\//.test(b.type)) return;
    const c = await compress(await blobToDataURL(b));
    im.src = c.data; im.w = c.w; im.h = c.h; srcMap(p).set(c.data, id);
    markChanged(p);
  } catch(e){}
}
async function ensureImages(p){
  if(ROLE !== 'owner' || !driveOn) return;
  const need = Object.values(p.images).filter(im => im.driveId && !im.src);
  for(const im of need){ try { im.src = await Drive.readImage(im.driveId); } catch(e){ if(e && e.code === 'auth') throw e; } }
  if(need.length) saveCache();
}
function projectImageRefs(p){
  const refs = new Set();
  TAB_IDS.forEach(m => (MODULES[m].imageRefs(p.mods[m].data) || []).forEach(r => refs.add(r)));
  (p.history || []).forEach(h => (MODULES[h.mod].imageRefs(h.snap) || []).forEach(r => refs.add(r)));
  return refs;
}

/* =====================================================================
   CORE · project lifecycle, history, saving
   ===================================================================== */
function blankProject(name){
  const t = nowISO();
  const p = { id:uid(), name: name || 'Untitled project', icon:'📐', createdAt:t, updatedAt:t, history:[], images:{}, mods:{} };
  TAB_IDS.forEach(m => p.mods[m] = { data: MODULES[m].defaultData(), editedAt:null });
  return p;
}
function localDay(iso){ const d = iso ? new Date(iso) : new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
// Schedules made before start dates were pinned: pin them to the day they were first saved.
function pinGanttStart(p){
  const g = p.mods.gantt && p.mods.gantt.data;
  if(!g || g.start) return false;
  const first = (p.history || []).filter(h => h.mod === 'gantt').map(h => h.t).sort()[0];
  g.start = localDay(first || p.mods.gantt.editedAt || p.createdAt);
  (p.history || []).forEach(h => { if(h.mod === 'gantt' && h.snap && !h.snap.start) h.snap.start = g.start; });
  return true;
}
function prepareProject(p){
  p.images = p.images || {}; p.history = p.history || [];
  TAB_IDS.forEach(m => { if(!p.mods[m]) p.mods[m] = { data: MODULES[m].defaultData(), editedAt:null }; });
  if(pinGanttStart(p) && ROLE === 'owner') p._dirty = true;
  p._norm = {}; p._base = {};
  TAB_IDS.forEach(m => { p._norm[m] = JSON.stringify(MODULES[m].normalize(p.mods[m].data)); p._base[m] = clone(p.mods[m].data); });
  p._refs = new Set(MODULES.moodboard.imageRefs(p.mods.moodboard.data));
  p._picks = pickMap(p);
  return p;
}
function pickMap(p){ const m = {}; ((p.mods.scope.data && p.mods.scope.data.options) || []).forEach(o => { if(o.img) m[o.id] = o.img; }); return m; }
const restoreNotes = {};
const GROUP_MS = 10 * 60 * 1000;
function recordHistory(p){
  const t = nowISO();
  TAB_IDS.forEach(m => {
    const M = MODULES[m], cur = p.mods[m].data, n = JSON.stringify(M.normalize(cur));
    if(p._norm[m] === n) return;
    p._norm[m] = n;
    const list = p.history.filter(h => h.mod === m), last = list[list.length - 1], prev = list[list.length - 2];
    const note = restoreNotes[p.id + ':' + m]; delete restoreNotes[p.id + ':' + m];
    if(last && !note && !last.restore && Date.now() - new Date(last.t).getTime() < GROUP_MS){
      last.t = t; last.snap = clone(cur); last.summary = M.summarize(prev ? prev.snap : p._base[m], cur) || 'Edited';
    } else {
      p.history.push({ id:uid(), t, mod:m, summary: note || M.summarize(last ? last.snap : p._base[m], cur) || 'Edited', snap: clone(cur), restore: !!note || undefined });
    }
    const all = p.history.filter(h => h.mod === m);
    if(all.length > 30){ const drop = new Set(all.slice(0, all.length - 30).map(h => h.id)); p.history = p.history.filter(h => !drop.has(h.id)); }
  });
}
function recordImageEvents(p){
  const t = nowISO();
  const ev = (id, text) => { const im = p.images[id]; if(im){ im.events = (im.events || []).concat({ t, text }).slice(-30); } };
  const refs = new Set(MODULES.moodboard.imageRefs(p.mods.moodboard.data));
  refs.forEach(id => { if(!p._refs.has(id)){ const im = p.images[id]; ev(id, im && im.url ? 'Added to the mood board from ' + host(im.url) : 'Added to the mood board'); } });
  p._refs.forEach(id => { if(!refs.has(id)) ev(id, 'Removed from the mood board'); });
  p._refs = refs;
  const picks = pickMap(p), opts = (p.mods.scope.data && p.mods.scope.data.options) || [];
  Object.keys(picks).forEach(oid => { if(p._picks[oid] !== picks[oid]){ const o = opts.find(x => x.id === oid); ev(picks[oid], 'Picked for “' + ((o && o.title) || 'Untitled option') + '”'); } });
  p._picks = picks;
}
function pruneImages(p){
  const refs = projectImageRefs(p);
  Object.keys(p.images).forEach(id => {
    if(refs.has(id)) return;
    const im = p.images[id];
    if(im.driveId){ p._trash = (p._trash || []).concat(im.driveId); }
    delete p.images[id];
  });
}

let driveOn = false, syncState = HAS_GOOGLE ? 'local' : 'local', lastSync = null, flushTimer = null, flushing = null, ingestChain = Promise.resolve();
function markChanged(p){
  if(!canEdit()) return;
  if(p){ p.updatedAt = nowISO(); p._dirty = true; p.pristine = undefined; } else W._indexDirty = true;
  scheduleFlush(); renderStatus(); renderTabs();
}
function setModData(pid, mod, data){
  const p = W.projects.find(x => x.id === pid); if(!p) return;
  const N = MODULES[mod].normalize;
  const same = JSON.stringify(N(p.mods[mod].data)) === JSON.stringify(N(data));
  p.mods[mod].data = data;
  if(!same){ p.mods[mod].editedAt = nowISO(); markChanged(p); }
}
function scheduleFlush(ms){ clearTimeout(flushTimer); flushTimer = setTimeout(() => { flushTimer = null; flush(); }, ms == null ? 1500 : ms); }
async function flush(){
  if(!canEdit()) return;
  if(flushing){ await flushing; if(!W.projects.some(p => p._dirty) && !W._indexDirty) return; }
  flushing = (async () => {
    await ingestChain;
    W.projects.forEach(p => { recordHistory(p); recordImageEvents(p); if(driveOn) pruneImages(p); });
    await saveCache();
    if(driveOn){
      syncState = 'saving'; renderStatus();
      try {
        for(const p of W.projects) if(p._dirty) await Drive.saveProject(p);
        if(W._indexDirty){ await Drive.saveIndex(); W._indexDirty = false; }
        syncState = 'saved'; lastSync = nowISO();
        await saveCache();
      } catch(e){ driveError(e); }
    } else syncState = 'local';
    renderStatus(); renderTabs();
  })();
  try { await flushing; } finally { flushing = null; }
}
function driveError(e){
  if(e && e.code === 'auth'){ driveOn = false; syncState = 'reconnect'; }
  else if(e && e.code === 'network'){ syncState = 'offline'; scheduleFlush(15000); }
  else { syncState = 'error'; console.warn('Drive error', e); }
  renderStatus();
}
async function connectDrive(){
  if(!HAS_GOOGLE){ toast('Google Drive isn’t set up yet. Follow SETUP.md in the repo.', 5000); return; }
  await flush();
  Drive.connect();
}
// Tries the saved sign-in; quietly keeps retrying while offline.
function resumeDrive(){
  Drive.refresh().then(syncWithDrive, e => {
    if(e && e.code === 'network'){ setTimeout(resumeDrive, 15000); return; }
    if(LS.get('dw-drive') === '1'){ syncState = 'reconnect'; renderSidebar(); renderStatus(); renderHeader(); }
  });
}
async function signOutDrive(){
  await flush();
  await Drive.signOut();
  driveOn = false; syncState = 'local';
  renderSidebar(); renderStatus(); renderHeader();
  toast('Signed out of Google Drive. Your projects stay saved in your Drive.', 4500);
}
async function syncWithDrive(){
  syncState = 'saving'; renderStatus();
  try {
    await Drive.ensureRoot();
    const ix = Drive.indexId ? await Drive.readJSON(Drive.indexId) : null;
    if(ix && ix.projects){
      const remoteIds = (ix.order || Object.keys(ix.projects)).filter(id => ix.projects[id]);
      if(remoteIds.length){ W.projects = W.projects.filter(p => !(p.pristine && !p.drive)); }
      if(ix.title && !W._indexDirty) W.title = renamed(ix.title);
      for(const pid of remoteIds){
        const meta = ix.projects[pid];
        let remote; try { remote = await Drive.readJSON(meta.fileId); } catch(e){ if(e && e.code === 'auth') throw e; continue; }
        remote.drive = Object.assign({}, remote.drive || {}, { fileId: meta.fileId, folderId: meta.folderId });
        const local = W.projects.find(x => x.id === pid);
        if(local && local._dirty && (local.updatedAt || '') > (remote.updatedAt || '')){ local.drive = Object.assign({}, remote.drive, local.drive || {}); continue; }
        if(local) Object.values(remote.images || {}).forEach(im => { const li = local.images[im.id]; if(li && li.src) im.src = li.src; });
        prepareProject(remote);
        if(local) W.projects[W.projects.indexOf(local)] = remote; else W.projects.push(remote);
      }
      if(ix.order) W.projects.sort((a, b) => { const ia = ix.order.indexOf(a.id), ib = ix.order.indexOf(b.id); return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib); });
    }
    if(!W.projects.length) W.projects.push(prepareProject(blankProject('First project')));
    W.projects.forEach(p => { if(!p.drive || !p.drive.fileId) p._dirty = true; });
    W._indexDirty = true; driveOn = true;
    if(!W.projects.some(p => p.id === ui.project)) ui.project = W.projects[0].id;
    destroyFrames();
    await ensureImages(proj());
    await flush();
    renderAll(true);
  } catch(e){ driveError(e); renderAll(false); }
}

/* =====================================================================
   CORE · UI state
   ===================================================================== */
const ui = { project:null, tab:'moodboard', drawer:null, sideOpen:false, sideClosed:false, noteId:null, selImg:null };
function stashUI(){ LS.set('dw-ui',JSON.stringify({ project:ui.project, tab:ui.tab, drawer:ui.drawer, noteId:ui.noteId, sideClosed:ui.sideClosed })); }
const proj = () => W.projects.find(p => p.id === ui.project) || W.projects[0];

/* =====================================================================
   MODULE · Mood board (your moodboard.html, embedded)
   ===================================================================== */
const MoodboardModule = {
  label:'Mood board', icon:'board', frame:true,
  defaultData: () => null,
  hydrate(p, d){ (d.cards || []).forEach(c => { if(c.type === 'image' && typeof c.src === 'string' && c.src.startsWith('img:')) c.src = imgURL(p, c.src.slice(4)); }); return d; },
  ingest(p, raw){
    ingestChain = ingestChain.then(async () => {
      for(const c of (raw.cards || [])){
        if(c.type !== 'image' || !c.src || c.src.startsWith('img:')) continue;
        const known = srcMap(p).get(c.src);
        if(known){ c.src = 'img:' + known; continue; }
        if(c.src.startsWith('data:image/')) c.src = 'img:' + await addDataImage(p, c.src);
        else if(/^https?:/i.test(c.src)) c.src = 'img:' + addUrlImage(p, c.src);
      }
      setModData(p.id, 'moodboard', raw);
    }).catch(e => console.warn(e));
  },
  normalize: d => d ? { c: d.cards || [], w: d.worldW, h: d.worldH } : null,
  imageRefs: d => ((d && d.cards) || []).filter(c => c.type === 'image' && typeof c.src === 'string' && c.src.startsWith('img:')).map(c => c.src.slice(4)),
  summarize(a, b){
    const cards = (d, t) => ((d && d.cards) || []).filter(c => c.type === t);
    const parts = [];
    const ia = cards(a, 'image').map(c => c.src), ib = cards(b, 'image').map(c => c.src);
    const add = ib.filter(x => !ia.includes(x)).length, rem = ia.filter(x => !ib.includes(x)).length;
    if(add) parts.push('Added ' + plural(add, 'picture')); if(rem) parts.push('Removed ' + plural(rem, 'picture'));
    ['note', 'label'].forEach(t => {
      const ta = cards(a, t).map(c => c.text || ''), tb = cards(b, t).map(c => c.text || '');
      if(tb.length > ta.length) parts.push('Added ' + plural(tb.length - ta.length, t));
      else if(tb.length < ta.length) parts.push('Removed ' + plural(ta.length - tb.length, t));
      else if(ta.slice().sort().join('\u0000') !== tb.slice().sort().join('\u0000')) parts.push('Edited ' + t + 's');
    });
    if(!a) return parts.length ? 'Started the board · ' + parts.join(', ') : 'Started the board';
    return parts.length ? parts.join(', ') : 'Rearranged the board';
  }
};

/* =====================================================================
   MODULE · Gantt (your gantt.html, embedded)
   ===================================================================== */
const GanttModule = {
  label:'Gantt', icon:'gantt', frame:true,
  defaultData: () => null,
  ingest(p, raw){ setModData(p.id, 'gantt', raw); },
  normalize: d => d ? Object.assign({}, d, { theme: undefined }) : null,
  imageRefs: () => [],
  summarize(a, b){
    const tasks = d => ((d && d.phases) || []).flatMap(p => p.tasks || []);
    const ta = tasks(a), tb = tasks(b), ids = new Set(ta.map(t => t.id)), idsB = new Set(tb.map(t => t.id));
    const parts = [];
    const added = tb.filter(t => !ids.has(t.id)).length, removed = ta.filter(t => !idsB.has(t.id)).length;
    if(added) parts.push('Added ' + plural(added, 'task')); if(removed) parts.push('Removed ' + plural(removed, 'task'));
    const done = tb.filter(t => t.done && ta.some(x => x.id === t.id && !x.done)).length;
    const reop = tb.filter(t => !t.done && ta.some(x => x.id === t.id && x.done)).length;
    if(done) parts.push('Completed ' + plural(done, 'task')); if(reop) parts.push('Reopened ' + plural(reop, 'task'));
    if(!a) return 'Started the schedule';
    return parts.length ? parts.join(', ') : 'Adjusted dates or details';
  }
};

/* =====================================================================
   PICTURE MARKUP · reposition + pen / arrow / box / text
   ===================================================================== */
const MARK_COLORS = ['#E5484D', '#2783DE', '#F5B800', '#2FA36B', '#111111', '#FFFFFF'];
const WIDTHS = [{ k:'Thin', w:2.5, t:14 }, { k:'Medium', w:4, t:18 }, { k:'Thick', w:7, t:26 }];
const cropOf = o => Object.assign({ x:0, y:0, s:1 }, o && o.crop);
const cropTransform = c => 'translate(' + (c.x * 100) + '%,' + (c.y * 100) + '%) scale(' + c.s + ')';
const isLight = c => /^#(fff|ffffff|f5b800)$/i.test(c);
function drawMark(m){
  const g = svgEl('g', {}), sw = m.w || 4;
  if(m.t === 'pen'){
    g.append(svgEl('path', { d: 'M' + m.pts.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L'), fill:'none', stroke:m.c, 'stroke-width':sw, 'stroke-linecap':'round', 'stroke-linejoin':'round' }));
  } else if(m.t === 'box'){
    g.append(svgEl('rect', { x:Math.min(m.a[0], m.b[0]), y:Math.min(m.a[1], m.b[1]), width:Math.abs(m.b[0] - m.a[0]), height:Math.abs(m.b[1] - m.a[1]), rx:3, fill:'none', stroke:m.c, 'stroke-width':sw }));
  } else if(m.t === 'arrow'){
    const [x1, y1] = m.a, [x2, y2] = m.b, ang = Math.atan2(y2 - y1, x2 - x1), L = Math.max(10, sw * 3.2);
    g.append(svgEl('line', { x1, y1, x2: x2 - L * 0.7 * Math.cos(ang), y2: y2 - L * 0.7 * Math.sin(ang), stroke:m.c, 'stroke-width':sw, 'stroke-linecap':'round' }));
    const pt = a => [x2 - L * Math.cos(a), y2 - L * Math.sin(a)];
    g.append(svgEl('polygon', { points: [[x2, y2], pt(ang - 0.45), pt(ang + 0.45)].map(q => q.join(',')).join(' '), fill:m.c, stroke:m.c, 'stroke-width':1.5, 'stroke-linejoin':'round' }));
  } else if(m.t === 'text'){
    const t = svgEl('text', { x:m.p[0], y:m.p[1], fill:m.c, 'font-size':m.size || 18, 'font-weight':700, 'paint-order':'stroke', stroke: isLight(m.c) ? 'rgba(0,0,0,.6)' : 'rgba(255,255,255,.92)', 'stroke-width':3, 'stroke-linejoin':'round', 'dominant-baseline':'middle' });
    t.textContent = m.s; t.style.fontFamily = 'var(--font)'; g.append(t);
  }
  return g;
}
function marksSVG(marks){ const s = svgEl('svg', { viewBox:'0 0 400 300', class:'marks', 'aria-hidden':'true' }); (marks || []).forEach(m => s.append(drawMark(m))); return s; }
function figure(p, o){
  const box = el('div', { class:'fig' }), c = cropOf(o), tf = cropTransform(c);
  const img = el('img', { src: imgURL(p, o.img), alt: o.title || 'Option picture', draggable:'false' });
  img.style.transform = tf;
  const svg = marksSVG(o.marks); svg.style.transform = tf;
  box.append(img, svg);
  return box;
}
function openImageEditor(p, o, onDone){
  const work = { crop: cropOf(o), marks: clone(o.marks || []) };
  let tool = 'pen', color = MARK_COLORS[0], wi = 1, drawing = null;
  const img = el('img', { src: imgURL(p, o.img), draggable:'false', alt:'' });
  const marks = marksSVG([]);
  const hit = el('div', { class:'ed-hit' });
  const stage = el('div', { class:'fig ed-stage' }, img, marks, hit);
  const zoom = el('input', { type:'range', min:'1', max:'5', step:'0.01', 'aria-label':'Zoom' });
  zoom.addEventListener('input', () => { work.crop.s = Number(zoom.value); applyT(); });
  function applyT(){ const tf = cropTransform(work.crop); img.style.transform = tf; marks.style.transform = tf; zoom.value = work.crop.s; }
  function redraw(){ marks.textContent = ''; work.marks.forEach(m => marks.append(drawMark(m))); if(drawing && drawing.mark) marks.append(drawMark(drawing.mark)); }
  function toPic(e){
    const r = stage.getBoundingClientRect(), c = work.crop;
    const fx = (e.clientX - r.left) / r.width * 400, fy = (e.clientY - r.top) / r.height * 300;
    return [200 + (fx - 200 - c.x * 400) / c.s, 150 + (fy - 150 - c.y * 300) / c.s];
  }
  hit.addEventListener('pointerdown', e => {
    if(e.button !== 0) return;
    e.preventDefault();
    if(tool === 'text'){ placeText(e); return; }
    hit.setPointerCapture(e.pointerId);
    if(tool === 'move') drawing = { move:true, sx:e.clientX, sy:e.clientY, c0: Object.assign({}, work.crop) };
    else { const pt = toPic(e), W_ = WIDTHS[wi].w; drawing = { mark: tool === 'pen' ? { t:'pen', pts:[pt], c:color, w:W_ } : { t:tool, a:pt, b:pt, c:color, w:W_ } }; redraw(); }
  });
  hit.addEventListener('pointermove', e => {
    if(!drawing) return;
    if(drawing.move){ const r = stage.getBoundingClientRect(); work.crop.x = drawing.c0.x + (e.clientX - drawing.sx) / r.width; work.crop.y = drawing.c0.y + (e.clientY - drawing.sy) / r.height; applyT(); }
    else { const pt = toPic(e); if(drawing.mark.t === 'pen') drawing.mark.pts.push(pt); else drawing.mark.b = pt; redraw(); }
  });
  const end = () => {
    if(drawing && drawing.mark){
      const m = drawing.mark;
      if(m.t === 'pen'){ if(m.pts.length === 1) m.pts.push([m.pts[0][0] + 0.1, m.pts[0][1]]); work.marks.push(m); }
      else if(Math.hypot(m.b[0] - m.a[0], m.b[1] - m.a[1]) > 4) work.marks.push(m);
    }
    drawing = null; redraw();
  };
  hit.addEventListener('pointerup', end); hit.addEventListener('pointercancel', end);
  hit.addEventListener('wheel', e => { e.preventDefault(); work.crop.s = clamp(work.crop.s * (e.deltaY < 0 ? 1.08 : 1 / 1.08), 1, 5); applyT(); }, { passive:false });
  function placeText(e){
    const r = stage.getBoundingClientRect(), pt = toPic(e);
    const inp = el('input', { class:'ed-text', placeholder:'Type, then Enter', 'aria-label':'Label text' });
    inp.style.left = (e.clientX - r.left) + 'px'; inp.style.top = (e.clientY - r.top) + 'px'; inp.style.color = color;
    let done = false;
    const commit = keep => { if(done) return; done = true; const v = inp.value.trim(); if(keep && v) work.marks.push({ t:'text', p:pt, s:v, c:color, size:WIDTHS[wi].t }); inp.remove(); redraw(); };
    inp.addEventListener('keydown', ev => { ev.stopPropagation(); if(ev.key === 'Enter') commit(true); if(ev.key === 'Escape') commit(false); });
    inp.addEventListener('blur', () => commit(true));
    stage.append(inp); setTimeout(() => inp.focus(), 0);
  }
  const toolBtns = {};
  const tools = [['move','Move & zoom'], ['pen','Pen'], ['arrow','Arrow'], ['box','Box'], ['text','Text']];
  const setTool = t => { tool = t; Object.keys(toolBtns).forEach(k => toolBtns[k].classList.toggle('on', k === t)); stage.dataset.tool = t; zoomWrap.hidden = t !== 'move'; };
  const swatches = MARK_COLORS.map(c => el('button', { class:'sw', 'aria-label':'Color ' + c, style:{ background:c }, onclick(e){ color = c; swatches.forEach(s => s.classList.remove('on')); e.currentTarget.classList.add('on'); } }));
  swatches[0].classList.add('on');
  const widthBtns = WIDTHS.map((w, i) => el('button', { class:'wbtn' + (i === wi ? ' on' : ''), title:w.k, 'aria-label':w.k + ' line', onclick(e){ wi = i; widthBtns.forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, el('i', { style:{ height: w.w + 'px' } })));
  const zoomWrap = el('div', { class:'ed-zoom' }, el('span', { text:'Zoom' }), zoom, el('button', { class:'btn ghost', text:'Reset', onclick(){ work.crop = { x:0, y:0, s:1 }; applyT(); } }));
  const bar = el('div', { class:'ed-bar' },
    el('div', { class:'ed-group' }, tools.map(([k, l]) => (toolBtns[k] = el('button', { class:'ed-tool', title:l, 'aria-label':l, onclick(){ setTool(k); } }, icon(k), el('span', { text: k === 'move' ? 'Move' : l }))))),
    el('div', { class:'ed-group' }, swatches), el('div', { class:'ed-group' }, widthBtns),
    el('div', { class:'ed-group' },
      el('button', { class:'ed-tool', title:'Undo (Ctrl/⌘ Z)', onclick(){ work.marks.pop(); redraw(); } }, icon('undo'), el('span', { text:'Undo' })),
      el('button', { class:'ed-tool', title:'Clear drawing', onclick(){ work.marks = []; redraw(); } }, el('span', { text:'Clear' }))));
  const foot = el('div', { class:'ed-foot' }, zoomWrap, el('div', { style:{ flex:'1' } }),
    el('button', { class:'btn', text:'Cancel', onclick(){ m.close(); } }),
    el('button', { class:'btn primary', text:'Done', onclick(){ o.crop = work.crop; o.marks = work.marks; m.close(); onDone(); } }));
  const key = e => { if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.target.matches('input')){ e.preventDefault(); work.marks.pop(); redraw(); } };
  document.addEventListener('keydown', key);
  const m = modal('Edit picture', el('div', { class:'ed' }, bar, stage, foot), { cls:'wide', onClose(){ document.removeEventListener('keydown', key); } });
  setTool('pen'); applyT(); redraw();
}

/* =====================================================================
   MODULE · Narrow scope (native)
   ===================================================================== */
const DEFAULT_CRITERIA = ['Ease of assembly', 'Reliability', 'Repairability', 'Cost', 'Time to make'];
const newOption = title => ({ id:uid(), title, img:null, crop:null, marks:[], ratings:{}, notes:'', updatedAt:nowISO() });
const ScopeModule = {
  label:'Narrow scope', icon:'scope', frame:false,
  defaultData: () => ({ criteria: DEFAULT_CRITERIA.map(n => ({ id:uid(), name:n })), options: [newOption('Option A'), newOption('Option B')] }),
  normalize: d => d ? { c: d.criteria, o: (d.options || []).map(o => ({ i:o.id, t:o.title, g:o.img, cr:o.crop || null, m:o.marks || [], r:o.ratings, n:o.notes })) } : null,
  imageRefs: d => ((d && d.options) || []).map(o => o.img).filter(Boolean),
  summarize(a, b){
    if(!a) return 'Started comparing options';
    const parts = [], oa = a.options || [], ob = b.options || [];
    const added = ob.filter(o => !oa.some(x => x.id === o.id)), removed = oa.filter(o => !ob.some(x => x.id === o.id));
    if(added.length) parts.push('Added ' + added.map(o => '“' + (o.title || 'Untitled') + '”').join(', '));
    if(removed.length) parts.push('Removed ' + removed.map(o => '“' + (o.title || 'Untitled') + '”').join(', '));
    const ca = a.criteria || [], cb = b.criteria || [];
    const cAdd = cb.filter(c => !ca.some(x => x.id === c.id)), cRem = ca.filter(c => !cb.some(x => x.id === c.id));
    if(cAdd.length) parts.push('Added criteria: ' + cAdd.map(c => c.name || 'Untitled').join(', '));
    if(cRem.length) parts.push('Removed criteria: ' + cRem.map(c => c.name || 'Untitled').join(', '));
    let rated = 0, pics = 0, marked = 0;
    ob.forEach(o => { const q = oa.find(x => x.id === o.id); if(!q) return;
      if(JSON.stringify(q.ratings) !== JSON.stringify(o.ratings)) rated++;
      if(q.img !== o.img) pics++;
      else if(JSON.stringify([q.crop, q.marks]) !== JSON.stringify([o.crop, o.marks])) marked++; });
    if(rated) parts.push('Changed ratings on ' + plural(rated, 'option'));
    if(pics) parts.push('Changed ' + plural(pics, 'picture'));
    if(marked) parts.push('Marked up ' + plural(marked, 'picture'));
    return parts.length ? parts.join(' · ') : 'Edited option details';
  },
  mount(hostEl, ctx){
    const ro = !ctx.editable, p = ctx.project, d = ctx.data();
    const touch = o => { if(o) o.updatedAt = nowISO(); ctx.changed(); };
    const scoreOf = o => { const vals = d.criteria.map(c => o.ratings[c.id]).filter(v => v > 0); return { avg: vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null, n: vals.length }; };
    const root = el('div', { class:'scope' });
    function pick(o){ ctx.pickImage(id => { o.img = id; o.crop = null; o.marks = []; touch(o); render(); }); }
    function render(){
      root.textContent = '';
      const scores = d.options.map(scoreOf);
      const best = Math.max(...scores.map(s => s.avg == null ? -1 : s.avg));
      const tied = scores.filter(s => s.avg === best).length;
      const leadId = d.options.length > 1 && best > 0 && tied === 1 ? d.options[scores.findIndex(s => s.avg === best)].id : null;
      root.append(el('div', { class:'scope-intro' }, el('div', null,
        el('h2', { text:'Compare design options' }),
        el('p', { text: ro ? 'Each option is rated 1 to 5, where 5 means easiest, most reliable, cheapest, or fastest.' : 'Pick a picture for each option, mark it up, then rate it 1 to 5. Higher is better: 5 means easiest, most reliable, cheapest, or fastest.' }))));
      const bar = el('div', { class:'crit-bar' }, el('span', { class:'lbl', text:'Rated on' }));
      d.criteria.forEach(c => {
        const inp = el('input', { value:c.name, 'aria-label':'Criterion name', placeholder:'Criterion', size: Math.max(6, c.name.length) });
        inp.readOnly = ro;
        inp.addEventListener('input', () => { c.name = inp.value; inp.size = Math.max(6, inp.value.length); ctx.changed(); root.querySelectorAll('.rn[data-crit="' + c.id + '"]').forEach(x => { x.textContent = c.name || 'Untitled'; x.title = c.name; }); });
        bar.append(el('span', { class:'chip' }, inp, ro ? null : el('button', { title:'Remove “' + c.name + '”', 'aria-label':'Remove criterion', text:'×', onclick(){ d.criteria = d.criteria.filter(x => x !== c); d.options.forEach(o => delete o.ratings[c.id]); touch(); render(); } })));
      });
      if(!ro) bar.append(el('button', { class:'add-chip', text:'+ Add criterion', onclick(){ d.criteria.push({ id:uid(), name:'' }); touch(); render(); const ins = root.querySelectorAll('.chip input'); ins[ins.length - 1].focus(); } }));
      root.append(bar);
      const row = el('div', { class:'opts' });
      d.options.forEach((o, idx) => {
        const s = scores[idx];
        const imgBox = el('div', { class:'opt-img' });
        if(o.img && imgURL(p, o.img)){
          const fig = figure(p, o);
          if(!ro){ fig.classList.add('clickable'); fig.title = 'Edit picture'; fig.addEventListener('click', () => openImageEditor(p, o, () => { touch(o); render(); })); }
          imgBox.append(fig);
          if(!ro) imgBox.append(el('div', { class:'over' },
            el('button', { onclick(){ openImageEditor(p, o, () => { touch(o); render(); }); } }, 'Edit'),
            el('button', { text:'Change', onclick(){ pick(o); } }),
            el('button', { text:'Remove', onclick(){ o.img = null; o.crop = null; o.marks = []; touch(o); render(); } })));
        } else if(!ro) imgBox.append(el('button', { class:'pick', onclick(){ pick(o); } }, icon('image'), 'Choose a picture'));
        else imgBox.append(el('span', { class:'faint', text:'No picture chosen' }));
        const title = el('input', { class:'opt-title', value:o.title, placeholder:'Untitled option', 'aria-label':'Option name' });
        title.readOnly = ro; title.addEventListener('input', () => { o.title = title.value; touch(o); });
        const rates = el('div', { class:'rates' });
        d.criteria.forEach(c => {
          const v = o.ratings[c.id] || 0;
          const dots = el('div', { class:'dots' + (ro ? ' ro' : ''), role:'group', 'aria-label': (c.name || 'Criterion') + ' rating' });
          for(let i = 1; i <= 5; i++) dots.append(el('button', { class: i <= v ? 'f' : '', text:String(i), 'aria-label': i + ' of 5', 'aria-pressed': String(i === v), disabled: ro,
            onclick(){ o.ratings[c.id] = (v === i ? 0 : i); if(!o.ratings[c.id]) delete o.ratings[c.id]; touch(o); render(); } }));
          rates.append(el('div', { class:'rate' }, el('span', { class:'rn', 'data-crit':c.id, title:c.name, text: c.name || 'Untitled' }), dots));
        });
        const notes = el('textarea', { class:'ta', placeholder: ro ? '' : 'Why this option? Tradeoffs, open questions…', 'aria-label':'Option notes' });
        notes.value = o.notes || ''; notes.readOnly = ro; notes.addEventListener('input', () => { o.notes = notes.value; touch(o); });
        row.append(el('article', { class:'opt' + (o.id === leadId ? ' lead' : '') }, imgBox,
          el('div', { class:'opt-body' }, title,
            el('div', { class:'score' },
              el('span', { class:'num' }, s.avg == null ? '–' : s.avg.toFixed(1), el('span', { class:'of', text:' /5' })),
              el('span', { class:'meter2' }, el('i', { style:{ width: ((s.avg || 0) / 5 * 100) + '%' } })),
              o.id === leadId ? el('span', { class:'lead-tag', text:'Highest score' }) : null),
            el('div', { class:'score-sub', text: s.n + ' of ' + d.criteria.length + ' rated' }),
            rates, (ro && !o.notes) ? null : notes,
            el('div', { class:'opt-foot' },
              el('span', { title: fmtDate(o.updatedAt), text: 'Edited ' + fmtAgo(o.updatedAt) }),
              ro || d.options.length < 2 ? null : el('button', { text:'Remove option', async onclick(){
                if(!await askConfirm('Remove “' + (o.title || 'Untitled option') + '”? You can bring it back from History.', 'Remove')) return;
                d.options = d.options.filter(x => x !== o); touch(); render(); } })))));
      });
      if(!ro) row.append(el('button', { class:'add-opt', onclick(){ d.options.push(newOption('Option ' + String.fromCharCode(65 + d.options.length % 26))); touch(); render(); hostEl.scrollLeft = hostEl.scrollWidth; } }, icon('plus'), 'Add option'));
      root.append(row);
    }
    render(); hostEl.append(root);
    return { destroy(){ root.remove(); } };
  }
};

/* =====================================================================
   MODULE · Notes (native)
   ===================================================================== */
const ALLOWED = new Set(['B','STRONG','I','EM','U','S','STRIKE','UL','OL','LI','P','DIV','BR','H1','H2','H3','BLOCKQUOTE','CODE','PRE','SPAN']);
function sanitize(html){
  const doc = new DOMParser().parseFromString('<div>' + (html || '') + '</div>', 'text/html');
  const root = doc.body.firstChild;
  (function walk(n){
    Array.from(n.childNodes).forEach(c => {
      if(c.nodeType === 1){
        if(!ALLOWED.has(c.tagName)){
          if(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','LINK','META','IMG','SVG'].includes(c.tagName)){ c.remove(); return; }
          walk(c); c.replaceWith(...Array.from(c.childNodes)); return;
        }
        Array.from(c.attributes).forEach(a => c.removeAttribute(a.name));
        walk(c);
      } else if(c.nodeType !== 3) c.remove();
    });
  })(root);
  return root.innerHTML;
}
const plainText = html => { const d = document.createElement('div'); d.innerHTML = sanitize(html); return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
const NotesModule = {
  label:'Notes', icon:'notes', frame:false,
  defaultData: () => ({ notes: [] }),
  normalize: d => d ? (d.notes || []).map(n => [n.id, n.title, n.html]) : null,
  imageRefs: () => [],
  summarize(a, b){
    const na = (a && a.notes) || [], nb = (b && b.notes) || [], parts = [];
    const add = nb.filter(n => !na.some(x => x.id === n.id)), rem = na.filter(n => !nb.some(x => x.id === n.id));
    const ed = nb.filter(n => { const q = na.find(x => x.id === n.id); return q && (q.title !== n.title || q.html !== n.html); });
    const nm = n => '“' + (n.title || 'Untitled') + '”';
    if(add.length) parts.push('Added ' + add.slice(0, 2).map(nm).join(', ') + (add.length > 2 ? ' +' + (add.length - 2) : ''));
    if(ed.length) parts.push('Edited ' + ed.slice(0, 2).map(nm).join(', ') + (ed.length > 2 ? ' +' + (ed.length - 2) : ''));
    if(rem.length) parts.push('Deleted ' + rem.map(nm).join(', '));
    return parts.join(' · ') || 'Edited notes';
  },
  mount(hostEl, ctx){
    const ro = !ctx.editable, d = ctx.data();
    const root = el('div', { class:'notes' }), list = el('div', { class:'n-items' }), edit = el('div', { class:'n-edit' });
    const sorted = () => d.notes.slice().sort((x, y) => (y.updatedAt || '').localeCompare(x.updatedAt || ''));
    let open = ui.noteId && d.notes.find(n => n.id === ui.noteId) ? ui.noteId : (window.innerWidth > 820 && d.notes.length ? sorted()[0].id : null);
    function renderList(){
      list.textContent = '';
      sorted().forEach(n => {
        const snip = plainText(n.html).slice(0, 80);
        list.append(el('div', { class:'n-item' + (n.id === open ? ' on' : ''), tabindex:'0', role:'button', onclick(){ select(n.id); }, onkeydown(e){ if(e.key === 'Enter') select(n.id); } },
          el('span', { class:'t' + (n.title ? '' : ' untitled'), text: n.title || 'Untitled' }), snip ? el('span', { class:'s', text:snip }) : null, el('span', { class:'d', text: fmtAgo(n.updatedAt) })));
      });
      if(!d.notes.length) list.append(el('div', { class:'drawer-note', text: ro ? 'No notes yet.' : 'No notes yet. Start one with + New.' }));
    }
    function select(id){ open = id; ui.noteId = id; root.classList.toggle('has-open', !!id); renderList(); renderEditor(); }
    function renderEditor(){
      edit.textContent = '';
      const n = d.notes.find(x => x.id === open);
      if(!n){ edit.append(el('div', { class:'empty' }, el('strong', { text:'Nothing open' }), el('span', { text: ro ? 'Pick a note from the list.' : 'Pick a note from the list, or start a new one.' }), ro ? null : el('button', { class:'btn', onclick: newNote }, icon('plus'), 'New note'))); return; }
      const meta = el('div', { class:'n-meta' },
        el('button', { class:'linkbtn show-sm', text:'← All notes', onclick(){ select(null); } }),
        el('span', { text:'Created ' + fmtDate(n.createdAt) }), el('span', { class:'n-upd', text:'Edited ' + fmtAgo(n.updatedAt) }),
        ro ? null : el('button', { class:'n-delete', text:'Delete note', async onclick(){ if(!await askConfirm('Delete “' + (n.title || 'Untitled') + '”? You can bring it back from History.', 'Delete')) return; d.notes = d.notes.filter(x => x !== n); ctx.changed(); select(null); } }));
      const title = el('input', { class:'n-title', value:n.title, placeholder:'Untitled', 'aria-label':'Note title' }); title.readOnly = ro;
      const body = el('div', { class:'n-body', 'data-ph': ro ? '' : 'Write something…', html: sanitize(n.html) });
      if(!ro) body.setAttribute('contenteditable', 'true');
      const bump = () => { n.updatedAt = nowISO(); ctx.changed(); const u = meta.querySelector('.n-upd'); if(u) u.textContent = 'Edited just now'; renderList(); };
      title.addEventListener('input', () => { n.title = title.value; bump(); });
      title.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); body.focus(); } });
      body.addEventListener('input', () => { n.html = body.innerHTML; bump(); });
      body.addEventListener('paste', e => { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain')); });
      const cmd = (c, v) => () => { body.focus(); document.execCommand(c, false, v); n.html = body.innerHTML; bump(); };
      const tb = (props, f) => el('button', Object.assign({ onmousedown: e => e.preventDefault(), onclick: f }, props));
      const tools = ro ? null : el('div', { class:'n-tools', role:'toolbar', 'aria-label':'Formatting' },
        tb({ title:'Heading', text:'H', style:{ fontWeight:'700' } }, cmd('formatBlock', 'H2')), tb({ title:'Body text', text:'¶' }, cmd('formatBlock', 'DIV')), el('span', { class:'sep' }),
        tb({ title:'Bold (Ctrl/⌘ B)', html:'<b>B</b>' }, cmd('bold')), tb({ title:'Italic (Ctrl/⌘ I)', html:'<i>I</i>' }, cmd('italic')), tb({ title:'Strikethrough', html:'<s>S</s>' }, cmd('strikeThrough')), el('span', { class:'sep' }),
        tb({ title:'Bulleted list', text:'• List' }, cmd('insertUnorderedList')), tb({ title:'Numbered list', text:'1. List' }, cmd('insertOrderedList')), tb({ title:'Quote', text:'❝' }, cmd('formatBlock', 'BLOCKQUOTE')));
      edit.append(el('div', { class:'n-doc' }, meta, title, tools, body));
      if(!ro && !n.title && !plainText(n.html)) setTimeout(() => title.focus(), 0);
    }
    function newNote(){ const n = { id:uid(), title:'', html:'', createdAt:nowISO(), updatedAt:nowISO() }; d.notes.push(n); ctx.changed(); select(n.id); }
    root.append(el('div', { class:'n-list' }, el('div', { class:'n-list-h' }, el('span', { text: plural(d.notes.length, 'note') }), ro ? null : el('button', { class:'btn ghost', onclick: newNote }, icon('plus'), 'New')), list), edit);
    root.classList.toggle('has-open', !!open);
    renderList(); renderEditor(); hostEl.append(root);
    return { destroy(){ root.remove(); } };
  }
};

const MODULES = { moodboard: MoodboardModule, scope: ScopeModule, gantt: GanttModule, notes: NotesModule };

/* =====================================================================
   SHELL · embedded frames
   ===================================================================== */
const frames = new Map();
function postFrame(f, msg){ msg.__wsParent = 1; try { f.iframe.contentWindow.postMessage(msg, '*'); } catch(e){} }
function frameDoc(mod, p){
  const M = MODULES[mod];
  let data = clone(p.mods[mod].data);
  if(data){ data.theme = isDark() ? 'dark' : 'light'; if(M.hydrate) data = M.hydrate(p, data); }
  return SRC.tpl[mod].split('/*__WS_INIT__*/null').join(safeJSON({ mod, data, dark: isDark(), font: fontStack() }));
}
function destroyFrames(filter){ frames.forEach((f, k) => { if(!filter || filter(f)){ f.iframe.remove(); frames.delete(k); } }); }
window.addEventListener('message', e => {
  const m = e.data; if(!m || m.__ws !== 1) return;
  let f = null; frames.forEach(x => { if(x.iframe.contentWindow === e.source) f = x; });
  if(!f) return;
  const p = W.projects.find(x => x.id === f.pid); if(!p) return;
  if(m.type === 'save'){ if(canEdit()) MODULES[f.mod].ingest(p, m.data); }
  else if(m.type === 'save-shortcut'){ if(canEdit()) flush(); }
  else if(m.type === 'notice') toast(String(m.text || ''), 7000);
  else if(m.type === 'img-select'){
    ui.selImg = m.src ? (srcMap(p).get(m.src) || null) : null;
    if(m.src && !ui.selImg) ingestChain.then(() => { ui.selImg = srcMap(p).get(m.src) || null; if(ui.drawer === 'info') renderDrawer(); });
    if(ui.drawer === 'info') renderDrawer();
  }
});

/* =====================================================================
   SHELL · layout
   ===================================================================== */
const app = $('#app');
let native = null, popEl = null, mountSeq = 0;
function closePop(){ if(popEl){ popEl.remove(); popEl = null; } }
document.addEventListener('mousedown', e => { if(popEl && !popEl.contains(e.target)) closePop(); });
document.addEventListener('keydown', e => {
  if(e.key === 'Escape') closePop();
  if((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S')){ e.preventDefault(); if(canEdit()) flush(); }
});
window.addEventListener('beforeunload', e => { if(canEdit() && (flushTimer || flushing || (driveOn && W.projects.some(p => p._dirty)))){ e.preventDefault(); e.returnValue = ''; } });
function popover(anchor, content){
  closePop();
  const r = anchor.getBoundingClientRect();
  popEl = el('div', { class:'pop' }, content); document.body.append(popEl);
  const pw = popEl.offsetWidth, ph = popEl.offsetHeight;
  popEl.style.left = Math.max(8, Math.min(window.innerWidth - pw - 8, r.left)) + 'px';
  popEl.style.top = (r.bottom + ph + 8 > window.innerHeight ? Math.max(8, r.top - ph - 4) : r.bottom + 4) + 'px';
}
const EMOJI = ['📐','🤖','⚙️','🔧','🛠️','🔩','🧪','📦','🏥','🚚','💡','🎯','🧭','📋','🗂️','🧱','🪛','🔋','🛞','🧲','✏️','📎','🗺️','⭐'];
function emojiPicker(anchor, p){ popover(anchor, el('div', { class:'emoji-grid' }, EMOJI.map(em => el('button', { text:em, 'aria-label':em, onclick(){ p.icon = em; markChanged(p); W._indexDirty = true; closePop(); renderSidebar(); renderHeader(); } })))); }

const shell = {};
function buildShell(){
  app.textContent = '';
  shell.side = el('aside', { class:'side', 'aria-label':'Projects' });
  shell.top = el('div', { class:'topbar' });
  shell.banner = el('div');
  shell.tabs = el('nav', { class:'tabs', 'aria-label':'Sections' });
  shell.view = el('div', { class:'view' });
  shell.native = el('div', { class:'native' });
  shell.loading = el('div', { class:'empty loading', hidden:true }, el('span', { text:'Loading pictures…' }));
  shell.drawer = el('aside', { class:'drawer', hidden:true });
  shell.view.append(shell.native, shell.loading);
  shell.root = el('div', { class:'app' + (canEdit() ? '' : ' solo') }, canEdit() ? shell.side : null,
    el('main', { class:'main' }, shell.top, shell.banner, shell.tabs, el('div', { class:'stage' }, shell.view, shell.drawer)));
  app.append(shell.root);
  shell.view.addEventListener('mousedown', () => { if(ui.sideOpen){ ui.sideOpen = false; shell.root.classList.remove('side-open'); } });
}
function fullMessage(title, text){
  app.textContent = '';
  app.append(el('div', { class:'empty full' }, el('strong', { text:title }), el('span', { text }) ));
}

function renderSidebar(){
  if(!canEdit()) return;
  const s = shell.side; s.textContent = '';
  shell.root.classList.toggle('side-closed', ui.sideClosed);
  shell.root.classList.toggle('side-open', ui.sideOpen);
  const title = el('input', { class:'ws-title', value: W.title || '', placeholder:'Workspace name', 'aria-label':'Workspace name' });
  title.addEventListener('input', () => { W.title = title.value; document.title = title.value || 'Anium.planning'; markChanged(null); });
  s.append(el('div', { class:'ws-head' }, title,
    el('button', { class:'icon-btn', title:'Hide sidebar', 'aria-label':'Hide sidebar', onclick(){ if(window.innerWidth <= 820) ui.sideOpen = false; else ui.sideClosed = true; renderSidebar(); renderHeader(); } }, icon('menu'))));
  const list = el('div', { class:'side-sec' }, el('div', { class:'side-label', text:'Projects' }));
  W.projects.forEach(p => {
    list.append(el('div', { class:'proj' + (p.id === ui.project ? ' on' : ''), tabindex:'0', role:'button', 'aria-current': p.id === ui.project ? 'page' : null,
      onclick(e){ if(e.target.closest('.more')) return; openProject(p.id); }, onkeydown(e){ if(e.key === 'Enter') openProject(p.id); } },
      el('span', { class:'ico', text:p.icon || '📐' }), el('span', { class:'nm', text:p.name || 'Untitled project' }),
      p.drive && p.drive.shared ? el('span', { class:'shared-dot', title:'Shared with a link' }) : null,
      el('button', { class:'more', title:'Project options', 'aria-label':'Project options', html:ICON.more, onclick(e){
        e.stopPropagation();
        popover(e.currentTarget, el('div', null,
          el('button', { class:'mi', text:'Rename', onclick(){ closePop(); openProject(p.id); setTimeout(() => { const n = $('.p-name'); if(n){ n.focus(); n.select(); } }, 30); } }),
          el('button', { class:'mi', text:'Share…', onclick(){ closePop(); openProject(p.id); openShare(p); } }),
          el('button', { class:'mi', text:'Download a copy', onclick(){ closePop(); downloadProject(p); } }),
          el('button', { class:'mi', text:'Duplicate', onclick(){ closePop(); duplicateProject(p); } }),
          W.projects.length > 1 ? el('button', { class:'mi danger', text:'Delete', onclick(){ closePop(); deleteProject(p); } }) : null));
      } })));
  });
  list.append(el('button', { class:'add-proj', onclick: newProject }, el('span', { class:'ico', html:ICON.plus, style:{ width:'20px', display:'grid', placeItems:'center' } }), 'New project'));
  s.append(el('div', { class:'side-scroll' }, list));
  const foot = el('div', { class:'side-foot' });
  foot.append(appearanceControls());
  const storage = el('div', { class:'storage' });
  if(!HAS_GOOGLE) storage.append(el('div', { class:'mode-note', text:'Saved in this browser. To sync with Google Drive and share links, finish SETUP.md in the repo.' }));
  else if(driveOn) storage.append(el('div', { class:'drive-on' }, icon('drive'), el('span', { text:'Google Drive' }), el('a', { href:'https://drive.google.com/drive/folders/' + Drive.rootId, target:'_blank', rel:'noopener', text:'Open folder' }),
    el('a', { href:'#', text:'Sign out', onclick(e){ e.preventDefault(); signOutDrive(); } })));
  else storage.append(el('button', { class:'btn drive-btn', onclick: connectDrive }, icon('drive'), syncState === 'reconnect' ? 'Reconnect Google Drive' : 'Connect Google Drive'),
    el('div', { class:'mode-note', text: syncState === 'reconnect' ? 'Your sign-in expired. Changes are kept on this computer until you reconnect.' : 'Until you connect, everything is saved in this browser only.' }));
  foot.append(storage);
  const fileIn = el('input', { type:'file', accept:'.html,text/html', style:{ display:'none' } });
  fileIn.addEventListener('change', () => { const f = fileIn.files && fileIn.files[0]; fileIn.value = ''; if(f) importFile(f); });
  foot.append(fileIn, el('button', { class:'linkbtn', onclick(){ fileIn.click(); } }, icon('up'), 'Import from a file…'));
  s.append(foot);
}
function statusChip(){
  const txt = { local: cacheOK ? 'Saved on this computer' : 'Not saved: browser storage is off', saving:'Saving…', saved:'Saved to Drive', offline:'Offline: will retry', error:'Couldn’t save to Drive', reconnect:'Drive disconnected' }[syncState] || '';
  const pending = flushTimer || flushing;
  const chip = el('span', { class:'status ' + syncState, title: lastSync ? 'Last saved to Drive ' + fmtAgo(lastSync) : '' }, pending && syncState !== 'reconnect' ? 'Saving…' : txt);
  if(syncState === 'reconnect') return el('button', { class:'btn warn-btn', onclick: connectDrive }, icon('drive'), 'Reconnect Drive');
  if(syncState === 'error') return el('button', { class:'btn warn-btn', onclick(){ W.projects.forEach(p => p._dirty = true); flush(); } }, 'Retry save');
  return chip;
}
function renderStatus(){ const slot = $('.status-slot'); if(slot){ slot.textContent = ''; slot.append(statusChip()); } }
function renderHeader(){
  const t = shell.top; t.textContent = '';
  const p = proj(), ed = canEdit();
  if(ed && (ui.sideClosed || window.innerWidth <= 820)) t.append(el('button', { class:'icon-btn', title:'Show sidebar', 'aria-label':'Show sidebar', onclick(){ if(window.innerWidth <= 820) ui.sideOpen = true; else ui.sideClosed = false; renderSidebar(); renderHeader(); } }, icon('menu')));
  t.append(el('button', { class:'p-ico', text: p.icon || '📐', title: ed ? 'Change icon' : null, 'aria-label':'Project icon', disabled: !ed, onclick(e){ emojiPicker(e.currentTarget, p); } }));
  const name = el('input', { class:'p-name', value: p.name || '', placeholder:'Untitled project', 'aria-label':'Project name' });
  name.readOnly = !ed;
  name.addEventListener('input', () => { p.name = name.value; markChanged(p); W._indexDirty = true; const n = shell.side.querySelector('.proj.on .nm'); if(n) n.textContent = name.value || 'Untitled project'; });
  t.append(name);
  const right = el('div', { class:'top-right' });
  const ea = p.mods[ui.tab].editedAt;
  if(ea) right.append(el('span', { class:'edited', title: fmtDate(ea), text:'Edited ' + fmtAgo(ea) }));
  if(ui.tab === 'moodboard') right.append(el('button', { class:'btn ghost' + (ui.drawer === 'info' ? ' on' : ''), title:'Picture details', onclick(){ toggleDrawer('info'); } }, icon('info'), el('span', { class:'hide-sm', text:'Picture info' })));
  right.append(el('button', { class:'btn ghost' + (ui.drawer === 'history' ? ' on' : ''), title:'Version history', onclick(){ toggleDrawer('history'); } }, icon('clock'), el('span', { class:'hide-sm', text:'History' })));
  if(ed){
    right.append(el('span', { class:'status-slot hide-sm' }, statusChip()));
    right.append(el('button', { class:'btn primary', onclick(){ openShare(p); } }, icon('share'), 'Share'));
  } else {
    right.append(el('button', { class:'btn ghost', title:'Theme and font', 'aria-label':'Theme and font', onclick(e){ popover(e.currentTarget, el('div', { style:{ padding:'6px', width:'240px' } }, appearanceControls())); } }, el('span', { text:'Aa', style:{ fontWeight:'600' } })));
    right.append(el('span', { class:'pill', text:'View only' }));
    right.append(el('button', { class:'btn primary', onclick(){ downloadProject(p); } }, icon('down'), el('span', { class:'hide-sm', text:'Download' })));
  }
  t.append(right);
}
function renderTabs(){
  if(!shell.tabs) return;
  const t = shell.tabs; t.textContent = '';
  TAB_IDS.forEach(id => {
    const M = MODULES[id];
    t.append(el('button', { class:'tab' + (ui.tab === id ? ' on' : ''), 'aria-current': ui.tab === id ? 'page' : null, onclick(){ openTab(id); } }, icon(M.icon), M.label));
  });
}
function renderBanner(){
  shell.banner.textContent = '';
  if(ROLE === 'offline') shell.banner.append(el('div', { class:'banner info' }, el('span', { class:'grow', text:'Downloaded copy of “' + (proj().name || 'Untitled project') + '”, saved ' + fmtDate(EMBED.exportedAt) + '. It opens without internet and doesn’t change.' })));
}
function moduleCtx(p, mod){
  return {
    project: p, editable: canEdit(),
    data(){ if(!p.mods[mod].data) p.mods[mod].data = MODULES[mod].defaultData(); return p.mods[mod].data; },
    changed(){ p.mods[mod].editedAt = nowISO(); markChanged(p); },
    pickImage(cb){ openImagePicker(p, cb); }
  };
}
async function mountTab(){
  const seq = ++mountSeq;
  if(native){ native.destroy(); native = null; }
  frames.forEach(f => f.iframe.style.display = 'none');
  shell.native.style.display = 'none';
  const p = proj(), M = MODULES[ui.tab];
  if(ROLE === 'owner' && driveOn && Object.values(p.images).some(im => im.driveId && !im.src)){
    shell.loading.hidden = false;
    try { await ensureImages(p); } catch(e){ driveError(e); }
    shell.loading.hidden = true;
    if(seq !== mountSeq) return;
  }
  if(M.frame){
    const key = p.id + ':' + ui.tab;
    let f = frames.get(key);
    if(!f){
      const iframe = el('iframe', { class:'frame', title: M.label });
      iframe.srcdoc = frameDoc(ui.tab, p);
      shell.view.append(iframe);
      f = { iframe, pid:p.id, mod:ui.tab }; frames.set(key, f);
    }
    f.iframe.style.display = 'block';
  } else {
    shell.native.style.display = 'block'; shell.native.scrollTop = 0; shell.native.scrollLeft = 0;
    native = M.mount(shell.native, moduleCtx(p, ui.tab));
  }
}
function renderAll(remount){
  if(!shell.root) buildShell();
  document.title = canEdit() ? (W.title || 'Anium.planning') : (proj().name || 'Shared project');
  renderSidebar(); renderHeader(); renderBanner(); renderTabs();
  if(remount !== false || native) mountTab();
  renderDrawer();
}
function openProject(id){
  if(id === ui.project){ ui.sideOpen = false; renderSidebar(); return; }
  ui.project = id; ui.noteId = null; ui.selImg = null; ui.sideOpen = false;
  destroyFrames(f => f.pid !== id);
  renderAll(true);
}
function openTab(id){ ui.tab = id; if(ui.drawer === 'info' && id !== 'moodboard') ui.drawer = null; renderHeader(); renderTabs(); mountTab(); renderDrawer(); }
function newProject(){
  const p = blankProject(''); p.name = ''; prepareProject(p);
  W.projects.push(p); W._indexDirty = true; markChanged(p); openProject(p.id);
  setTimeout(() => { const n = $('.p-name'); if(n){ n.focus(); n.select(); } }, 0);
}
function duplicateProject(src){
  const p = clone(plain(src)); p.id = uid(); p.name = (src.name || 'Untitled project') + ' (copy)'; p.history = []; p.createdAt = p.updatedAt = nowISO(); delete p.drive;
  Object.values(p.images).forEach(im => { if(!im.src && src.images[im.id]) im.src = src.images[im.id].src; delete im.driveId; });
  if(p.mods.scope.data) p.mods.scope.data.options.forEach(o => o.id = uid());
  prepareProject(p);
  W.projects.splice(W.projects.indexOf(src) + 1, 0, p); W._indexDirty = true; markChanged(p); openProject(p.id);
}
async function deleteProject(p){
  if(!await askConfirm('Delete “' + (p.name || 'Untitled project') + '” and everything in it?' + (p.drive && p.drive.folderId ? ' Its Google Drive folder goes to your Drive trash.' : ''), 'Delete project')) return;
  W.projects = W.projects.filter(x => x !== p);
  destroyFrames(f => f.pid === p.id);
  if(ui.project === p.id) ui.project = W.projects[0].id;
  if(driveOn && p.drive && p.drive.folderId){ try { await Drive.trash(p.drive.folderId); } catch(e){} }
  W._indexDirty = true; markChanged(null); renderAll(true);
}

/* =====================================================================
   SHELL · sharing, download, import
   ===================================================================== */
const shareURL = p => location.origin + location.pathname + '?p=' + encodeURIComponent(p.drive.fileId);
function openShare(p){
  const body = el('div', { class:'share' });
  const m = modal('Share “' + (p.name || 'Untitled project') + '”', body);
  async function draw(){
    body.textContent = '';
    const linkSec = el('section', { class:'share-sec' });
    linkSec.append(el('h4', { text:'View-only link' }));
    if(!HAS_GOOGLE){
      linkSec.append(el('p', { class:'muted', text:'Share links need Google Drive. Finish the steps in SETUP.md (about 15 minutes), then come back here.' }));
    } else if(!driveOn){
      linkSec.append(el('p', { class:'muted', text:'Connect Google Drive to get a link. Only this project is shared, never your others.' }),
        el('button', { class:'btn primary', async onclick(){ m.close(); await connectDrive(); if(driveOn) openShare(p); } }, icon('drive'), 'Connect Google Drive'));
    } else {
      if(!p.drive || !p.drive.fileId || p._dirty){ linkSec.append(el('p', { class:'muted', text:'Saving to Drive…' })); body.append(linkSec); await flush(); if(p.drive && p.drive.fileId) return draw(); linkSec.lastChild.textContent = 'Couldn’t save to Drive yet. Check your connection and try again.'; return; }
      const on = !!p.drive.shared;
      const sw = el('button', { class:'switch' + (on ? ' on' : ''), role:'switch', 'aria-checked':String(on), 'aria-label':'Anyone with the link can view' }, el('i'));
      sw.addEventListener('click', async () => {
        sw.disabled = true;
        try { await Drive.setShared(p, !on); markChanged(p); await flush(); renderSidebar(); draw(); }
        catch(e){ sw.disabled = false; toast(e && e.code === 'auth' ? 'Drive sign-in expired. Reconnect and try again.' : 'Couldn’t change sharing. Try again.', 4500); if(e && e.code === 'auth') driveError(e); }
      });
      linkSec.append(el('div', { class:'share-row' }, el('div', null, el('strong', { text:'Anyone with the link can view' }), el('div', { class:'muted', text: on ? 'No Google account needed. They can look and download a copy, but can’t edit.' : 'Off: only you can open this project.' })), sw));
      if(on){
        const inp = el('input', { class:'link-in', value: shareURL(p), readonly:'', 'aria-label':'Share link', onfocus(e){ e.target.select(); } });
        linkSec.append(el('div', { class:'link-row' }, inp, el('button', { class:'btn primary', async onclick(e){
          try { await navigator.clipboard.writeText(inp.value); e.currentTarget.textContent = 'Copied'; } catch(err){ inp.select(); document.execCommand('copy'); e.currentTarget.textContent = 'Copied'; }
        } }, 'Copy link')));
        linkSec.append(el('p', { class:'muted small', text:'Viewers always see your latest saved changes. Your other projects stay private.' }));
      }
    }
    body.append(linkSec);
    body.append(el('section', { class:'share-sec' }, el('h4', { text:'Download a copy' }),
      el('p', { class:'muted', text:'One file with this project and its pictures. Opens in any browser on Mac or Windows, even offline. It’s a snapshot: later changes won’t appear in it.' }),
      el('button', { class:'btn', onclick(){ downloadProject(p); } }, icon('down'), 'Download')));
  }
  draw();
}
async function downloadProject(p){
  toast('Preparing download…', 10000);
  const q = serializeProject(p); delete q.drive;
  for(const im of Object.values(q.images)){
    if(im.src) continue;
    const live = p.images[im.id];
    try {
      if(live && live.src) im.src = live.src;
      else if(im.driveId && ROLE === 'owner' && driveOn) im.src = await Drive.readImage(im.driveId);
      else if(im.driveId && HAS_KEY){ const r = await fetch(publicMediaURL(im.driveId)); if(r.ok) im.src = await blobToDataURL(await r.blob()); }
      else if(im.url){ const r = await fetch(im.url, { mode:'cors' }); if(r.ok) im.src = await blobToDataURL(await r.blob()); }
    } catch(e){}
    delete im.driveId;
  }
  saveFile(slug(p.name) + '.html', buildOfflineDoc(q));
  toast('Downloaded “' + slug(p.name) + '.html”');
}
async function importFile(file){
  const text = await file.text();
  let added = [];
  try {
    let m = text.match(/<script type="application\/json" id="app-state">([\s\S]*?)<\/script>/);
    if(m){
      const st = JSON.parse(m[1]);
      added = (st.projects || []).map(p0 => {
        const p = clone(p0); p.images = {}; delete p.drive;
        if(W.projects.some(x => x.id === p.id)) p.id = uid();
        const refs = new Set();
        TAB_IDS.forEach(k => MODULES[k].imageRefs(p.mods[k] && p.mods[k].data).forEach(r => refs.add(r)));
        (p.history || []).forEach(h => MODULES[h.mod].imageRefs(h.snap).forEach(r => refs.add(r)));
        refs.forEach(id => { const im = st.images && st.images[id]; if(im) p.images[id] = { id, src: im.data, w: im.w, h: im.h, addedAt: im.addedAt, caption: im.caption || '', events: im.events || [] }; });
        return p;
      });
    } else if((m = text.match(/<script type="application\/json" id="dw-embedded">([\s\S]*?)<\/script>/))){
      const p = JSON.parse(m[1]).project; delete p.drive;
      if(W.projects.some(x => x.id === p.id)){ p.id = uid(); p.name = (p.name || 'Untitled project') + ' (imported)'; }
      added = [p];
    }
  } catch(e){ added = []; }
  if(!added.length){ toast('That file isn’t an Anium.planning file.', 4000); return; }
  added.forEach(p => { prepareProject(p); W.projects.push(p); p._dirty = true; });
  W.projects = W.projects.filter(p => !(p.pristine && !p.drive && W.projects.length > 1));
  W._indexDirty = true; markChanged(null);
  toast('Imported ' + plural(added.length, 'project'));
  openProject(added[0].id); renderAll(true);
}

/* =====================================================================
   SHELL · drawers (history, picture info) and picture picker
   ===================================================================== */
function toggleDrawer(k){ ui.drawer = ui.drawer === k ? null : k; renderHeader(); renderDrawer(); }
function renderDrawer(){
  const d = shell.drawer; d.textContent = '';
  d.hidden = !ui.drawer;
  if(!ui.drawer) return;
  const p = proj();
  const head = title => el('div', { class:'drawer-h' }, el('h3', { text:title }), el('button', { class:'icon-btn', 'aria-label':'Close', onclick(){ toggleDrawer(ui.drawer); } }, icon('close')));
  const body = el('div', { class:'drawer-b' });
  if(ui.drawer === 'history'){
    d.append(head(MODULES[ui.tab].label + ' history'));
    body.append(el('div', { class:'drawer-note', text: canEdit() ? 'Changes save automatically. Edits within 10 minutes of each other are grouped into one version.' : 'Versions the owner has saved.' }));
    const items = (p.history || []).filter(x => x.mod === ui.tab).slice().reverse();
    if(!items.length) body.append(el('div', { class:'drawer-note', text:'No versions yet.' }));
    let lastDay = '';
    items.forEach((v, i) => {
      const day = fmtDate(v.t, false);
      if(day !== lastDay){ body.append(el('div', { class:'ver-day', text: day })); lastDay = day; }
      body.append(el('div', { class:'ver' + (i === 0 ? ' cur' : '') },
        el('div', { class:'vt' }, el('span', { text: fmtClock(new Date(v.t)) + (i === 0 ? ' · current' : '') }),
          canEdit() && i > 0 ? el('button', { class:'vr', text:'Restore', onclick(){ restoreVersion(p, v); } }) : null),
        el('div', { class:'vs', text: v.summary })));
    });
  } else if(ui.drawer === 'info'){
    d.append(head('Picture info'));
    const id = ui.selImg, im = id && p.images[id];
    if(!im){
      body.append(el('div', { class:'empty', style:{ height:'auto', padding:'40px 16px' } }, el('strong', { text:'No picture selected' }), el('span', { text:'Click a picture on the mood board to see when it was added, its caption, and where it’s used.' })));
    } else {
      body.append(el('div', { class:'info-img' }, el('img', { src: imgURL(p, id), alt: im.caption || 'Selected picture' })));
      const uses = ((p.mods.scope.data && p.mods.scope.data.options) || []).filter(o => o.img === id).map(o => o.title || 'Untitled option');
      body.append(el('dl', { class:'kv' },
        el('dt', { text:'Added' }), el('dd', { text: fmtDate(im.addedAt) }),
        im.url ? el('dt', { text:'Source' }) : null, im.url ? el('dd', null, el('a', { href: im.url, target:'_blank', rel:'noopener noreferrer', text: host(im.url) }), im.src ? '' : el('div', { class:'muted small', text:'Shown from the original site. If that site removes it, it disappears here.' })) : null,
        im.w ? el('dt', { text:'Size' }) : null, im.w ? el('dd', { text: im.w + ' × ' + im.h + ' px' }) : null,
        el('dt', { text:'Used in' }), el('dd', { text: uses.length ? uses.join(', ') : 'Not picked for an option yet' })));
      body.append(el('div', { class:'field-label', text:'Caption' }));
      const cap = el('textarea', { class:'ta', placeholder: canEdit() ? 'Where it’s from, what you like about it…' : '', 'aria-label':'Caption' });
      cap.value = im.caption || ''; cap.readOnly = !canEdit();
      cap.addEventListener('input', () => { im.caption = cap.value; markChanged(p); });
      body.append(el('div', { style:{ padding:'0 10px 14px' } }, cap));
      body.append(el('div', { class:'field-label', text:'Activity' }));
      const evs = (im.events || []).slice().reverse();
      body.append(el('ul', { class:'events' }, evs.length ? evs.map(e => el('li', null, el('span', { text:e.text }), el('span', { text: fmtDate(e.t) }))) : el('li', null, el('span', { text:'Activity shows up a moment after changes are saved.' }), el('span'))));
    }
  }
  d.append(body);
}
async function restoreVersion(p, v){
  if(!await askConfirm('Restore ' + MODULES[v.mod].label.toLowerCase() + ' to the version from ' + fmtDate(v.t) + '? The current version stays in history.', 'Restore')) return;
  restoreNotes[p.id + ':' + v.mod] = 'Restored the version from ' + fmtDate(v.t);
  setModData(p.id, v.mod, clone(v.snap));
  destroyFrames(f => f.pid === p.id && f.mod === v.mod);
  if(ui.tab === v.mod) mountTab();
  await flush(); renderDrawer();
  toast('Version restored');
}
function addToBoard(p, id){
  const im = p.images[id];
  let d = clone(p.mods.moodboard.data);
  if(!d) d = { cards:[], pan:{ x:0, y:0 }, zoom:1, zCounter:10, worldW:4000, worldH:4000 };
  d.cards = d.cards || [];
  const bottom = d.cards.reduce((m, c) => Math.max(m, (c.y || 0) + (c.h || 0)), 40);
  const h = im && im.w ? Math.round(240 * im.h / im.w) : 200;
  const n = d.cards.filter(c => c.type === 'image').length;
  d.zCounter = (d.zCounter || 10) + 1;
  d.cards.push({ type:'image', x: 60 + (n % 4) * 270, y: bottom + 40, w:240, h, z: d.zCounter, ci:0, src:'img:' + id });
  setModData(p.id, 'moodboard', d);
  destroyFrames(f => f.pid === p.id && f.mod === 'moodboard');
}
function openImagePicker(p, cb){
  const ids = MoodboardModule.imageRefs(p.mods.moodboard.data).concat(ScopeModule.imageRefs(p.mods.scope.data)).filter((v, i, a) => a.indexOf(v) === i && p.images[v]);
  let mdl = null;
  const choose = id => { mdl.close(); cb(id); };
  const fileIn = el('input', { type:'file', accept:'image/*', style:{ display:'none' } });
  fileIn.addEventListener('change', () => {
    const f = fileIn.files && fileIn.files[0]; if(!f || !/^image\//.test(f.type)) return;
    const r = new FileReader();
    r.onload = async () => { const id = await addDataImage(p, r.result); addToBoard(p, id); choose(id); toast('Picture added to this option and to your mood board'); };
    r.readAsDataURL(f);
  });
  const urlIn = el('input', { class:'link-in', placeholder:'Paste a picture address, or a copied picture', 'aria-label':'Picture address' });
  const err = el('div', { class:'err', hidden:true });
  const addUrl = () => {
    const v = urlIn.value.trim(); if(!/^https?:\/\//i.test(v)){ err.hidden = false; err.textContent = 'Paste an address that starts with http:// or https://'; return; }
    const probe = new Image();
    probe.onload = () => { const id = addUrlImage(p, v); addToBoard(p, id); choose(id); toast('Picture added to this option and to your mood board'); };
    probe.onerror = () => { err.hidden = false; err.textContent = 'That picture didn’t load. Make sure it’s the picture’s own address (right-click → Copy image address), or copy the picture itself and paste it here.'; };
    probe.src = v;
  };
  urlIn.addEventListener('keydown', e => { if(e.key === 'Enter') addUrl(); });
  urlIn.addEventListener('paste', async e => {
    const f = Array.from((e.clipboardData && e.clipboardData.files) || []).find(x => /^image\//.test(x.type));
    if(!f) return; e.preventDefault();
    const id = await addDataImage(p, await blobToDataURL(f)); addToBoard(p, id); choose(id); toast('Picture added to this option and to your mood board');
  });
  const body = el('div', null,
    el('div', { class:'add-row' }, urlIn, el('button', { class:'btn', text:'Add', onclick: addUrl }), el('button', { class:'btn primary', onclick(){ fileIn.click(); } }, icon('up'), 'Upload'), fileIn),
    err,
    ids.length ? el('div', { class:'pick-grid' }, ids.map(id => el('button', { onclick(){ choose(id); } },
      el('img', { src: imgURL(p, id), alt: p.images[id].caption || 'Mood board picture' }),
      el('span', { text: p.images[id].caption || 'Added ' + fmtDate(p.images[id].addedAt, false) }))))
    : el('div', { class:'empty', style:{ height:'auto', padding:'28px 10px' } }, el('strong', { text:'No pictures on the mood board yet' }), el('span', { text:'Upload one, paste a picture address above, or add pictures to the mood board first.' })));
  mdl = modal('Choose a picture', body, { cls:'wide' });
  setTimeout(() => urlIn.focus(), 30);
}

/* =====================================================================
   BOOT
   ===================================================================== */
// Workspaces created before the rename still carry the old default title.
const renamed = t => t === 'Design workspace' ? 'Anium.planning' : t;
function restoreUI(){
  let st = null; try { st = JSON.parse(LS.get('dw-ui') || 'null'); } catch(e){}
  if(st){ if(TAB_IDS.includes(st.tab)) ui.tab = st.tab; ui.drawer = st.drawer || null; ui.noteId = st.noteId || null; ui.sideClosed = !!st.sideClosed; }
  ui.project = (st && W.projects.some(p => p.id === st.project)) ? st.project : W.projects[0].id;
  if(ui.drawer === 'info' && ui.tab !== 'moodboard') ui.drawer = null;
}
async function bootOwner(){
  let cached = null;
  try { cached = await IDB.get('workspace'); } catch(e){ cacheOK = false; }
  W = cached && cached.projects && cached.projects.length ? cached : { v:2, title:'Anium.planning', projects:[Object.assign(blankProject('First project'), { pristine:true })] };
  W.title = renamed(W.title);
  W.projects.forEach(prepareProject);
  restoreUI();
  buildShell(); renderAll(true);
  if(!cacheOK) toast('This browser blocks saving. Connect Google Drive to keep your work.', 6000);
  if(W.projects.some(p => p._dirty)) scheduleFlush();
  window.addEventListener('pagehide', stashUI);
  document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'hidden') stashUI(); });
  const auth = new URLSearchParams(location.search).get('auth');
  if(auth){
    history.replaceState(null, '', location.pathname);
    toast(auth === 'cancelled' ? 'Google sign-in was cancelled.' : 'Google sign-in didn’t finish. Try again.', 5000);
  }
  if(HAS_GOOGLE) resumeDrive();
}
async function bootViewer(){
  fullMessage('Loading…', '');
  if(!HAS_KEY){ fullMessage('This link can’t open yet', 'The app is missing its Google API key. The owner needs to finish SETUP.md.'); return; }
  try {
    const r = await fetch(API + '/files/' + encodeURIComponent(VIEW_ID) + '?alt=media&key=' + encodeURIComponent(CFG.apiKey));
    if(!r.ok) throw r.status;
    const p = JSON.parse(await r.text());
    if(!p || !p.mods) throw 'bad';
    W = { title: p.name, projects:[prepareProject(p)] };
    ui.project = p.id; restoreUI();
    buildShell(); renderAll(true);
  } catch(e){
    fullMessage('This project isn’t available', 'The owner may have stopped sharing it, or the link is incomplete. Ask them for a new link.');
  }
}
function bootOffline(){
  const p = EMBED.project;
  W = { title: p.name, projects:[prepareProject(p)] };
  ui.project = p.id; restoreUI();
  buildShell(); renderAll(true);
}
applyPrefs();
let rw = null; window.addEventListener('resize', () => { clearTimeout(rw); rw = setTimeout(() => { if(shell.root) renderHeader(); }, 150); });
setInterval(() => { if(shell.root && !flushing) renderHeader(); }, 60000);
if(ROLE === 'offline') bootOffline(); else if(ROLE === 'viewer') bootViewer(); else bootOwner();
})();
