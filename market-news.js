export const config = { runtime: 'edge' };

const ALLOWED_CATEGORIES = new Set(['general', 'crypto', 'forex', 'merger']);

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url      = new URL(req.url);
  const category = url.searchParams.get('category') || 'general';

  if (!ALLOWED_CATEGORIES.has(category)) {
    return json({ error: 'Category not allowed' }, 400);
  }

  const apiKey = process.env.FINNHUB_KEY;
  if (!apiKey) return json({ error: 'Server misconfigured' }, 500);

  try {
    const fhUrl = `https://finnhub.io/api/v1/news?category=${category}&token=${apiKey}`;
    const res   = await fetch(fhUrl);
    const data  = await res.json();
    return json(Array.isArray(data) ? data.slice(0, 50) : [], 200);
  } catch (e) {
    return json({ error: 'Upstream error' }, 502);
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
