'use client';

import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  content: string;
  className?: string;
  displayMode?: boolean;
}

export function LatexRenderer({ content, className = '', displayMode = false }: LatexRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    try {
      // Process content to handle both inline and display math
      const processedContent = content.replace(
        /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$(.+?)\$|\\\((.+?)\\\)/g,
        (match, display1, display2, inline1, inline2) => {
          const latex = display1 || display2 || inline1 || inline2;
          const isDisplay = !!(display1 || display2);
          
          try {
            return katex.renderToString(latex, {
              displayMode: isDisplay,
              throwOnError: false,
              strict: false,
            });
          } catch (error) {
            console.error('KaTeX rendering error:', error);
            return match;
          }
        }
      );

      containerRef.current.innerHTML = processedContent;
    } catch (error) {
      console.error('LaTeX rendering error:', error);
      if (containerRef.current) {
        containerRef.current.textContent = content;
      }
    }
  }, [content]);

  return <div ref={containerRef} className={`latex-content ${className}`} />;
}

