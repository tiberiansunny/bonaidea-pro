// Case list. Add `video` (/media/xxx.mp4, H.264, ≤10 MB) and `poster` when a case is ready.
export interface Work { slug: string; title: string; tags: string; video?: string; poster?: string; }

export const works: Work[] = [
  { slug: 'saas-promo-01', title: 'SaaS product promo', tags: 'promo · 15 s · 16:9' },
  { slug: 'ad-variants-01', title: 'Ad variant pack', tags: 'ads · 12 variants · 9:16' },
  { slug: 'feature-explainer-01', title: 'Feature explainer', tags: 'explainer · 30 s' },
  { slug: 'motion-kit-01', title: 'Brand motion kit', tags: 'kit · remotion' },
];
