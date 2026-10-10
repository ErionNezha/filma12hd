/* Filma12HD — Versioni Netflix · logjika e ruajtur, DOM i ri
   Krijuar nga Erion Nezha — © 2026 All rights reserved */
(function(){
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let MOVIES=[], bbIdx=0, bbTimer=null, activeGenre='Të gjitha';

/* ---------- helpers ---------- */
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fullTitle=m=>m.title_orig?`${m.title_al} (${m.title_orig})`:m.title_al;
function goldTitle(m){
  const t=esc(m.title_al), w=t.split(' ');
  if(w.length>1){const l=w.pop();return w.join(' ')+' <span class="gold">'+l+'</span>';}
  return '<span class="gold">'+t+'</span>';
}
function matchPct(m){
  // përqindje "përputhjeje" deterministe nga id
  let h=0;const s=String(m.id);
  for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;
  return 82+(h%16);
}

/* ---------- karta Netflix ---------- */
function cardHTML(m,prog){
  const pct=matchPct(m);
  return `<div class="c" tabindex="0" data-id="${m.id}" role="link" aria-label="${esc(fullTitle(m))}">
    <div class="th">
      <img loading="lazy" decoding="async" src="${esc(m.poster)}" alt="" onerror="this.style.opacity=0">
      <div class="shade"></div>
      <span class="qb">${esc(m.quality||'HD')}</span>
      ${m.type==='serial'?'<span class="sb">SERIAL</span>':''}
      <div class="tt">${esc(m.title_al)}</div>
      ${prog!=null?`<div class="pr"><u style="width:${prog}%"></u></div>`:''}
    </div>
    <div class="c-info">
      <div class="c-ic"><span>▶</span><span data-fav="${m.id}">${isFav(m.id)?'✓':'＋'}</span></div>
      <b>${pct}% përputhje</b><em>${m.year||''}</em>${m.type==='serial'?'SERIAL':(m.duration||'')}
      <div class="g">${esc((m.genres||[]).slice(0,3).join(' · '))}</div>
    </div>
  </div>`;
}
function top10HTML(m,i){
  return `<div class="tn" tabindex="0" data-id="${m.id}" role="link" aria-label="${esc(fullTitle(m))}">
    <b>${i+1}</b>
    <div class="th"><img loading="lazy" decoding="async" src="${esc(m.poster)}" alt="${esc(fullTitle(m))}" onerror="this.style.opacity=0">
    <div class="shade"></div><div class="tt">${esc(m.title_al)}</div></div>
  </div>`;
}
function rowHTML(title,sub,items,fn,rowId){
  return `<section class="sec"${rowId?` id="${rowId}"`:''}>
    <div class="sec-head"><h2>${title}</h2>${sub?`<small>${sub}</small>`:''}</div>
    <div class="sl"><button class="ar l" aria-label="Mbrapa">‹</button>
    <div class="row">${items.map(fn).join('')}</div>
    <button class="ar r" aria-label="Para">›</button></div>
  </section>`;
}

/* ---------- favorites (Lista ime) ---------- */
function getFav(){try{return JSON.parse(localStorage.getItem('f12h_fav')||'[]')}catch(e){return[]}}
function isFav(id){return getFav().includes(id)}
function toggleFav(id){
  let f=getFav();
  f=f.includes(id)?f.filter(x=>x!==id):[...f,id];
  try{localStorage.setItem('f12h_fav',JSON.stringify(f))}catch(e){}
  $$(`[data-fav="${id}"]`).forEach(s=>s.textContent=f.includes(id)?'✓':'＋');
  buildDynRows();
}

/* ---------- billboard ---------- */
function featured(){return MOVIES.filter(m=>m.type==='film').slice(0,6)}
function buildBillboard(){
  const f=featured();if(!f.length)return;
  $('#bbInd').innerHTML=f.map((_,i)=>`<button data-i="${i}" aria-label="Titulli ${i+1}"><u></u></button>`).join('');
  $('#bbInd').addEventListener('click',e=>{
    const b=e.target.closest('button');if(b)setBb(+b.dataset.i,true);
  });
  setBb(0);
  bbTimer=setInterval(()=>setBb((bbIdx+1)%f.length),7000);
}
function setBb(i,manual){
  const f=featured(),m=f[i];if(!m)return;bbIdx=i;
  if(manual&&bbTimer){clearInterval(bbTimer);bbTimer=setInterval(()=>setBb((bbIdx+1)%f.length),7000);}
  $('#bbImg').src=m.poster;$('#bbImg').alt=fullTitle(m);
  $('#bbKick').textContent='Tani po luhet';
  $('#bbTitle').innerHTML=goldTitle(m);
  $('#bbOrig').textContent=m.title_orig||'';
  const meta=[`${matchPct(m)}% përputhje`];
  if(m.year)meta.push(m.year);
  if(m.duration)meta.push(m.duration);
  meta.push('Dublim në shqip','Full HD');
  $('#bbMeta').innerHTML=meta.map((x,j)=>j===0?`<span>${esc(x)}</span>`:`<span class="pill">${esc(x)}</span>`).join('');
  $('#bbDesc').textContent=m.desc||'Film i dubluar plotësisht në shqip, me cilësi Full HD.';
  $('#bbPlay').href='film.html?id='+m.id;
  $('#bbMore').href='film.html?id='+m.id;
  $$('#bbInd button').forEach((b,j)=>{
    b.classList.toggle('act',j===i);
    b.classList.toggle('done',j<i);
  });
}

/* ---------- rreshtat ---------- */
function buildTop10(){
  const seed=new Date().toISOString().slice(0,10);
  let h=0;for(const c of seed)h=(h*31+c.charCodeAt(0))>>>0;
  const pool=MOVIES.filter(m=>m.type==='film');
  const picks=[],used=new Set();let s=h;
  while(picks.length<10&&picks.length<pool.length){
    s=(s*1103515245+12345)>>>0;
    const i=s%pool.length;
    if(!used.has(i)){used.add(i);picks.push(pool[i]);}
  }
  return rowHTML('Top 10 <em>sot</em>','më të shikuarat',picks,top10HTML);
}
function getContinue(){
  let w=[];try{w=JSON.parse(localStorage.getItem('f12h_watch')||'[]')}catch(e){}
  return w.map(x=>MOVIES.find(m=>m.id===x.id)).filter(Boolean).slice(0,10);
}
function buildDynRows(){
  const host=$('#dynRows');if(!host)return;
  const cont=getContinue();
  const favs=getFav().map(id=>MOVIES.find(m=>m.id===id)).filter(Boolean);
  let h='';
  if(cont.length)h+=rowHTML('Vazhdo <em>të shikosh</em>','',cont,m=>cardHTML(m,35+((m.id.charCodeAt(0)*7)%55)));
  if(favs.length)h+=rowHTML('Lista <em>ime</em>','',favs,m=>cardHTML(m));
  host.innerHTML=h;
  bindCards(host);initReveal();
}
function buildRows(){
  const films=MOVIES.filter(m=>m.type==='film');
  const sers=MOVIES.filter(m=>m.type==='serial');
  const genres={};
  films.forEach(m=>(m.genres||[]).forEach(g=>{genres[g]=genres[g]||[];genres[g].push(m);}));
  const genreRows=Object.keys(genres).sort((a,b)=>genres[b].length-genres[a].length).slice(0,5)
    .map(g=>rowHTML(`${esc(g)}`,films.length+' filma',genres[g].slice(0,20),m=>cardHTML(m))).join('');
  $('#rows').innerHTML='<div id="dynRows"></div>'+
    buildTop10()+
    rowHTML('Filma <em>të dubluar</em>',films.length+' tituj',films.slice(0,20),m=>cardHTML(m),'rowFilma')+
    rowHTML('Seriale <em>në shqip</em>',sers.length+' seriale',sers.slice(0,20),m=>cardHTML(m),'rowSeriale')+
    genreRows;
  buildDynRows();
  bindCards($('#rows'));initReveal();
}

/* ---------- browse (grid i filtruar) ---------- */
function buildChips(){
  const set=new Set();MOVIES.forEach(m=>(m.genres||[]).forEach(g=>set.add(g)));
  const genres=['Të gjitha','Seriale',...[...set].sort()];
  $('#chips').innerHTML=genres.map(g=>`<button class="chip${g===activeGenre?' on':''}" data-g="${esc(g)}">${esc(g)}</button>`).join('');
  $('#chips').addEventListener('click',e=>{
    const b=e.target.closest('.chip');if(!b)return;
    activeGenre=b.dataset.g;
    $$('#chips .chip').forEach(c=>c.classList.toggle('on',c===b));
    renderBrowse();
  });
}
function matches(m,q){
  const hay=(m.title_al+' '+(m.title_orig||'')+' '+(m.genres||[]).join(' ')).toLowerCase();
  return hay.includes(q);
}
function showRows(){$('#rows').hidden=false;$('#browse').hidden=true;scrollTo({top:0,behavior:'smooth'});}
function showBrowse(){
  $('#rows').hidden=true;$('#browse').hidden=false;
  renderBrowse();
  $('#browse').scrollIntoView({behavior:'smooth'});
}
function renderBrowse(){
  const serialMode=activeGenre==='Seriale';
  const list=MOVIES
    .filter(m=>serialMode?m.type==='serial':m.type==='film')
    .filter(m=>serialMode||activeGenre==='Të gjitha'||(m.genres||[]).includes(activeGenre));
  $('#browseTitle').innerHTML=serialMode?'SERIALE <em>NË SHQIP</em>':'FILMA <em>TË DUBLUAR</em>';
  $('#browseCount').textContent=list.length+(serialMode?' seriale':' tituj');
  $('#browseGrid').innerHTML=list.map(m=>cardHTML(m)).join('');
  $('#noRes').hidden=list.length>0;
  bindCards($('#browseGrid'));initReveal();
}

/* ---------- lidhja e kartave ---------- */
function bindCards(root){
  if(!root)return;
  root.querySelectorAll('.ar').forEach(a=>{
    a.onclick=()=>{
      const r=a.parentNode.querySelector('.row');
      r.scrollBy({left:(a.classList.contains('l')?-1:1)*r.clientWidth*.85,behavior:'smooth'});
    };
  });
  root.querySelectorAll('.c,.tn').forEach(c=>{
    if(c.dataset.bound)return;c.dataset.bound='1';
    const go=()=>location.href='film.html?id='+c.dataset.id;
    c.addEventListener('click',e=>{
      const f=e.target.closest('[data-fav]');
      if(f){e.stopPropagation();toggleFav(c.dataset.id);return;}
      go();
    });
    c.addEventListener('keydown',e=>{if(e.key==='Enter')go();});
  });
}

/* ---------- search overlay ---------- */
const so=$('#so'),si=$('#si'),soGrid=$('#soGrid');
function openSearch(){so.classList.add('on');document.body.style.overflow='hidden';setTimeout(()=>si.focus(),60);renderSearch('');}
function closeSearch(){so.classList.remove('on');document.body.style.overflow='';si.value='';}
function renderSearch(q){
  q=q.trim().toLowerCase();
  const res=(q.length<2?MOVIES.slice(0,18):MOVIES.filter(m=>matches(m,q)).slice(0,30));
  soGrid.innerHTML=res.length?res.map(m=>cardHTML(m)).join(''):
    '<div class="so-empty">Nuk u gjet asgjë. Provo një titull tjetër.</div>';
  bindCards(soGrid);initReveal();
}
$('#sb').onclick=openSearch;$('#sb2').onclick=openSearch;
$('#sx').onclick=closeSearch;
si.addEventListener('input',()=>renderSearch(si.value));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&so.classList.contains('on'))closeSearch();});

/* ---------- nav links ---------- */
$$('[data-nav]').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    const mode=a.dataset.nav;
    if(mode==='home'){activeGenre='Të gjitha';buildChipsActive();showRows();return;}
    activeGenre=mode==='seriale'?'Seriale':'Të gjitha';
    buildChipsActive();
    showBrowse();
  });
});
function buildChipsActive(){
  $$('#chips .chip').forEach(c=>c.classList.toggle('on',c.dataset.g===activeGenre));
}

/* ---------- reveal ---------- */
let io=null;
function initReveal(){
  if(!io)io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.06});
  $$('.rv:not(.in),.sec:not(.in)').forEach(el=>io.observe(el));
}

/* ---------- data ---------- */
fetch('data/movies.json').then(r=>r.json()).then(data=>{
  MOVIES=data;
  buildBillboard();buildRows();buildChips();
  initReveal();initCursor();hideLoader();
}).catch(()=>{hideLoader();});

/* ---------- custom cursor (ruajtur) ---------- */
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
    document.body.classList.toggle('cur-hover',!!e.target.closest('a,button,.c,.tn,.chip,.ep'));
  });
}

/* ---------- loader ---------- */
(function(){
  var L=document.getElementById('loader');
  if(!L)return;
  var pct=document.getElementById('ldPct'),tc=document.getElementById('ldTc'),msg=document.getElementById('ldMsg');
  var h='',i;
  for(i=0;i<=50;i++)h+='<span'+(i%10===0?' class="m"':'')+'></span>';
  document.getElementById('ldTicks').innerHTML=h;
  var d='';
  for(i=0;i<16;i++)d+='<i style="left:'+(Math.random()*100).toFixed(1)+'%;--dx:'+((Math.random()*80-40)|0)+'px;animation-delay:-'+(Math.random()*7).toFixed(1)+'s;animation-duration:'+(5+Math.random()*5).toFixed(1)+'s"></i>';
  document.getElementById('ldDust').innerHTML=d;
  var lines=document.querySelectorAll('#ldLine span'),li=0;
  var rot=setInterval(function(){
    lines[li].classList.remove('on');li=(li+1)%lines.length;lines[li].classList.add('on');
  },1100);
  var DURATION=4200,start=null,finished=false;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
  function pad(n){return n<10?'0'+n:''+n}
  function frame(ts){
    if(start===null)start=ts;
    var t=Math.min((ts-start)/DURATION,1),p=ease(t);
    L.style.setProperty('--p',p.toFixed(4));
    pct.textContent=Math.round(p*100)+'%';
    var f=Math.round(p*24*24);
    tc.textContent='00:'+pad(Math.floor(f/24))+':'+pad(f%24);
    if(t<1){requestAnimationFrame(frame)}else{finish()}
  }
  function finish(){
    if(finished)return;finished=true;clearInterval(rot);
    msg.textContent='Në fokus';
    L.classList.add('flash');
    setTimeout(function(){
      L.classList.add('done');
      document.dispatchEvent(new CustomEvent('loader:done'));
      setTimeout(function(){if(L.parentNode)L.parentNode.removeChild(L)},1000);
    },800);
  }
  if(reduce){L.style.setProperty('--p',1);pct.textContent='100%';setTimeout(finish,600)}
  else requestAnimationFrame(frame);
})();
function hideLoader(){var L=document.getElementById('loader');if(L)setTimeout(function(){L.classList.add('done')},6000);}

/* ---------- nav / toTop / dust ---------- */
const nav=$('#nv'),toTop=$('#toTop');
addEventListener('scroll',()=>{
  nav.classList.toggle('s',scrollY>40);
  toTop.classList.toggle('show',scrollY>600);
},{passive:true});
toTop.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));

const spot=$('#spot');
addEventListener('pointermove',e=>{
  if(spot){spot.style.left=e.clientX+'px';spot.style.top=e.clientY+'px';}
},{passive:true});

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
if(cv){dustInit();requestAnimationFrame(dustTick);addEventListener('resize',dustInit);}
})();
