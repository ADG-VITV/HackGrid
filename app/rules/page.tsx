import React from "react";
import BulgeGrid from "@/components/BulgeGrid";

/* ========================================
   FONT
   "Geist Pixel" — falls back to Geist Mono, then monospace, so the page
   still looks right even if the exact pixel font variable isn't defined
   in this project yet. Change this string if your font variable/name
   is different. */
const FONT_FAMILY = "var(--font-geist-pixel), 'Geist Mono', monospace";

/* ========================================
   THEME
   Matches the neon-green look used across the rest of the site
   (hero countdown clock / footer crystals). */
const NEON = "#42ff5a";

/* ---------------------------------------------------------------------
   Small reusable building blocks
--------------------------------------------------------------------- */

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: `${NEON}b3` }}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className="text-2xl font-bold sm:text-3xl"
        style={{ color: NEON, textShadow: `0 0 14px ${NEON}80` }}
      >
        {title}
      </h2>
    </div>
  );
}

function SubHeading({ title }: { title: string }) {
  return (
    <h3 className="mb-3 text-lg font-semibold text-white sm:text-xl">
      {title}
    </h3>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 sm:p-8 ${className}`}
      style={{
        borderColor: `${NEON}26`,
        backgroundColor: "rgba(0,0,0,0.35)",
      }}
    >
      {children}
    </div>
  );
}

function RuleList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm text-gray-200 sm:text-base">
          <span
            className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: NEON }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function RoundMeta({
  resources,
  reserve,
}: {
  resources: number;
  reserve: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-3 text-xs sm:text-sm">
      <span
        className="rounded-full border px-3 py-1"
        style={{
          borderColor: `${NEON}4d`,
          backgroundColor: `${NEON}1a`,
          color: NEON,
        }}
      >
        {resources} resources up for auction
      </span>
      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-gray-300">
        Reserve locked: {reserve}
      </span>
    </div>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div
      className="overflow-x-auto rounded-xl border"
      style={{ borderColor: `${NEON}26` }}
    >
      <table className="w-full min-w-[560px] border-collapse text-left text-sm sm:text-base">
        <thead>
          <tr style={{ backgroundColor: `${NEON}14` }}>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-3 font-semibold"
                style={{ color: NEON, borderBottom: `1px solid ${NEON}33` }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={ri % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="border-b border-white/5 px-4 py-3 align-top text-gray-200"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Page
--------------------------------------------------------------------- */

export default function Placeholder() {
  return (
    <div
      className="relative w-full overflow-hidden bg-black"
      style={{ fontFamily: FONT_FAMILY }}
    >
      {/* Animated bulge-grid background — fixed to the viewport so its
          canvas (drawn at window size) isn't stretched across the full,
          much-taller scroll height of this page. */}
      <div className="fixed inset-0 z-0 h-screen w-screen">
        <BulgeGrid />
      </div>

      {/* Light overlay just for text contrast — grid stays clearly visible */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] h-screen w-screen bg-black/20"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {/* Page title */}
        <div className="mb-14 text-center sm:mb-20">
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-[0.4em]"
            style={{ color: `${NEON}b3` }}
          >
            Read before you begin
          </p>
          <h1
            className="text-3xl font-bold sm:text-5xl"
            style={{ color: NEON, textShadow: `0 0 22px ${NEON}80` }}
          >
            Auction &amp; Project Guidelines
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-300 sm:text-base">
            Everything your team needs to know about how the auction works
            and how your final project will be scoped and judged.
          </p>
        </div>

        {/* ================= AUCTION GUIDELINES ================= */}
        <section className="mb-20 space-y-10 sm:mb-28">
          <SectionHeading eyebrow="" title="Auction Guidelines" />

          {/* Rules, Rounds, and Resource Catalog */}
          <Panel>
            <SubHeading title="Rules, Rounds, and Resource Catalog" />
            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold text-white sm:text-base">
                Auction Rules
              </p>
              <RuleList
                items={[
                  "The auction consists of 4 sequential rounds: Track Auction, AI Rights, AI Capability, and Customer Segment.",
                  "Each round has N resources for N teams. Every team must receive exactly one resource per round.",
                  "The guidelines list all resources available in each round, a small description, along with each resource's starting bid and minimum bid increment.",
                  "Each team starts with 10,000 credits. Credits spent on a resource are permanently deducted from the team's total balance.",
                  "A reserve balance is locked during each round: 3,000 in Round 1, 2,000 in Round 2, 1,000 in Round 3, and 0 in Round 4. Only the remaining balance is available for bidding.",
                  "A team can submit a bid only if its Available Balance is sufficient to cover the bid. The Bid option is disabled otherwise.",
                  "After each valid bid, a 13-second countdown starts/resets. If no higher bid is placed before the countdown expires, the current highest bidder wins the resource.",
                  "Each resource has a maximum auction duration of 7 minutes. At 7 minutes, bidding closes and the current highest bidder wins.",
                  "If no bid is placed during the entire 7-minute period, the resource is randomly assigned to a team, and that team pays the resource's starting bid.",
                  "Once a team wins or is assigned a resource in a round, it is removed from further bidding in that round. The next resource then goes up for auction.",
                ]}
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-white sm:text-base">
                Starting Credits &amp; Reserve Schedule
              </p>
              <p className="mb-4 text-sm text-gray-300">
                Every team begins the auction with a balance of 10,000
                credits. As each round begins, a portion of the total
                balance is locked as a reserve and is unavailable for
                bidding in that round:
              </p>
              <DataTable
                headers={["Round", "Reserve Locked", "Available for Bidding"]}
                rows={[
                  [
                    "Round 1: Track Auction",
                    "3,000 cr",
                    "10,000 cr minus reserve minus prior spend",
                  ],
                  [
                    "Round 2: AI Rights",
                    "2,000 cr",
                    "10,000 cr minus reserve minus prior spend",
                  ],
                  [
                    "Round 3: AI Capability",
                    "1,000 cr",
                    "10,000 cr minus reserve minus prior spend",
                  ],
                  [
                    "Round 4: Customer Segment",
                    "0 cr",
                    "10,000 cr minus reserve minus prior spend",
                  ],
                ]}
              />
            </div>
          </Panel>

          {/* Round 1 */}
          <Panel>
            <SubHeading title="Round 1: Track Auction" />
            <RoundMeta resources={5} reserve="3,000 credits" />
            <DataTable
              headers={["Resource", "Description", "Starting Bid", "Min. Increment"]}
              rows={[
                [
                  "Developer Tools",
                  "Tools and platforms for building, testing, and deploying software.",
                  "1,000 cr",
                  "150 cr",
                ],
                [
                  "Finance",
                  "Applications addressing banking, investing, and financial services needs.",
                  "800 cr",
                  "125 cr",
                ],
                [
                  "Healthcare",
                  "Solutions supporting clinical, diagnostic, and patient-care use cases.",
                  "600 cr",
                  "100 cr",
                ],
                [
                  "Education",
                  "Tools for teaching, learning, and educational content delivery.",
                  "400 cr",
                  "75 cr",
                ],
                [
                  "Agriculture",
                  "Solutions for farming, crop management, and agricultural supply chains.",
                  "250 cr",
                  "—",
                ],
              ]}
            />
          </Panel>

          {/* Round 2 */}
          <Panel>
            <SubHeading title="Round 2: AI Rights" />
            <RoundMeta resources={4} reserve="2,000 credits" />
            <DataTable
              headers={["Resource", "Description", "Starting Bid", "Min. Increment"]}
              rows={[
                [
                  "Generative AI",
                  "Rights to build products using generative AI models (text, image, and beyond).",
                  "1,000 cr",
                  "150 cr",
                ],
                [
                  "Predictive & Analytical AI",
                  "Rights to use predictive modeling and analytics-driven AI.",
                  "800 cr",
                  "125 cr",
                ],
                [
                  "Computer Vision",
                  "Rights to use image and video recognition AI capabilities.",
                  "600 cr",
                  "100 cr",
                ],
                [
                  "Speech & Audio AI",
                  "Rights to use speech recognition and audio processing AI.",
                  "400 cr",
                  "—",
                ],
              ]}
            />
          </Panel>

          {/* Round 3 */}
          <Panel>
            <SubHeading title="Round 3: AI Capability" />
            <RoundMeta resources={4} reserve="1,000 credits" />
            <DataTable
              headers={["Resource", "Description", "Starting Bid", "Min. Increment"]}
              rows={[
                [
                  "Autonomous Workflow (full agent systems)",
                  "Full multi-step autonomous agent systems that operate with minimal human input.",
                  "1,000 cr",
                  "150 cr",
                ],
                [
                  "Multi-Agent (LangGraph etc.)",
                  "Coordinated systems of multiple cooperating AI agents.",
                  "800 cr",
                  "125 cr",
                ],
                [
                  "Single Agent",
                  "A single AI agent handling a defined task or workflow.",
                  "600 cr",
                  "100 cr",
                ],
                [
                  "Single Prompt (no agents)",
                  "Direct single-prompt AI interactions without agentic behavior.",
                  "400 cr",
                  "—",
                ],
              ]}
            />
          </Panel>

          {/* Round 4 */}
          <Panel>
            <SubHeading title="Round 4: Customer Segment" />
            <RoundMeta resources={4} reserve="0 credits" />
            <DataTable
              headers={["Resource", "Description", "Starting Bid", "Min. Increment"]}
              rows={[
                [
                  "Organizations",
                  "Enterprise and large-organization customers.",
                  "1,000 cr",
                  "150 cr",
                ],
                [
                  "Small Businesses",
                  "Small and medium-sized business customers.",
                  "800 cr",
                  "125 cr",
                ],
                [
                  "Professionals",
                  "Individual professionals and freelancers.",
                  "600 cr",
                  "100 cr",
                ],
                [
                  "Individuals",
                  "Individual consumer end-users.",
                  "400 cr",
                  "—",
                ],
              ]}
            />
          </Panel>
        </section>

        {/* ================= PROJECT GUIDELINES ================= */}
        <section className="space-y-10">
          <SectionHeading eyebrow="" title="Project Guidelines" />
          <p className="-mt-6 text-sm text-gray-300 sm:text-base">
            Building, Judging, and Submitting Your Auction-Constrained
            Project
          </p>

          {/* Scope & Constraints */}
          <Panel>
            <SubHeading title="1. Project Scope & Constraints" />
            <RuleList
              items={[
                "The project must be built using only the resources won during the auction — the Track, AI Rights, AI Capability, and Customer Segment your team was awarded.",
                "Every design and implementation decision should be traceable back to those four won resources; no substituting an unwon Track, AI Rights tier, AI Capability tier, or Customer Segment.",
                "If a resource was won with a specific tier (e.g. Single Agent vs. Autonomous Workflow), the project must not exceed the capability of that tier.",
                "Deviating from won resources — even partially — counts as a violation and will be evaluated under the Integrity criterion below.",
              ]}
            />
          </Panel>

          {/* Judging Criteria */}
          <Panel>
            <SubHeading title="2. Judging Criteria" />
            <p className="text-sm text-gray-200 sm:text-base">
              Projects are judged on two primary dimensions: how strong the
              idea is as a real SaaS business, and how faithfully the team
              worked within its auction-won constraints.
            </p>
          </Panel>

          {/* Required Deliverables */}
          <Panel>
            <SubHeading title="3. Required Deliverables" />
            <DataTable
              headers={["Deliverable", "Requirement"]}
              rows={[
                [
                  "Source Code",
                  "Full, working codebase in a shared repository (or zipped folder), with a README explaining setup and run instructions.",
                ],
                [
                  "Business Document",
                  "A single document covering the business idea, problem statement, market gap, GTM, PMF, business model, and competitive landscape (see table below).",
                ],
              ]}
            />
          </Panel>

          {/* Business Document Contents */}
          <Panel>
            <SubHeading title="3.1 Business Document Contents" />
            <p className="mb-4 text-sm text-gray-300">
              The business document should be a single, readable write-up
              (slides or pages) covering the following sections:
            </p>
            <DataTable
              headers={["Section", "What It Should Cover"]}
              rows={[
                [
                  "Business Idea",
                  "One or two paragraphs describing what the product is and what it does.",
                ],
                [
                  "Problem Statement",
                  "The specific pain point being solved, and for whom.",
                ],
                [
                  "Market Gap",
                  "Why existing solutions fall short and what white space this product occupies.",
                ],
                [
                  "Target Customer & Segment",
                  "Must match the Customer Segment won at auction.",
                ],
                [
                  "Product Market Fit (PMF)",
                  "Evidence or reasoning for why this segment needs and will adopt this product.",
                ],
                [
                  "Business Model & Monetization",
                  "Pricing model, revenue streams, and unit economics assumptions.",
                ],
                [
                  "Competitive Landscape",
                  "Key competitors or alternatives and how this product differentiates.",
                ],
              ]}
            />
          </Panel>
        </section>
      </div>
    </div>
  );
}