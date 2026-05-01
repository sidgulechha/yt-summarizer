# YouTube Summarizer

Paste any YouTube URL and get a structured AI-powered summary — key points, chapters, and tags — in seconds. Ask follow-up questions about the video without rewatching. Every summary is saved to your account and cached so the same video loads instantly on repeat visits.

![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Better Auth](https://img.shields.io/badge/Better_Auth-black?style=flat)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=flat&logo=tailwindcss&logoColor=white)

---

## Features

### Structured AI Summary
Paste any YouTube URL (standard, shorts, embed) and the app fetches the transcript, sends it to Claude, and streams back a structured summary containing:

- **Overview** — 2–3 sentence description of what the video is about
- **Key Points** — 5–8 most important takeaways
- **Chapter Timestamps** — 6–10 clickable chapter markers derived from content shifts in the transcript
- **Target Audience** — who would benefit most from watching
- **Tone / Sentiment** — educational, entertaining, persuasive, etc.
- **Tags** — 5–7 relevant topics

### Q&A Chat
After a summary loads, a chat panel appears below it. Ask any question about the video and Claude answers using the full transcript as context. Conversation history is maintained so you can ask follow-ups. The transcript is sent as a cached system prompt using Anthropic's prompt caching API — the first Q&A call caches the transcript, every subsequent call in the session hits the cache and costs significantly less.

### Per-User Caching
Every summary is stored in Supabase (keyed on `user_id + video_id`). Summarizing the same video again skips the API entirely and returns the stored result as JSON — instant load, zero API cost.

### History Page
A dedicated `/history` page shows all your past summaries as a card grid with video thumbnails, channel names, durations, and dates. Clicking a card re-loads the summary from cache on the home page. A search bar filters your history by title client-side.

### Authentication
Sign up and sign in with email and password. Sessions use HTTP-only cookies (no tokens in localStorage). Passwords are hashed with bcrypt via Better Auth. Protected routes (home page, history, API routes) redirect unauthenticated users to `/auth` via Next.js middleware.

---

## Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 (App Router) | Pages, API routes, middleware |
| Language | TypeScript | Type safety across the stack |
| AI | Anthropic Claude Sonnet 4.6 | Summarization, streaming, Q&A |
| Database | Supabase (PostgreSQL) | Users, sessions, summaries, transcripts |
| Auth | Better Auth | Sign up, sign in, session cookies |
| Styling | Tailwind CSS v4 | All UI |
| Hosting | Vercel | Deployment |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- A [Supabase](https://supabase.com) project (free tier works)
- An [Anthropic](https://console.anthropic.com) API key

### 1. Clone and install

```bash
git clone https://github.com/sidgulechha/yt-summarizer
cd yt-summarizer
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values:

| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role secret key |
| `BETTER_AUTH_SECRET` | Any random 32-character string (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | `http://localhost:3000` locally; your Vercel URL in production |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Same as `BETTER_AUTH_URL` |

### 3. Set up the database

Open your Supabase project, go to the **SQL Editor**, and run the contents of:

```
supabase/migrations/001_initial.sql
```

This creates all required tables (`users`, `sessions`, `accounts`, `verifications`, `summaries`) with proper indexes and foreign keys. After running, enable **Row Level Security** on all tables from the Supabase dashboard (Table Editor → select table → Enable RLS). No policies are required — the app uses the service role key server-side and enforces access in API routes.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and paste a YouTube URL.

---

## Deployment (Vercel)

1. Push your repo to GitHub.
2. Import it in the [Vercel dashboard](https://vercel.com/new).
3. Add all environment variables from `.env.local` to the Vercel project settings. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL` to your Vercel production URL (e.g. `https://your-app.vercel.app`).
4. Deploy. No additional build configuration needed — Next.js is detected automatically.

---

## Project Structure

```
src/
  app/
    page.tsx                      ← Main summarizer UI (streaming + cached)
    auth/page.tsx                 ← Sign in / Sign up
    history/page.tsx              ← Past summaries with search
    layout.tsx                    ← Root layout with NavBar
    error.tsx                     ← Page-level error boundary
    global-error.tsx              ← Root-level error boundary
    api/
      summarize/route.ts          ← Transcript fetch, Claude stream, cache write
      chat/route.ts               ← Q&A with Anthropic prompt caching
      history/route.ts            ← Fetch user summary history from Supabase
      health/route.ts             ← Health check endpoint
      auth/[...all]/route.ts      ← Better Auth catch-all handler
  components/
    UrlInput.tsx                  ← YouTube URL input + submit
    SummaryCard.tsx               ← Structured summary display
    TimestampList.tsx             ← Clickable chapter timestamps
    VideoChat.tsx                 ← Q&A chat interface with streaming
    LoadingState.tsx              ← Skeleton loading states
    NavBar.tsx                    ← Top navigation with auth state
  lib/
    auth.ts                       ← Better Auth server config (Supabase adapter)
    auth-client.ts                ← Better Auth client helpers (signIn, signUp)
    supabase.ts                   ← Supabase admin and anon client instances
  middleware.ts                   ← Route protection (redirects to /auth)
  proxy.ts                        ← Next.js fetch proxy config
supabase/
  migrations/
    001_initial.sql               ← Full database schema
```

---

## How It Works

**Summarization flow:**
1. User submits a YouTube URL
2. Server extracts the video ID and checks Supabase for a cached summary
3. On cache miss: fetches transcript via `youtube-transcript` and metadata via `ytdl-core`
4. Sends the transcript (truncated to 50k characters) to Claude Sonnet with a structured JSON prompt
5. Claude's response streams directly to the browser
6. Once the stream completes, the parsed summary is saved to Supabase
7. On cache hit: returns the stored JSON immediately — no API call made

**Q&A flow:**
1. User types a question in the chat panel
2. Server loads the stored transcript from Supabase
3. Sends the transcript as a cached system prompt block (`cache_control: { type: "ephemeral" }`)
4. The first request in a session caches the transcript at Anthropic; follow-up questions reuse the cache
5. Claude's answer streams back to the browser

**Auth flow:**
- Better Auth handles sign-up and sign-in with email + password
- Sessions stored in Supabase with HTTP-only cookie tokens
- `middleware.ts` checks session on all protected routes and redirects to `/auth` if missing

---

## Environment Variable Reference

```env
# Anthropic (server-side only — never expose to client)
ANTHROPIC_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # server-side only

# Better Auth (server-side only)
BETTER_AUTH_SECRET=                # random 32-char string
BETTER_AUTH_URL=                   # full URL: http://localhost:3000 or your Vercel URL
NEXT_PUBLIC_BETTER_AUTH_URL=       # same value, exposed to client
```

---

## License

MIT
