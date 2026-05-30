import React from 'react';
import { ElementData } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ElementCardProps {
  element: ElementData;
  onClick: (element: ElementData) => void;
  isDimmed?: boolean;
}

export function getCategoryColor(category: string) {
  if (category.includes('alkali metal')) return 'border-[#ff4d4d]/60 bg-[#1a0808]/80 hover:bg-[#330f0f] text-[#ffcccc]';
  if (category.includes('alkaline earth metal')) return 'border-[#ff9933]/60 bg-[#1a0f03]/80 hover:bg-[#331f0a] text-[#ffe6cc]';
  if (category.includes('transition metal')) return 'border-[#ffd633]/60 bg-[#1a1503]/80 hover:bg-[#332b0a] text-[#fff5cc]';
  if (category.includes('post-transition metal')) return 'border-[#99ff33]/60 bg-[#0f1a03]/80 hover:bg-[#1f330a] text-[#e6ffcc]';
  if (category.includes('metalloid')) return 'border-[#33ffaa]/60 bg-[#031a11]/80 hover:bg-[#0a3322] text-[#ccffeb]';
  if (category.includes('polyatomic nonmetal') || category.includes('reactive nonmetal') || category === 'diatomic nonmetal') return 'border-[#33ccff]/60 bg-[#03141a]/80 hover:bg-[#0a2933] text-[#ccf2ff]';
  if (category.includes('noble gas')) return 'border-[#b366ff]/60 bg-[#120a1a]/80 hover:bg-[#241433] text-[#e6ccff]';
  if (category.includes('lanthanide')) return 'border-[#ff66b3]/60 bg-[#1a0a12]/80 hover:bg-[#331424] text-[#ffcce6]';
  if (category.includes('actinide')) return 'border-[#ff33cc]/60 bg-[#1a0314]/80 hover:bg-[#330a29] text-[#ffccf2]';
  return 'border-[#808080]/60 bg-[#0d0d0d]/80 hover:bg-[#1a1a1a] text-[#cccccc]';
}

export default function ElementCard({ element, onClick, isDimmed }: ElementCardProps) {
  let col = element.xpos;
  let row = element.ypos;
  
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isDimmed ? 0.15 : 1, scale: 1, filter: isDimmed ? "grayscale(100%)" : "grayscale(0%)" }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={isDimmed ? {} : { scale: 1.05, zIndex: 10 }}
      whileTap={isDimmed ? {} : { scale: 0.95 }}
      style={{
        gridColumn: col,
        gridRow: row,
      }}
      onClick={() => onClick(element)}
      className={cn(
        "relative flex flex-col p-[0.3rem] text-left border rounded-sm transition-all duration-300 font-mono tracking-tighter",
        isDimmed ? "pointer-events-none opacity-15 filter grayscale border-transparent" : "cursor-pointer hover:shadow-[0_0_8px_rgba(255,255,255,0.2)]",
        getCategoryColor(element.category)
      )}
    >
      <div className="flex justify-between items-start leading-none opacity-90 text-[10px] w-full font-bold">
        <span>{element.number}</span>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center my-0.5">
        <span className="text-xl sm:text-2xl font-bold tracking-tight font-sans leading-none uppercase">
          {element.symbol}
        </span>
      </div>
      
      <div className="text-[7.5px] sm:text-[8px] leading-[1.1] text-center truncate font-mono opacity-80 w-full uppercase tracking-widest hidden sm:block">
        {element.name}
      </div>
    </motion.button>
  );
}
