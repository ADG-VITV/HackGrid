'use client';

import React, { useRef, useEffect } from 'react';

export default function BulgeGrid(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Track actual mouse vs animated target for smooth lagging effect
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const targetMouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Dynamically match element dimensions to prevent any cropped boundaries
    const resize = (): void => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.ceil(rect.width) || window.innerWidth;
      canvas.height = Math.ceil(rect.height) || window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    // Map mouse position relative to canvas bounding box
    const handleMouseMove = (e: MouseEvent): void => {
      const rect = canvas.getBoundingClientRect();
      targetMouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = (): void => {
      targetMouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);

    const draw = (): void => {
      // Smooth interpolation for the mouse coordinates
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.15;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.15;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const spacing = 45; // Size of the squares
      const cols = Math.ceil(canvas.width / spacing) + 4;
      const rows = Math.ceil(canvas.height / spacing) + 4;

      // Bulge settings matching your concept
      const maxDist = 250; // Cursor Radius
      const bulgeStrength = 65; // Bulge Strength

      // Math function to distort the grid intersections
      const getPoint = (c: number, r: number): { x: number; y: number } => {
        let x = c * spacing;
        let y = r * spacing;

        const dx = x - mouseRef.current.x;
        const dy = y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist && dist > 0) {
          const falloff = Math.pow(1 - dist / maxDist, 2);
          const push = bulgeStrength * falloff;

          // Outward push vector
          x += (dx / dist) * push;
          y += (dy / dist) * push;
        }
        return { x, y };
      };

      ctx.lineWidth = 1;
      // High-definition neon green line visible through ambient glows
      ctx.strokeStyle = 'rgba(66, 255, 90, 0.42)';

      // Draw distorted horizontal lines across full vertical range
      for (let r = -2; r <= rows; r++) {
        ctx.beginPath();
        for (let c = -2; c <= cols; c++) {
          const p = getPoint(c, r);
          if (c === -2) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      // Draw distorted vertical lines across full horizontal range
      for (let c = -2; c <= cols; c++) {
        ctx.beginPath();
        for (let r = -2; r <= rows; r++) {
          const p = getPoint(c, r);
          if (r === -2) ctx.moveTo(p.x, p.y);
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
      className="absolute inset-0 h-full w-full pointer-events-none z-0 block"
    />
  );
}