import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './FloatingLines.css';

export interface FloatingLinesProps {
  enabledWaves?: string[];
  lineCount?: number | number[];
  lineDistance?: number | number[];
  bendRadius?: number;
  bendStrength?: number;
  interactive?: boolean;
  parallax?: boolean;
  parallaxStrength?: number;
  animationSpeed?: number;
  color?: string;
  className?: string;
}

interface LineDataItem {
  line: THREE.Line;
  geometry: THREE.BufferGeometry;
  material: THREE.LineBasicMaterial;
  initialPositions: Float32Array;
  positions: Float32Array;
  waveName: string;
  index: number;
  speedOffset: number;
  frequency: number;
  amplitude: number;
}

export function FloatingLines({
  enabledWaves = ['top', 'middle', 'bottom'],
  lineCount = [8, 12, 16],
  lineDistance = [8, 6, 4],
  bendRadius = 5,
  bendStrength = -0.5,
  interactive = true,
  parallax = true,
  parallaxStrength = 0.15,
  animationSpeed = 0.7,
  color = '#ffffff',
  className = '',
}: FloatingLinesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animFrameId: number;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scene, Camera, Renderer setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 50;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
    } catch (e) {
      console.warn('WebGL context unavailable for FloatingLines:', e);
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Mouse tracking for interaction & parallax
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.targetX = nx;
      mouse.targetY = ny;
    };

    if (interactive || parallax) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // 2. Build Wave Lines
    const waveTypes = Array.isArray(enabledWaves) ? enabledWaves : ['top', 'middle', 'bottom'];
    const counts = Array.isArray(lineCount) ? lineCount : [lineCount, lineCount, lineCount];
    const distances = Array.isArray(lineDistance) ? lineDistance : [lineDistance, lineDistance, lineDistance];

    const linesData: LineDataItem[] = [];
    const pointsPerLine = 120;

    const getYOffsetForWave = (waveName: string) => {
      switch (waveName) {
        case 'top':
          return 12;
        case 'bottom':
          return -12;
        case 'middle':
        default:
          return 0;
      }
    };

    waveTypes.forEach((waveName, waveIdx) => {
      const count = counts[waveIdx % counts.length] || 10;
      const dist = distances[waveIdx % distances.length] || 5;
      const baseY = getYOffsetForWave(waveName);

      for (let i = 0; i < count; i++) {
        const positions = new Float32Array(pointsPerLine * 3);
        const initialPositions = new Float32Array(pointsPerLine * 3);

        const lineY = baseY + (i - count / 2) * (dist * 0.15);
        const spanX = 70;

        for (let j = 0; j < pointsPerLine; j++) {
          const px = (j / (pointsPerLine - 1)) * spanX - spanX / 2;
          const py = lineY;
          const pz = (Math.random() - 0.5) * 2;

          positions[j * 3] = px;
          positions[j * 3 + 1] = py;
          positions[j * 3 + 2] = pz;

          initialPositions[j * 3] = px;
          initialPositions[j * 3 + 1] = py;
          initialPositions[j * 3 + 2] = pz;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Line opacity variations
        const opacity = Math.random() * 0.45 + 0.15;
        const material = new THREE.LineBasicMaterial({
          color: new THREE.Color(color),
          transparent: true,
          opacity,
          linewidth: 1,
        });

        const line = new THREE.Line(geometry, material);
        scene.add(line);

        linesData.push({
          line,
          geometry,
          material,
          initialPositions,
          positions,
          waveName,
          index: i,
          speedOffset: Math.random() * 10,
          frequency: 0.15 + Math.random() * 0.1,
          amplitude: 0.8 + Math.random() * 0.6,
        });
      }
    });

    // 3. Resize Handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // 4. Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime() * animationSpeed;

      // Mouse smooth lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Parallax camera movement
      if (parallax && !prefersReducedMotion) {
        camera.position.x = mouse.x * parallaxStrength * 10;
        camera.position.y = mouse.y * parallaxStrength * 10;
        camera.lookAt(0, 0, 0);
      }

      if (!prefersReducedMotion) {
        // Update lines
        linesData.forEach((item) => {
          const { geometry, initialPositions, positions, index, speedOffset, frequency, amplitude } = item;

          for (let j = 0; j < pointsPerLine; j++) {
            const idx = j * 3;
            const ix = initialPositions[idx];
            const iy = initialPositions[idx + 1];

            // Wave calculation
            let waveY = Math.sin(time + ix * frequency + speedOffset + index * 0.3) * amplitude;
            let waveZ = Math.cos(time * 0.7 + ix * frequency * 0.8 + speedOffset) * (amplitude * 0.5);

            // Interactive mouse bending
            if (interactive) {
              const mouseWorldX = mouse.x * 25;
              const mouseWorldY = mouse.y * 15;
              const dx = ix - mouseWorldX;
              const dy = (iy + waveY) - mouseWorldY;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < bendRadius * 3) {
                const factor = Math.max(0, 1 - dist / (bendRadius * 3));
                waveY += bendStrength * factor * Math.sin(time * 2 + dist);
              }
            }

            positions[idx + 1] = iy + waveY;
            positions[idx + 2] = waveZ;
          }

          geometry.attributes.position.needsUpdate = true;
        });
      }

      renderer.render(scene, camera);

      if (!prefersReducedMotion) {
        animFrameId = requestAnimationFrame(animate);
      }
    };

    animate();

    // 5. Cleanup
    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (interactive || parallax) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      resizeObserver.disconnect();

      linesData.forEach(({ geometry, material, line }) => {
        scene.remove(line);
        geometry.dispose();
        material.dispose();
      });

      renderer.dispose();
    };
  }, [
    enabledWaves,
    lineCount,
    lineDistance,
    bendRadius,
    bendStrength,
    interactive,
    parallax,
    parallaxStrength,
    animationSpeed,
    color,
  ]);

  return (
    <div ref={containerRef} className={`floating-lines-container ${className}`}>
      <canvas ref={canvasRef} className="floating-lines-canvas" />
    </div>
  );
}

export default FloatingLines;
