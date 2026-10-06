// Shared helpers for the sign-in endpoints in api/auth/.
// The Google refresh token is stored encrypted in an HttpOnly cookie, so the browser keeps the
// sign-in but page scripts can't read it. Nothing is stored on the server.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export const SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const SESSION = '__Host-an_session';
export const STATE = '__Host-an_state';
export const SESSION_AGE = 400 * 24 * 60 * 60; // the longest a browser keeps a cookie

function key(){
  const secret = process.env.SESSION_SECRET;
  if(!secret || secret.length < 32) throw new Error('SESSION_SECRET is missing or too short');
  return createHash('sha256').update(secret).digest();
}

export function seal(text){
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString('base64url');
}

export function unseal(value){
  if(!value) return null;
  try {
    const b = Buffer.from(value, 'base64url');
    const d = createDecipheriv('aes-256-gcm', key(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8');
  } catch(e){ return null; }
}

export const cookie = (name, value, maxAge) => `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
export const clearCookie = name => cookie(name, '', 0);

export function readCookies(request){
  const out = {};
  for(const part of (request.headers.get('cookie') || '').split(';')){
    const i = part.indexOf('=');
    if(i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

export const callbackURL = request => new URL('/api/auth/callback', request.url).href;

// Rejects POSTs sent from other websites.
export const sameOrigin = request => {
  const o = request.headers.get('origin');
  return !o || o === new URL(request.url).origin;
};

export async function googleToken(params){
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, ...params })
    });
    return await r.json();
  } catch(e){ return { error: 'network' }; }
}

export function reply(status, { json, location, cookies = [] } = {}){
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  for(const c of cookies) headers.append('Set-Cookie', c);
  if(location) headers.set('Location', location);
  if(json) headers.set('Content-Type', 'application/json');
  return new Response(json ? JSON.stringify(json) : null, { status, headers });
}
