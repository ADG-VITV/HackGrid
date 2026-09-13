import BulgeGrid from "@/components/BulgeGrid";
import Hero from "@/components/hero/hero";
import HackGridTimeline from "@/components/timeline/timeline";
import ADG_details from "@/components/aboutADG/ADG_details";
import HackDetails from "@/components/about_hack/HackDetails";
import Footer from "@/components/footer1";

export default function Home() {
  return (
    <>
      <section className="relative h-screen w-full overflow-hidden bg-transparent cursor-none">
        <BulgeGrid />
        <Hero />
        
      </section>
      <HackGridTimeline />
      

      <ADG_details />
      <HackDetails />
      <Footer />
    </>
  );
}