# Anium.planning

A Notion-style workspace for planning a design with your boss: mood board → narrow the scope → schedule → notes.

**App:** https://anium-planning.vercel.app/  ·  **First time?** See [SETUP.md](SETUP.md)  ·  [Privacy](privacy.html)

## How it works

- **Projects** live in the sidebar. Each has four tabs: Mood board, Narrow scope, Gantt, Notes.
- **Sign in once.** Connecting Google Drive keeps that browser signed in, so projects load by themselves every time the app opens.
- **Gantt: Timeline or Board.** The timeline shows the 2-week schedule; the board shows the same tasks as cards, by phase or by progress (To do / In progress / Done). Drag phases, tasks and cards to reorganise them in either view.
- **Saving is automatic.** Without Google Drive connected, it saves in your browser. With Drive connected, every project is a folder in `My Drive / Anium.planning`, with its pictures as normal image files.
- **Sharing is per project.** Share → turn on *Anyone with the link can view* → copy the link. Viewers don't need a Google account, can't edit, and can download a copy. Your other projects stay private. Turning sharing off stops the link working.
- **Download a copy** gives one `.html` file of a project (pictures included) that opens in any browser, even offline.
- **History** keeps up to 30 versions per tab; edits within 10 minutes of each other are grouped.
- **Pictures:** every picture is saved as the app's own copy (in your Drive), even ones from Pinterest or other sites, so they never disappear. Upload, paste a picture or page address, paste a copied picture (Ctrl/⌘+V), or drag files in. On Narrow scope, click a picture to move/zoom it and draw arrows, boxes, text, and freehand.

## Files

| Path | What it is |
|---|---|
| `index.html` | The built app (everything in one file). Don't edit by hand. |
| `privacy.html` | Privacy policy, linked from Google's sign-in screen. |
| `api/image.js` | Picture fetcher on Vercel: downloads pictures from other sites (Pinterest pins included) so the app always keeps its own copy. |
| `api/auth/` | Sign-in service on Vercel: keeps each browser signed in to Google and hands the app short-lived Drive access. |
| `config.js` | Your Google Client ID + API key. |
| `src/app.js` | App code, split into sections: core, storage (browser + Drive), one module per tab, shell. |
| `src/app.css` | Styles (light/dark tokens at the top). |
| `src/bridge.js` | Connects the mood board and Gantt templates to the app. |
| `src/templates/` | Your `moodboard.html` (one change: a picture dragged from another site uses the picture itself, at its largest size) and `gantt.html` (changes: the plan is pinned to a start date you pick; a Board view grouped by phase or by progress; drag-and-drop to reorder phases and tasks; an "In progress" status). |
| `src/build.py` | Rebuilds `index.html` from `src/`: `python3 src/build.py` |
