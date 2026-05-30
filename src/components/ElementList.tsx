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
     if (category.includes('alkali metal')) return "bg-[#ff4d4d]";
     if (category.includes('alkaline earth metal')) return "bg-[#ff9933]";
     if (category.includes('transition metal')) return "bg-[#ffd633]";
     if (category.includes('post-transition metal')) return "bg-[#99ff33]";
     if (category.includes('metalloid')) return "bg-[#33ffaa]";
     if (category.includes('nonmetal')) return "bg-[#33ccff]";
     if (category.includes('noble gas')) return "bg-[#b366ff]";
     if (category.includes('lanthanide')) return "bg-[#ff66b3]";
     if (category.includes('actinide')) return "bg-[#ff33cc]";
     return "bg-slate-400";
  }

  return (
    <div className="w-full h-full overflow-y-auto max-h-[700px] bg-[#050505] p-4 sm:p-8 font-mono">
      <div className="w-full min-w-[900px] border border-white/20 bg-[#0a0a0a]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/20 text-[10px] font-bold tracking-widest text-[#888] uppercase bg-[#111]">
              <th className="py-3 px-6 text-center w-16 border-r border-white/5">N°</th>
              <th className="py-3 px-4 w-20 text-center border-r border-white/5">SYM</th>
              <th className="py-3 px-4 border-r border-white/5">DESIGNATOR</th>
              <th className="py-3 px-4 text-right border-r border-white/5">MASS</th>
              <th className="py-3 px-4 text-center border-r border-white/5" title="Protons">PRO</th>
              <th className="py-3 px-4 text-center border-r border-white/5" title="Electrons">ELE</th>
              <th className="py-3 px-4 text-center border-r border-white/5" title="Neutrons">NEU</th>
              <th className="py-3 px-6">CLASS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
             {filteredElements.map((el) => {
               const neutrons = Math.round(el.atomic_mass) - el.number;
               return (
                  <tr 
                     key={el.number} 
                     onClick={() => onElementClick(el)}
                     className="hover:bg-white/10 transition-colors cursor-pointer group text-[11px] text-white"
                  >
                    <td className="py-3 px-6 text-center opacity-50 group-hover:opacity-100 border-r border-white/5">{el.number}</td>
                    <td className="py-3 px-4 text-center font-bold text-lg group-hover:scale-110 transition-transform border-r border-white/5">{el.symbol}</td>
                    <td className="py-3 px-4 tracking-widest border-r border-white/5 uppercase">{el.name}</td>
                    <td className="py-3 px-4 text-right opacity-80 border-r border-white/5">{el.atomic_mass.toFixed(4)}</td>
                    <td className="py-3 px-4 text-center opacity-50 border-r border-white/5">{el.number}</td>
                    <td className="py-3 px-4 text-center opacity-50 border-r border-white/5">{el.number}</td>
                    <td className="py-3 px-4 text-center opacity-50 border-r border-white/5">{neutrons}</td>
                    <td className="py-3 px-6 text-[#888]">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 ${getBadgeColor(el.category)}`} />
                        <span className="uppercase tracking-widest text-[9px] group-hover:text-white transition-colors">{el.category}</span>
                      </div>
                    </td>
                  </tr>
               )
             })}
          </tbody>
        </table>
        {filteredElements.length === 0 && (
          <div className="text-center py-16 text-[#666] text-[10px] uppercase font-bold tracking-widest">NO MATCHING DATA FOUND</div>
        )}
      </div>
    </div>
  );
}
