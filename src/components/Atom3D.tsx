import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface Atom3DProps {
  shells: number[];
  color: string;
  modelType: 'bohr' | 'cloud' | 'orbital';
}

function OrbitAndElectrons({ shellIndex, electronCount, color }: { shellIndex: number, electronCount: number, color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const radius = (shellIndex + 1.2) * 1.5;
  const speed = 0.5 - (shellIndex * 0.05); // inner shells rotate faster

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * speed;
      groupRef.current.rotation.z += delta * (speed * 0.5);
    }
  });

  // Calculate electron positions
  const electrons = [];
  for (let i = 0; i < electronCount; i++) {
    const angle = (i / electronCount) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    electrons.push([x, 0, z] as [number, number, number]);
  }

  // Draw orbit line
  const orbitPoints = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    orbitPoints.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }

  return (
    <group ref={groupRef}>
      {/* Orbit paths */}
      <Line points={orbitPoints} color="rgba(255, 255, 255, 0.2)" lineWidth={1} />
      
      {/* Electrons */}
      {electrons.map((pos, i) => (
        <Sphere key={i} args={[0.2, 16, 16]} position={pos}>
          <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={2} />
        </Sphere>
      ))}
    </group>
  );
}

function CloudModel({ shells }: { shells: number[] }) {
  const electronCount = shells.reduce((a, b) => a + b, 0);
  const points = useMemo(() => {
    const pts = new Float32Array(electronCount * 150 * 3); 
    const maxRadius = (shells.length + 1) * 1.5;
    for (let i = 0; i < pts.length; i += 3) {
      const u = Math.random();
      const r = maxRadius * Math.pow(Math.random(), 1/3) * (0.3 + 0.7 * u);
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      pts[i] = r * Math.sin(phi) * Math.cos(theta);
      pts[i+1] = r * Math.sin(phi) * Math.sin(theta);
      pts[i+2] = r * Math.cos(phi);
    }
    return pts;
  }, [electronCount, shells.length]);
  
  const ref = useRef<THREE.Points>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.05;
      ref.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={points.length / 3} array={points} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#60a5fa" transparent opacity={0.8} sizeAttenuation={true} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function OrbitalModel({ shells }: { shells: number[] }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
      groupRef.current.rotation.z += delta * 0.05;
    }
  });
  
  return (
    <group ref={groupRef}>
       {shells.map((count, i) => {
         const radius = (i + 1.2) * 1.5;
         const opacityVal = Math.max(0.05, 0.2 - i * 0.03);
         return (
           <group key={i}>
              <Sphere args={[radius * 0.95, 32, 32]}>
                <meshStandardMaterial color="#60a5fa" transparent opacity={opacityVal} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
              </Sphere>
              {count > 2 && (
                <mesh rotation={[Math.PI/2, 0, 0]}>
                   <torusGeometry args={[radius, radius*0.3, 32, 64]} />
                   <meshStandardMaterial color="#818cf8" transparent opacity={opacityVal + 0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
              )}
           </group>
         )
       })}
    </group>
  );
}

function Nucleus({ color, protons }: { color: string, protons: number }) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.2;
      ref.current.rotation.x += delta * 0.1;
    }
  });

  // Simplified visual: Just a glowing sphere for the nucleus
  // Realism for 118 protons would be too heavy.
  return (
    <group ref={ref}>
      <Sphere args={[0.8, 32, 32]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} wireframe />
      </Sphere>
      <Sphere args={[0.5, 32, 32]}>
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1} />
      </Sphere>
    </group>
  );
}

function CustomOrbitControls(props: any) {
  const { gl } = useThree();
  // Provide the canvas parent wrapper as the event listener target,
  // which fixes touch/zoom interaction (R3F Canvas has pointer-events: none on the canvas itself)
  const domElement = gl.domElement.parentElement || gl.domElement;
  return <OrbitControls domElement={domElement} {...props} />;
}

export default function Atom3D({ shells, color, modelType }: Atom3DProps) {
  // Use category color or default
  const baseColor = color || "#ef4444";
  
  return (
    <div className="absolute inset-0 w-full h-full min-h-[250px] bg-slate-950/20">
      <Canvas camera={{ position: [0, 5, 12], fov: 45 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <Stars radius={50} depth={50} count={1000} factor={2} fade speed={1} />
        
        <Nucleus color={baseColor} protons={shells.reduce((a,b)=>a+b, 0)} />
        
        {modelType === 'bohr' && shells.map((count, i) => (
          <OrbitAndElectrons key={`shell-${i}`} shellIndex={i} electronCount={count} color={baseColor} />
        ))}

        {modelType === 'cloud' && <CloudModel shells={shells} />}
        
        {modelType === 'orbital' && <OrbitalModel shells={shells} />}
        
        <CustomOrbitControls makeDefault enablePan={false} autoRotate autoRotateSpeed={0.5} maxDistance={20} minDistance={3} />
      </Canvas>
    </div>
  );
}
