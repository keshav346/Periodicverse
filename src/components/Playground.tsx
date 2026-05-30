import React, { useState } from 'react';
import { ElementData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Beaker, Thermometer, Gauge, Plus, X, Play, RefreshCw, Zap, Sparkles, Box } from 'lucide-react';
import ReactionVisualizer from './ReactionVisualizer';
import AIChat from './AIChat';
import { MoleculeViewer } from './MoleculeViewer';

interface PlaygroundProps {
  elements: ElementData[];
}

interface ReactionResult {
  reactionOccurred: boolean;
  productName: string;
  chemicalEquation: string;
  explanation: string;
  bondsFormed: string[];
  reactionType?: 'exothermic' | 'endothermic';
}

export default function Playground({ elements }: PlaygroundProps) {
  const [selectedReactants, setSelectedReactants] = useState<{element: ElementData, quantity: number}[]>([]);
  const [search, setSearch] = useState("");
  const [temperature, setTemperature] = useState<number>(298); // Kelvin
  const [pressure, setPressure] = useState<number>(1); // atm
  const [catalyst, setCatalyst] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReactionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'simulation' | 'ai'>('simulation');
  const [show3D, setShow3D] = useState(false);
  const [triggerSimulate, setTriggerSimulate] = useState(false);

  const filteredElements = elements.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.symbol.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const addReactant = (el: ElementData) => {
    setSelectedReactants(prev => {
      const existing = prev.findIndex(item => item.element.name === el.name);
      if (existing >= 0) {
        const next = [...prev];
        next[existing].quantity += 1;
        return next;
      }
      return [...prev, { element: el, quantity: 1 }];
    });
    setSearch("");
  };

  const removeReactant = (index: number) => {
    setSelectedReactants(prev => prev.filter((_, i) => i !== index));
  };
  
  const updateQuantity = (index: number, delta: number) => {
    setSelectedReactants(prev => prev.map((item, i) => {
      if (i === index) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const simulateReaction = async () => {
    if (selectedReactants.length === 0) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    setShow3D(false);

    try {
      const res = await fetch('/api/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elements: selectedReactants.map(r => ({ name: r.element.name, quantity: r.quantity })),
          temperature,
          pressure,
          catalyst
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setResult(data);
    } catch (err: any) {
      setError(err.message || "FAILED TO SIMULATE REACTION.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const handleCommand = (e: any) => {
      const { command, value, quantity } = e.detail;
      if (command === 'set_temperature') setTemperature(Number(value));
      if (command === 'set_pressure') setPressure(Number(value));
      if (command === 'set_catalyst') setCatalyst(String(value));
      if (command === 'add_reactant') {
        const el = elements.find(x => x.symbol.toLowerCase() === String(value).toLowerCase());
        if (el) {
           setSelectedReactants(prev => {
              const existing = prev.findIndex(item => item.element.number === el.number);
              if (existing >= 0) {
                 const next = [...prev];
                 next[existing].quantity += Number(quantity || 1);
                 return next;
              }
              return [...prev, { element: el, quantity: Number(quantity || 1) }];
           });
        }
      }
      if (command === 'clear_reactants') setSelectedReactants([]);
      if (command === 'simulate') {
        setTriggerSimulate(true);
      }
    };
    window.addEventListener('ai-playground', handleCommand);
    return () => window.removeEventListener('ai-playground', handleCommand);
  }, [elements]);

  React.useEffect(() => {
    if (triggerSimulate) {
      setTriggerSimulate(false);
      simulateReaction();
    }
  }, [triggerSimulate, selectedReactants, temperature, pressure, catalyst]);

  return (
    <div className="w-full h-full p-4 sm:p-6 pb-20 overflow-y-auto bg-[#050505] font-mono uppercase tracking-widest text-slate-300">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/20 p-6 relative">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-6 border-b border-white/20 pb-2">
              <Beaker size={16} className="text-blue-500" />
              REACTANTS SELECTION
            </h2>
            
            <div className="space-y-2 mb-6">
              <AnimatePresence>
                {selectedReactants.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={`${item.element.number}-${i}`} 
                    className="flex justify-between items-center bg-[#050505] border border-white/10 p-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/5 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/30">
                        {item.element.symbol}
                      </div>
                      <span className="font-bold text-white text-[10px]">{item.element.name}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-[#0a0a0a] border border-white/10 p-1">
                      <button onClick={() => updateQuantity(i, -1)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">-</button>
                      <span className="text-[10px] font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(i, 1)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">+</button>
                    </div>
                    <button onClick={() => removeReactant(i)} className="p-1 px-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors ml-2 border-l border-white/10">
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {selectedReactants.length === 0 && (
                <div className="text-[10px] text-slate-600 text-center py-4 border border-dashed border-white/10">
                  AWAITING ELEMENT INPUT
                </div>
              )}
            </div>

            <div className="relative">
              <input 
                type="text" 
                placeholder="INPUT ELEMENT CODE..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#050505] border border-white/20 pl-3 pr-4 py-2 text-[10px] focus:outline-none focus:border-white transition-colors placeholder-slate-600"
              />
              {search && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0a0a] border border-white/20 shadow-xl overflow-hidden z-20">
                  {filteredElements.map(el => (
                    <button 
                      key={el.number}
                      onClick={() => addReactant(el)}
                      className="w-full text-left px-3 py-2 hover:bg-white/10 text-[10px] transition-colors flex justify-between items-center"
                    >
                      <span>{el.name} <span className="opacity-50 ml-1">({el.symbol})</span></span>
                      <Plus size={12} className="text-white" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/20 p-6 relative">
            <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-white/20 pb-2">
              <Gauge size={16} className="text-purple-500" />
              ENVIRONMENT CONTROLS
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="flex justify-between text-[10px] text-slate-400 mb-2">
                  <span className="flex items-center gap-1"><Thermometer size={10} /> CORE TEMP</span>
                  <span className="text-white">{temperature} K</span>
                </label>
                <input 
                  type="range" 
                  min="0" max="5000" step="1"
                  value={temperature}
                  onChange={e => setTemperature(parseInt(e.target.value))}
                  className="w-full accent-white"
                />
              </div>
              
              <div>
                <label className="flex justify-between text-[10px] text-slate-400 mb-2">
                  <span className="flex items-center gap-1"><Gauge size={10} /> PRESSURE</span>
                  <span className="text-white">{pressure} ATM</span>
                </label>
                <input 
                  type="range" 
                  min="0.1" max="1000" step="0.1"
                  value={pressure}
                  onChange={e => setPressure(parseFloat(e.target.value))}
                  className="w-full accent-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-2 flex items-center gap-1">
                  <Zap size={10} /> CATALYST INJECT
                </label>
                <input 
                  type="text" 
                  placeholder="NONE" 
                  value={catalyst}
                  onChange={e => setCatalyst(e.target.value)}
                  className="w-full bg-[#050505] border border-white/20 px-3 py-2 text-[10px] focus:outline-none focus:border-white transition-colors text-white placeholder-slate-600"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={simulateReaction}
            disabled={selectedReactants.length === 0 || loading}
            className="w-full bg-white text-black hover:bg-slate-200 disabled:opacity-50 disabled:bg-[#333] disabled:text-slate-500 font-bold py-3 text-[12px] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} fill="currentColor" />}
            {loading ? 'EXECUTING SIMULATION...' : 'INITIATE SIMULATION'}
          </button>
        </div>

        {/* Right Column: Output Panel & AI */}
        <div className="lg:col-span-2">
          <div className="bg-[#0a0a0a] border border-white/20 h-full min-h-[400px] flex flex-col relative overflow-hidden">
            <div className="flex border-b border-white/20 bg-[#050505]">
              <button 
                onClick={() => setRightPanelTab('simulation')}
                className={`flex-1 py-3 px-4 text-[10px] font-bold tracking-widest transition-colors ${rightPanelTab === 'simulation' ? 'bg-[#0a0a0a] text-white border-t border-t-white/50' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300 border-t border-t-transparent'}`}
              >
                SIMULATION TELEMETRY
              </button>
              <button 
                onClick={() => setRightPanelTab('ai')}
                className={`flex-1 py-3 px-4 text-[10px] font-bold tracking-widest transition-colors flex items-center justify-center gap-2 ${rightPanelTab === 'ai' ? 'bg-[#0a0a0a] text-white border-t border-t-[#33ccff]/50' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300 border-t border-t-transparent'}`}
              >
                <Sparkles size={12} className={rightPanelTab === 'ai' ? 'text-[#33ccff]' : 'text-slate-500'} />
                AI LAB ASSISTANT
              </button>
            </div>

            {rightPanelTab === 'simulation' ? (
              <div className="flex-1 flex flex-col p-8 overflow-y-auto">
                <div className="flex-1 flex flex-col z-10">
                  {/* Top 3D Visualizer always present if reactants exist */}
                  {selectedReactants.length > 0 && (
                    <div className="h-[300px] mb-8 relative border border-white/20 bg-[#050505] shrink-0">
                       <ReactionVisualizer 
                         reactants={selectedReactants.flatMap(r => Array(r.quantity).fill(r.element))} 
                         reactionOccurred={result?.reactionOccurred ?? false} 
                         bondsFormed={result?.bondsFormed}
                         temperature={temperature}
                       />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col items-center justify-center">
                    {!result && !loading && !error && (
                      <div className="text-slate-600 flex flex-col items-center gap-4 py-10">
                        <div className="w-16 h-16 border border-slate-700 flex items-center justify-center">
                          <Beaker size={24} className="text-slate-600" />
                        </div>
                        <p className="text-[10px]">AWAITING SIMULATION COMMAND</p>
                      </div>
                    )}
                    
                    {loading && (
                      <div className="flex flex-col items-center gap-4 text-white py-12">
                        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <p className="animate-pulse text-[10px]">COMPUTING THERMODYNAMICS...</p>
                      </div>
                    )}

                    {error && (
                      <div className="text-[#ff4d4d] border border-[#ff4d4d]/30 p-4 text-center w-full my-auto text-[10px]">
                        <p className="font-bold mb-1">SYSTEM ERROR</p>
                        <p>{error}</p>
                      </div>
                    )}

                    {result && !loading && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full space-y-6"
                      >
                      <div className={`p-4 border flex flex-col sm:flex-row items-center gap-6 sm:justify-between text-center sm:text-left ${result.reactionOccurred ? 'bg-[#00ff9d]/5 border-[#00ff9d]/30' : 'bg-slate-500/5 border-slate-500/30'}`}>
                        <div>
                          <h3 className="text-[10px] font-bold opacity-70 flex items-center gap-2 mb-2">
                            {result.reactionOccurred ? 'REACTION: POSITIVE' : 'REACTION: NEGATIVE'}
                            {result.reactionType && (
                              <span className={`px-2 py-0.5 text-[8px] border ${
                                result.reactionType === 'exothermic' ? 'border-[#ff4d4d]/50 text-[#ff4d4d]' : 'border-[#33ccff]/50 text-[#33ccff]'
                              }`}>
                                {result.reactionType}
                              </span>
                            )}
                          </h3>
                          <p className="text-xl font-bold text-white">
                            {result.productName}
                          </p>
                        </div>
                        {result.reactionOccurred && (
                          <div className="bg-[#050505] px-4 py-2 border border-white/20 text-[#00ff9d] font-bold text-sm">
                            {result.chemicalEquation}
                          </div>
                        )}
                      </div>

                      <div className="border border-white/10 p-4 bg-[#050505]">
                        <h3 className="text-[10px] font-bold text-slate-500 mb-2 border-b border-white/10 pb-1">ANALYSIS REPORT</h3>
                        <p className="text-slate-300 leading-relaxed text-[11px] normal-case">
                          {result.explanation}
                        </p>
                      </div>

                      {result.bondsFormed && result.bondsFormed.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[10px] font-bold text-slate-500">BOND TELEMETRY</h3>
                            {result.reactionOccurred && !show3D && (
                              <button 
                                onClick={() => setShow3D(true)}
                                className="flex items-center gap-2 text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1 border border-white/20 transition-colors"
                              >
                                <Box size={12} />
                                VIEW 3D MOLECULE
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                            {result.bondsFormed.map((bond, idx) => (
                              <div key={idx} className="bg-[#050505] border border-white/20 p-2 flex items-center gap-3">
                                <div className="text-white border border-white/20 p-1">
                                  <Zap size={10} />
                                </div>
                                <span className="text-[10px] text-slate-300">{bond}</span>
                              </div>
                            ))}
                          </div>

                          {show3D && (
                            <div className="mt-6 border border-white/20 relative">
                               <button 
                                 onClick={() => setShow3D(false)}
                                 className="absolute top-2 right-2 bg-black/80 hover:bg-black p-1 text-white z-10"
                               >
                                 <X size={14} />
                               </button>
                               <MoleculeViewer productName={result.productName} chemicalEquation={result.chemicalEquation} />
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden relative">
                <AIChat contextName="Laboratory Settings" title="INTELLIGENT LAB ASSISTANT" hidePresets={true} elements={elements} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
