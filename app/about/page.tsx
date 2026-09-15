import BulgeGrid from "@/components/BulgeGrid";
import ADG_details from "@/components/aboutADG/ADG_details";
import HackDetails from "@/components/about_hack/HackDetails";
import Footer from "@/components/footer1";

export default function AboutPage() {
  return (
    <>
      <div className="fixed inset-0 z-0 h-screen w-screen bg-[#030704]">
        <BulgeGrid />
      </div>

      <div className="relative z-10">
        <div id="about">
          <HackDetails />
        </div>
        <ADG_details />
        <Footer />
      </div>
    </>
  );
}
