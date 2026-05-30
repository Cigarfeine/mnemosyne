"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLenis } from 'lenis/react';

const NAV_ITEMS = [
  { label: 'Work', target: '#work' },
  { label: 'Method', target: '#method' },
  { label: 'Engine', target: '#engine' },
];

export default function Navbar() {
  const pathname = usePathname();
  const isLanding = pathname === '/';
  const lenis = useLenis();
  const headerRef = useRef<HTMLElement>(null);

  const handleNavClick = (e: React.MouseEvent, target: string) => {
    if (isLanding && lenis) {
      e.preventDefault();
      const el = document.querySelector(target);
      if (el) {
        lenis.scrollTo(el as HTMLElement, { offset: -80, duration: 1.6 });
      }
    }
    // If not on landing page, the <a href="/#work"> will do a full navigation
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isLanding) {
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      }
      window.dispatchEvent(new CustomEvent('trigger-fast-preloader'));
    } else {
      sessionStorage.setItem('trigger-fast-preloader', 'true');
    }
  };

  return (
    <>
      {/* Persistent Floating Logo */}
      <Link 
        href="/" 
        onClick={handleLogoClick}
        className="fixed top-4 left-6 z-[60] flex items-center gap-3 cursor-pointer no-underline text-white mix-blend-difference group print:hidden"
      >
        {/* Subtle rotate on hover to make it feel alive */}
        <svg viewBox="0 0 100 100" className="w-6 h-6 fill-white hidden sm:block transition-transform duration-[0.8s] ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:rotate-180">
          <polygon points="50,0 60,40 100,50 60,60 50,100 40,60 0,50 40,40" />
        </svg>
        <span className="font-bold tracking-tighter text-2xl uppercase">Mnemosyne®</span>
      </Link>

      <header
        ref={headerRef}
        className="main-header fixed top-0 left-0 w-full z-40 px-6 py-4 flex items-center justify-between text-black transition-all duration-300 print:hidden"
      >
        {/* Invisible placeholder to balance the flex layout since the logo is now fixed independently */}
        <div className="w-[150px] opacity-0 pointer-events-none">Spacer</div>

      {/* Center: Nav Links */}
      <nav className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center pointer-events-none">
        <ul className="flex items-center pointer-events-auto gap-10 group/nav">
          {NAV_ITEMS.map((item) => (
            <li
              key={item.label}
              className="relative cursor-pointer transition-opacity duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover/nav:opacity-30 hover:!opacity-100 group/link py-1"
            >
              <a
                href={isLanding ? item.target : `/${item.target}`}
                onClick={(e) => handleNavClick(e, item.target)}
                className="text-sm font-bold uppercase tracking-[0.15em] leading-none text-black no-underline flex items-center gap-2"
              >
                {item.label}
                {item.label === 'Work' && (
                  <span className="px-1.5 py-[2px] bg-black text-[var(--accent)] text-[9px] tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse"></span>
                    APP
                  </span>
                )}
              </a>
              {/* Minimal sweeping underline */}
              <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-black scale-x-0 origin-left transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover/link:scale-x-100" />
            </li>
          ))}
        </ul>
      </nav>

      {/* Right: CTA */}
      <a
        href="https://aistudio.google.com/app/apikey"
        target="_blank"
        rel="noopener noreferrer"
        className="z-10 group cursor-pointer relative overflow-hidden rounded-full border border-black px-6 py-2 bg-transparent block no-underline"
      >
        <div className="absolute top-0 left-0 w-full h-[150%] bg-black translate-y-[100%] rounded-t-[50%] group-hover:translate-y-0 group-hover:rounded-none transition-all duration-[0.6s] ease-[cubic-bezier(0.76,0,0.24,1)]" />
        <span className="relative z-10 text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors duration-[0.4s]">
          Get API Key
        </span>
      </a>
    </header>
    </>
  );
}
