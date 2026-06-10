export const config = { runtime: 'edge' };

const ALLOWED = new Set(['general','crypto','forex','merger']);

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status:204, headers:cors() });
  const cat = new URL(req.url).searchParams.get('category') || 'general';
  if (!ALLOWED.has(cat)) return json({ error:'Category not allowed' }, 400);
  const key = process.env.FINNHUB_KEY;
  if (!key) return json({ error:'Server misconfigured' }, 500);
  try {
    const r = await fetch(`https://finnhub.io/api/v1/news?category=${cat}&token=${key}`);
    const d = await r.json();
    return json(Array.isArray(d) ? d.slice(0,60) : [], 200);
  } catch(e) { return json({ error:'Upstream error' }, 502); }
}

function cors() { return { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS' }; }
function json(d, s) { return new Response(JSON.stringify(d), { status:s, headers:{ 'Content-Type':'application/json',...cors() } }); }
