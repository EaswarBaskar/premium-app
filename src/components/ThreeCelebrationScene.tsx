"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import styles from "./ThreeCelebrationScene.module.css";

export interface ThreeCelebrationProps {
  variant?: "hero" | "ambient" | "rings";
  position?: "auto" | "right" | "center";
  showBadge?: boolean;
  className?: string;
  speed?: number;
}

export default function ThreeCelebrationScene({
  variant = "hero",
  position = "auto",
  showBadge = false,
  className = "",
  speed = 1,
}: ThreeCelebrationProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
      if (!gl) {
        setIsSupported(false);
        return;
      }
    } catch {
      setIsSupported(false);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = variant === "hero" ? 5.8 : 7.2;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.8);
    dirLight.position.set(4, 6, 5);
    scene.add(dirLight);

    // Moving golden point light for dynamic glints
    const glintLight = new THREE.PointLight(0xffd780, 4.0, 15);
    glintLight.position.set(0, 0, 3);
    scene.add(glintLight);

    const rimLight = new THREE.PointLight(0xff9e88, 2.5, 12);
    rimLight.position.set(-3, -2, -2);
    scene.add(rimLight);

    // 3. Central Celebration Group (3D Intertwined Metallic Rings & Crystals)
    const celebrationGroup = new THREE.Group();
    scene.add(celebrationGroup);

    let ring1: THREE.Mesh | null = null;
    let ring2: THREE.Mesh | null = null;
    const crystals: THREE.Mesh[] = [];

    // Track responsive base position so rings frame the visual card without obstructing text
    const basePosition = { x: 0, y: 0, z: 0 };
    let baseScale = 1.0;

    if (variant === "hero" || variant === "rings") {
      // Golden Wedding / Engagement Torus Ring 1
      const ring1Geo = new THREE.TorusGeometry(1.4, 0.075, 24, 96);
      const ring1Mat = new THREE.MeshStandardMaterial({
        color: 0xdfb76c,
        metalness: 0.92,
        roughness: 0.16,
      });
      ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      ring1.rotation.x = Math.PI / 3;
      ring1.rotation.y = Math.PI / 6;
      celebrationGroup.add(ring1);

      // Rose Gold Torus Ring 2 (Interlocking)
      const ring2Geo = new THREE.TorusGeometry(1.15, 0.065, 24, 96);
      const ring2Mat = new THREE.MeshStandardMaterial({
        color: 0xd9957d,
        metalness: 0.88,
        roughness: 0.22,
      });
      ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2.rotation.x = -Math.PI / 4;
      ring2.rotation.y = -Math.PI / 5;
      celebrationGroup.add(ring2);

      // 6 Floating Orbiting Crystal Diamonds
      const crystalGeo = new THREE.OctahedronGeometry(0.11, 0);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.2,
        roughness: 0.05,
      });

      for (let i = 0; i < 6; i++) {
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        const angle = (i / 6) * Math.PI * 2;
        const radius = 2.0 + (i % 2) * 0.35;
        crystal.position.set(
          Math.cos(angle) * radius,
          Math.sin(angle) * (radius * 0.65),
          (Math.sin(i * 1.5) * 0.5)
        );
        celebrationGroup.add(crystal);
        crystals.push(crystal);
      }
    }

    // 4. Circular Particle Sprite Generator (Soft Golden Glow)
    function createGlowSprite() {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.3, "rgba(235, 195, 120, 0.85)");
        gradient.addColorStop(0.7, "rgba(195, 130, 90, 0.35)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
      }
      return new THREE.CanvasTexture(canvas);
    }

    const spriteTexture = createGlowSprite();

    // 5. Golden Stardust & Confetti Points Cloud (Soft background depth, non-obtrusive)
    const particleCount = variant === "hero" ? 500 : 350;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    const palette = [
      new THREE.Color(0xf3d99d), // Champagne Gold
      new THREE.Color(0xd4af37), // Metallic Gold
      new THREE.Color(0xe8a598), // Rose Champagne
      new THREE.Color(0xfff6ea), // Warm Pearl
    ];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Spread across 3D viewing frustum in the background
      positions[i3] = (Math.random() - 0.5) * 15;
      positions[i3 + 1] = (Math.random() - 0.5) * 11;
      // All particles stay in the background (z <= -0.6) so none obstruct foreground text
      positions[i3 + 2] = -Math.random() * 4.5 - 0.6;

      // Subtle upward drifting and harmonic sway
      velocities[i3] = (Math.random() - 0.5) * 0.002;
      velocities[i3 + 1] = Math.random() * 0.003 + 0.0015;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.001;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: variant === "hero" ? 0.09 : 0.08,
      map: spriteTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.65,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 6. Interactive Cursor Parallax
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;

    function handleMouseMove(e: MouseEvent) {
      const rect = container?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotationY = x * 0.35;
      targetRotationX = y * 0.25;
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 7. Responsive Resizing & Element Positioning
    function handleResize() {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 500;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      if (variant === "hero" && position !== "center") {
        // Desktop (w >= 900px):
        // Position rings on the right column framing the visual invitation preview card.
        // This ensures the left column (hero headline, text, buttons) is 100% unobstructed!
        if (w >= 900) {
          const aspect = w / h;
          basePosition.x = Math.min(2.45, Math.max(1.9, aspect * 1.1));
          basePosition.y = 0.05;
          basePosition.z = -0.15;
          baseScale = 0.92;
          celebrationGroup.visible = true;
        } else if (w >= 640) {
          // Tablet: Stacked layout. Position rings down behind the invitation card preview
          basePosition.x = 0;
          basePosition.y = -1.9;
          basePosition.z = -0.5;
          baseScale = 0.68;
          celebrationGroup.visible = true;
        } else {
          // Mobile (< 640px):
          // Position neatly below the headline, centered on the card mock
          basePosition.x = 0;
          basePosition.y = -2.15;
          basePosition.z = -0.7;
          baseScale = 0.52;
          celebrationGroup.visible = true;
        }
      } else if (variant === "rings" || position === "center") {
        basePosition.x = 0;
        basePosition.y = 0;
        basePosition.z = 0;
        baseScale = 1.0;
        celebrationGroup.visible = true;
      }

      celebrationGroup.position.set(basePosition.x, basePosition.y, basePosition.z);
      celebrationGroup.scale.set(baseScale, baseScale, baseScale);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    // 8. Animation Render Loop
    let animationFrameId: number;
    const startTime = performance.now();

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = ((performance.now() - startTime) / 1000) * speed;

      // Smooth camera / group parallax damping
      currentRotationX += (targetRotationX - currentRotationX) * 0.05;
      currentRotationY += (targetRotationY - currentRotationY) * 0.05;

      celebrationGroup.rotation.y = currentRotationY + Math.sin(elapsedTime * 0.3) * 0.1;
      celebrationGroup.rotation.x = currentRotationX + Math.cos(elapsedTime * 0.25) * 0.08;

      // Gentle vertical floating motion
      celebrationGroup.position.y = basePosition.y + Math.sin(elapsedTime * 0.7) * 0.06;
      celebrationGroup.position.x = basePosition.x;
      celebrationGroup.position.z = basePosition.z;

      // Rotate interlocking rings smoothly
      if (ring1) {
        ring1.rotation.x += 0.005;
        ring1.rotation.y += 0.008;
      }
      if (ring2) {
        ring2.rotation.y -= 0.006;
        ring2.rotation.z += 0.007;
      }

      // Orbiting crystals & pulsing
      crystals.forEach((c, idx) => {
        c.rotation.x += 0.02;
        c.rotation.y += 0.025;
        const offset = (idx / crystals.length) * Math.PI * 2;
        c.position.y += Math.sin(elapsedTime * 1.5 + offset) * 0.003;
      });

      // Animate dynamic point light orbiting around celebrationGroup so rings sparkle
      glintLight.position.x = celebrationGroup.position.x + Math.cos(elapsedTime * 0.9) * 2.2;
      glintLight.position.y = celebrationGroup.position.y + Math.sin(elapsedTime * 0.7) * 1.8;
      glintLight.position.z = celebrationGroup.position.z + Math.sin(elapsedTime * 0.9) * 1.5 + 1.2;

      // Animate floating stardust particles
      const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        // Float upward
        array[i3 + 1] += velocities[i3 + 1];
        // Organic horizontal drift
        array[i3] += Math.sin(elapsedTime * 0.6 + i) * 0.0018;

        // Wrap particles when they float above ceiling
        if (array[i3 + 1] > 6.0) {
          array[i3 + 1] = -5.5;
          array[i3] = (Math.random() - 0.5) * 15;
          array[i3 + 2] = -Math.random() * 4.5 - 0.6;
        }
      }
      posAttr.needsUpdate = true;

      // Slow global rotation of particle field
      particles.rotation.y = elapsedTime * 0.015 + currentRotationY * 0.15;
      particles.rotation.x = currentRotationX * 0.15;

      renderer.render(scene, camera);
    }

    animate();

    // 9. Thorough Memory Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }

      // Dispose geometries & materials
      particleGeometry.dispose();
      particleMaterial.dispose();
      spriteTexture.dispose();

      if (ring1) {
        ring1.geometry.dispose();
        (ring1.material as THREE.Material).dispose();
      }
      if (ring2) {
        ring2.geometry.dispose();
        (ring2.material as THREE.Material).dispose();
      }
      crystals.forEach((c) => {
        c.geometry.dispose();
        (c.material as THREE.Material).dispose();
      });

      renderer.dispose();
    };
  }, [variant, position, speed]);

  if (!isSupported) return null;

  return (
    <div ref={mountRef} className={`${styles.canvasContainer} ${className}`} aria-hidden="true">
      {showBadge && (
        <div className={styles.badgeOverlay}>
          <span className={styles.badgeDot} />
          Three.js 3D WebGL Atmosphere
        </div>
      )}
    </div>
  );
}

