export interface ReactionResult {
  reactionOccurred: boolean;
  productName: string;
  chemicalEquation: string;
  explanation: string;
  bondsFormed: string[];
  reactionType?: 'exothermic' | 'endothermic';
}

// Basic element data to map names to symbols and categories for generalized rules
const elementsData: Record<string, { symbol: string, category: string, valence: number[] }> = {
  hydrogen: { symbol: 'H', category: 'nonmetal', valence: [1] },
  lithium: { symbol: 'Li', category: 'alkali metal', valence: [1] },
  sodium: { symbol: 'Na', category: 'alkali metal', valence: [1] },
  potassium: { symbol: 'K', category: 'alkali metal', valence: [1] },
  rubidium: { symbol: 'Rb', category: 'alkali metal', valence: [1] },
  cesium: { symbol: 'Cs', category: 'alkali metal', valence: [1] },
  
  beryllium: { symbol: 'Be', category: 'alkaline earth metal', valence: [2] },
  magnesium: { symbol: 'Mg', category: 'alkaline earth metal', valence: [2] },
  calcium: { symbol: 'Ca', category: 'alkaline earth metal', valence: [2] },
  strontium: { symbol: 'Sr', category: 'alkaline earth metal', valence: [2] },
  barium: { symbol: 'Ba', category: 'alkaline earth metal', valence: [2] },

  fluorine: { symbol: 'F', category: 'halogen', valence: [1] },
  chlorine: { symbol: 'Cl', category: 'halogen', valence: [1] },
  bromine: { symbol: 'Br', category: 'halogen', valence: [1] },
  iodine: { symbol: 'I', category: 'halogen', valence: [1] },

  oxygen: { symbol: 'O', category: 'nonmetal', valence: [2] },
  sulfur: { symbol: 'S', category: 'nonmetal', valence: [2] },
  nitrogen: { symbol: 'N', category: 'nonmetal', valence: [3] },
  carbon: { symbol: 'C', category: 'nonmetal', valence: [4] },

  iron: { symbol: 'Fe', category: 'transition metal', valence: [2, 3] },
  copper: { symbol: 'Cu', category: 'transition metal', valence: [1, 2] },
  zinc: { symbol: 'Zn', category: 'transition metal', valence: [2] },
  silver: { symbol: 'Ag', category: 'transition metal', valence: [1] },
  gold: { symbol: 'Au', category: 'transition metal', valence: [3] },
  platinum: { symbol: 'Pt', category: 'transition metal', valence: [2, 4] },
  aluminum: { symbol: 'Al', category: 'post-transition metal', valence: [3] },
  gallium: { symbol: 'Ga', category: 'post-transition metal', valence: [3] },
  lead: { symbol: 'Pb', category: 'post-transition metal', valence: [2, 4] }
};

// Halogens typically exist as diatomic molecules F2, Cl2, Br2, I2.
// Oxygen is O2, Nitrogen N2, Hydrogen H2.
const diatomics = ['H', 'N', 'O', 'F', 'Cl', 'Br', 'I'];

function getSymbol(name: string) {
  return elementsData[name]?.symbol || name.charAt(0).toUpperCase() + name.slice(1, 2);
}

function getSubscript(num: number) {
  const sub = ['₀','₁','₂','₃','₄','₅','₆','₇','₈','₉'];
  return num.toString().split('').map(d => sub[parseInt(d)]).join('');
}

// Generate combinations programmatically to support thousands of distinct reactions
export function simulateReaction(reactants: {name: string, quantity: number}[], temperature: number, pressure: number, catalyst: string): ReactionResult {
  const reactantNames = reactants.map(e => e.name.toLowerCase()).sort();
  // Using a Set to get unique names for the combination string
  const uniqueReactantNames = Array.from(new Set(reactantNames)).sort();
  const elementStr = uniqueReactantNames.join("-");

  // Get quantities for stoichiometry checks
  const getQty = (name: string) => reactants.find(r => r.name.toLowerCase() === name.toLowerCase())?.quantity || 0;

  // Base rejection
  if (uniqueReactantNames.length < 2) {
    return {
      reactionOccurred: false,
      productName: "No reaction",
      chemicalEquation: "",
      explanation: "Provide at least two different elements to simulate a reaction.",
      bondsFormed: []
    };
  }

  // 1. Specific Hardcoded Databases (Exceptions and specific compounds)
  if (elementStr === "hydrogen-oxygen") {
    const hQty = getQty("hydrogen");
    const oQty = getQty("oxygen");
    
    if (hQty === 2 && oQty === 1) {
      if (temperature > 700 || catalyst?.toLowerCase().includes("pt")) {
        return {
          reactionOccurred: true,
          productName: "Water (H₂O)",
          chemicalEquation: "2H₂ + O₂ → 2H₂O",
          explanation: "Hydrogen gas and oxygen gas react explosively at high temperatures or in the presence of a catalyst like platinum to form water vapor. Highly exothermic. Each oxygen atom shares 2 electrons (1 with each hydrogen atom), and each hydrogen atom shares 1 electron.",
          bondsFormed: ["Covalent O-H (Polar)"],
          reactionType: "exothermic"
        };
      }
      return { reactionOccurred: false, productName: "No reaction", chemicalEquation: "", explanation: "Hydrogen and oxygen require a spark, heat (>700K), or a catalyst to overcome activation energy.", bondsFormed: [] };
    } else if (hQty === 2 && oQty === 2) {
      if (temperature > 300) {
        return {
          reactionOccurred: true,
          productName: "Hydrogen Peroxide (H₂O₂)",
          chemicalEquation: "H₂ + O₂ → H₂O₂",
          explanation: "Hydrogen and oxygen react to form hydrogen peroxide.",
          bondsFormed: ["Covalent O-H (Polar)", "Covalent O-O"],
          reactionType: "exothermic"
        };
      }
      return { reactionOccurred: false, productName: "No reaction", chemicalEquation: "", explanation: "Requires heat.", bondsFormed: [] };
    } else {
      return {
        reactionOccurred: false,
        productName: "Stoichiometry Mismatch",
        chemicalEquation: "",
        explanation: `Hydrogen and oxygen require a 2:1 ratio (2 Hydrogen, 1 Oxygen) to form Water, or a 2:2 ratio to form Hydrogen Peroxide. You provided ${hQty} Hydrogen and ${oQty} Oxygen.`,
        bondsFormed: []
      };
    }
  }

  if (elementStr === "carbon-oxygen") {
    const cQty = getQty("carbon");
    const oQty = getQty("oxygen");
    
    if (cQty === 1 && oQty === 2) {
      if (temperature > 600) {
        return {
          reactionOccurred: true,
          productName: "Carbon Dioxide (CO₂)",
          chemicalEquation: "C + O₂ → CO₂",
          explanation: "Carbon combusts with oxygen at elevated temperatures. Each carbon atom shares 4 electrons (2 with each oxygen atom), forming double covalent bonds.",
          bondsFormed: ["Covalent C=O (Double bond)"],
          reactionType: "exothermic"
        };
      }
      return { reactionOccurred: false, productName: "No reaction", chemicalEquation: "", explanation: "Heat (>600K) required for carbon combustion.", bondsFormed: [] };
    } else if (cQty === 1 && oQty === 1) {
      if (temperature > 800) {
         return {
          reactionOccurred: true,
          productName: "Carbon Monoxide (CO)",
          chemicalEquation: "2C + O₂ → 2CO",
          explanation: "Incomplete combustion of carbon due to limited oxygen forms toxic carbon monoxide.",
          bondsFormed: ["Covalent (Triple polar bond C≡O)"],
          reactionType: "exothermic"
        };
      }
    }
    
    return {
      reactionOccurred: false,
      productName: "Stoichiometry Mismatch",
      chemicalEquation: "",
      explanation: `Carbon and oxygen require a 1:2 ratio (1 Carbon, 2 Oxygen) to form Carbon Dioxide (CO₂), or a 1:1 ratio for Carbon Monoxide (CO). You provided ${cQty} Carbon and ${oQty} Oxygen.`,
      bondsFormed: []
    };
  }

  if (elementStr === "hydrogen-nitrogen") {
    const nQty = getQty("nitrogen");
    const hQty = getQty("hydrogen");
    if (nQty === 1 && hQty === 3) {
      if (temperature >= 600 && pressure >= 150 && catalyst?.toLowerCase().includes("fe")) {
        return {
           reactionOccurred: true,
           productName: "Ammonia (NH₃)",
           chemicalEquation: "N₂ + 3H₂ ⇌ 2NH₃",
           explanation: "Through the Haber-Bosch process, nitrogen and hydrogen react under high temperature and pressure with an iron catalyst. Each nitrogen atom shares 3 electrons (1 with each hydrogen atom), and each hydrogen atom shares 1 electron.",
           bondsFormed: ["Covalent N-H"],
           reactionType: "exothermic"
        };
      }
      return { reactionOccurred: false, productName: "No reaction", chemicalEquation: "", explanation: "Requires extremely high pressure, heat, and an Iron catalyst (Haber-Bosch process).", bondsFormed: [] };
    }
    return {
      reactionOccurred: false,
      productName: "Stoichiometry Mismatch",
      chemicalEquation: "",
      explanation: `Ammonia synthesis requires a 1:3 ratio (1 Nitrogen, 3 Hydrogen). You provided ${nQty} Nitrogen and ${hQty} Hydrogen.`,
      bondsFormed: []
    };
  }

  if (elementStr === "nitrogen-oxygen") {
    const nQty = getQty("nitrogen");
    const oQty = getQty("oxygen");
    if (nQty === 1 && oQty === 1) {
      if (temperature > 2000) {
        return {
          reactionOccurred: true,
          productName: "Nitric Oxide (NO)",
          chemicalEquation: "N₂ + O₂ → 2NO",
          explanation: "At very high temperatures (like lightening strikes or combustion engines), nitrogen and oxygen react to form nitric oxide. This is an endothermic reaction where the atoms share 2 electrons each to form a double covalent bond.",
          bondsFormed: ["Covalent N=O (Double bond)"],
          reactionType: "endothermic"
        };
      }
      return { reactionOccurred: false, productName: "No reaction", chemicalEquation: "", explanation: "Requires extreme heat (>2000K) such as lightning or electrical discharge to break the strong triple bond of Nitrogen gas.", bondsFormed: [] };
    } else if (nQty === 1 && oQty === 2) {
       return {
          reactionOccurred: true,
          productName: "Nitrogen Dioxide (NO₂)",
          chemicalEquation: "2NO + O₂ → 2NO₂",
          explanation: "Forms a reddish-brown toxic gas.",
          bondsFormed: ["Covalent N-O"],
          reactionType: "exothermic"
        };
    }
    return {
      reactionOccurred: false,
      productName: "Stoichiometry Mismatch",
      chemicalEquation: "",
      explanation: `Nitrogen oxides typically form in 1:1 (Nitric Oxide) or 1:2 (Nitrogen Dioxide) ratios. You provided ${nQty} Nitrogen and ${oQty} Oxygen.`,
      bondsFormed: []
    };
  }

  // 2. Generalized Rule Engine (Handles realistic permutations dynamically)
  
  // Grab element categories if available
  const el1 = elementsData[uniqueReactantNames[0]];
  const el2 = elementsData[uniqueReactantNames[1]];

  if (el1 && el2 && uniqueReactantNames.length === 2) {
    // Metal + Halogen (e.g., Sodium + Chlorine -> NaCl, Calcium + Fluorine -> CaF2)
    const isM1 = el1.category.includes('metal') && !el1.category.includes('nonmetal');
    const isM2 = el2.category.includes('metal') && !el2.category.includes('nonmetal');
    const isH1 = el1.category === 'halogen';
    const isH2 = el2.category === 'halogen';

    if ((isM1 && isH2) || (isM2 && isH1)) {
       const metal = isM1 ? el1 : el2;
       const halogen = isM1 ? el2 : el1;
       const mName = isM1 ? reactantNames[0] : reactantNames[1];
       const hName = isM1 ? reactantNames[1] : reactantNames[0];
       
       const mId = metal.symbol;
       const hId = halogen.symbol;
       const mValence = metal.valence[0];
       
       // Example: Na (1) + Cl (1) -> NaCl. Ca (2) + F (1) -> CaF2. Al (3) + Br (1) -> AlBr3.
       const productFormula = mValence === 1 ? `${mId}${hId}` : `${mId}${hId}${getSubscript(mValence)}`;
       const mCoef = 2; // simplifies balancing
       const hCoef = mValence; // Diatomic halogen: Cl2
       const h2Str = `${hId}₂`;
       const pCoef = 2;

       let equation = "";
       if (mValence === 1) {
         equation = `2${mId} + ${h2Str} → 2${productFormula}`;
       } else if (mValence === 2) {
         equation = `${mId} + ${h2Str} → ${productFormula}`;
       } else {
         equation = `2${mId} + 3${h2Str} → 2${productFormula}`;
       }

       return {
         reactionOccurred: true,
         productName: `${mName.charAt(0).toUpperCase() + mName.slice(1)} ${hName.replace(/ine$/, 'ide')}`,
         chemicalEquation: equation,
         explanation: `The metal (${metal.symbol}) reacts vigorously with the halogen (${halogen.symbol}) gas through a redox reaction. Each ${metal.symbol} atom loses ${mValence} electron(s) (becoming a +${mValence} cation), and each ${halogen.symbol} atom gains 1 electron (becoming a -1 anion) to form an ionic halide salt.`,
         bondsFormed: [`Ionic ${metal.symbol}⁺-${halogen.symbol}⁻`],
         reactionType: "exothermic"
       };
    }

    // Metal + Oxygen
    const isO1 = reactantNames[0] === 'oxygen';
    const isO2 = reactantNames[1] === 'oxygen';
    
    if ((isM1 && isO2) || (isM2 && isO1)) {
        const metal = isM1 ? el1 : el2;
        const oId = 'O'; // oxygen
        const mId = metal.symbol;
        const mValence = metal.valence[0]; // preferring primary valence

        let productFormula = "";
        let equation = "";

        if (mValence === 1) { // Na2O
           productFormula = `${mId}₂O`;
           equation = `4${mId} + O₂ → 2${productFormula}`;
        } else if (mValence === 2) { // MgO
           productFormula = `${mId}O`;
           equation = `2${mId} + O₂ → 2${productFormula}`;
        } else if (mValence === 3) { // Al2O3
           productFormula = `${mId}₂O₃`;
           equation = `4${mId} + 3O₂ → 2${productFormula}`;
        }

        // Gold/Platinum avoid oxidation easily
        if ((metal.symbol === 'Au' || metal.symbol === 'Pt') && temperature < 2000) {
            return {
              reactionOccurred: false,
              productName: "No reaction",
              chemicalEquation: "",
              explanation: `${metal.symbol} is a noble metal and highly resistant to oxidation under normal heating.`,
              bondsFormed: []
            };
        }

        return {
           reactionOccurred: true,
           productName: `${(isM1 ? reactantNames[0] : reactantNames[1]).charAt(0).toUpperCase() + (isM1 ? reactantNames[0] : reactantNames[1]).slice(1)} Oxide`,
           chemicalEquation: equation,
           explanation: temperature > 300 
             ? `When heated, ${metal.symbol} reacts with Oxygen to form a metallic oxide lattice. Each ${metal.symbol} atom loses ${mValence} electron(s), and each Oxygen atom gains 2 electrons to complete its valence shell.`
             : `Over time, ${metal.symbol} slowly oxidizes in air to form a ceramic oxide layer. Heat usually accelerates this process rapidly. Each ${metal.symbol} atom loses ${mValence} electron(s), and each Oxygen atom gains 2 electrons.`,
           bondsFormed: [`Ionic ${metal.symbol}⁺-O²⁻`],
           reactionType: "exothermic"
        };
    }
  }

  // Fallback for combined arrays of unspecced rules
  return {
    reactionOccurred: false,
    productName: "No reaction",
    chemicalEquation: "",
    explanation: "These elements do not react under these conditions, or require extreme thresholds not specified. Try combining a metal with a halogen (e.g. Sodium + Chlorine), or Hydrogen and Oxygen with heat.",
    bondsFormed: []
  };
}
