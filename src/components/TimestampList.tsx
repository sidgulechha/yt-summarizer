"use client";

interface Timestamp {
  time: string;
  label: string;
  description: string;
}

interface TimestampListProps {
  timestamps: Timestamp[];
  videoId: string;
}

function timeToSeconds(time: string): number {
  const parts = time.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

export default function TimestampList({ timestamps, videoId }: TimestampListProps) {
  if (!timestamps || timestamps.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Chapters
      </h3>
      <ol className="space-y-2">
        {timestamps.map((ts, i) => {
          const seconds = timeToSeconds(ts.time);
          const href = `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`;
          return (
            <li key={i}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 group rounded-lg px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <span className="shrink-0 mt-0.5 text-xs font-mono font-semibold text-red-500 bg-red-100 dark:bg-red-950/50 px-2 py-0.5 rounded-md min-w-[3.5rem] text-center">
                  {ts.time}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {ts.label}
                  </p>
                  {ts.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {ts.description}
                    </p>
                  )}
                </div>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
