// Interactive hero headline. Each word reacts in its own way to the cursor:
//   Motion  — letters trail the cursor on springs, weight follows proximity, sparks fly off
//   design  — design-tool mode: selection box, guides; style by cursor zone (outline / serif italic / colour)
//   for     — letters squash like a toggle
//   SaaS,   — letters ride on growing bars, live MRR tooltip, sparkline
//   built in — glyphs flicker through code characters near the cursor
//   code.   — scrambles into a one-line snippet; language depends on cursor position
// Safety: only transform/opacity/colour writes, letter widths locked, rAF only while active,
// particle cap, off when hidden/offscreen, reduced-motion = static, touch = one-shot on tap.

type Ch = { el: HTMLSpanElement; ch: string; cx: number; cy: number; w: number; vx: number; x: number; y: number; r: number };
type Word = { el: HTMLSpanElement; kind: string; chars: Ch[]; box: DOMRect; u: number; active: boolean; t0: number; extra?: any };
type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; s: number };

const ACC = '#A996FF', INK = '#F2F0EA', OK = '#3ECF8E', AMB = '#E8A33D', BLUE = '#4DA3FF', CORAL = '#FF8A65';
const CODE_CHARS = '{}[]()<>=;:/*&|_$#!~+.%';
const SNIPPETS: { lang: string; tokens: [string, string][] }[] = [
  { lang: 'typescript', tokens: [['render', AMB], ['({ ', '#A9A6B4'], ['fmt', INK], [': ', '#A9A6B4'], ["'9:16'", OK], [' })', '#A9A6B4']] },
  { lang: 'python', tokens: [['[', '#A9A6B4'], ['cut', INK], ['(h) ', AMB], ['for', ACC], [' h ', INK], ['in', ACC], [' hooks', INK], [']', '#A9A6B4']] },
  { lang: 'rust', tokens: [['impl', ACC], [' Motion ', INK], ['for', ACC], [' SaaS', AMB], [' {}', '#A9A6B4']] },
  { lang: 'go', tokens: [['go', ACC], [' ship', AMB], ['(', '#A9A6B4'], ['brief', INK], [')', '#A9A6B4'], [' // ✓', OK]] },
];

let cleanup: (() => void) | null = null;

export function initHeroPlay() {
  cleanup?.();
  cleanup = null;
  const h1 = document.querySelector<HTMLElement>('[data-hero-play]');
  if (!h1 || h1.dataset.play) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  const lowPower = (navigator.hardwareConcurrency || 4) <= 2 || (navigator as any).connection?.saveData;
  h1.dataset.play = '1';

  // ---------- build: accessible copy + decorated words ----------
  const label = h1.textContent!.replace(/\s+/g, ' ').trim();
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = label;
  const words: Word[] = [];
  const kindOf = (w: string) => {
    const k = w.toLowerCase().replace(/[^a-z]/g, '');
    return ({ motion: 'motion', design: 'design', for: 'for', saas: 'saas', built: 'built', in: 'built', code: 'code' } as Record<string, string>)[k] || 'plain';
  };
  const walk = (node: Node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent!.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'hp-w';
          w.setAttribute('aria-hidden', 'true');
          const kind = kindOf(tok);
          w.dataset.kind = kind;
          const chars: Ch[] = [];
          [...tok].forEach((c) => {
            const s = document.createElement('span');
            s.className = 'hp-c';
            s.textContent = c;
            s.dataset.c = c;
            w.appendChild(s);
            chars.push({ el: s, ch: c, cx: 0, cy: 0, w: 0, vx: 0, x: 0, y: 0, r: 0 });
          });
          words.push({ el: w, kind, chars, box: new DOMRect(), u: 0.5, active: false, t0: 0 });
          frag.appendChild(w);
        });
        n.parentNode!.replaceChild(frag, n);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(h1);
  h1.prepend(sr);
  h1.classList.add('hp-on');

  // particles canvas over the headline
  const cv = document.createElement('canvas');
  cv.className = 'hp-cv';
  cv.setAttribute('aria-hidden', 'true');
  h1.appendChild(cv);
  const ctx = cv.getContext('2d')!;
  const parts: P[] = [];
  const MAXP = lowPower ? 0 : 140;
  const dpr = Math.min(2, devicePixelRatio || 1);

  // overlays: design selection box, SaaS tooltip, code snippet
  const mk = (cls: string) => { const d = document.createElement('div'); d.className = cls; d.setAttribute('aria-hidden', 'true'); h1.appendChild(d); return d; };
  const sel = mk('hp-sel');
  sel.innerHTML = '<i></i><i></i><i></i><i></i><span class="hp-sel-l"></span>';
  const tip = mk('hp-tip');
  const spark = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  spark.setAttribute('class', 'hp-spark');
  spark.innerHTML = '<path fill="none" stroke="#3ECF8E" stroke-width="2" stroke-linecap="round"/>';
  h1.appendChild(spark);
  const snip = mk('hp-snip');

  // ---------- measure (reads only here) ----------
  let hb = h1.getBoundingClientRect();
  const measure = () => {
    hb = h1.getBoundingClientRect();
    cv.width = Math.ceil(hb.width * dpr) + 200 * dpr; cv.height = Math.ceil(hb.height * dpr) + 200 * dpr;
    cv.style.width = hb.width + 200 + 'px'; cv.style.height = hb.height + 200 + 'px';
    words.forEach((w) => {
      w.chars.forEach((c) => { c.el.style.width = ''; });
    });
    words.forEach((w) => {
      w.box = w.el.getBoundingClientRect();
      w.chars.forEach((c) => {
        const r = c.el.getBoundingClientRect();
        c.w = r.width; c.cx = r.left + r.width / 2 - hb.left; c.cy = r.top + r.height / 2 - hb.top;
      });
    });
    // lock widths so font/style swaps never reflow the line
    words.forEach((w) => w.chars.forEach((c) => { c.el.style.width = c.w + 'px'; }));
  };

  // ---------- pointer ----------
  let mx = -1e4, my = -1e4, pvx = 0, last = 0, running = false, visible = true;
  const hot = () => words.some((w) => w.active) || parts.length > 0;

  const onMove = (e: PointerEvent) => {
    const x = e.clientX - hb.left, y = e.clientY - hb.top;
    pvx = pvx * 0.6 + (x - mx) * 0.4; mx = x; my = y;
    words.forEach((w) => {
      const b = w.box, L = b.left - hb.left, T = b.top - hb.top;
      const inside = x >= L - 8 && x <= L + b.width + 8 && y >= T - 6 && y <= T + b.height + 6;
      if (inside && !w.active) { w.active = true; w.t0 = performance.now(); enter(w); }
      if (!inside && w.active) { w.active = false; leave(w); }
      if (inside) w.u = Math.min(1, Math.max(0, (x - L) / b.width));
    });
    start();
  };
  const onLeave = () => { mx = my = -1e4; words.forEach((w) => { if (w.active) { w.active = false; leave(w); } }); };

  // ---------- per-word enter/leave ----------
  function enter(w: Word) {
    const L = w.box.left - hb.left, T = w.box.top - hb.top;
    if (w.kind === 'design') {
      Object.assign(sel.style, { left: L - 6 + 'px', top: T + 'px', width: w.box.width + 12 + 'px', height: w.box.height + 'px' });
      sel.querySelector<HTMLElement>('.hp-sel-l')!.textContent = `design · ${Math.round(w.box.height * 0.82)}px`;
      sel.classList.add('on');
    }
    if (w.kind === 'saas') { tip.classList.add('on'); spark.classList.add('on'); }
    if (w.kind === 'code') codeIn(w);
  }
  function leave(w: Word) {
    w.chars.forEach((c) => { c.el.style.fontFamily = ''; c.el.style.fontWeight = ''; c.el.style.fontStyle = ''; c.el.style.color = ''; c.el.style.webkitTextStroke = ''; c.el.textContent = c.ch; c.el.classList.remove('hp-ghost'); });
    if (w.kind === 'design') sel.classList.remove('on');
    if (w.kind === 'saas') { tip.classList.remove('on'); spark.classList.remove('on'); }
    if (w.kind === 'code') codeOut(w);
  }

  // code: scramble into a snippet, language by cursor zone
  let codeLang = -1, scrambleT = 0;
  function codeIn(w: Word) { codeLang = -1; snip.classList.add('on'); w.chars.forEach((c) => c.el.classList.add('hp-ghost')); }
  function codeOut(w: Word) { codeLang = -1; snip.classList.remove('on'); snip.innerHTML = ''; w.chars.forEach((c) => c.el.classList.remove('hp-ghost')); }
  function renderSnippet(w: Word, t: number) {
    const zone = Math.min(SNIPPETS.length - 1, Math.floor(w.u * SNIPPETS.length));
    if (zone !== codeLang) { codeLang = zone; scrambleT = t; }
    const s = SNIPPETS[zone];
    const full = s.tokens.map((x) => x[0]).join('');
    const k = Math.min(1, (t - scrambleT) / 420);
    const solved = Math.floor(full.length * k);
    let i = 0, html = `<em>${s.lang}</em><code>`;
    for (const [tx, col] of s.tokens) {
      let out = '';
      for (const ch of tx) {
        out += i < solved || ch === ' ' ? ch : CODE_CHARS[(Math.random() * CODE_CHARS.length) | 0];
        i++;
      }
      html += `<span style="color:${col}">${out.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`;
    }
    html += '</code>';
    snip.innerHTML = html;
    const L = w.box.left - hb.left, T = w.box.top - hb.top;
    const size = Math.min(w.box.height * 0.36, (w.box.width * 1.45) / (full.length * 0.6));
    Object.assign(snip.style, { left: L + 'px', top: T + w.box.height * 0.5 + 'px', fontSize: size + 'px' });
    if (k < 1 && Math.random() < 0.5) emit(L + w.box.width * Math.random(), T + w.box.height * 0.5, ACC, 1);
  }

  // ---------- physics/frame ----------
  const emit = (x: number, y: number, c: string, n = 1) => {
    for (let i = 0; i < n && parts.length < MAXP; i++) {
      const a = Math.random() * Math.PI * 2, sp = 0.4 + Math.random() * 1.6;
      parts.push({ x, y, vx: Math.cos(a) * sp + pvx * 0.05, vy: Math.sin(a) * sp - 0.6, life: 0, max: 26 + Math.random() * 24, c, s: 0.8 + Math.random() * 1.4 });
    }
  };
  const PAL = [ACC, OK, AMB, BLUE, CORAL];

  function frame(t: number) {
    if (!visible) { running = false; return; }
    const dt = Math.min(2, (t - last) / 16.7 || 1); last = t;
    for (const w of words) {
      if (!w.active && w.kind !== 'motion' && w.kind !== 'saas') continue;
      const em = parseFloat(getComputedStyleCache(w.el)) || 100;
      w.chars.forEach((c, i) => {
        const dx = mx - c.cx, dy = my - c.cy;
        const d = Math.hypot(dx, dy);
        const near = w.active ? Math.max(0, 1 - d / (em * 1.1)) : 0;
        let tx = 0, ty = 0, rot = 0, sx = 1, sy = 1;
        switch (w.kind) {
          case 'motion': {
            // spring trail: letters lean and lift toward the cursor, weight follows proximity
            const target = w.active ? Math.max(-1, Math.min(1, dx / (em * 2))) * near * em * 0.12 : 0;
            c.vx += (target - c.x) * 0.12 * dt; c.vx *= 0.78; c.x += c.vx * dt;
            const ty0 = -near * em * 0.12 + Math.sin(t / 140 + i) * near * em * 0.02;
            c.y += (ty0 - c.y) * 0.2 * dt;
            tx = c.x; ty = c.y; rot = c.vx * 0.6;
            c.el.style.fontWeight = near > 0.55 ? '700' : near > 0.2 ? '500' : near > 0.02 ? '300' : '';
            if (near > 0.4 && Math.random() < 0.25 * near) emit(c.cx + tx, c.cy + ty - em * 0.3, Math.random() < 0.7 ? INK : ACC, 1);
            break;
          }
          case 'design': {
            const zone = w.u < 0.33 ? 0 : w.u < 0.66 ? 1 : 2;
            if (near > 0.15) {
              if (zone === 0) { c.el.style.color = 'transparent'; c.el.style.webkitTextStroke = '1.5px #F2F0EA'; c.el.style.fontStyle = ''; c.el.style.fontFamily = ''; }
              if (zone === 1) { c.el.style.color = '#F2F0EA'; c.el.style.webkitTextStroke = ''; c.el.style.fontFamily = '"Instrument Serif", serif'; c.el.style.fontStyle = 'italic'; }
              if (zone === 2) { c.el.style.color = PAL[(i + Math.floor(t / 260)) % PAL.length]; c.el.style.webkitTextStroke = ''; c.el.style.fontFamily = ''; c.el.style.fontStyle = ''; }
            } else { c.el.style.color = ''; c.el.style.webkitTextStroke = ''; c.el.style.fontFamily = ''; c.el.style.fontStyle = ''; }
            ty = -near * em * 0.04; sx = sy = 1 + near * 0.06;
            break;
          }
          case 'for': { sy = 1 - near * 0.35; sx = 1 + near * 0.2; ty = near * em * 0.12; break; }
          case 'saas': {
            // letters ride on bars (bar chart), values from cursor position
            const h = w.active ? near * em * (0.22 + 0.18 * Math.sin(i * 1.7 + t / 500)) : 0;
            c.r += (h - c.r) * 0.18 * dt;
            ty = -c.r;
            if (w.active && near > 0.5 && Math.random() < 0.12) emit(c.cx, c.cy - c.r - em * 0.35, OK, 1);
            break;
          }
          case 'built': {
            if (near > 0.25 && /[a-z]/i.test(c.ch)) {
              c.el.style.fontFamily = '"JetBrains Mono", monospace';
              c.el.textContent = Math.random() < 0.18 ? CODE_CHARS[(Math.random() * CODE_CHARS.length) | 0] : c.ch;
            } else { c.el.style.fontFamily = ''; c.el.textContent = c.ch; }
            ty = -near * em * 0.03;
            break;
          }
          case 'code': { break; }
        }
        c.el.style.transform = tx || ty || rot || sx !== 1 || sy !== 1 ? `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})` : '';
      });
      if (w.kind === 'saas' && w.active) {
        const L = w.box.left - hb.left, T = w.box.top - hb.top;
        const mrr = Math.round(8 + w.u * 34);
        tip.innerHTML = `<b>MRR +${mrr}%</b><span>${['churn ↓', 'trial → paid', 'expansion', 'NRR 118%'][Math.min(3, Math.floor(w.u * 4))]}</span>`;
        tip.style.left = mx + 'px'; tip.style.top = T - 10 + 'px';
        const pts = Array.from({ length: 24 }, (_, k) => { const px = (k / 23) * w.box.width; const py = Math.sin(k * 0.6 + t / 300) * 4 - (k / 23) * w.u * 14; return `${k ? 'L' : 'M'}${px.toFixed(1)},${(py + 18).toFixed(1)}`; }).join(' ');
        spark.querySelector('path')!.setAttribute('d', pts);
        Object.assign(spark.style, { left: L + 'px', top: T + w.box.height * 0.96 + 'px', width: w.box.width + 'px' });
      }
      if (w.kind === 'code' && w.active) renderSnippet(w, t);
    }
    // particles
    ctx.setTransform(dpr, 0, 0, dpr, 100 * dpr, 100 * dpr);
    ctx.clearRect(-100, -100, cv.width / dpr, cv.height / dpr);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.03 * dt; p.vx *= 0.98;
      if (p.life > p.max) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = 1 - p.life / p.max;
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x, p.y, p.s, p.s);
    }
    ctx.globalAlpha = 1;
    const settling = words.some((w) => w.chars.some((c) => Math.abs(c.x) > 0.1 || Math.abs(c.y) > 0.1 || Math.abs(c.r) > 0.1));
    if (hot() || settling) requestAnimationFrame(frame);
    else { running = false; words.forEach((w) => w.chars.forEach((c) => { c.el.style.transform = ''; c.el.style.fontWeight = ''; })); }
  }
  const fsCache = new WeakMap<Element, string>();
  function getComputedStyleCache(el: Element) { let v = fsCache.get(el); if (!v) { v = getComputedStyle(el).fontSize; fsCache.set(el, v); } return v; }
  function start() { if (!running && visible) { running = true; last = performance.now(); requestAnimationFrame(frame); } }

  // ---------- touch: one-shot demo per tapped word ----------
  const onTap = (e: PointerEvent) => {
    measure();
    const w = words.find((w) => { const b = w.box; return e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom; });
    if (!w) return;
    const b = w.box;
    let k = 0;
    w.active = true; enter(w);
    const sweep = () => {
      k += 0.025; w.u = Math.min(1, k);
      mx = b.left - hb.left + b.width * w.u; my = b.top - hb.top + b.height * 0.5;
      start();
      if (k < 1) requestAnimationFrame(sweep); else setTimeout(() => { w.active = false; leave(w); mx = my = -1e4; }, 500);
    };
    sweep();
  };

  // ---------- wiring ----------
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && hot()) start(); });
  io.observe(h1);
  const onVis = () => { visible = !document.hidden; };
  const onResize = () => measure();
  document.addEventListener('visibilitychange', onVis);
  addEventListener('resize', onResize);
  const ready = (document as any).fonts?.ready ?? Promise.resolve();
  // preload the alternate faces so the first hover does not swap late
  Promise.all(['700 1em "Space Grotesk"', '300 1em "Space Grotesk"', 'italic 400 1em "Instrument Serif"', '500 1em "JetBrains Mono"'].map((f) => (document as any).fonts?.load?.(f).catch(() => {}))).catch(() => {});
  ready.then(measure);
  // decide per pointer, not per device: hybrids have both mouse and touch
  h1.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') onTap(e); });
  h1.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') onMove(e); });
  h1.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') measure(); });
  h1.addEventListener('pointerleave', onLeave);

  cleanup = () => {
    io.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    removeEventListener('resize', onResize);
    running = false; visible = false;
  };
}

document.addEventListener('astro:before-swap', () => { cleanup?.(); cleanup = null; });
