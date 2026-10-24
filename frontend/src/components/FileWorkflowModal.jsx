import React, { useState, useMemo } from 'react';
import {
  ShieldAlert, ShieldCheck, ArrowRight, ArrowLeft, Workflow,
  AlertTriangle, CheckCircle, Zap, Activity, Bug, X, ExternalLink,
  ChevronRight, CornerDownRight, Play, RefreshCw, Cpu
} from 'lucide-react';

export default function FileWorkflowModal({
  isOpen,
  onClose,
  file,
  graphData,
  onSelectFile,
  onAskAI
}) {
  const [simulatedFailure, setSimulatedFailure] = useState(false);
  const [activeTab, setActiveTab] = useState('workflow'); // 'workflow' | 'blast' | 'cascade'

  // Calculate Multi-Hop Blast Radius & Dependencies
  const analysis = useMemo(() => {
    if (!file || !graphData) return null;

    const nodes = graphData.nodes || [];
    const edges = graphData.edges || [];

    // Level 1 Direct Inbound (Who calls this file?)
    const directInboundEdges = edges.filter(e => e.target === file.id);
    const directInbound = directInboundEdges
      .map(e => nodes.find(n => n.id === e.source))
      .filter(Boolean);

    // Level 1 Direct Outbound (What does this file call?)
    const directOutboundEdges = edges.filter(e => e.source === file.id);
    const directOutbound = directOutboundEdges
      .map(e => nodes.find(n => n.id === e.target))
      .filter(Boolean);

    // Multi-Hop Downstream BFS (Transitive impact if this file fails)
    const visited = new Set([file.id]);
    const cascadeLevels = [];
    let currentLevel = [file.id];

    for (let depth = 1; depth <= 3; depth++) {
      const nextLevel = [];
      for (const nodeId of currentLevel) {
        // Files that depend on nodeId (inbound to nodeId or outbound from nodeId depending on call direction)
        const callers = edges.filter(e => e.target === nodeId || e.source === nodeId);
        for (const edge of callers) {
          const neighborId = edge.source === nodeId ? edge.target : edge.source;
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            const neighborNode = nodes.find(n => n.id === neighborId);
            if (neighborNode && neighborNode.type === 'file') {
              nextLevel.push(neighborNode);
            }
          }
        }
      }
      if (nextLevel.length > 0) {
        cascadeLevels.push({ depth, nodes: nextLevel });
        currentLevel = nextLevel.map(n => n.id);
      } else {
        break;
      }
    }

    const totalAffected = visited.size - 1;
    const totalFiles = nodes.filter(n => n.type === 'file').length || 1;
    const impactPercentage = Math.min(100, Math.round((totalAffected / totalFiles) * 100));

    let riskLevel = 'LOW';
    let riskColor = 'emerald';
    if (totalAffected >= 6 || impactPercentage >= 30) {
      riskLevel = 'CRITICAL';
      riskColor = 'rose';
    } else if (totalAffected >= 2 || impactPercentage >= 15) {
      riskLevel = 'MEDIUM';
      riskColor = 'amber';
    }

    return {
      directInbound,
      directOutbound,
      cascadeLevels,
      totalAffected,
      impactPercentage,
      riskLevel,
      riskColor
    };
  }, [file, graphData]);

  if (!isOpen || !file || !analysis) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-white/10 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-orange-500/10 via-rose-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              analysis.riskLevel === 'CRITICAL'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : analysis.riskLevel === 'MEDIUM'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              <Workflow size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono tracking-wide">{file.label || file.id}</h3>
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider uppercase ${
                  analysis.riskLevel === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : analysis.riskLevel === 'MEDIUM'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {analysis.riskLevel} RISK BLAST RADIUS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-md">
                {file.path || file.data?.path || 'Source file'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSimulatedFailure(!simulatedFailure)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                simulatedFailure
                  ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.5)] animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 hover:text-white'
              }`}
            >
              <Bug size={14} className={simulatedFailure ? 'text-white' : 'text-rose-400'} />
              <span>{simulatedFailure ? 'Failure Active' : 'Simulate Breaking Change'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                if (onAskAI) onAskAI(`Perform a detailed blast radius and regression test assessment for ${file.label || file.id}. What downstream services break if this file fails?`);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90 transition-opacity shadow-md"
            >
              <Zap size={14} />
              <span>Ask AI Assessment</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 bg-slate-900/40 px-5 shrink-0 text-xs font-medium">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'workflow'
                ? 'border-orange-500 text-orange-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity size={14} /> Execution Workflow Pipeline
          </button>
          <button
            onClick={() => setActiveTab('blast')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'blast'
                ? 'border-rose-500 text-rose-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert size={14} /> Cascading Blast Radius ({analysis.totalAffected} Files)
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

          {/* Simulated Failure Warning Banner */}
          {simulatedFailure && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-200 text-xs">
              <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <p className="font-bold text-rose-300">SIMULATED CRITICAL EXCEPTION TRIGGERED ON: {file.label}</p>
                <p className="mt-1 text-slate-300 leading-relaxed">
                  If this file introduces a syntax error, unhandled promise rejection, or breaking API contract change, 
                  <strong className="text-rose-300"> {analysis.totalAffected} dependent files</strong> across {analysis.cascadeLevels.length} cascading tiers are predicted to fail or degrade.
                </p>
              </div>
            </div>
          )}

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">Direct Callers</span>
              <span className="text-2xl font-mono font-bold text-white mt-1 block">{analysis.directInbound.length}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Immediate inbound files</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">Dependencies</span>
              <span className="text-2xl font-mono font-bold text-white mt-1 block">{analysis.directOutbound.length}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Outgoing library calls</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">Blast Radius Scope</span>
              <span className={`text-2xl font-mono font-bold mt-1 block ${
                analysis.riskLevel === 'CRITICAL' ? 'text-rose-400' : analysis.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {analysis.impactPercentage}%
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">{analysis.totalAffected} files total affected</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">Propagation Depth</span>
              <span className="text-2xl font-mono font-bold text-orange-400 mt-1 block">
                {analysis.cascadeLevels.length} Hops
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Downstream ripple tiers</span>
            </div>
          </div>

          {/* Tab 1: Execution Workflow Pipeline */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Workflow size={15} className="text-orange-400" />
                  Execution Flow & Call Stack Chain
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">Click any node to navigate</span>
              </div>

              {/* 3-Column Pipeline: Upstream -> Current -> Downstream */}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 items-start">
                
                {/* Column 1: Upstream Trigger Files */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 pb-2 border-b border-white/5">
                    <ArrowDownLeftIcon size={14} className="text-blue-400" />
                    <span>Upstream Callers ({analysis.directInbound.length})</span>
                  </div>
                  {analysis.directInbound.length === 0 ? (
                    <div className="p-3 text-[11px] text-slate-500 font-mono italic bg-white/5 rounded-xl">
                      Root / Entry point (no inbound callers)
                    </div>
                  ) : (
                    analysis.directInbound.map(n => (
                      <button
                        key={n.id}
                        onClick={() => {
                          onSelectFile(n.id);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs font-mono flex items-center justify-between group ${
                          simulatedFailure
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-300 hover:border-rose-500/40'
                            : 'bg-white/5 border-white/5 hover:border-orange-500/30 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{n.label || n.id}</span>
                        <ChevronRight size={13} className="text-slate-600 group-hover:text-orange-400 transition-colors shrink-0" />
                      </button>
                    ))
                  )}
                </div>

                {/* Column 2: Focused Target File (Center) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-orange-400 pb-2 border-b border-orange-500/20">
                    <Activity size={14} />
                    <span>Target Component</span>
                  </div>
                  <div className={`p-4 rounded-xl border shadow-lg text-center ${
                    simulatedFailure
                      ? 'bg-rose-500/20 border-rose-500/40 text-white shadow-[0_0_25px_rgba(244,63,94,0.4)]'
                      : 'bg-gradient-to-br from-orange-500/20 to-amber-500/10 border-orange-500/40 text-white'
                  }`}>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto mb-2">
                      <Cpu size={20} />
                    </div>
                    <div className="font-mono font-bold text-sm truncate">{file.label || file.id}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">Status: Active Execution</div>
                  </div>
                </div>

                {/* Column 3: Downstream Dependencies */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 pb-2 border-b border-white/5">
                    <ArrowUpRightIcon size={14} className="text-emerald-400" />
                    <span>Callee / Dependencies ({analysis.directOutbound.length})</span>
                  </div>
                  {analysis.directOutbound.length === 0 ? (
                    <div className="p-3 text-[11px] text-slate-500 font-mono italic bg-white/5 rounded-xl">
                      Leaf node (no outgoing calls)
                    </div>
                  ) : (
                    analysis.directOutbound.map(n => (
                      <button
                        key={n.id}
                        onClick={() => {
                          onSelectFile(n.id);
                        }}
                        className="w-full text-left p-2.5 rounded-xl border border-white/5 bg-white/5 hover:border-emerald-500/30 text-slate-300 hover:text-white transition-all text-xs font-mono flex items-center justify-between group"
                      >
                        <span className="truncate">{n.label || n.id}</span>
                        <ChevronRight size={13} className="text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                      </button>
                    ))
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Tab 2: Cascading Blast Radius Tiers */}
          {activeTab === 'blast' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert size={15} className="text-rose-400" />
                  Multi-Tier Cascading Blast Propagation
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  {analysis.totalAffected} total files impacted
                </span>
              </div>

              {analysis.cascadeLevels.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 font-mono bg-white/5 rounded-2xl">
                  No downstream cascading files detected. This file operates as a standalone module.
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.cascadeLevels.map((level, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="flex items-center gap-2 font-bold text-slate-200">
                          <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-rose-500' : idx === 1 ? 'bg-amber-500' : 'bg-blue-500'}`} />
                          Tier {level.depth} Impact ({idx === 0 ? 'Immediate Dependents' : `Transitive Ripple Hop ${level.depth}`})
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">{level.nodes.length} files</span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {level.nodes.map(n => (
                          <button
                            key={n.id}
                            onClick={() => onSelectFile(n.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 hover:border-orange-500/30 text-xs font-mono text-slate-300 hover:text-white transition-all"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>{n.label || n.id}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/70 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>CodeAtlas Automated Graph & Call-Tree Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}

function ArrowDownLeftIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 16} height={props.size || 16} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <line x1="17" y1="7" x2="7" y2="17" />
      <polyline points="17 17 7 17 7 7" />
    </svg>
  );
}

function ArrowUpRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 16} height={props.size || 16} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}
