/* Filma12HD — film detail · Krijuar nga Erion Nezha */
(function(){
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const id=new URLSearchParams(location.search).get('id');

fetch('data/movies.json').then(r=>r.json()).then(all=>{
  const m=all.find(x=>x.id===id)||all[0];
  if(!m){location.href='index.html';return;}
  // ruaj te "vazhdo shikimin"
  try{
    let w=JSON.parse(localStorage.getItem('f12h_watch')||'[]');
    w=[{id:m.id,ts:Date.now()},...w.filter(x=>x.id!==m.id)].slice(0,12);
    localStorage.setItem('f12h_watch',JSON.stringify(w));
  }catch(e){}
  render(m,all);
  initFx();
}).catch(()=>location.href='index.html');

function fullTitle(m){return m.title_orig?`${m.title_al} (${m.title_orig})`:m.title_al;}
function goldTitle(m){
  const t=esc(m.title_al),w=t.split(' ');
  if(w.length>1){const l=w.pop();return w.join(' ')+' <span class="gold">'+l+'</span>';}
  return '<span class="gold">'+t+'</span>';
}
function epName(url){
  try{
    const p=decodeURIComponent(url.split('/').pop());
    const em=p.match(/S\d{2}E\d{2}\s*-\s*(.+?)\.(mp4|mkv)/i);
    if(em)return em[1].replace(/_/g,' ').trim();
    return p.replace(/\.(mp4|mkv)$/i,'').replace(/_/g,' ').slice(0,42);
  }catch(e){return 'Episodi';}
}

function render(m,all){
  document.title=fullTitle(m)+' — Filma12HD';
  $('#pgDesc').setAttribute('content',(m.desc||'').slice(0,150));
  $('#heroImg').src=m.poster;$('#heroImg').alt=fullTitle(m);
  $('#fTitle').innerHTML=goldTitle(m);
  $('#fOrig').textContent=m.title_orig||'';
  let meta=`<span class="meta-pill gold">${esc(m.quality)}</span><span class="meta-pill">🎙 ${esc(m.dub)}</span>`;
  if(m.year)meta+=`<span class="meta-pill">${esc(m.year)}</span>`;
  if(m.duration)meta+=`<span class="meta-pill">${esc(m.duration)}</span>`;
  (m.genres||[]).forEach(g=>meta+=`<span class="meta-pill ghost">${esc(g)}</span>`);
  $('#fMeta').innerHTML=meta;

  $('#coverImg').src=m.poster;
  $('#iPoster').src=m.poster;$('#iPoster').alt=fullTitle(m);
  $('#iMeta').innerHTML=meta;
  $('#iDesc').innerHTML='<div class="desc-head"><span class="desc-line"></span><span class="desc-title">PËRSHKRIMI</span><span class="desc-line"></span></div><p>'+esc(m.desc||'Përshkrim së shpejti.')+'</p>';
  const facts=[];
  if(m.year)facts.push(['Viti',m.year]);
  if(m.duration)facts.push(['Kohëzgjatja',m.duration]);
  if(m.studio)facts.push(['Studio',m.studio]);
  facts.push(['Dublimi','Shqip']);
  facts.push(['Cilësia',m.quality]);
  facts.push(['Zhanri',(m.genres||[]).join(', ')||'—']);
  $('#facts').innerHTML=facts.map(f=>`<div class="fact"><div class="k">${esc(f[0])}</div><div class="v">${esc(f[1])}</div></div>`).join('');

  // episodes — serialet tregojne GJITHMONE seksionin e episodeve
  const eps=$('#eps');
  const vurl=v=>typeof v==='string'?v:(v&&v.url||'');
  const vlabel=v=>typeof v==='string'?'Shiko':(v&&v.label||'Shiko');
  const isSerial=m.type==='serial';
  const vids=(m.videos||[]).filter(v=>vurl(v));
  if(vids.length>1||isSerial){
    eps.hidden=false;
    let btns;
    if(vids.length>1){
      btns=vids.map((v,i)=>`<button class="ep${i===0?' on':''}" data-v="${esc(vurl(v))}"><span class="n">${String(i+1).padStart(2,'0')}</span><span class="t">${esc(vlabel(v))}</span></button>`).join('');
    }else if(vids.length===1){
      btns=`<button class="ep on" data-v="${esc(vurl(vids[0]))}"><span class="n">▶</span><span class="t">Seriali i plotë — kliko për të parë</span></button>`;
    }else{
      btns=`<div class="ep-empty">Episodet po shtohen së shpejti.</div>`;
    }
    eps.innerHTML=(isSerial?'<div class="eps-head"><span class="t">EPISODET</span><div class="l"></div></div>':'')+btns;
    eps.addEventListener('click',e=>{
      const b=e.target.closest('.ep');if(!b)return;
      $$('#eps .ep').forEach(x=>x.classList.remove('on'));b.classList.add('on');
      loadVideo(b.dataset.v,true);
    });
  }
  // player open
  $('#stageCover').addEventListener('click',()=>{
    $('#cinema').classList.add('open');
    if(vids.length)loadVideo(vurl(vids[0]),false);
  });

  // related
  const rel=all.filter(x=>x.id!==m.id&&(x.genres||[]).some(g=>(m.genres||[]).includes(g))).slice(0,6);
  const fill=rel.length?rel:all.filter(x=>x.id!==m.id).slice(0,6);
  $('#relGrid').innerHTML=fill.map((r,i)=>`
    <div class="c" data-id="${r.id}" tabindex="0" role="link" aria-label="${esc(fullTitle(r))}">
      <div class="th">
        <img loading="lazy" src="${esc(r.poster)}" alt="${esc(fullTitle(r))}" onerror="this.style.opacity=0">
        <div class="shade"></div>
        <span class="qb">${esc(r.quality)}</span>
        <div class="tt">${esc(r.title_al)}</div>
      </div>
    </div>`).join('');
  $$('#relGrid .c').forEach(c=>{
    const go=()=>location.href='film.html?id='+c.dataset.id;
    c.addEventListener('click',go);
    c.addEventListener('keydown',e=>{if(e.key==='Enter')go();});
  });
}

function loadVideo(url,autoplay){
  const slot=$('#playerSlot');
  const isFile=/\.(mp4|mkv)(\?|#|$)/i.test(url);
  if(isFile){
    slot.innerHTML=`<video controls ${autoplay?'autoplay':''} playsinline preload="metadata" src="${esc(url)}"></video>`;
  }else{
    slot.innerHTML=`<iframe src="${esc(url)}" allowfullscreen allow="autoplay; fullscreen; encrypted-media" title="Player"></iframe>`;
  }
}

function initFx(){
  const nav=$('#nv'),toTop=$('#toTop');
  addEventListener('scroll',()=>{
    nav.classList.toggle('s',scrollY>40);
    toTop.classList.toggle('show',scrollY>600);
  },{passive:true});
  toTop.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
  const spot=$('#spot');
  addEventListener('pointermove',e=>{spot.style.left=e.clientX+'px';spot.style.top=e.clientY+'px';},{passive:true});
  const cv=$('#dust'),ctx=cv.getContext('2d');let P=[];
  function init(){cv.width=innerWidth;cv.height=innerHeight;P=[];
    for(let i=0;i<50;i++)P.push({x:Math.random()*cv.width,y:Math.random()*cv.height,r:Math.random()*2.2+.6,s:Math.random()*.35+.08,o:Math.random()*.5+.15,ph:Math.random()*6.28});}
  (function tick(t){
    ctx.clearRect(0,0,cv.width,cv.height);
    for(const p of P){p.y-=p.s;if(p.y<-6){p.y=cv.height+6;p.x=Math.random()*cv.width;}
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);
      ctx.fillStyle=`rgba(232,182,76,${(p.o*(0.6+0.4*Math.sin(t/700+p.ph))).toFixed(3)})`;ctx.fill();}
    requestAnimationFrame(tick);
  })(0);
  init();addEventListener('resize',init);
}
})();
