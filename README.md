# yt-summarizer

Paste a YouTube URL, get a structured summary with key points, chapters, and timestamps. Ask follow-up questions about the video. All summaries are saved per user.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)
![Better Auth](https://img.shields.io/badge/Better_Auth-1.5-FF6B6B?style=flat-square)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel)

---

I built this to stop skimming through long videos to find one specific thing. You paste the URL, Claude reads the transcript, and you get back a clean JSON summary. The Q&A feature means you can ask "what did they say about X" without rewatching. Summaries are cached so the same video never hits the API twice.

---

## Features

- Paste a YouTube URL and get a structured summary — overview, key points, chapters, tags, and tone
- Ask follow-up questions about any video using the full transcript as context
- Summaries are cached in Supabase per user per video, so repeat requests are instant
- Every summary is saved to a history page with search
- Auth uses HTTP-only cookie sessions — no tokens in localStorage
- Transcript is stored server-side and fetched fresh per chat request, never sent from the client
- Anthropic prompt caching is enabled on the transcript, which cuts token costs on follow-up questions

---

## Tech Stack

| Category | Technology                | Purpose                                  |
|----------|---------------------------|------------------------------------------|
| Frontend | Next.js 16 App Router     | Pages, API routes, middleware            |
| Language | TypeScript                | Used throughout                          |
| AI       | Anthropic Claude Sonnet   | Summarization and Q&A                    |
| Database | Supabase (PostgreSQL)     | Stores summaries, transcripts, sessions  |
| Auth     | Better Auth               | Sign up, sign in, session cookies        |
| Styling  | Tailwind CSS              | All UI                                   |
| Hosting  | Vercel                    | Deployment                               |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project (free tier works)
- Anthropic API key

### Install

```bash
git clone https://github.com/sidgulechha/yt-summarizer
cd yt-summarizer
npm install
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable                        | Where to get it                                                        |
|---------------------------------|------------------------------------------------------------------------|
| `ANTHROPIC_API_KEY`             | [console.anthropic.com](https://console.anthropic.com)                 |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Project Settings → API                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API                                      |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase → Project Settings → API (secret key)                         |
| `BETTER_AUTH_SECRET`            | Any random 32-character string                                         |
| `BETTER_AUTH_URL`               | `http://localhost:3000` locally, your Vercel URL in production         |

### Database setup

Run `supabase/migrations/001_initial.sql` against your Supabase project using the SQL Editor. This creates all required tables.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
  app/
    page.tsx                    <- Main summarizer UI
    auth/page.tsx               <- Sign in / Sign up page
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
    auth.ts                     <- Better Auth server config + Supabase adapter
    auth-client.ts              <- Better Auth client helpers + useSession hook
    supabase.ts                 <- Supabase admin and anon clients
  proxy.ts                      <- Next.js middleware for route protection
supabase/
  migrations/
    001_initial.sql             <- Full database schema
```

---

## Build stages

1. Set up Next.js with Tailwind, wired up the Anthropic API with a structured JSON prompt, added transcript fetching via `youtube-transcript` and metadata via `ytdl-core`. Displayed overview, key points, timestamps, tags, and tone.

2. Added a chat interface below the summary. Transcript is passed to Claude as a cached system prompt. Conversation history is kept in React state and sent with each request. Responses stream.

3. Added auth with Better Auth, set up Supabase, wrote a custom adapter since Better Auth has no native Supabase support. Summary and transcript are saved after each generation. Added a history page with search. Protected routes via Next.js proxy middleware.

4. Audited environment variables, confirmed no secrets leak to the client. Replaced raw error messages in stream responses with generic strings. Added `error.tsx` and `global-error.tsx`. Wrapped `useSearchParams` in Suspense for production SSR. Build passes with zero TypeScript errors.

---

## License

MIT
