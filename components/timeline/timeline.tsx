"use client";

import React, { useEffect, useRef, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Space_Grotesk, JetBrains_Mono, Geist_Mono } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-geist-mono",
});

const noopSubscribe = () => () => {};

interface BaseNode {
  x: number;
  y: number;
}

// Added a new node at {x: 550, y: 320} for card-8 so card-9 can be the center terminal
const baseNodes: BaseNode[] = [
  { x: 100, y: 150 },
  { x: 400, y: 120 },
  { x: 700, y: 250 },
  { x: 680, y: 500 },
  { x: 450, y: 700 },
  { x: 200, y: 600 },
  { x: 120, y: 350 },
  { x: 330, y: 250 },
  { x: 550, y: 320 }, 
  { x: 400, y: 400 },
];

// Synced times to elapsed minutes: 
// 08:00 AM (480), 11:00 AM (660), 02:30 PM (870), 07:00 PM (1140), 12:00 AM (1440),
// 04:00 AM (1680), 05:30 AM (1770), 12:30 PM (2190), 02:30 PM (2310), 03:45 PM (2385)
const nodeTimes = [480, 660, 870, 1140, 1440, 1680, 1770, 2190, 2310, 2385];
const cipherLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

const eventsData = [
  { id: "card-0", time: "08:00 AM", seq: "SEQ_01", title: "Kickoff & Welcome", desc: "Registration, check-in, and opening remarks from our anchors and board members. Let the hackathon begin!", style: { left: "100px", top: "150px" }, push: "push-down" },
  { id: "card-1", time: "11:00 AM", seq: "SEQ_02", title: "Lunch Break", desc: "A midday pause on Day 1 before the final stretch begins.", style: { left: "400px", top: "120px" }, push: "push-down" },
  { id: "card-2", time: "02:30 PM", seq: "SEQ_03", title: "Review Sequence 1", desc: "Teams present their initial problem approach and solution strategy to mentors.", style: { left: "700px", top: "250px" }, push: "push-left" },
  { id: "card-3", time: "07:00 PM", seq: "SEQ_04", title: "Dinner Break", desc: "Time to unwind, eat, and get ready for the night of building ahead.", style: { left: "680px", top: "500px" }, push: "push-left" },
  { id: "card-4", time: "12:00 AM", seq: "SEQ_05", title: "Review Sequence 2", desc: "A deeper look into each team's progress, prototypes, and problem-solving direction.", style: { left: "450px", top: "700px" }, push: "push-up" },
  { id: "card-5", time: "04:00 AM", seq: "SEQ_06", title: "Review & Shortlisting", desc: "Final evaluation round of Day 1 to shortlist teams advancing to Day 2.", style: { left: "200px", top: "600px" }, push: "push-right" },
  { id: "card-6", time: "05:30 AM", seq: "SEQ_07", title: "Day 1 Wrap-Up", desc: "Day 1 concludes. Teams get a well-deserved break to rest and recharge overnight.", style: { left: "120px", top: "350px" }, push: "push-right" },
  { id: "card-7", time: "12:30 PM", seq: "SEQ_08", title: "Refuel Break", desc: "A short lunch break to recharge before diving into the first round of building.", style: { left: "330px", top: "250px" }, push: "push-left" },
  { id: "card-8", time: "02:30 PM", seq: "SEQ_09", title: "Final Showdown", desc: "Shortlisted teams present their final solutions for judgement by the panel.", style: { left: "550px", top: "320px" }, push: "push-left" },
  { id: "card-9", time: "03:45 PM", seq: "SEQ_10", title: "Grand Finale", desc: "Closing speech, winner announcement, and closing ceremony to wrap up the hackathon.", style: { left: "400px", top: "400px" }, push: "push-center" },
];

export default function HackGridTimeline() {
  /* false during SSR/hydration, true once on the client — without a
     setState-in-effect. */
  const isMounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const containerRef = useRef<HTMLDivElement>(null);
  const oldSegmentRef = useRef<SVGPathElement>(null);
  const prevSegmentRef = useRef<SVGPathElement>(null);
  const activeSegmentRef = useRef<SVGPathElement>(null);
  const dataPacketRef = useRef<SVGGElement>(null);
  const burstLayerRef = useRef<SVGGElement>(null);
  const clockHourRef = useRef<SVGGElement>(null);
  const clockMinRef = useRef<SVGGElement>(null);
  const clockDigitalSvgRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    if (!isMounted) return;

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    if (!window.location.hash || window.location.hash === "#home") {
      window.scrollTo(0, 0);
    }

    gsap.registerPlugin(ScrollTrigger);

    // --- PROCEDURAL PATH GENERATOR ---
    const pathPoints: BaseNode[] = [];
    for (let i = 0; i < baseNodes.length; i++) {
      pathPoints.push(baseNodes[i]);
      if (i < baseNodes.length - 1) {
        let rx = (baseNodes[i].x + baseNodes[i + 1].x) / 2 + (Math.random() - 0.5) * 450;
        let ry = (baseNodes[i].y + baseNodes[i + 1].y) / 2 + (Math.random() - 0.5) * 450;
        rx = Math.max(80, Math.min(720, rx));
        ry = Math.max(80, Math.min(720, ry));
        pathPoints.push({ x: rx, y: ry });
      }
    }

    let generatedPath = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
    for (let i = 1; i < pathPoints.length; i++) {
      generatedPath += ` L ${pathPoints[i].x} ${pathPoints[i].y}`;
    }

    const oldSeg = oldSegmentRef.current;
    const prevSeg = prevSegmentRef.current;
    const activeSeg = activeSegmentRef.current;
    if (!oldSeg || !prevSeg || !activeSeg) return;

    oldSeg.setAttribute("d", generatedPath);
    prevSeg.setAttribute("d", generatedPath);
    activeSeg.setAttribute("d", generatedPath);

    const pathLength = activeSeg.getTotalLength();

    [activeSeg, prevSeg, oldSeg].forEach((el) => {
      el.style.strokeDasharray = `0 ${pathLength * 2}`;
      el.style.strokeDashoffset = `0`;
    });

    const eventBlocks = document.querySelectorAll<HTMLElement>(".event-block");
    const nodeInstances = document.querySelectorAll<SVGElement>(".node-instance");
    const dataPacket = dataPacketRef.current;

    const nodeProgresses: number[] = [];
    let currentSearchStart = 0;

    nodeInstances.forEach((node, index) => {
      // Adjusted hardcoded index from 8 to 9 for the terminal node
      const nx = index === 9 ? 400 : parseFloat(node.getAttribute("x") || "400");
      const ny = index === 9 ? 400 : parseFloat(node.getAttribute("y") || "400");

      let minDst = Infinity;
      let closestLen = currentSearchStart;

      for (let i = currentSearchStart; i <= pathLength; i += 1) {
        const pt = activeSeg.getPointAtLength(i);
        const dst = Math.hypot(pt.x - nx, pt.y - ny);
        if (dst < minDst) {
          minDst = dst;
          closestLen = i;
        }
        if (minDst < 1 && dst > 5) break;
      }
      currentSearchStart = closestLen;
      nodeProgresses.push(closestLen / pathLength);
    });

    nodeProgresses[nodeProgresses.length - 1] = 1.0;

    function formatTime(totalMinutes: number) {
      let h = Math.floor(totalMinutes / 60) % 24;
      const m = Math.floor(totalMinutes % 60);
      const ampm = h >= 12 && h < 24 ? "PM" : "AM";
      if (h === 0 || h === 24) h = 12;
      else if (h > 12) h -= 12;
      const hh = h < 10 ? "0" + h : h;
      const mm = m < 10 ? "0" + m : m;
      return `${hh}:${mm} ${ampm}`;
    }

    const nodeFired = new Array(eventBlocks.length).fill(false);

    function scrambleText(element: HTMLElement | null) {
      if (!element) return;
      let iterations = 0;
      const finalValue = element.dataset.value || "";
      const speed = finalValue.length > 30 ? 1 : 1 / 3;
      const interval = setInterval(() => {
        element.innerText = finalValue
          .split("")
          .map((letter, index) => {
            if (index < iterations) return finalValue[index];
            if (letter === " ") return " ";
            return cipherLetters[Math.floor(Math.random() * cipherLetters.length)];
          })
          .join("");
        if (iterations >= finalValue.length) clearInterval(interval);
        iterations += speed;
      }, 20);
    }

    function fireBurst(x: number, y: number) {
      if (!burstLayerRef.current) return;
      const particleCount = 20;
      for (let i = 0; i < particleCount; i++) {
        const isWhite = Math.random() > 0.6;
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        rect.setAttribute("r", isWhite ? "1.5" : "2.5");
        rect.setAttribute("fill", isWhite ? "#ffffff" : "#42ff5a");
        rect.setAttribute("cx", x.toString());
        rect.setAttribute("cy", y.toString());
        burstLayerRef.current.appendChild(rect);

        const angle = ((Math.PI * 2) / particleCount) * i;
        const distance = 40 + Math.random() * 60;

        gsap.to(rect, {
          attr: { cx: x + Math.cos(angle) * distance, cy: y + Math.sin(angle) * distance },
          opacity: 0,
          duration: 0.5 + Math.random() * 0.7,
          ease: "power3.out",
          onComplete: () => rect.remove(),
        });
      }
    }

    function getMagneticProgress(p: number) {
      const lockWindow = 0.02;
      for (let i = 0; i < nodeProgresses.length; i++) {
        if (Math.abs(p - nodeProgresses[i]) <= lockWindow) return nodeProgresses[i];
      }
      let startP = 0,
        startMap = 0,
        endP = 1,
        endMap = 1;
      for (let i = 0; i < nodeProgresses.length; i++) {
        if (p < nodeProgresses[i] - lockWindow) {
          endP = nodeProgresses[i] - lockWindow;
          endMap = nodeProgresses[i];
          break;
        }
        startP = nodeProgresses[i] + lockWindow;
        startMap = nodeProgresses[i];
      }
      if (endP === startP) return startMap;
      let ratio = (p - startP) / (endP - startP);
      ratio = (Math.sin((ratio - 0.5) * Math.PI) + 1) / 2;
      return startMap + ratio * (endMap - startMap);
    }

    function updateSegment(element: SVGPathElement, startP: number, endP: number) {
      const start = startP * pathLength;
      const end = endP * pathLength;
      const len = Math.max(0, end - start);
      element.style.strokeDasharray = `${len} ${pathLength * 2}`;
      element.style.strokeDashoffset = `${-start}`;
    }

    const scroller = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.2,
      onUpdate: (self) => {
        const magneticProgress = getMagneticProgress(self.progress);

        let lastNodeIndex = 0;
        for (let i = 0; i < nodeProgresses.length; i++) {
          if (magneticProgress >= nodeProgresses[i] - 0.001) lastNodeIndex = i;
        }

        updateSegment(activeSeg, nodeProgresses[lastNodeIndex], magneticProgress);
        if (lastNodeIndex >= 1) {
          updateSegment(prevSeg, nodeProgresses[lastNodeIndex - 1], nodeProgresses[lastNodeIndex]);
        } else {
          updateSegment(prevSeg, 0, 0);
        }
        if (lastNodeIndex >= 2) {
          updateSegment(oldSeg, nodeProgresses[lastNodeIndex - 2], nodeProgresses[lastNodeIndex - 1]);
        } else {
          updateSegment(oldSeg, 0, 0);
        }

        const currentPoint = activeSeg.getPointAtLength(pathLength * magneticProgress);
        const nextPoint = activeSeg.getPointAtLength(Math.min(pathLength, pathLength * magneticProgress + 2));
        const angle = Math.atan2(nextPoint.y - currentPoint.y, nextPoint.x - currentPoint.x) * (180 / Math.PI);

        let currentTimeInMinutes = nodeTimes[0];
        for (let i = 0; i < nodeProgresses.length - 1; i++) {
          if (magneticProgress >= nodeProgresses[i] && magneticProgress <= nodeProgresses[i + 1]) {
            const ratio = (magneticProgress - nodeProgresses[i]) / (nodeProgresses[i + 1] - nodeProgresses[i]);
            currentTimeInMinutes = nodeTimes[i] + ratio * (nodeTimes[i + 1] - nodeTimes[i]);
            break;
          }
        }
        if (magneticProgress >= nodeProgresses[nodeProgresses.length - 1]) {
          currentTimeInMinutes = nodeTimes[nodeTimes.length - 1];
        }

        const minuteAngle = (currentTimeInMinutes / 60) * 360;
        const hourAngle = (currentTimeInMinutes / 720) * 360;

        if (clockMinRef.current) gsap.set(clockMinRef.current, { rotation: minuteAngle, svgOrigin: "180 180" });
        if (clockHourRef.current) gsap.set(clockHourRef.current, { rotation: hourAngle, svgOrigin: "180 180" });
        if (clockDigitalSvgRef.current) clockDigitalSvgRef.current.textContent = formatTime(currentTimeInMinutes);

        let activeIndex = -1;
        for (let i = 0; i < nodeProgresses.length; i++) {
          if (Math.abs(magneticProgress - nodeProgresses[i]) < 0.0001) activeIndex = i;
        }

        if (dataPacket) {
          if (activeIndex !== -1) {
            const nodeX = nodeInstances[activeIndex]?.getAttribute("x") || 400;
            const nodeY = nodeInstances[activeIndex]?.getAttribute("y") || 400;
            // Adjusted hardcoded index from 8 to 9
            if (activeIndex !== 9) dataPacket.setAttribute("transform", `translate(${nodeX}, ${nodeY}) rotate(${angle})`);
          } else {
            dataPacket.setAttribute("transform", `translate(${currentPoint.x}, ${currentPoint.y}) rotate(${angle})`);
          }
          dataPacket.style.opacity = "1";
        }

        let isApproachingAny = false;

        eventBlocks.forEach((block, index) => {
          const node = nodeInstances[index];
          if (!node) return;
          // Adjusted hardcoded index from 8 to 9
          const nx = index === 9 ? 400 : parseFloat(node.getAttribute("x") || "400");
          const ny = index === 9 ? 400 : parseFloat(node.getAttribute("y") || "400");

          const distToBlob = Math.hypot(currentPoint.x - nx, currentPoint.y - ny);

          if (index === lastNodeIndex + 1) node.style.opacity = "1";
          else if (index === lastNodeIndex) node.style.opacity = "1";
          else if (index === lastNodeIndex - 1) node.style.opacity = "0.3";
          else if (index === lastNodeIndex - 2) node.style.opacity = "0.1";
          else node.style.opacity = "0";

          if (distToBlob < 100 && index > lastNodeIndex && !node.classList.contains("illuminated")) {
            node.classList.add("approaching");
            isApproachingAny = true;
          } else {
            node.classList.remove("approaching");
          }

          if (index === activeIndex) {
            if (!block.classList.contains("revealed")) {
              block.classList.add("revealed");
              node.classList.add("illuminated");
              node.classList.remove("approaching");

              if (!nodeFired[index]) {
                nodeFired[index] = true;
                fireBurst(nx, ny);
                scrambleText(block.querySelector<HTMLElement>(".event-title"));
                scrambleText(block.querySelector<HTMLElement>(".event-desc"));
              }
            }
          } else {
            block.classList.remove("revealed");
            node.classList.remove("illuminated");
            nodeFired[index] = false;
          }
        });

        if (dataPacket) {
          if (isApproachingAny && activeIndex === -1) {
            dataPacket.classList.add("approaching");
          } else {
            dataPacket.classList.remove("approaching");
          }

          if (activeIndex !== -1) {
            dataPacket.classList.add("snapped");
          } else {
            dataPacket.classList.remove("snapped");
          }
        }
      },
    });

    ScrollTrigger.refresh();
    scroller.update();

    return () => {
      scroller.kill();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [isMounted]);

  if (!isMounted) {
    return <div className="bg-transparent min-h-screen" />;
  }

  return (
    <div
      id="timeline"
      ref={containerRef}
      className={`relative bg-transparent text-white font-mono min-h-[2400vh] overflow-x-clip ${jetbrainsMono.variable} ${spaceGrotesk.variable} ${geistMono.variable}`}
    >
      <style jsx global>{`
        @keyframes spinClockwise {
          100% { transform: rotate(360deg); }
        }
        @keyframes spinCounter {
          100% { transform: rotate(-360deg); }
        }
        @keyframes thrustPulse {
          0% { transform: scale(0.9, 0.85); opacity: 0.7; }
          100% { transform: scale(1.15, 1.15); opacity: 1; }
        }

        .spin-slow { transform-origin: 180px 180px; animation: spinClockwise 30s linear infinite; }
        .spin-fast { transform-origin: 180px 180px; animation: spinClockwise 8s linear infinite; }

        .wire-active { fill: none; stroke: #42ff5a; stroke-linecap: round; stroke-linejoin: round; }
        .node-instance { opacity: 0; transition: opacity 0.8s ease, filter 0.4s ease; will-change: opacity; }

        .nodule-outer { fill: none; stroke: rgba(127, 168, 146, 0.3); stroke-width: 1.5; stroke-dasharray: 4 6; transition: stroke 0.4s ease, filter 0.4s ease; }
        .nodule-hexagon { fill: none; stroke: rgba(127, 168, 146, 0.3); stroke-width: 1.5; transition: stroke 0.4s ease, fill 0.4s ease, filter 0.4s ease; }
        .nodule-core { fill: none; stroke: rgba(127, 168, 146, 0.3); stroke-width: 1.5; transition: stroke 0.4s ease, fill 0.4s ease, filter 0.4s ease; }
        .nodule-crosshair { fill: none; stroke: rgba(127, 168, 146, 0.3); stroke-width: 1.5; transition: stroke 0.4s ease, filter 0.4s ease; }

        .node-instance.approaching .nodule-outer { stroke: rgba(66, 255, 90, 0.6); animation: spinClockwise 8s linear infinite; }
        .node-instance.approaching .nodule-hexagon { stroke: #42ff5a; filter: drop-shadow(0 0 5px #42ff5a); }
        .node-instance.approaching .nodule-crosshair { stroke: rgba(66, 255, 90, 0.8); filter: drop-shadow(0 0 2px #42ff5a); }
        .node-instance.approaching .nodule-core { stroke: #42ff5a; fill: #42ff5a; filter: drop-shadow(0 0 8px #42ff5a); }

        .node-instance.illuminated .nodule-outer { stroke: #42ff5a; filter: drop-shadow(0 0 8px #42ff5a); animation: spinClockwise 3s linear infinite; }
        .node-instance.illuminated .nodule-hexagon { stroke: #42ff5a; fill: rgba(66, 255, 90, 0.1); filter: drop-shadow(0 0 10px #42ff5a); animation: spinCounter 10s linear infinite; }
        .node-instance.illuminated .nodule-core { stroke: #42ff5a; fill: #ffffff; filter: drop-shadow(0 0 15px #42ff5a); }
        .node-instance.illuminated .nodule-crosshair { stroke: #42ff5a; opacity: 0.9; filter: drop-shadow(0 0 8px #42ff5a); }

        .arrow-thrust-core { fill: url(#arrowThrustGrad); opacity: 0.85; transform-origin: 0 0; animation: thrustPulse 0.18s infinite alternate ease-in-out; }
        .rocket-approach-ring { fill: none; stroke: #42ff5a; stroke-width: 2.5; filter: drop-shadow(0 0 6px #42ff5a); opacity: 0; transform: scale(1.5); transform-origin: 0 0; transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        #dataPacket.approaching .rocket-approach-ring { opacity: 1; transform: scale(1); }
        .arrow-arrival-reticle { fill: none; stroke: #42ff5a; stroke-width: 1.5; opacity: 0; transform: scale(0.4); transform-origin: 0 0; transition: opacity 0.2s ease, transform 0.2s ease; }
        #dataPacket.snapped .arrow-outer-body { fill: rgba(66, 255, 90, 0.2); stroke: #ffffff; }
        #dataPacket.snapped .arrow-tip-node { fill: #ffffff; }
        #dataPacket.snapped .arrow-arrival-reticle { opacity: 0.75; transform: scale(1.6); }

        .event-block { position: absolute; width: 280px; opacity: 0; visibility: hidden; transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.2, 1, 0.3, 1), visibility 0s 0.5s; pointer-events: none; will-change: transform, opacity; }
        .event-block.revealed { opacity: 1; visibility: visible; border-color: rgba(66, 255, 90, 0.4); box-shadow: 0 15px 35px rgba(0,0,0,0.6); transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.2, 1, 0.3, 1), visibility 0s 0s; }
        .push-down { transform: translate(-50%, -20px); margin-top: 30px; text-align: center; }
        .push-down.revealed { transform: translate(-50%, 0); }
        .push-left { transform: translate(20px, -50%); margin-left: -310px; text-align: right; }
        .push-left.revealed { transform: translate(0, -50%); }
        .push-right { transform: translate(-20px, -50%); margin-left: 30px; text-align: left; }
        .push-right.revealed { transform: translate(0, -50%); }
        .push-up { transform: translate(-50%, 20px); margin-top: -160px; text-align: center; }
        .push-up.revealed { transform: translate(-50%, 0); }
        .push-center { transform: translate(-50%, 100px); margin-top: 30px; text-align: center; }
        .push-center.revealed { transform: translate(-50%, 0); }
      `}</style>

      {/* FIXED UI OVERLAY LAYER */}
      <div className="sticky top-16 w-screen h-[calc(100vh-4rem)] flex items-center justify-between px-[4vw] z-10">
        
        {/* HERO CLOCK CONTAINER */}
        <div className="flex-none w-[400px] flex flex-col justify-center items-center gap-5">
          <h1 className={`${geistMono.className} text-white text-[3.2rem] tracking-[10px] uppercase drop-shadow-[0_0_20px_rgba(66,255,90,0.5)] m-0 font-bold`}>
            Timeline
          </h1>
          <svg className="w-[360px] h-[360px] block" viewBox="0 0 360 360">
            <circle cx="180" cy="180" r="160" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" strokeDasharray="2 6" />
            <circle className="spin-slow" cx="180" cy="180" r="140" fill="none" stroke="rgba(127,168,146,0.3)" strokeWidth="1" strokeDasharray="20 40 4 10" />

            <g id="clock-ticks">
              <text x="180" y="45" textAnchor="middle" fill="#8b9a92" fontSize="16" fontFamily="JetBrains Mono" fontWeight="500">12</text>
              <text x="325" y="185" textAnchor="middle" fill="#8b9a92" fontSize="16" fontFamily="JetBrains Mono" fontWeight="500">03</text>
              <text x="180" y="335" textAnchor="middle" fill="#8b9a92" fontSize="16" fontFamily="JetBrains Mono" fontWeight="500">06</text>
              <text x="35" y="185" textAnchor="middle" fill="#8b9a92" fontSize="16" fontFamily="JetBrains Mono" fontWeight="500">09</text>
            </g>

            <text x="180" y="130" textAnchor="middle" className="fill-[#8b9a92] text-[0.6rem] tracking-[6px] font-mono">
              
            </text>
            <text ref={clockDigitalSvgRef} x="180" y="255" textAnchor="middle" className="fill-white text-[1.4rem] font-medium tracking-[2px] font-mono">
              08:00 AM
            </text>

            <g ref={clockHourRef} className="origin-[180px_180px]">
              <polygon points="176,205 184,205 180,75" fill="#030704" stroke="#42ff5a" strokeWidth="2" />
              <line x1="180" y1="205" x2="180" y2="140" stroke="#42ff5a" strokeWidth="2" />
            </g>

            <g ref={clockMinRef} className="origin-[180px_180px]">
              <line x1="180" y1="215" x2="180" y2="55" stroke="#ffffff" strokeWidth="2" strokeLinecap="square" />
              <circle cx="180" cy="50" r="5" fill="#030704" stroke="#ffffff" strokeWidth="1.5" />
            </g>

            <circle cx="180" cy="180" r="14" fill="#030704" stroke="#42ff5a" strokeWidth="2" />
            <circle className="spin-fast" cx="180" cy="180" r="18" fill="none" stroke="rgba(127,168,146,0.3)" strokeWidth="1.5" strokeDasharray="2 6" />
            <circle cx="180" cy="180" r="4" fill="#42ff5a" className="drop-shadow-[0_0_8px_#42ff5a]" />
          </svg>
        </div>

        {/* TIMELINE WRAPPER */}
        <div className="flex-1 max-w-[800px] h-[800px] relative scale-[0.85]">
          
          {/* EVENT CARDS */}
          {eventsData.map((card) => (
            <div
              key={card.id}
              id={card.id}
              style={card.style}
              className={`event-block ${card.push} bg-[#020603]/70 border border-white/[0.08] rounded-lg p-5 z-[5] backdrop-blur-md`}
            >
              <div className="flex justify-between items-end mb-3">
                <span className="text-[#42ff5a] text-[0.8rem] font-bold tracking-[1px]">{card.time}</span>
                <span className="text-[0.55rem] text-[#8b9a92] tracking-[2px]">{card.seq}</span>
              </div>
              <h3 className="font-['Space_Grotesk'] text-[1.2rem] my-0 mb-2 text-white min-h-[28px]" data-value={card.title}>
                {card.title}
              </h3>
              <p className="text-[0.8rem] text-[#8b9a92] leading-[1.6] m-0 min-h-[38px]" data-value={card.desc}>
                {card.desc}
              </p>
            </div>
          ))}

          {/* SVG CANVAS & FIBER OPTICS */}
          <svg className="block w-full h-full overflow-visible absolute top-0 left-0 z-[1]" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="arrowThrustGrad" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#42ff5a" />
                <stop offset="85%" stopColor="rgba(66, 255, 90, 0.4)" />
                <stop offset="100%" stopColor="rgba(0, 255, 60, 0)" />
              </linearGradient>

              <filter id="intenseGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <g id="advanced-nodule">
                <path
                  className="nodule-crosshair"
                  d="
                  M -30 0 L -14 0 M -22 -3 L -22 3
                  M 14 0 L 30 0 M 22 -3 L 22 3
                  M 0 -30 L 0 -14 M -3 -22 L 3 -22
                  M 0 14 L 0 30 M -3 22 L 3 22
                "
                />
                <circle className="nodule-outer" cx="0" cy="0" r="16" />
                <polygon className="nodule-hexagon" points="0,-10 8.66,-5 8.66,5 0,10 -8.66,5 -8.66,-5" />
                <circle className="nodule-core" cx="0" cy="0" r="2.5" />
              </g>
            </defs>

            {/* PATH SEGMENTS */}
            <path ref={oldSegmentRef} className="wire-active" strokeWidth="2" style={{ opacity: 0.1, strokeDasharray: "0 100000", strokeDashoffset: 0 }} filter="blur(2px)" />
            <path ref={prevSegmentRef} className="wire-active" strokeWidth="4" style={{ opacity: 0.3, strokeDasharray: "0 100000", strokeDashoffset: 0 }} filter="blur(1px)" />
            <path ref={activeSegmentRef} className="wire-active" strokeWidth="6" style={{ opacity: 0.8, strokeDasharray: "0 100000", strokeDashoffset: 0 }} filter="url(#intenseGlow)" />

            <g ref={burstLayerRef} className="pointer-events-none" />

            <use href="#advanced-nodule" x="100" y="150" className="node-instance" id="node-0" />
            <use href="#advanced-nodule" x="400" y="120" className="node-instance" id="node-1" />
            <use href="#advanced-nodule" x="700" y="250" className="node-instance" id="node-2" />
            <use href="#advanced-nodule" x="680" y="500" className="node-instance" id="node-3" />
            <use href="#advanced-nodule" x="450" y="700" className="node-instance" id="node-4" />
            <use href="#advanced-nodule" x="200" y="600" className="node-instance" id="node-5" />
            <use href="#advanced-nodule" x="120" y="350" className="node-instance" id="node-6" />
            <use href="#advanced-nodule" x="330" y="250" className="node-instance" id="node-7" />
            <use href="#advanced-nodule" x="550" y="320" className="node-instance" id="node-8" />

            {/* Changed from node-8 to node-9 */}
            <g className="node-instance" id="node-9" transform="translate(400, 400)">
              <path
                className="nodule-crosshair"
                d="
                M -45 0 L -21 0 M -33 -4 L -33 4
                M 21 0 L 45 0 M 33 -4 L 33 4
                M 0 -45 L 0 -21 M -4 -33 L 4 -33
                M 0 21 L 0 45 M -4 33 L 4 33
              "
              />
              <circle className="nodule-outer" cx="0" cy="0" r="24" strokeDasharray="4 8" />
              <polygon className="nodule-hexagon" points="0,-15 13,-7.5 13,7.5 0,15 -13,7.5 -13,-7.5" />
              <circle className="nodule-core" cx="0" cy="0" r="4" />
            </g>

            {/* ROCKET CURSOR PACKET */}
            <g ref={dataPacketRef} id="dataPacket" className="pointer-events-none opacity-0 origin-[0px_0px] [will-change:transform]">
              <circle className="rocket-approach-ring" cx="0" cy="0" r="22" />
              <circle className="arrow-arrival-reticle" cx="0" cy="0" r="16" />

              <path className="arrow-thrust-core" d="M -10 -4 C -22 -6, -42 -4, -65 0 C -42 4, -22 6, -10 4 Z" />
              <circle className="fill-white opacity-80" cx="-26" cy="-3.5" r="1.1" />
              <circle className="fill-white opacity-80" cx="-40" cy="2.5" r="1.3" />
              <circle className="fill-white opacity-80" cx="-55" cy="-1.5" r="0.9" />
              <path className="fill-none stroke-[#42ff5a] stroke-[1.2] opacity-65" d="M -13 -13 L -6 -8" />
              <path className="fill-none stroke-[#42ff5a] stroke-[1.2] opacity-65" d="M -13 13 L -6 8" />
              <polygon className="arrow-outer-body fill-[#030a05] stroke-[#42ff5a] stroke-[1.8] stroke-linejoin-round stroke-linecap-round" points="14,0 -10,-9 -6,0 -10,9" />
              <polyline className="arrow-inner-chevron fill-none stroke-white stroke-[1.4] stroke-linecap-round stroke-linejoin-round opacity-90" points="-4,-5 8,0 -4,5" />
              <circle className="arrow-tip-node fill-[#42ff5a] transition-colors duration-150 ease-out" cx="14" cy="0" r="1.8" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}