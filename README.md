# bonaidea.pro

Site of **Bonaidea** — motion design for SaaS, built in code.

Stack: Astro · GSAP (ScrollTrigger) · Lenis · Astro View Transitions. Brand tokens from the Bonaidea brand book (Studio Dark).

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
```

## Deploy (Cloudflare)
- Hosting: Cloudflare Workers static assets (`wrangler.jsonc`), custom domains www.bonaidea.pro + bonaidea.pro (301 → www via redirect rule).
- Deploy: `npm run deploy` (needs CLOUDFLARE_API_TOKEN). Analytics: Cloudflare Web Analytics (cookieless).

## Content
- Cases: `src/data/works.ts`; videos to `public/media/` (H.264 MP4, ≤10 MB each, plus poster).
- Pages: `src/pages/` (home, work, services, contact, 404).
- Motion: `src/scripts/motion.ts` (respects `prefers-reduced-motion`).
