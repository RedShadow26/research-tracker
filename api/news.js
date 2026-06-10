export const config = { runtime: 'edge' };

const ALLOWED = new Set(['AAPL','MSFT','NVDA','TSLA','META','GOOGL','AMZN','JPM','GS','SPY','ASML','SAP','LVMHF','SIEGY','NSRGY']);

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const sym = new URL(req.url).searchParams.get('symbol') || '';
  if (!ALLOWED.has(sym)) return jsonResponse({ error: 'Symbol not allowed' }, 400);

  const key = process.env.FINNHUB_KEY;
  if (!key) return jsonResponse({ error: 'Server misconfigured' }, 500);

  const to   = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  try {
    const r = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${sym}&from=${from}&to=${to}&token=${key}`);
    const d = await r.json();
    return jsonResponse(Array.isArray(d) ? d.slice(0, 30) : [], 200);
  } catch (e) {
    return jsonResponse({ error: 'Upstream error' }, 502);
  }
}
