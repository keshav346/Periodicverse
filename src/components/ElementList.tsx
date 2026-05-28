import React from 'react';
import { ElementData } from '../types';

interface ElementListProps {
  elements: ElementData[];
  onElementClick: (element: ElementData) => void;
  searchQuery?: string;
  activeCategory?: string;
}

export default function ElementList({ elements, onElementClick, searchQuery = "", activeCategory = "all" }: ElementListProps) {
  
  const isMatch = (el: ElementData) => {
    if (activeCategory !== "all") {
        if (!el.category.toLowerCase().includes(activeCategory.toLowerCase())) {
            return false;
        }
    }
    
    if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        if (
            !el.name.toLowerCase().includes(query) &&
            !el.symbol.toLowerCase().includes(query) &&
            el.number.toString() !== query
        ) {
            return false;
        }
    }
    
    return true;
  };

  const filteredElements = elements.filter(isMatch);

  // Helper to extract a solid color for the category badge
  const getBadgeColor = (category: string) => {
     if (category.includes('alkali metal')) return "bg-red-400";
     if (category.includes('alkaline earth metal')) return "bg-orange-400";
     if (category.includes('transition metal')) return "bg-amber-400";
     if (category.includes('post-transition metal')) return "bg-green-400";
     if (category.includes('metalloid')) return "bg-teal-400";
     if (category.includes('nonmetal')) return "bg-cyan-400";
     if (category.includes('noble gas')) return "bg-blue-400";
     if (category.includes('lanthanide')) return "bg-indigo-400";
     if (category.includes('actinide')) return "bg-purple-400";
     return "bg-slate-400";
  }

  return (
    <div className="w-full h-full overflow-y-auto max-h-[700px] custom-scrollbar p-2 sm:p-6 pb-20">
      <div className="min-w-[900px] w-full bg-slate-900/60 rounded-2xl border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-white/10 text-xs font-semibold tracking-widest text-slate-400 uppercase shadow-sm">
              <th className="py-4 px-6 text-center w-16">No.</th>
              <th className="py-4 px-4 w-20 text-center">Sym</th>
              <th className="py-4 px-4">Element Name</th>
              <th className="py-4 px-4 text-right">Atomic Mass</th>
              <th className="py-4 px-4 text-center" title="Protons">P</th>
              <th className="py-4 px-4 text-center" title="Electrons">E</th>
              <th className="py-4 px-4 text-center" title="Neutrons">N</th>
              <th className="py-4 px-6">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
             {filteredElements.map((el) => {
               const neutrons = Math.round(el.atomic_mass) - el.number;
               return (
                  <tr 
                     key={el.number} 
                     onClick={() => onElementClick(el)}
                     className="hover:bg-white/[0.08] transition-all cursor-pointer group"
                  >
                    <td className="py-3 px-6 text-center font-mono opacity-50 group-hover:opacity-100 transition-opacity text-sm">{el.number}</td>
                    <td className="py-3 px-4 text-center font-bold text-lg text-white group-hover:scale-125 transition-transform drop-shadow-md">{el.symbol}</td>
                    <td className="py-3 px-4 font-medium text-slate-200 group-hover:text-white transition-colors">{el.name}</td>
                    <td className="py-3 px-4 text-right font-mono opacity-70 group-hover:opacity-100 text-sm tracking-tight">{el.atomic_mass.toFixed(4)}</td>
                    <td className="py-3 px-4 text-center font-mono opacity-50 text-sm">{el.number}</td>
                    <td className="py-3 px-4 text-center font-mono opacity-50 text-sm">{el.number}</td>
                    <td className="py-3 px-4 text-center font-mono opacity-50 text-sm">{neutrons}</td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getBadgeColor(el.category)} shadow-[0_0_8px_currentColor] opacity-80`} />
                        <span className="text-[10px] uppercase tracking-wide opacity-60 group-hover:opacity-100 transition-opacity">{el.category}</span>
                      </div>
                    </td>
                  </tr>
               )
             })}
          </tbody>
        </table>
        {filteredElements.length === 0 && (
          <div className="text-center py-16 text-slate-500 font-medium">No elements match your search criteria.</div>
        )}
      </div>
    </div>
  );
}
