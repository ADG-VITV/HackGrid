'use client';
import React, { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function TechCursor() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { stiffness: 500, damping: 28, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX - 20);
      mouseY.set(e.clientY - 20);
    };

    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [mouseX, mouseY]);

  return (
    <>
      {/* 1. Spring Tracking Container */}
      <motion.div
        className="fixed top-0 left-0 w-10 h-10 pointer-events-none z-50"
        style={{ x: cursorX, y: cursorY }}
      >
        {/* Native SVG bypasses Tailwind border rendering bugs entirely */}
        <motion.svg
          width="40" height="40" viewBox="0 0 40 40" fill="none"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <path d="M10 2H2V10" stroke="#00FF41" strokeWidth="2" />
          <path d="M30 2H38V10" stroke="#00FF41" strokeWidth="2" />
          <path d="M10 38H2V30" stroke="#00FF41" strokeWidth="2" />
          <path d="M30 38H38V30" stroke="#00FF41" strokeWidth="2" />
        </motion.svg>
      </motion.div>
      
      {/* 2. Instant Inner Targeting Diamond */}
      <motion.div
        className="fixed top-0 left-0 w-10 h-10 pointer-events-none z-50 flex items-center justify-center"
        style={{ x: mouseX, y: mouseY }}
      >
         <div className="w-1.5 h-1.5 bg-[#00FF41] rotate-45 shadow-[0_0_8px_rgba(0,255,65,0.8)]" />
      </motion.div>
    </>
  );
}