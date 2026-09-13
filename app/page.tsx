import BulgeGrid from "@/components/BulgeGrid";
import Hero from "@/components/hero/hero";
import ADG_details from "@/components/aboutADG/ADG_details";
import HackDetails from "@/components/about_hack/HackDetails";

export default function Home() {
  return (
    <main className="relative bg-[#060c07] text-white min-h-screen">
      {/* Content wrapper */}
      <div className="relative z-10">
        {/* Fixed animated grid background */}
        <div className="fixed inset-0 -z-10 pointer-events-none" style={{ transform: 'translateZ(0)' }}>
          <BulgeGrid />
        </div>
        <section className="relative h-screen w-full overflow-hidden cursor-none">
          <Hero />
        </section>

        <ADG_details />
        <HackDetails />
      </div>
    </main>
  );
}
