import BulgeGrid from "@/components/BulgeGrid";
import TechCursor from "@/components/TechCursor";
import { Navbar } from "@/components/ui/Navbar";
import Hero from "@/components/hero/hero";
import Footer from "@/components/footer/footer";

export default function Home() {
  return (
    <>
      <main className="relative h-screen w-screen bg-black overflow-hidden cursor-none">
        <TechCursor />
        <BulgeGrid />
        <Hero />
      </main>

<<<<<<< HEAD
      <Footer />
    </>
=======
      <Navbar />

      <Hero />

    </main>
>>>>>>> c6f265330b0dec4b8565e35f3dec155da4b719f4
  );
}