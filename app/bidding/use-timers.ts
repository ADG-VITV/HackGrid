"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const SUBCAPSULE_SECONDS = 7 * 60;
export const BID_TIMEOUT_SECONDS = 10;

export type CapsuleTimerState = {
  totalSeconds: number;
  remainingSeconds: number;
  expired: boolean;
};

export function getSubcapsuleInfo(
  totalSeconds: number,
  remainingSeconds: number,
): { index: number; subRemaining: number } {
  if (totalSeconds <= 0) return { index: 0, subRemaining: 0 };
  const elapsed = totalSeconds - remainingSeconds;
  const index = Math.min(
    Math.floor(elapsed / SUBCAPSULE_SECONDS),
    Math.ceil(totalSeconds / SUBCAPSULE_SECONDS) - 1,
  );
  const subRemaining = SUBCAPSULE_SECONDS - (elapsed % SUBCAPSULE_SECONDS);
  return { index, subRemaining };
}

type SoldMap = Record<string, boolean>;

export function useTimers() {
  const [capsuleTimers, setCapsuleTimers] = useState<
    Record<string, CapsuleTimerState>
  >({});
  const [soldMap, setSoldMap] = useState<SoldMap>({});
  const [bidTimeLeft, setBidTimeLeft] = useState<number | null>(null);
  const [activeBidTile, setActiveBidTile] = useState<string | null>(null);
  const bidIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const capsuleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalForCapsule = useCallback((n: number) => {
    return Math.max(0, n - 1) * SUBCAPSULE_SECONDS;
  }, []);

  const startCapsuleTimer = useCallback(
    (tileId: string, itemCount: number) => {
      setCapsuleTimers((prev) => {
        if (prev[tileId]) return prev;
        const total = totalForCapsule(itemCount);
        return {
          ...prev,
          [tileId]: {
            totalSeconds: total,
            remainingSeconds: total,
            expired: total === 0,
          },
        };
      });
    },
    [totalForCapsule],
  );

  useEffect(() => {
    capsuleIntervalRef.current = setInterval(() => {
      setCapsuleTimers((prev) => {
        let changed = false;
        const next: Record<string, CapsuleTimerState> = {};
        for (const [id, state] of Object.entries(prev)) {
          if (state.expired || state.remainingSeconds <= 0) {
            next[id] = { ...state, expired: true, remainingSeconds: 0 };
            continue;
          }
          const remaining = state.remainingSeconds - 1;
          const expired = remaining <= 0;
          next[id] = { ...state, remainingSeconds: Math.max(0, remaining), expired };
          changed = true;
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => {
      if (capsuleIntervalRef.current) clearInterval(capsuleIntervalRef.current);
    };
  }, []);

  const resetBidTimer = useCallback((tileId: string) => {
    setActiveBidTile(tileId);
    setBidTimeLeft(BID_TIMEOUT_SECONDS);

    if (bidIntervalRef.current) clearInterval(bidIntervalRef.current);

    bidIntervalRef.current = setInterval(() => {
      setBidTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (bidIntervalRef.current) clearInterval(bidIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const clearBidTimer = useCallback(() => {
    if (bidIntervalRef.current) clearInterval(bidIntervalRef.current);
    setBidTimeLeft(null);
    setActiveBidTile(null);
  }, []);

  useEffect(() => {
    return () => {
      if (bidIntervalRef.current) clearInterval(bidIntervalRef.current);
      if (capsuleIntervalRef.current) clearInterval(capsuleIntervalRef.current);
    };
  }, []);

  const markSold = useCallback((key: string) => {
    setSoldMap((prev) => ({ ...prev, [key]: true }));
  }, []);

  const isSold = useCallback((key: string) => !!soldMap[key], [soldMap]);

  return {
    capsuleTimers,
    startCapsuleTimer,
    totalForCapsule,
    soldMap,
    markSold,
    isSold,
    bidTimeLeft,
    activeBidTile,
    resetBidTimer,
    clearBidTimer,
    setBidTimeLeft,
  };
}
