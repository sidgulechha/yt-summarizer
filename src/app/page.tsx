"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import UrlInput from "@/components/UrlInput";
import SummaryCard from "@/components/SummaryCard";
import LoadingState from "@/components/LoadingState";
import VideoChat from "@/components/VideoChat";

interface SummaryData {
  title: string;
  channel: string;
  duration: string;
  overview: string;
  keyPoints: string[];
  timestamps: { time: string; label: string; description: string }[];
  targetAudience: string;
  sentiment: string;
  tags: string[];
}

interface Meta {
  thumbnail: string;
  videoId: string;
  cached?: boolean;
  cachedAt?: string;
}

type AppState = "idle" | "loading" | "success" | "error";

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}

function HomeInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [state, setState] = useState<AppState>("idle");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState("");

  // ?url=... from history page — only on mount
  useEffect(() => {
    const urlParam = searchParams?.get("url");
    if (urlParam && state === "idle") {
      handleSubmit(urlParam);
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ?reset=1 from logo click — re-runs whenever searchParams changes
  useEffect(() => {
    if (searchParams?.get("reset")) {
      handleReset();
      router.replace("/");
    }
  }, [searchParams, router]);

  async function handleSubmit(url: string) {
    setState("loading");
    setError("");
    setSummary(null);
    setMeta(null);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (res.status === 401) {
        router.push("/auth");
        return;
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Something went wrong. Please try again.");
      }

      // ── cached response (JSON) ───────────────────────────────────────────
      const contentType = res.headers.get("Content-Type") ?? "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        const { cached, cachedAt, thumbnail, videoId, ...summaryData } = json;
        setSummary(summaryData as SummaryData);
        setMeta({ thumbnail, videoId, cached, cachedAt });
        setState("success");
        return;
      }

      // ── streaming response ───────────────────────────────────────────────
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream.");

      const decoder = new TextDecoder();
      let raw = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
      }

      const errorIndex = raw.lastIndexOf("\n__ERROR__");
      if (errorIndex !== -1) {
        throw new Error(raw.slice(errorIndex + "\n__ERROR__".length).trim());
      }

      const metaIndex = raw.lastIndexOf("\n__META__");
      let jsonStr = raw;
      let parsedMeta: Meta = { thumbnail: "", videoId: "" };

      if (metaIndex !== -1) {
        jsonStr = raw.slice(0, metaIndex);
        try {
          parsedMeta = JSON.parse(raw.slice(metaIndex + "\n__META__".length));
        } catch {
          // ignore
        }
      }

      const cleaned = jsonStr.trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");
      const data: SummaryData = JSON.parse(cleaned);
      setSummary(data);
      setMeta(parsedMeta);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  function handleReset() {
    setState("idle");
    setSummary(null);
    setMeta(null);
    setError("");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-16">
      {/* Hero */}
      {state !== "success" && (
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500 mb-5 shadow-lg shadow-red-200 dark:shadow-red-900/30">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            YouTube Summarizer
          </h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400 text-base max-w-md mx-auto">
            Paste any YouTube URL and get an AI-powered summary with key points, chapters, and more.
          </p>
        </div>
      )}

      {state !== "success" && (
        <div className="mb-10">
          <UrlInput onSubmit={handleSubmit} isLoading={state === "loading"} />
        </div>
      )}

      {state === "loading" && (
        <div className="mt-4">
          <LoadingState />
        </div>
      )}

      {state === "error" && (
        <div className="max-w-2xl mx-auto mt-2">
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-5 flex items-start gap-4">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {state === "success" && summary && meta && (
        <div className="animate-fade-in">
          {/* Cache banner */}
          {meta.cached && (
            <div className="max-w-3xl mx-auto mb-4">
              <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-4 py-2.5 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 3.21-1.81 6-4.72 7.28L13 17v5h5l-1.22-1.22C19.91 19.07 22 15.76 22 12c0-5.18-3.95-9.45-9-9.95zM11 2.05C5.95 2.55 2 6.82 2 12c0 3.76 2.09 7.07 5.22 8.78L6 22h5v-5l-2.28 2.28C7.81 18 6 15.21 6 12c0-4.08 3.05-7.44 7-7.93V2.05z" />
                </svg>
                ⚡ Loaded from your history instantly
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto mb-8 text-center">
            <button
              onClick={handleReset}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Summarize another video
            </button>
          </div>

          <SummaryCard
            data={summary}
            thumbnail={meta.thumbnail}
            videoId={meta.videoId}
            onReset={handleReset}
          />

          <VideoChat videoId={meta.videoId} videoTitle={summary.title} />
        </div>
      )}
    </main>
  );
}
