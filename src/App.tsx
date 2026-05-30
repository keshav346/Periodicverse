import React, { useEffect, useState } from "react";
import { ElementData } from "./types";
import PeriodicTable from "./components/PeriodicTable";
import ElementList from "./components/ElementList";
import ElementModal from "./components/ElementModal";
import Playground from "./components/Playground";
import { AnimatePresence } from "motion/react";
import {
  Search,
  Maximize,
  Minimize,
  Beaker,
  List,
  Database,
  Sparkles,
} from "lucide-react";
import AIChat from "./components/AIChat";

export default function App() {
  const [elements, setElements] = useState<ElementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<
    "table" | "list" | "playground" | "ai"
  >("table");
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Listen for AI automation actions
  useEffect(() => {
    const onNavigate = (e: any) => {
      if (['table', 'list', 'playground', 'ai'].includes(e.detail)) {
        setViewMode(e.detail);
      }
    };
    const onCategory = (e: any) => {
      const val = typeof e.detail === 'string' ? e.detail.trim().toLowerCase() : "";
      setActiveCategory(val || "all");
    };
    const onSearch = (e: any) => {
      const val = typeof e.detail === 'string' ? e.detail : "";
      setSearchQuery(val);
    };
    const onSelectEl = (e: any) => {
      if (e.detail === null) {
        setSelectedElement(null);
        return;
      }
      const el = elements.find(x => x.symbol.toLowerCase() === String(e.detail).toLowerCase() || x.number.toString() === String(e.detail));
      if (el) setSelectedElement(el);
    };
    
    window.addEventListener('ai-navigate', onNavigate);
    window.addEventListener('ai-category', onCategory);
    window.addEventListener('ai-search', onSearch);
    window.addEventListener('ai-select-element', onSelectEl);
    
    return () => {
      window.removeEventListener('ai-navigate', onNavigate);
      window.removeEventListener('ai-category', onCategory);
      window.removeEventListener('ai-search', onSearch);
      window.removeEventListener('ai-select-element', onSelectEl);
    };
  }, [elements]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        if (screen.orientation && (screen.orientation as any).lock) {
          try {
            await (screen.orientation as any).lock("landscape");
          } catch (e) {}
        }
      } else {
        await document.exitFullscreen();
        if (screen.orientation && screen.orientation.unlock) {
          try {
            screen.orientation.unlock();
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn("Fullscreen API failed", err);
    }
  };

  const handleNextElement = () => {
    if (!selectedElement) return;
    const sorted = [...elements].sort((a, b) => a.number - b.number);
    const currentIndex = sorted.findIndex(
      (e) => e.number === selectedElement.number,
    );
    let nextIndex = currentIndex + 1;
    if (nextIndex >= sorted.length) nextIndex = 0;
    setSelectedElement(sorted[nextIndex]);
  };

  const handlePrevElement = () => {
    if (!selectedElement) return;
    const sorted = [...elements].sort((a, b) => a.number - b.number);
    const currentIndex = sorted.findIndex(
      (e) => e.number === selectedElement.number,
    );
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = sorted.length - 1;
    setSelectedElement(sorted[prevIndex]);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/elements");
        if (!res.ok) throw new Error("DATA_UNAVAILABLE");
        const data = await res.json();
        setElements(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    const fetchInterval = setInterval(() => {
      if (elements.length === 0 && !error) fetchData();
      else clearInterval(fetchInterval);
    }, 2000);
    fetchData();

    return () => clearInterval(fetchInterval);
  }, []);

  return (
    <>
      <div className="fixed inset-0 min-h-screen bg-[#050505] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGgwdjQwaDB6TTQwIDBoMHY0MGgweiIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMCAwdjRwaDQwdi00eiIgZmlsbD0idXJsKCNncmFkMSkiIG9wYWNpdHk9Ii4wNCIvPgo8L3N2Zz4=')] opacity-50 pointer-events-none z-[-1]" />

      <div className="relative min-h-screen flex flex-col pt-4 sm:p-6 font-mono text-slate-300">
        <header className="mb-6 px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left border-b border-white/10 pb-6 uppercase tracking-widest">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-widest text-white flex items-center gap-3">
              <Database className="text-blue-500 w-6 h-6 lg:w-8 lg:h-8" />
              ORBITAL REGISTRY
            </h1>
            <p className="text-slate-500 text-[10px] sm:text-xs mt-2 tracking-[0.2em]">
              ELEMENT DATABASE // v2.0
            </p>
          </div>

          <div className="flex bg-[#0a0a0a] p-1 border border-white/10 w-full md:w-auto overflow-x-auto text-[11px] font-bold tracking-widest uppercase">
            <button
              onClick={() => setViewMode("table")}
              className={`flex-1 md:flex-none whitespace-nowrap px-4 py-2 transition-all ${viewMode === "table" ? "bg-white text-black" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              TABLE //
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 md:flex-none whitespace-nowrap px-4 py-2 transition-all ${viewMode === "list" ? "bg-white text-black" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              DATA LIST //
            </button>
            <button
              onClick={() => setViewMode("playground")}
              className={`flex-1 md:flex-none whitespace-nowrap px-4 py-2 transition-all ${viewMode === "playground" ? "bg-white text-black" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              LABORATORY //
            </button>
            <button
              onClick={() => setViewMode("ai")}
              className={`flex-1 md:flex-none whitespace-nowrap px-4 py-2 transition-all flex items-center gap-2 justify-center ${viewMode === "ai" ? "bg-white text-black" : "text-[#33ccff] hover:text-white hover:bg-white/5"}`}
            >
              <Sparkles size={12} />
              AI ASSISTANT //
            </button>
            <div className="w-px bg-white/20 mx-1 my-2 hidden md:block"></div>
            <button
              onClick={toggleFullscreen}
              className="flex-none px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 transition-all flex justify-center items-center"
            >
              {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            </button>
          </div>
        </header>

        {(viewMode === "table" || viewMode === "list") && (
          <div className="flex flex-col md:flex-row gap-4 mb-6 px-4 w-full max-w-[1600px] mx-auto z-10 font-mono">
            <div className="relative flex-1 group">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors"
              />
              <input
                type="text"
                placeholder="QUERY ELEMENTS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/20 pl-10 pr-4 py-2 text-[12px] text-white placeholder-slate-600 focus:outline-none focus:border-white transition-all uppercase tracking-widest"
              />
            </div>
            <div className="relative group">
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full md:w-auto bg-[#0a0a0a] border border-white/20 px-4 py-2 pr-10 text-[12px] text-slate-300 focus:outline-none focus:border-white transition-all appearance-none cursor-pointer uppercase tracking-widest"
              >
                <option value="all">ALL CLASSES</option>
                <option value="nonmetal">NONMETALS</option>
                <option value="noble gas">NOBLE GASES</option>
                <option value="alkali metal">ALKALI METALS</option>
                <option value="alkaline earth metal">ALKALINE EARTH</option>
                <option value="metalloid">METALLOIDS</option>
                <option value="transition metal">TRANSITION</option>
                <option value="post-transition metal">POST-TRANSITION</option>
                <option value="lanthanide">LANTHANIDES</option>
                <option value="actinide">ACTINIDES</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500 border-l border-white/20">
                <svg
                  className="w-3 h-3 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 w-full max-w-[1600px] mx-auto bg-[#0a0a0a] sm:border border-white/10 relative overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-[600px] text-slate-500 flex-col gap-4 text-xs font-bold tracking-[0.2em] uppercase">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              LOADING DATABASE...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[600px] text-red-500 font-bold uppercase tracking-widest text-xs">
              {error} // RETRY CONNECTION
            </div>
          ) : viewMode === "playground" ? (
            <Playground elements={elements} />
          ) : viewMode === "ai" ? (
            <div className="w-full h-[600px] flex flex-col">
              <AIChat
                contextName="Main Interface"
                title="GLOBAL AI INTERFACE"
                hidePresets={true}
                persistKey="main_chat"
                elements={elements}
              />
            </div>
          ) : viewMode === "list" ? (
            <ElementList
              elements={elements}
              onElementClick={setSelectedElement}
              searchQuery={searchQuery}
              activeCategory={activeCategory}
            />
          ) : (
            <PeriodicTable
              elements={elements}
              onElementClick={setSelectedElement}
              searchQuery={searchQuery}
              activeCategory={activeCategory}
            />
          )}
        </main>

        <footer className="w-full text-center py-6 mt-4 text-[10px] sm:text-xs text-slate-500 font-mono tracking-widest uppercase">
          MADE WITH BRAIN 🧠 BY{" "}
          <a
            href="https://KeshavVortex.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-blue-400 transition-colors underline decoration-white/30 underline-offset-4 pointer-events-auto relative z-20"
          >
            KESHAV
          </a>
        </footer>
      </div>

      <AnimatePresence>
        {selectedElement && (
          <ElementModal
            element={selectedElement}
            onClose={() => setSelectedElement(null)}
            onNext={handleNextElement}
            onPrev={handlePrevElement}
            elements={elements}
          />
        )}
      </AnimatePresence>
    </>
  );
}
