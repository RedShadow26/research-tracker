export const config = { runtime: 'edge' };

const SUPABASE_URL = 'https://umutzcmbmbkxibtwxonx.supabase.co';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });

  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const sbKey = process.env.SUPABASE_SERVICE_KEY;
  if (!sbKey) return jsonResponse({ error: 'Server misconfigured' }, 500);

  const sbHeaders = {
    'Content-Type': 'application/json',
    'apikey': sbKey,
    'Authorization': `Bearer ${sbKey}`,
    'Prefer': 'return=representation',
  };

  // GET posts for an asset
  if (req.method === 'GET' && action === 'posts') {
    const sym = url.searchParams.get('sym') || '';
    if (!sym) return jsonResponse({ error: 'Missing sym' }, 400);
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/community_posts?sym=eq.${sym}&order=created_at.desc&limit=50&select=*,community_replies(count)`,
      { headers: sbHeaders }
    );
    const data = await r.json();
    return jsonResponse(data);
  }

  // GET replies for a post
  if (req.method === 'GET' && action === 'replies') {
    const postId = url.searchParams.get('post_id') || '';
    if (!postId) return jsonResponse({ error: 'Missing post_id' }, 400);
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/community_replies?post_id=eq.${postId}&order=created_at.asc`,
      { headers: sbHeaders }
    );
    return jsonResponse(await r.json());
  }

  // POST new post
  if (req.method === 'POST' && action === 'post') {
    let body;
    try { body = await req.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }
    const { sym, content, username } = body;
    if (!sym || !content || !username) return jsonResponse({ error: 'Missing fields' }, 400);
    if (content.length > 500) return jsonResponse({ error: 'Too long' }, 400);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/community_posts`, {
      method: 'POST',
      headers: sbHeaders,
      body: JSON.stringify({ sym, content: content.trim(), username }),
    });
    return jsonResponse(await r.json(), 201);
  }

  // POST new reply
  if (req.method === 'POST' && action === 'reply') {
    let body;
    try { body = await req.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }
    const { post_id, content, username } = body;
    if (!post_id || !content || !username) return jsonResponse({ error: 'Missing fields' }, 400);
    if (content.length > 300) return jsonResponse({ error: 'Too long' }, 400);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/community_replies`, {
      method: 'POST',
      headers: sbHeaders,
      body: JSON.stringify({ post_id, content: content.trim(), username }),
    });
    return jsonResponse(await r.json(), 201);
  }

  // POST upvote
  if (req.method === 'POST' && action === 'upvote') {
    let body;
    try { body = await req.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }
    const { post_id } = body;
    if (!post_id) return jsonResponse({ error: 'Missing post_id' }, 400);
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/increment_upvote`,
      { method: 'POST', headers: sbHeaders, body: JSON.stringify({ row_id: post_id }) }
    );
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: 'Not found' }, 404);
}
