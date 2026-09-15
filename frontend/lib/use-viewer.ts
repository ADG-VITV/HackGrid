"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  readLocal,
  useSessionStorageValue,
  writeLocal,
  writeSession,
} from "./use-local-storage";

const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Production only: where the app remembers the email it last identified the
 * viewer by (localStorage, shared by every tab). Development never writes it.
 */
const EMAIL_KEY = "hackgrid:gmail";
/**
 * Development only: the person this tab is pretending signed in. Kept in
 * sessionStorage so each tab can be someone else — a lead in one, a member in
 * another — and a fresh tab starts as nobody.
 */
const ACT_AS_KEY = "hackgrid:actAs";

export type ActAsUser = { email: string; name: string };

export type Viewer = {
  /** Empty while nobody is signed in. */
  email: string;
  name: string;
  photoURL: string | null;
  signedIn: boolean;
  /** Development only: true while a picked person stands in for the session. */
  actingAs: boolean;
  loading: boolean;
  /** Ends the session — or, while acting as someone, just that. */
  signOut: () => void | Promise<void>;
};

function normalize(value: string | null | undefined) {
  const email = value?.trim().toLowerCase() ?? "";
  return email.includes("@") ? email : "";
}

function parseActAs(raw: string | null): ActAsUser | null {
  if (!IS_DEV || !raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ActAsUser>;
    const email = normalize(parsed.email);
    return email ? { email, name: typeof parsed.name === "string" ? parsed.name : "" } : null;
  } catch {
    return null;
  }
}

/**
 * Development only. From here on every page in this tab behaves as if `user`
 * had signed in with Google — the navbar, the teams page, the bidding page —
 * until `stopActingAs` (Logout in the navbar). Production ignores this.
 */
export function startActingAs(user: ActAsUser) {
  if (!IS_DEV) return;
  writeSession(ACT_AS_KEY, JSON.stringify(user));
}

/** Back to the real session, if there is one. */
export function stopActingAs() {
  writeSession(ACT_AS_KEY, null);
}

/**
 * Who is looking at the page.
 *
 * In production that is the Google session and nothing else. In development
 * a person picked on the teams page can stand in for the session, so every
 * flow can be walked through as them without their Google account.
 */
export function useViewer(): Viewer {
  const { user, loading, signOut } = useAuth();
  const actAs = parseActAs(useSessionStorageValue(ACT_AS_KEY));
  const sessionEmail = normalize(user?.email);

  // Production: keep localStorage in step with the session so a tab that
  // signs in and later out still reflects the last real identity.
  // Development: never write localStorage — the acted-as person lives in this
  // tab's sessionStorage only. Any keys left behind by the earlier scheme,
  // which did share them across tabs, are cleared so they cannot mislead.
  useEffect(() => {
    if (IS_DEV) {
      if (readLocal(ACT_AS_KEY) !== null) writeLocal(ACT_AS_KEY, null);
      if (readLocal(EMAIL_KEY) !== null) writeLocal(EMAIL_KEY, null);
      return;
    }
    if (!sessionEmail) return;
    if (readLocal(EMAIL_KEY) !== sessionEmail) writeLocal(EMAIL_KEY, sessionEmail);
  }, [sessionEmail]);

  if (actAs) {
    return {
      email: actAs.email,
      name: actAs.name,
      photoURL: null,
      signedIn: true,
      actingAs: true,
      loading: false,
      signOut: stopActingAs,
    };
  }

  return {
    email: sessionEmail,
    name: user?.displayName ?? "",
    photoURL: user?.photoURL ?? null,
    signedIn: Boolean(sessionEmail),
    actingAs: false,
    loading,
    signOut,
  };
}
