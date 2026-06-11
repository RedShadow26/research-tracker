export const config = { runtime: 'edge' };
const SB = 'https://umutzcmbmbkxibtwxonx.supabase.co';

function cors() { return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'}; }
function json(d,s=200){ return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...cors()}}); }

export default async function handler(req) {
  if (req.method==='OPTIONS') return new Response(null,{status:204,headers:cors()});
  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!key) return json({error:'misconfigured'},500);
  const h = {'Content-Type':'application/json','apikey':key,'Authorization':`Bearer ${key}`,'Prefer':'return=representation'};

  // GET posts
  if (req.method==='GET' && action==='posts') {
    const sym = url.searchParams.get('sym')||'';
    if (!sym) return json({error:'missing sym'},400);
    const r = await fetch(`${SB}/rest/v1/community_posts?sym=eq.${sym}&order=created_at.desc&limit=50&select=*,community_replies(count)`,{headers:h});
    return json(await r.json());
  }

  // GET replies
  if (req.method==='GET' && action==='replies') {
    const pid = url.searchParams.get('post_id')||'';
    if (!pid) return json({error:'missing post_id'},400);
    const r = await fetch(`${SB}/rest/v1/community_replies?post_id=eq.${pid}&order=created_at.asc`,{headers:h});
    return json(await r.json());
  }

  // POST post
  if (req.method==='POST' && action==='post') {
    let b; try{b=await req.json();}catch{return json({error:'bad json'},400);}
    const {sym,content,username}=b;
    if (!sym||!content||!username) return json({error:'missing fields'},400);
    if (content.length>500) return json({error:'too long'},400);
    const r = await fetch(`${SB}/rest/v1/community_posts`,{method:'POST',headers:h,body:JSON.stringify({sym,content:content.trim(),username,upvotes:0,downvotes:0})});
    return json(await r.json(),201);
  }

  // POST reply
  if (req.method==='POST' && action==='reply') {
    let b; try{b=await req.json();}catch{return json({error:'bad json'},400);}
    const {post_id,content,username}=b;
    if (!post_id||!content||!username) return json({error:'missing fields'},400);
    if (content.length>300) return json({error:'too long'},400);
    const r = await fetch(`${SB}/rest/v1/community_replies`,{method:'POST',headers:h,body:JSON.stringify({post_id,content:content.trim(),username})});
    return json(await r.json(),201);
  }

  // POST vote (up/down/remove)
  if (req.method==='POST' && action==='vote') {
    let b; try{b=await req.json();}catch{return json({error:'bad json'},400);}
    const {post_id, direction, prev_direction} = b;
    if (!post_id) return json({error:'missing post_id'},400);

    // Get current counts
    const gr = await fetch(`${SB}/rest/v1/community_posts?id=eq.${post_id}&select=upvotes,downvotes`,{headers:h});
    const [post] = await gr.json();
    if (!post) return json({error:'not found'},404);

    let {upvotes=0, downvotes=0} = post;

    // Remove previous vote
    if (prev_direction===1) upvotes=Math.max(0,upvotes-1);
    if (prev_direction===-1) downvotes=Math.max(0,downvotes-1);

    // Apply new vote
    if (direction===1) upvotes++;
    if (direction===-1) downvotes++;

    await fetch(`${SB}/rest/v1/community_posts?id=eq.${post_id}`,{
      method:'PATCH',headers:{...h,'Prefer':'return=minimal'},
      body:JSON.stringify({upvotes,downvotes}),
    });
    return json({upvotes,downvotes});
  }

  return json({error:'not found'},404);
}
