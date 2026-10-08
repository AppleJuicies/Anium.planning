// Google sends the browser back here; the code is swapped for a long-lived refresh token.
import { SESSION, SESSION_AGE, STATE, callbackURL, clearCookie, cookie, googleToken, readCookies, reply, seal } from '../_session.js';

export async function GET(request){
  const url = new URL(request.url);
  const [saved, next] = (readCookies(request)[STATE] || '').split('.');
  const home = new URL(next === 'projects' ? '/projects.html' : '/', url).href;
  const back = (problem, cookies = []) => reply(302, { location: problem ? home + '?auth=' + problem : home, cookies: [clearCookie(STATE), ...cookies] });

  if(url.searchParams.get('error')) return back('cancelled');
  const state = url.searchParams.get('state'), code = url.searchParams.get('code');
  if(!code || !state || state !== saved) return back('failed');

  const t = await googleToken({ code, grant_type: 'authorization_code', redirect_uri: callbackURL(request) });
  if(!t.refresh_token){ console.error('auth callback: no refresh token', t.error || 'missing'); return back('failed'); }
  return back(null, [cookie(SESSION, seal(t.refresh_token), SESSION_AGE)]);
}
