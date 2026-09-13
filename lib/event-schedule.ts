/** When the organiser opens round one. Shown wherever a page counts down. */
export const AUCTION_START_AT = new Date("2026-09-16T13:00:00+05:30");

export const AUCTION_START_LABEL = "16 Sep 2026 · 1:00 PM IST";

export type Countdown = { days: number; hours: number; minutes: number; seconds: number };

export function countdownTo(target: Date, now = Date.now()): Countdown {
  const distance = Math.max(0, target.getTime() - now);
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance % 86_400_000) / 3_600_000),
    minutes: Math.floor((distance % 3_600_000) / 60_000),
    seconds: Math.floor((distance % 60_000) / 1000),
  };
}
