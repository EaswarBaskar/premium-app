"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Color, Scene, Fog, PerspectiveCamera, Vector3 } from "three";
import ThreeGlobe from "three-globe";
import { useThree, Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import countries from "@/data/globe.json";

// Ensure global THREE is available for three-conic-polygon-geometry
if (typeof window !== "undefined") {
  (window as unknown as { THREE: typeof THREE }).THREE = THREE;
}

const RING_PROPAGATION_SPEED = 3;
const aspect = 1.2;
const cameraZ = 300;

export type Position = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  initialPosition?: {
    lat: number;
    lng: number;
  };
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

export interface WorldProps {
  globeConfig: GlobeConfig;
  data: Position[];
}

export function Globe({ globeConfig, data }: WorldProps) {
  const [globeInstance] = useState<ThreeGlobe>(() => new ThreeGlobe());

  const defaultProps = useMemo(
    () => ({
      pointSize: 1,
      atmosphereColor: "#ffffff",
      showAtmosphere: true,
      atmosphereAltitude: 0.1,
      polygonColor: "rgba(255,255,255,0.7)",
      globeColor: "#1d072e",
      emissive: "#000000",
      emissiveIntensity: 0.1,
      shininess: 0.9,
      arcTime: 2000,
      arcLength: 0.9,
      rings: 1,
      maxRings: 3,
      ...globeConfig,
    }),
    [globeConfig]
  );

  const globeData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const points: {
      size: number;
      order: number;
      color: (t: number) => string;
      lat: number;
      lng: number;
    }[] = [];

    for (let i = 0; i < data.length; i++) {
      const arc = data[i];
      if (
        !arc ||
        typeof arc.startLat !== "number" ||
        typeof arc.startLng !== "number" ||
        typeof arc.endLat !== "number" ||
        typeof arc.endLng !== "number"
      ) {
        continue;
      }

      const rgb = hexToRgb(arc.color) || { r: 56, g: 189, b: 248 };

      points.push({
        size: defaultProps.pointSize ?? 1,
        order: arc.order,
        color: (t: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${1 - t})`,
        lat: arc.startLat,
        lng: arc.startLng,
      });
      points.push({
        size: defaultProps.pointSize ?? 1,
        order: arc.order,
        color: (t: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${1 - t})`,
        lat: arc.endLat,
        lng: arc.endLng,
      });
    }

    return points.filter(
      (v, i, a) =>
        a.findIndex((v2) =>
          ["lat", "lng"].every(
            (k) => v2[k as "lat" | "lng"] === v[k as "lat" | "lng"]
          )
        ) === i
    );
  }, [data, defaultProps.pointSize]);

  useEffect(() => {
    if (!globeInstance) return;

    // Build Material
    const globeMaterial = globeInstance.globeMaterial() as unknown as {
      color: Color;
      emissive: Color;
      emissiveIntensity: number;
      shininess: number;
    };
    if (globeMaterial) {
      if (defaultProps.globeColor) globeMaterial.color = new Color(defaultProps.globeColor);
      if (defaultProps.emissive) globeMaterial.emissive = new Color(defaultProps.emissive);
      globeMaterial.emissiveIntensity = defaultProps.emissiveIntensity ?? 0.1;
      globeMaterial.shininess = defaultProps.shininess ?? 0.9;
    }

    globeInstance
      .hexPolygonsData(countries.features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.7)
      .showAtmosphere(defaultProps.showAtmosphere)
      .atmosphereColor(defaultProps.atmosphereColor)
      .atmosphereAltitude(defaultProps.atmosphereAltitude)
      .hexPolygonColor(() => defaultProps.polygonColor);

    const validArcs = (data || []).filter(
      (arc) =>
        arc &&
        typeof arc.startLat === "number" &&
        !isNaN(arc.startLat) &&
        typeof arc.startLng === "number" &&
        !isNaN(arc.startLng) &&
        typeof arc.endLat === "number" &&
        !isNaN(arc.endLat) &&
        typeof arc.endLng === "number" &&
        !isNaN(arc.endLng) &&
        typeof arc.arcAlt === "number" &&
        !isNaN(arc.arcAlt)
    );

    if (validArcs.length > 0) {
      globeInstance
        .arcsData(validArcs)
        .arcStartLat((d: unknown) => (d as { startLat: number }).startLat)
        .arcStartLng((d: unknown) => (d as { startLng: number }).startLng)
        .arcEndLat((d: unknown) => (d as { endLat: number }).endLat)
        .arcEndLng((d: unknown) => (d as { endLng: number }).endLng)
        .arcColor((e: unknown) => (e as { color: string }).color)
        .arcAltitude((e: unknown) => (e as { arcAlt: number }).arcAlt)
        .arcStroke(() => 0.4)
        .arcDashLength(defaultProps.arcLength)
        .arcDashInitialGap((e: unknown) => (e as { order: number }).order * 1)
        .arcDashGap(15)
        .arcDashAnimateTime(() => defaultProps.arcTime);

      globeInstance
        .pointsData(validArcs)
        .pointColor((e: unknown) => (e as { color: string }).color)
        .pointsMerge(true)
        .pointAltitude(0.0)
        .pointRadius(2);

      globeInstance
        .ringsData([])
        .ringColor((e: unknown) => (t: number) => {
          const item = e as { color?: (t: number) => string };
          return typeof item.color === "function" ? item.color(t) : "rgba(56, 189, 248, 0.8)";
        })
        .ringMaxRadius(defaultProps.maxRings)
        .ringPropagationSpeed(RING_PROPAGATION_SPEED)
        .ringRepeatPeriod(
          (defaultProps.arcTime * defaultProps.arcLength) / defaultProps.rings
        );
    }
  }, [globeInstance, defaultProps, data]);

  useEffect(() => {
    if (!globeInstance || globeData.length === 0 || !data || data.length === 0) return;

    const interval = setInterval(() => {
      if (!globeInstance || globeData.length === 0) return;

      const count = Math.min(globeData.length, Math.max(1, Math.floor((globeData.length * 4) / 5)));
      const numbersOfRings = genRandomNumbers(0, globeData.length, count);

      const validRingsData = globeData.filter((d, i) => {
        if (!numbersOfRings.includes(i)) return false;
        return (
          typeof d.lat === "number" &&
          !isNaN(d.lat) &&
          typeof d.lng === "number" &&
          !isNaN(d.lng)
        );
      });

      if (validRingsData.length > 0) {
        globeInstance.ringsData(validRingsData);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [globeInstance, globeData, data]);

  return <primitive object={globeInstance} />;
}

export function WebGLRendererConfig() {
  const { gl, size } = useThree();

  useEffect(() => {
    gl.setPixelRatio(window.devicePixelRatio);
    gl.setSize(size.width, size.height);
    gl.setClearColor(0x000000, 0);
  }, [gl, size]);

  return null;
}

export function World(props: WorldProps) {
  const { globeConfig } = props;
  const [scene] = useState(() => {
    const s = new Scene();
    s.fog = new Fog(0xffffff, 400, 2000);
    return s;
  });

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "380px", position: "relative" }}>
      <Canvas scene={scene} camera={new PerspectiveCamera(50, aspect, 180, 1800)}>
        <WebGLRendererConfig />
        <ambientLight color={globeConfig.ambientLight || "#38bdf8"} intensity={0.6} />
        <directionalLight
          color={globeConfig.directionalLeftLight || "#ffffff"}
          position={new Vector3(-400, 100, 400)}
        />
        <directionalLight
          color={globeConfig.directionalTopLight || "#ffffff"}
          position={new Vector3(-200, 500, 200)}
        />
        <pointLight
          color={globeConfig.pointLight || "#ffffff"}
          position={new Vector3(-200, 500, 200)}
          intensity={0.8}
        />
        <Globe {...props} />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={cameraZ * 0.7}
          maxDistance={cameraZ * 1.6}
          autoRotateSpeed={globeConfig.autoRotateSpeed ?? 0.5}
          autoRotate={globeConfig.autoRotate ?? true}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI - Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}

export function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const cleanHex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function genRandomNumbers(min: number, max: number, count: number) {
  const arr: number[] = [];
  while (arr.length < count && arr.length < max - min) {
    const r = Math.floor(Math.random() * (max - min)) + min;
    if (!arr.includes(r)) arr.push(r);
  }
  return arr;
}
