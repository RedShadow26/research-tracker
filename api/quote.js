
export const config = { runtime: 'edge' };

const ALLOWED_SYMBOLS = new Set([
  // Equities
  'AAPL','TSLA','NVDA','AMZN',
  // Crypto (Finnhub format)
  'BINANCE:BTCUSDT','BINANCE:ETHUSDT','BINANCE:SOLUSDT',
  // Forex/Commodities
  'OANDA:WTICOUSD','OANDA:XAUUSD','OANDA:XAGUSD','OANDA:NATGASUSD',
]);

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url  = new URL(req.url);
  const sym  = url.searchParams.get('symbol') || '';

  if (!ALLOWED_SYMBOLS.has(sym)) {
    return json({ error: 'Symbol not allowed' }, 400);
  }

  const apiKey = process.env.FINNHUB_KEY;
  if (!apiKey) return json({ error: 'Server misconfigured' }, 500);

  try {
    const fhUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${apiKey}`;
    const res   = await fetch(fhUrl);
    const data  = await res.json();
    return json(data, 200);
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
