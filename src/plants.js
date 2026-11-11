// Oberfläche: zeichnet Pflanzen und Kübel als SVG aus den Rezepten in catalog.js.
// Keine Logik, keine Daten. In Swift später als Path-Zeichner neu geschrieben (siehe docs/SWIFT.md).
const NS = 'http://www.w3.org/2000/svg';
export function el(tag, attrs, parent){ const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
const GREEN = '#5FAE57', STEM = '#4F9A4A', WHITE = '#FFFFFF';
let DETAIL = false;
function shade(hex, f){ const n = parseInt(hex.slice(1),16), r = Math.round((n>>16)*f), g2 = Math.round(((n>>8)&255)*f), b = Math.round((n&255)*f); return '#'+((1<<24)+(r<<16)+(g2<<8)+b).toString(16).slice(1); }

function leaf(g, x, y, ang, len, shape, col){
  var n;
  if (shape === 'round') n = el('circle', {cx:len*.55, cy:0, r:len*.48, fill:col});
  else { var w = shape === 'long' ? .17 : shape === 'heart' ? .6 : .42; n = el('path', {d:'M0 0 Q'+len*.5+' '+(-len*w)+' '+len+' 0 Q'+len*.5+' '+(len*w)+' 0 0 Z', fill:col}); }
  var gg = el('g',{transform:'translate('+x+' '+y+') rotate('+ang+')'}, g); gg.appendChild(n);
  if (DETAIL){
    if (shape === 'round'){ for (var q = -1; q <= 1; q++) el('path',{d:'M'+len*.12+' 0 L'+len*.9+' '+(q*len*.3),stroke:shade(col,.65),'stroke-width':.6,fill:'none'},gg); }
    else { var w2 = shape === 'long' ? .17 : shape === 'heart' ? .6 : .42;
      el('path',{d:'M0 0 Q'+len*.5+' '+(len*w2)+' '+len+' 0 Z',fill:shade(col,.82)},gg);
      el('path',{d:'M0 0 L'+len*.93+' 0 M'+len*.3+' 0 l'+len*.14+' '+(-len*w2*.42)+' M'+len*.5+' 0 l'+len*.14+' '+(len*w2*.38)+' M'+len*.62+' 0 l'+len*.1+' '+(-len*w2*.3),stroke:shade(col,.6),'stroke-width':.6,'stroke-linecap':'round',fill:'none'},gg); }
  }
}
function flower(g, x, y, sp, s, open){
  var f = el('g', {transform:'translate('+x+' '+y+')'}, g), k = sp.flower, i, a;
  var edge = sp.color === WHITE ? '#CFC8BC' : 'none';
  if (!open){
    if (k === 'bell') { el('ellipse',{cx:0,cy:s*.3,rx:s*.2,ry:s*.34,fill:sp.color,stroke:edge,'stroke-width':.7},f); el('ellipse',{cx:0,cy:s*.08,rx:s*.2,ry:s*.16,fill:'#6CBF5D'},f); return; }
    el('ellipse',{cx:0,cy:0,rx:s*.2,ry:s*.3,fill:'#6CBF5D'},f); el('ellipse',{cx:0,cy:-s*.15,rx:s*.12,ry:s*.16,fill:sp.color,stroke:edge,'stroke-width':.7},f); return;
  }
  if (k === 'daisy' || k === 'sun'){
    var n = sp.petals || 16;
    if (DETAIL) for (i = 0; i < n; i++) el('ellipse',{cx:0,cy:-s*.34,rx:s*1.15/n,ry:s*.21,fill:shade(sp.color,.8),transform:'rotate('+((i+.5)*360/n)+')'},f);
    for (i = 0; i < n; i++) el('ellipse',{cx:0,cy:-s*.32,rx:s*1.15/n,ry:s*.2,fill:sp.color,stroke:edge,'stroke-width':.7,transform:'rotate('+(i*360/n)+')'},f);
    el('circle',{cx:0,cy:0,r:s*(k==='sun'?.28:.19),fill:sp.color2},f);
    if (k === 'sun') el('circle',{cx:0,cy:0,r:s*.17,fill:'#5E3616'},f);
    if (DETAIL) for (i = 0; i < 10; i++){ a = i*Math.PI/5; el('circle',{cx:Math.cos(a)*s*.11,cy:Math.sin(a)*s*.11,r:s*.022,fill:k==='sun'?'#C9963F':shade(sp.color2,.75)},f); }
  } else if (k === 'poppy' || k === 'round5'){
    var m = k === 'poppy' ? 4 : 5, r = k === 'poppy' ? .31 : .24, o = k === 'poppy' ? .2 : .25;
    for (i = 0; i < m; i++){ a = i*2*Math.PI/m - Math.PI/2; el('circle',{cx:Math.cos(a)*s*o,cy:Math.sin(a)*s*o,r:s*r,fill:sp.color,stroke:edge,'stroke-width':.7},f); }
    if (DETAIL) for (i = 0; i < m; i++){ a = i*2*Math.PI/m - Math.PI/2; el('path',{d:'M0 0 L'+Math.cos(a)*s*(o+r*.7)+' '+Math.sin(a)*s*(o+r*.7),stroke:shade(sp.color,.72),'stroke-width':.7,'stroke-linecap':'round'},f); }
    el('circle',{cx:0,cy:0,r:s*.13,fill:sp.color2},f);
  } else if (k === 'tulip'){
    var A = s*.36, B = s*.3, C = s*.5;
    el('path',{d:'M'+(-A)+' '+(-B)+' Q'+(-A*1.2)+' '+C+' 0 '+C+' Q'+(A*1.2)+' '+C+' '+A+' '+(-B)+' L'+(A*.45)+' '+(B*.2)+' L0 '+(-B*1.35)+' L'+(-A*.45)+' '+(B*.2)+' Z',fill:sp.color,transform:'translate(0 '+(-C*.6)+')'},f);
    el('path',{d:'M'+(-A*.45)+' '+(B*.2)+' L0 '+(-B*1.35)+' L'+(A*.45)+' '+(B*.2)+' Q0 '+(C*.95)+' '+(-A*.45)+' '+(B*.2)+' Z',fill:sp.color2,transform:'translate(0 '+(-C*.6)+')'},f);
  } else if (k === 'rose'){
    el('circle',{cx:0,cy:0,r:s*.44,fill:sp.color},f); el('circle',{cx:1,cy:-1,r:s*.3,fill:sp.color2},f); el('circle',{cx:0,cy:0,r:s*.17,fill:sp.color},f);
    el('path',{d:'M'+(-s*.3)+' '+(s*.12)+' Q0 '+(s*.5)+' '+(s*.32)+' '+(s*.05),fill:'none',stroke:sp.color2,'stroke-width':1.4,'stroke-linecap':'round'},f);
  } else if (k === 'bell'){
    var w = s*.3, h = s*.8;
    el('path',{d:'M'+(-w)+' 0 Q'+(-w*1.1)+' '+(h*.7)+' '+(-w*1.55)+' '+h+' L'+(w*1.55)+' '+h+' Q'+(w*1.1)+' '+(h*.7)+' '+w+' 0 Q0 '+(-w*.9)+' '+(-w)+' 0 Z',fill:sp.color,stroke:edge,'stroke-width':.7},f);
    el('ellipse',{cx:0,cy:h,rx:w*1.2,ry:s*.11,fill:sp.color2},f); el('circle',{cx:0,cy:h+s*.12,r:s*.07,fill:'#FFD35C'},f);
  }
}
function berry(g, x, y){ var b = el('g',{transform:'translate('+x+' '+y+')'},g); el('path',{d:'M-5 -2 Q-6 6 0 9 Q6 6 5 -2 Q0 -5 -5 -2 Z',fill:'#E83A4A'},b); el('path',{d:'M-4 -3 L0 -1 L4 -3 L0 -6 Z',fill:GREEN},b); [[-2,2],[2,3],[0,6]].forEach(function(p){ el('circle',{cx:p[0],cy:p[1],r:.6,fill:'#FFE27A'},b); }); }
function stem(g, x0, y0, x1, y1, bend, w){
  var cx = (x0+x1)/2 + (bend||0), cy = (y0+y1)/2;
  var sd = 'M'+x0+' '+y0+' Q'+cx+' '+cy+' '+x1+' '+y1; el('path',{d:sd,fill:'none',stroke:STEM,'stroke-width':w||2.6,'stroke-linecap':'round'},g);
  if (DETAIL) el('path',{d:sd,fill:'none',stroke:'#8AD078','stroke-width':(w||2.6)*.3,'stroke-linecap':'round',transform:'translate(-0.7 0)'},g);
  return function(t){ var u = 1-t; return [u*u*x0+2*u*t*cx+t*t*x1, u*u*y0+2*u*t*cy+t*t*y1]; };
}
function sideLeaves(g, pt, sp, n, len){ for (var i = 0; i < n; i++){ var p = pt(.22 + i*.5/Math.max(n-1,1)*(n>1?1:0) + (n===1?.2:0)); leaf(g, p[0], p[1], i%2 ? -150 : -30, len*(1 - i*.08), sp.leaf||'oval', i%2 ? GREEN : '#6CBF5D'); } }
function basal(g, H, full){ var L = Math.min(H*.62, 40); leaf(g,0,0,-60,L,'long',GREEN); leaf(g,0,0,-120,L,'long','#6CBF5D'); if (full) leaf(g,0,0,-82,L*.7,'long','#4F9A4A'); }
function seedling(g){ stem(g,0,0,0,-11,2,2.2); el('ellipse',{cx:-5,cy:-13,rx:5.2,ry:2.9,fill:'#8FD06E',transform:'rotate(-25 -5 -13)'},g); el('ellipse',{cx:5,cy:-13,rx:5.2,ry:2.9,fill:'#8FD06E',transform:'rotate(25 5 -13)'},g); }

function plant(g, sp, stage){
  if (stage <= 0) return;
  if (stage === 1) return seedling(g);
  var full = stage >= 3, open = stage >= 4, i, pt, p;
  if (sp.form === 'hang'){
    var L = full ? 62 : 30;
    [-2,-1,1,2].forEach(function(k, idx){
      var sg = k > 0 ? 1 : -1, outer = Math.abs(k) === 2;
      var x0 = sg*(outer ? 27 : 21), len = L*(outer ? .62 : 1), ex = sg*(outer ? 39 : 31);
      var c1 = [sg*(outer ? 40 : 30), -8], c2 = [sg*(outer ? 42 : 33), len*.4];
      el('path',{d:'M'+x0+' 0 C'+c1[0]+' '+c1[1]+' '+c2[0]+' '+c2[1]+' '+ex+' '+len,fill:'none',stroke:STEM,'stroke-width':2.2,'stroke-linecap':'round'},g);
      var bz = function(t){ var u = 1-t; return [u*u*u*x0+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*ex, 3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*len]; };
      [.3,.5,.7,.88].forEach(function(t, j){ if (!full && j > 1) return; var q = bz(full ? t : t*1.1); leaf(g, q[0], q[1], (j%2 ? 1 : -1)*(k>0?1:-1) > 0 ? 20 : 160, sp.leaf === 'round' ? 8 : 10, sp.leaf, j%2 ? GREEN : '#6CBF5D'); });
      if (full){
        var e = bz(1), mid = bz(.58);
        if (sp.fruit && open && Math.abs(k) === 1) berry(g, e[0], e[1]+2); else flower(g, e[0], e[1] + (sp.flower==='bell'?0:2), sp, sp.size, open);
        if (!outer) flower(g, mid[0] + sg*4, mid[1], sp, sp.size*.85, open);
      }
    });
    for (i = -1; i <= 1; i++) leaf(g, i*8, 0, -90 + i*35, 11, sp.leaf, i ? '#6CBF5D' : GREEN);
    return;
  }
  if (sp.form === 'cactus'){
    var rx = full ? 15 : 10, ry = full ? 27 : 15;
    if (full){ el('path',{d:'M12 -22 Q26 -22 25 -38',fill:'none',stroke:'#58A46A','stroke-width':9,'stroke-linecap':'round'},g); }
    el('ellipse',{cx:0,cy:-ry+3,rx:rx,ry:ry,fill:'#58A46A'},g);
    el('path',{d:'M-'+rx*.4+' -3 Q-'+rx*.75+' '+(-ry)+' -'+rx*.3+' '+(-ry*2+6)+' M'+rx*.4+' -3 Q'+rx*.75+' '+(-ry)+' '+rx*.3+' '+(-ry*2+6),fill:'none',stroke:'#3F8C52','stroke-width':1.4,'stroke-linecap':'round'},g);
    for (i = 0; i < (full ? 7 : 4); i++){ var yy = -6 - i*(ry*2-10)/(full?7:4), xx = (i%2 ? 1 : -1)*rx*.15; el('path',{d:'M'+(xx-2)+' '+yy+' l4 -2 M'+(xx-2)+' '+(yy-2)+' l4 2',stroke:'#F4F1E8','stroke-width':.9,'stroke-linecap':'round'},g); }
    if (full) flower(g, 0, -ry*2 + 3 - (open ? 3 : 2), sp, sp.size, open);
    return;
  }
  var H = (sp.height||60)*(full ? 1 : .55);
  if (sp.form === 'single'){
    pt = stem(g,0,0,5,-H,-5,3);
    if (sp.basal) basal(g,H,full); else sideLeaves(g, pt, sp, full ? (sp.leaves||2) : 2, sp.leaf === 'heart' ? 20 : 15);
    if (full) flower(g,5,-H,sp,sp.size,open);
  } else if (sp.form === 'multi'){
    [-1,0,1].forEach(function(k){ var ex = k*17, ey = -H*(k ? .8 : 1); var q = stem(g,k*2,0,ex,ey,k*5,2.2); if (!sp.basal){ p = q(.45); leaf(g,p[0],p[1],k<0?-150:-30,sp.leaf==='round'?9:13,sp.leaf,k?'#6CBF5D':GREEN); } if (full) flower(g,ex,ey,sp,sp.size,open); });
    if (sp.basal) basal(g,H,full); else { leaf(g,0,0,-20,sp.leaf==='round'?10:14,sp.leaf,GREEN); leaf(g,0,0,-160,sp.leaf==='round'?10:14,sp.leaf,GREEN); }
  } else if (sp.form === 'spike'){
    var K = sp.stems || 1;
    for (var j = 0; j < K; j++){
      var off = j - (K-1)/2, x0 = off*3, ex2 = off*17, ey2 = -H*(j%2 ? .85 : 1);
      pt = stem(g,x0,0,ex2,ey2,0,2.2);
      if (full){ var nfl = 8; for (i = nfl-1; i >= 0; i--){ var t = 1 - i*.058*(sp.fat?1.2:1); p = pt(t); var w = (1.6 + i*.75)*(sp.fat||1), col = open ? sp.color : (i < 2 ? sp.color : '#A9D68A'); el('circle',{cx:p[0]-w,cy:p[1],r:2.7+(sp.fat?.8:0),fill:col},g); el('circle',{cx:p[0]+w,cy:p[1],r:2.7+(sp.fat?.8:0),fill:col},g); } p = pt(1); el('circle',{cx:p[0],cy:p[1]-4,r:2.6,fill:open?sp.color:'#A9D68A'},g); }
      if (!sp.basal && j === 0) sideLeaves(g, function(t){ return pt(t*.55); }, sp, full ? (sp.leaves||2) : 2, 17);
    }
    if (sp.basal) basal(g,H*.8,full);
  } else if (sp.form === 'bell'){
    pt = stem(g,0,0,6,-H,-8,2.6);
    if (sp.basal) basal(g,H,full); else sideLeaves(g, function(t){ return pt(t*.6); }, sp, 2, 15);
    if (full) [1,.76,.55].slice(0, sp.count||1).forEach(function(t, n){ p = pt(t); var sd = n%2 ? -1 : 1, bx = p[0]+sd*11, by = p[1]+4; el('path',{d:'M'+p[0]+' '+p[1]+' Q'+(p[0]+sd*9)+' '+(p[1]-5)+' '+bx+' '+by,fill:'none',stroke:STEM,'stroke-width':1.6,'stroke-linecap':'round'},g); flower(g,bx,by,sp,sp.size,open); });
  }
}

function pot(g, o){
  var p = o.pot || { id: 'terrakotta' };
  if (o.hang){ el('path',{d:'M-22 2 L0 -44 L22 2',fill:'none',stroke:'#8A6F5A','stroke-width':1.6,'stroke-linejoin':'round'},g); el('circle',{cx:0,cy:-45,r:2.6,fill:'none',stroke:'#8A6F5A','stroke-width':1.6},g); }
  // Gemalter Kübel (von Anna), andere Designs per Farbfilter aus index.html (#k-<id>). Höhe 46: Rand oben bei -2, Boden bei 44.
  el('image',{href:'bilder/kuebel.webp',x:-22.3,y:-2,width:44.6,height:46,filter:p.id === 'terrakotta' ? 'none' : 'url(#k-'+p.id+')'},g);
  if (o.label != null){ var t = el('text',{x:0,y:33,'text-anchor':'middle','font-family':'IBM Plex Mono, monospace','font-weight':600,'font-size':14,fill:'#2A1A12'},g); t.textContent = o.label; }
  else if (o.mood){
    var eyes = o.mood === 'schlaf' ? 'M-10 24 q2.5 2.5 5 0 M5 24 q2.5 2.5 5 0' : o.mood === 'froh' ? 'M-10 25 q2.5 -4 5 0 M5 25 q2.5 -4 5 0' : '';
    if (eyes) el('path',{d:eyes,fill:'none',stroke:'#3A2216','stroke-width':1.8,'stroke-linecap':'round'},g);
    else { el('circle',{cx:-7.5,cy:24,r:2.1,fill:'#3A2216'},g); el('circle',{cx:7.5,cy:24,r:2.1,fill:'#3A2216'},g); }
    el('path',{d:o.mood === 'schlaf' ? 'M-2.5 32 h5' : 'M-4 30.5 q4 4.5 8 0',fill:'none',stroke:'#3A2216','stroke-width':1.8,'stroke-linecap':'round'},g);
    el('ellipse',{cx:-12,cy:29.5,rx:3.4,ry:2,fill:'#FF8FA8',opacity:.55},g); el('ellipse',{cx:12,cy:29.5,rx:3.4,ry:2,fill:'#FF8FA8',opacity:.55},g);
  }
}
/* Zeichnet Kübel + Pflanze in eine Gruppe; Ursprung = Bodenmitte der Zelle (72 breit, 178 hoch, y von -128 bis 50) */
function unit(parent, sp, stage, o){
  o = o || {}; var hang = sp && sp.form === 'hang';
  var g = el('g',{transform:'translate(0 '+(hang ? -78 : 0)+')'}, parent);
  var pl = el('g',{transform:'translate(0 -2)'}, g), inner = el('g',{}, pl);
  if (sp && !hang) plant(inner, sp, stage);
  pot(g, {pot:o.pot, hang:hang, label:o.label, mood:o.mood});
  if (sp && hang){ var over = el('g',{transform:'translate(0 -2)'}, g); inner = el('g',{}, over); if (stage >= 2){ var v = el('g',{transform:'translate(0 4)'}, inner); plant(v, sp, stage); } else plant(inner, sp, stage); }
  return {g:g, plant:inner, hang:hang};
}

/** Pflanze ohne Kübel (fürs Beet). detail=false zeichnet die vereinfachte Stufe. */
export function drawPlant(g, sp, stage, detail){ DETAIL = !!detail; try { plant(g, sp, stage); } finally { DETAIL = false; } }
/** Kübel mit Pflanze. Rückgabe: {g, plant, hang}. o: {pot:{id} aus POTS, label, mood, detail} */
export function drawUnit(parent, sp, stage, o){ DETAIL = !!(o && o.detail); try { return unit(parent, sp, stage, o); } finally { DETAIL = false; } }
