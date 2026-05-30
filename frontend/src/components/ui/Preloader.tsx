"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

export default function Preloader({ onComplete, fastMode = false }: { onComplete: () => void, fastMode?: boolean }) {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = 'hidden';

    let start: number | null = null;
    const duration = fastMode ? 400 : 1800; // super fast mode

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setProgress(Math.round(eased * 100));

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        setTimeout(() => setExiting(true), fastMode ? 100 : 400);
      }
    };

    requestAnimationFrame(step);

    return () => {
      document.body.style.overflow = '';
    };
  }, [fastMode, mounted]);

  const handleExitComplete = useCallback(() => {
    document.body.style.overflow = '';
    onComplete();
  }, [onComplete]);

  if (!mounted) return null;

  return createPortal(
    <motion.div
      data-lenis-prevent="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        backgroundColor: '#050505',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        margin: 0,
        padding: 0,
      }}
      initial={{ y: '0%' }}
      animate={{ y: exiting ? '-100%' : '0%' }}
      transition={{
        duration: exiting ? 1.1 : 0,
        ease: [0.76, 0, 0.24, 1]
      }}
      onAnimationComplete={() => {
        if (exiting) handleExitComplete();
      }}
    >
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        
        {/* Logo and Name Container */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          
          {/* Spinning Star Logo */}
          <motion.div
            initial={{ rotate: -90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
          >
            <svg viewBox="0 0 100 100" style={{ width: '60px', height: '60px', fill: '#FFF' }}>
              <polygon points="50,0 60,40 100,50 60,60 50,100 40,60 0,50 40,40" />
            </svg>
          </motion.div>

          {/* Masked Text Reveal */}
          <div style={{ overflow: 'hidden', paddingBottom: '8px' }}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 1.2, delay: 0.1, ease: [0.76, 0, 0.24, 1] }}
            >
              <span style={{ 
                fontFamily: 'var(--font-sans)', 
                fontWeight: 800, 
                letterSpacing: '-0.05em', 
                fontSize: '48px', 
                textTransform: 'uppercase', 
                color: '#FFF',
                lineHeight: 1
              }}>
                Mnemosyne<sup style={{ fontSize: '20px', fontWeight: 500, letterSpacing: 'normal', verticalAlign: 'super' }}>®</sup>
              </span>
            </motion.div>
          </div>
        </div>

        {/* Minimal Progress Bar Area - Only show if not fast mode */}
        {!fastMode && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 20px' }}>
            <div style={{ width: '100%', height: '2px', backgroundColor: 'rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  backgroundColor: '#FFF',
                  width: `${progress}%`,
                  transition: 'none'
                }}
              />
            </div>

            {/* Subtitle / Counter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <motion.span 
                style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Initializing
              </motion.span>
              <motion.span 
                style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#FFF', fontVariantNumeric: 'tabular-nums' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {progress}%
              </motion.span>
            </div>
          </div>
        )}

      </div>
    </motion.div>,
    document.body
  );
}
