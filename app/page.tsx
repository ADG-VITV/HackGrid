import BulgeGrid from "@/components/BulgeGrid";
import Hero from "@/components/hero/hero";
import HackGridTimeline from "@/components/timeline/timeline";
import ADG_details from "@/components/aboutADG/ADG_details";
import HackDetails from "@/components/about_hack/HackDetails";
import Footer from "@/components/footer1";

export default function Home() {
  return (
    <main className="relative bg-[#060c07] text-white min-h-screen">
      {/* Animated bulge-grid background — fixed to the viewport so it sits
          behind every transparent section (hero + timeline), not just the hero.
          BulgeGrid itself is `absolute` so the footer can embed its own copy. */}
      <div className="fixed inset-0 z-0 h-screen w-screen bg-[#030704]">
        <BulgeGrid />
      </div>

      <section className="relative h-screen w-full overflow-hidden bg-transparent cursor-none">
        <Hero />
      </section>
      <HackDetails />
      <HackGridTimeline />
      <ADG_details />
      <Footer />
    </main>
  );
}
