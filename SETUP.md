# Setup (one time, about 30 minutes)

Two parts: put the app on Vercel, then give it permission to use Google Drive.
Google's menu names change now and then, so a label may be slightly different from what's written here.

The app is live at `https://anium-planning.vercel.app/`. Vercel serves the files in this folder plus a small
sign-in service (`api/auth/`) that keeps each browser signed in to Google, and a planning service (`api/plan.js`)
that asks Claude for Plan my day.

## Part 1 — Vercel

1. Install the Vercel CLI and sign in: `npm i -g vercel`, then `vercel login`.
2. In this folder: `vercel link --project anium-planning` (creates the project the first time).
3. Deploy: `vercel deploy --prod`.

The app already works at this point — it saves in your browser. Part 2 adds Google Drive (sync across computers),
and Part 3 turns on Plan my day.

## Part 2 — Google Drive

1. Go to **console.cloud.google.com** and sign in with the Google account whose Drive you want to use.
2. Top bar project picker → **New project** → name it `Anium` → **Create**. Make sure it's selected.
3. **APIs & Services → Library** → search **Google Drive API** → **Enable**.
4. **Google Auth Platform** (or *OAuth consent screen*) → **Get started**:
   - App name: `Anium.planning`, support email: your email.
   - Audience: **External**.
   - Contact email: your email → **Create**.
   - **Branding**: home page `https://anium-planning.vercel.app/`, privacy policy `https://anium-planning.vercel.app/privacy.html` → **Save**.
   - **Data access → Add or remove scopes** → find `.../auth/drive.file` ("See, edit, create, and delete only the specific Google Drive files you use with this app") → **Update → Save**.
   - **Audience → Test users → Add users** → add the Gmail address of everyone who should be able to connect Drive → **Save**.
5. **Clients** (or *Credentials → Create credentials → OAuth client ID*):
   - Application type: **Web application**, name: `Anium web`.
   - **Authorized redirect URIs → Add URI**: `https://anium-planning.vercel.app/api/auth/callback`
   - **Create** → copy the **Client ID** (ends in `.apps.googleusercontent.com`) and the **Client secret**.
6. Give the sign-in service its settings (run in this folder; each command asks you to paste the value):
   ```bash
   vercel env add GOOGLE_CLIENT_ID production
   vercel env add GOOGLE_CLIENT_SECRET production --sensitive
   openssl rand -base64 48 | tr -d '\n' | vercel env add SESSION_SECRET production --sensitive
   ```
   The client secret and session secret are private: never put them anywhere in the repo.
7. Deploy again: `vercel deploy --prod`.
8. In the app, click **Connect Drive** (top right) and approve. That browser stays signed in from then on.

## Part 3 — Plan my day (Claude)

Plan my day calls Claude (`anthropic/claude-sonnet-5.5`) through **Vercel AI Gateway**. On Vercel it signs in with
the project's own OIDC token, so there's no key to create. AI Gateway usage is billed to your Vercel team; see
**Vercel dashboard → AI Gateway** for credits, spend and budgets.

- To use your own key instead: create one under **AI Gateway → API Keys**, then
  `vercel env add AI_GATEWAY_API_KEY production --sensitive` and deploy again.
- To use a different model: `vercel env add PLAN_MODEL production` (for example `anthropic/claude-haiku-5.5`).
- Only people signed in with Google can plan, up to 30 plans an hour each.

## Troubleshooting

- **"Error 400: redirect_uri_mismatch":** the redirect URI in step 5 must be exactly `https://anium-planning.vercel.app/api/auth/callback`.
- **"Google sign-in didn't finish":** check that `GOOGLE_CLIENT_SECRET` and `SESSION_SECRET` are set (`vercel env ls`), then deploy again. `vercel logs` shows the reason.
- **Plan my day says it isn't set up:** check **AI Gateway** is available for the team in the Vercel dashboard, then `vercel logs` for `plan:` lines.
- **"Access blocked: app not completed verification":** add that person's Gmail as a test user (step 4).
- **Asked to sign in again every week:** Google limits sign-ins to 7 days while the app is in *Testing*. Publishing the app (**Audience → Publish app**) removes the limit.
