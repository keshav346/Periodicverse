import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { ElementData } from '../types';
import Atom3D from './Atom3D';
import AIChat from './AIChat';

export default function ElementModal({ element, onClose, onNext, onPrev }: { element: ElementData, onClose: () => void, onNext: () => void, onPrev: () => void }) {
  const [modelType, setModelType] = useState<'bohr' | 'cloud' | 'orbital'>('bohr');

  // Try to parse color from standard categories or fallback
  const getHexForCategory = (cat: string) => {
    if (cat.includes('alkali metal')) return "#fca5a5";
    if (cat.includes('alkaline earth metal')) return "#fdba74";
    if (cat.includes('transition metal')) return "#fde047";
    if (cat.includes('post-transition metal')) return "#bef264";
    if (cat.includes('metalloid')) return "#6ee7b7";
    if (cat.includes('nonmetal')) return "#67e8f9";
    if (cat.includes('noble gas')) return "#c4b5fd";
    if (cat.includes('lanthanide')) return "#f9a8d4";
    if (cat.includes('actinide')) return "#f0abfc";
    return "#cbd5e1"; // fallback
  };

  const themeColor = getHexForCategory(element.category);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ y: 50, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 50, scale: 0.95 }}
        className="w-full max-w-6xl h-[95vh] sm:max-h-[90vh] bg-slate-900/90 border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative glass-panel"
      >
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 p-2 sm:p-3 bg-red-500/80 hover:bg-red-500 rounded-full text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-colors border border-red-400/50"
        >
          <X size={20} className="sm:w-6 sm:h-6" />
        </button>

        {/* Left Side: 3D Visualization */}
        <div className="w-full h-[40vh] md:h-auto md:w-5/12 bg-black/40 relative border-b md:border-b-0 md:border-r border-white/10 flex flex-col shrink-0">
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 pointer-events-none">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter" style={{color: themeColor}}>{element.symbol}</h1>
            <h2 className="text-2xl sm:text-3xl font-light text-slate-200">{element.name}</h2>
            <div className="mt-2 sm:mt-3 flex flex-wrap gap-2 pointer-events-auto">
              <span className="px-2 py-1 bg-white/10 rounded backdrop-blur text-[10px] sm:text-xs text-white/90 uppercase tracking-widest border border-white/10">
                Z = {element.number}
              </span>
              <span className="px-2 py-1 bg-white/10 rounded backdrop-blur text-[10px] sm:text-xs text-white/90 uppercase tracking-widest border border-white/10">
                {Math.round(element.atomic_mass * 1000) / 1000} u
              </span>
            </div>
            <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-white/60 capitalize font-medium flex flex-col gap-1">
              <span>{element.category}</span>
              <span>{element.phase} at RT</span>
            </div>
          </div>
          
          <div className="flex-1 h-full w-full relative z-10 min-h-[200px]">
            <button onClick={onPrev} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 bg-black/20 hover:bg-black/50 rounded-full backdrop-blur-sm transition-all border border-white/10 text-white/50 hover:text-white group">
               <ChevronLeft size={24} className="group-hover:scale-110 transition-transform" />
            </button>
            <button onClick={onNext} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 bg-black/20 hover:bg-black/50 rounded-full backdrop-blur-sm transition-all border border-white/10 text-white/50 hover:text-white group">
               <ChevronRight size={24} className="group-hover:scale-110 transition-transform" />
            </button>
            <Atom3D shells={element.shells} color={themeColor} modelType={modelType} />
            <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex justify-between items-end">
              <div className="flex gap-2 pointer-events-auto">
                <button onClick={() => setModelType('bohr')} className={`px-2 py-1 text-[10px] sm:text-xs rounded border transition-colors ${modelType === 'bohr' ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-black/50 border-white/10 text-white/60 hover:bg-black/70'}`}>Bohr</button>
                <button onClick={() => setModelType('cloud')} className={`px-2 py-1 text-[10px] sm:text-xs rounded border transition-colors ${modelType === 'cloud' ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-black/50 border-white/10 text-white/60 hover:bg-black/70'}`}>Cloud</button>
                <button onClick={() => setModelType('orbital')} className={`px-2 py-1 text-[10px] sm:text-xs rounded border transition-colors ${modelType === 'orbital' ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-black/50 border-white/10 text-white/60 hover:bg-black/70'}`}>Orbital</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Information & AI */}
        <div className="w-full h-[55vh] md:h-auto md:w-7/12 flex flex-col overflow-hidden">
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar space-y-6">
            <section>
              <h3 className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-3 flex items-center justify-between">
                <span>Overview</span>
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] lowercase">Group {element.group} • Period {element.period}</span>
              </h3>
              <p className="text-slate-300 leading-relaxed text-sm">
                {element.summary}
              </p>
            </section>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-5 rounded-xl shadow-lg">
                <h3 className="text-xs font-semibold text-slate-400 uppercase mb-4 tracking-wider">Classification & Electronic</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col border-b border-white/5 pb-2">
                    <span className="text-slate-500 text-xs mb-1">Electron Config</span>
                    <span className="text-slate-200 font-mono text-xs break-all text-blue-300">{element.electron_configuration_semantic || element.electron_configuration}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-500">Shells</span>
                    <span className="text-slate-200 font-mono">{element.shells.join(', ')}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-500">Valence Electrons</span>
                    <span className="text-slate-200 font-mono text-purple-300">{element.shells[element.shells.length - 1]} e⁻</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-500">Occurrence</span>
                    <span className="text-slate-200 font-mono">{element.number > 94 ? 'Synthetic' : 'Primordial'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-5 rounded-xl shadow-lg">
                <h3 className="text-xs font-semibold text-slate-400 uppercase mb-4 tracking-wider">Physical & Atomic</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-500">Density</span>
                    <span className="text-slate-200 font-mono">{element.density ? `${element.density} g/cm³` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-500">Melting Point</span>
                    <span className="text-slate-200 font-mono text-orange-300">{element.melt ? `${element.melt} K` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-500">Boiling Point</span>
                    <span className="text-slate-200 font-mono text-red-400">{element.boil ? `${element.boil} K` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-500">Electronegativity</span>
                    <span className="text-slate-200 font-mono">{element.electronegativity_pauling || 'N/A'} (Pauling)</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-500">Electron Affinity</span>
                    <span className="text-slate-200 font-mono">{element.electron_affinity ? `${element.electron_affinity} kJ/mol` : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <section>
              <h3 className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-3">Discovery & Details</h3>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <span className="block text-slate-500 text-xs mb-1">Discovered By</span>
                    <span className="text-slate-200 font-medium text-emerald-300">{element.discovered_by || 'Prehistoric / Unknown'}</span>
                 </div>
                 <div>
                    <span className="block text-slate-500 text-xs mb-1">Named By</span>
                    <span className="text-slate-200 font-medium text-cyan-300">{element.named_by || 'N/A'}</span>
                 </div>
                 <div>
                    <span className="block text-slate-500 text-xs mb-1">Appearance</span>
                    <span className="text-slate-200 font-medium capitalize">{element.appearance || 'Unknown'}</span>
                 </div>
                 <div>
                    <span className="block text-slate-500 text-xs mb-1">Molar Heat</span>
                    <span className="text-slate-200 font-medium">{element.molar_heat ? `${element.molar_heat} J/(mol·K)` : 'N/A'}</span>
                 </div>
                 <div className="sm:col-span-2 pt-2 border-t border-white/5 mt-1">
                    <span className="block text-slate-500 text-xs mb-1">Learn More</span>
                    <a href={element.source} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors underline decoration-indigo-400/30 underline-offset-4 overflow-hidden text-ellipsis block whitespace-nowrap">{element.source}</a>
                 </div>
              </div>
            </section>
          </div>

          <div className="h-48 sm:h-64 md:h-72 p-3 sm:p-4 md:p-6 md:pt-0 shrink-0 border-t border-white/5 bg-slate-900/50">
             <AIChat key={element.number} contextName={element.name} />
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}
