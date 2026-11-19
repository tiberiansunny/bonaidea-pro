import { initHeroPlay } from './hero-play';
// Site motion: Lenis smooth scroll, GSAP reveals, custom cursor, magnetic buttons.
// Respects prefers-reduced-motion; lighter on touch devices.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const EASE = 'expo.out'; // ≈ cubic-bezier(0.16,1,0.3,1)
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

let lenis: Lenis | null = null;
let cursorReady = false;
let ctx: gsap.Context | null = null;

function initLenis() {
  if (lenis || reduce()) return;
  lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4) });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function initCursor() {
  if (cursorReady || reduce() || !finePointer()) return;
  const el = document.querySelector<HTMLElement>('.cursor');
  if (!el) return;
  cursorReady = true;
  document.documentElement.classList.add('has-cursor');
  const x = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
  const y = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => { x(e.clientX); y(e.clientY); });
  document.addEventListener('pointerover', (e) => {
    const t = (e.target as HTMLElement).closest('a, button, [data-cursor]');
    el.classList.toggle('is-hover', !!t);
  });
}

function bindMagnetic(root: ParentNode) {
  if (reduce() || !finePointer()) return;
  root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((btn) => {
    if (btn.dataset.magBound) return;
    btn.dataset.magBound = '1';
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.3);
      yTo((e.clientY - r.top - r.height / 2) * 0.3);
    });
    btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

function splitLines(el: HTMLElement) {
  // Wrap each <br>-separated chunk (or the whole text) in mask spans.
  if (el.dataset.split) return;
  el.dataset.split = '1';
  const parts = el.innerHTML.split(/<br[^>]*>/i);
  el.innerHTML = parts.map((p) => `<span class="line"><span>${p.trim()}</span></span>`).join('');
}

function pageMotion() {
  ctx?.revert();
  ctx = gsap.context(() => {
    const lines = gsap.utils.toArray<HTMLElement>('[data-reveal="lines"]');
    lines.forEach(splitLines);

    if (reduce()) return;

    // Hero: lines rise from mask, 60 ms stagger
    const hero = document.querySelector('[data-hero]');
    if (hero) {
      const tl = gsap.timeline({ defaults: { ease: EASE } });
      tl.from(hero.querySelectorAll('.line > span'), { yPercent: 110, duration: 1.2, stagger: 0.06, onComplete: () => { hero.classList.add('is-live'); initHeroPlay(); } })
        .from(hero.querySelectorAll('[data-fade]'), { y: 24, opacity: 0, duration: 0.8, stagger: 0.08 }, '-=0.8');
    }

    // Scroll reveals
    gsap.utils.toArray<HTMLElement>('[data-reveal="lines"]:not([data-hero] *)').forEach((el) => {
      gsap.from(el.querySelectorAll('.line > span'), {
        yPercent: 110, duration: 1, stagger: 0.06, ease: EASE,
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });
    gsap.utils.toArray<HTMLElement>('[data-reveal="up"]').forEach((el) => {
      gsap.from(el, { y: 40, opacity: 0, duration: 0.8, ease: EASE, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });

    // Lens: big mark scales and its hole "focuses" while scrolling
    const lens = document.querySelector('[data-lens]');
    if (lens) {
      gsap.fromTo(lens, { scale: 1, rotate: 0 }, {
        scale: 1.15, rotate: -12, ease: 'none',
        scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true },
      });
    }

    // Horizontal parallax for marquee rows
    gsap.utils.toArray<HTMLElement>('[data-drift]').forEach((el) => {
      const dir = Number(el.dataset.drift || 1);
      gsap.fromTo(el, { xPercent: 0 }, {
        xPercent: -20 * dir, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    // Cards zoom in slightly on enter
    gsap.utils.toArray<HTMLElement>('[data-zoom]').forEach((el) => {
      gsap.fromTo(el, { scale: 0.92, opacity: 0.4 }, {
        scale: 1, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 55%', scrub: true },
      });
    });
  });
  bindMagnetic(document);
  ScrollTrigger.refresh();
}

export function initMotion() {
  initLenis();
  initCursor();
  document.addEventListener('astro:page-load', () => {
    lenis?.scrollTo(0, { immediate: true });
    pageMotion();
  });
}
