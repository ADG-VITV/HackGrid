import BulgeGrid from "@/components/BulgeGrid";
import Hero from "@/components/hero/hero";
import HackGridTimeline from "@/components/timeline/timeline";
import ADG_details from "@/components/aboutADG/ADG_details";
import HackDetails from "@/components/about_hack/HackDetails";
import Footer from "@/components/footer1";

export default function Home() {
  return (
    <>
      {/* ClientLayout already wraps the page in <main>, so no second one here.
          One viewport-fixed grid sits behind every transparent section,
          including the footer, so its lines never restart at section bounds. */}
      <div className="fixed inset-0 z-0 h-screen w-screen bg-[#030704]">
        <BulgeGrid />
      </div>

      <section id="home" className="relative h-screen w-full overflow-hidden bg-transparent cursor-none">
        <Hero />
      </section>

      <div id="about">
        <HackDetails />
      </div>
      <HackGridTimeline />
      <ADG_details />
      <Footer />
    </>
  );
}
