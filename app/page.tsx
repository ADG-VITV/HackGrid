import BulgeGrid from "@/components/BulgeGrid";
import Hero from "@/components/hero/hero";
import ADG_details from "@/components/aboutADG/ADG_details";
import HackDetails from "@/components/about_hack/HackDetails";
import Footer from "@/components/footer1";

export default function Home() {
  return (
    <>
      <section className="relative h-screen w-full overflow-hidden bg-black cursor-none">
        <BulgeGrid />
        <Hero />
      </section>

      <ADG_details />
      <HackDetails />
      <Footer />
    </>
  );
}