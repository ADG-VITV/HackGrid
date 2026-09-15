import BulgeGrid from "@/components/BulgeGrid";
import Footer from "@/components/footer1";
import HackGridTimeline from "@/components/timeline/timeline";

export default function TimelinePage() {
  return (
    <>
      <div className="fixed inset-0 z-0 h-screen w-screen bg-[#030704]">
        <BulgeGrid />
      </div>

      <div className="relative z-10">
        <HackGridTimeline />
        <Footer />
      </div>
    </>
  );
}
