// Lecture Full Editor Script
let monacoEditor;
let solutionEditor;
let currentTab = 'latex-editor';
let tikzObjects = [];
let tikzHistory = [];
let tikzHistoryIndex = -1;
let tikzScale = 1;
let tikzOffsetX = 0;
let tikzOffsetY = 0;
let tikzCanvasWidth = 800;
let tikzCanvasHeight = 600;
let selectedIndex = null;
let dragInfo = null;
let jsxBoard;
let uploadedVideoAssetId = null;

// Initialize Monaco Editors
require(['vs/editor/editor.main'], function() {
    // Lecture Content Editor
    monacoEditor = monaco.editor.create(document.getElementById('monaco-editor'), {
        value: `% Lecture Content

\\section{Введение в квантовую механику}

Квантовая механика изучает поведение микроскопических объектов.

\\subsection{Волновая функция}

$$\\Psi(\\mathbf{r},t) = A e^{i(\\mathbf{k} \\cdot \\mathbf{r} - \\omega t)}$$

\\subsection{Принцип неопределённости Гейзенберга}

$$\\Delta x \\Delta p \\geq \\frac{\\hbar}{2}$$

\\section{Уравнение Шрёдингера}

$$i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi$$`,
        language: 'latex',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false
    });
    
    // Additional Notes Editor
    solutionEditor = monaco.editor.create(document.getElementById('monaco-solution'), {
        value: `% Additional Notes

\\textbf{Дополнительные материалы:}

1. Рекомендуемая литература:
- Ландау Л.Д., Лифшиц Е.М. "Квантовая механика"
- Фейнман Р. "Фейнмановские лекции по физике"

2. Практические задания см. в разделе задач.`,
        language: 'latex',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false
    });
    
    // Auto-render on change
    monacoEditor.onDidChangeModelContent(() => {
        if (currentTab === 'latex-editor') debounceRender();
    });
    solutionEditor.onDidChangeModelContent(() => {
        if (currentTab === 'solution-editor') debounceRender();
    });
    
    // Initial render
    renderLatex();
});

// Tab switching
const tabs = document.querySelectorAll('.tab');
const editorContents = document.querySelectorAll('.editor-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetId = tab.dataset.tab;
        currentTab = targetId;
        
        tabs.forEach(t => t.classList.remove('active'));
        editorContents.forEach(ec => ec.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(targetId).classList.add('active');
        
        if (targetId === 'jsxgraph' && !jsxBoard) {
            initJSXGraph();
        }
        
        if (targetId === 'tikz-visual') {
            renderTikzPreview();
        }
    });
});

// LaTeX rendering
let renderTimeout;
function debounceRender() {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(renderLatex, 300);
}

function renderLatex() {
    let editor = monacoEditor;
    if (currentTab === 'solution-editor' && solutionEditor) editor = solutionEditor;
    if (!editor) return;
    const code = editor.getValue();
    const preview = document.getElementById('preview');
    preview.innerHTML = '';
    
    try {
        // Extract content between \begin{document} and \end{document}
        const docMatch = code.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
        let content = docMatch ? docMatch[1] : code;
        
        // Compute offsets against the raw content before any replacements
        const raw = content;
        const contentStartOffset = code.indexOf(raw);
        
        // Store math token positions for later hover mapping (after KaTeX renders)
        const mathTokens = [];
        const regexes = [
            {re: /\$\$([\s\S]*?)\$\$/g},
            {re: /\\\[([\s\S]*?)\\\]/g},
            {re: /\\\(([\s\S]*?)\\\)/g},
            {re: /(^|[^$])\$([^$\n]+?)\$(?!\$)/g, adjust: (m)=>({start:m.index+(m[1]?m[1].length:0), end:m.index+m[0].length})}
        ];
        for (const {re, adjust} of regexes) {
            const matches = [...raw.matchAll(re)];
            for (const m of matches) {
                let s = m.index, e = m.index + m[0].length;
                if (adjust) { const adj = adjust(m); s = adj.start; e = adj.end; }
                mathTokens.push({start: contentStartOffset + s, end: contentStartOffset + e, text: raw.slice(s, e)});
            }
        }
        
        // Strip preview meta comments from rendered content
        content = raw.replace(/^%\s*tikz-(?:preview|layout).*$/gm, '');
        
        // Wrap sections/macros with proper HTML tags
        const wrapMacros = (src, macroMap) => {
            let all = [];
            for (const [macro, tag] of macroMap) {
                const matches = [...src.matchAll(new RegExp(`\\\\${macro}\\{([^}]+)\\}`, 'g'))];
                for (const m of matches) {
                    all.push({start:m.index, end:m.index+m[0].length, tag, inner:m[1], fullMatch:m[0]});
                }
            }
            all.sort((a,b)=>a.start-b.start);
            let out = '', pos = 0;
            for (const t of all) {
                out += content.slice(pos, t.start);
                const offset = contentStartOffset + raw.indexOf(t.fullMatch);
                out += `<${t.tag} class="src" data-start="${offset}" data-end="${offset + t.fullMatch.length}">${t.inner}</${t.tag}>`;
                pos = t.end;
            }
            out += content.slice(pos);
            return out;
        };
        content = wrapMacros(raw, [['section','h2'], ['subsection','h3'], ['textbf','strong'], ['textit','em']]);
        
        const tempDiv = document.createElement('div');
        
        // Handle TikZ pictures - replace with iframes that run TikZJax inside
        function hashCode(str){let h=0;for(let i=0;i<str.length;i++){h=((h<<5)-h)+str.charCodeAt(i);h|=0}return Math.abs(h)}
        // Precompute tikz ranges from raw to keep offsets correct
        const preTikz = [...raw.matchAll(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g)].map(m=>({code:m[0],start:contentStartOffset+m.index,end:contentStartOffset+m.index+m[0].length}));
        let tikzIdx = 0;
        const tikzMatches = [];
        content = content.replace(/(\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\})/g, (match, _g1, offset) => {
            const id = 'tikz-' + hashCode(match);
            const current = content;
            const before = current.slice(0, offset);
            const lineStart = before.lastIndexOf('\n') + 1;
            const prevLine = before.slice(lineStart).trim();
            let meta = {};
            const metaMatch = prevLine.match(/^%\s*tikz-(?:preview|layout)\s*:\s*(.+)$/i);
            if (metaMatch) {
                metaMatch[1].split(',').forEach(pair => {
                    const [k,v] = pair.split('=').map(s=>s.trim());
                    if (!k) return; const key = k.toLowerCase();
                    if (key === 'width') { const n = parseInt((v||'').replace('%',''),10); if (!isNaN(n)) meta.width = Math.max(20, Math.min(100, n)); }
                    if (key === 'align') { const a = (v||'').toLowerCase(); if (['inline','center','left','right'].includes(a)) meta.align = a; }
                });
            }
            const saved = JSON.parse(localStorage.getItem('tikz_cfg_'+id) || '{}');
            const width = (meta.width != null ? meta.width : (saved.width || 100));
            const height = meta.height || saved.height;
            const align = meta.align || saved.align || 'inline';
            let alignStyle = '';
            if (align === 'inline') alignStyle = 'display:inline-block;';
            if (align === 'center') alignStyle = 'display:block;margin-left:auto;margin-right:auto;';
            if (align === 'left') alignStyle = 'display:block;margin-left:0;margin-right:auto;';
            if (align === 'right') alignStyle = 'display:block;margin-left:auto;margin-right:0;';
            const pre = preTikz[tikzIdx++] || {start:contentStartOffset, end:contentStartOffset+match.length, code:match};
            tikzMatches.push({ id, code: match, start: pre.start, end: pre.end, height });
            return `<div class="tikz-card" data-id="${id}" data-start="${pre.start}" data-end="${pre.end}" style="width:${width}%;${alignStyle}">`+
                   `<div id="${id}" class="tikz-frame" ${height?`style="height:${height}px"`:''}></div>`+
                   `</div>`;
        });
        
        tempDiv.innerHTML = content;
        preview.appendChild(tempDiv);
        
        // Render math with KaTeX
        renderMathInElement(preview, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\[', right: '\\]', display: true},
                {left: '\\(', right: '\\)', display: false}
            ],
            throwOnError: false
        });
        
        // After KaTeX renders, add hover attributes to math elements
        const katexElements = preview.querySelectorAll('.katex');
        let mathIdx = 0;
        katexElements.forEach(el => {
            if (mathIdx < mathTokens.length) {
                const token = mathTokens[mathIdx++];
                el.classList.add('src');
                el.dataset.start = token.start;
                el.dataset.end = token.end;
            }
        });
        
        // Insert iframes for TikZ diagrams
        tikzMatches.forEach(({ id, code, height }) => {
            const container = document.getElementById(id);
            const card = document.querySelector(`.tikz-card[data-id="${id}"]`);
            if (!container || !card) return;
            card.style.margin = '8px';
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.border = '0';
            iframe.loading = 'lazy';
            const escaped = code;
            const html = '<!DOCTYPE html><html><head>' +
                          '<meta charset="utf-8">' +
                          '<link rel="stylesheet" href="https://tikzjax.com/v1/fonts.css">' +
                          '<script defer src="https://tikzjax.com/v1/tikzjax.js"><\/script>' +
                          '<style>html,body{margin:0;padding:0;height:100%;background:#fff;display:flex;align-items:center;justify-content:center;}svg{max-width:240px;max-height:240px;width:auto;height:auto;}</style>' +
                          '</head><body>' +
                          '<script type="text/tikz">' + escaped + '<\/script>' +
                          '</body></html>';
            iframe.srcdoc = html;
            iframe.onload = () => {
                const adjust = () => {
                    try {
                        const doc = iframe.contentDocument;
                        const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 150);
                        iframe.style.height = (height ? height : h) + 'px';
                    } catch (e) {}
                };
                adjust();
                const interval = setInterval(adjust, 300);
                setTimeout(() => clearInterval(interval), 5000);
            };
            container.innerHTML = '';
            container.appendChild(iframe);
        });

        // Hover -> highlight mapping
        let decorations = [];
        const offsetToPos = (text, off) => { const s = text.slice(0, off).split('\n'); return { line: s.length, col: s[s.length-1].length + 1 }; };
        const highlight = (start, end) => {
            const s = offsetToPos(code, start); const e = offsetToPos(code, end);
            decorations = monacoEditor.deltaDecorations(decorations, [{ range: new monaco.Range(s.line, s.col, e.line, e.col), options: { inlineClassName: 'code-highlight' } }]);
        };
        const clearHighlight = () => { decorations = monacoEditor.deltaDecorations(decorations, []); };
        preview.addEventListener('mouseover', (ev) => {
            const el = ev.target.closest('[data-start][data-end]'); if (!el) return;
            highlight(parseInt(el.dataset.start,10), parseInt(el.dataset.end,10));
        });
        preview.addEventListener('mouseout', (ev) => {
            const el = ev.target.closest('[data-start][data-end]'); if (!el) return; clearHighlight();
        });

    } catch (error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = 'Error: ' + error.message;
        preview.appendChild(errorDiv);
    }
}

// [TikZ Visual Editor code - same as task editor, lines 923-1534 from admin-tasks-full.html]
// I'll include the essential TikZ functions here...

const tikzCanvas = document.getElementById('tikz-canvas');
const tikzCtx = tikzCanvas.getContext('2d', { alpha: false });
const dpr = window.devicePixelRatio || 1;

function resizeTikzCanvas() {
    const container = document.getElementById('tikz-canvas-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    tikzCanvasWidth = rect.width || 800;
    tikzCanvasHeight = rect.height || 600;
    tikzCanvas.width = tikzCanvasWidth * dpr;
    tikzCanvas.height = tikzCanvasHeight * dpr;
    tikzCanvas.style.width = tikzCanvasWidth + 'px';
    tikzCanvas.style.height = tikzCanvasHeight + 'px';
    renderTikzCanvas();
}
window.addEventListener('resize', resizeTikzCanvas);

function renderTikzCanvas() {
    const w = tikzCanvasWidth;
    const h = tikzCanvasHeight;
    tikzCtx.save();
    tikzCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tikzCtx.fillStyle = 'white';
    tikzCtx.fillRect(0, 0, w, h);
    tikzCtx.translate(w/2, h/2);
    tikzCtx.scale(tikzScale, tikzScale);
    tikzCtx.translate(-w/2 + tikzOffsetX, -h/2 + tikzOffsetY);
    tikzCtx.strokeStyle = '#f0f0f0';
    tikzCtx.lineWidth = 0.5 / tikzScale;
    for (let i = 0; i < w * 2; i += 20) {
        tikzCtx.beginPath();
        tikzCtx.moveTo(i - w, -h);
        tikzCtx.lineTo(i - w, h * 2);
        tikzCtx.stroke();
    }
    for (let i = 0; i < h * 2; i += 20) {
        tikzCtx.beginPath();
        tikzCtx.moveTo(-w, i - h);
        tikzCtx.lineTo(w * 2, i - h);
        tikzCtx.stroke();
    }
    
    // Draw all objects
    tikzObjects.forEach((obj, idx) => {
        tikzCtx.strokeStyle = obj.color || '#000';
        tikzCtx.lineWidth = (obj.strokeWidth || obj.width || 1) / tikzScale;
        tikzCtx.fillStyle = obj.fill || 'transparent';
        
        switch (obj.type) {
            case 'line':
                tikzCtx.beginPath();
                tikzCtx.moveTo(obj.x1, obj.y1);
                tikzCtx.lineTo(obj.x2, obj.y2);
                tikzCtx.stroke();
                break;
            case 'arrow':
                drawArrow(tikzCtx, obj.x1, obj.y1, obj.x2, obj.y2);
                break;
            case 'rectangle':
                tikzCtx.strokeRect(obj.x, obj.y, obj.width, obj.height);
                break;
            case 'circle':
                tikzCtx.beginPath();
                tikzCtx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI);
                tikzCtx.stroke();
                break;
            case 'text':
            case 'node':
                tikzCtx.fillStyle = obj.color;
                tikzCtx.font = (14 / tikzScale) + 'px Arial';
                tikzCtx.fillText(obj.text, obj.x, obj.y);
                break;
        }

        // Draw selection handles
        if (idx === selectedIndex) {
            tikzCtx.save();
            tikzCtx.fillStyle = '#0e639c';
            const handleSize = 4 / tikzScale;
            if (obj.type === 'line' || obj.type === 'arrow') {
                const handles = [ {x: obj.x1, y: obj.y1}, {x: obj.x2, y: obj.y2} ];
                handles.forEach(p => {
                    tikzCtx.fillRect(p.x - handleSize, p.y - handleSize, handleSize*2, handleSize*2);
                });
            } else if (obj.type === 'circle') {
                tikzCtx.fillRect(obj.x - handleSize, obj.y - handleSize, handleSize*2, handleSize*2);
            }
            tikzCtx.restore();
        }
    });
    tikzCtx.restore();
}

function screenToWorld(clientX, clientY) {
    const rect = tikzCanvas.getBoundingClientRect();
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    const w = tikzCanvasWidth;
    const h = tikzCanvasHeight;
    const x = (canvasX - w/2) / tikzScale - tikzOffsetX + w/2;
    const y = (canvasY - h/2) / tikzScale - tikzOffsetY + h/2;
    return { x, y };
}

function findNearestObject(x, y, maxDist = 20) {
    let bestIndex = null;
    let bestDist = maxDist;
    tikzObjects.forEach((obj, idx) => {
        const d = distanceToShape(obj, x, y);
        if (d < bestDist) {
            bestDist = d;
            bestIndex = idx;
        }
    });
    return bestIndex;
}

function snapPoint(x, y, ignoreIndex = null) {
    const snapDist = 10;
    let bestX = x;
    let bestY = y;
    let bestD = snapDist;
    tikzObjects.forEach((obj, idx) => {
        if (idx === ignoreIndex) return;
        switch (obj.type) {
            case 'line':
            case 'arrow': {
                const pts = [ {x: obj.x1, y: obj.y1}, {x: obj.x2, y: obj.y2} ];
                pts.forEach(p => {
                    const d = Math.hypot(x - p.x, y - p.y);
                    if (d < bestD) { bestD = d; bestX = p.x; bestY = p.y; }
                });
                break;
            }
            case 'circle': {
                const d = Math.hypot(x - obj.x, y - obj.y);
                if (d < bestD) { bestD = d; bestX = obj.x; bestY = obj.y; }
                break;
            }
            case 'rectangle': {
                const corners = [
                    {x: obj.x, y: obj.y},
                    {x: obj.x + obj.width, y: obj.y},
                    {x: obj.x, y: obj.y + obj.height},
                    {x: obj.x + obj.width, y: obj.y + obj.height},
                ];
                corners.forEach(p => {
                    const d = Math.hypot(x - p.x, y - p.y);
                    if (d < bestD) { bestD = d; bestX = p.x; bestY = p.y; }
                });
                break;
            }
            case 'text':
            case 'node': {
                const d = Math.hypot(x - obj.x, y - obj.y);
                if (d < bestD) { bestD = d; bestX = obj.x; bestY = obj.y; }
                break;
            }
        }
    });
    return { x: bestX, y: bestY };
}

function drawArrow(ctx, fromX, fromY, toX, toY) {
    const headlen = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

function distanceToShape(obj, px, py) {
    function distPointToSegment(x1, y1, x2, y2, x0, y0) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        if (dx === 0 && dy === 0) return Math.hypot(x0 - x1, y0 - y1);
        const t = ((x0 - x1) * dx + (y0 - y1) * dy) / (dx * dx + dy * dy);
        const clamped = Math.max(0, Math.min(1, t));
        const nx = x1 + clamped * dx;
        const ny = y1 + clamped * dy;
        return Math.hypot(x0 - nx, y0 - ny);
    }
    switch (obj.type) {
        case 'line':
        case 'arrow':
            return distPointToSegment(obj.x1, obj.y1, obj.x2, obj.y2, px, py);
        case 'rectangle': {
            const left = obj.x;
            const right = obj.x + obj.width;
            const top = obj.y;
            const bottom = obj.y + obj.height;
            const dx = Math.max(left - px, 0, px - right);
            const dy = Math.max(top - py, 0, py - bottom);
            return Math.hypot(dx, dy);
        }
        case 'circle':
            return Math.abs(Math.hypot(px - obj.x, py - obj.y) - obj.radius);
        case 'text':
        case 'node':
            return Math.hypot(px - obj.x, py - obj.y);
        default:
            return Infinity;
    }
}

// TikZ interaction variables
let currentTool = 'select';
let isDrawing = false;
let startX, startY;
let touchAllowed = false;
let isPanning = false;
let panStartX, panStartY;

// Tool selection
const toolButtons = document.querySelectorAll('.tool-btn[data-tool]');
toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        toolButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;
    });
});

// Touch toggle
document.getElementById('toggle-touch').addEventListener('click', () => {
    touchAllowed = !touchAllowed;
    document.getElementById('toggle-touch').textContent = 'Touch: ' + (touchAllowed ? 'On' : 'Off');
});

// Undo/Redo
function undo() {
    if (tikzHistoryIndex > 0) {
        tikzHistoryIndex--;
        tikzObjects = JSON.parse(JSON.stringify(tikzHistory[tikzHistoryIndex]));
        renderTikzCanvas();
    }
}
function redo() {
    if (tikzHistoryIndex < tikzHistory.length - 1) {
        tikzHistoryIndex++;
        tikzObjects = JSON.parse(JSON.stringify(tikzHistory[tikzHistoryIndex]));
        renderTikzCanvas();
    }
}
document.getElementById('undo-btn').addEventListener('click', undo);
document.getElementById('redo-btn').addEventListener('click', redo);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
    }
});

// Zoom
function setZoom(scale) {
    tikzScale = Math.max(0.1, Math.min(10, scale));
    renderTikzCanvas();
    document.getElementById('zoom-reset').textContent = Math.round(tikzScale * 100) + '%';
}
document.getElementById('zoom-in').addEventListener('click', () => setZoom(tikzScale * 1.2));
document.getElementById('zoom-out').addEventListener('click', () => setZoom(tikzScale / 1.2));
document.getElementById('zoom-reset').addEventListener('click', () => { setZoom(1); tikzOffsetX = 0; tikzOffsetY = 0; renderTikzCanvas(); });
tikzCanvas.addEventListener('wheel', (e) => {
    if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        setZoom(tikzScale * (e.deltaY < 0 ? 1.1 : 0.9));
    }
});

// Pan with shift+drag or middle mouse button
tikzCanvas.addEventListener('mousedown', (e) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        isPanning = true;
        panStartX = e.offsetX;
        panStartY = e.offsetY;
        e.preventDefault();
    }
});
tikzCanvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
        tikzOffsetX += (e.offsetX - panStartX) / tikzScale;
        tikzOffsetY += (e.offsetY - panStartY) / tikzScale;
        panStartX = e.offsetX;
        panStartY = e.offsetY;
        renderTikzCanvas();
    }
});
tikzCanvas.addEventListener('mouseup', (e) => {
    if (e.button === 1 || e.button === 0) {
        isPanning = false;
    }
});

// Fullscreen
document.getElementById('fullscreen-btn').addEventListener('click', () => {
    const tikzTab = document.getElementById('tikz-visual');
    if (!document.fullscreenElement) {
        tikzTab.requestFullscreen().catch(err => console.error(err));
    } else {
        document.exitFullscreen();
    }
});
document.addEventListener('fullscreenchange', () => {
    resizeTikzCanvas();
});

// Pointer events for drawing
const pointerDown = (e) => {
    if (e.pointerType === 'touch' && !touchAllowed) return;
    if (isPanning) return;
    
    if (currentTool === 'select') {
        const { x, y } = screenToWorld(e.clientX, e.clientY);
        const idx = findNearestObject(x, y, 20);
        if (idx === null) {
            selectedIndex = null;
            dragInfo = null;
            renderTikzCanvas();
            return;
        }
        selectedIndex = idx;
        const obj = tikzObjects[idx];
        const handleRadius = 10;
        let handle = null;
        if (obj.type === 'line' || obj.type === 'arrow') {
            const d1 = Math.hypot(x - obj.x1, y - obj.y1);
            const d2 = Math.hypot(x - obj.x2, y - obj.y2);
            if (d1 < handleRadius && d1 <= d2) handle = 'line-start';
            else if (d2 < handleRadius) handle = 'line-end';
        } else if (obj.type === 'circle') {
            const d = Math.hypot(x - obj.x, y - obj.y);
            if (d < handleRadius) handle = 'circle-center';
        }
        if (handle) {
            dragInfo = { mode: 'handle', handle, index: idx };
        } else {
            dragInfo = { mode: 'move', index: idx, startX: x, startY: y, original: JSON.parse(JSON.stringify(obj)) };
        }
        renderTikzCanvas();
        return;
    }
    
    if (e.button === 1 || e.shiftKey) return;
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    startX = x;
    startY = y;
    isDrawing = true;
    if (currentTool === 'text') {
        const text = prompt('Enter text:');
        if (text) {
            tikzObjects.push({ type: 'text', x: startX, y: startY, text, color: document.getElementById('stroke-color').value });
            renderTikzCanvas();
        }
        isDrawing = false;
    }
};
tikzCanvas.addEventListener('pointerdown', pointerDown);

const pointerMove = (e) => {
    if (e.pointerType === 'touch' && !touchAllowed) return;
    if (isPanning) return;
    
    if (currentTool === 'select') {
        if (!dragInfo) return;
        const { x, y } = screenToWorld(e.clientX, e.clientY);
        const obj = tikzObjects[dragInfo.index];
        if (!obj) return;
        if (dragInfo.mode === 'handle') {
            const snapped = snapPoint(x, y, dragInfo.index);
            if (dragInfo.handle === 'line-start') {
                obj.x1 = snapped.x; obj.y1 = snapped.y;
            } else if (dragInfo.handle === 'line-end') {
                obj.x2 = snapped.x; obj.y2 = snapped.y;
            } else if (dragInfo.handle === 'circle-center') {
                obj.x = snapped.x; obj.y = snapped.y;
            }
        } else if (dragInfo.mode === 'move') {
            const dx = x - dragInfo.startX;
            const dy = y - dragInfo.startY;
            const base = dragInfo.original;
            switch (base.type) {
                case 'line':
                case 'arrow':
                    obj.x1 = base.x1 + dx; obj.y1 = base.y1 + dy;
                    obj.x2 = base.x2 + dx; obj.y2 = base.y2 + dy;
                    break;
                case 'rectangle':
                    obj.x = base.x + dx; obj.y = base.y + dy;
                    break;
                case 'circle':
                    obj.x = base.x + dx; obj.y = base.y + dy;
                    break;
                case 'text':
                case 'node':
                    obj.x = base.x + dx; obj.y = base.y + dy;
                    break;
            }
        }
        renderTikzCanvas();
        return;
    }
    
    if (!isDrawing) return;
    const { x: currentX, y: currentY } = screenToWorld(e.clientX, e.clientY);
    renderTikzCanvas();
    const w = tikzCanvasWidth;
    const h = tikzCanvasHeight;
    tikzCtx.save();
    tikzCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tikzCtx.translate(w/2, h/2);
    tikzCtx.scale(tikzScale, tikzScale);
    tikzCtx.translate(-w/2 + tikzOffsetX, -h/2 + tikzOffsetY);
    tikzCtx.strokeStyle = document.getElementById('stroke-color').value;
    tikzCtx.lineWidth = document.getElementById('stroke-width').value / tikzScale;
    tikzCtx.fillStyle = document.getElementById('fill-color').value;
    switch (currentTool) {
        case 'line':
            tikzCtx.beginPath(); tikzCtx.moveTo(startX, startY); tikzCtx.lineTo(currentX, currentY); tikzCtx.stroke();
            break;
        case 'arrow':
            drawArrow(tikzCtx, startX, startY, currentX, currentY); break;
        case 'rectangle':
            tikzCtx.strokeRect(startX, startY, currentX - startX, currentY - startY); break;
        case 'circle':
            const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
            tikzCtx.beginPath(); tikzCtx.arc(startX, startY, radius, 0, 2 * Math.PI); tikzCtx.stroke();
            break;
    }
    tikzCtx.restore();
};
tikzCanvas.addEventListener('pointermove', pointerMove);

const pointerUp = (e) => {
    if (e.pointerType === 'touch' && !touchAllowed) return;
    if (isPanning) return;
    
    if (currentTool === 'select') {
        if (dragInfo) {
            saveHistory();
            dragInfo = null;
        }
        return;
    }
    
    if (!isDrawing) return;
    const { x: endX, y: endY } = screenToWorld(e.clientX, e.clientY);
    const strokeColor = document.getElementById('stroke-color').value;
    const strokeWidth = document.getElementById('stroke-width').value;
    const fillColor = document.getElementById('fill-color').value;
    if (currentTool === 'eraser') {
        const threshold = 15;
        let erased = false;
        for (let i = tikzObjects.length - 1; i >= 0; i--) {
            if (distanceToShape(tikzObjects[i], endX, endY) <= threshold) {
                tikzObjects.splice(i, 1);
                erased = true;
                break;
            }
        }
        if (erased) {
            saveHistory();
        }
    } else {
        switch (currentTool) {
            case 'line':
                tikzObjects.push({ type:'line', x1:startX, y1:startY, x2:endX, y2:endY, color:strokeColor, width:strokeWidth }); 
                saveHistory();
                break;
            case 'arrow':
                tikzObjects.push({ type:'arrow', x1:startX, y1:startY, x2:endX, y2:endY, color:strokeColor, width:strokeWidth }); 
                saveHistory();
                break;
            case 'rectangle':
                tikzObjects.push({ type:'rectangle', x:startX, y:startY, width:endX-startX, height:endY-startY, color:strokeColor, strokeWidth:strokeWidth, fill:fillColor }); 
                saveHistory();
                break;
            case 'circle':
                const radius = Math.sqrt(Math.pow(endX-startX,2)+Math.pow(endY-startY,2));
                tikzObjects.push({ type:'circle', x:startX, y:startY, radius, color:strokeColor, strokeWidth:strokeWidth, fill:fillColor }); 
                saveHistory();
                break;
            case 'node':
                const nodeText = prompt('Enter node text:');
                if (nodeText) { 
                    tikzObjects.push({ type:'node', x:startX, y:startY, text:nodeText, color:strokeColor }); 
                    saveHistory();
                }
                break;
        }
    }
    isDrawing = false; renderTikzCanvas();
};
tikzCanvas.addEventListener('pointerup', pointerUp);
tikzCanvas.addEventListener('pointercancel', pointerUp);

// Template selector
const templateSelect = document.getElementById('template-select');
templateSelect.addEventListener('change', () => {
    const t = templateSelect.value; if (!t) return; templateSelect.value='';
    const cw = tikzCanvasWidth;
    const ch = tikzCanvasHeight;
    const cx = cw / 2, cy = ch / 2;
    if (t === 'surface-solid') {
        tikzObjects.push({ type:'rectangle', x:20, y:cy+40, width:cw-40, height:8, color:'#666', strokeWidth:2, fill:'#666' });
    } else if (t === 'surface-water') {
        const seg=40; const amp=6; const y=cy+40; let pts=[]; for(let i=20;i<cw-20;i+=seg){ pts.push({x:i,y:y+Math.sin(i/10)*amp}); }
        for(let i=0;i<pts.length-1;i++){ tikzObjects.push({ type:'line', x1:pts[i].x, y1:pts[i].y, x2:pts[i+1].x, y2:pts[i+1].y, color:'#1e90ff', width:2 }); }
    } else if (t === 'spring') {
        const x0=100,y0=cy, turns=10, pitch=10, amp=10; let prev={x:x0,y:y0};
        for(let i=1;i<=turns;i++){ const x=x0+i*pitch; const y=y0+(i%2?amp:-amp); tikzObjects.push({ type:'line', x1:prev.x, y1:prev.y, x2:x, y2:y, color:'#888', width:2 }); prev={x,y}; }
    } else if (t === 'pulley-fixed') {
        tikzObjects.push({ type:'circle', x:cx-40, y:cy-20, radius:20, color:'#444', strokeWidth:2, fill:'#eee' });
        tikzObjects.push({ type:'circle', x:cx+40, y:cy-20, radius:20, color:'#444', strokeWidth:2, fill:'#eee' });
        tikzObjects.push({ type:'line', x1:cx-40, y1:cy-40, x2:cx+40, y2:cy-40, color:'#444', width:3 });
    } else if (t === 'pulley-movable') {
        tikzObjects.push({ type:'circle', x:cx, y:cy-20, radius:22, color:'#444', strokeWidth:2, fill:'#eee' });
        tikzObjects.push({ type:'circle', x:cx, y:cy+60, radius:22, color:'#444', strokeWidth:2, fill:'#eee' });
        tikzObjects.push({ type:'line', x1:cx, y1:cy-42, x2:cx, y2:cy+38, color:'#444', width:3 });
    } else if (t === 'balloon') {
        tikzObjects.push({ type:'circle', x:cx, y:cy, radius:30, color:'#ff4d4f', strokeWidth:2, fill:'#ff6b6d' });
        tikzObjects.push({ type:'line', x1:cx, y1:cy+30, x2:cx, y2:cy+80, color:'#ff6b6d', width:2 });
    }
    renderTikzCanvas();
});

function saveHistory() {
    tikzHistoryIndex++;
    tikzHistory = tikzHistory.slice(0, tikzHistoryIndex);
    tikzHistory.push(JSON.parse(JSON.stringify(tikzObjects)));
}

function renderTikzPreview() {
    const preview = document.getElementById('preview');
    preview.innerHTML = '<div class="code-output"><h3>TikZ Code:</h3><pre>' + generateTikZCode() + '</pre></div>';
}

function generateTikZCode() {
    let code = '\\begin{tikzpicture}[scale=0.1]\n';
    
    tikzObjects.forEach(obj => {
        const x1 = (obj.x1 / 10).toFixed(2);
        const y1 = (obj.y1 / 10).toFixed(2);
        const x2 = (obj.x2 / 10).toFixed(2);
        const y2 = (obj.y2 / 10).toFixed(2);
        const x = (obj.x / 10).toFixed(2);
        const y = (obj.y / 10).toFixed(2);
        
        switch (obj.type) {
            case 'line':
                code += `  \\draw (${x1},${y1}) -- (${x2},${y2});\n`;
                break;
            case 'arrow':
                code += `  \\draw[->,thick] (${x1},${y1}) -- (${x2},${y2});\n`;
                break;
            case 'rectangle':
                const w = (obj.width / 10).toFixed(2);
                const h = (obj.height / 10).toFixed(2);
                code += `  \\draw (${x},${y}) rectangle +(${w},${h});\n`;
                break;
            case 'circle':
                const r = (obj.radius / 10).toFixed(2);
                code += `  \\draw (${x},${y}) circle (${r});\n`;
                break;
            case 'text':
                code += `  \\node at (${x},${y}) {${obj.text}};\n`;
                break;
            case 'node':
                code += `  \\node[draw] at (${x},${y}) {${obj.text}};\n`;
                break;
        }
    });
    
    code += '\\end{tikzpicture}';
    return code;
}

// TikZ toolbar buttons
document.getElementById('clear-tikz').addEventListener('click', () => {
    tikzObjects = [];
    saveHistory();
    renderTikzCanvas();
});

document.getElementById('generate-tikz').addEventListener('click', () => {
    renderTikzPreview();
});

saveHistory();
resizeTikzCanvas();

// JSXGraph
function initJSXGraph() {
    jsxBoard = JXG.JSXGraph.initBoard('jsxgraph-board', {
        boundingbox: [-10, 10, 10, -10],
        axis: true,
        showNavigation: true,
        showCopyright: false
    });
}

document.getElementById('plot-function').addEventListener('click', () => {
    const funcInput = document.getElementById('function-input').value;
    try {
        let expr = funcInput.replace(/f\(x\)\s*=\s*/, '');
        expr = expr.replace(/\^/g, '**');
        jsxBoard.create('functiongraph', [
            function(x) { return eval(expr); }
        ], {strokeColor: '#' + Math.floor(Math.random()*16777215).toString(16)});
        document.getElementById('function-input').value = '';
    } catch (e) {
        alert('Error plotting function: ' + e.message);
    }
});

document.getElementById('add-point').addEventListener('click', () => {
    const pointInput = document.getElementById('point-input').value;
    const match = pointInput.match(/\(([^,]+),([^)]+)\)/);
    if (match) {
        const x = parseFloat(match[1]);
        const y = parseFloat(match[2]);
        jsxBoard.create('point', [x, y], {name: `(${x},${y})`});
        document.getElementById('point-input').value = '';
    }
});

document.getElementById('clear-graph').addEventListener('click', () => {
    if (jsxBoard) {
        JXG.JSXGraph.freeBoard(jsxBoard);
        initJSXGraph();
    }
});

// Export functions
document.getElementById('export-latex').addEventListener('click', () => {
    const code = monacoEditor.getValue();
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lecture.tex';
    a.click();
});

document.getElementById('copy-code').addEventListener('click', () => {
    navigator.clipboard.writeText(monacoEditor.getValue());
    alert('Code copied to clipboard!');
});

document.getElementById('export-pdf').addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const preview = document.getElementById('preview');
    const clone = preview.cloneNode(true);
    const liveIframes = preview.querySelectorAll('.tikz-frame iframe');
    const cloneIframes = clone.querySelectorAll('.tikz-frame iframe');
    for (let i = 0; i < liveIframes.length; i++) {
        const live = liveIframes[i];
        const doc = live.contentDocument;
        if (doc) {
            const svg = doc.querySelector('svg');
            if (svg) {
                const ser = new XMLSerializer();
                const svgStr = ser.serializeToString(svg);
                const img = document.createElement('img');
                img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
                img.style.width = live.style.width || '100%';
                cloneIframes[i].parentNode.replaceChild(img, cloneIframes[i]);
            }
        }
    }
    const hidden = document.createElement('div');
    hidden.style.position = 'fixed'; hidden.style.left = '-99999px'; hidden.style.top = '0';
    hidden.appendChild(clone);
    document.body.appendChild(hidden);
    const canvas = await html2canvas(clone, { backgroundColor: '#ffffff', scale: 2, useCORS: true, foreignObjectRendering: true });
    document.body.removeChild(hidden);
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 24;
    const imgW = pageW - margin * 2;
    const imgH = canvas.height * imgW / canvas.width;
    let remainingH = imgH;
    let sY = 0;
    while (remainingH > 0) {
        const sliceHpx = Math.min(canvas.height - sY, (pageH - margin * 2) * canvas.width / imgW);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width; sliceCanvas.height = sliceHpx;
        const ctx = sliceCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, sY, canvas.width, sliceHpx, 0, 0, canvas.width, sliceHpx);
        const imgData = sliceCanvas.toDataURL('image/png');
        const sliceHpt = sliceHpx * imgW / canvas.width;
        pdf.addImage(imgData, 'PNG', margin, margin, imgW, sliceHpt);
        remainingH -= sliceHpt;
        sY += sliceHpx;
        if (remainingH > 0) pdf.addPage();
    }
    pdf.save('lecture-preview.pdf');
});

document.getElementById('refresh-preview').addEventListener('click', renderLatex);

// Auth helpers
function getToken() { return localStorage.getItem('COOLPHY_TOKEN') || ''; }
function setAuthUI() {
    const t = getToken();
    const logoutBtn = document.getElementById('logout-btn');
    const loginLink = document.getElementById('login-link');
    if (t) {
        logoutBtn.style.display = 'inline-block';
        loginLink.style.display = 'none';
    } else {
        logoutBtn.style.display = 'none';
        loginLink.style.display = 'inline-block';
    }
}
setAuthUI();
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('COOLPHY_TOKEN');
    setAuthUI();
});

// Video Upload Logic
const videoFileInput = document.getElementById('video-file');
const videoUploadStatus = document.getElementById('video-upload-status');
const videoPreview = document.getElementById('video-preview');
const clearVideoBtn = document.getElementById('clear-video-btn');

videoFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = getToken();
    if (!token) {
        videoUploadStatus.textContent = 'Error: Admin token required for video upload.';
        videoUploadStatus.style.color = '#f48771';
        return;
    }

    videoUploadStatus.textContent = `Uploading ${file.name}...`;
    videoUploadStatus.style.color = '#cccccc';

    const formData = new FormData();
    formData.append('video', file);

    try {
        const response = await fetch('http://178.255.127.62/api/v1/admin/videos', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            uploadedVideoAssetId = result.id;
            videoUploadStatus.textContent = `Upload successful! Video ID: ${result.id}`;
            videoUploadStatus.style.color = '#107c10';
            videoPreview.src = result.url;
            videoPreview.style.display = 'block';
            clearVideoBtn.style.display = 'inline-block';
            document.getElementById('video-url').value = ''; // Clear external URL if file uploaded
        } else {
            videoUploadStatus.textContent = `Upload failed: ${result.error || 'Unknown error'}`;
            videoUploadStatus.style.color = '#f48771';
            uploadedVideoAssetId = null;
            videoPreview.style.display = 'none';
            clearVideoBtn.style.display = 'none';
        }
    } catch (error) {
        videoUploadStatus.textContent = `Network error during upload: ${error.message}`;
        videoUploadStatus.style.color = '#f48771';
        uploadedVideoAssetId = null;
        videoPreview.style.display = 'none';
        clearVideoBtn.style.display = 'none';
    }
});

clearVideoBtn.addEventListener('click', () => {
    uploadedVideoAssetId = null;
    videoFileInput.value = '';
    videoPreview.src = '';
    videoPreview.style.display = 'none';
    clearVideoBtn.style.display = 'none';
    videoUploadStatus.textContent = 'No video uploaded yet.';
    videoUploadStatus.style.color = '#cccccc';
});

// Save Lecture
document.getElementById('save-lecture-btn').addEventListener('click', async () => {
    const token = getToken();
    if (!token) {
        const msg = document.getElementById('save-message');
        msg.style.display = 'block';
        msg.style.background = '#5a1d1d';
        msg.style.color = '#f48771';
        msg.textContent = 'Please login first (click Login in header)';
        return;
    }
    const title = document.getElementById('lecture-title').value.trim();
    const subject = document.getElementById('lecture-subject').value;
    const level = document.getElementById('lecture-level').value;
    if (!title || !subject) {
        const msg = document.getElementById('save-message');
        msg.style.display = 'block';
        msg.style.background = '#5a1d1d';
        msg.style.color = '#f48771';
        msg.textContent = 'Please fill required fields: Title, Subject';
        return;
    }
    const tags = document.getElementById('lecture-tags').value.split(',').map(t=>t.trim()).filter(t=>t);
    const data = {
        title,
        subject,
        content_latex: monacoEditor.getValue(),
        summary: document.getElementById('lecture-summary').value,
        tags,
        level,
        status: document.getElementById('lecture-status').value,
        video_url: document.getElementById('video-url').value,
        video_transcript: document.getElementById('video-transcript').value,
        video_asset_id: uploadedVideoAssetId
    };
    try {
        const res = await fetch('http://178.255.127.62/api/v1/admin/lectures', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        const msg = document.getElementById('save-message');
        msg.style.display = 'block';
        if (res.ok) {
            msg.style.background = '#107c10';
            msg.style.color = '#fff';
            msg.textContent = 'Lecture created successfully! ID: ' + (result.id || 'N/A');
        } else {
            msg.style.background = '#5a1d1d';
            msg.style.color = '#f48771';
            msg.textContent = 'Error: ' + (result.error || 'Failed to create lecture');
        }
    } catch (e) {
        const msg = document.getElementById('save-message');
        msg.style.display = 'block';
        msg.style.background = '#5a1d1d';
        msg.style.color = '#f48771';
        msg.textContent = 'Network error: ' + e.message;
    }
});
