/* Filma12HD — home logic · Krijuar nga Erion Nezha */
(function(){
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let MOVIES=[], heroIdx=0, heroTimer=null, activeGenre='Të gjitha';

/* ---------- helpers ---------- */
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fullTitle=m=>m.title_orig?`${m.title_al} (${m.title_orig})`:m.title_al;
function goldTitle(m){
  // highlight last word(s) in gold for style
  const t=esc(m.title_al), w=t.split(' ');
  if(w.length>1){const l=w.pop();return w.join(' ')+' <span class="gold">'+l+'</span>';}
  return '<span class="gold">'+t+'</span>';
}
function metaPills(m){
  let h='';
  if(m.quality)h+=`<span class="meta-pill gold">${esc(m.quality)}</span>`;
  h+=`<span class="meta-pill">🎙 ${esc(m.dub)}</span>`;
  if(m.year)h+=`<span class="meta-pill">${esc(m.year)}</span>`;
  if(m.duration)h+=`<span class="meta-pill">${esc(m.duration)}</span>`;
  (m.genres||[]).slice(0,3).forEach(g=>{h+=`<span class="meta-pill ghost">${esc(g)}</span>`;});
  return h;
}
function cardHTML(m,i){
  return `<article class="card rv" data-id="${m.id}" style="transition-delay:${(i%12)*40}ms" tabindex="0" role="link" aria-label="${esc(fullTitle(m))}">
    <div class="card-poster">
      <img loading="lazy" src="${esc(m.poster)}" alt="${esc(fullTitle(m))}" onerror="this.style.opacity=0">
      <div class="card-sheen"></div>
      <span class="q-badge">${esc(m.quality)}</span>
      ${m.type==='serial'?'<span class="type-badge">SERIAL</span>':''}
      ${m.year?`<span class="y-badge">${esc(m.year)}</span>`:''}
      <div class="card-play"><span class="pp"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></div>
    </div>
    <div class="card-body">
      <div class="card-title">${esc(m.title_al)}</div>
      <div class="card-sub">${m.title_orig?esc(m.title_orig)+' · ':''}${esc(m.year||'')}</div>
    </div>
  </article>`;
}

/* ---------- top 10 (ndryshon çdo ditë) ---------- */
function buildTop10(){
  const seed=new Date().toISOString().slice(0,10);
  let h=0;for(const c of seed)h=(h*31+c.charCodeAt(0))>>>0;
  const pool=MOVIES.filter(m=>m.type==='film');
  const picks=[];const used=new Set();
  let s=h;
  while(picks.length<10&&picks.length<pool.length){
    s=(s*1103515245+12345)>>>0;
    const i=s%pool.length;
    if(!used.has(i)){used.add(i);picks.push(pool[i]);}
  }
  $('#top10Row').innerHTML=picks.map((m,i)=>`
    <div class="top10-item rv" data-id="${m.id}" tabindex="0" role="link" aria-label="${esc(fullTitle(m))}">
      <div class="top10-num">${i+1}</div>
      <div class="top10-card"><img loading="lazy" decoding="async" src="${esc(m.poster)}" alt="${esc(fullTitle(m))}" onerror="this.style.opacity=0"></div>
    </div>`).join('');
  bindCards($('#top10Row'));initReveal();
}

/* ---------- vazhdo shikimin ---------- */
function buildContinue(){
  let w=[];
  try{w=JSON.parse(localStorage.getItem('f12h_watch')||'[]');}catch(e){}
  const items=w.map(x=>MOVIES.find(m=>m.id===x.id)).filter(Boolean).slice(0,6);
  if(!items.length)return;
  $('#continue').hidden=false;
  $('#continueGrid').innerHTML=items.map((m,i)=>cardHTML(m,i)).join('');
  bindCards($('#continueGrid'));initReveal();
}

/* ---------- custom cursor ---------- */
function initCursor(){
  if(!matchMedia('(pointer:fine)').matches)return;
  const dot=$('#cursorDot'),ring=$('#cursorRing');
  let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
  addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;
    dot.style.left=mx+'px';dot.style.top=my+'px';},{passive:true});
  (function loop(){
    rx+=(mx-rx)*.16;ry+=(my-ry)*.16;
    ring.style.left=rx+'px';ring.style.top=ry+'px';
    requestAnimationFrame(loop);
  })();
  document.addEventListener('pointerover',e=>{
    document.body.classList.toggle('cur-hover',!!e.target.closest('a,button,.card,.chip,.top10-item,.ep'));
  });
}

/* ---------- data ---------- */
fetch('data/movies.json').then(r=>r.json()).then(data=>{
  MOVIES=data;
  buildHero(); buildMarquee(); buildChips(); renderGrids(); buildTop10(); buildContinue();
  initReveal(); initCursor(); hideLoader();
}).catch(()=>{hideLoader();});

/* ---------- hero ---------- */
function featured(){return MOVIES.filter(m=>m.type==='film').slice(0,6);}
function buildHero(){
  const f=featured(); if(!f.length)return;
  const dots=$('#heroDots'); dots.innerHTML=f.map((_,i)=>`<button data-i="${i}" aria-label="Salla ${i+1}"></button>`).join('');
  dots.addEventListener('click',e=>{const b=e.target.closest('button');if(b)setHero(+b.dataset.i,true);});
  setHero(0);
  heroTimer=setInterval(()=>setHero((heroIdx+1)%f.length),7000);
}
function setHero(i,manual){
  const f=featured(), m=f[i]; heroIdx=i;
  if(manual&&heroTimer){clearInterval(heroTimer);heroTimer=setInterval(()=>setHero((heroIdx+1)%f.length),7000);}
  const hero=$('#hero'); hero.classList.add('changing');
  setTimeout(()=>{
    $('#heroImg').src=m.poster; $('#heroImg').alt=fullTitle(m);
    $('#heroKick').textContent='🎬 Tani po luhet';
    $('#heroTitle').innerHTML=goldTitle(m);
    $('#heroOrig').textContent=m.title_orig||'';
    $('#heroMeta').innerHTML=metaPills(m);
    $('#heroDesc').textContent=m.desc||'';
    $('#heroPlay').href='film.html?id='+m.id;
    $('#heroMore').href='film.html?id='+m.id;
    hero.classList.remove('changing');
  },380);
  $$('#heroDots button').forEach((b,j)=>b.classList.toggle('on',j===i));
}

/* ---------- marquee ---------- */
function buildMarquee(){
  const items=['TANI PO LUHET','FILMA TË DUBLUAR NË SHQIP','CILËSI FULL HD','PA REKLAMA BEZDITËSE','KINEMA NË SHTËPINË TUAJ'];
  const half=items.map(t=>`<span>${t}</span>`).join('');
  $('#mq').innerHTML=half+half;
}

/* ---------- chips + grids ---------- */
function buildChips(){
  const set=new Set(); MOVIES.forEach(m=>(m.genres||[]).forEach(g=>set.add(g)));
  const genres=['Të gjitha',...[...set].sort()];
  $('#chips').innerHTML=genres.map(g=>`<button class="chip${g===activeGenre?' on':''}" data-g="${esc(g)}">${esc(g)}</button>`).join('');
  $('#chips').addEventListener('click',e=>{
    const b=e.target.closest('.chip'); if(!b)return;
    activeGenre=b.dataset.g;
    $$('#chips .chip').forEach(c=>c.classList.toggle('on',c===b));
    renderFilms();
  });
}
function matches(m,q){
  const hay=(m.title_al+' '+(m.title_orig||'')+' '+(m.genres||[]).join(' ')).toLowerCase();
  return hay.includes(q);
}
function renderFilms(){
  const q=($('#search').value||'').trim().toLowerCase();
  const films=MOVIES.filter(m=>m.type==='film')
    .filter(m=>activeGenre==='Të gjitha'||(m.genres||[]).includes(activeGenre))
    .filter(m=>!q||matches(m,q));
  $('#filmCount').textContent=films.length+' tituj';
  $('#filmGrid').innerHTML=films.map(cardHTML).join('');
  $('#noRes').hidden=films.length>0;
  bindCards($('#filmGrid')); initReveal();
}
function renderGrids(){
  renderFilms();
  const sers=MOVIES.filter(m=>m.type==='serial');
  $('#serCount').textContent=sers.length+' seriale';
  $('#serGrid').innerHTML=sers.map(cardHTML).join('');
  bindCards($('#serGrid')); initReveal();
}
function bindCards(root){
  root.querySelectorAll('.card,.top10-item').forEach(c=>{
    const go=()=>location.href='film.html?id='+c.dataset.id;
    c.addEventListener('click',go);
    c.addEventListener('keydown',e=>{if(e.key==='Enter')go();});
    // 3D tilt
    c.addEventListener('mousemove',e=>{
      const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      c.style.transform=`translateY(-8px) scale(1.02) perspective(800px) rotateY(${x*10}deg) rotateX(${-y*10}deg)`;
    });
    c.addEventListener('mouseleave',()=>{c.style.transform='';});
  });
}
$('#search').addEventListener('input',renderFilms);

/* ---------- reveal ---------- */
let io=null;
function initReveal(){
  if(!io)io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.08});
  $$('.rv:not(.in)').forEach(el=>io.observe(el));
}

/* ---------- loader: bileta ---------- */
setTimeout(()=>$('#loader').classList.add('done'),1700);
function hideLoader(){setTimeout(()=>$('#loader').classList.add('done'),2500);}

/* ---------- nav / toTop / spot / dust ---------- */
const nav=$('#nav'),toTop=$('#toTop');
addEventListener('scroll',()=>{
  nav.classList.toggle('scrolled',scrollY>40);
  toTop.classList.toggle('show',scrollY>600);
},{passive:true});
toTop.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));

const spot=$('#spot'),hspot=$('#heroSpot');
addEventListener('pointermove',e=>{
  spot.style.left=e.clientX+'px';spot.style.top=e.clientY+'px';
  if(hspot){hspot.style.left=(e.clientX/innerWidth*100)+'%';hspot.style.top=(e.clientY/innerHeight*100)+'%';}
},{passive:true});

/* gold dust */
const cv=$('#dust'),ctx=cv.getContext('2d');let P=[];
function dustInit(){
  cv.width=innerWidth;cv.height=innerHeight;P=[];
  const nP=Math.min(70,innerWidth/18);
  for(let i=0;i<nP;i++)P.push({x:Math.random()*cv.width,y:Math.random()*cv.height,
    r:Math.random()*2.2+.6,s:Math.random()*.35+.08,o:Math.random()*.5+.15,ph:Math.random()*6.28});
}
function dustTick(t){
  ctx.clearRect(0,0,cv.width,cv.height);
  for(const p of P){
    p.y-=p.s;p.x+=Math.sin(t/1600+p.ph)*.18;
    if(p.y<-6){p.y=cv.height+6;p.x=Math.random()*cv.width;}
    const tw=p.o*(0.6+0.4*Math.sin(t/700+p.ph));
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);
    ctx.fillStyle=`rgba(232,182,76,${tw.toFixed(3)})`;ctx.fill();
  }
  requestAnimationFrame(dustTick);
}
dustInit();requestAnimationFrame(dustTick);
addEventListener('resize',dustInit);
})();
