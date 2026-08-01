# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation covers all 11 document types via a chat-first flow that figures out which document the user wants before filling it in (with a manual form still available as a fallback/edit panel), with real password-based authentication and per-user document persistence (still backed by the ephemeral SQLite DB — see below). See "Implementation status" at the end of this file for details.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
Consider statically building the frontend and serving it via FastAPI, if that will work.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation status

- **PL-2** — `templates/` + `catalog.json` populated with the CommonPaper
  legal template dataset (all 11 document types' source text exists, but
  only the Mutual NDA is wired into the app so far).
- **PL-3** — `frontend/`: a Mutual NDA Creator prototype. Manual form (not
  AI chat yet) with a live markdown preview and a "Download .pdf" button
  (client-side PDF generation via `@react-pdf/renderer`, no backend
  involved). No AI/LLM calls exist in the codebase yet — the Cerebras/AI
  design section above is not implemented.
- **PL-4** — V1 technical foundation:
  - `backend/`: uv + FastAPI app. SQLite `users` table is dropped and
    recreated on every startup (`backend/app/db.py`) — no other tables or
    persistence exist yet (no document storage).
  - `POST /api/auth/signup` / `POST /api/auth/login` upsert a user by email
    and return a token, but **do not check passwords or manage real
    sessions** — this is a placeholder gate, not authentication. Any
    email/password combination logs in.
  - Frontend: `components/AuthGate.tsx` + `components/LoginScreen.tsx` gate
    the Mutual NDA Creator behind that placeholder login; the "session" is
    just a `localStorage` flag on the client.
  - `frontend/next.config.ts` sets `output: "export"`; the root `Dockerfile`
    builds that static export and serves it plus the API from one FastAPI
    process on `:8000` — the "consider statically building the frontend"
    question above is resolved (it works).
  - `scripts/start-{mac,linux}.sh` / `stop-{mac,linux}.sh` and
    `start-windows.ps1` / `stop-windows.ps1` wrap plain `docker build` /
    `run` / `rm` (no docker-compose).
- **PL-5** — AI chat for the Mutual NDA:
  - `backend/app/llm.py`: document-agnostic LiteLLM/OpenRouter/Cerebras
    (`gpt-oss-120b`) wrapper using Structured Outputs, per the "AI design"
    section above — this is now implemented (previously it was not).
  - `POST /api/chat/mutual-nda` (`backend/app/routers/chat.py`): stateless
    endpoint holding the Mutual-NDA system prompt; the frontend resends the
    full conversation + current field state each turn, so the backend keeps
    no chat memory of its own (no new DB table).
  - Frontend: `components/NdaChat.tsx` is now the primary way to fill out
    the Mutual NDA — a freeform chat that progressively populates the same
    `NdaFormData` fields used by the live preview / PDF download pipeline.
    `components/NdaForm.tsx` (the PL-3 manual form) is still available
    alongside it as a collapsible "Review & edit details manually" panel,
    disabled while a chat reply is in flight.
- **PL-6** — Expanded AI chat to all 11 catalog document types:
  - `POST /api/chat/resolve` (`backend/app/routers/resolve_chat.py`) figures
    out which catalog document the user wants from a freeform message
    (`frontend/components/ResolveChat.tsx`); if they ask for something not
    in the catalog, it explains that and proposes the closest supported
    match. `frontend/components/DocumentChat.tsx` is the top-level router
    that mounts the resolver, then hands off to the matched pipeline —
    `app/page.tsx` no longer assumes Mutual NDA and mounts `DocumentChat`
    instead of `NdaEditor` directly.
  - The Mutual NDA keeps its exact PL-5 pipeline unchanged. The other 9
    document types (CSA, PSA, DPA, SLA, Pilot Agreement, BAA, Design
    Partner Agreement, Software License Agreement, Partnership Agreement)
    go through a new generic engine instead of hand-authored per-document
    schemas: `frontend/lib/genericFields.ts` derives each document's field
    list from its template's `<span class="X_link">Label</span>` markup,
    `POST /api/chat/document/{document_slug}`
    (`backend/app/routers/document_chat.py`) collects values via Structured
    Outputs, and `frontend/lib/fillGenericDocument.ts` substitutes them back
    into the template text in place (no separate cover-page document, since
    only the Mutual NDA has one). `components/GenericChat.tsx` /
    `GenericForm.tsx` / `GenericDocumentEditor.tsx` / `GenericPreview.tsx`
    are the corresponding data-driven UI, shared across all 9 types.
  - `catalog.json` gained a `slug` field on 11 of its 12 entries (the Mutual
    NDA Cover Page entry has none, marking it non-selectable) and is now
    read by both frontend and backend, not just documentation.
  - `frontend/lib/mutualNdaPdf.tsx`'s markdown→PDF walker was extracted into
    a shared `frontend/lib/markdownPdf.tsx`, reused by both pipelines'
    preview components.
  - Also fixed: the chat input now regains focus after a turn resolves
    (`NdaChat.tsx`/`GenericChat.tsx`/`ResolveChat.tsx`), and the AI is now
    explicitly instructed to always ask a follow-up question when
    information is still missing rather than ending a turn on a statement.
- **PL-7** — Real authentication, document persistence, and polish:
  - `backend/app/security.py`: password hashing (PBKDF2-HMAC-SHA256 via
    stdlib `hashlib`/`secrets`, no new dependency) and session-token
    generation. `backend/app/db.py` gained a `password_hash` column on
    `users`, plus new `sessions` (token → user_id) and `documents`
    (user_id, document_slug, title, data JSON) tables — still dropped and
    recreated on every startup, per the existing ephemeral-DB convention.
  - `backend/app/routers/auth.py` was rewritten: `/api/auth/signup` now
    hashes the password and rejects a duplicate email (409); `/api/auth/login`
    verifies the password and rejects a mismatch (401) instead of accepting
    anything; a new `/api/auth/logout` deletes the session row.
    `backend/app/deps.py`'s `get_current_user` (Bearer-token) dependency
    gates the new documents endpoints.
  - `POST /api/documents` / `GET /api/documents` / `GET /api/documents/{id}`
    (`backend/app/routers/documents.py`) let a signed-in user save a
    document (one row per explicit Save — no update/versioning yet) and
    list/reopen only their own documents.
  - Frontend: `lib/authContext.tsx` (the app's first use of React context)
    carries the session token down to deeply-nested components that need it
    to call the documents API. `AuthGate.tsx` now persists `{user, token}`
    and calls the new logout endpoint. `components/Workspace.tsx` adds a
    "+ New document" / "My documents" toggle to the header;
    `components/MyDocuments.tsx` lists and reopens saved documents
    (pre-filling `NdaEditor`/`GenericDocumentEditor` via new
    `initialData`/`initialValues` props). `components/DocumentPreview.tsx`
    is a new shared component — replacing near-duplicate logic previously
    in `NdaPreview.tsx`/`GenericPreview.tsx` — that adds a "Save" button
    (with an editable document title) and a legal disclaimer next to every
    preview.
  - `frontend/app/globals.css` registers the Color Scheme above as real
    Tailwind v4 `@theme` tokens (`brand-blue`, `brand-purple`, `navy`,
    `gray-text`, `accent-yellow`), replacing hardcoded hex literals that
    were scattered across `LoginScreen.tsx`, `NdaChat.tsx`,
    `ResolveChat.tsx`, `GenericChat.tsx`.

Not yet built: password reset/email verification, session expiry, and any
document persistence beyond the current ephemeral (reset-on-restart) SQLite
DB.