// Plan my day: sends the planner's request to Claude through Vercel AI Gateway and returns the plan as JSON.
// Only people signed in with Google (see api/auth/) can use it. Nothing is stored here.
import { createHash } from 'node:crypto';
import { getVercelOidcToken } from '@vercel/oidc';
import { SESSION, readCookies, reply, sameOrigin, unseal } from './_session.js';

const MODEL = process.env.PLAN_MODEL || 'anthropic/claude-sonnet-5.5';
const MAX_PROMPT = 40000;          // characters; a long day plus the timeline fits easily
const PER_HOUR = 30;               // plans per signed-in person per hour (per server instance)
const SYSTEM = 'You are the day planner inside Anium.planning. Follow the instructions in the message exactly. '
  + 'Reply with one JSON object and nothing else: no prose, no code fences.';

const recent = new Map();          // person -> times of recent plans
function allowed(person){
  const now = Date.now(), list = (recent.get(person) || []).filter(t => now - t < 3600000);
  if(list.length >= PER_HOUR){ recent.set(person, list); return false; }
  list.push(now); recent.set(person, list);
  if(recent.size > 5000) recent.clear();
  return true;
}

// Takes the JSON object out of the model's reply, even if it wrapped it in a code fence.
function readJSON(text){
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if(a < 0 || b <= a) return null;
  try { const v = JSON.parse(text.slice(a, b + 1)); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; }
  catch(e){ return null; }
}

export async function POST(request){
  if(!sameOrigin(request)) return reply(403, { json: { error: 'forbidden' } });
  const session = unseal(readCookies(request)[SESSION]);
  if(!session) return reply(401, { json: { error: 'signed_out' } });
  const person = createHash('sha256').update(session).digest('base64url').slice(0, 22);

  let body;
  try { body = await request.json(); } catch(e){ return reply(400, { json: { error: 'bad_request' } }); }
  const prompt = body && typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if(!prompt) return reply(400, { json: { error: 'bad_request' } });
  if(prompt.length > MAX_PROMPT) return reply(413, { json: { error: 'too_large' } });
  if(!allowed(person)) return reply(429, { json: { error: 'rate_limited' } });

  let token = process.env.AI_GATEWAY_API_KEY;
  if(!token){ try { token = await getVercelOidcToken(); } catch(e){ token = null; } }
  if(!token){ console.error('plan: no AI Gateway credentials'); return reply(503, { json: { error: 'not_configured' } }); }

  let r;
  try {
    r = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 4096, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }] }),
      signal: AbortSignal.timeout(110000)
    });
  } catch(e){ console.error('plan: gateway unreachable', e && e.name); return reply(502, { json: { error: 'unavailable' } }); }
  if(r.status === 429) return reply(429, { json: { error: 'rate_limited' } });
  if(!r.ok){
    let detail = ''; try { detail = (await r.text()).slice(0, 300); } catch(e){}
    console.error('plan: gateway error', r.status, detail);
    return reply(r.status === 401 || r.status === 403 ? 503 : 502, { json: { error: r.status === 401 || r.status === 403 ? 'not_configured' : 'unavailable' } });
  }
  let data;
  try { data = await r.json(); } catch(e){ return reply(502, { json: { error: 'unavailable' } }); }
  const text = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
  const plan = readJSON(typeof text === 'string' ? text : '');
  if(!plan) return reply(502, { json: { error: 'invalid_json' } });
  return reply(200, { json: { plan } });
}
