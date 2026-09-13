"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { readLocal, useLocalStorageValue, writeLocal } from "./use-local-storage";

const IS_DEV = process.env.NODE_ENV === "development";

/** Where the app remembers the email it last identified the viewer by. */
const STORAGE_KEY = "hackgrid:gmail";

function normalize(value: string | null | undefined) {
  const email = value?.trim().toLowerCase() ?? "";
  return email.includes("@") ? email : "";
}

export function persistViewerEmail(email: string) {
  writeLocal(STORAGE_KEY, normalize(email) || null);
}

/**
 * The email every page identifies the viewer by.
 *
 * In production that is the Google session and nothing else. In development
 * a remembered email (typed on the teams page, or left by an earlier session)
 * stands in, so the flows can be exercised without signing in.
 */
export function useViewerEmail() {
  const { user, loading } = useAuth();
  const stored = useLocalStorageValue(STORAGE_KEY);

  const signedIn = normalize(user?.email);

  // Keep storage in step with the session so a dev tab that signs in and
  // later out still reflects the last real identity.
  useEffect(() => {
    if (signedIn && readLocal(STORAGE_KEY) !== signedIn) persistViewerEmail(signedIn);
  }, [signedIn]);

  return {
    email: signedIn || (IS_DEV ? normalize(stored) : ""),
    signedIn: Boolean(signedIn),
    loading,
    remember: persistViewerEmail,
  };
}

/**
 * Send a signed-out visitor to the login page, which returns them to /teams
 * once they sign in. Waits for Firebase to settle first so a returning user
 * is not bounced while their session restores. Development skips this so the
 * remembered-email flows keep working.
 */
export function useRequireSignIn() {
  const { loading, signedIn } = useViewerEmail();
  const router = useRouter();

  const redirecting = !IS_DEV && !loading && !signedIn;

  useEffect(() => {
    if (redirecting) router.replace("/login");
  }, [redirecting, router]);

  /** True while the session is still resolving or the redirect is on its way. */
  return { blocked: !IS_DEV && (loading || !signedIn) };
}
