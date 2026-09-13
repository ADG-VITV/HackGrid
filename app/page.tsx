import BulgeGrid from "@/components/BulgeGrid";
import Hero from "@/components/hero/hero";
import Footer from "@/components/footer1";

export default function Home() {
  return (
    <>
      <section className="relative h-screen w-full overflow-hidden bg-black cursor-none">
        <BulgeGrid />
        <Hero />
      </section>

      <Footer />
    </>
  );
}