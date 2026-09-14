'use client';

import React from 'react';
import Image from 'next/image';
import {
  IconPhone,
  IconInstagram,
  IconLinkedIn,
  IconX,
  IconEmail,
} from './FooterIcons';

export default function Footer(): React.JSX.Element {
  const scrollToTop = (): void => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative w-full min-h-screen overflow-hidden bg-transparent text-white font-sans selection:bg-[#42ff5a] selection:text-black flex flex-col justify-end">
      {/* The shared page-level BulgeGrid remains visible below these footer-only effects. */}

      {/* 1. Deep Radar Floor Ambience */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] [background:radial-gradient(130%_65%_at_50%_100%,rgba(16,110,45,0.55)_0%,rgba(8,60,26,0.3)_40%,transparent_80%)]"
        aria-hidden="true"
      />

      {/* 2. Screen Bloom behind the logo and texts */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] mix-blend-screen [background:radial-gradient(85%_48%_at_50%_92%,rgba(66,255,90,0.28)_0%,rgba(20,120,50,0.12)_45%,transparent_75%)]"
        aria-hidden="true"
      />

      {/* 3. Edge-to-Edge Lateral Floor Flare */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-52 bg-gradient-to-t from-[#20bd44]/35 via-[#16a34a]/15 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-[3] h-32 w-[110vw] bg-gradient-to-t from-[#42ff5a]/25 to-transparent blur-2xl"
        aria-hidden="true"
      />

      {/* 4. Main Content Stack */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-end px-4 pb-8 pt-16 sm:px-6">
        
        {/* HACKGRID '26 LOGO */}
        <div className="flex w-full items-center justify-center pb-6">
          <button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="group relative aspect-[5.75/1] w-[88vw] max-w-[800px] cursor-pointer transition-transform duration-300 hover:scale-[1.015] focus:outline-none"
          >
            <Image
              src="/NewLogo.png"
              alt="HackGrid '26"
              fill
              priority
              unoptimized
              className="select-none object-contain mix-blend-screen [filter:drop-shadow(0_0_28px_rgba(66,255,90,0.8))] transition-[filter] duration-300 group-hover:[filter:drop-shadow(0_0_42px_rgba(66,255,90,0.95))]"
              draggable={false}
            />
          </button>
        </div>

        {/* DETAILS STACK */}
        <div className="mt-4 flex flex-col items-center w-full max-w-2xl">
          
          {/* Status Capsule */}
          <div className="mb-8 flex items-center gap-2 rounded-full border border-[#42ff5a]/40 bg-black/80 px-4 py-1 backdrop-blur-md shadow-[0_0_14px_rgba(66,255,90,0.15)]">
            <span className="font-mono text-[10px] font-semibold tracking-[0.25em] text-[#42ff5a] uppercase">
              CONTACT POINTS
            </span>
          </div>

          {/* Dual Symmetrical POC Pods */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-12 sm:gap-20 w-full max-w-lg">
            {/* POC 1: Sharva */}
            <div className="group flex flex-col items-end text-right">
              <span className="font-mono text-[10px] tracking-[0.2em] text-neutral-400 uppercase">
                POC 1
              </span>
              <p className="mt-1.5 text-sm sm:text-base font-semibold text-white tracking-wide group-hover:text-[#42ff5a] transition-colors">
                Sharva
              </p>
              <a
                href="tel:+918767863814"
                className="mt-2 flex items-center gap-2 font-mono text-xs text-neutral-300 transition hover:text-[#42ff5a]"
              >
                <IconPhone className="h-3.5 w-3.5 text-[#42ff5a]" />
                +91 87678 63814
              </a>
            </div>

            {/* Vertical Center Laser Divider */}
            <div className="h-12 w-[1px] bg-gradient-to-b from-transparent via-[#42ff5a]/60 to-transparent" />

            {/* POC 2: Shehfin */}
            <div className="group flex flex-col items-start text-left">
              <span className="font-mono text-[10px] tracking-[0.2em] text-neutral-400 uppercase">
                POC 2
              </span>
              <p className="mt-1.5 text-sm sm:text-base font-semibold text-white tracking-wide group-hover:text-[#42ff5a] transition-colors">
                Shehfin
              </p>
              <a
                href="tel:+918129038441"
                className="mt-2 flex items-center gap-2 font-mono text-xs text-neutral-300 transition hover:text-[#42ff5a]"
              >
                <IconPhone className="h-3.5 w-3.5 text-[#42ff5a]" />
                +91 81290 38441
              </a>
            </div>
          </div>

          {/* Social Links Dock (Enlarged Icons) */}
          <div className="mt-8 flex items-center gap-5 rounded-xl border border-white/10 bg-black/60 px-6 py-2.5 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            <a
              href="https://instagram.com/adgvit"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-neutral-400 transition-all duration-200 hover:-translate-y-0.5 hover:text-[#42ff5a]"
            >
              <IconInstagram className="h-5 w-5" />
            </a>
            <a
              href="https://linkedin.com/company/adgvit"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-neutral-400 transition-all duration-200 hover:-translate-y-0.5 hover:text-[#42ff5a]"
            >
              <IconLinkedIn className="h-5 w-5" />
            </a>
            <a
              href="https://x.com/adgvit"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="text-neutral-400 transition-all duration-200 hover:-translate-y-0.5 hover:text-[#42ff5a]"
            >
              <IconX className="h-5 w-5" />
            </a>
            <a
              href="mailto:ios@vit.ac.in"
              aria-label="Email"
              className="text-neutral-400 transition-all duration-200 hover:-translate-y-0.5 hover:text-[#42ff5a]"
            >
              <IconEmail className="h-5 w-5" />
            </a>
          </div>

          {/* Built Statement at the Bottom Floor */}
          <div className="mt-8 flex items-center justify-center gap-2 text-center">
            <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] text-[#86efac]/90 uppercase">
              BUILT WITH
            </span>
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-[#42ff5a] drop-shadow-[0_0_8px_#42ff5a]"
              aria-hidden="true"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] text-[#86efac]/90 uppercase">
              BY{' '}
              <span className="text-white">
                ADG-VIT
              </span>
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
}
