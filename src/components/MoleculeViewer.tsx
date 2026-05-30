import React, { useEffect, useState, useRef } from "react";
import ForceGraph3D from "react-force-graph-3d";

interface MoleculeViewerProps {
  productName: string;
  chemicalEquation?: string;
}

const CPK_COLORS: Record<string, string> = {
  H: '#FFFFFF', C: '#909090', O: '#FF0D0D', N: '#3050F8', S: '#FFFF30',
  P: '#FF8000', Cl: '#1FF01F', F: '#90E050', Br: '#A62929', I: '#940094',
  Na: '#AB5CF2', Mg: '#8AFF00', Al: '#BFA6A6', Si: '#F0C8A0', Ca: '#3DFF00',
  Fe: '#E06633', Cu: '#C88033', Zn: '#7D80B0', K: '#8F40D4',
};

// Expand parenthesized formulas like Al₂(SO₄)₃ -> Al₂SO₄SO₄SO₄
function expandFormula(formula: string) {
  const subMap: Record<string, string> = { '₀':'0', '₁':'1', '₂':'2', '₃':'3', '₄':'4', '₅':'5', '₆':'6', '₇':'7', '₈':'8', '₉':'9' };
  let normalized = formula.replace(/[₀-₉]/g, m => subMap[m]);

  normalized = normalized.replace(/\(([^)]+)\)(\d+)/g, (match, inner, count) => {
    return inner.repeat(parseInt(count, 10));
  });

  const regex = /([A-Z][a-z]*)(\d*)/g;
  let match;
  const atoms: string[] = [];
  while ((match = regex.exec(normalized)) !== null) {
      const el = match[1];
      const count = parseInt(match[2] || "1", 10);
      for(let i=0; i<count; i++) {
         atoms.push(el);
      }
  }
  return atoms;
}

// Generate Nodes and Links
function generateGraphData(formula: string) {
  const atoms = expandFormula(formula);
  if (atoms.length === 0) return { nodes: [], links: [] };

  const nodes = atoms.map((symbol, i) => ({
    id: `${symbol}${i}`,
    name: symbol,
    color: CPK_COLORS[symbol] || '#FF1493'
  }));

  const links: any[] = [];
  
  if (nodes.length <= 1) return { nodes, links };

  const counts: Record<string, number> = {};
  atoms.forEach(a => counts[a] = (counts[a] || 0) + 1);
  
  const priority = (a: string) => {
    if (['C','Si'].includes(a)) return 100;
    if (['N','P'].includes(a)) return 90;
    if (['S'].includes(a)) return 80;
    if (['O'].includes(a)) return 10;
    if (['H','F','Cl','Br','I'].includes(a)) return 0;
    return 50; 
  };

  const sortedAtoms = [...new Set(atoms)].sort((a, b) => {
    return (priority(b) - priority(a)) || (counts[a] - counts[b]);
  });
  
  const centralElement = sortedAtoms[0];
  const centralNodes = nodes.filter(n => n.name === centralElement);
  const otherNodes = nodes.filter(n => n.name !== centralElement);

  // Chains of central nodes
  for (let i = 0; i < centralNodes.length - 1; i++) {
    links.push({
      source: centralNodes[i].id,
      target: centralNodes[i+1].id
    });
  }

  // Branch other nodes from central atoms
  if (centralNodes.length > 0) {
    otherNodes.forEach((node, i) => {
      const parent = centralNodes[i % centralNodes.length];
      links.push({
        source: parent.id,
        target: node.id
      });
    });
  } else {
    // Fallback if all logic somehow missed
    for (let i = 1; i < nodes.length; i++) {
      links.push({ source: nodes[0].id, target: nodes[i].id });
    }
  }

  return { nodes, links };
}

function extractProductFormula(equation?: string, fallbackName?: string) {
  if (!equation) return fallbackName || "";
  const parts = equation.split('→');
  if (parts.length < 2) return fallbackName || "";
  const products = parts[1].split('+');
  const firstProduct = products[0].trim();
  // Strip leading coefficients like '2NaCl' -> 'NaCl'
  return firstProduct.replace(/^[\d\s]+/, '');
}

export function MoleculeViewer({ productName, chemicalEquation }: MoleculeViewerProps) {
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 400 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const formula = extractProductFormula(chemicalEquation, productName);
    const data = generateGraphData(formula);
    setGraphData(data);
  }, [productName, chemicalEquation]);

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return <div className="p-4 text-center text-red-400">Failed to generate 3D model for this molecule.</div>;
  }

  return (
    <div ref={containerRef} className="w-full h-[400px] border border-[#33ccff]/30 bg-[#000] relative">
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="name"
        nodeColor="color"
        nodeRelSize={8}
        linkColor={() => "#aaaaaa"}
        linkWidth={2}
        backgroundColor="#050505"
        width={dimensions.width}
        height={dimensions.height}
      />
      <div className="absolute top-2 left-2 text-[10px] text-white/50 bg-black/50 px-2 py-1 pointers-events-none">
        {productName} 3D Structure (Algorithmic)
      </div>
    </div>
  );
}
