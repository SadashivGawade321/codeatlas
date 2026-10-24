import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Copy, Check, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Code } from 'lucide-react';

let mermaidInitialized = false;

function initMermaid() {
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#090d16',
        mainBkg: '#111827',
        textColor: '#f1f5f9',
        primaryColor: '#ea580c',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#f97316',
        lineColor: '#38bdf8',
        secondaryColor: '#1e293b',
        tertiaryColor: '#0f172a',
        nodeBorder: '#f97316',
        clusterBkg: '#0f172a',
        titleColor: '#fb923c',
        edgeLabelBackground: '#1e293b'
      },
      fontFamily: 'JetBrains Mono, monospace, system-ui',
      securityLevel: 'loose'
    });
    mermaidInitialized = true;
  }
}

export default function MermaidRenderer({ chart = '' }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const chartIdRef = useRef(`mermaid-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    initMermaid();
    let isMounted = true;

    async function renderChart() {
      if (!chart || !chart.trim()) return;
      setError(null);
      try {
        const cleanChart = chart.trim();
        const { svg } = await mermaid.render(chartIdRef.current, cleanChart);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.warn('Mermaid render error:', err);
        if (isMounted) {
          setError(err.message || 'Syntax error in Mermaid diagram');
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
      // Clean up any stray element mermaid might create in DOM
      const el = document.getElementById(chartIdRef.current);
      if (el) el.remove();
    };
  }, [chart]);

  const handleCopy = () => {
    navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl border border-white/10 bg-slate-950/80 overflow-hidden shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="font-mono font-medium text-slate-200">Interactive Diagram</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom(z => Math.max(0.6, z - 0.2))}
            title="Zoom Out"
            className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <ZoomOut size={13} />
          </button>
          <span className="font-mono text-[10px] text-slate-500 w-8 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(2.0, z + 0.2))}
            title="Zoom In"
            className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={() => setZoom(1)}
            title="Reset Zoom"
            className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <RotateCcw size={13} />
          </button>
          <div className="w-[1px] h-3 bg-white/10 mx-1" />
          <button
            onClick={() => setShowCode(!showCode)}
            title="Toggle Code View"
            className={`p-1 rounded transition-colors ${showCode ? 'bg-orange-500/20 text-orange-400' : 'hover:text-white hover:bg-white/10'}`}
          >
            <Code size={13} />
          </button>
          <button
            onClick={handleCopy}
            title="Copy Mermaid Syntax"
            className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* Code View Toggle */}
      {showCode && (
        <pre className="p-3 bg-black/60 border-b border-white/5 font-mono text-xs text-emerald-300 overflow-x-auto max-h-48 custom-scrollbar">
          <code>{chart}</code>
        </pre>
      )}

      {/* Diagram Canvas */}
      <div className="p-4 overflow-auto max-h-[420px] custom-scrollbar flex justify-center items-center bg-slate-950/40">
        {error ? (
          <div className="p-3 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to render diagram</p>
              <p className="text-[11px] text-rose-400/80 mt-0.5 font-mono">{error}</p>
              <pre className="mt-2 text-[10px] text-slate-300 bg-black/40 p-2 rounded max-h-32 overflow-auto font-mono">{chart}</pre>
            </div>
          </div>
        ) : svgContent ? (
          <div
            ref={containerRef}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.15s ease-out' }}
            className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="py-8 text-xs text-slate-500 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
            Rendering diagram...
          </div>
        )}
      </div>
    </div>
  );
}
