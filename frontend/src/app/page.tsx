"use client";

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import DropZone from '@/components/upload/DropZone';
import MagneticButton from '@/components/ui/MagneticButton';
import Preloader from '@/components/ui/Preloader';
import Navbar from '@/components/ui/Navbar';
import MethodSection from '@/components/sections/MethodSection';
import EngineSection from '@/components/sections/EngineSection';
import { motion, useInView } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const footerTextRef = useRef(null);
  const isFooterInView = useInView(footerTextRef, { once: true, amount: 0.5 });
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [fastLoad, setFastLoad] = useState(false);

  useEffect(() => {
    // Check if we arrived here from another page by clicking the logo
    if (sessionStorage.getItem('trigger-fast-preloader')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFastLoad(true);
      setIsLoaded(false); // Restart preloader
      sessionStorage.removeItem('trigger-fast-preloader');
      window.scrollTo(0, 0);
    }

    const handleFastLoad = () => {
      setFastLoad(true);
      setIsLoaded(false); // Restart preloader
      window.scrollTo(0, 0);
    };

    window.addEventListener('trigger-fast-preloader', handleFastLoad);
    return () => window.removeEventListener('trigger-fast-preloader', handleFastLoad);
  }, []);
  
  // Trigger Hero entry animations immediately on mount (behind the preloader)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.reveal-text', 
        { y: '110%', autoAlpha: 0 },
        { y: '0%', autoAlpha: 1, duration: 1.8, stagger: 0.04, ease: 'expo.out', delay: 1.5 }
      );
      
      gsap.fromTo('.reveal-fade', 
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 2.0, ease: 'power2.out', delay: 1.8 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Initialize ScrollTriggers on mount
  useEffect(() => {
    const ctx = gsap.context(() => {

      // Marquee animation & Scroll velocity Skew
      const proxy = { skew: 0 };
      const skewSetter = gsap.quickSetter(".marquee-text", "skewX", "deg");
      const clamp = gsap.utils.clamp(-20, 20);

      ScrollTrigger.create({
        onUpdate: (self) => {
          const skew = clamp(self.getVelocity() / -300);
          if (Math.abs(skew) > Math.abs(proxy.skew)) {
            proxy.skew = skew;
            gsap.to(proxy, {
              skew: 0, 
              duration: 0.8, 
              ease: "power3", 
              overwrite: true, 
              onUpdate: () => skewSetter(proxy.skew)
            });
          }
        }
      });

      if (marqueeRef.current) {
        gsap.to(marqueeRef.current, {
          xPercent: -50,
          repeat: -1,
          duration: 20,
          ease: "linear"
        });
      }

      // Global Parallax Elements
      gsap.utils.toArray('[data-speed]').forEach((el: unknown) => {
        const element = el as HTMLElement;
        const speed = parseFloat(element.dataset.speed || '0');
        gsap.to(element, {
          yPercent: speed * 100,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      });

      // DropZone Scale-In Reveal
      gsap.fromTo('.dropzone-reveal', 
        { scale: 0.95, opacity: 0 },
        {
          scale: 1, 
          opacity: 1,
          duration: 1.2,
          ease: "expo.out",
          scrollTrigger: {
            trigger: '.dropzone-reveal',
            start: 'top 85%',
            toggleActions: "play none none reverse"
          }
        }
      );

      // Footer Content Stagger Reveal
      gsap.fromTo('.footer-stagger', 
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: '.footer-wrapper',
            start: 'top 50%', 
            toggleActions: "play none none reverse"
          }
        }
      );

      // Navbar Smart Hide/Show
      const header = document.querySelector('.main-header');
      if (header) {
        const showAnim = gsap.from(header, {
          yPercent: -100,
          paused: true,
          duration: 0.4,
          ease: "power3.out"
        }).progress(1);
  
        ScrollTrigger.create({
          start: "top top",
          end: "max",
          onUpdate: (self) => {
            if (self.progress > 0.02) {
               header.classList.add('bg-[var(--bg)]', 'shadow-sm', 'py-2');
               header.classList.remove('py-4');
            } else {
               header.classList.remove('bg-[var(--bg)]', 'shadow-sm', 'py-2');
               header.classList.add('py-4');
            }
            if (self.direction === 1 && self.progress > 0.05) {
              showAnim.reverse();
            } else {
              showAnim.play();
            }
          }
        });
      }

    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-transparent text-[var(--text)] selection:bg-black selection:text-[var(--accent)] flex flex-col relative font-sans overflow-x-hidden">
      
      {!isLoaded && (
        <Preloader 
          fastMode={fastLoad}
          onComplete={() => {
            setIsLoaded(true);
            setFastLoad(false);
          }} 
        />
      )}

      {/* Main Content Wrapper (Covers Footer until bottom) */}
      <div className="relative z-10 bg-[var(--bg)] min-h-screen flex flex-col pb-16 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">

        {/* Hero Section - Broken Grid & Massive Typography */}
      <main className="hero-section w-full flex-grow flex flex-col px-4 sm:px-8 pt-32 pb-12 relative z-10 mt-16 md:mt-0">
        
        {/* Utility Label */}
        <div data-speed="0.2" className="reveal-fade w-full flex justify-end mb-4 md:mb-8 md:pr-24">
          <span className="text-xs font-medium uppercase tracking-widest">(PRECISION ENGINE)</span>
        </div>

        <h1 className="text-[12vw] sm:text-[9.5vw] font-bold tracking-[-0.04em] leading-[0.82] uppercase flex flex-col">
          <div data-speed="0.05" className="overflow-hidden"><div className="reveal-text">STUDY</div></div>
          <div data-speed="0.1" className="overflow-hidden md:pl-[10vw]"><div className="reveal-text">EXACTLY</div></div>
          <div data-speed="-0.05" className="overflow-hidden flex items-end gap-2 md:gap-4 flex-wrap pb-6 pt-2 -mb-6 -mt-2">
            <div className="reveal-text">WHAT</div>
            <div className="reveal-text">
              <div 
                className="font-['var(--font-instrument)'] text-[var(--accent)] italic lowercase bg-black text-[0.85em] px-[0.35em] pt-[0.1em] pb-[0.15em] rounded-full transform -rotate-3 origin-center leading-none inline-flex items-center justify-center"
                style={{ 
                  outline: '1px solid transparent', 
                  backfaceVisibility: 'hidden',
                  WebkitFontSmoothing: 'antialiased'
                }}
              >
                actually
              </div>
            </div>
          </div>
          <div data-speed="0.15" className="overflow-hidden md:pl-[20vw]"><div className="reveal-text flex items-center gap-6">MATTERS<span className="text-[5vw] text-[var(--text-muted)] font-normal hidden md:block">↓</span></div></div>
        </h1>
        
        <div data-speed="0.25" className="grid grid-cols-12 w-full mt-12 sm:mt-16 gap-8">
          <div className="col-span-12 md:col-start-7 md:col-span-5">
             <p className="reveal-fade text-xl md:text-2xl font-medium tracking-tight leading-snug">
              We extract the patterns, weigh the topics, and generate a single, exam-optimised PDF guide based strictly on historical data.
             </p>
          </div>
        </div>

      </main>

      {/* Marquee Divider */}
      <div className="marquee-text w-full overflow-hidden bg-[var(--bg)] text-black py-12 md:py-24 relative z-10 flex whitespace-nowrap">
        <div ref={marqueeRef} className="flex items-center gap-8 md:gap-16 text-[18vw] md:text-[11vw] font-medium uppercase tracking-tighter leading-none">
          <span>STUDY SMARTER</span>
          <svg viewBox="0 0 100 100" className="w-[12vw] md:w-[7vw] h-[12vw] md:h-[7vw] stroke-black stroke-[3px] shrink-0">
            <line x1="50" y1="5" x2="50" y2="95"/><line x1="5" y1="50" x2="95" y2="50"/><line x1="18" y1="18" x2="82" y2="82"/><line x1="18" y1="82" x2="82" y2="18"/>
          </svg>
          <span>SCORE HIGHER</span>
          <svg viewBox="0 0 100 100" className="w-[12vw] md:w-[7vw] h-[12vw] md:h-[7vw] stroke-black stroke-[3px] shrink-0">
            <line x1="50" y1="5" x2="50" y2="95"/><line x1="5" y1="50" x2="95" y2="50"/><line x1="18" y1="18" x2="82" y2="82"/><line x1="18" y1="82" x2="82" y2="18"/>
          </svg>
          <span>SAVE HOURS</span>
          <svg viewBox="0 0 100 100" className="w-[12vw] md:w-[7vw] h-[12vw] md:h-[7vw] stroke-black stroke-[3px] shrink-0">
            <line x1="50" y1="5" x2="50" y2="95"/><line x1="5" y1="50" x2="95" y2="50"/><line x1="18" y1="18" x2="82" y2="82"/><line x1="18" y1="82" x2="82" y2="18"/>
          </svg>
          <span>ZERO FLUFF</span>
          <svg viewBox="0 0 100 100" className="w-[12vw] md:w-[7vw] h-[12vw] md:h-[7vw] stroke-black stroke-[3px] shrink-0">
            <line x1="50" y1="5" x2="50" y2="95"/><line x1="5" y1="50" x2="95" y2="50"/><line x1="18" y1="18" x2="82" y2="82"/><line x1="18" y1="82" x2="82" y2="18"/>
          </svg>
          <span>STUDY SMARTER</span>
          <svg viewBox="0 0 100 100" className="w-[12vw] md:w-[7vw] h-[12vw] md:h-[7vw] stroke-black stroke-[3px] shrink-0">
            <line x1="50" y1="5" x2="50" y2="95"/><line x1="5" y1="50" x2="95" y2="50"/><line x1="18" y1="18" x2="82" y2="82"/><line x1="18" y1="82" x2="82" y2="18"/>
          </svg>
          <span>SCORE HIGHER</span>
          <svg viewBox="0 0 100 100" className="w-[12vw] md:w-[7vw] h-[12vw] md:h-[7vw] stroke-black stroke-[3px] shrink-0">
            <line x1="50" y1="5" x2="50" y2="95"/><line x1="5" y1="50" x2="95" y2="50"/><line x1="18" y1="18" x2="82" y2="82"/><line x1="18" y1="82" x2="82" y2="18"/>
          </svg>
          <span>SAVE HOURS</span>
          <svg viewBox="0 0 100 100" className="w-[12vw] md:w-[7vw] h-[12vw] md:h-[7vw] stroke-black stroke-[3px] shrink-0">
            <line x1="50" y1="5" x2="50" y2="95"/><line x1="5" y1="50" x2="95" y2="50"/><line x1="18" y1="18" x2="82" y2="82"/><line x1="18" y1="82" x2="82" y2="18"/>
          </svg>
          <span>ZERO FLUFF</span>
          <svg viewBox="0 0 100 100" className="w-[12vw] md:w-[7vw] h-[12vw] md:h-[7vw] stroke-black stroke-[3px] shrink-0">
            <line x1="50" y1="5" x2="50" y2="95"/><line x1="5" y1="50" x2="95" y2="50"/><line x1="18" y1="18" x2="82" y2="82"/><line x1="18" y1="82" x2="82" y2="18"/>
          </svg>
        </div>
      </div>

        {/* DropZone Full Bleed */}
      {/* Method Section */}
      <MethodSection />

      {/* Engine Section */}
      <EngineSection />

      {/* DropZone / Work Section */}
      <div id="work" className="dropzone-reveal w-full relative z-10 bg-[var(--bg)]">
        <DropZone />
      </div>
        
      </div>

      {/* Full Viewport Framer Motion Footer */}
      <footer className="w-full min-h-[40vh] bg-[#0A0A0F] text-white border-t border-[#222] relative z-10 flex flex-col justify-between pb-0">
        
        {/* Overscroll Fill for Mac/Trackpad rubber-banding */}
        <div className="absolute top-[99%] left-0 w-full h-[50vh] bg-[#0A0A0F] pointer-events-none" />

        {/* Top Row */}
        <div className="w-full flex justify-between items-start px-10 py-6 text-[#555] text-[12px] font-sans font-medium uppercase tracking-widest relative z-10">
          <div>© 2026 Mnemosyne</div>
          <div>Built by Arshad</div>
        </div>

        {/* Bottom Massive Text */}
        <div className="w-full flex justify-center items-end flex-grow pb-0 overflow-hidden" ref={footerTextRef}>
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={isFooterInView ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(80px,14vw,200px)] font-black tracking-[-0.03em] leading-none select-none"
          >
            MNEMOSYNE
          </motion.div>
        </div>

      </footer>

    </div>
  );
}
