import React from 'react';
import { ElementData } from '../types';
import ElementCard from './ElementCard';
import { motion, AnimatePresence } from 'motion/react';

interface PeriodicTableProps {
  elements: ElementData[];
  onElementClick: (element: ElementData) => void;
  searchQuery?: string;
  activeCategory?: string;
}

export default function PeriodicTable({ elements, onElementClick, searchQuery = "", activeCategory = "all" }: PeriodicTableProps) {
  
  const isMatch = (el: ElementData) => {
    // Check Category
    if (activeCategory !== "all") {
        if (!el.category.toLowerCase().includes(activeCategory.toLowerCase())) {
            return false;
        }
    }
    
    // Check Search
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

  return (
    <div className="w-full max-w-full overflow-x-auto pb-8 pt-4 px-2 sm:px-0">
      <motion.div 
        layout
        className="min-w-[800px] sm:min-w-[1000px] md:min-w-fit mx-auto grid gap-[2px] p-2"
        style={{
          gridTemplateColumns: `repeat(18, minmax(35px, 1fr))`,
          gridTemplateRows: `repeat(10, minmax(45px, 1fr))`
        }}
      >
        <AnimatePresence>
          {elements.map((el) => {
            const resultMatch = isMatch(el);
            const needsDimming = (searchQuery.trim() !== "" || activeCategory !== "all") && !resultMatch;
            
            return (
              <ElementCard
                key={el.number}
                element={el}
                onClick={onElementClick}
                isDimmed={needsDimming}
              />
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
