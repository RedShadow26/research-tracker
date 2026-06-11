export const config = { runtime: 'edge' };

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const anthropicKey = process.env.ANTHROPIC_KEY;
  if (!anthropicKey) return jsonResponse({ error: 'Server misconfigured' }, 500);

  let body;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }

  const { assetName, assetType, price, changePercent, headlines } = body;
  if (!assetName || !headlines?.length) return jsonResponse({ error: 'Missing fields' }, 400);

  const headlineText = headlines.slice(0, 14).join('\n');
  const priceContext = price ? `Current price: ${price} (${changePercent >= 0 ? '+' : ''}${changePercent?.toFixed(2)}% today)` : '';

  const prompt = `You are a concise macro analyst. Analyze ${assetName} (${assetType}).
${priceContext}

Recent headlines:
${headlineText}

Write 2-3 sentences explaining WHY this asset is moving right now — focus on macro drivers, catalysts, and context a trader needs to know. Be specific, not generic. No fluff.

Respond ONLY with valid JSON, no markdown:
{"analysis":"your analysis here","sentiment":"BULLISH"|"BEARISH"|"NEUTRAL","catalyst":"single most important driver in 5 words max"}`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await r.json();
    const text = data.content?.[0]?.text || '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return jsonResponse(parsed, 200);
  } catch (e) {
    return jsonResponse({ error: 'Analysis failed' }, 502);
  }
}
