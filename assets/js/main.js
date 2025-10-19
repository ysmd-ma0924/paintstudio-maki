// main.js - Dark Neon + RGB Picker

// ローディング演出
window.addEventListener('load', () => {
  const ld = document.getElementById('loading');
  setTimeout(()=> ld && ld.classList.add('hidden'), 1200);
});

// スクロールインで見出しドリップ
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('inview'); });
}, { threshold: 0.3 });
document.querySelectorAll('.headline-drip').forEach(el => io.observe(el));

// インクスプラッシュ（ネオングロー）
const inkContainer = document.getElementById('ink-container');
const COLORS = ['#ff2bbb','#00d0ff','#78ff00','#ff7a00'];
const MAX_DOTS = 70;

function spawnInk(x, y, options={}) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = options.count ?? (reduce ? 6 : 12);
  const maxDist = options.maxDist ?? (reduce ? 70 : 120);
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span');
    dot.className = 'ink-dot';
    const size = (options.sizeMin ?? 10) + Math.random()*(options.sizeMax ?? 24);
    dot.style.width = dot.style.height = size + 'px';
    dot.style.left = x + 'px';
    dot.style.top = y + 'px';
    const col = (options.color) || COLORS[(Math.random()*COLORS.length)|0];
    dot.style.background = col;
    dot.style.color = col; // for glow shadow
    inkContainer.appendChild(dot);
    const angle = Math.random()*Math.PI*2;
    const dist = (options.distMin ?? 40) + Math.random()*maxDist;
    requestAnimationFrame(()=>{
      dot.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`;
      dot.style.opacity = '0';
    });
    setTimeout(()=> dot.remove(), 1900);
  }
  const dots = inkContainer.querySelectorAll('.ink-dot');
  if (dots.length > MAX_DOTS) {
    const excess = dots.length - MAX_DOTS;
    for (let i=0;i<excess;i++) dots[i].remove();
  }
}
document.addEventListener('click', (e)=> spawnInk(e.clientX, e.clientY));

// カラーシミュレーター：基本スウォッチ & RGB/HEX/パレット
(function(){
  const houseFill = document.querySelector('#house-svg [data-fill-target]');
  const swatches = document.querySelectorAll('.swatch[data-color]');
  if (!houseFill) return;
  swatches.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const c = btn.getAttribute('data-color');
      applyColor(c);
      syncPickersFromHex(c);
      const rect = btn.getBoundingClientRect();
      spawnInk(rect.left + rect.width/2, rect.top + rect.height/2, { color: c, sizeMax:28 });
    });
  });

  // RGB/HEX/Color input パネル連動
  const inputColor = document.getElementById('p-color');
  const inputHex = document.getElementById('p-hex');
  const r = document.getElementById('p-r'); const rn = document.getElementById('p-rn');
  const g = document.getElementById('p-g'); const gn = document.getElementById('p-gn');
  const b = document.getElementById('p-b'); const bn = document.getElementById('p-bn');

  function toHex(n){ return ('0'+Number(n).toString(16)).slice(-2) }
  function fromHex(h){ return parseInt(h,16) }
  function clamp(v, min, max){ return Math.min(max, Math.max(min, v)) }

  function rgbToHex(R,G,B){ return '#'+toHex(R)+toHex(G)+toHex(B) }
  function hexToRgb(hex){
    const m = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
    if(!m) return null;
    return {r: fromHex(m[1]), g: fromHex(m[2]), b: fromHex(m[3])};
  }

  function applyColor(hex){
    if (!houseFill) return;
    houseFill.style.fill = hex;
  }

  function syncPickersFromHex(hex){
    const rgb = hexToRgb(hex);
    if(!rgb) return;
    inputColor && (inputColor.value = hex);
    inputHex && (inputHex.value = hex.toUpperCase());
    [r.value, rn.value] = [rgb.r, rgb.r];
    [g.value, gn.value] = [rgb.g, rgb.g];
    [b.value, bn.value] = [rgb.b, rgb.b];
  }

  function onRgbChange(){
    const R = clamp(r.value || rn.value, 0, 255);
    const G = clamp(g.value || gn.value, 0, 255);
    const B = clamp(b.value || bn.value, 0, 255);
    [r.value, rn.value] = [R, R];
    [g.value, gn.value] = [G, G];
    [b.value, bn.value] = [B, B];
    const hex = rgbToHex(R,G,B);
    inputHex.value = hex.toUpperCase();
    inputColor.value = hex;
    applyColor(hex);
  }

  function onHexChange(){
    let hex = inputHex.value.trim();
    if(!hex.startsWith('#')) hex = '#'+hex;
    const rgb = hexToRgb(hex);
    if(!rgb) return;
    applyColor(hex);
    syncPickersFromHex(hex);
  }

  if (inputColor) inputColor.addEventListener('input', e=>{
    const hex = e.target.value;
    applyColor(hex);
    syncPickersFromHex(hex);
    const rect = inputColor.getBoundingClientRect();
    spawnInk(rect.left + rect.width/2, rect.top + rect.height/2, { color: hex, count:10, sizeMax:26 });
  });
  if (inputHex) inputHex.addEventListener('input', onHexChange);
  [r,g,b,rn,gn,bn].forEach(el=> el && el.addEventListener('input', onRgbChange));

  // Adobeカラー風のパレットグリッド（12×12）
  const grid = document.getElementById('palette-grid');
  if (grid){
    const cols = 12, rows = 12;
    for (let row=0; row<rows; row++){
      for (let col=0; col<cols; col++){
        const h = Math.round(col * (360/cols));
        const s = 70 + Math.round(row * (25/ (rows-1))); // 70%〜95%
        const l = 45; // ほどよい明度
        const hex = hslToHex(h, s/100, l/100);
        const sw = document.createElement('button');
        sw.className = 'palette-swatch';
        sw.style.background = hex;
        sw.setAttribute('title', hex);
        sw.addEventListener('click', ()=>{
          applyColor(hex);
          syncPickersFromHex(hex);
          const rect = sw.getBoundingClientRect();
          spawnInk(rect.left + rect.width/2, rect.top + rect.height/2, { color: hex, count: 10, sizeMax:24 });
        });
        grid.appendChild(sw);
      }
    }
  }

  function hslToHex(h, s, l){
    const c = (1 - Math.abs(2*l - 1)) * s;
    const x = c * (1 - Math.abs((h/60)%2 - 1));
    const m = l - c/2;
    let r=0,g=0,b=0;
    if (0<=h && h<60){ r=c; g=x; b=0;}
    else if (60<=h && h<120){ r=x; g=c; b=0;}
    else if (120<=h && h<180){ r=0; g=c; b=x;}
    else if (180<=h && h<240){ r=0; g=x; b=c;}
    else if (240<=h && h<300){ r=x; g=0; b=c;}
    else { r=c; g=0; b=x; }
    const R = Math.round((r+m)*255);
    const G = Math.round((g+m)*255);
    const B = Math.round((b+m)*255);
    return '#'+[R,G,B].map(n => n.toString(16).padStart(2,'0')).join('');
  }
})();

// --- KV hero animation sequence ---
(function(){
  const kv = document.querySelector('.kv-logo');
  if(!kv) return;
  function centerPoint(){
    const rect = kv.getBoundingClientRect();
    return { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
  }
  // after load overlay disappears, burst inks then show
  window.addEventListener('load', () => {
    setTimeout(()=>{
      const p = centerPoint();
      // 3 bursts with different sizes/colors
      spawnInk(p.x, p.y, {count: 18, sizeMin: 12, sizeMax: 30, distMin: 30, maxDist: 140});
      setTimeout(()=> spawnInk(p.x, p.y, {count: 14, sizeMin: 8, sizeMax: 22, distMin: 20, maxDist: 110}), 160);
      setTimeout(()=> spawnInk(p.x, p.y, {count: 10, sizeMin: 6, sizeMax: 18, distMin: 10, maxDist: 90}), 320);
      // reveal logo
      kv.classList.add('show');
      // ambient small splats every few seconds (performance-safe)
      let tick = 0;
      const timer = setInterval(()=>{
        if (tick++ > 6) return clearInterval(timer);
        const p2 = centerPoint();
        spawnInk(p2.x + (Math.random()*40-20), p2.y + (Math.random()*20-10), {count: 8, sizeMin: 6, sizeMax: 14, distMin: 18, maxDist: 70});
      }, 2200);
    }, 900);
  });
})();
