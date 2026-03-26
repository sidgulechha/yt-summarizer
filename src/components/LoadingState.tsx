"use client";

export default function LoadingState() {
  return (
    <div className="w-full max-w-3xl mx-auto animate-pulse space-y-6">
      {/* Thumbnail + header skeleton */}
      <div className="flex gap-4">
        <div className="w-48 h-28 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        </div>
      </div>

      {/* Overview skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
      </div>

      {/* Key points skeleton */}
      <div className="space-y-2">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
            <div
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
              style={{ width: `${70 + Math.random() * 20}%` }}
            />
          </div>
        ))}
      </div>

      {/* Tags skeleton */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"
          />
        ))}
      </div>
    </div>
  );
}
