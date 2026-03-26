# YT Summarizer

**An AI-powered YouTube video summarizer with authentication, smart caching, and interactive Q&A — built with Next.js, Claude AI, and Supabase.**

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)
![Better Auth](https://img.shields.io/badge/Better_Auth-1.5-FF6B6B?style=flat-square)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel)

---

## Overview

YT Summarizer lets you paste any YouTube URL and instantly receive a structured, AI-generated summary — no more scrubbing through hour-long videos to find what matters. It's built for anyone who wants to save time understanding video content, whether you're a student, researcher, or professional. What sets it apart from a basic summarizer is the full interactive experience: ask follow-up questions about any video, revisit past summaries from a searchable history page, and benefit from smart caching that means the same video is never processed twice. Powered by Claude AI, the app delivers accurate, structured summaries with key takeaways, chapter markers, tone analysis, and more.

---

## Features

### 🎯 AI Video Summarization
Paste any YouTube URL and get a structured summary including a high-level overview, 5–8 key takeaways, chapter markers with clickable timestamps, topic tags, tone analysis, and target audience — all generated in real time by Claude.

### 💬 Interactive Q&A
Ask follow-up questions about any video and get answers grounded in the full transcript. Powered by Claude with Anthropic prompt caching enabled, which reduces token costs by ~90% on follow-up questions. Responses stream in real time and conversation history is maintained within the session.

### ⚡ Smart Caching
Summaries are cached per user per video in Supabase. Re-visiting a video you've already summarized loads the result instantly — zero API calls, zero waiting.

### 📚 Permanent History
Every summary you generate is saved to your account and fully searchable. Come back days or weeks later and instantly find any video you've analyzed.

### 🔐 Secure Authentication
Full sign up / sign in flow built with Better Auth. Sessions use HTTP-only cookies (not accessible via JavaScript), passwords are hashed with bcrypt, and all routes requiring authentication are protected via Next.js middleware.

### 🚀 Production Ready
Full environment variable audit, error boundaries at both page and root level, generic error messages to the client with real errors logged server-side only, health check endpoint at `/api/health`, and zero TypeScript errors on `npm run build`.

---

## Tech Stack

| Category | Technology                | Purpose                                        |
|----------|---------------------------|------------------------------------------------|
| Frontend | Next.js 16 App Router     | React framework with server components         |
| Language | TypeScript                | Type safety across the stack                   |
| AI       | Anthropic Claude (Sonnet) | Summarization and Q&A                          |
| Database | Supabase (PostgreSQL)     | Data persistence and caching                   |
| Auth     | Better Auth               | Session management and security                |
| Styling  | Tailwind CSS              | Utility-first styling                          |
| Hosting  | Vercel                    | Deployment and edge functions                  |

---

## How It Works

1. **User pastes a YouTube URL** into the input field
2. **Cache check** — the app queries Supabase for an existing summary for this user + video. If found, it's returned instantly with no API call
3. **Transcript + metadata fetch** — if not cached, the transcript is fetched via `youtube-transcript` and video metadata (title, author, duration, thumbnail) via `ytdl-core`
4. **Claude API call** — the transcript and metadata are sent to Claude with a structured prompt requesting a specific JSON schema
5. **Structured summary returned** — Claude returns a JSON object with overview, key takeaways, chapter timestamps, tags, tone, and target audience. The response streams to the client in real time
6. **Saved to Supabase** — the summary and raw transcript are persisted for future instant loads and Q&A use
7. **Follow-up Q&A** — when the user asks a question, the transcript is retrieved from Supabase server-side and sent to Claude with `cache_control: ephemeral` on the transcript block, enabling prompt caching and dramatically reducing costs for multi-turn conversations

---

## Build Journey

### Stage 1 — Core Summarizer
- Next.js project scaffolded with Tailwind CSS
- YouTube transcript fetching with `youtube-transcript`
- Video metadata extraction with `ytdl-core`
- Anthropic API integration with a structured JSON prompt
- Full summary display: overview, key takeaways, chapter timestamps, tags, tone, target audience

### Stage 2 — Interactive Q&A
- Chat interface rendered below each summary
- Full transcript passed as cached context to Claude on every question
- Anthropic prompt caching implemented — ~90% token cost reduction on follow-up questions
- Streaming responses for a real-time conversational feel
- Conversation history maintained in React state and passed to the API on each turn
- Suggested starter questions displayed before the first message

### Stage 3 — Auth, Database and Caching
- Better Auth integrated with HTTP-only cookie sessions and bcrypt password hashing
- Supabase PostgreSQL database provisioned
- Schema: `users`, `sessions`, `accounts`, `verifications`, `summaries` tables
- Summary caching — the same video is never summarized twice per user
- Permanent history page with client-side search filtering
- Protected routes via Next.js Proxy (middleware)

### Stage 4 — Production Hardening
- Full environment variable audit — all sensitive keys confirmed server-side only
- `NEXT_PUBLIC_BETTER_AUTH_URL` removed; Better Auth now infers origin automatically
- Error boundaries added (`error.tsx` + `global-error.tsx`)
- Streaming error handlers updated: real errors logged server-side, generic messages sent to client
- Hardcoded `localhost` URLs removed from client code
- Health check endpoint at `/api/health`
- `useSearchParams` wrapped in `Suspense` for production SSR compatibility
- Zero TypeScript errors on `npm run build`

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- An [Anthropic API key](https://console.anthropic.com)
- A Better Auth secret (any random 32-character string)

### Installation

```bash
git clone https://github.com/sidgulechha/yt-summarizer
cd yt-summarizer
npm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable                        | Where to get it                                                      |
|---------------------------------|----------------------------------------------------------------------|
| `ANTHROPIC_API_KEY`             | [console.anthropic.com](https://console.anthropic.com)               |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Project Settings → API                                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API                                    |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase → Project Settings → API (secret key)                       |
| `BETTER_AUTH_SECRET`            | Any random 32-character string                                       |
| `BETTER_AUTH_URL`               | `http://localhost:3000` for local dev; your Vercel URL in production |

### Database Setup

1. Open your Supabase project and go to the **SQL Editor**
2. Paste and run the contents of `supabase/migrations/001_initial.sql`
3. This creates all required tables (`users`, `sessions`, `accounts`, `verifications`, `summaries`) with the correct indexes and constraints

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
src/
  app/
    page.tsx                    ← Main summarizer UI
    auth/page.tsx               ← Sign in / Sign up page
    history/page.tsx            ← Past summaries with search
    layout.tsx                  ← Root layout with nav
    error.tsx                   ← Page-level error boundary
    global-error.tsx            ← Root-level error boundary
    api/
      summarize/route.ts        ← Summarization + caching logic
      chat/route.ts             ← Q&A with prompt caching
      history/route.ts          ← Fetch user summary history
      health/route.ts           ← Health check endpoint
      auth/[...all]/route.ts    ← Better Auth handler
  components/
    UrlInput.tsx                ← YouTube URL input form
    SummaryCard.tsx             ← Displays structured summary
    TimestampList.tsx           ← Clickable chapter timestamps
    VideoChat.tsx               ← Q&A chat interface
    LoadingState.tsx            ← Skeleton loading states
    NavBar.tsx                  ← Top navigation with auth state
  lib/
    auth.ts                     ← Better Auth server config + Supabase adapter
    auth-client.ts              ← Better Auth client helpers + useSession hook
    supabase.ts                 ← Supabase admin and anon clients
  proxy.ts                      ← Next.js middleware for route protection
supabase/
  migrations/
    001_initial.sql             ← Full database schema
```

---

## Security

Passwords are hashed with bcrypt via Better Auth — plain text passwords are never stored. Sessions use HTTP-only cookies, meaning they are completely inaccessible to JavaScript and safe from XSS attacks. Row Level Security (RLS) is enabled on all Supabase tables so users can only access their own data. All sensitive environment variables (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BETTER_AUTH_SECRET`) are server-side only and never exposed to the browser. Internal error details and stack traces are logged server-side via `console.error` but only generic messages are returned to the client.

---

## License

MIT License — feel free to use, modify, and distribute this project.
