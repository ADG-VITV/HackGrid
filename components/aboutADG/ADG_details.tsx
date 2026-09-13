import React from 'react';

export default function ADG_details() {
  return (
    <div className="min-h-screen bg-transparent flex justify-center items-center p-5 sm:p-10 box-border">
      {/* Import fonts for the component */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Orbitron:wght@600;700;800;900&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');
      `}} />

      <section
        id="about-adg"
        className="relative w-full max-w-[1200px] min-h-[clamp(460px,55vh,600px)] flex flex-col justify-center mx-auto p-[clamp(36px,5vw,90px)_clamp(18px,4.5vw,60px)] sm:p-[clamp(60px,7vw,90px)_clamp(30px,4.5vw,60px)] overflow-hidden text-white font-['Rajdhani',sans-serif] bg-[linear-gradient(135deg,rgba(6,12,7,0.4)_0%,rgba(2,5,3,0.5)_100%)] border border-[rgba(66,255,90,0.28)] shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(66,255,90,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[14px] before:content-[''] before:absolute before:z-[2] before:w-[18px] before:h-[18px] before:border-2 before:border-[#42ff5a] before:pointer-events-none before:top-[11px] before:left-[11px] before:border-r-0 before:border-b-0 after:content-[''] after:absolute after:z-[2] after:w-[18px] after:h-[18px] after:border-2 after:border-[#42ff5a] after:pointer-events-none after:bottom-[11px] after:right-[11px] after:border-l-0 after:border-t-0"
      >
        <div
          className="absolute top-[2px] right-[4%] z-0 text-[rgba(66,255,90,0.05)] font-['Orbitron',sans-serif] text-[clamp(88px,16vw,185px)] font-black leading-none tracking-[-8px] pointer-events-none select-none"
          aria-hidden="true"
        >
          ADG
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-[minmax(280px,auto)_1fr] gap-[24px] md:gap-[clamp(28px,4vw,52px)] items-center">

          <div className="flex flex-col justify-center shrink-0">
            <span className="block mb-[6px] text-white font-['Share_Tech_Mono',monospace] text-[12px] tracking-[3.5px] uppercase">
              WE ARE
            </span>
            <h2 className="m-0 text-white font-['Bebas_Neue',sans-serif] text-[clamp(60px,15vw,92px)] md:text-[clamp(70px,9.5vw,124px)] font-normal leading-[0.8] tracking-[1px] uppercase whitespace-nowrap">
              <span className="block">THIS IS</span>
              <span className="block text-[#42ff5a] [text-shadow:0_0_14px_rgba(66,255,90,0.75),0_0_30px_rgba(66,255,90,0.45),0_0_60px_rgba(66,255,90,0.3)]">
                ADG<span className="text-white">!!</span>
              </span>
            </h2>
            <p className="mt-[24px] mb-0 text-[#42ff5a] font-['Share_Tech_Mono',monospace] text-[10px] tracking-[1.8px]">
              INNOVATE. COLLABORATE. IMPACT.
            </p>
          </div>

          <div className="flex flex-col gap-[15px]">
            <p className="m-0 text-white text-[clamp(17px,1.7vw,21px)] font-medium leading-[1.35] tracking-[0.2px]">
              Advanced Developers Group is a technology-focused student club for passionate developers, innovators, and tech enthusiasts.
            </p>
            <p className="m-0 text-[#a8c0ad] text-[clamp(13px,1.1vw,14.5px)] font-normal leading-[1.55] tracking-[0.15px]">
              We provide a platform for students to explore emerging technologies, strengthen their technical skills, and turn bold ideas into real-world projects.
            </p>

            <div
              className="grid grid-cols-1 sm:grid-cols-3 mt-[8px] pt-[15px] pb-[12px] border-t border-[rgba(66,255,90,0.22)] sm:border-b sm:border-b-[rgba(66,255,90,0.1)] gap-[10px] sm:gap-0"
              aria-label="ADG focus areas"
            >
              <div className="flex flex-col gap-[3px] pb-[8px] sm:pb-0 sm:px-[12px] border-b border-[rgba(66,255,90,0.1)] sm:border-b-0 sm:border-r sm:border-r-[rgba(66,255,90,0.22)] sm:pl-0">
                <span className="text-[#8ba892] font-['Share_Tech_Mono',monospace] text-[9px] tracking-[1.2px]">01</span>
                <span className="text-[#42ff5a] font-['Orbitron',sans-serif] text-[clamp(13px,1.25vw,16px)] font-bold tracking-[0.6px]">LEARN</span>
                <small className="text-[#8ba892] font-['Rajdhani',sans-serif] text-[12px] leading-[1.15]">Explore emerging tech</small>
              </div>
              <div className="flex flex-col gap-[3px] pb-[8px] sm:pb-0 sm:px-[12px] border-b border-[rgba(66,255,90,0.1)] sm:border-b-0 sm:border-r sm:border-r-[rgba(66,255,90,0.22)]">
                <span className="text-[#8ba892] font-['Share_Tech_Mono',monospace] text-[9px] tracking-[1.2px]">02</span>
                <span className="text-[#42ff5a] font-['Orbitron',sans-serif] text-[clamp(13px,1.25vw,16px)] font-bold tracking-[0.6px]">BUILD</span>
                <small className="text-[#8ba892] font-['Rajdhani',sans-serif] text-[12px] leading-[1.15]">Strengthen your skills</small>
              </div>
              <div className="flex flex-col gap-[3px] sm:px-[12px] sm:pr-0">
                <span className="text-[#8ba892] font-['Share_Tech_Mono',monospace] text-[9px] tracking-[1.2px]">03</span>
                <span className="text-[#42ff5a] font-['Orbitron',sans-serif] text-[clamp(13px,1.25vw,16px)] font-bold tracking-[0.6px]">CREATE</span>
                <small className="text-[#8ba892] font-['Rajdhani',sans-serif] text-[12px] leading-[1.15]">Make an impact</small>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
