# bonaidea.pro

Site of **Bonaidea** — motion design for SaaS, built in code.

Stack: Astro · GSAP (ScrollTrigger) · Lenis · Astro View Transitions. Brand tokens from the Bonaidea brand book (Studio Dark).

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
```

## Deploy (Cloudflare Pages)
- Framework preset: Astro · Build command: `npm run build` · Output: `dist` · Env: `NODE_VERSION=22`
- Custom domain: `www.bonaidea.pro`; apex `bonaidea.pro` → 301 to www.

## Content
- Cases: `src/data/works.ts`; videos to `public/media/` (H.264 MP4, ≤10 MB each, plus poster).
- Pages: `src/pages/` (home, work, services, contact, 404).
- Motion: `src/scripts/motion.ts` (respects `prefers-reduced-motion`).
