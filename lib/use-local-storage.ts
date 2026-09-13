"use client";

import { useSyncExternalStore } from "react";

/**
 * localStorage as a React external store.
 *
 * Reads go through useSyncExternalStore so the server render and the first
 * client render agree (both see null), and writes made through `writeLocal`
 * notify every hook in the page — the `storage` event only fires for other
 * tabs.
 */

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocal(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked; the page keeps working without it.
  }
  for (const listener of listeners) listener();
}

/** The current value under `key`; null on the server and until hydration. */
export function useLocalStorageValue(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => readLocal(key),
    () => null,
  );
}
