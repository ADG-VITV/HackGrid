import BulgeGrid from "@/components/BulgeGrid";
import Hero from "@/components/hero/hero";
import HackGridTimeline from "@/components/timeline/timeline";

export default function Home() {
  return (
    <>
      <section className="relative h-screen w-full overflow-hidden bg-transparent cursor-none">
        <BulgeGrid />
        <Hero />
        
      </section>
      <HackGridTimeline />
      
    </>
  );
}
