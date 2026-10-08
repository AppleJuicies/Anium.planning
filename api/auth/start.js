// Sends the browser to Google to approve Drive access (once per browser).
import { randomBytes } from 'node:crypto';
import { SCOPE, STATE, callbackURL, cookie, reply } from '../_session.js';

export function GET(request){
  const state = randomBytes(16).toString('base64url');
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: callbackURL(request),
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state
  });
  return reply(302, { location: 'https://accounts.google.com/o/oauth2/v2/auth?' + q, cookies: [cookie(STATE, state, 600)] });
}
