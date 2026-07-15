# Mutual NDA Creator

A prototype Next.js app (PL-3) that lets a user fill in a form and generates
a completed Common Paper Mutual Non-Disclosure Agreement, with a live
preview and a "Download .md" button.

## How it works

- The source content — `Mutual-NDA-coverpage.md` and `Mutual-NDA.md` — is
  read at request time from the repo-level [`../templates/`](../templates)
  directory (`lib/loadTemplates.ts`), not copied into this app. That
  directory is the single source of truth for the underlying CommonPaper
  agreement text.
- `lib/fillCoverPage.ts` fills in the cover page by replacing exact, known
  anchor strings in that template (it isn't authored with a generic
  `{{placeholder}}` syntax) — dates, purpose, term checkboxes, governing
  law/jurisdiction, and the signature table. If the template's text ever
  changes upstream and an anchor no longer matches, this throws immediately
  rather than silently producing a half-filled document.
- `lib/buildDocument.ts` combines the filled cover page with the (unedited)
  Standard Terms body, stripping the `coverpage_link` presentational
  `<span>` tags.
- The whole editor (`components/NdaEditor.tsx`) is a Client Component:
  form state lives in React state, and the assembled document markdown is
  recomputed and re-rendered (via `react-markdown` + `remark-gfm`) on every
  keystroke.
- Download is client-side only — a `Blob` + temporary `<a download>`, no
  backend route.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Known limitation

This app reads `../templates/*.md` (outside its own project root) via
`fs.readFile`. That works fine for `next dev` / `next build` locally, but
Turbopack's `outputFileTracingIncludes` refuses globs that navigate outside
the project root, so there's currently no supported way to include those
files in a serverless deploy bundle (e.g. Vercel). Deploying this for real
would need the two template files copied into `frontend/` (or served from
elsewhere) instead of read from the sibling directory. See the comment in
`next.config.ts`.
