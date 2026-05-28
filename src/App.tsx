import React, { useEffect, useState } from 'react';
import { ElementData } from './types';
import PeriodicTable from './components/PeriodicTable';
import ElementList from './components/ElementList';
import ElementModal from './components/ElementModal';
import Playground from './components/Playground';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Layers, Search, List, Maximize, Minimize, Beaker } from 'lucide-react';

export default function App() {
  const [elements, setElements] = useState<ElementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'modern' | 'advanced' | 'table' | 'playground'>('modern');
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        // optionally lock orientation on mobile
        if(screen.orientation && (screen.orientation as any).lock) {
            try {
                await (screen.orientation as any).lock('landscape');
            } catch (e) {
                // Ignore, may securely fail or be unsupported
            }
        }
      } else {
        await document.exitFullscreen();
        if(screen.orientation && screen.orientation.unlock) {
            try {
                screen.orientation.unlock();
            } catch (e) { }
        }
      }
    } catch (err) {
      console.warn("Fullscreen API failed", err);
    }
  };

  const handleNextElement = () => {
    if (!selectedElement) return;
    const sorted = [...elements].sort((a, b) => a.number - b.number);
    const currentIndex = sorted.findIndex(e => e.number === selectedElement.number);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= sorted.length) nextIndex = 0;
    setSelectedElement(sorted[nextIndex]);
  };

  const handlePrevElement = () => {
    if (!selectedElement) return;
    const sorted = [...elements].sort((a, b) => a.number - b.number);
    const currentIndex = sorted.findIndex(e => e.number === selectedElement.number);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = sorted.length - 1;
    setSelectedElement(sorted[prevIndex]);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/elements');
        if (!res.ok) throw new Error('Data not ready yet. Please refresh in a moment.');
        const data = await res.json();
        setElements(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    // retry if it fails initially since backend might take a second to download
    const fetchInterval = setInterval(() => {
      if(elements.length === 0 && !error) fetchData();
      else clearInterval(fetchInterval);
    }, 2000);
    fetchData();
    
    return () => clearInterval(fetchInterval);
  }, []);

  return (
    <>
      <div className="cosmic-bg"></div>
      
      {/* Background Star Particles */}
      {[...Array(50)].map((_, i) => (
        <div key={i} className="star z-[-1]" style={{
          top: `${Math.random() * 100}vh`,
          left: `${Math.random() * 100}vw`,
          width: `${Math.random() * 3}px`,
          height: `${Math.random() * 3}px`,
          animationDelay: `${Math.random() * 5}s`
        }}></div>
      ))}
      
      <div className="relative min-h-screen flex flex-col pt-4 sm:pt-8 sm:p-8">
        <header className="mb-4 sm:mb-8 px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              PeriodicVerse
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 flex items-center justify-center md:justify-start gap-2 tracking-wide font-light">
              <Sparkles size={14} className="text-indigo-400 hidden sm:block" />
              Next-Gen Chemistry Platform
            </p>
          </div>
          
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-white/10 backdrop-blur-md w-full md:w-auto overflow-x-auto custom-scrollbar">
            <button 
              onClick={() => setViewMode('modern')}
              className={`flex-1 md:flex-none whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${viewMode === 'modern' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            >
              Modern View
            </button>
            <button 
              onClick={() => setViewMode('advanced')}
              className={`flex-1 md:flex-none whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex justify-center items-center gap-1 sm:gap-2 ${viewMode === 'advanced' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            >
              <Layers size={14} className="sm:w-4 sm:h-4" />
              Advanced
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`flex-1 md:flex-none whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex justify-center items-center gap-1 sm:gap-2 ${viewMode === 'table' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            >
              <List size={14} className="sm:w-4 sm:h-4" />
              Table
            </button>
            <button 
              onClick={() => setViewMode('playground')}
              className={`flex-1 md:flex-none whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex justify-center items-center gap-1 sm:gap-2 ${viewMode === 'playground' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            >
              <Beaker size={14} className="sm:w-4 sm:h-4" />
              Lab
            </button>
            <div className="w-px bg-white/20 mx-1 my-2 hidden md:block"></div>
            <button 
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="flex-none px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all flex justify-center items-center"
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        </header>

        {viewMode !== 'playground' && (
          <div className="flex flex-col md:flex-row gap-4 mb-4 px-4 w-full max-w-[1600px] mx-auto z-10">
            <div className="relative flex-1 group">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search elements by name, symbol, or number..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all backdrop-blur-md focus:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              />
            </div>
            <div className="relative group">
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full md:w-auto bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all backdrop-blur-md appearance-none cursor-pointer focus:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              >
                <option value="all">All Categories</option>
                <option value="nonmetal">Nonmetals</option>
                <option value="noble gas">Noble Gases</option>
                <option value="alkali metal">Alkali Metals</option>
                <option value="alkaline earth metal">Alkaline Earth Metals</option>
                <option value="metalloid">Metalloids</option>
                <option value="transition metal">Transition Metals</option>
                <option value="post-transition metal">Post-Transition Metals</option>
                <option value="lanthanide">Lanthanides</option>
                <option value="actinide">Actinides</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 w-full max-w-[1600px] mx-auto bg-slate-900/40 sm:bg-slate-900/20 sm:rounded-3xl border-y sm:border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-[600px] text-slate-400 flex-col gap-4">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              Intializing Quantum Data...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[600px] text-red-400">
              {error} - Try refreshing.
            </div>
          ) : viewMode === 'playground' ? (
            <Playground elements={elements} />
          ) : viewMode === 'table' ? (
            <ElementList 
              elements={elements} 
              onElementClick={setSelectedElement}
              searchQuery={searchQuery}
              activeCategory={activeCategory}
            />
          ) : (
            <PeriodicTable 
              elements={elements} 
              isAdvanced={viewMode === 'advanced'} 
              onElementClick={setSelectedElement}
              searchQuery={searchQuery}
              activeCategory={activeCategory}
            />
          )}
        </main>
        
        <footer className="mt-8 mb-6 text-center flex flex-col gap-2">
          <div className="text-xs text-slate-600 px-4">
            Data powered by open source | Simulated with Three.js | AI integration via Gemini
          </div>
          <div className="text-sm font-medium text-slate-400">
            Made with Brain 🧠 by <a href="https://keshavvortex.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors underline decoration-indigo-400/30 underline-offset-4">Keshav</a>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {selectedElement && (
          <ElementModal 
            element={selectedElement} 
            onClose={() => setSelectedElement(null)} 
            onNext={handleNextElement}
            onPrev={handlePrevElement}
          />
        )}
      </AnimatePresence>
    </>
  );
}
