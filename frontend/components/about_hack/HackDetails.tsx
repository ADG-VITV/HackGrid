import {
  Body,
  GlowSection,
  Lead,
  NeonLine,
  SectionBody,
  SectionTitle,
  StatGrid,
} from "@/components/ui/GlowSection";

export default function HackDetails() {
  return (
    <GlowSection id="about-hack" watermark="HACKGRID">
      <SectionTitle eyebrow="THE">
        <span className="block">GRID</span>
        <NeonLine>IS LIVE.</NeonLine>
      </SectionTitle>

      <SectionBody>
        <Lead>
          HackGrid is a 36-hour auction-based hackathon that reimagines the
          traditional hackathon model.
        </Lead>
        <Body>
          Participants strategically bid for SaaS problem statements, form
          winning approaches, and build scalable solutions for real-world
          challenges.
        </Body>
        <Body>
          Developers, designers, entrepreneurs, and problem-solvers come
          together to turn ideas into impactful products in a fast-paced
          auction-driven arena.
        </Body>

        <StatGrid
          items={[
            { value: "36", label: "Hours" },
            { value: "04", label: "Auction rounds" },
            { value: "01", label: "Grid" },
          ]}
        />
      </SectionBody>
    </GlowSection>
  );
}
