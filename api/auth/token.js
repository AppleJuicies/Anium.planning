// Gives the app a fresh one-hour Drive access token from the saved sign-in.
import { SESSION, SESSION_AGE, clearCookie, cookie, googleToken, readCookies, reply, sameOrigin, seal, unseal } from '../_session.js';

export async function POST(request){
  if(!sameOrigin(request)) return reply(403, { json: { error: 'forbidden' } });
  const refreshToken = unseal(readCookies(request)[SESSION]);
  if(!refreshToken) return reply(401, { json: { error: 'signed_out' } });

  const t = await googleToken({ grant_type: 'refresh_token', refresh_token: refreshToken });
  if(t.error === 'invalid_grant') return reply(401, { json: { error: 'signed_out' }, cookies: [clearCookie(SESSION)] });
  if(!t.access_token){ console.error('auth token: refresh failed', t.error || 'missing'); return reply(502, { json: { error: 'unavailable' } }); }

  // Re-issue the cookie so the sign-in lasts as long as the app keeps being used.
  return reply(200, { json: { access_token: t.access_token, expires_in: t.expires_in }, cookies: [cookie(SESSION, seal(refreshToken), SESSION_AGE)] });
}
