"use client";

import { useSyncExternalStore } from "react";

/**
 * Web storage as a React external store.
 *
 * Reads go through useSyncExternalStore so the server render and the first
 * client render agree (both see null), and writes made through the store's
 * `write` notify every hook in the page — the `storage` event only fires for
 * other tabs, and never for sessionStorage.
 *
 * Two stores: `localStorage` is shared by every tab on the origin;
 * `sessionStorage` belongs to one tab and dies with it.
 */

type WebStorage = "localStorage" | "sessionStorage";

function createStore(kind: WebStorage) {
  const listeners = new Set<() => void>();

  function storage(): Storage | null {
    try {
      return window[kind];
    } catch {
      return null;
    }
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  }

  function read(key: string): string | null {
    try {
      return storage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  function write(key: string, value: string | null) {
    try {
      if (value === null) storage()?.removeItem(key);
      else storage()?.setItem(key, value);
    } catch {
      // Storage can be blocked; the page keeps working without it.
    }
    for (const listener of listeners) listener();
  }

  /** The current value under `key`; null on the server and until hydration. */
  function useValue(key: string): string | null {
    return useSyncExternalStore(subscribe, () => read(key), () => null);
  }

  return { read, write, useValue };
}

const local = createStore("localStorage");
const session = createStore("sessionStorage");

export const readLocal = local.read;
export const writeLocal = local.write;
export const useLocalStorageValue = local.useValue;

export const readSession = session.read;
export const writeSession = session.write;
export const useSessionStorageValue = session.useValue;
