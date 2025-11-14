// Lecture Full Editor Script - Fixed version
let monacoEditor;
let currentTab = 'lecture-editor';

// Wait for DOM and Monaco to be ready
window.addEventListener('DOMContentLoaded', () => {
    // Initialize Monaco Editor
    if (typeof require !== 'undefined') {
        require(['vs/editor/editor.main'], function() {
            const editorElement = document.getElementById('monaco-lecture');
            if (!editorElement) {
                console.error('Monaco editor element #monaco-lecture not found');
                return;
            }
            
            monacoEditor = monaco.editor.create(editorElement, {
                value: `% Lecture Content

\\section{Introduction to Quantum Mechanics}

Quantum mechanics studies the behavior of microscopic objects.

\\subsection{Wave Function}

The wave function describes the quantum state:

$$\\Psi(\\mathbf{r},t) = A e^{i(\\mathbf{k} \\cdot \\mathbf{r} - \\omega t)}$$

\\subsection{Heisenberg Uncertainty Principle}

$$\\Delta x \\Delta p \\geq \\frac{\\hbar}{2}$$

\\section{Schrödinger Equation}

$$i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi$$`,
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
                if (currentTab === 'lecture-editor') {
                    debounceRender();
                }
            });
            
            // Initial render
            renderLatex();
        });
    }
    
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
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.classList.add('active');
            }
        });
    });
});

// LaTeX rendering
let renderTimeout;
function debounceRender() {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(renderLatex, 300);
}

function renderLatex() {
    if (!monacoEditor) return;
    const code = monacoEditor.getValue();
    const preview = document.getElementById('preview');
    if (!preview) return;
    
    let content = code;
    
    // Replace LaTeX macros
    content = content.replace(/\\section\{([^}]+)\}/g, '<h2>$1</h2>');
    content = content.replace(/\\subsection\{([^}]+)\}/g, '<h3>$1</h3>');
    content = content.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>');
    content = content.replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>');
    
    // Convert to paragraphs
    content = content.split('\n\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('');
    
    preview.innerHTML = content;
    
    // Render math with KaTeX
    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(preview, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
            ],
            throwOnError: false
        });
    }
}
