# Anium.planning

A planning workspace with two parts:

- **The planner** (`index.html`): tell Claude what you need to do and it lays out your day hour by hour, keeps a
  timeline of every longer task, and remembers what you got done.
- **Projects** (`projects.html`): a mood board, Narrow scope (compare design options) and notes for each project.

Tabs at the top of both pages switch between them: Day · Past days · Timeline · Mood board · Narrow scope · Notes.

**App:** https://anium-planning.vercel.app/  ·  **First time?** See [SETUP.md](SETUP.md)  ·  [Privacy](privacy.html)

## How it works

- **Day.** An hour-by-hour Gantt chart for one day. Drag a block to move it, drag its ends to change the time,
  click it for details. Big blocks have **steps** you can check off, add or delete. ← / → move between days.
- **Plan my day.** Type your list in plain words ("standup at 9:30, finish the bracket CAD, order bearings, the
  test report will take all week"). Claude lays out the blocks, breaks big work into steps, fits in what you didn't
  finish yesterday, and puts multi-day work on the Timeline. You review every change before it's applied.
- **Past days.** Each day you've planned, with what you finished, the hours, and what was left over.
- **Timeline.** Every task you've ever planned, from your first day onward, grouped by phase. Zoom by days, weeks
  or months. Click a task for its dates, status, notes, the days you worked on it, and its **files and links**.
- **Search** (`/` or ⌘K) finds tasks, day blocks, steps, notes and file names.
- **Progress.** A status report (one Google Doc, rewritten each time you open it) and status slides (Google Slides),
  for Gemini, NotebookLM, or your boss.
- **Saving is automatic.** Without Google Drive it saves in your browser. With Drive connected it saves to
  `My Drive / Anium.planning / planner.json` and syncs across your devices; attachments go in `Attachments`.
- Gantt tasks from the earlier version of the app are brought onto the Timeline the first time you sign in.

### Projects

- **Projects** live in the sidebar of the projects page. Each has three tabs: Mood board, Narrow scope, Notes.
  (A project's schedule is on the planner's Timeline.)
- **Pictures:** every picture is saved as the app's own copy (in your Drive), even ones from Pinterest or other
  sites. Upload, paste a picture or page address, paste a copied picture (Ctrl/⌘+V), or drag files in. On Narrow
  scope, click a picture to move/zoom it and draw arrows, boxes, text, and freehand.
- **Sharing is per project.** Share → turn on *Anyone with the link can view* → copy the link. Viewers don't need
  a Google account, can't edit, and can download a copy.
- **Download a copy** gives one `.html` file of a project (pictures included) that opens in any browser, offline.
- **History** keeps up to 30 versions per tab; edits within 10 minutes of each other are grouped.
- **Progress** on a project makes a status report and slides from its mood board, options and notes.

## Files

| Path | What it is |
|---|---|
| `index.html` | The built app (everything in one file). Don't edit by hand. |
| `privacy.html` | Privacy policy, linked from Google's sign-in screen. |
| `api/auth/` | Sign-in service: keeps each browser signed in to Google and hands the app short-lived Drive access. |
| `api/plan.js` | Plan my day: asks Claude (through Vercel AI Gateway) for a plan. Signed-in users only. |
| `api/image.js` | Picture fetcher: downloads pictures from other sites (Pinterest pins included) so projects keep their own copy. |
| `config.js` | Google API key (used to open shared project links) and Client ID. |
| `vendor/` | PptxGenJS (MIT), used to build the status slides. |
| `src/planner/` | The planner's code (`app.js`) and styles (`app.css`): Day, Past days, Timeline, search, Plan my day, Drive sync. |
| `src/app.js`, `src/app.css` | The projects page: storage (browser + Drive), one module per tab, sharing, reports. |
| `src/bridge.js`, `src/templates/` | The mood board (and the old Gantt) templates, and what connects them to the projects page. |
| `src/build.py` | Rebuilds `index.html` and `projects.html` from `src/`: `python3 src/build.py` |
