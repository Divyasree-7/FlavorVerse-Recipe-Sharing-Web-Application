/* FlavorVerse v3 · app.js */
'use strict';

/* ── State ── */
const FV = {
  lang:   localStorage.getItem('fv_lang')    || 'en',
  theme:  localStorage.getItem('fv_theme')   || 'dark',
  likes:  JSON.parse(localStorage.getItem('fv_likes')   || '[]'),
  saves:  JSON.parse(localStorage.getItem('fv_saves')   || '[]'),
  groc:   JSON.parse(localStorage.getItem('fv_groc')    || '[]'),
  follows:JSON.parse(localStorage.getItem('fv_follows') || '[]'),
  save() {
    localStorage.setItem('fv_likes',   JSON.stringify(this.likes));
    localStorage.setItem('fv_saves',   JSON.stringify(this.saves));
    localStorage.setItem('fv_groc',    JSON.stringify(this.groc));
    localStorage.setItem('fv_follows', JSON.stringify(this.follows));
  }
};

/* ── i18n ── */
function t(k){ return DB.i18n[FV.lang]?.[k] || DB.i18n.en[k] || k }
function applyLang(lang){
  FV.lang = lang; localStorage.setItem('fv_lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir  = lang==='ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-t]').forEach(el => {
    const v = DB.i18n[lang]?.[el.dataset.t] || DB.i18n.en[el.dataset.t];
    if(v) el.textContent = v;
  });
  document.querySelectorAll('[data-tp]').forEach(el => {
    const v = DB.i18n[lang]?.[el.dataset.tp] || DB.i18n.en[el.dataset.tp];
    if(v) el.placeholder = v;
  });
}

/* ── Theme ── */
function applyTheme(theme) {
  FV.theme = theme;
  localStorage.setItem('fv_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeBtn');
  if(btn) btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}
function toggleTheme() {
  applyTheme(FV.theme === 'dark' ? 'light' : 'dark');
  const btn = document.getElementById('themeBtn');
  if(btn) {
    btn.style.transform = 'rotate(360deg)';
    btn.style.transition = 'transform .5s';
    setTimeout(() => { btn.style.transform = ''; btn.style.transition = ''; }, 500);
  }
}

/* ── Toast ── */
let _tt;
function toast(msg, type='') {
  let el = document.getElementById('toast');
  if(!el){ el = document.createElement('div'); el.id='toast'; el.className='toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.style.borderColor = type==='error' ? 'rgba(255,61,127,.5)' : '';
  el.classList.add('show');
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ── Like / Save ── */
function toggleLike(id, btn) {
  const i = FV.likes.indexOf(id);
  if(i>-1){ FV.likes.splice(i,1); btn?.classList.remove('rc-liked'); if(btn) btn.textContent='Like'; }
  else { FV.likes.push(id); btn?.classList.add('rc-liked'); if(btn) btn.textContent='Liked'; toast('Recipe liked ❤️'); }
  FV.save();
}
function toggleSave(id, btn) {
  const i = FV.saves.indexOf(id);
  if(i>-1){ FV.saves.splice(i,1); btn?.classList.remove('rc-saved'); if(btn) btn.textContent='Save'; }
  else { FV.saves.push(id); btn?.classList.add('rc-saved'); if(btn) btn.textContent='Saved'; toast('Recipe saved ⭐'); }
  FV.save();
}

/* ── Grocery ── */
function addGrocery(id) {
  const r = DB.recipes.find(x=>x.id===id); if(!r) return;
  const added = r.ingr.filter(ing => !FV.groc.some(g=>g.text===ing&&g.recipe===r.title));
  if(!added.length){ toast('Already in list'); return; }
  FV.groc.push(...added.map(ing=>({text:ing,recipe:r.title,done:false})));
  FV.save(); renderGrocery(); openModal('groceryModal');
  toast(`Added ${added.length} item${added.length>1?'s':''} 🛒`);
}
function renderGrocery() {
  const el = document.getElementById('groceryBody'); if(!el) return;
  if(!FV.groc.length){ el.innerHTML='<p style="text-align:center;padding:2.5rem;color:var(--tx3)">Your list is empty.</p>'; return; }
  const g={};
  FV.groc.forEach((item,i)=>{ (g[item.recipe]||=[]).push({...item,i}) });
  el.innerHTML = Object.entries(g).map(([r,items])=>
    `<div class="groc-lbl">${r}</div>` +
    items.map(item=>`<div class="groc-item${item.done?' done':''}">
      <input type="checkbox" id="gi${item.i}" ${item.done?'checked':''} onchange="toggleGrocItem(${item.i})">
      <label for="gi${item.i}">${item.text}</label>
    </div>`).join('')
  ).join('');
}
function toggleGrocItem(i){ if(FV.groc[i]){ FV.groc[i].done=!FV.groc[i].done; FV.save(); renderGrocery(); } }
function clearGrocery(){ FV.groc=[]; FV.save(); renderGrocery(); toast('List cleared'); }

/* ── Modals ── */
function openModal(id){ const m=document.getElementById(id); if(m){ m.classList.add('open'); document.body.style.overflow='hidden'; } }
function closeModal(id){ const m=document.getElementById(id); if(m){ m.classList.remove('open'); document.body.style.overflow=''; } }

/* ── Recipe Card HTML ── */
function recipeCardHTML(r, idx) {
  const liked = FV.likes.includes(r.id);
  const saved  = FV.saves.includes(r.id);
  const delay  = ['d1','d2','d3','d4'][idx%4];
  return `
<article class="recipe-card rv ${delay}" onclick="openRecipeModal(${r.id})">
  <div class="rc-img">
    <img src="${r.img}" alt="${r.title}" loading="lazy">
    <div class="rc-ov"></div>
    <span class="rc-tag tag${r.tag.includes('#1')||r.tag==='Trending'?' tag-r':r.tag==='Healthy'||r.tag==='Vegan'?' tag-a':''}">${r.tag}</span>
    ${r.vid?`<div class="rc-play" onclick="event.stopPropagation();openVideo('${r.vid}','${r.title}')"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>`:''}
    <div class="rc-actions" onclick="event.stopPropagation()">
      ${r.vid?`<button class="rc-action" onclick="openVideo('${r.vid}','${r.title}')">▶ Watch</button>`:''}
      <button class="rc-action ${liked?'rc-liked':''}" onclick="toggleLike(${r.id},this)">${liked?'Liked':'Like'}</button>
      <button class="rc-action ${saved?'rc-saved':''}" onclick="toggleSave(${r.id},this)">${saved?'Saved':'Save'}</button>
      <button class="rc-action" onclick="addGrocery(${r.id})">+ List</button>
    </div>
  </div>
  <div class="rc-body">
    <div class="rc-meta">
      <span class="rc-cuis">${r.cuisine}</span>
      <span class="rc-dot"></span>
      <span class="rc-cuis">${r.diff}</span>
    </div>
    <h3 class="rc-title">${r.title}</h3>
    <div class="rc-stats">
      <span class="rc-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${r.time} min</span>
      <span class="rc-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>${r.cal} cal</span>
    </div>
    <div class="rc-foot">
      <div class="rc-chef"><img src="${r.chef.img}" alt="${r.chef.n}" loading="lazy"><span>${r.chef.n.split(' ')[0]}</span></div>
      <div class="rc-rating"><svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>${r.rating}</div>
    </div>
  </div>
</article>`;
}

/* ── Recipe Modal ── */
function openRecipeModal(id) {
  const r = DB.recipes.find(x=>x.id===id); if(!r) return;
  const box = document.getElementById('recipeModalContent'); if(!box) return;
  box.innerHTML = `
    <img class="rm-img" src="${r.img}" alt="${r.title}">
    <div class="rm-grad">
      <button class="modal-x" style="position:absolute;top:.75rem;right:.75rem" onclick="closeModal('recipeModal')">✕</button>
      <h2 class="rm-title">${r.title}</h2>
      <div class="rm-mrow">
        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${r.time} min</span>
        <span>${r.cuisine}</span><span>${r.diff}</span><span>${r.cal} cal</span><span>★ ${r.rating}</span>
      </div>
    </div>
    <div style="padding:1.2rem 1.4rem">
      <div class="rm-sec">Ingredients</div>
      <div class="rm-ingrs">${r.ingr.map(i=>`<span class="rm-ingr">${i}</span>`).join('')}</div>
      <div class="rm-sec">Tips</div>
      <p style="font-size:.85rem;color:var(--tx2);line-height:1.7">Prep all your ingredients before starting. Taste and adjust seasoning as you go. This recipe serves 2-4 people.</p>
    </div>`;
  openModal('recipeModal');
}

/* ── Video Modal ── */
function openVideo(vid, title) {
  const d = document.createElement('div');
  d.className = 'modal-ov'; d.id = '_vm';
  d.innerHTML = `<div class="modal modal-wide" style="background:#000;overflow:hidden;border-radius:20px">
    <button onclick="document.getElementById('_vm').remove();document.body.style.overflow=''" style="position:absolute;top:.6rem;right:.6rem;z-index:10;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.85rem">✕</button>
    <div style="aspect-ratio:16/9"><iframe src="https://www.youtube.com/embed/${vid}?autoplay=1" style="width:100%;height:100%;border:none;display:block" allow="autoplay;fullscreen" allowfullscreen></iframe></div>
    <div style="padding:.75rem 1rem;background:var(--bg2)"><p style="color:var(--tx);font-size:.88rem;font-weight:600">${title}</p></div>
  </div>`;
  d.addEventListener('click', e=>{ if(e.target===d){ d.remove(); document.body.style.overflow=''; } });
  document.body.appendChild(d);
  requestAnimationFrame(()=>d.classList.add('open'));
  document.body.style.overflow='hidden';
}

/* ── Scroll Reveal ── */
function initReveal() {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if(e.isIntersecting){ e.target.classList.add('vis'); io.unobserve(e.target); }
  }), {threshold:.07});
  document.querySelectorAll('.rv:not(.vis)').forEach(el => io.observe(el));
}

/* ── Stat counters ── */
function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  if(!els.length) return;
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if(!e.isIntersecting) return; io.unobserve(e.target);
    const target = +e.target.dataset.count;
    const suffix = e.target.dataset.suffix || '';
    let cur=0; const step=target/60;
    const tick = setInterval(()=>{ cur=Math.min(cur+step,target); e.target.textContent=Math.floor(cur).toLocaleString()+suffix; if(cur>=target) clearInterval(tick); }, 16);
  }), {threshold:.5});
  els.forEach(el => io.observe(el));
}

/* ── Timer ── */
const Timer = {
  sec:0, running:false, iv:null,
  _disp(){ const h=Math.floor(this.sec/3600),m=Math.floor((this.sec%3600)/60),s=this.sec%60; const d=document.getElementById('timerDisp'); if(d) d.textContent=`${pad(h)}:${pad(m)}:${pad(s)}`; },
  set(min){ this.reset(); this.sec=min*60; this._disp(); },
  custom(){ this.reset(); const m=+(document.getElementById('tMin')?.value||0); const s=+(document.getElementById('tSec')?.value||0); this.sec=m*60+s; this._disp(); },
  start(){ if(this.running||!this.sec) return; this.running=true; document.getElementById('timerDisp')?.classList.add('tick'); this.iv=setInterval(()=>{ this.sec--; this._disp(); if(this.sec<=0){this.stop();this._done();} },1000); },
  pause(){ clearInterval(this.iv); this.running=false; document.getElementById('timerDisp')?.classList.remove('tick'); },
  reset(){ this.pause(); this.sec=0; this._disp(); },
  stop(){ this.pause(); },
  _done(){ toast('⏰ Timer done!'); try{ const c=new(window.AudioContext||window.webkitAudioContext)(); [0,.4,.8].forEach(t=>{ const o=c.createOscillator(),g=c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value=880; g.gain.setValueAtTime(.22,c.currentTime+t); g.gain.exponentialRampToValueAtTime(.001,c.currentTime+t+.28); o.start(c.currentTime+t); o.stop(c.currentTime+t+.3); }); }catch(e){} }
};
function pad(n){ return String(n).padStart(2,'0'); }

/* ── Nav ── */
function initNav() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', ()=>nav?.classList.toggle('scrolled', window.scrollY>10), {passive:true});
  if(nav) nav.classList.toggle('scrolled', window.scrollY>10);

  const ham = document.getElementById('ham');
  const mn  = document.getElementById('mobNav');
  ham?.addEventListener('click', ()=>{ ham.classList.toggle('open'); mn?.classList.toggle('open'); document.body.style.overflow=mn?.classList.contains('open')?'hidden':''; });
  mn?.querySelectorAll('.mob-link,.mob-cta').forEach(l => l.addEventListener('click', ()=>{ ham?.classList.remove('open'); mn?.classList.remove('open'); document.body.style.overflow=''; }));
}

/* ── Lang ── */
function initLang() {
  const btn   = document.getElementById('langBtn');
  const drop  = document.getElementById('langDrop');
  const label = document.getElementById('langLabel');
  if(!btn||!drop) return;
  btn.addEventListener('click', e=>{ e.stopPropagation(); drop.classList.toggle('open'); });
  document.addEventListener('click', ()=>drop.classList.remove('open'));
  drop.querySelectorAll('.lang-opt').forEach(o => {
    if(o.dataset.lang===FV.lang) o.classList.add('active');
    o.addEventListener('click', e=>{ e.stopPropagation();
      applyLang(o.dataset.lang);
      drop.querySelectorAll('.lang-opt').forEach(x=>x.classList.remove('active'));
      o.classList.add('active');
      if(label) label.textContent = o.dataset.lang.toUpperCase();
      drop.classList.remove('open');
    });
  });
  if(label) label.textContent = FV.lang.toUpperCase();
}

/* ── Search ── */
function toggleSearch() {
  const el = document.getElementById('searchOv');
  if(!el) return;
  el.classList.toggle('open');
  if(el.classList.contains('open')) { document.body.style.overflow='hidden'; setTimeout(()=>document.getElementById('sField')?.focus(), 100); }
  else { document.body.style.overflow=''; }
}

/* ── Keyboard ── */
function initKeyboard() {
  document.addEventListener('keydown', e => {
    if(e.key==='Escape'){
      document.querySelectorAll('.modal-ov.open').forEach(m=>{ m.classList.remove('open'); document.body.style.overflow=''; });
      const sv = document.getElementById('searchOv'); if(sv) { sv.classList.remove('open'); document.body.style.overflow=''; }
      document.getElementById('langDrop')?.classList.remove('open');
      const mn = document.getElementById('mobNav'); const ham = document.getElementById('ham');
      mn?.classList.remove('open'); ham?.classList.remove('open'); document.body.style.overflow='';
    }
    if((e.ctrlKey||e.metaKey)&&e.key==='k'){ e.preventDefault(); toggleSearch(); }
  });
}

/* ── Follow ── */
function followChef(name, btn) {
  const i = FV.follows.indexOf(name);
  if(i>-1){ FV.follows.splice(i,1); btn.textContent='Follow'; btn.classList.remove('following'); }
  else { FV.follows.push(name); btn.textContent='Following'; btn.classList.add('following'); toast(`Following ${name} 🍳`); }
  FV.save();
}

/* ── DOM Ready ── */
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme immediately
  applyTheme(FV.theme);

  // Theme button
  document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);

  // Loader (homepage only — inner pages don't have #loader)
  const loader = document.getElementById('loader');
  if(loader) setTimeout(()=>loader.classList.add('hide'), 2000);

  initNav(); initLang(); initKeyboard(); initReveal(); initCounters();
  applyLang(FV.lang);

  // Search
  document.getElementById('searchBtn')?.addEventListener('click', toggleSearch);
  document.getElementById('sCloseBtn')?.addEventListener('click', toggleSearch);
  document.getElementById('searchOv')?.addEventListener('click', e=>{ if(e.target===document.getElementById('searchOv')) toggleSearch(); });
  const sf = document.getElementById('sField');
  sf?.addEventListener('input', ()=>{
    const q = sf.value.trim().toLowerCase();
    const rb = document.getElementById('sResults');
    if(!rb) return;
    if(!q){ rb.classList.remove('has'); return; }
    const hits = DB.recipes.filter(r=>
      r.title.toLowerCase().includes(q)||r.cuisine.toLowerCase().includes(q)||
      r.cat.includes(q)||r.ingr.some(i=>i.toLowerCase().includes(q))
    ).slice(0,6);
    if(!hits.length){ rb.classList.remove('has'); return; }
    rb.innerHTML = hits.map(r=>`
      <div class="s-item" onclick="closeSearch();openRecipeModal(${r.id})">
        <img src="${r.img}" alt="${r.title}" loading="lazy">
        <div><strong>${r.title}</strong><small>${r.cuisine} · ${r.cat} · ${r.time} min</small></div>
      </div>`).join('');
    rb.classList.add('has');
  });

  // Modal backdrops
  document.querySelectorAll('.modal-ov').forEach(m => m.addEventListener('click', e=>{ if(e.target===m){ m.classList.remove('open'); document.body.style.overflow=''; } }));

  // Timer FAB
  document.getElementById('timerFab')?.addEventListener('click', ()=>document.getElementById('timerPanel')?.classList.toggle('open'));
  document.getElementById('timerClose')?.addEventListener('click', ()=>document.getElementById('timerPanel')?.classList.remove('open'));
  Timer._disp();
});

function closeSearch() { const el=document.getElementById('searchOv'); if(el){ el.classList.remove('open'); document.body.style.overflow=''; } }

/* ── Expose globals ── */
Object.assign(window, { FV, t, applyLang, toggleTheme, applyTheme, toast, toggleLike, toggleSave, addGrocery, renderGrocery, toggleGrocItem, clearGrocery, openModal, closeModal, recipeCardHTML, openRecipeModal, openVideo, initReveal, Timer, followChef, toggleSearch, closeSearch });