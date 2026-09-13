import React from "react";

function HackDetails() {
  return (
    <section
      id="about-hack"
      className="relative flex min-h-screen w-full items-center justify-center bg-transparent text-white"
    >
      {/* TODO(rishi): add About HackGrid content here */}
      <>
        {/* Import fonts for the component */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Orbitron:wght@600;700;800;900&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');
        `}} />

        <div className="relative w-full max-w-[1200px] min-h-[clamp(460px,55vh,600px)] flex flex-col justify-center mx-auto p-[clamp(36px,5vw,90px)_clamp(18px,4.5vw,60px)] sm:p-[clamp(60px,7vw,90px)_clamp(30px,4.5vw,60px)] overflow-hidden text-white font-['Rajdhani',sans-serif] bg-[linear-gradient(135deg,rgba(6,12,7,0.4)_0%,rgba(2,5,3,0.5)_100%)] border border-[rgba(66,255,90,0.28)] shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(66,255,90,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[14px] before:content-[''] before:absolute before:z-[2] before:w-[18px] before:h-[18px] before:border-2 before:border-[#42ff5a] before:pointer-events-none before:top-[11px] before:left-[11px] before:border-r-0 before:border-b-0 after:content-[''] after:absolute after:z-[2] after:w-[18px] after:h-[18px] after:border-2 after:border-[#42ff5a] after:pointer-events-none after:bottom-[11px] after:right-[11px] after:border-l-0 after:border-t-0">
          <div
            className="absolute top-[6px] right-[4%] z-0 text-[rgba(66,255,90,0.04)] font-['Orbitron',sans-serif] text-[clamp(50px,9vw,115px)] font-black leading-none tracking-[5px] pointer-events-none select-none whitespace-nowrap"
            aria-hidden="true"
          >
            HACKGRID
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-[0.95fr_1.05fr] gap-[24px] md:gap-[clamp(28px,4.5vw,54px)] items-center">

            {/* Left Column: Heading */}
            <div className="flex flex-col justify-center">
              <span className="block mb-[4px] text-white font-['Share_Tech_Mono',monospace] text-[12px] tracking-[3.5px] uppercase">
                THE
              </span>
              <h2 className="m-0 text-white font-['Bebas_Neue',sans-serif] text-[clamp(60px,15vw,92px)] md:text-[clamp(70px,9.5vw,124px)] font-normal leading-[0.78] tracking-[1px] uppercase">
                <span className="block text-white">GRID</span>
                <span className="block text-[#42ff5a] [text-shadow:0_0_14px_rgba(66,255,90,0.75),0_0_30px_rgba(66,255,90,0.45),0_0_60px_rgba(66,255,90,0.3)]">
                  IS LIVE.
                </span>
              </h2>
            </div>

            {/* Right Column: Description & Stats */}
            <div className="flex flex-col gap-[13px]">
              <p className="m-0 text-white text-[clamp(17px,1.7vw,21px)] font-medium leading-[1.28] tracking-[0.2px]">
                HackGrid is a 36-hour auction-based hackathon that reimagines the traditional hackathon model.
              </p>

              <p className="m-0 text-[#a8c0ad] text-[clamp(13px,1.1vw,14.5px)] font-normal leading-[1.48] tracking-[0.15px]">
                Participants strategically bid for SaaS problem statements, form winning approaches, and build scalable solutions for real-world challenges.
              </p>

              <p className="m-0 text-[#a8c0ad] text-[clamp(13px,1.1vw,14.5px)] font-normal leading-[1.48] tracking-[0.15px]">
                Developers, designers, entrepreneurs, and problem-solvers come together to turn ideas into impactful products in a fast-paced auction-driven arena.
              </p>

              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 mt-[4px] sm:mt-[6px] pt-[12px] pb-[10px] border-t border-[rgba(66,255,90,0.22)] sm:border-b sm:border-b-[rgba(66,255,90,0.1)] gap-[10px] sm:gap-0">
                <div className="flex flex-col gap-[2px] pb-[8px] sm:pb-0 sm:px-[12px] border-b border-[rgba(66,255,90,0.1)] sm:border-b-0 sm:border-r sm:border-r-[rgba(66,255,90,0.22)] sm:pl-0">
                  <span className="font-['Orbitron',sans-serif] text-[clamp(17px,1.6vw,20px)] font-bold text-[#42ff5a] leading-[1.1] tracking-[0.8px]">
                    36
                  </span>
                  <span className="font-['Share_Tech_Mono',monospace] text-[9.5px] text-[#8ba892] tracking-[1.4px] uppercase">
                    HOURS
                  </span>
                </div>
                <div className="flex flex-col gap-[2px] pb-[8px] sm:pb-0 sm:px-[12px] border-b border-[rgba(66,255,90,0.1)] sm:border-b-0 sm:border-r sm:border-r-[rgba(66,255,90,0.22)]">
                  <span className="font-['Orbitron',sans-serif] text-[clamp(17px,1.6vw,20px)] font-bold text-[#42ff5a] leading-[1.1] tracking-[0.8px]">
                    04
                  </span>
                  <span className="font-['Share_Tech_Mono',monospace] text-[9.5px] text-[#8ba892] tracking-[1.4px] uppercase">
                    AUCTION ROUNDS
                  </span>
                </div>
                <div className="flex flex-col gap-[2px] sm:px-[12px] sm:pr-0">
                  <span className="font-['Orbitron',sans-serif] text-[clamp(17px,1.6vw,20px)] font-bold text-[#42ff5a] leading-[1.1] tracking-[0.8px]">
                    01
                  </span>
                  <span className="font-['Share_Tech_Mono',monospace] text-[9.5px] text-[#8ba892] tracking-[1.4px] uppercase">
                    GRID
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>

    </section>
  );
}

export default HackDetails;
