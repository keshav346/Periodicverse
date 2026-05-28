import React from 'react';
import { ElementData } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ElementCardProps {
  element: ElementData;
  isAdvanced: boolean;
  onClick: (element: ElementData) => void;
  isDimmed?: boolean;
}

export function getCategoryColor(category: string) {
  if (category.includes('alkali metal')) return 'border-red-500/50 bg-red-900/20 hover:bg-red-900/40 text-red-100';
  if (category.includes('alkaline earth metal')) return 'border-orange-500/50 bg-orange-900/20 hover:bg-orange-900/40 text-orange-100';
  if (category.includes('transition metal')) return 'border-yellow-500/50 bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-100';
  if (category.includes('post-transition metal')) return 'border-lime-500/50 bg-lime-900/20 hover:bg-lime-900/40 text-lime-100';
  if (category.includes('metalloid')) return 'border-emerald-500/50 bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-100';
  if (category.includes('polyatomic nonmetal') || category.includes('reactive nonmetal') || category === 'diatomic nonmetal') return 'border-cyan-500/50 bg-cyan-900/20 hover:bg-cyan-900/40 text-cyan-100';
  if (category.includes('noble gas')) return 'border-violet-500/50 bg-violet-900/20 hover:bg-violet-900/40 text-violet-100';
  if (category.includes('lanthanide')) return 'border-pink-500/50 bg-pink-900/20 hover:bg-pink-900/40 text-pink-100';
  if (category.includes('actinide')) return 'border-fuchsia-500/50 bg-fuchsia-900/20 hover:bg-fuchsia-900/40 text-fuchsia-100';
  return 'border-gray-500/50 bg-gray-900/20 hover:bg-gray-900/40 text-gray-100';
}

export default function ElementCard({ element, isAdvanced, onClick, isDimmed }: ElementCardProps) {
  // Determine grid position based on mode
  let col = isAdvanced ? element.wxpos : element.xpos;
  let row = isAdvanced ? element.wypos : element.ypos;
  
  // Custom offset for Hydrogen in Advanced mode if requested
  if (isAdvanced && element.number === 1) {
    // Optionally offset it to center top
  }

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isDimmed ? 0.2 : 1, scale: 1, filter: isDimmed ? "grayscale(80%)" : "grayscale(0%)" }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={isDimmed ? {} : { scale: 1.1, zIndex: 10, outline: '1px solid currentColor' }}
      whileTap={isDimmed ? {} : { scale: 0.95 }}
      style={{
        gridColumn: col,
        gridRow: row,
      }}
      onClick={() => onClick(element)}
      className={cn(
        "relative flex flex-col p-1 sm:p-[0.35rem] text-left border rounded backdrop-blur-sm transition-all duration-300",
        isDimmed ? "pointer-events-none opacity-20 filter grayscale border-transparent" : "cursor-pointer hover:shadow-lg focus:shadow-lg",
        getCategoryColor(element.category)
      )}
    >
      <div className="flex justify-between items-start leading-none opacity-90 text-[0.45rem] sm:text-[0.6rem] font-mono w-full">
        <span className="font-semibold">{element.number}</span>
        {isAdvanced && element.electronegativity_pauling && <span className="opacity-75 hidden xl:block text-[0.45rem]">{element.electronegativity_pauling}</span>}
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center my-0.5">
        <span className="text-[1.1rem] sm:text-2xl font-bold tracking-tight font-sans drop-shadow-md leading-none">
          {element.symbol}
        </span>
      </div>
      
      <div className="text-[0.4rem] sm:text-[0.55rem] leading-[1.1] text-center truncate font-sans opacity-95 w-full uppercase tracking-wider hidden sm:block">
        {element.name}
      </div>
      
      {isAdvanced && (
        <div className="hidden xl:flex justify-between w-full mt-1 opacity-70 text-[0.4rem] font-mono leading-none tracking-tighter">
          <span>{element.atomic_mass.toFixed(2)}</span>
          <span className="truncate ml-1 text-right">{element.electron_configuration_semantic.split(' ').pop()}</span>
        </div>
      )}
    </motion.button>
  );
}
