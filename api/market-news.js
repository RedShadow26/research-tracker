export const config = { runtime: 'edge' };

const ALLOWED = new Set(['general', 'crypto', 'forex', 'merger']);

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

  const cat = new URL(req.url).searchParams.get('category') || 'general';
  if (!ALLOWED.has(cat)) return jsonResponse({ error: 'Category not allowed' }, 400);

  const key = process.env.FINNHUB_KEY;
  if (!key) return jsonResponse({ error: 'Server misconfigured' }, 500);

  try {
    const r = await fetch(`https://finnhub.io/api/v1/news?category=${cat}&token=${key}`);
    const d = await r.json();
    return jsonResponse(Array.isArray(d) ? d.slice(0, 60) : [], 200);
  } catch (e) {
    return jsonResponse({ error: 'Upstream error' }, 502);
  }
}
