"use client";

import { useState } from "react";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export default function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  function isValidYouTubeUrl(value: string): boolean {
    return /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.test(
      value
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a YouTube URL.");
      return;
    }
    if (!isValidYouTubeUrl(trimmed)) {
      setError("That doesn't look like a valid YouTube URL.");
      return;
    }
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError("");
          }}
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={isLoading}
          className={`flex-1 px-4 py-3 rounded-xl border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition-all
            ${error ? "border-red-400 focus:ring-2 focus:ring-red-300" : "border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-red-400 focus:border-transparent"}
            disabled:opacity-50`}
        />
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Summarizing…
            </span>
          ) : (
            "Summarize"
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500 pl-1">{error}</p>
      )}
    </form>
  );
}
