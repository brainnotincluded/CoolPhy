'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function TextGenerateEffect({
  words,
  className,
}: {
  words: string;
  className?: string;
}) {
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  const wordsArray = words.split(' ');

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayedWords((prev) => {
        if (prev.length < wordsArray.length) {
          return [...prev, wordsArray[prev.length]];
        }
        clearInterval(timer);
        return prev;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [wordsArray]);

  return (
    <div className={cn('font-bold', className)}>
      {displayedWords.map((word, idx) => (
        <motion.span
          key={idx}
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5 }}
          className="inline-block mr-2"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}

