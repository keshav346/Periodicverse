import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Hash,
  FlaskConical,
  CircleDot,
  Sparkles,
} from "lucide-react";
import { ElementData } from "../types";
import Atom3D from "./Atom3D";
import AIChat from "./AIChat";

export default function ElementModal({
  element,
  onClose,
  onNext,
  onPrev,
  elements,
}: {
  element: ElementData;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  elements: ElementData[];
}) {
  const [modelType, setModelType] = useState<"bohr" | "cloud" | "orbital">(
    "bohr",
  );
  const [showAI, setShowAI] = useState(false);

  const getHexForCategory = (cat: string) => {
    if (cat.includes("alkali metal")) return "#ff4d4d";
    if (cat.includes("alkaline earth metal")) return "#ff9933";
    if (cat.includes("transition metal")) return "#ffd633";
    if (cat.includes("post-transition metal")) return "#99ff33";
    if (cat.includes("metalloid")) return "#33ffaa";
    if (cat.includes("nonmetal")) return "#33ccff";
    if (cat.includes("noble gas")) return "#b366ff";
    if (cat.includes("lanthanide")) return "#ff66b3";
    if (cat.includes("actinide")) return "#ff33cc";
    return "#cccccc";
  };

  const themeColor = getHexForCategory(element.category);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 font-mono uppercase tracking-widest"
    >
      <motion.div
        initial={{ y: 20, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.98 }}
        className="w-full max-w-6xl h-[95vh] sm:max-h-[90vh] bg-[#050505] border border-white/20 flex flex-col md:flex-row overflow-hidden relative shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 p-2 bg-black border border-white/20 hover:bg-white/10 hover:border-white transition-colors text-white"
        >
          <X size={16} />
        </button>

        {/* Left Side: 3D Visualization */}
        <div className="w-full h-[40vh] md:h-auto md:w-5/12 bg-[#0a0a0a] relative border-b md:border-b-0 md:border-r border-white/20 flex flex-col shrink-0">
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 pointer-events-none">
            <h1
              className="text-5xl sm:text-7xl font-bold tracking-tighter"
              style={{ color: themeColor }}
            >
              {element.symbol}
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              {element.name}
            </h2>
            <div className="mt-4 text-[10px] text-[#888] font-bold flex flex-col gap-1">
              <span>CLASS: {element.category}</span>
              <span>PHASE [RT]: {element.phase}</span>
            </div>
          </div>

          <div className="flex-1 h-full w-full relative min-h-[200px]">
            <button
              onClick={onPrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-black border border-white/20 hover:bg-white/10 text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={onNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-black border border-white/20 hover:bg-white/10 text-white transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            <Atom3D
              shells={element.shells}
              color={themeColor}
              modelType={modelType}
            />
            <div className="absolute bottom-4 left-4 right-4 z-50 pointer-events-none flex justify-start items-end">
              <div className="flex gap-2 pointer-events-auto">
                <button
                  onClick={() => setModelType("bohr")}
                  className={`px-3 py-1 text-[10px] font-bold border transition-colors ${modelType === "bohr" ? "bg-white text-black border-white" : "bg-black border-white/20 text-white hover:bg-white/10"}`}
                >
                  BOHR
                </button>
                <button
                  onClick={() => setModelType("cloud")}
                  className={`px-3 py-1 text-[10px] font-bold border transition-colors ${modelType === "cloud" ? "bg-white text-black border-white" : "bg-black border-white/20 text-white hover:bg-white/10"}`}
                >
                  CLOUD
                </button>
                <button
                  onClick={() => setModelType("orbital")}
                  className={`px-3 py-1 text-[10px] font-bold border transition-colors ${modelType === "orbital" ? "bg-white text-black border-white" : "bg-black border-white/20 text-white hover:bg-white/10"}`}
                >
                  ORBITAL
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Information & AI */}
        <div className="w-full h-[55vh] md:h-auto md:w-7/12 flex flex-col overflow-hidden bg-[#050505] relative">
          <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-50 pointer-events-auto">
            <button
              onClick={() => setShowAI(!showAI)}
              className={`px-3 py-1.5 border border-white/20 text-[10px] font-bold flex items-center gap-2 transition-colors shadow-lg ${showAI ? "bg-white text-black" : "bg-black text-white hover:bg-white/10"}`}
            >
              <Sparkles
                size={12}
                className={showAI ? "text-black" : "text-[#33ccff]"}
              />
              {showAI ? "CLOSE AI" : "AI TUTOR"}
            </button>
          </div>

          <AnimatePresence>
            {showAI && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute inset-0 z-40 bg-[#050505]/95 backdrop-blur-xl pt-20 p-4 sm:p-6 md:p-8 flex flex-col pointer-events-auto"
              >
                <AIChat key={element.number} contextName={element.name} elements={elements} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 text-white text-[11px] pt-16 sm:pt-20">
            <section>
              <h3 className="text-[10px] font-bold text-[#666] mb-3 flex items-center justify-between border-b border-white/20 pb-2">
                <span>SYSTEM OVERVIEW</span>
                <span className="text-[#888]">
                  Z:{element.number} • MASS:
                  {Math.round(element.atomic_mass * 1000) / 1000}U • G:
                  {element.group} P:{element.period}
                </span>
              </h3>
              <p className="leading-relaxed normal-case text-slate-300">
                {element.summary}
              </p>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-white/20 p-4 bg-[#0a0a0a]">
                <h3 className="text-[10px] font-bold text-[#666] mb-4 border-b border-white/20 pb-2 flex items-center gap-2">
                  <CircleDot size={12} /> ELECTRONIC STATE
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-col border-b border-white/10 pb-2">
                    <span className="text-[#666] text-[9px] mb-1">
                      CONFIGURATION
                    </span>
                    <span className="text-white break-all">
                      {element.electron_configuration_semantic ||
                        element.electron_configuration}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-[#666]">SHELLS</span>
                    <span className="text-white">
                      {element.shells.join(" : ")}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-[#666]">VALENCE</span>
                    <span className="text-white">
                      {element.shells[element.shells.length - 1]} E-
                    </span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-[#666]">OCCURRENCE</span>
                    <span className="text-white">
                      {element.number > 94 ? "SYNTHETIC" : "PRIMORDIAL"}
                    </span>
                  </div>
                  {element.ionization_energies &&
                    element.ionization_energies.length > 0 && (
                      <div className="flex justify-between border-t border-white/10 pt-2 pb-1">
                        <span className="text-[#666]">IONIZATION ENERGIES</span>
                        <span
                          className="text-white max-w-[50%] text-right truncate"
                          title={element.ionization_energies.join(", ")}
                        >
                          {element.ionization_energies[0]} KJ/MOL
                        </span>
                      </div>
                    )}
                </div>
              </div>

              <div className="border border-white/20 p-4 bg-[#0a0a0a]">
                <h3 className="text-[10px] font-bold text-[#666] mb-4 border-b border-white/20 pb-2 flex items-center gap-2">
                  <FlaskConical size={12} /> PHYSICAL METRICS
                </h3>
                <div className="space-y-3">
                  {element.color && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-[#666]">COLOR</span>
                      <span className="text-white">
                        {element.color.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-[#666]">DENSITY</span>
                    <span className="text-white">
                      {element.density ? `${element.density} G/CM³` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-[#666]">MELT PT.</span>
                    <span className="text-white">
                      {element.melt ? `${element.melt} K` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-[#666]">BOIL PT.</span>
                    <span className="text-white">
                      {element.boil ? `${element.boil} K` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-[#666]">ELECTRONEG.</span>
                    <span className="text-white">
                      {element.electronegativity_pauling || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-[#666]">E- AFFINITY</span>
                    <span className="text-white">
                      {element.electron_affinity
                        ? `${element.electron_affinity} KJ/MOL`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <section>
              <h3 className="text-[10px] font-bold text-[#666] mb-3 border-b border-white/20 pb-2 flex items-center gap-2">
                <Hash size={12} /> HISTORICAL DATA
              </h3>
              <div className="border border-white/20 p-4 bg-[#0a0a0a] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[#666] text-[9px] mb-1">
                    DISCOVERED BY
                  </span>
                  <span className="text-white">
                    {element.discovered_by || "UNKNOWN"}
                  </span>
                </div>
                <div>
                  <span className="block text-[#666] text-[9px] mb-1">
                    NAMED BY
                  </span>
                  <span className="text-white">
                    {element.named_by || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="block text-[#666] text-[9px] mb-1">
                    APPEARANCE
                  </span>
                  <span className="text-white inline-block">
                    {element.appearance || "UNKNOWN"}
                  </span>
                </div>
                <div>
                  <span className="block text-[#666] text-[9px] mb-1">
                    MOLAR HEAT
                  </span>
                  <span className="text-white">
                    {element.molar_heat
                      ? `${element.molar_heat} J/(MOL·K)`
                      : "N/A"}
                  </span>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-white/10 mt-1">
                  <span className="block text-[#666] text-[9px] mb-1">
                    SOURCE
                  </span>
                  <a
                    href={element.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors underline decoration-blue-400/30 underline-offset-4 overflow-hidden text-ellipsis block whitespace-nowrap normal-case"
                  >
                    {element.source}
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
