"use client";

import { useState } from "react";
import Image from "next/image";
import TimestampList from "./TimestampList";

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

interface SummaryCardProps {
  data: SummaryData;
  thumbnail: string;
  videoId: string;
  onReset: () => void;
}

export default function SummaryCard({ data, thumbnail, videoId, onReset }: SummaryCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = `# ${data.title}\n**Channel:** ${data.channel}\n**Duration:** ${data.duration}\n\n## Overview\n${data.overview}\n\n## Key Points\n${data.keyPoints.map((p) => `• ${p}`).join("\n")}\n\n## Tags\n${data.tags.join(", ")}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-5">
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <div className="relative w-full sm:w-52 h-32 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
            <Image
              src={thumbnail}
              alt={data.title}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </a>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
            {data.title}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{data.channel}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">{data.duration}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {data.sentiment}
            </span>
            <span className="text-xs px-3 py-1 rounded-full font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              {data.targetAudience}
            </span>
          </div>
        </div>
      </div>

      {/* Overview */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Overview
        </h3>
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm">
          {data.overview}
        </p>
      </div>

      {/* Key Points */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Key Takeaways
        </h3>
        <ul className="space-y-2">
          {data.keyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200">
              <span className="shrink-0 mt-1 w-2 h-2 rounded-full bg-red-400" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* Timestamps */}
      <TimestampList timestamps={data.timestamps} videoId={videoId} />

      {/* Tags */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.tags.map((tag, i) => (
            <span
              key={i}
              className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy Summary
            </>
          )}
        </button>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 109-9M3 3v6h6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Summarize Another Video
        </button>
      </div>
    </div>
  );
}
