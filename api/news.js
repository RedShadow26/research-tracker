export const config = { runtime: 'edge' };

const ALLOWED = new Set(['AAPL','MSFT','NVDA','TSLA','META','GOOGL','AMZN','JPM','GS','SPY','ASML','SAP','LVMHF','SIEGY','NSRGY']);

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status:204, headers:cors() });
  const sym = new URL(req.url).searchParams.get('symbol') || '';
  if (!ALLOWED.has(sym)) return json({ error:'Symbol not allowed' }, 400);
  const key = process.env.FINNHUB_KEY;
  if (!key) return json({ error:'Server misconfigured' }, 500);
  const to   = new Date().toISOString().slice(0,10);
  const from = new Date(Date.now() - 7*86400000).toISOString().slice(0,10);
  try {
    const r = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${sym}&from=${from}&to=${to}&token=${key}`);
    const d = await r.json();
    return json(Array.isArray(d) ? d.slice(0,30) : [], 200);
  } catch(e) { return json({ error:'Upstream error' }, 502); }
}

function cors() { return { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS' }; }
function json(d, s) { return new Response(JSON.stringify(d), { status:s, headers:{ 'Content-Type':'application/json',...cors() } }); }    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
