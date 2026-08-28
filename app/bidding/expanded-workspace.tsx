import { MinusIcon, PlusIcon } from "./auction-icon";
import {
  AUTO_INCREMENT_FALLBACK,
  STARTING_BALANCE,
  compactIncrement,
  formatCredits,
  incrementLabel,
  type AuctionTile,
} from "./auction-data";

type WorkspaceProps = {
  tile: AuctionTile;
  activeIndex: number;
  bid: number;
  onSelectItem: (index: number) => void;
  onChangeBid: (delta: -1 | 1) => void;
};

export function ExpandedWorkspace({
  tile,
  activeIndex,
  bid,
  onSelectItem,
  onChangeBid,
}: WorkspaceProps) {
  const activeItem = tile.items[activeIndex];

  const canDecrease = bid > activeItem.price;
  const increment = activeItem.minIncrement ?? AUTO_INCREMENT_FALLBACK;
  const canIncrease = bid + increment <= STARTING_BALANCE;
  const isAuto = activeItem.minIncrement === null || activeItem.minIncrement === 0;

  return (
    <div className="flex min-h-0 w-full flex-col overflow-hidden rounded-[25px] border border-neon/40 bg-black px-[4%] pt-7 pb-5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] lg:min-h-[400px]">
      <h3 className="text-center text-xl font-semibold tracking-wide text-white lg:text-2xl">
        {tile.label}
      </h3>

      <p className="mt-5 text-sm text-zinc-400 lg:mt-7">
        <span className="text-zinc-500">Current Track Being Bid For:</span>{" "}
        <span className="text-zinc-100">{activeItem.name}</span>
      </p>

      <div className="mt-6 flex min-h-0 min-w-0 flex-1 flex-col gap-6 lg:flex-row lg:items-center lg:gap-[3%]">
        <section className="flex min-w-0 flex-col justify-center lg:w-[62%]">
          <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
            Current Price
          </p>
          <p className="mt-2 font-mono text-4xl font-semibold text-neon lg:text-5xl">
            {formatCredits(bid)}
          </p>

          <p className="mt-4 text-sm text-zinc-400">
            Minimum Bid Increment:{" "}
            <span className={isAuto ? "text-zinc-200" : "text-neon"}>{incrementLabel(activeItem.minIncrement)}</span>
          </p>

          <div className="mt-7 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChangeBid(-1)}
              disabled={!canDecrease}
              aria-label="Decrease bid"
              className="grid size-10 place-items-center rounded-xl border border-neon/40 bg-neon/[0.08] text-neon transition hover:bg-neon/20 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-neon/[0.08]"
            >
              <MinusIcon />
            </button>
            <span className="min-w-24 text-center font-mono text-2xl font-semibold text-white lg:text-3xl">
              {formatCredits(bid)}
            </span>
            <button
              type="button"
              onClick={() => onChangeBid(1)}
              disabled={!canIncrease}
              aria-label="Increase bid"
              className="grid size-10 place-items-center rounded-xl border border-neon/40 bg-neon/[0.08] text-neon transition hover:bg-neon/20 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-neon/[0.08]"
            >
              <PlusIcon />
            </button>
          </div>
        </section>

        <section className="flex w-full shrink-0 flex-col self-center overflow-hidden rounded-[20px] border border-neon/20 bg-zinc-950/60 lg:w-[35%] lg:max-h-[100%]">
          <h4 className="shrink-0 self-center pt-5 pb-3 text-center text-lg font-medium text-zinc-200">
            All that is there
          </h4>
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 pb-5">
            {tile.items.map((option, index) => {
              const isActive = index === activeIndex;
              return (
                <li key={option.name}>
                  <button
                    type="button"
                    onClick={() => onSelectItem(index)}
                    className={`flex w-full flex-col gap-1.5 rounded-xl px-3 py-2.5 text-left transition ${
                      isActive
                        ? "border border-neon/50 bg-neon/[0.08] text-white"
                        : "border border-transparent text-zinc-300 hover:bg-neon/[0.05]"
                    }`}
                  >
                    <span className="flex w-full items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-sm">{option.name}</span>
                      <span className="shrink-0 font-mono text-sm text-neon">
                        {formatCredits(option.price)}
                      </span>
                    </span>
                    <span className="text-[0.65rem] text-zinc-500">
                      Min increment: {compactIncrement(option.minIncrement)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
