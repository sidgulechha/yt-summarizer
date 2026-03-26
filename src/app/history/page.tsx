"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HistoryEntry {
  id: string;
  video_id: string;
  video_url: string;
  title: string | null;
  thumbnail: string | null;
  duration: string | null;
  channel: string | null;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const [summaries, setSummaries] = useState<HistoryEntry[]>([]);
  const [filtered, setFiltered] = useState<HistoryEntry[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/history")
      .then(async (res) => {
        if (res.status === 401) { router.replace("/auth"); return; }
        if (!res.ok) throw new Error("Failed to load history.");
        const json = await res.json();
        setSummaries(json.summaries ?? []);
        setFiltered(json.summaries ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    const q = query.toLowerCase().trim();
    setFiltered(
      q
        ? summaries.filter((s) => (s.title ?? "").toLowerCase().includes(q))
        : summaries
    );
  }, [query, summaries]);

  function handleCardClick(entry: HistoryEntry) {
    // Pass the video URL to the home page to reload the summary from cache
    router.push(`/?url=${encodeURIComponent(entry.video_url)}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Your history
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            All your past video summaries
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden animate-pulse">
                <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20">
            {summaries.length === 0 ? (
              <>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
                  <svg className="w-7 h-7 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">No summaries yet.</p>
                <p className="text-sm text-gray-400 mt-1">Paste a YouTube URL to get started.</p>
                <Link href="/" className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
                  Summarize a video
                </Link>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No results for &ldquo;{query}&rdquo;</p>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleCardClick(entry)}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden hover:shadow-md hover:border-red-300 dark:hover:border-red-700 transition-all text-left group cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800">
                  {entry.thumbnail ? (
                    <Image
                      src={entry.thumbnail}
                      alt={entry.title ?? "Video thumbnail"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {entry.title ?? "Untitled"}
                  </p>
                  {entry.channel && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {entry.channel}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {entry.duration && (
                      <span className="text-xs text-gray-400">{entry.duration}</span>
                    )}
                    <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                    <span className="text-xs text-gray-400">{formatDate(entry.created_at)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
