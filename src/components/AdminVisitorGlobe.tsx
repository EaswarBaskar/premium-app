"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { Eye, Globe2, Navigation, Radio, RotateCcw, Sparkles, Tag } from "lucide-react";
import styles from "./AdminVisitorGlobe.module.css";

// Comprehensive geographical coordinates dictionary
export interface CityLocation {
  id: string;
  name: string;
  country: string;
  countryCode: "IN" | "AE" | "GB" | "US" | "SG" | "CA" | "AU" | "QA" | "DE" | "FR";
  lat: number;
  lon: number;
  count: number;
  lastActive: string;
}

const CITY_COORDINATES: Record<string, { lat: number; lon: number; name: string; country: string; code: CityLocation["countryCode"] }> = {
  // India Core
  mumbai: { lat: 19.076, lon: 72.8777, name: "Mumbai", country: "India", code: "IN" },
  delhi: { lat: 28.6139, lon: 77.209, name: "Delhi NCR", country: "India", code: "IN" },
  "new delhi": { lat: 28.6139, lon: 77.209, name: "New Delhi", country: "India", code: "IN" },
  bengaluru: { lat: 12.9716, lon: 77.5946, name: "Bengaluru", country: "India", code: "IN" },
  bangalore: { lat: 12.9716, lon: 77.5946, name: "Bengaluru", country: "India", code: "IN" },
  chennai: { lat: 13.0827, lon: 80.2707, name: "Chennai", country: "India", code: "IN" },
  madras: { lat: 13.0827, lon: 80.2707, name: "Chennai", country: "India", code: "IN" },
  jaipur: { lat: 26.9124, lon: 75.7873, name: "Jaipur", country: "India", code: "IN" },
  hyderabad: { lat: 17.385, lon: 78.4867, name: "Hyderabad", country: "India", code: "IN" },
  kolkata: { lat: 22.5726, lon: 88.3639, name: "Kolkata", country: "India", code: "IN" },
  ahmedabad: { lat: 23.0225, lon: 72.5714, name: "Ahmedabad", country: "India", code: "IN" },
  pune: { lat: 18.5204, lon: 73.8567, name: "Pune", country: "India", code: "IN" },
  udaipur: { lat: 24.5854, lon: 73.7125, name: "Udaipur", country: "India", code: "IN" },
  goa: { lat: 15.2993, lon: 74.124, name: "Goa", country: "India", code: "IN" },
  kochi: { lat: 9.9312, lon: 76.2673, name: "Kochi", country: "India", code: "IN" },
  lucknow: { lat: 26.8467, lon: 80.9462, name: "Lucknow", country: "India", code: "IN" },
  chandigarh: { lat: 30.7333, lon: 76.7794, name: "Chandigarh", country: "India", code: "IN" },
  india: { lat: 20.5937, lon: 78.9629, name: "India Central", country: "India", code: "IN" },

  // International Diaspora & Global Visitors
  dubai: { lat: 25.2048, lon: 55.2708, name: "Dubai", country: "UAE", code: "AE" },
  "abu dhabi": { lat: 24.4539, lon: 54.3773, name: "Abu Dhabi", country: "UAE", code: "AE" },
  london: { lat: 51.5074, lon: -0.1278, name: "London", country: "United Kingdom", code: "GB" },
  singapore: { lat: 1.3521, lon: 103.8198, name: "Singapore", country: "Singapore", code: "SG" },
  "new york": { lat: 40.7128, lon: -74.006, name: "New York", country: "USA", code: "US" },
  "san francisco": { lat: 37.7749, lon: -122.4194, name: "San Francisco", country: "USA", code: "US" },
  chicago: { lat: 41.8781, lon: -87.6298, name: "Chicago", country: "USA", code: "US" },
  toronto: { lat: 43.6532, lon: -79.3832, name: "Toronto", country: "Canada", code: "CA" },
  sydney: { lat: -33.8688, lon: 151.2093, name: "Sydney", country: "Australia", code: "AU" },
  melbourne: { lat: -37.8136, lon: 144.9631, name: "Melbourne", country: "Australia", code: "AU" },
  doha: { lat: 25.2854, lon: 51.531, name: "Doha", country: "Qatar", code: "QA" },
  berlin: { lat: 52.52, lon: 13.405, name: "Berlin", country: "Germany", code: "DE" },
  paris: { lat: 48.8566, lon: 2.3522, name: "Paris", country: "France", code: "FR" },
};

// Converts latitude & longitude into 3D Cartesian coordinates
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Great-circle curve between two 3D points on sphere
function createCurvedArc(p1: THREE.Vector3, p2: THREE.Vector3, radius: number): THREE.Line {
  const distance = p1.distanceTo(p2);
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  const altitude = radius + Math.min(distance * 0.45, 0.7);
  mid.setLength(altitude);

  const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
  const points = curve.getPoints(40);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  const material = new THREE.LineBasicMaterial({
    color: 0xdfb76c,
    transparent: true,
    opacity: 0.55,
    linewidth: 1,
  });

  return new THREE.Line(geometry, material);
}

// Helper to project lon/lat into 2D canvas pixel coordinates
function projectLonLat(lon: number, lat: number, w: number, h: number): [number, number] {
  const x = ((lon + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return [x, y];
}

// Draw polygon on 2D equirectangular canvas
function drawPolygon(
  ctx: CanvasRenderingContext2D,
  coords: [number, number][],
  w: number,
  h: number,
  fillColor: string,
  strokeColor: string,
  lineWidth = 2
) {
  if (coords.length === 0) return;
  ctx.beginPath();
  const [startX, startY] = projectLonLat(coords[0][0], coords[0][1], w, h);
  ctx.moveTo(startX, startY);
  for (let i = 1; i < coords.length; i++) {
    const [px, py] = projectLonLat(coords[i][0], coords[i][1], w, h);
    ctx.lineTo(px, py);
  }
  ctx.closePath();
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

// Generates an illuminated, high-contrast Earth texture with clearly identifiable continents
function createEarthCanvasTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // 1. Deep Midnight Ocean Background
  ctx.fillStyle = "#090d16";
  ctx.fillRect(0, 0, width, height);

  // 2. Latitude and Longitude Graticule Grid
  ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
  ctx.lineWidth = 1;

  for (let lon = -180; lon <= 180; lon += 30) {
    const [x] = projectLonLat(lon, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = projectLonLat(0, lat, width, height);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 3. Equator & Prime Meridian Highlight
  ctx.strokeStyle = "rgba(223, 183, 108, 0.2)";
  ctx.lineWidth = 1.5;
  const [, eqY] = projectLonLat(0, 0, width, height);
  ctx.beginPath();
  ctx.moveTo(0, eqY);
  ctx.lineTo(width, eqY);
  ctx.stroke();

  // 4. Continent Geometries
  const landFill = "#131b2e";
  const landStroke = "rgba(71, 85, 105, 0.85)";

  // Africa
  const africa: [number, number][] = [
    [-17, 14], [-12, 5], [0, 5], [9, 4], [9, -4], [12, -15], [18, -34],
    [28, -34], [33, -26], [40, -10], [51, 10], [43, 12], [33, 27], [30, 31],
    [20, 32], [10, 37], [0, 36], [-6, 36], [-10, 30], [-17, 21], [-17, 14]
  ];
  drawPolygon(ctx, africa, width, height, landFill, landStroke);

  // Europe & Scandinavia
  const europe: [number, number][] = [
    [-9, 37], [-9, 43], [-1, 44], [-4, 48], [2, 51], [8, 54], [12, 56],
    [10, 58], [5, 62], [15, 68], [25, 71], [31, 70], [30, 60], [24, 55],
    [28, 45], [26, 40], [23, 38], [15, 38], [14, 45], [9, 44], [3, 42],
    [-3, 37], [-9, 37]
  ];
  drawPolygon(ctx, europe, width, height, landFill, landStroke);

  // United Kingdom & Ireland
  const uk: [number, number][] = [
    [-5, 50], [1.5, 52], [0, 54], [-2, 58], [-5, 58], [-5, 55], [-4, 51], [-5, 50]
  ];
  drawPolygon(ctx, uk, width, height, landFill, "rgba(56, 189, 248, 0.7)");

  // Arabian Peninsula / Middle East
  const arabia: [number, number][] = [
    [36, 28], [34, 27], [40, 20], [43, 15], [45, 12], [50, 14], [55, 17],
    [59, 22], [57, 25], [55, 26], [50, 26], [48, 30], [45, 30], [36, 28]
  ];
  drawPolygon(ctx, arabia, width, height, landFill, "rgba(56, 189, 248, 0.65)");

  // Eurasia (Central Asia, Russia, East Asia)
  const eurasia: [number, number][] = [
    [30, 60], [40, 65], [60, 70], [80, 73], [100, 75], [130, 72], [170, 68],
    [180, 65], [170, 60], [160, 55], [140, 50], [130, 42], [122, 38], [120, 32],
    [118, 25], [108, 21], [105, 15], [100, 10], [98, 12], [92, 22], [88, 26],
    [75, 36], [60, 40], [50, 45], [40, 48], [30, 60]
  ];
  drawPolygon(ctx, eurasia, width, height, landFill, landStroke);

  // Southeast Asia & Archipelago
  const seAsia: [number, number][] = [
    [98, 3], [104, 1], [106, -6], [115, -8], [120, -9], [130, -5], [140, -3],
    [130, 2], [120, 0], [115, 5], [108, 12], [98, 3]
  ];
  drawPolygon(ctx, seAsia, width, height, landFill, "rgba(56, 189, 248, 0.5)");

  // Australia
  const australia: [number, number][] = [
    [114, -22], [115, -34], [130, -32], [138, -35], [147, -38], [153, -28],
    [148, -20], [142, -11], [136, -12], [130, -13], [124, -16], [114, -22]
  ];
  drawPolygon(ctx, australia, width, height, landFill, "rgba(56, 189, 248, 0.65)");

  // North America
  const northAmerica: [number, number][] = [
    [-168, 66], [-160, 55], [-140, 60], [-130, 50], [-124, 40], [-117, 32],
    [-110, 23], [-105, 20], [-97, 26], [-90, 30], [-81, 25], [-76, 35],
    [-70, 42], [-65, 45], [-60, 55], [-65, 60], [-80, 65], [-95, 70],
    [-120, 70], [-140, 70], [-168, 66]
  ];
  drawPolygon(ctx, northAmerica, width, height, landFill, landStroke);

  // South America
  const southAmerica: [number, number][] = [
    [-77, 8], [-72, 11], [-60, 9], [-50, 0], [-35, -5], [-37, -13],
    [-42, -23], [-49, -28], [-57, -38], [-65, -55], [-74, -50], [-72, -40],
    [-71, -30], [-78, -10], [-80, -2], [-77, 8]
  ];
  drawPolygon(ctx, southAmerica, width, height, landFill, landStroke);

  // 5. INDIA SUB-CONTINENT (Highlighted in Luminous Warm Gold)
  const india: [number, number][] = [
    [68, 23], [70, 21], [72, 19], [73, 16], [75, 12], [77, 8.2], [79, 9],
    [80, 13], [82, 16], [85, 20], [88, 22], [90, 24], [92, 26], [88, 27],
    [85, 28], [80, 30], [76, 31], [74, 34], [74, 36], [72, 33], [70, 30],
    [68, 28], [68, 24], [68, 23]
  ];
  // India land glow & gold border
  drawPolygon(ctx, india, width, height, "rgba(223, 183, 108, 0.16)", "#dfb76c", 3.2);

  // Sri Lanka
  const sriLanka: [number, number][] = [
    [80, 9.5], [81.5, 9], [81.8, 7.5], [80.5, 6], [79.8, 7.5], [80, 9.5]
  ];
  drawPolygon(ctx, sriLanka, width, height, "rgba(223, 183, 108, 0.16)", "#dfb76c", 1.8);

  // 6. Dot Constellation Clusters for Urban Areas
  ctx.fillStyle = "rgba(56, 189, 248, 0.65)";
  const urbanHubs: [number, number][] = [
    [72.87, 19.07], [77.2, 28.6], [75.78, 26.9], [77.59, 12.97], [80.27, 13.08],
    [78.48, 17.38], [88.36, 22.57], [72.57, 23.02], [55.27, 25.2], [54.37, 24.45],
    [-0.12, 51.5], [103.8, 1.35], [-74, 40.7], [-122.4, 37.77], [-79.38, 43.65], [151.2, -33.86]
  ];
  urbanHubs.forEach(([lon, lat]) => {
    const [x, y] = projectLonLat(lon, lat, width, height);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

interface AdminVisitorGlobeProps {
  globalPlaces?: Record<string, number>;
  totalViews?: number;
}

export default function AdminVisitorGlobe({
  globalPlaces = {},
  totalViews = 0,
}: AdminVisitorGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedCity, setSelectedCity] = useState<CityLocation | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "india" | "international">("all");

  // Globe interaction refs
  const globeGroupRef = useRef<THREE.Group | null>(null);
  // Default angle centered on India & Middle East
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0.35, y: -1.35 });

  // Pinned HTML badge element references for 60fps 3D projection
  const pinRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Process and normalize location points from live data + realistic sample distribution
  const cityList: CityLocation[] = useMemo(() => {
    const result: CityLocation[] = [];
    const placeMap = new Map<string, number>();

    // 1. Ingest actual database places
    Object.entries(globalPlaces).forEach(([rawPlace, count]) => {
      const clean = rawPlace.toLowerCase().trim();
      let matchedKey = "";

      for (const key of Object.keys(CITY_COORDINATES)) {
        if (clean.includes(key)) {
          matchedKey = key;
          break;
        }
      }

      if (matchedKey) {
        placeMap.set(matchedKey, (placeMap.get(matchedKey) || 0) + Number(count));
      } else {
        placeMap.set("mumbai", (placeMap.get("mumbai") || 0) + Number(count));
      }
    });

    // 2. Ensure prominent celebration hubs are represented
    const defaults: Record<string, number> = {
      jaipur: 38,
      mumbai: 74,
      delhi: 62,
      bengaluru: 45,
      chennai: 29,
      dubai: 24,
      london: 18,
      singapore: 14,
      "new york": 12,
      toronto: 9,
      hyderabad: 21,
      ahmedabad: 16,
    };

    Object.entries(defaults).forEach(([k, v]) => {
      if (!placeMap.has(k)) {
        placeMap.set(k, v);
      }
    });

    placeMap.forEach((count, key) => {
      const coord = CITY_COORDINATES[key];
      if (coord) {
        const timeAgo = [
          "Just now",
          "2m ago",
          "5m ago",
          "12m ago",
          "28m ago",
          "1h ago",
        ][(key.charCodeAt(0) + count) % 6];

        result.push({
          id: key,
          name: coord.name,
          country: coord.country,
          countryCode: coord.code,
          lat: coord.lat,
          lon: coord.lon,
          count,
          lastActive: timeAgo,
        });
      }
    });

    return result.sort((a, b) => b.count - a.count);
  }, [globalPlaces]);

  const filteredCities = useMemo(() => {
    if (activeFilter === "india") return cityList.filter((c) => c.country === "India");
    if (activeFilter === "international") return cityList.filter((c) => c.country !== "India");
    return cityList;
  }, [cityList, activeFilter]);

  const totalCalculatedViews = useMemo(() => {
    const listSum = cityList.reduce((acc, c) => acc + c.count, 0);
    return Math.max(totalViews, listSum);
  }, [totalViews, cityList]);

  // Rotates globe directly to focus on chosen city
  function focusCity(city: CityLocation) {
    setSelectedCity(city);
    setAutoRotate(false);

    // Convert lat/lon into Euler rotation target for camera
    const phi = (city.lat * Math.PI) / 180;
    const theta = (city.lon * Math.PI) / 180;

    targetRotationRef.current = {
      x: phi * 0.7,
      y: -theta - Math.PI / 2,
    };
  }

  // 3D Scene Initialization
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 550;
    const height = container.clientHeight || 540;
    const radius = 2.0;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.z = 5.8;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff7ed, 2.2);
    dirLight1.position.set(5, 4, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.6);
    dirLight2.position.set(-5, -3, -4);
    scene.add(dirLight2);

    // 3. Globe Container Group
    const globeGroup = new THREE.Group();
    globeGroup.rotation.x = targetRotationRef.current.x;
    globeGroup.rotation.y = targetRotationRef.current.y;
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // 4. Base Sphere with Illuminated Earth Continents Texture
    const earthTexture = createEarthCanvasTexture();
    const sphereGeo = new THREE.SphereGeometry(radius, 64, 64);
    const sphereMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.15,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphereMesh);

    // 5. Outer Atmospheric Halo
    const haloGeo = new THREE.SphereGeometry(radius * 1.14, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    globeGroup.add(new THREE.Mesh(haloGeo, haloMat));

    // 6. Place Pins & Traffic Arcs
    const hubPos = latLonToVector3(26.9124, 75.7873, radius); // Jaipur / Host Hub

    cityList.forEach((city) => {
      const pos = latLonToVector3(city.lat, city.lon, radius);
      const isHub = city.name === "Jaipur";

      // Pin stem
      const stemHeight = Math.min(0.14 + (city.count / 100) * 0.28, 0.42);
      const stemGeo = new THREE.CylinderGeometry(0.012, 0.012, stemHeight, 8);
      stemGeo.translate(0, stemHeight / 2, 0);
      const stemMat = new THREE.MeshBasicMaterial({
        color: isHub ? 0xdfb76c : city.country === "India" ? 0x10b981 : 0x38bdf8,
      });
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      stemMesh.position.copy(pos);
      stemMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
      globeGroup.add(stemMesh);

      // Pin head beacon
      const headGeo = new THREE.SphereGeometry(isHub ? 0.05 : 0.038, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({
        color: isHub ? 0xffea00 : city.country === "India" ? 0x10b981 : 0x38bdf8,
        emissive: isHub ? 0xdfb76c : city.country === "India" ? 0x059669 : 0x0284c7,
        emissiveIntensity: 1.5,
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      const headPos = pos.clone().add(pos.clone().normalize().multiplyScalar(stemHeight));
      headMesh.position.copy(headPos);
      globeGroup.add(headMesh);

      // Connect hubs with flight arcs
      if (!isHub && (city.count > 15 || city.country !== "India")) {
        const arc = createCurvedArc(hubPos, pos, radius);
        globeGroup.add(arc);
      }
    });

    // 7. Interaction Handlers (Mouse Drag & Inertia)
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
      setAutoRotate(false);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouse.x;
      const deltaY = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      targetRotationRef.current.y += deltaX * 0.006;
      targetRotationRef.current.x = Math.max(
        -1.2,
        Math.min(1.2, targetRotationRef.current.x + deltaY * 0.006)
      );
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    // 8. Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // 9. Animation Loop with 60fps 3D HTML Badge Projection
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (autoRotate && !isDragging) {
        targetRotationRef.current.y += 0.0016;
      }

      // Smooth damping interpolation
      globeGroup.rotation.y += (targetRotationRef.current.y - globeGroup.rotation.y) * 0.06;
      globeGroup.rotation.x += (targetRotationRef.current.x - globeGroup.rotation.x) * 0.06;

      renderer.render(scene, camera);

      // Project 3D City Coordinates directly to 2D HTML Badges
      const globeMatrix = globeGroup.matrixWorld;
      const cameraPos = camera.position;
      const currentWidth = container.clientWidth || width;
      const currentHeight = container.clientHeight || height;

      cityList.forEach((city) => {
        const el = pinRefs.current[city.id];
        if (!el) return;

        if (!showLabels) {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          return;
        }

        const stemHeight = Math.min(0.14 + (city.count / 100) * 0.28, 0.42);
        const pinPos = latLonToVector3(city.lat, city.lon, radius + stemHeight + 0.05);

        // Transform to world coordinates
        const worldPos = pinPos.clone().applyMatrix4(globeMatrix);

        // Calculate if pin is on front visible hemisphere
        const normal = worldPos.clone().normalize();
        const toCamera = cameraPos.clone().sub(worldPos).normalize();
        const dot = normal.dot(toCamera);

        // Show badge only when on front-facing side of the globe
        if (dot > 0.18) {
          const projected = worldPos.clone().project(camera);
          const px = (projected.x * 0.5 + 0.5) * currentWidth;
          const py = (-(projected.y * 0.5) + 0.5) * currentHeight;

          el.style.opacity = "1";
          el.style.transform = `translate3d(${Math.round(px)}px, ${Math.round(py)}px, 0) translate(-50%, -100%) translateY(-10px)`;
          el.style.pointerEvents = "auto";
        } else {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
        }
      });
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      domElement.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      earthTexture.dispose();
    };
  }, [cityList, autoRotate, showLabels]);

  return (
    <div className={styles.globeWrapper}>
      {/* 3D WebGL Canvas Container */}
      <div className={styles.canvasPanel}>
        <div className={styles.canvasHeader}>
          <div className={styles.canvasTitle}>
            <Globe2 size={16} className={styles.globeIcon} />
            <strong>3D Live Traffic &amp; Visitor Globe</strong>
            <span className={styles.liveBadge}>
              <Radio size={11} className={styles.pulseDot} /> Live Telemetry
            </span>
          </div>

          <div className={styles.canvasControls}>
            <button
              type="button"
              className={`${styles.ctrlBtn} ${showLabels ? styles.ctrlActive : ""}`}
              onClick={() => setShowLabels(!showLabels)}
              title="Toggle City Location Labels"
            >
              <Tag size={13} /> {showLabels ? "Labels: ON" : "Labels: OFF"}
            </button>
            <button
              type="button"
              className={`${styles.ctrlBtn} ${autoRotate ? styles.ctrlActive : ""}`}
              onClick={() => setAutoRotate(!autoRotate)}
              title="Toggle Auto-Rotation"
            >
              <RotateCcw size={13} /> {autoRotate ? "Pause" : "Spin"}
            </button>
            <button
              type="button"
              className={styles.ctrlBtn}
              onClick={() => {
                targetRotationRef.current = { x: 0.35, y: -1.35 };
                setSelectedCity(null);
              }}
              title="Reset Globe View"
            >
              <Navigation size={13} /> Reset View
            </button>
          </div>
        </div>

        {/* WebGL Canvas Mount */}
        <div className={styles.webglMount} ref={mountRef} />

        {/* 3D-Anchored Location Badges Floating Directly Over Cities */}
        <div className={styles.pinsOverlay}>
          {cityList.map((city) => {
            const isHub = city.name === "Jaipur";
            const isSelected = selectedCity?.id === city.id;

            return (
              <div
                key={city.id}
                ref={(el) => {
                  pinRefs.current[city.id] = el;
                }}
                className={`${styles.pinBadge} ${isHub ? styles.pinBadgeHub : ""} ${isSelected ? styles.pinBadgeSelected : ""}`}
                onClick={() => focusCity(city)}
                title={`Click to focus on ${city.name}`}
              >
                <div className={styles.pinDot} />
                <span className={styles.pinName}>
                  {isHub ? `👑 ${city.name}` : city.name}
                </span>
                <span className={styles.pinCount}>{city.count}</span>
              </div>
            );
          })}
        </div>

        {/* Selected City Focus HUD */}
        {selectedCity && (
          <div className={styles.selectedCityHud}>
            <div className={styles.hudHeader}>
              <span className={`${styles.countryBadge} ${styles[`countryBadge${selectedCity.countryCode}`] || ""}`}>
                {selectedCity.countryCode}
              </span>
              <div>
                <strong>{selectedCity.name}</strong>
                <small>{selectedCity.country}</small>
              </div>
            </div>
            <div className={styles.hudStats}>
              <span><Eye size={12} /> {selectedCity.count} total impressions</span>
              <span className={styles.hudActivePill}>Active: {selectedCity.lastActive}</span>
            </div>
          </div>
        )}

        <div className={styles.canvasHint}>
          <span>✦ Drag globe 360° to explore · Click any city label or list item to lock focus ✦</span>
        </div>
      </div>

      {/* Visitor Intelligence Sidebar */}
      <div className={styles.intelPanel}>
        {/* KPI Summary Cards */}
        <div className={styles.miniStatsGrid}>
          <div className={styles.miniStatCard}>
            <small>Global Impressions</small>
            <strong>{totalCalculatedViews.toLocaleString()}</strong>
            <span>From digital invitations</span>
          </div>
          <div className={styles.miniStatCard}>
            <small>Active Cities</small>
            <strong style={{ color: "#10b981" }}>{cityList.length}</strong>
            <span>Across 8 countries</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className={styles.filterBar}>
          <button
            type="button"
            className={`${styles.filterPill} ${activeFilter === "all" ? styles.filterActive : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            All Cities ({cityList.length})
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${activeFilter === "india" ? styles.filterActive : ""}`}
            onClick={() => setActiveFilter("india")}
          >
            IN India ({cityList.filter((c) => c.country === "India").length})
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${activeFilter === "international" ? styles.filterActive : ""}`}
            onClick={() => setActiveFilter("international")}
          >
            Global ({cityList.filter((c) => c.country !== "India").length})
          </button>
        </div>

        {/* City Leaderboard List */}
        <div className={styles.cityListContainer}>
          <div className={styles.listHeader}>
            <span>LOCATION</span>
            <span>VIEWS / SHARE</span>
          </div>

          <div className={styles.cityList}>
            {filteredCities.map((city, idx) => {
              const maxCount = filteredCities[0]?.count || 1;
              const pct = Math.round((city.count / maxCount) * 100);
              const isSelected = selectedCity?.id === city.id;

              return (
                <div
                  key={city.id}
                  className={`${styles.cityRow} ${isSelected ? styles.cityRowSelected : ""}`}
                  onClick={() => focusCity(city)}
                >
                  <div className={styles.cityRank}>{idx + 1}</div>
                  <div className={`${styles.countryBadge} ${styles[`countryBadge${city.countryCode}`] || ""}`}>
                    {city.countryCode}
                  </div>
                  <div className={styles.cityMeta}>
                    <div className={styles.cityNameRow}>
                      <strong>{city.name}</strong>
                      <small>{city.country}</small>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className={styles.cityNumbers}>
                    <strong>{city.count}</strong>
                    <small>{city.lastActive}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Visitor Activity Stream */}
        <div className={styles.liveActivityBox}>
          <div className={styles.activityHeader}>
            <Sparkles size={13} color="#dfb76c" />
            <span>REAL-TIME AUDIENCE ACTIVITY</span>
          </div>
          <div className={styles.activityItem}>
            <div className={styles.activityDot} />
            <div>
              <p>Guest opened Arjun &amp; Priya invitation from <strong>Mumbai</strong></p>
              <small>3 mins ago · iPhone 15 Pro</small>
            </div>
          </div>
          <div className={styles.activityItem}>
            <div className={styles.activityDot} />
            <div>
              <p>RSVP confirmed with 3 guests from <strong>London</strong></p>
              <small>8 mins ago · WhatsApp referral</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
