import {
  Body,
  GlowSection,
  Lead,
  NeonLine,
  SectionBody,
  SectionTitle,
  StatGrid,
} from "@/components/ui/GlowSection";

export default function ADG_details() {
  return (
    <GlowSection id="about-adg" watermark="ADG">
      <SectionTitle eyebrow="WE ARE" tagline="INNOVATE. COLLABORATE. IMPACT.">
        <span className="block">THIS IS</span>
        <NeonLine>
          ADG<span className="text-white">!!</span>
        </NeonLine>
      </SectionTitle>

      <SectionBody>
        <Lead>
          Advanced Developers Group is a technology-focused student club for
          passionate developers, innovators, and tech enthusiasts.
        </Lead>
        <Body>
          We provide a platform for students to explore emerging technologies,
          strengthen their technical skills, and turn bold ideas into
          real-world projects.
        </Body>

        <StatGrid
          items={[
            { index: "01", value: "LEARN", label: "Explore emerging tech" },
            { index: "02", value: "BUILD", label: "Strengthen your skills" },
            { index: "03", value: "CREATE", label: "Make an impact" },
          ]}
        />
      </SectionBody>
    </GlowSection>
  );
}
