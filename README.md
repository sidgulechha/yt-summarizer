# yt-summarizer

Paste a YouTube URL and get a structured AI summary with key points,
chapters, and timestamps. Ask follow-up questions about the video.
Summaries are saved per user and cached so the same video never
hits the API twice.

![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Better Auth](https://img.shields.io/badge/Better_Auth-black?style=flat)
![Vercel](https://img.shields.io/badge/Vercel-black?style=flat&logo=vercel)

Long videos are hard to skim. This pulls the transcript, sends it
to Claude, and returns a structured summary — overview, key points,
chapters, tags, and tone. The Q&A feature lets you ask specific
questions about the content without rewatching. Summaries are cached
in Supabase so repeat requests load instantly.

## Features

- Paste a YouTube URL and get a structured summary — overview, key
  points, chapters, tags, and tone
- Ask follow-up questions about any video using the full transcript
  as context
- Summaries are cached per user per video — the same video never
  hits the API twice
- Every summary is saved to a history page with search
- Auth uses HTTP-only cookie sessions with bcrypt password hashing
- Anthropic prompt caching is enabled on the transcript, which
  reduces token costs significantly on follow-up questions

## Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 14 App Router | Pages, API routes, middleware |
| Language | TypeScript | Type safety across the stack |
| AI | Anthropic Claude Sonnet | Summarization and Q&A |
| Database | Supabase (PostgreSQL) | Summaries, transcripts, sessions |
| Auth | Better Auth | Sign up, sign in, session cookies |
| Styling | Tailwind CSS | All UI |
| Hosting | Vercel | Deployment |

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project (free tier works)
- Anthropic API key

### Install

```
git clone https://github.com/sidgulechha/yt-summarizer
cd yt-summarizer
npm install
```

### Environment Variables

Copy .env.example to .env.local and fill in the values:

```
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| ANTHROPIC_API_KEY | console.anthropic.com |
| NEXT_PUBLIC_SUPABASE_URL | Supabase → Project Settings → API |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase → Project Settings → API |
| SUPABASE_SERVICE_ROLE_KEY | Supabase → Project Settings → API (secret key) |
| BETTER_AUTH_SECRET | Any random 32-character string |
| BETTER_AUTH_URL | http://localhost:3000 locally, your Vercel URL in production |

### Database Setup

Run supabase/migrations/001_initial.sql against your Supabase
project using the SQL Editor. Enable RLS on all tables after
running the migration.

### Run

```
npm run dev
```

Open http://localhost:3000

## Project Structure

```
src/
  app/
    page.tsx                    <- Main summarizer UI
    auth/page.tsx               <- Sign in / Sign up
    history/page.tsx            <- Past summaries with search
    layout.tsx                  <- Root layout with nav
    error.tsx                   <- Page-level error boundary
    global-error.tsx            <- Root-level error boundary
    api/
      summarize/route.ts        <- Summarization + caching logic
      chat/route.ts             <- Q&A with prompt caching
      history/route.ts          <- Fetch user summary history
      health/route.ts           <- Health check endpoint
      auth/[...all]/route.ts    <- Better Auth handler
  components/
    UrlInput.tsx                <- YouTube URL input form
    SummaryCard.tsx             <- Displays structured summary
    TimestampList.tsx           <- Clickable chapter timestamps
    VideoChat.tsx               <- Q&A chat interface
    LoadingState.tsx            <- Skeleton loading states
    NavBar.tsx                  <- Top navigation with auth state
  lib/
    auth.ts                     <- Better Auth server config
    auth-client.ts              <- Better Auth client helpers
    supabase.ts                 <- Supabase admin and anon clients
  middleware.ts                 <- Route protection
supabase/
  migrations/
    001_initial.sql             <- Full database schema
```

## How it was built

Stage 1 — Scaffolded Next.js with Tailwind, wired up the
Anthropic API with a structured JSON prompt, added transcript
fetching via youtube-transcript and metadata via ytdl-core.
Returns overview, key points, timestamps, tags, and tone.

Stage 2 — Added a chat interface below the summary. Transcript
is passed to Claude as a cached system prompt using Anthropic's
prompt caching API. Conversation history is maintained in React
state and sent with each request. Responses stream.

Stage 3 — Added auth with Better Auth and set up Supabase with
a custom adapter. Summaries and transcripts are saved after each
generation. Added a history page with search and protected routes
via Next.js middleware.

Stage 4 — Audited environment variables, confirmed no secrets
leak to the client. Replaced raw error messages in stream responses
with generic strings. Added error boundaries and wrapped
useSearchParams in Suspense for production SSR. Build passes
with zero TypeScript errors.

## License

MIT
