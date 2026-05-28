import React, { useState } from 'react';
import { ElementData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Beaker, Thermometer, Gauge, Plus, X, Play, RefreshCw, Zap } from 'lucide-react';
import ReactionVisualizer from './ReactionVisualizer';

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
      setError(err.message || "Failed to simulate reaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-4 sm:p-6 pb-20 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f18] to-black">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
             {/* Gradient glow over left panel */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center gap-3 mb-6">
              <Beaker size={24} className="text-blue-400" />
              Reactants
            </h2>
            
            <div className="space-y-3 mb-5">
              <AnimatePresence>
                {selectedReactants.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={`${item.element.number}-${i}`} 
                    className="flex justify-between items-center bg-black/40 border border-white/5 rounded-xl p-2 pl-3 shadow-inner"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/30">
                        {item.element.symbol}
                      </div>
                      <span className="font-medium text-slate-200">{item.element.name}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/50 rounded-lg p-1">
                      <button onClick={() => updateQuantity(i, -1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors">-</button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(i, 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors">+</button>
                    </div>
                    <button onClick={() => removeReactant(i)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors ml-2 border-l border-white/10 pl-2">
                      <X size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {selectedReactants.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-4 border border-dashed border-white/10 rounded-xl">
                  Add elements to begin
                </div>
              )}
            </div>

            <div className="relative">
              <input 
                type="text" 
                placeholder="Search element to add..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg pl-3 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-500"
              />
              {search && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden z-20">
                  {filteredElements.map(el => (
                    <button 
                      key={el.number}
                      onClick={() => addReactant(el)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-600/20 text-sm transition-colors flex justify-between items-center"
                    >
                      <span>{el.name} <span className="opacity-50 ml-1">({el.symbol})</span></span>
                      <Plus size={14} className="text-blue-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-6 backdrop-blur-2xl shadow-xl relative overflow-hidden">
            <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
              <Gauge size={20} className="text-purple-400" />
              Environment
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="flex justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1"><Thermometer size={12} /> Temperature</span>
                  <span>{temperature} K</span>
                </label>
                <input 
                  type="range" 
                  min="0" max="5000" step="1"
                  value={temperature}
                  onChange={e => setTemperature(parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
              
              <div>
                <label className="flex justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1"><Gauge size={12} /> Pressure</span>
                  <span>{pressure} atm</span>
                </label>
                <input 
                  type="range" 
                  min="0.1" max="1000" step="0.1"
                  value={pressure}
                  onChange={e => setPressure(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <Zap size={12} /> Catalyst (Optional)
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Platinum, Iron..." 
                  value={catalyst}
                  onChange={e => setCatalyst(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={simulateReaction}
            disabled={selectedReactants.length === 0 || loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
            {loading ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>

        {/* Right Column: Output Panel */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-8 backdrop-blur-2xl shadow-2xl h-full min-h-[400px] flex flex-col relative overflow-hidden">
            <div className="absolute -bottom-64 -left-64 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-slate-400 mb-6 border-b border-white/5 pb-4">
              Simulation Results
            </h2>
            
            <div className="flex-1 flex flex-col z-10">
              {/* Top 3D Visualizer always present if reactants exist */}
              {selectedReactants.length > 0 && (
                <div className="h-72 mb-8 relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                   <ReactionVisualizer 
                     reactants={selectedReactants.flatMap(r => Array(r.quantity).fill(r.element))} 
                     reactionOccurred={result?.reactionOccurred ?? false} 
                     bondsFormed={result?.bondsFormed}
                   />
                </div>
              )}

              <div className="flex-1 flex flex-col items-center justify-center">
                {!result && !loading && !error && (
                  <div className="text-slate-500 flex flex-col items-center gap-4 opacity-60 my-auto pb-10">
                    <div className="w-20 h-20 rounded-full border border-slate-700/50 flex items-center justify-center">
                      <Beaker size={40} className="text-slate-600" strokeWidth={1.5} />
                    </div>
                    <p className="text-lg font-medium">{selectedReactants.length === 0 ? "Add reactants and parameters to begin" : "Click 'Run Simulation' to test combination"}</p>
                  </div>
                )}
                
                {loading && (
                  <div className="flex flex-col items-center gap-4 text-blue-400 my-auto py-12">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="animate-pulse">Computing thermodynamics and simulating reaction...</p>
                  </div>
                )}

                {error && (
                  <div className="text-red-400 bg-red-400/10 border border-red-400/20 p-4 rounded-xl text-center w-full my-auto">
                    <p className="font-bold mb-1">Simulation Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {result && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full space-y-6"
                  >
                  <div className={`p-6 rounded-2xl border backdrop-blur-md flex flex-col sm:flex-row items-center gap-6 sm:justify-between text-center sm:text-left ${result.reactionOccurred ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-500/5 border-slate-500/20'}`}>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest mb-2 opacity-70">
                        {result.reactionOccurred ? 'Reaction Achieved' : 'No Reaction'}
                        {result.reactionType && (
                          <span className={`ml-3 px-2 py-1 rounded text-[10px] ${
                            result.reactionType === 'exothermic' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}>
                            {result.reactionType.toUpperCase()}
                          </span>
                        )}
                      </h3>
                      <p className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                        {result.productName}
                      </p>
                    </div>
                    {result.reactionOccurred && (
                      <div className="bg-black/50 px-5 py-3 rounded-xl border border-white/10 font-mono text-emerald-400 font-bold text-lg md:text-xl shadow-inner">
                        {result.chemicalEquation}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-blue-400 mb-3 uppercase tracking-wider">Analysis</h3>
                    <p className="text-slate-300 leading-relaxed text-[15px]">
                      {result.explanation}
                    </p>
                  </div>

                  {result.bondsFormed && result.bondsFormed.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-purple-300 mb-3">Molecular Bonds Formed</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {result.bondsFormed.map((bond, idx) => (
                          <div key={idx} className="bg-black/30 border border-white/5 rounded-lg p-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                              <Zap size={14} />
                            </div>
                            <span className="text-sm text-slate-300">{bond}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
