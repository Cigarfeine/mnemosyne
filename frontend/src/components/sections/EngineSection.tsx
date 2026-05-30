"use client";

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const FEATURES = [
  {
    title: 'Pattern Extraction',
    description: 'Every question from every paper is parsed, categorized, and indexed. The engine identifies recurring topics and question formats across years.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
      </svg>
    ),
  },
  {
    title: 'Weightage Scoring',
    description: 'Each topic receives a data-driven importance score based on its frequency, marks allocation, and trend trajectory across examination cycles.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M3 3v18h18M7 16l4-4 4 4 5-5" />
      </svg>
    ),
  },
  {
    title: 'Exam-Optimised Output',
    description: 'The final guide is structured by priority — not by chapter. High-weightage topics come first, with answer frameworks tailored to marking schemes.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Context Enrichment',
    description: 'Add your own lecture notes or slides and the engine will cross-reference them against PYQ patterns, filling knowledge gaps with precision.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
];

const STATS = [
  { value: '95%', label: 'Topic Coverage' },
  { value: '<3min', label: 'Avg. Processing' },
  { value: '∞', label: 'Papers Supported' },
];

export default function EngineSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section
      id="engine"
      ref={ref}
      className="w-full bg-black text-white relative z-10"
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
            The Engine
          </h2>
          <span className="text-xs font-bold uppercase tracking-widest opacity-40 hidden md:block pb-2">
            (Under The Hood)
          </span>
        </motion.div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
          className="w-full h-[1px] bg-white/20 origin-left"
        />
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 w-full">
        {FEATURES.map((feature, idx) => (
          <motion.div
            key={feature.title}
            initial={{ y: 50, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{
              duration: 0.9,
              ease: [0.76, 0, 0.24, 1],
              delay: 0.3 + idx * 0.1,
            }}
            className={`p-8 md:p-12 border-t border-white/10 ${
              idx % 2 === 0 ? 'md:border-r border-white/10' : ''
            } group/feature hover:bg-white/[0.03] transition-colors duration-500`}
          >
            <div className="flex items-start gap-5">
              <div data-speed="0.05" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center shrink-0 group-hover/feature:border-[var(--accent)] group-hover/feature:text-[var(--accent)] transition-colors duration-500">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold tracking-tight uppercase mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm md:text-base font-medium leading-relaxed opacity-50">
                  {feature.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 w-full border-t border-white/10">
        {STATS.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ y: 30, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{
              duration: 0.8,
              ease: [0.76, 0, 0.24, 1],
              delay: 0.6 + idx * 0.1,
            }}
            className={`p-8 md:p-12 flex flex-col items-center justify-center text-center ${
              idx < STATS.length - 1 ? 'border-r border-white/10' : ''
            }`}
          >
            <span data-speed="0.08" className="text-4xl md:text-6xl font-black tracking-tighter text-[var(--accent)]">
              {stat.value}
            </span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-40 mt-2">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Bottom Padding */}
      <div className="h-16 md:h-24" />
    </section>
  );
}
