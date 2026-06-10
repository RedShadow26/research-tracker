export const config = { runtime: 'edge' };

const ALLOWED = new Set([
  'OANDA:WTICOUSD','OANDA:BCOUSD','OANDA:XAUUSD','OANDA:XAGUSD',
  'OANDA:XPTUSD','OANDA:XCUUSD','OANDA:NATGASUSD',
  'BINANCE:BTCUSDT','BINANCE:ETHUSDT','BINANCE:SOLUSDT','BINANCE:XRPUSDT',
  'BINANCE:ADAUSDT','BINANCE:AVAXUSDT','BINANCE:LINKUSDT',
  'AAPL','MSFT','NVDA','TSLA','META','GOOGL','AMZN','JPM','GS','SPY',
  'ASML','SAP','LVMHF','SIEGY','NSRGY',
]);

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

  try {
    const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${key}`);
    return jsonResponse(await r.json(), 200);
  } catch (e) {
    return jsonResponse({ error: 'Upstream error' }, 502);
  }
}
