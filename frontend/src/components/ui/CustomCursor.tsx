"use client";

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(true); // default true for hydration safety

  useEffect(() => {
    // Check if device supports hover (disables on mobile)
    const checkHover = () => {
      setIsMobile(window.matchMedia('(hover: none)').matches);
    };
    checkHover();
    window.addEventListener('resize', checkHover);
    return () => window.removeEventListener('resize', checkHover);
  }, []);

  useEffect(() => {
    if (isMobile || !cursorRef.current) return;

    // Fast, batched mouse follower using GSAP quickTo
    const xTo = gsap.quickTo(cursorRef.current, "x", { duration: 0.15, ease: "power3" });
    const yTo = gsap.quickTo(cursorRef.current, "y", { duration: 0.15, ease: "power3" });

    const handleMouseMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Simple interaction detection
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Scale down and solidify if hovering over a button or interactive element
      if (target.closest('button') || target.closest('a') || target.closest('input')) {
        gsap.to(cursorRef.current, { scale: 0.3, duration: 0.2 });
        cursorRef.current?.classList.remove('mix-blend-difference', 'bg-[var(--accent)]');
        cursorRef.current?.classList.add('bg-black');
      } else {
        gsap.to(cursorRef.current, { scale: 1, duration: 0.2 });
        cursorRef.current?.classList.add('mix-blend-difference', 'bg-[var(--accent)]');
        cursorRef.current?.classList.remove('bg-black');
      }
    };
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 w-6 h-6 bg-[var(--accent)] rounded-full pointer-events-none mix-blend-difference z-50 transform -translate-x-1/2 -translate-y-1/2"
      style={{ willChange: 'transform' }}
    />
  );
}
