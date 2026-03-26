"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";

export default function NavBar() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Don't show the navbar on the auth page
  if (pathname?.startsWith("/auth")) return null;

  async function handleSignOut() {
    await signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-gray-900 dark:text-white hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
          </div>
          <span className="text-sm hidden sm:block">YT Summarizer</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <Link
            href="/history"
            className="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            History
          </Link>
        </nav>

        {/* User */}
        <div className="flex items-center gap-3">
          {isPending ? (
            <div className="w-24 h-5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ) : session ? (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block truncate max-w-[140px]">
                {session.user.name || session.user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
