# Anium.planning

A day planner: tell Claude what you need to do and it lays out your day hour by hour, keeps a timeline of every
longer task, and remembers what you got done.

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

## Files

| Path | What it is |
|---|---|
| `index.html` | The built app (everything in one file). Don't edit by hand. |
| `privacy.html` | Privacy policy, linked from Google's sign-in screen. |
| `api/auth/` | Sign-in service: keeps each browser signed in to Google and hands the app short-lived Drive access. |
| `api/plan.js` | Plan my day: asks Claude (through Vercel AI Gateway) for a plan. Signed-in users only. |
| `vendor/` | PptxGenJS (MIT), used to build the status slides. |
| `src/app.js` | App code: core, dates, data, storage (browser + Drive sync), Day, Past days, Timeline, search, Plan my day, Google. |
| `src/app.css` | Styles (light/dark tokens at the top). |
| `src/build.py` | Rebuilds `index.html` from `src/`: `python3 src/build.py` |
