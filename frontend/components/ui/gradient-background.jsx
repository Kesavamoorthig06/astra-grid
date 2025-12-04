'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

function GradientBackground({
  className,
  transition = { duration: 10, ease: 'easeInOut', repeat: Infinity },
  ...props
}) {
    return (
      <div
        data-slot="gradient-background"
        className={cn('relative size-full overflow-hidden', className)}
        {...props}>
        <motion.div
          className="absolute inset-0 bg-linear-to-br from-slate-200/90 via-slate-300/95 to-slate-100/80 bg-size-[300%_300%]"
          animate={{
            backgroundPosition: ['0% 0%', '80% 20%', '40% 80%', '100% 50%', '0% 0%'],
            filter: ['blur(0px)', 'blur(2px)', 'blur(0px)'],
          }}
          transition={{ duration: 22, ease: 'linear', repeat: Infinity }}
        />

        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.25),transparent_55%)]"
          animate={{
            opacity: [0.2, 0.45, 0.15],
            scale: [1, 1.05, 0.98],
            rotate: [0, 6, -4, 0],
          }}
          transition={{ duration: 26, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(148,163,184,0.35),transparent_60%)]"
          animate={{
            opacity: [0.3, 0.6, 0.25],
            scale: [1.05, 0.98, 1.08],
            rotate: [0, -3, 5, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
      </div>
    );
}

export { GradientBackground };
