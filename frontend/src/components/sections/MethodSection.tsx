"use client";

import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const STEPS = [
  {
    number: '01',
    title: 'Upload',
    description: 'Drop your previous year question papers as PDFs. Optionally add lecture notes or slides for richer context.',
    detail: 'PDF PARSING'
  },
  {
    number: '02',
    title: 'Analyse',
    description: 'Our engine extracts every question, maps topic frequency, and calculates weightage scores across all papers.',
    detail: 'PATTERN DETECTION'
  },
  {
    number: '03',
    title: 'Generate',
    description: 'A precision study guide is streamed in real-time — structured by topic weightage, not textbook order.',
    detail: 'AI SYNTHESIS'
  },
];

export default function MethodSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      id="method"
      ref={ref}
      className="w-full bg-[var(--bg)] border-t border-[var(--border)] relative z-10"
    >
      {/* Section Header */}
      <div className="w-full px-6 sm:px-8 pt-24 pb-12 md:pt-32 md:pb-16">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          className="flex items-end justify-between mb-4"
        >
          <h2 className="text-[10vw] sm:text-[7vw] md:text-[5vw] font-bold tracking-[-0.04em] leading-[0.9] uppercase">
            The Method
          </h2>
          <span className="text-xs font-bold uppercase tracking-widest opacity-40 hidden md:block pb-2">
            (How It Works)
          </span>
        </motion.div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
          className="w-full h-[2px] bg-black origin-left"
        />
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 w-full">
        {STEPS.map((step, idx) => (
          <motion.div
            key={step.number}
            initial={{ y: 60, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{
              duration: 1,
              ease: [0.76, 0, 0.24, 1],
              delay: 0.3 + idx * 0.15,
            }}
            className={`relative p-8 md:p-12 border-t md:border-t-0 border-[var(--border)] overflow-hidden ${
              idx < STEPS.length - 1 ? 'md:border-r' : ''
            } flex flex-col justify-between min-h-[320px] md:min-h-[400px] group/step hover:bg-[var(--bg-2)] transition-colors duration-500`}
          >
            {/* Parallax Background Number */}
            <div 
              data-speed="0.1" 
              className="absolute -top-4 -right-4 md:-right-8 text-[120px] md:text-[180px] font-black leading-none tracking-tighter opacity-[0.03] pointer-events-none select-none transition-transform duration-[1s] group-hover/step:scale-110"
            >
              {step.number}
            </div>

            {/* Top: Detail Tag */}
            <div className="flex items-start justify-between mb-16 relative z-10">
              <span className="px-3 py-1 bg-black text-[var(--accent)] text-[10px] font-bold uppercase tracking-widest">
                {step.detail}
              </span>
            </div>

            {/* Bottom: Title + Description */}
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase mb-4" data-speed="0.02">
                {step.title}
              </h3>
              <p className="text-base md:text-lg font-medium leading-relaxed opacity-60">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
