"use client";

import { createAuthClient } from "better-auth/client";
import { useSyncExternalStore } from "react";

// No baseURL needed — Better Auth infers the origin in the browser.
// BETTER_AUTH_URL is only needed server-side (lib/auth.ts).
export const authClient = createAuthClient();

export const { signIn, signUp, signOut } = authClient;

export function useSession() {
  const atom = authClient.useSession;
  return useSyncExternalStore(
    (callback) => atom.subscribe(callback),
    () => atom.get(),
    () => atom.get()
  );
}
