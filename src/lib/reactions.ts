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
  phosphorus: { symbol: 'P', category: 'nonmetal', valence: [3, 5] },
  silicon: { symbol: 'Si', category: 'metalloid', valence: [4] },

  iron: { symbol: 'Fe', category: 'transition metal', valence: [2, 3] },
  copper: { symbol: 'Cu', category: 'transition metal', valence: [1, 2] },
  zinc: { symbol: 'Zn', category: 'transition metal', valence: [2] },
  silver: { symbol: 'Ag', category: 'transition metal', valence: [1] },
  gold: { symbol: 'Au', category: 'transition metal', valence: [3] },
  platinum: { symbol: 'Pt', category: 'transition metal', valence: [2, 4] },
  nickel: { symbol: 'Ni', category: 'transition metal', valence: [2] },
  cobalt: { symbol: 'Co', category: 'transition metal', valence: [2, 3] },
  manganese: { symbol: 'Mn', category: 'transition metal', valence: [2, 4, 7] },
  chromium: { symbol: 'Cr', category: 'transition metal', valence: [2, 3, 6] },
  titanium: { symbol: 'Ti', category: 'transition metal', valence: [4] },

  aluminum: { symbol: 'Al', category: 'post-transition metal', valence: [3] },
  gallium: { symbol: 'Ga', category: 'post-transition metal', valence: [3] },
  lead: { symbol: 'Pb', category: 'post-transition metal', valence: [2, 4] },
  tin: { symbol: 'Sn', category: 'post-transition metal', valence: [2, 4] }
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

  if (elementStr === "phosphorus-sulfur") {
    const pQty = getQty("phosphorus");
    const sQty = getQty("sulfur");
    if (pQty === 4 && sQty === 10) {
      return {
        reactionOccurred: true,
        productName: "Phosphorus Pentasulfide (P₄S₁₀)",
        chemicalEquation: "4P + 10S → P₄S₁₀",
        explanation: "Phosphorus and sulfur react to form phosphorus pentasulfide, used in the production of pesticides and matches.",
        bondsFormed: ["Covalent P-S"],
        reactionType: "exothermic"
      };
    }
    return {
      reactionOccurred: false,
      productName: "Stoichiometry Mismatch",
      chemicalEquation: "",
      explanation: `Phosphorus and sulfur commonly form P₄S₁₀. This requires a 4:10 ratio of P to S. You provided ${pQty} P and ${sQty} S.`,
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

  if (elementStr === "calcium-carbon-oxygen") {
    return {
      reactionOccurred: true,
      productName: "Calcium Carbonate (CaCO₃)",
      chemicalEquation: "2Ca + 2C + 3O₂ → 2CaCO₃",
      explanation: "Calcium reacts with carbon and oxygen at high temperatures to form calcium carbonate, the main component of limestone, shells, and chalk. This is a complex reaction typically involving intermediate oxides.",
      bondsFormed: ["Ionic Ca²⁺ - [CO₃]²⁻", "Covalent C-O"],
      reactionType: "exothermic"
    };
  }

  if (elementStr === "hydrogen-oxygen-sulfur") {
    return {
      reactionOccurred: true,
      productName: "Sulfuric Acid (H₂SO₄)",
      chemicalEquation: "2S + 3O₂ + 2H₂O → 2H₂SO₄",
      explanation: "Sulfur, oxygen, and hydrogen (in the form of water) react to form sulfuric acid, a highly corrosive strong acid. This is an oversimplified summary of the contact process.",
      bondsFormed: ["Covalent S=O", "Covalent S-O-H"],
      reactionType: "exothermic"
    };
  }

  if (elementStr === "carbon-hydrogen-oxygen") {
    return {
      reactionOccurred: true,
      productName: "Glucose (C₆H₁₂O₆)",
      chemicalEquation: "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂",
      explanation: "In nature, carbon dioxide and water (comprising carbon, hydrogen, and oxygen) are synthesized into glucose through photosynthesis using sunlight energy. This is an endothermic process.",
      bondsFormed: ["Covalent C-C", "Covalent C-H", "Covalent C-O"],
      reactionType: "endothermic"
    };
  }

  if (elementStr === "nitrogen-oxygen-sodium") {
    return {
      reactionOccurred: true,
      productName: "Sodium Nitrate (NaNO₃)",
      chemicalEquation: "2Na + N₂ + 3O₂ → 2NaNO₃",
      explanation: "Sodium reacts with nitrogen and oxygen to form sodium nitrate, a highly soluble salt used in fertilizers and explosives.",
      bondsFormed: ["Ionic Na⁺ - [NO₃]⁻", "Covalent N-O"],
      reactionType: "exothermic"
    };
  }

  if (elementStr === "chlorine-hydrogen") {
    return {
      reactionOccurred: true,
      productName: "Hydrochloric Acid (HCl)",
      chemicalEquation: "H₂ + Cl₂ → 2HCl",
      explanation: "Hydrogen gas reacts with chlorine gas, especially in the presence of UV light, to form hydrogen chloride gas, which dissolves in water to become hydrochloric acid.",
      bondsFormed: ["Covalent H-Cl (Polar)"],
      reactionType: "exothermic"
    };
  }

  if (elementStr === "hydrogen-sulfur") {
    return {
      reactionOccurred: true,
      productName: "Hydrogen Sulfide (H₂S)",
      chemicalEquation: "H₂ + S → H₂S",
      explanation: "Hydrogen reacts with molten sulfur to form hydrogen sulfide, a toxic gas with a characteristic foul odor of rotten eggs.",
      bondsFormed: ["Covalent H-S"],
      reactionType: "exothermic"
    };
  }

  if (elementStr === "hydrogen-nitrogen-oxygen") {
    return {
      reactionOccurred: true,
      productName: "Nitric Acid (HNO₃)",
      chemicalEquation: "2H₂O + 4NO₂ + O₂ → 4HNO₃",
      explanation: "Nitrogen dioxide, oxygen, and water react to form nitric acid. This happens in the atmosphere to form acid rain and in industrial production via the Ostwald process.",
      bondsFormed: ["Covalent N-O", "Covalent O-H"],
      reactionType: "exothermic"
    };
  }

  if (elementStr === "carbon-oxygen-sodium") {
    return {
      reactionOccurred: true,
      productName: "Sodium Carbonate (Na₂CO₃)",
      chemicalEquation: "4Na + 3O₂ + 2C → 2Na₂CO₃",
      explanation: "Sodium reacts with carbon and oxygen to form sodium carbonate (washing soda).",
      bondsFormed: ["Ionic Na⁺ - [CO₃]²⁻", "Covalent C-O"],
      reactionType: "exothermic"
    };
  }

  if (elementStr === "carbon-hydrogen") {
    return {
      reactionOccurred: true,
      productName: "Methane (CH₄)",
      chemicalEquation: "C + 2H₂ → CH₄",
      explanation: "Carbon reacts with hydrogen under specific catalysts and high pressure to form methane, the simplest alkane and main component of natural gas.",
      bondsFormed: ["Covalent C-H"],
      reactionType: "exothermic"
    };
  }

  if (elementStr === "chlorine-oxygen-sodium") {
    return {
      reactionOccurred: true,
      productName: "Sodium Hypochlorite (NaClO)",
      chemicalEquation: "2NaOH + Cl₂ → NaCl + NaClO + H₂O",
      explanation: "When chlorine gas reacts with a cold, dilute solution of sodium hydroxide (comprising sodium, oxygen, and hydrogen), sodium hypochlorite (the active ingredient in bleach) is formed. Adding sodium, chlorine, and oxygen can conceptually yield this salt.",
      bondsFormed: ["Ionic Na⁺ - [ClO]⁻", "Covalent Cl-O"],
      reactionType: "exothermic"
    };
  }

  if (elementStr === "carbon-copper-oxygen") {
    return {
      reactionOccurred: true,
      productName: "Copper(II) Carbonate (CuCO₃)",
      chemicalEquation: "2Cu + O₂ + CO₂ + H₂O → Cu₂(OH)₂CO₃",
      explanation: "Over a long period, copper reacts with carbon dioxide and oxygen (and moisture) to form basic copper carbonate, which is the green patina seen on old copper roofs and the Statue of Liberty.",
      bondsFormed: ["Ionic Cu²⁺ - [CO₃]²⁻", "Covalent C-O"],
      reactionType: "exothermic"
    };
  }

  if (elementStr === "hydrogen-iron-oxygen") {
    return {
      reactionOccurred: true,
      productName: "Iron(III) Hydroxide / Rust (Fe(OH)₃)",
      chemicalEquation: "4Fe + 3O₂ + 6H₂O → 4Fe(OH)₃",
      explanation: "Iron undergoes an oxidation-reduction reaction in the presence of oxygen and water (contains hydrogen and oxygen) to form rust.",
      bondsFormed: ["Ionic Fe³⁺ - [OH]⁻", "Covalent O-H"],
      reactionType: "exothermic"
    };
  }

  // 2. Generalized Rule Engine (Handles realistic permutations dynamically)
  
  if (elementStr === "calcium-carbon-hydrogen-oxygen") {
    const caQty = getQty("calcium");
    const cQty = getQty("carbon");
    const hQty = getQty("hydrogen");
    const oQty = getQty("oxygen");

    if (caQty === 1 && cQty === 2 && hQty === 2 && oQty === 6) {
      return {
        reactionOccurred: true,
        productName: "Calcium Bicarbonate (Ca(HCO₃)₂)",
        chemicalEquation: "Ca + 2C + H₂ + 3O₂ → Ca(HCO₃)₂",
        explanation: "Calcium, carbon, hydrogen, and oxygen can form calcium bicarbonate. In nature, it forms when water containing dissolved carbon dioxide reacts with calcium carbonate.",
        bondsFormed: ["Ionic Ca²⁺ - [HCO₃]⁻", "Covalent C-O", "Covalent O-H"],
        reactionType: "exothermic"
      };
    }
  }

  if (elementStr === "carbon-hydrogen-oxygen-sodium") {
    const naQty = getQty("sodium");
    const cQty = getQty("carbon");
    const hQty = getQty("hydrogen");
    const oQty = getQty("oxygen");
    if (naQty === 1 && cQty === 1 && hQty === 1 && oQty === 3) {
      return {
        reactionOccurred: true,
        productName: "Sodium Bicarbonate (NaHCO₃)",
        chemicalEquation: "Na + C + H + 3O → NaHCO₃",
        explanation: "Sodium, carbon, hydrogen, and oxygen form Sodium Bicarbonate, commonly known as baking soda.",
        bondsFormed: ["Ionic Na⁺ - [HCO₃]⁻", "Covalent C-O", "Covalent O-H"],
        reactionType: "exothermic"
      };
    }
  }

  if (elementStr === "copper-oxygen-sulfur") {
    return {
      reactionOccurred: true,
      productName: "Copper(II) Sulfate (CuSO₄)",
      chemicalEquation: "Cu + S + 2O₂ → CuSO₄",
      explanation: "Copper, sulfur, and oxygen can form Copper(II) Sulfate, a bright blue crystalline solid.",
      bondsFormed: ["Ionic Cu²⁺ - [SO₄]²⁻", "Covalent S-O"],
      reactionType: "exothermic"
    };
  }

  if (elementStr === "calcium-oxygen-sulfur") {
    return {
      reactionOccurred: true,
      productName: "Calcium Sulfate (CaSO₄)",
      chemicalEquation: "Ca + S + 2O₂ → CaSO₄",
      explanation: "Calcium, sulfur, and oxygen form Calcium Sulfate, which is the main component of plaster and gypsum.",
      bondsFormed: ["Ionic Ca²⁺ - [SO₄]²⁻", "Covalent S-O"],
      reactionType: "exothermic"
    };
  }

  if (elementStr === "nitrogen-oxygen-potassium") {
    return {
      reactionOccurred: true,
      productName: "Potassium Nitrate (KNO₃)",
      chemicalEquation: "2K + N₂ + 3O₂ → 2KNO₃",
      explanation: "Potassium, nitrogen, and oxygen can form Potassium Nitrate, known as saltpeter, historically used in gunpowder.",
      bondsFormed: ["Ionic K⁺ - [NO₃]⁻", "Covalent N-O"],
      reactionType: "exothermic"
    };
  }

  if (elementStr === "hydrogen-oxygen-phosphorus") {
    return {
      reactionOccurred: true,
      productName: "Phosphoric Acid (H₃PO₄)",
      chemicalEquation: "4P + 5O₂ + 6H₂O → 4H₃PO₄",
      explanation: "Phosphorus, oxygen, and hydrogen form Phosphoric Acid, used in fertilizers and soft drinks.",
      bondsFormed: ["Covalent P=O", "Covalent P-O-H"],
      reactionType: "exothermic"
    };
  }

  if (elementStr === "hydrogen-oxygen-potassium") {
    return {
      reactionOccurred: true,
      productName: "Potassium Hydroxide (KOH)",
      chemicalEquation: "2K + 2H₂O → 2KOH + H₂",
      explanation: "Potassium reacts vigorously with water (hydrogen and oxygen) to form Potassium Hydroxide.",
      bondsFormed: ["Ionic K⁺ - [OH]⁻", "Covalent O-H"],
      reactionType: "exothermic"
    };
  }

  if (elementStr === "chlorine-hydrogen-oxygen") {
    return {
       reactionOccurred: true,
       productName: "Perchloric Acid (HClO₄)",
       chemicalEquation: "H₂ + Cl₂ + 4O₂ → 2HClO₄",
       explanation: "Hydrogen, chlorine, and oxygen can form Perchloric Acid, a highly corrosive and oxidizing strong acid.",
       bondsFormed: ["Covalent Cl-O", "Covalent O-H"],
       reactionType: "exothermic"
    };
  }

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
    // Nonmetal + Halogen
    const isNm1 = el1.category.includes('nonmetal') || el1.category.includes('metalloid');
    const isNm2 = el2.category.includes('nonmetal') || el2.category.includes('metalloid');
    
    if ((isNm1 && isH2) || (isNm2 && isH1)) {
       const nonmetal = isNm1 ? el1 : el2;
       const halogen = isNm1 ? el2 : el1;
       
       // Avoid matching if both are halogens or hydrogen (handled differently or skip)
       if (nonmetal.symbol !== halogen.symbol && nonmetal.symbol !== 'H' && nonmetal.symbol !== 'O') {
         const nmValence = nonmetal.valence[nonmetal.valence.length - 1]; // Use highest valence for now
         const productFormula = `${nonmetal.symbol}${halogen.symbol}${getSubscript(nmValence)}`;
         
         return {
           reactionOccurred: true,
           productName: `${nonmetal.symbol} Halide`,
           chemicalEquation: `2${nonmetal.symbol} + ${nmValence}${halogen.symbol}₂ → 2${productFormula}`,
           explanation: `${nonmetal.symbol} reacts covalently with ${halogen.symbol} to form a molecular halide.`,
           bondsFormed: [`Covalent ${nonmetal.symbol}-${halogen.symbol}`],
           reactionType: "exothermic"
         };
       }
    }

    // Nonmetal + Oxygen (excluding hydrogen and carbon which are handled above, and oxygen itself)
    if ((isNm1 && isO2) || (isNm2 && isO1)) {
        const nonmetal = isNm1 ? el1 : el2;
        if (nonmetal.symbol !== 'O' && nonmetal.symbol !== 'C' && nonmetal.symbol !== 'H' && nonmetal.symbol !== 'N') {
            const nmValence = nonmetal.valence[nonmetal.valence.length - 1];
            
            let productFormula = "";
            let equation = "";
            if (nmValence === 2) {
               productFormula = `${nonmetal.symbol}O`;
               equation = `2${nonmetal.symbol} + O₂ → 2${productFormula}`;
            } else if (nmValence === 3) {
               productFormula = `${nonmetal.symbol}₂O₃`;
               equation = `4${nonmetal.symbol} + 3O₂ → 2${productFormula}`;
            } else if (nmValence === 4) {
               productFormula = `${nonmetal.symbol}O₂`;
               equation = `${nonmetal.symbol} + O₂ → ${productFormula}`;
            } else if (nmValence === 5) {
               productFormula = `${nonmetal.symbol}₂O₅`;
               equation = `4${nonmetal.symbol} + 5O₂ → 2${productFormula}`;
            } else if (nmValence === 6) {
               productFormula = `${nonmetal.symbol}O₃`;
               equation = `2${nonmetal.symbol} + 3O₂ → 2${productFormula}`;
            } else {
               productFormula = `${nonmetal.symbol}O_{x}`;
               equation = `${nonmetal.symbol} + Oxygen → ${productFormula}`;
            }
            
            return {
               reactionOccurred: true,
               productName: `${nonmetal.symbol} Oxide`,
               chemicalEquation: equation,
               explanation: `${nonmetal.symbol} reacts with Oxygen to form a covalent network or molecular oxide.`,
               bondsFormed: [`Covalent ${nonmetal.symbol}-O`],
               reactionType: "exothermic"
            };
        }
    }
    // Generic Nonmetal + Nonmetal
    if (isNm1 && isNm2 && !isO1 && !isO2 && !isH1 && !isH2) {
       // Since it's a fallback and not specifically halogens/oxygen
       // Example: P + S, C + S -> CS2, etc.
       const nm1 = el1;
       const nm2 = el2;
       
       if (nm1.symbol !== nm2.symbol && nm1.symbol !== 'H' && nm2.symbol !== 'H') {
           const val1 = nm1.valence[nm1.valence.length - 1] || 1;
           const val2 = nm2.valence[nm2.valence.length - 1] || 1;
           
           // Super simplified formula building
           let productFormula = "";
           if (val1 === val2) {
               productFormula = `${nm1.symbol}${nm2.symbol}`;
           } else {
               productFormula = `${nm1.symbol}${getSubscript(val2)}${nm2.symbol}${getSubscript(val1)}`;
           }

           return {
               reactionOccurred: true,
               productName: `Covalent ${nm1.symbol}-${nm2.symbol} Compound`,
               chemicalEquation: `${val2}${nm1.symbol} + ${val1}${nm2.symbol} → ${productFormula}`,
               explanation: `${nm1.symbol} and ${nm2.symbol} can bond covalently to form a resulting molecular compound. Note: Stoichiometry can vary significantly based on reaction conditions.`,
               bondsFormed: [`Covalent ${nm1.symbol}-${nm2.symbol}`],
               reactionType: "exothermic"
           };
       }
    }
  }

  if (uniqueReactantNames.length === 3) {
    const el1 = elementsData[uniqueReactantNames[0]];
    const el2 = elementsData[uniqueReactantNames[1]];
    const el3 = elementsData[uniqueReactantNames[2]];

    if (el1 && el2 && el3) {
      const isMetal = (el: any) => el.category.includes('metal') && !el.category.includes('nonmetal');
      const isHalogen = (el: any) => el.category === 'halogen';
      
      const elements = [el1, el2, el3];
      const metal = elements.find(isMetal);
      const hydrogen = elements.find(el => el.symbol === 'H');
      const halogen = elements.find(isHalogen);
      const oxygen = elements.find(el => el.symbol === 'O');
      const carbon = elements.find(el => el.symbol === 'C');
      const sulfur = elements.find(el => el.symbol === 'S');
      const nitrogen = elements.find(el => el.symbol === 'N');

      // Metal + Acid (Hydrogen + Halogen, e.g., HCl)
      if (metal && hydrogen && halogen) {
        // Exclude noble metals from reacting with simple acids easily
        if (['Au', 'Pt', 'Ag', 'Cu'].includes(metal.symbol)) {
          return {
            reactionOccurred: false,
            productName: "No reaction",
            chemicalEquation: "",
            explanation: `${metal.symbol} is relatively unreactive and does not easily displace hydrogen from acids like H${halogen.symbol}.`,
            bondsFormed: []
          };
        }

        const mId = metal.symbol;
        const hId = halogen.symbol;
        const mValence = metal.valence[0];
        
        const productFormula = mValence === 1 ? `${mId}${hId}` : `${mId}${hId}${getSubscript(mValence)}`;
        
        let equation = "";
        if (mValence === 1) {
          equation = `2${mId} + 2H${hId} → 2${productFormula} + H₂`;
        } else if (mValence === 2) {
          equation = `${mId} + 2H${hId} → ${productFormula} + H₂`;
        } else {
          equation = `2${mId} + 6H${hId} → 2${productFormula} + 3H₂`;
        }

        return {
          reactionOccurred: true,
          productName: `${metal.symbol} Halide and Hydrogen Gas`,
          chemicalEquation: equation,
          explanation: `The metal (${metal.symbol}) reacts with the acid (H${halogen.symbol}) in a single displacement reaction. The metal displaces hydrogen, forming a metal halide salt and releasing hydrogen gas.`,
          bondsFormed: [`Ionic ${metal.symbol}⁺-${halogen.symbol}⁻`, `Covalent H-H`],
          reactionType: "exothermic"
        };
      }

      // Complex Oxides: Metal Carbonate, Sulfate, Nitrate
      if (metal && oxygen) {
        const mId = metal.symbol;
        const mValence = metal.valence[0];

        // Metal Carbonate (Metal + Carbon + Oxygen)
        if (carbon) {
           let productFormula = "";
           let equation = "";
           if (mValence === 1) { // Na2CO3
             productFormula = `${mId}₂CO₃`;
             equation = `4${mId} + 2C + 3O₂ → 2${productFormula}`;
           } else if (mValence === 2) { // CaCO3
             productFormula = `${mId}CO₃`;
             equation = `2${mId} + 2C + 3O₂ → 2${productFormula}`;
           } else if (mValence === 3) { // Al2(CO3)3
             productFormula = `${mId}₂(CO₃)₃`;
             equation = `4${mId} + 6C + 9O₂ → 2${productFormula}`;
           }

           return {
             reactionOccurred: true,
             productName: `Metal Carbonate (${productFormula})`,
             chemicalEquation: equation,
             explanation: `${metal.symbol} reacts with carbon and oxygen to form a metal carbonate. This represents a complex oxidation forming ionic bonds between the metal cation and the carbonate polyatomic anion.`,
             bondsFormed: [`Ionic ${metal.symbol}⁺ - [CO₃]²⁻`, `Covalent C-O`],
             reactionType: "exothermic"
           };
        }

        // Metal Sulfate (Metal + Sulfur + Oxygen)
        if (sulfur) {
           let productFormula = "";
           let equation = "";
           if (mValence === 1) { // Na2SO4
             productFormula = `${mId}₂SO₄`;
             equation = `2${mId} + S + 2O₂ → ${productFormula}`;
           } else if (mValence === 2) { // CaSO4
             productFormula = `${mId}SO₄`;
             equation = `${mId} + S + 2O₂ → ${productFormula}`;
           } else if (mValence === 3) { // Al2(SO4)3
             productFormula = `${mId}₂(SO₄)₃`;
             equation = `2${mId} + 3S + 6O₂ → ${productFormula}`;
           }

           return {
             reactionOccurred: true,
             productName: `Metal Sulfate (${productFormula})`,
             chemicalEquation: equation,
             explanation: `${metal.symbol} reacts with sulfur and oxygen to form a metal sulfate. The sulfate ion is a polyatomic anion that forms strong ionic bonds with the metal cation.`,
             bondsFormed: [`Ionic ${metal.symbol}⁺ - [SO₄]²⁻`, `Covalent S-O`],
             reactionType: "exothermic"
           };
        }

        // Metal Nitrate (Metal + Nitrogen + Oxygen)
        if (nitrogen) {
           let productFormula = "";
           let equation = "";
           if (mValence === 1) { // NaNO3
             productFormula = `${mId}NO₃`;
             equation = `2${mId} + N₂ + 3O₂ → 2${productFormula}`;
           } else if (mValence === 2) { // Ca(NO3)2
             productFormula = `${mId}(NO₃)₂`;
             equation = `${mId} + N₂ + 3O₂ → ${productFormula}`;
           } else if (mValence === 3) { // Al(NO3)3
             productFormula = `${mId}(NO₃)₃`;
             equation = `4${mId} + 6N₂ + 18O₂ → 4${productFormula}`;
           }

           return {
             reactionOccurred: true,
             productName: `Metal Nitrate (${productFormula})`,
             chemicalEquation: equation,
             explanation: `${metal.symbol} reacts with nitrogen and oxygen to form a metal nitrate. Nitrates are highly soluble salts containing the nitrate polyatomic ion.`,
             bondsFormed: [`Ionic ${metal.symbol}⁺ - [NO₃]⁻`, `Covalent N-O`],
             reactionType: "exothermic"
           };
        }
      }
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
