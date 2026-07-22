# Manual test plan — Mutual NDA Creator

This checklist covers things the automated suite (`npm test` for unit/component,
`npm run test:e2e` for Playwright) can't verify — mostly visual/subjective
judgment calls, cross-browser/device coverage beyond Chromium, and a few
known gaps worth confirming by hand before a release.

Run through this after any change to `components/`, `lib/fillCoverPage.ts`,
`lib/mutualNdaPdf.tsx`, or the layout (`app/page.tsx`, `app/layout.tsx`,
`NdaEditor.tsx`).

## 1. Visual QA — on-screen

- [ ] `npm run dev`, open http://localhost:3000 at a normal desktop width
      (~1440px). Form and preview should sit side by side, each with its
      own scrollbar, and the page itself should not have an outer scrollbar.
- [ ] Resize the window down through tablet width (~800px) to phone width
      (~390px). Below the `lg` breakpoint (1024px) the layout should switch
      to a single stacked column with the whole page scrolling normally —
      confirm there's no moment where content is clipped or a panel is
      stuck at 0 height during the transition.
- [ ] Toggle OS/browser dark mode. Every section (form fields, preview
      pane, buttons, error text) should have readable contrast in both
      modes — the automated suite doesn't check color/contrast.
- [ ] Tab through the entire form using only the keyboard (no mouse).
      Confirm focus order is sensible (top to bottom, Party 1 before Party
      2) and every field, radio, and the Download button gets a visible
      focus ring.
- [ ] With a screen reader (VoiceOver on macOS: Cmd+F5), navigate the MNDA
      Term and Term of Confidentiality fieldsets. Confirm the "year(s)"
      number input announces as "Number of years", not silently, and is
      announced as a separate control from the "Expires" radio (this is a
      regression test for a real bug fixed earlier — see
      `components/NdaForm.test.tsx`'s accessibility test for the automated
      half of this check; a screen reader is the only way to verify it
      actually *sounds* right).

## 2. Visual QA — the downloaded PDF

The automated suite verifies the PDF's *text content* (via `pdf-parse`) but
never looks at it. Actually open the downloaded file:

- [ ] Fill out the whole form with realistic data and download.
- [ ] Open the PDF in at least two different viewers (e.g. macOS Preview
      and Chrome's built-in PDF viewer / Adobe Reader) — rendering can
      differ subtly between engines.
- [ ] Confirm headings, bold text, and the checkbox list (☐/☑ as `[ ]`/`[x]`
      text markers) are legible and not overlapping.
- [ ] Confirm the signature table's columns are aligned and don't clip
      long values (try a long company name or email address).
- [ ] Confirm page breaks land in reasonable places (not mid-sentence in a
      way that's confusing, not splitting the signature table's header row
      from its body across a page boundary).
- [ ] Select and copy text out of the PDF — confirm it's real selectable
      text (this is the whole point of the react-pdf approach over a
      rasterized image) and pastes cleanly.
- [ ] Print the PDF (or print-preview it) and confirm it looks like a
      normal one-sided legal document, not cut off at the margins.

## 3. Known gap — non-Latin text in the PDF

`lib/mutualNdaPdf.tsx` uses react-pdf's default Helvetica font, which is a
built-in PDF standard font with **Latin-only glyph coverage**. No custom
font is registered.

- [ ] Enter a company name or notice address containing non-Latin
      characters (e.g. Chinese, Japanese, Cyrillic, or Arabic text) and
      download the PDF. Confirm what actually happens — likely blank boxes
      or missing glyphs where those characters should be — and file a
      follow-up if this needs to be supported (would require registering a
      Unicode-covering font via `Font.register`).
- [ ] Confirm the on-screen preview (which uses the browser's own font
      stack via `react-markdown`) renders the same text correctly, so this
      is specifically a PDF-generation gap, not a form/preview bug.

## 4. Cross-browser (E2E only runs Chromium)

`playwright.config.ts` only configures the `chromium` project. Spot-check
the primary flow (fill form → preview updates → download PDF) manually in:

- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari or Chrome on an actual phone (not just a resized
      desktop browser window) — real touch/date-picker input widgets differ
      from desktop.

## 5. Data-entry edge cases

- [ ] Paste rich/formatted text (e.g. copied from a Word doc or email)
      into a text field. Confirm it's treated as plain text, not broken.
- [ ] Enter a very long value in Modifications or a party's Notice Address
      (a few paragraphs) and confirm both the preview and the PDF wrap and
      paginate reasonably rather than overflowing.
- [ ] Rapidly double-click "Download .pdf". The button disables itself
      while generating (see `components/NdaPreview.tsx`) — confirm this
      actually prevents two simultaneous downloads rather than just
      visually looking disabled.
- [ ] Refresh the page after filling out the form. Confirm all fields reset
      to empty — there's no persistence by design (this is a prototype),
      but confirm that's what actually happens rather than some partial/
      stale state.

## 6. Deployment (out of scope for this prototype, but worth a reminder)

`next.config.ts` documents that this app reads `../templates/*.md` from
outside its own project root, and Turbopack's `outputFileTracingIncludes`
can't include files outside the project root. If this ever gets deployed
to a serverless target (e.g. Vercel) rather than run via `next dev`/a
long-running `next start`:

- [ ] Confirm the deploy actually has access to `templates/` at runtime —
      don't assume `next build` succeeding locally means the templates
      will be present in the deployed function's filesystem.
