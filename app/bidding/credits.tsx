import { CoinIcon } from "./auction-icon";
import { formatCredits } from "./auction-data";

/** A credits amount with the coin in front of it. Inherits font, size and colour from its parent. */
export function Credits({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.3em] whitespace-nowrap ${className}`}>
      <CoinIcon />
      {formatCredits(value)}
    </span>
  );
}
