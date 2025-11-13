'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function BackgroundBeams({ className }: { className?: string }) {
  const beams = Array.from({ length: 8 });

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {beams.map((_, index) => (
        <motion.div
          key={index}
          className="absolute h-full w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent"
          style={{
            left: `${(index + 1) * 12.5}%`,
          }}
          animate={{
            opacity: [0.2, 0.5, 0.2],
            scaleY: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 3 + index * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

