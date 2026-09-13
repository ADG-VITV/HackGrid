'use client';
import React, { useRef, useEffect } from 'react';

export default function BulgeGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Track actual mouse vs animated target for smooth lagging effect
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const targetMouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseLeave = () => {
      targetMouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);

    const draw = () => {
      // Smooth interpolation for the mouse coordinates
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.15;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.15;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const spacing = 45; // Size of the squares
      const cols = Math.floor(canvas.width / spacing) + 2;
      const rows = Math.floor(canvas.height / spacing) + 2;

      // Bulge settings matching your screenshot's concept
      const maxDist = 250; // Cursor Radius
      const bulgeStrength = 65; // Bulge Strength

      // Math function to distort the grid intersections
      const getPoint = (c: number, r: number) => {
        let x = c * spacing;
        let y = r * spacing;

        const dx = x - mouseRef.current.x;
        const dy = y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist && dist > 0) {
          // Calculate how hard to push the line based on how close the mouse is
          const falloff = Math.pow(1 - dist / maxDist, 2);
          const push = bulgeStrength * falloff;
          
          // Apply the outward push vector
          x += (dx / dist) * push;
          y += (dy / dist) * push;
        }
        return { x, y };
      };

      ctx.lineWidth = 1;
      // White grid color with low opacity for the static look
      ctx.strokeStyle = "rgba(106, 193, 93, 0.3)"; 

      // Draw the distorted horizontal lines
      for (let r = -1; r <= rows; r++) {
        ctx.beginPath();
        for (let c = -1; c <= cols; c++) {
          const p = getPoint(c, r);
          if (c === -1) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      // Draw the distorted vertical lines
      for (let c = -1; c <= cols; c++) {
        ctx.beginPath();
        for (let r = -1; r <= rows; r++) {
          const p = getPoint(c, r);
          if (r === -1) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[#030704]"
    />
  );
}