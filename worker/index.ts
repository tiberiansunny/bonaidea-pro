// Bonaidea site worker: static assets + POST /api/brief (contact form -> email + KV backup).
interface Env {
  ASSETS: Fetcher;
  EMAIL: { send: (msg: Record<string, unknown>) => Promise<unknown> };
  BRIEFS: KVNamespace;
}

const TO = 'dc@bonaidea.pro';
const FROM = 'brief@forms.bonaidea.pro';
const FIELDS = ['name', 'email', 'type', 'url', 'formats', 'budget', 'refs', 'goal'] as const;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : Array.isArray(v) ? v.map(String).join(', ').slice(0, n) : '');

async function handleBrief(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get('origin') || '';
  if (origin && !/^https:\/\/(www\.)?bonaidea\.pro$/.test(origin) && !origin.startsWith('http://localhost')) return json({ ok: false, error: 'origin' }, 403);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }

  // Honeypot: bots fill hidden fields. Pretend success.
  if (clip(body.website, 200)) return json({ ok: true });

  const d: Record<string, string> = {};
  for (const f of FIELDS) d[f] = clip(body[f], f === 'goal' || f === 'refs' ? 2000 : 300);
  const bonuses = clip(body.bonuses, 1000);

  if (!d.name || !d.type || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return json({ ok: false, error: 'invalid' }, 422);

  // Rate limit: 5 briefs per IP per hour.
  const ip = req.headers.get('cf-connecting-ip') || 'unknown';
  const rlKey = `rl:${ip}:${Math.floor(Date.now() / 3_600_000)}`;
  const count = Number((await env.BRIEFS.get(rlKey)) || 0);
  if (count >= 5) return json({ ok: false, error: 'rate_limited' }, 429);
  await env.BRIEFS.put(rlKey, String(count + 1), { expirationTtl: 3700 });

  const id = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomUUID().slice(0, 6);
  const record = { id, ...d, bonuses, country: (req as any).cf?.country || '', ua: clip(req.headers.get('user-agent'), 200) };
  await env.BRIEFS.put(`brief:${id}`, JSON.stringify(record));

  const rows: [string, string][] = [
    ['Name', d.name], ['Email', d.email], ['Need', d.type], ['Product', d.url], ['Formats', d.formats],
    ['Budget', d.budget], ['References', d.refs], ['Goal', d.goal], ['Unlocked bonuses', bonuses], ['Country', record.country],
  ];
  const filled = rows.filter(([, v]) => v);
  const text = filled.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nID: ${id}`;
  const html = `<div style="font:15px/1.5 -apple-system,Segoe UI,Arial,sans-serif;color:#111">
<h2 style="margin:0 0 12px;font-weight:600">New brief from bonaidea.pro</h2>
<table style="border-collapse:collapse">${filled.map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#666;vertical-align:top">${k}</td><td style="padding:6px 0;white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}</table>
<p style="color:#999;font-size:12px;margin-top:16px">ID ${id}. Reply to this email to answer the client.</p></div>`;

  try {
    await env.EMAIL.send({
      to: TO,
      from: { email: FROM, name: 'Bonaidea brief' },
      replyTo: d.email,
      subject: `Brief: ${d.type} — ${d.name}`,
      text,
      html,
    });
  } catch (e) {
    // Saved in KV anyway; tell the client it went through but log the failure.
    console.error('email send failed', id, String(e));
    return json({ ok: true, id, mail: false });
  }
  return json({ ok: true, id, mail: true });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/api/brief') {
      if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
      return handleBrief(req, env);
    }
    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;
