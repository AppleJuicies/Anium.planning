# Setup (one time, about 20 minutes)

Two parts: put the app on GitHub Pages, then give it permission to use Google Drive.
Google's menu names change now and then, so a label may be slightly different from what's written here.

## Part 1 — GitHub Pages

1. On GitHub, create a new **public** repository named `design-workspace`.
   (Free GitHub Pages needs a public repo. Your projects are NOT stored in the repo — they live in your Google Drive — so nothing private is exposed.)
2. Upload everything in this folder to the repo (drag the files and the `src` folder onto the repo page, then **Commit changes**).
3. In the repo: **Settings → Pages**. Under *Build and deployment*, set **Source: Deploy from a branch**, **Branch: main**, folder **/ (root)**, then **Save**.
4. After about a minute your app is live at:
   `https://applejuicies.github.io/design-workspace/`

The app already works at this point — it saves in your browser. Part 2 adds Google Drive (sync across computers + share links).

## Part 2 — Google Drive

1. Go to **console.cloud.google.com** and sign in with the Google account whose Drive you want to use.
2. Top bar project picker → **New project** → name it `Design Workspace` → **Create**. Make sure it's selected.
3. **APIs & Services → Library** → search **Google Drive API** → **Enable**.
4. **Google Auth Platform** (or *OAuth consent screen*) → **Get started**:
   - App name: `Design Workspace`, support email: your email.
   - Audience: **External**.
   - Contact email: your email → **Create**.
   - **Data access → Add or remove scopes** → find `.../auth/drive.file` ("See, edit, create, and delete only the specific Google Drive files you use with this app") → **Update → Save**.
   - **Audience → Test users → Add users** → add your own Gmail address → **Save**. Leave the app in *Testing*.
5. **Clients** (or *Credentials → Create credentials → OAuth client ID*):
   - Application type: **Web application**, name: `Design Workspace web`.
   - **Authorized JavaScript origins → Add URI**: `https://applejuicies.github.io`
   - **Create** → copy the **Client ID** (ends in `.apps.googleusercontent.com`).
6. **APIs & Services → Credentials → Create credentials → API key** → copy it, then **Edit API key**:
   - Application restrictions: **Websites** → add `https://applejuicies.github.io/*`
   - API restrictions: **Restrict key** → choose **Google Drive API** → **Save**.
7. On GitHub, open `config.js` → pencil icon (Edit) → paste both values:
   ```js
   window.DW_CONFIG = {
     clientId: 'PASTE-CLIENT-ID.apps.googleusercontent.com',
     apiKey: 'PASTE-API-KEY'
   };
   ```
   **Commit changes**, wait about a minute, then reload the app.
8. In the app, click **Connect Google Drive** (bottom left). Google will say it "hasn't verified this app" — that's expected for a personal app: **Continue**.

Both values in `config.js` are designed to be public: the Client ID only works from your GitHub Pages address, and the API key is locked to your site and to the Drive API.

## Part 3 — Bring over your Claude version

1. Open your old Claude workspace → sidebar → **Download offline copy**.
2. In the new app → sidebar → **Import from a file…** → pick that file.

## Troubleshooting

- **Sign-in window doesn't appear:** allow pop-ups for `applejuicies.github.io`.
- **"Error 400: redirect_uri_mismatch" or "origin not allowed":** the JavaScript origin in step 5 must be exactly `https://applejuicies.github.io` (no trailing slash, no path).
- **Share link says "isn't available":** check the API key restrictions in step 6, and that sharing is switched on for that project.
- **"Access blocked: app not completed verification":** add your Gmail as a test user (step 4).
