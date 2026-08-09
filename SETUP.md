# T&M Prework Portal — Setup & Deploy Guide

Three levels are live (L1: 7 lessons, L2: 8, L3: 5). The app reads your
Google Sheet for login + access level, writes quiz responses back into
per-level tabs, and prints the student's name on the certificate.

## Files
- `index.html`      — the app (login, player, certificate)
- `course-data.js`  — all three levels' content (COURSE_L1/L2/L3)
- `Code.gs`         — Google Apps Script backend (paste into the Sheet)
- `assets/`         — images + audio
- `manifest.json`, `sw.js` — PWA files (unchanged)

## Your Sheet layout (roster tab)
A Instance | B School | C School Code | D Name | E ID | F Password | G Level
- Login matches **E (ID) + F (Password)**
- Access level comes from **G**
- **D (Name)** is printed on the certificate
Name the roster tab **Roster** (or edit `ROSTER_SHEET` at the top of Code.gs).

## STEP 1 — Deploy the backend (one time, ~5 min)
1. Open your Google Sheet.
2. **Extensions ▸ Apps Script**. Delete any starter code.
3. Paste the entire contents of `Code.gs`. Click the **Save** icon.
4. Click **Deploy ▸ New deployment**.
5. Gear icon ▸ choose **Web app**.
   - Description: `TM Prework`
   - Execute as: **Me**
   - Who has access: **Anyone**
6. **Deploy**. Approve the permissions prompt (choose your account ▸
   Advanced ▸ Go to project ▸ Allow).
7. Copy the **Web app URL** — it ends in `/exec`.

## STEP 2 — Wire the URL into the app
1. Open `index.html`, find near the top:
   `sheetURL: "",`
2. Paste your URL between the quotes:
   `sheetURL: "https://script.google.com/macros/s/AKfy..../exec",`
3. Save.

## STEP 3 — Push to GitHub
Upload/replace these in your `TMPREWORK` repo, then commit:
- `index.html`
- `course-data.js`
- everything new under `assets/`
(`Code.gs` and `SETUP.md` can live in the repo too — they're harmless.)

## How it behaves
- **Login:** student enters ID (col E) + Password (col F). Correct pair →
  taken to the level in col G. Wrong pair → clear error message.
- **Responses:** each answered quiz appends a row to `Responses_L1` /
  `Responses_L2` / `Responses_L3` (auto-created). Columns: Timestamp,
  Student ID, Name, Level, Lesson, Question, Answer, Correct.
- **Progress:** a `Progress` tab logs completion counts.
- **Certificate:** shows the Name from col D.
- **Adding students later:** just add a row in the Sheet. No code change.

## Updating videos
Video → YouTube links live in `index.html` under `CONFIG.videos`, split by
level (`1`, `2`, `3`). Edit an ID there if a video changes.

## Pilot mode (no backend)
If `sheetURL` is left `""`, the app runs in pilot mode: any ID + code
`TM2026` logs in to Level 1. Useful for a quick test before deploying.
