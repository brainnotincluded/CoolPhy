'use client';

import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  content: string;
  className?: string;
  displayMode?: boolean;
}

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function LatexRenderer({ content, className = '', displayMode = false }: LatexRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    try {
      let processedContent = content;

      // Handle TikZ pictures - replace with iframes that run TikZJax inside
      processedContent = processedContent.replace(
        /(\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\})/g,
        (match) => {
          const id = 'tikz-' + hashCode(match);
          const iframeHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" type="text/css" href="https://tikzjax.com/v1/fonts.css">
  <script src="https://tikzjax.com/v1/tikzjax.js"></script>
  <style>
    body { margin:0; padding:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:transparent; }
    svg { max-width:100%; height:auto; }
  </style>
</head>
<body>
  <script type="text/tikz">
    ${match}
  </script>
</body>
</html>`;
          // Use base64 encoding to support all Unicode characters
          const base64 = btoa(unescape(encodeURIComponent(iframeHtml)));
          return `<div style="display:inline-block;background:white;border-radius:12px;padding:20px;margin:20px 0;width:250px;height:250px;overflow:hidden;"><iframe id="${id}" style="border:none;width:100%;height:100%;" src="data:text/html;base64,${base64}"></iframe></div>`;
        }
      );

      // Process regular math content to handle both inline and display math
      processedContent = processedContent.replace(
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

