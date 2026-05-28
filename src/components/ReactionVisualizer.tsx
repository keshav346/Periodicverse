import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Cylinder, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ElementData } from '../types';
import { audioController } from '../lib/audio';

interface ReactionVisualizerProps {
  reactants: ElementData[];
  reactionOccurred: boolean;
  bondsFormed?: string[];
}

// Basic CPK coloring mapping
const cpkColors: Record<string, string> = {
  H: '#ffffff',
  C: '#909090',
  O: '#ff0d0d',
  N: '#3050f8',
  S: '#ffff30',
  P: '#ff8000',
  Cl: '#1ff01f',
  F: '#90e050',
  Br: '#a62929',
  I: '#940094',
  Na: '#ab5cf2',
  Mg: '#8aff00',
  Fe: '#e06633',
  Ca: '#3dff00',
};

function getAtomColor(symbol: string, category: string) {
  if (cpkColors[symbol]) return cpkColors[symbol];
  if (category.includes('alkali')) return '#ab5cf2';
  if (category.includes('transition')) return '#e06633';
  if (category.includes('noble')) return '#36f0db';
  if (category.includes('nonmetal')) return '#f0f0f0';
  return '#909090'; // Default gray
}

export default function ReactionVisualizer({ reactants, reactionOccurred, bondsFormed }: ReactionVisualizerProps) {
  // If no reactants, don't render canvas
  if (reactants.length === 0) return null;

  return (
    <div className="w-full h-full min-h-[300px] w-full rounded-xl overflow-hidden bg-slate-900 border border-white/10 relative">
      <Canvas camera={{ position: [0, 2, 10], fov: 45 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Stars radius={50} depth={50} count={500} factor={2} fade speed={0.5} />
        
        <Scene reactants={reactants} reactionOccurred={reactionOccurred} bondsFormed={bondsFormed} />
        
        <OrbitControls enablePan={true} autoRotate={reactionOccurred} autoRotateSpeed={2} maxDistance={20} minDistance={2} />
      </Canvas>
    </div>
  );
}

function Scene({ reactants, reactionOccurred, bondsFormed }: { reactants: ElementData[], reactionOccurred: boolean, bondsFormed?: string[] }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create stable positions and properties for the atoms
  const atoms = useMemo(() => {
    // Sort atoms to find the most likely central atom (lowest count, typically not Hydrogen)
    const counts: Record<string, number> = {};
    reactants.forEach(r => counts[r.symbol] = (counts[r.symbol] || 0) + 1);
    
    const sortedReactants = [...reactants].sort((a, b) => {
      if (counts[a.symbol] !== counts[b.symbol]) {
        return counts[a.symbol] - counts[b.symbol];
      }
      if (a.symbol === 'H') return 1;
      if (b.symbol === 'H') return -1;
      return (a.electronegativity_pauling || 0) - (b.electronegativity_pauling || 0);
    });

    return sortedReactants.map((el, i) => {
      // Unreacted: spread out
      const angle = (i / sortedReactants.length) * Math.PI * 2;
      const unreactedRadius = 4 + Math.random() * 2;
      
      const uX = Math.cos(angle) * unreactedRadius;
      const uY = (Math.random() - 0.5) * 4;
      const uZ = Math.sin(angle) * unreactedRadius;
      
      let rX, rY, rZ;
      if (sortedReactants.length === 1) { rX = 0; rY = 0; rZ = 0; }
      else if (sortedReactants.length === 2) { 
        rX = (i === 0 ? -1 : 1) * 1.2; 
        rY = 0; 
        rZ = 0; 
      }
      else {
         // rough star/cluster
         if (i === 0) { rX = 0; rY = 0; rZ = 0; } // central atom
         else {
             const numSurrounding = sortedReactants.length - 1;
             if (numSurrounding === 2) {
                 // For 3 atoms, decide if Bent or Linear based on center atom (index 0)
                 const centerSymbol = sortedReactants[0].symbol;
                 const isBent = centerSymbol === 'O' || centerSymbol === 'S';
                 const bondAngle = isBent ? Math.PI * 0.6 : Math.PI; // ~108 deg for bent, 180 for linear
                 const angleOffset = (i === 1) ? bondAngle / 2 : -bondAngle / 2;
                 rX = Math.sin(angleOffset) * 1.5;
                 rY = -Math.cos(angleOffset) * 1.5 + (isBent ? 0.5 : 0);
                 rZ = 0;
             } else {
                 const a = ((i-1) / (sortedReactants.length-1)) * Math.PI * 2;
                 rX = Math.cos(a) * 1.5;
                 rY = (Math.random() - 0.5) * 0.5;
                 rZ = Math.sin(a) * 1.5;
             }
         }
      }

      const size = 0.4 + ((el.atomic_mass || 12) / 200) * 0.6; // Scale slightly by mass
      const color = getAtomColor(el.symbol, el.category || '');

      return {
        id: el.symbol + i,
        symbol: el.symbol,
        size,
        color,
        electronegativity: el.electronegativity_pauling || (el.category && el.category.includes('alkali') ? 0.9 : 3.0),
        shells: el.shells || [1],
        unreactedPos: new THREE.Vector3(uX, uY, uZ),
        reactedPos: new THREE.Vector3(rX, rY, rZ),
        currentPos: new THREE.Vector3(uX, uY, uZ),
      };
    });
  }, [reactants]);

  // Generate bonds (just simple lines between atoms if reacted)
  const bonds = useMemo(() => {
    if (atoms.length < 2) return [];
    const newBonds = [];
    if (atoms.length === 2) {
      newBonds.push([0, 1]);
    } else {
      for (let i = 1; i < atoms.length; i++) {
        newBonds.push([0, i]); // Star topology: all connect to center
      }
    }
    return newBonds;
  }, [atoms]);

  // Animation frame to interpolate positions
  useFrame((state, delta) => {
    if (groupRef.current) {
        if (!reactionOccurred) {
          groupRef.current.rotation.y += delta * 0.2;
          groupRef.current.rotation.z += delta * 0.1;
        }
    }

    const t = 1.0 - Math.pow(0.01, delta); // frame rate independent lerp
    atoms.forEach(atom => {
      const target = reactionOccurred ? atom.reactedPos : atom.unreactedPos;
      atom.currentPos.lerp(target, reactionOccurred ? t * 4 : t * 2);
    });
  });

  return (
    <group ref={groupRef}>
      {/* Atoms */}
      {atoms.map((atom, i) => (
        <AtomNode key={atom.id} atom={atom} />
      ))}
      
      {/* Bonds */}
      {bonds.map((bond, idx) => {
        const bondType = bondsFormed && bondsFormed.length > 0 
          ? (bondsFormed[0].toLowerCase().includes('ionic') ? 'ionic' : 'covalent') 
          : 'covalent';
        
        return (
          <BohrBond key={'bond' + idx} atomA={atoms[bond[0]]} atomB={atoms[bond[1]]} bondType={bondType} active={reactionOccurred} />
        );
      })}
    </group>
  );
}

function AtomNode({ atom }: { atom: any }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.copy(atom.currentPos);
      groupRef.current.rotation.y += delta * 0.5;
      groupRef.current.rotation.x += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Nucleus */}
      <Sphere args={[atom.size * 0.5, 32, 32]}>
        <meshPhysicalMaterial 
          color={atom.color} 
          roughness={0.2} 
          metalness={0.4} 
        />
      </Sphere>
      
      {/* Electron Shells */}
      {atom.shells && atom.shells.map((count: number, idx: number) => (
        <ElectronShell key={idx} radius={(idx + 1) * 0.5 + atom.size * 0.5} count={count} index={idx} />
      ))}
    </group>
  );
}

function ElectronShell({ radius, count, index }: { radius: number, count: number, index: number }) {
  const ref = useRef<THREE.Group>(null);
  
  // Stagger rotation starting points based on index
  const initialRotX = (index % 2 === 0) ? Math.PI/4 : -Math.PI/4;
  const initialRotZ = (index % 3 === 0) ? Math.PI/6 : Math.PI/3;

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y -= delta * (1.5 - index * 0.2); // inner rings faster
    }
  });

  const electrons = Array.from({ length: Math.min(count, 32) }); // Cap display electrons to 32 per shell for performance

  return (
    <group ref={ref} rotation={[initialRotX, 0, initialRotZ]}>
      {/* Orbit path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.015, radius + 0.015, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Electrons */}
      {electrons.map((_, i) => {
        const angle = (i / electrons.length) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color="#a0e0ff" />
          </mesh>
        );
      })}
    </group>
  );
}

function BohrBond({ atomA, atomB, bondType, active }: { atomA: any, atomB: any, bondType: string, active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const covalentElectronGroupRef = useRef<THREE.Group>(null);
  const electron1Ref = useRef<THREE.Mesh>(null);
  const electron2Ref = useRef<THREE.Mesh>(null);
  const ionicElectronRef = useRef<THREE.Mesh>(null);
  const shatterGroupRef = useRef<THREE.Group>(null);
  const sparksGroupRef = useRef<THREE.Group>(null);
  
  const progress = useRef(0);
  const velocity = useRef(0);
  const migrationProgress = useRef(0);
  const [shatterParts, setShatterParts] = React.useState<any[]>([]);
  const [sparkParts, setSparkParts] = React.useState<any[]>([]);

  const isIonic = bondType === 'ionic';
  
  const donorAtom = React.useMemo(() => {
    return atomA.electronegativity < atomB.electronegativity ? atomA : atomB;
  }, [atomA, atomB]);
  
  const acceptorAtom = React.useMemo(() => {
    return donorAtom.id === atomA.id ? atomB : atomA;
  }, [donorAtom, atomA, atomB]);

  const prevActive = useRef(active);

  React.useEffect(() => {
    if (prevActive.current && !active) {
       // Just shattered
       audioController.playShatter();
       const parts = Array.from({ length: 15 }).map(() => ({
         velocity: new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5 + 1, (Math.random() - 0.5) * 5),
         rotVelocity: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
         position: new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5),
         scale: Math.random() * 0.04 + 0.01
       }));
       setShatterParts(parts);
       progress.current = 0;
       velocity.current = 0;
       migrationProgress.current = 0;
    } else if (!prevActive.current && active) {
       audioController.playClink();
       setShatterParts([]);
       
       const pA = atomA.currentPos;
       const pB = atomB.currentPos;
       const dir = pB.clone().sub(pA).length() > 0 ? pB.clone().sub(pA).normalize() : new THREE.Vector3(1, 0, 0);
       const sParts = [];
       // Spark at Atom A's contact point
       for(let i=0; i<15; i++) {
         sParts.push({
           position: pA.clone().add(dir.clone().multiplyScalar(atomA.size * 0.9)),
           velocity: new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6).add(dir.clone().multiplyScalar(2)),
           scale: Math.random() * 0.04 + 0.02,
         });
       }
       // Spark at Atom B's contact point
       for(let i=0; i<15; i++) {
         sParts.push({
           position: pB.clone().add(dir.clone().multiplyScalar(-atomB.size * 0.9)),
           velocity: new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6).add(dir.clone().multiplyScalar(-2)),
           scale: Math.random() * 0.04 + 0.02,
         });
       }
       setSparkParts(sParts);
       progress.current = 0;
       velocity.current = 0;
       migrationProgress.current = 0;
    }
    prevActive.current = active;
  }, [active, atomA, atomB]);
  
  const textGroupRef = useRef<THREE.Group>(null);
  const textMeshRef = useRef<any>(null);

  useFrame((state, delta) => {
    const posA = atomA.currentPos;
    const posB = atomB.currentPos;
    const actualDistance = posA.distanceTo(posB);
    const midpoint = posA.clone().lerp(posB, 0.5);

    if (textGroupRef.current && active && migrationProgress.current >= 1) {
       textGroupRef.current.position.copy(midpoint);
       textGroupRef.current.position.y += 0.4;
       if (textMeshRef.current) {
          textMeshRef.current.text = `${(actualDistance*1.2).toFixed(2)} Å`;
       }
    }

    if (shatterGroupRef.current && shatterParts.length > 0) {
      shatterGroupRef.current.position.copy(midpoint);
      shatterGroupRef.current.children.forEach((child, idx) => {
         const part = shatterParts[idx];
         if (part) {
            child.position.addScaledVector(part.velocity, delta);
            child.rotation.x += part.rotVelocity.x * delta;
            child.rotation.y += part.rotVelocity.y * delta;
            child.rotation.z += part.rotVelocity.z * delta;
            part.velocity.y -= delta * 3; // gravity
            child.scale.multiplyScalar(0.92);
         }
      });
    }

    if (sparksGroupRef.current && sparkParts.length > 0) {
      sparksGroupRef.current.children.forEach((child, idx) => {
         const part = sparkParts[idx];
         if (part) {
            child.position.addScaledVector(part.velocity, delta);
            part.velocity.y -= delta * 2; // gravity
            child.scale.multiplyScalar(0.90);
         }
      });
    }

    if (!active) {
      if (groupRef.current) groupRef.current.visible = false;
      if (covalentElectronGroupRef.current) covalentElectronGroupRef.current.visible = false;
      if (ionicElectronRef.current) ionicElectronRef.current.visible = false;
      return;
    }

    if (groupRef.current) groupRef.current.visible = true;
    if (covalentElectronGroupRef.current) covalentElectronGroupRef.current.visible = true;
    if (ionicElectronRef.current) ionicElectronRef.current.visible = true;
    
    let mp = migrationProgress.current;
    if (isIonic) {
      if (mp < 1) {
        mp += delta * 1.5;
        migrationProgress.current = Math.min(mp, 1);
      }
    } else {
      migrationProgress.current = 1;
      mp = 1;
    }

    if (mp >= 1) {
      // Spring physics
      const stiffness = 80;
      const damping = 10;
      const force = stiffness * (1 - progress.current) - damping * velocity.current;
      velocity.current += force * delta;
      progress.current += velocity.current * delta;
    }
    
    const displayDistance = actualDistance * Math.max(0, progress.current);
    
    if (isIonic && ionicElectronRef.current) {
      const pA = donorAtom.currentPos;
      const pB = acceptorAtom.currentPos;
      
      const currentPos = pA.clone().lerp(pB, mp);
      // Small arc visually 
      currentPos.y += Math.sin(mp * Math.PI) * 1.0;
      
      ionicElectronRef.current.position.copy(currentPos);
      ionicElectronRef.current.visible = mp < 1;
    }
    
    if (groupRef.current) {
      const displayMidpoint = midpoint.clone();
      
      if (mp >= 1 && progress.current > 0.5) {
        const time = state.clock.elapsedTime;
        const intensity = Math.min((progress.current - 0.5) * 2, 1);
        const vibX = Math.sin(time * 50) * 0.015;
        const vibY = Math.cos(time * 45) * 0.015;
        const vibZ = Math.sin(time * 55) * 0.015;
        displayMidpoint.x += vibX * intensity;
        displayMidpoint.y += vibY * intensity;
        displayMidpoint.z += vibZ * intensity;
      }

      groupRef.current.position.copy(displayMidpoint);
      if (covalentElectronGroupRef.current) {
        covalentElectronGroupRef.current.position.copy(displayMidpoint);
      }
      
      if (actualDistance > 0.001) {
        const dir = posB.clone().sub(posA).normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        groupRef.current.quaternion.copy(quat);
        if (covalentElectronGroupRef.current) {
          covalentElectronGroupRef.current.quaternion.copy(quat);
        }
      }
      
      groupRef.current.scale.set(1, Math.max(0.01, displayDistance), 1);
      
      if (!isIonic && covalentElectronGroupRef.current) {
        const scaleX = displayDistance / 2;
        const scaleZ = atomA.size * 0.8;
        
        const time = state.clock.elapsedTime * 4;
        if (electron1Ref.current) {
           electron1Ref.current.position.x = 0;
           electron1Ref.current.position.y = Math.cos(time) * scaleX;
           electron1Ref.current.position.z = Math.sin(time) * scaleZ;
        }
        if (electron2Ref.current) {
           electron2Ref.current.position.x = 0;
           electron2Ref.current.position.y = Math.cos(time + Math.PI) * scaleX;
           electron2Ref.current.position.z = Math.sin(time + Math.PI) * scaleZ;
        }
      }

      if (materialRef.current) {
         const eDiff = Math.abs((atomA.electronegativity || 2) - (atomB.electronegativity || 2));
         const baseStrength = isIonic ? (eDiff + 0.5) : (2.5 - eDiff);
         const pulse = Math.sin(state.clock.elapsedTime * (3 + baseStrength)) * 0.3 + 0.7;
         materialRef.current.emissiveIntensity = baseStrength * pulse * (mp >= 1 ? 1 : mp);
      }
    }
  });

  const color = bondType === 'ionic' ? '#ab5cf2' : '#36f0db';

  return (
    <>
      <group ref={groupRef} visible={active}>
        <mesh className="BohrBond-component">
          <cylinderGeometry args={[0.04, 0.04, 1, 16]} />
          <meshStandardMaterial 
            ref={materialRef}
            color={color} 
            transparent 
            opacity={0.8} 
            roughness={0.2} 
            metalness={0.8} 
            emissive={bondType === 'ionic' ? '#7423c4' : '#148da6'}
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>
      
      {!isIonic && (
        <group ref={covalentElectronGroupRef} visible={active}>
          <mesh ref={electron1Ref}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#ffff00" />
          </mesh>
          <mesh ref={electron2Ref}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#ffff00" />
          </mesh>
        </group>
      )}

      {isIonic && (
        <mesh ref={ionicElectronRef} visible={active}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#ffff00" />
          <pointLight color="#ffff00" intensity={0.5} distance={2} />
        </mesh>
      )}
      
      {shatterParts.length > 0 && (
        <group ref={shatterGroupRef}>
          {shatterParts.map((part, idx) => (
             <mesh key={idx} position={part.position.clone()} scale={part.scale}>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial color={color} />
             </mesh>
          ))}
        </group>
      )}

      {sparkParts.length > 0 && (
        <group ref={sparksGroupRef}>
          {sparkParts.map((part, idx) => (
             <mesh key={idx} position={part.position.clone()} scale={part.scale}>
                <sphereGeometry args={[1, 8, 8]} />
                <meshBasicMaterial color="#ffffaa" />
             </mesh>
          ))}
        </group>
      )}

      {active && (
        <group ref={textGroupRef}>
          <Text ref={textMeshRef} fontSize={0.15} color="white" outlineColor="black" outlineWidth={0.02} anchorX="center" anchorY="bottom">
            0.00 Å
          </Text>
        </group>
      )}
    </>
  );
}
