// Signs this browser out and tells Google to cancel the app's access.
import { SESSION, clearCookie, readCookies, reply, sameOrigin, unseal } from '../_session.js';

export async function POST(request){
  if(!sameOrigin(request)) return reply(403, { json: { error: 'forbidden' } });
  const refreshToken = unseal(readCookies(request)[SESSION]);
  if(refreshToken){
    try { await fetch('https://oauth2.googleapis.com/revoke', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token: refreshToken }) }); } catch(e){}
  }
  return reply(200, { json: { ok: true }, cookies: [clearCookie(SESSION)] });
}
