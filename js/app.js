(function () {
  'use strict';

  /* ================= Të dhënat (katalogu real i dubluar) ================= */
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const titleOf = (it) => it.title || '';
  const typeOf = (it, fallback) => it.media_type || fallback || 'movie';
  const yearOf = (it) => it.year || '';
  const hue = (id) => { let h = 0; const s = String(id); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ruajtja mund të jetë e bllokuar */ } }
  };

  const vurl = (v) => (typeof v === 'string' ? v : (v && v.url) || '');
  const vlabel = (v, i) => (typeof v === 'string' ? 'Shiko' : (v && v.label) || ('Pjesa ' + (i + 1)));
  function mapItem(m) {
    const videos = (m.videos || []).map((v, i) => ({ label: vlabel(v, i), url: vurl(v) })).filter((v) => v.url);
    return {
      id: m.id,
      media_type: m.type === 'serial' ? 'tv' : 'movie',
      title: m.title_al || m.title_orig || '',
      otitle: m.title_orig || '',
      year: m.year || '',
      poster: m.poster || '',
      quality: String(m.quality || 'FULL HD').toUpperCase(),
      genres: Array.isArray(m.genres) ? m.genres : [],
      overview: m.desc || '',
      duration: m.duration || '',
      studio: m.studio || '',
      videos
    };
  }

  let FILMA = [], SERIALE = [], ALL = [];
  const byId = new Map();
  async function loadData() {
    if (ALL.length) return ALL;
    const [f, s] = await Promise.all([
      fetch('data/filma.json').then((r) => r.json()),
      fetch('data/seriale.json').then((r) => r.json())
    ]);
    FILMA = f.map(mapItem);
    SERIALE = s.map(mapItem);
    ALL = FILMA.concat(SERIALE);
    ALL.forEach((it) => { byId.set(it.media_type + ':' + it.id, it); seen.set(it.media_type + ':' + it.id, it); });
    return ALL;
  }

  const byGenre = (list, g, n) => list.filter((m) => m.genres.includes(g)).slice(0, n || 30);
  function buildRows(r) {
    if (r === '/filma') return [
      { title: 'Filmat më popullorë', hero: true, items: FILMA.slice(0, 30) },
      { title: 'Animuar', wide: true, items: byGenre(FILMA, 'Animuar') },
      { title: 'Aventurë', items: byGenre(FILMA, 'Aventurë') },
      { title: 'Komedi', items: byGenre(FILMA, 'Komedi') },
      { title: 'Aksion', items: byGenre(FILMA, 'Aksion') },
      { title: 'Familjar', items: byGenre(FILMA, 'Familjar') },
      { title: 'Dramë', items: byGenre(FILMA, 'Dramë') }
    ];
    if (r === '/seriale') return [
      { title: 'Serialet më popullore', hero: true, top: true, items: SERIALE.slice(0, 30) },
      { title: 'Aksion', wide: true, items: byGenre(SERIALE, 'Aksion') },
      { title: 'Animuar', items: byGenre(SERIALE, 'Animuar') },
      { title: 'Aventurë', items: byGenre(SERIALE, 'Aventurë') },
      { title: 'Fantazi', items: byGenre(SERIALE, 'Fantazi') },
      { title: 'Komedi', items: byGenre(SERIALE, 'Komedi') }
    ];
    return [
      { title: 'Top 10 sot', tag: 'Në trend', top: true, hero: true, items: FILMA.slice(0, 10) },
      { title: 'Filma të dubluar', items: FILMA.slice(10, 40) },
      { title: 'Seriale në shqip', items: SERIALE.slice(0, 30) },
      { title: 'Animuar', wide: true, items: byGenre(FILMA, 'Animuar') },
      { title: 'Aventurë', items: byGenre(FILMA, 'Aventurë') },
      { title: 'Komedi', items: byGenre(FILMA, 'Komedi') },
      { title: 'Aksion', items: FILMA.filter((m) => m.genres.includes('Aksion')).concat(SERIALE.filter((m) => m.genres.includes('Aksion'))).slice(0, 30) },
      { title: 'Fantazi', items: byGenre(FILMA, 'Fantazi') },
      { title: 'Familjar', items: byGenre(FILMA, 'Familjar') }
    ];
  }

  async function load(row) { return row.items || []; }

  /* ================= Kartat ================= */
  function poster(it, wide) {
    if (!it.poster) return `<div class="ph" style="--h:${hue(it.id)}"><b>${esc(titleOf(it))}</b><span>${esc(yearOf(it))}${it.genres && it.genres[0] ? ' · ' + esc(it.genres[0]) : ''}</span></div>`;
    return `<img src="${esc(it.poster)}" alt="" loading="lazy" decoding="async" onload="this.classList.add('ok')" onerror="this.remove()">`;
  }

  function card(it, row = {}) {
    const type = typeOf(it, row.type);
    return `<a class="card${row.wide ? ' card--wide' : ''}" href="#" data-id="${it.id}" data-type="${type}" aria-label="${esc(titleOf(it))}">
      ${poster(it, row.wide)}
      <span class="card__rate">${esc(it.quality || 'FULL HD')}</span>
      <span class="card__info"><b>${esc(titleOf(it))}</b><span>${esc(yearOf(it))} · ${type === 'tv' ? 'Serial' : 'Film'}</span></span>
    </a>`;
  }

  /* Ruaj artikujt që të hapen pa thirrje shtesë */
  const seen = new Map();
  const remember = (list, type) => list.forEach((it) => seen.set(typeOf(it, type) + ':' + it.id, { ...it, media_type: typeOf(it, type) }));

  /* ================= Rreshtat ================= */
  const rowsEl = $('#rows');
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;

  function rowShell(row, i) {
    const sec = document.createElement('section');
    sec.className = 'row';
    sec.innerHTML = `<div class="row__head"><h2>${esc(row.title)}${row.tag ? `<small>${esc(row.tag)}</small>` : ''}</h2>
      <div class="row__nav"><button data-dir="-1" aria-label="Majtas">‹</button><button data-dir="1" aria-label="Djathtas">›</button></div></div>
      <div class="track" role="list">${Array.from({ length: 8 }, () => `<div class="card sk${row.wide ? ' card--wide' : ''}"></div>`).join('')}</div>`;
    sec.querySelectorAll('.row__nav button').forEach((b) => b.addEventListener('click', () => {
      const t = sec.querySelector('.track'); t.scrollBy({ left: b.dataset.dir * t.clientWidth * 0.85, behavior: 'smooth' });
    }));
    if (io) io.observe(sec); else sec.classList.add('in');
    if (i < 2) sec.classList.add('in');
    return sec;
  }

  async function fillRow(sec, row) {
    const track = sec.querySelector('.track');
    try {
      let list = await load(row);
      remember(list, row.type);
      if (!list.length) { sec.remove(); return []; }
      if (row.top) {
        list = list.slice(0, 10);
        track.innerHTML = list.map((it, n) => `<div class="top" role="listitem"><span class="top__n" aria-hidden="true">${n + 1}</span>${card(it, row)}</div>`).join('');
      } else {
        track.innerHTML = list.map((it) => card(it, row)).join('');
      }
      return list;
    } catch (e) {
      track.innerHTML = `<p style="color:var(--muted);padding:0 4px">Nuk u ngarkua. <button class="chip" data-retry>Provo sërish</button></p>`;
      track.querySelector('[data-retry]').onclick = () => fillRow(sec, row);
      return [];
    }
  }

  /* ================= Hero ================= */
  let heroTimer = null, heroList = [], heroIdx = 0;

  function setHero(list) {
    const pool = list.filter((x) => x.poster);
    heroList = pool.slice(0, 5);
    if (!heroList.length) return;
    const bg = $('#heroBg');
    bg.innerHTML = heroList.map((it) => `<div class="slide" style="background-image:url(${esc(it.poster)})"></div>`).join('');
    $('#heroDots').innerHTML = heroList.map((it, i) => `<button role="tab" aria-label="${esc(titleOf(it))}" data-i="${i}"><i></i></button>`).join('');
    $('#heroDots').onclick = (e) => { const b = e.target.closest('button'); if (b) showHero(+b.dataset.i); };
    showHero(0);
  }

  function showHero(i) {
    heroIdx = (i + heroList.length) % heroList.length;
    const it = heroList[heroIdx];
    const type = typeOf(it);
    document.querySelectorAll('#heroBg .slide').forEach((s, n) => s.classList.toggle('on', n === heroIdx));
    document.querySelectorAll('#heroDots button').forEach((b, n) => { b.classList.toggle('on', n === heroIdx); b.classList.toggle('done', n < heroIdx); });
    const genres = (it.genres || []).slice(0, 2);
    const inList = isListed(type, it.id);
    $('#heroContent').innerHTML = `
      <span class="eyebrow">#${heroIdx + 1} ${type === 'tv' ? 'Serial' : 'Film'} në trend</span>
      <h1>${esc(titleOf(it))}</h1>
      <div class="meta"><span class="star">${esc(it.quality || 'FULL HD')}</span><span>${esc(yearOf(it))}</span>${genres.map((g) => `<span class="chip">${esc(g)}</span>`).join('')}</div>
      <p class="ov">${esc(it.overview || 'Film i dubluar plotësisht në shqip, me cilësi Full HD.')}</p>
      <div class="actions">
        <button class="btn btn--gold" data-play="${type}:${it.id}:0">${playIco}Shiko tani</button>
        <button class="btn btn--glass" data-open="${type}:${it.id}">${infoIco}Më shumë</button>
        <button class="btn btn--glass${inList ? ' on' : ''}" data-list="${type}:${it.id}" aria-pressed="${inList}">${inList ? '✓ Në listë' : '＋ Lista ime'}</button>
      </div>`;
    clearTimeout(heroTimer);
    heroTimer = setTimeout(() => showHero(heroIdx + 1), 8000);
  }

  const playIco = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.6-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>';
  const infoIco = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg>';

  /* ================= Lista ime ================= */
  const LKEY = 'f12_list';
  const getList = () => store.get(LKEY, []);
  const isListed = (type, id) => getList().some((x) => x.media_type === type && String(x.id) === String(id));
  function toggleList(type, id) {
    let list = getList();
    const it = seen.get(type + ':' + id) || byId.get(type + ':' + id);
    if (isListed(type, id)) { list = list.filter((x) => !(x.media_type === type && String(x.id) === String(id))); toast('U hoq nga lista'); }
    else if (it) {
      list.unshift({ id: it.id, media_type: type, title: it.title, poster: it.poster, quality: it.quality, year: it.year, genres: it.genres, overview: it.overview });
      toast('✓ U shtua te Lista ime');
    }
    store.set(LKEY, list);
    document.querySelectorAll(`[data-list="${type}:${id}"]`).forEach((b) => {
      const on = isListed(type, id); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.textContent = on ? '✓ Në listë' : '＋ Lista ime';
    });
    if (route() === '/lista') render();
  }

  /* ================= Detajet ================= */
  const detail = $('#detail'), panel = $('#detailPanel');

  function fetchDetail(type, id) {
    const d = byId.get(type + ':' + id) || seen.get(type + ':' + id);
    if (!d) return null;
    const similar = ALL.filter((x) => x.id !== d.id && x.media_type === type && (x.genres || []).some((g) => (d.genres || []).includes(g))).slice(0, 12);
    return { ...d, similar };
  }

  function fmtRuntime(d) {
    if (d.media_type === 'tv') return (d.videos || []).length + ((d.videos || []).length === 1 ? ' episod' : ' episode');
    const dur = String(d.duration || '');
    return /^[\d\sminh:]+$/.test(dur) && dur.length <= 10 ? dur : '';
  }

  let lastFocus = null;
  async function openDetail(type, id) {
    lastFocus = document.activeElement;
    detail.hidden = false; lock(true);
    panel.innerHTML = `<div class="d__hero sk" style="border-radius:0"></div><div class="d__body"><div><div class="sk sk--title"></div><div class="sk sk--line"></div><div class="sk sk--line"></div></div></div>`;
    try {
      await loadData();
      const d = fetchDetail(type, id);
      if (!d) throw new Error('not found');
      const genres = d.genres || [];
      const similar = d.similar || [];
      remember(similar, type);
      const inList = isListed(type, id);
      const hb = d.poster ? `background-image:url(${esc(d.poster)})` : `background:radial-gradient(80% 90% at 70% 30%,hsla(${hue(id)},70%,45%,.55),transparent 70%),linear-gradient(140deg,hsl(${hue(id)},40%,14%),#0e0e15)`;
      const vids = d.videos || [];
      const epSection = vids.length > 1 ? `<section class="d__sec"><h3>${type === 'tv' ? 'Episodet' : 'Burimet'}</h3><div style="display:flex;flex-wrap:wrap;gap:8px">${vids.map((v, i) => `<button class="chip" data-play="${type}:${id}:${i}" style="cursor:pointer">${esc(v.label || ('Pjesa ' + (i + 1)))}</button>`).join('')}</div></section>` : '';
      panel.innerHTML = `
        <div class="d__hero" style="${hb}"><button class="icon-btn d__close" data-close aria-label="Mbyll">✕</button></div>
        <div class="d__head">
          <span class="eyebrow">${type === 'tv' ? 'Serial' : 'Film'} · Dubluar në shqip</span>
          <h2 id="dTitle">${esc(titleOf(d))}</h2>
          <div class="meta"><span class="star">${esc(d.quality || 'FULL HD')}</span><span>${esc(yearOf(d))}</span>${fmtRuntime(d) ? `<span>${fmtRuntime(d)}</span>` : ''}${genres.slice(0, 3).map((g) => `<span class="chip">${esc(g)}</span>`).join('')}</div>
          <div class="actions" style="margin-top:20px">
            <button class="btn btn--gold" data-play="${type}:${id}:0">${playIco}Shiko tani</button>
            <button class="btn btn--glass${inList ? ' on' : ''}" data-list="${type}:${id}" aria-pressed="${inList}">${inList ? '✓ Në listë' : '＋ Lista ime'}</button>
          </div>
        </div>
        <div class="d__body">
          <div>${d.otitle && d.otitle !== d.title ? `<p style="color:var(--gold2);font-style:italic">“${esc(d.otitle)}”</p>` : ''}<p>${esc(d.overview || 'Përshkrimi nuk është i disponueshëm ende.')}</p></div>
          <aside class="d__side"><dl>
            ${d.studio ? `<div><dt>Studio</dt><dd>${esc(d.studio)}</dd></div>` : ''}
            ${genres.length ? `<div><dt>Zhanret</dt><dd>${esc(genres.join(', '))}</dd></div>` : ''}
            <div><dt>Dublimi</dt><dd>Shqip</dd></div>
            <div><dt>Cilësia</dt><dd>${esc(d.quality || 'FULL HD')}</dd></div>
          </dl></aside>
        </div>
        ${epSection}
        ${similar.length ? `<section class="d__sec"><h3>Të ngjashëm</h3><div class="grid">${similar.map((s) => card(s, { type })).join('')}</div></section>` : ''}`;
      panel.querySelector('.d__close').focus();
      detail.scrollTop = 0;
    } catch (e) {
      panel.innerHTML = `<div class="d__body"><div><h2 style="font-family:var(--display);font-size:40px;margin:0">Ups!</h2><p>Detajet nuk u ngarkuan. Provo përsëri pas pak.</p><button class="btn btn--glass" data-close>Mbyll</button></div></div>`;
    }
  }

  /* ================= Playeri (filmi i vërtetë) ================= */
  const player = $('#player'), frame = $('#playerFrame');
  function isDirect(url) { return /\.(mp4|webm|mov|mkv|m3u8)(\?|#|$)/i.test(url) || /dropbox\.com|dropboxusercontent\.com/i.test(url); }
  function openPlayer(type, id, idx) {
    const d = byId.get(type + ':' + id) || seen.get(type + ':' + id);
    const vids = (d && d.videos) || [];
    if (!vids.length) { toast('Ky titull nuk ka burim video'); return; }
    const v = vids[Math.min(idx || 0, vids.length - 1)];
    player.hidden = false; lock(true);
    const label = esc(v.label || titleOf(d));
    if (isDirect(v.url)) {
      let src = v.url;
      if (/dropbox\.com/i.test(src)) src = src.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace(/[?&]dl=0/, '');
      frame.innerHTML = `<video src="${esc(src)}" controls autoplay playsinline style="position:absolute;inset:0;width:100%;height:100%;background:#000"></video>`;
    } else {
      frame.innerHTML = `<iframe src="${esc(v.url)}" title="${label}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="origin"></iframe>`;
    }
  }

  /* ================= Kërkimi ================= */
  const search = $('#search'), sInput = $('#searchInput'), sRes = $('#searchResults'), sHint = $('#searchHint');
  let sTimer = null;
  function openSearch() { lastFocus = document.activeElement; search.hidden = false; lock(true); setTimeout(() => sInput.focus(), 30); }
  sInput.addEventListener('input', () => {
    clearTimeout(sTimer);
    const q = sInput.value.trim().toLowerCase();
    if (q.length < 2) { sRes.innerHTML = ''; sHint.textContent = 'Shkruaj të paktën 2 shkronja'; return; }
    sHint.textContent = 'Po kërkoj…';
    sTimer = setTimeout(async () => {
      await loadData();
      const list = ALL.filter((x) => (x.title + ' ' + (x.otitle || '')).toLowerCase().includes(q)).slice(0, 60);
      remember(list);
      sHint.textContent = list.length ? `${list.length} rezultate për “${sInput.value.trim()}”` : `Asnjë rezultat për “${sInput.value.trim()}”`;
      sRes.innerHTML = list.map((it) => card(it)).join('');
    }, 250);
  });

  /* ================= Mbyllja / ngjarjet ================= */
  function lock(on) { document.body.classList.toggle('lock', on || !detail.hidden || !player.hidden || !search.hidden); }
  function closeTop() {
    if (!player.hidden) { player.hidden = true; frame.innerHTML = ''; }
    else if (!detail.hidden) { detail.hidden = true; panel.innerHTML = ''; }
    else if (!search.hidden) { search.hidden = true; }
    else return;
    lock(false);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-close]');
    if (c) { e.preventDefault(); closeTop(); return; }
    const cd = e.target.closest('.card[data-id]');
    if (cd) {
      e.preventDefault();
      if (!search.hidden) { search.hidden = true; }
      if (!detail.hidden) { panel.innerHTML = ''; }
      openDetail(cd.dataset.type, cd.dataset.id);
      return;
    }
    const pl = e.target.closest('[data-play]');
    if (pl) { const [t, id, i] = pl.dataset.play.split(':'); openPlayer(t, id, +i || 0); return; }
    const op = e.target.closest('[data-open]');
    if (op) { const [t, id] = op.dataset.open.split(':'); openDetail(t, id); return; }
    const ls = e.target.closest('[data-list]');
    if (ls) { const [t, id] = ls.dataset.list.split(':'); toggleList(t, id); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeTop();
    if (e.key === '/' && search.hidden && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
  });
  $('#openSearch').addEventListener('click', openSearch);

  const header = $('#header'), toTop = $('#toTop');
  addEventListener('scroll', () => {
    const y = scrollY;
    header.classList.toggle('solid', y > 40);
    toTop.classList.toggle('on', y > 900);
  }, { passive: true });
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); }

  /* ================= Rrugëzimi ================= */
  const route = () => { const r = (location.hash || '#/').slice(1) || '/'; return ['/', '/filma', '/seriale', '/lista'].includes(r) ? r : '/'; };
  const TITLES = { '/': 'Filma12HD — Kinema në shtëpinë tuaj', '/filma': 'Filma — Filma12HD', '/seriale': 'Seriale — Filma12HD', '/lista': 'Lista ime — Filma12HD' };
  let renderId = 0;

  async function render() {
    const r = route(), id = ++renderId;
    document.title = TITLES[r];
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === r));
    clearTimeout(heroTimer);
    rowsEl.innerHTML = '';
    $('#emptyList').hidden = true;

    try { await loadData(); } catch (e) { rowsEl.innerHTML = '<p style="color:var(--muted);padding:24px var(--pad)">Katalogu nuk u ngarkua. Kontrollo lidhjen dhe rifresko faqen.</p>'; introDone(); return; }
    if (id !== renderId) return;

    if (r === '/lista') {
      document.body.classList.add('view-sub'); $('#hero').hidden = true;
      const list = getList().map((x) => byId.get(x.media_type + ':' + x.id) || x);
      remember(list);
      introDone();
      if (!list.length) { $('#emptyList').hidden = false; return; }
      const sec = document.createElement('section');
      sec.className = 'row in';
      sec.innerHTML = `<div class="row__head"><h2>Lista ime<small>${list.length} tituj</small></h2></div><div class="grid" style="padding:14px var(--pad)">${list.map((it) => card(it)).join('')}</div>`;
      rowsEl.appendChild(sec);
      return;
    }

    document.body.classList.remove('view-sub'); $('#hero').hidden = false;
    const rows = buildRows(r);
    const shells = rows.map((row, i) => { const s = rowShell(row, i); rowsEl.appendChild(s); return s; });
    const first = await fillRow(shells[0], rows[0]);
    if (id !== renderId) return;
    introDone();
    const heroRow = rows.findIndex((x) => x.hero);
    if (!first.length) { $('#hero').hidden = true; document.body.classList.add('view-sub'); }
    else if (heroRow === 0) setHero(first.map((it) => ({ ...it, media_type: typeOf(it, rows[0].type) })));
    else if (heroRow > 0) { const hl = await fillRow(shells[heroRow], rows[heroRow]); if (hl.length) setHero(hl); }
    rows.slice(1).forEach((row, i) => { if (i + 1 !== heroRow) fillRow(shells[i + 1], row); });
    if (r === '/' || r === '/filma' || r === '/seriale') scrollTo({ top: 0 });
  }
  addEventListener('hashchange', render);

  /* ================= Hyrja ================= */
  let introDone = () => {};
  function intro() {
    const el = $('#intro'), bar = $('#introBar');
    let played = false;
    try { played = sessionStorage.getItem('f12_intro') === '1'; sessionStorage.setItem('f12_intro', '1'); } catch (e) { /* pa ruajtje */ }
    const end = () => { el.classList.add('gone'); document.body.classList.remove('is-intro'); };
    if (played || matchMedia('(prefers-reduced-motion: reduce)').matches) { end(); return; }
    const t0 = performance.now();
    let closed = false;
    setTimeout(() => { bar.style.width = '35%'; }, 950);
    setTimeout(() => { bar.style.width = '62%'; }, 1300);
    const close = () => {
      if (closed) return; closed = true;
      const wait = Math.max(0, 1900 - (performance.now() - t0));
      setTimeout(() => {
        bar.style.width = '100%';
        setTimeout(() => { el.classList.add('out'); document.body.classList.remove('is-intro'); setTimeout(end, 1050); }, 420);
      }, wait);
    };
    introDone = close;
    setTimeout(close, 4500); // mos e mbaj përdoruesin në pritje
  }

  $('#year').textContent = new Date().getFullYear();
  intro();
  render();
})();
