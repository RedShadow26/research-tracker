export const config = { runtime: 'edge' };

const ALLOWED = new Set([
  // Commodities (OANDA)
  'OANDA:WTICOUSD','OANDA:BCOUSD','OANDA:XAUUSD','OANDA:XAGUSD',
  'OANDA:XPTUSD','OANDA:XCUUSD','OANDA:NATGASUSD',
  // Crypto (Binance)
  'BINANCE:BTCUSDT','BINANCE:ETHUSDT','BINANCE:SOLUSDT','BINANCE:XRPUSDT',
  'BINANCE:ADAUSDT','BINANCE:AVAXUSDT','BINANCE:LINKUSDT',
  // US Equities
  'AAPL','MSFT','NVDA','TSLA','META','GOOGL','AMZN','JPM','GS','SPY',
  // EU Equities (US-listed ADRs)
  'ASML','SAP','LVMHF','SIEGY','NSRGY',
]);

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status:204, headers:cors() });
  const sym = new URL(req.url).searchParams.get('symbol') || '';
  if (!ALLOWED.has(sym)) return json({ error:'Symbol not allowed' }, 400);
  const key = process.env.FINNHUB_KEY;
  if (!key) return json({ error:'Server misconfigured' }, 500);
  try {
    const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${key}`);
    return json(await r.json(), 200);
  } catch(e) { return json({ error:'Upstream error' }, 502); }
}

function cors() { return { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS' }; }
function json(d, s) { return new Response(JSON.stringify(d), { status:s, headers:{ 'Content-Type':'application/json',...cors() } }); }
