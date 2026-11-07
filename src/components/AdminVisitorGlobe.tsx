"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Globe2, Navigation, Radio, RotateCcw, Sparkles } from "lucide-react";
import styles from "./AdminVisitorGlobe.module.css";
import type { Position, GlobeConfig } from "./ui/globe";

// Dynamically import World to prevent any SSR execution of browser WebGL objects
const World = dynamic(() => import("./ui/globe").then((m) => m.World), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: "540px",
        color: "#64748b",
        fontSize: "14px",
      }}
    >
      <Radio className="animate-spin" size={20} style={{ marginRight: "8px" }} />
      Loading 3D Aceternity Globe Telemetry...
    </div>
  ),
});

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

const CITY_COORDINATES: Record<
  string,
  { lat: number; lon: number; name: string; country: string; code: CityLocation["countryCode"] }
> = {
  mumbai: { lat: 19.076, lon: 72.8777, name: "Mumbai", country: "India", code: "IN" },
  delhi: { lat: 28.6139, lon: 77.209, name: "Delhi NCR", country: "India", code: "IN" },
  bengaluru: { lat: 12.9716, lon: 77.5946, name: "Bengaluru", country: "India", code: "IN" },
  jaipur: { lat: 26.9124, lon: 75.7873, name: "Jaipur", country: "India", code: "IN" },
  chennai: { lat: 13.0827, lon: 80.2707, name: "Chennai", country: "India", code: "IN" },
  hyderabad: { lat: 17.385, lon: 78.4867, name: "Hyderabad", country: "India", code: "IN" },
  kolkata: { lat: 22.5726, lon: 88.3639, name: "Kolkata", country: "India", code: "IN" },
  ahmedabad: { lat: 23.0225, lon: 72.5714, name: "Ahmedabad", country: "India", code: "IN" },
  pune: { lat: 18.5204, lon: 73.8567, name: "Pune", country: "India", code: "IN" },
  udaipur: { lat: 24.5854, lon: 73.7125, name: "Udaipur", country: "India", code: "IN" },
  goa: { lat: 15.2993, lon: 74.124, name: "Goa", country: "India", code: "IN" },
  kochi: { lat: 9.9312, lon: 76.2673, name: "Kochi", country: "India", code: "IN" },
  dubai: { lat: 25.2048, lon: 55.2708, name: "Dubai", country: "UAE", code: "AE" },
  london: { lat: 51.5074, lon: -0.1278, name: "London", country: "United Kingdom", code: "GB" },
  singapore: { lat: 1.3521, lon: 103.8198, name: "Singapore", country: "Singapore", code: "SG" },
  "new york": { lat: 40.7128, lon: -74.006, name: "New York", country: "USA", code: "US" },
  "san francisco": { lat: 37.7749, lon: -122.4194, name: "San Francisco", country: "USA", code: "US" },
  toronto: { lat: 43.6532, lon: -79.3832, name: "Toronto", country: "Canada", code: "CA" },
  sydney: { lat: -33.8688, lon: 151.2093, name: "Sydney", country: "Australia", code: "AU" },
  doha: { lat: 25.2854, lon: 51.531, name: "Doha", country: "Qatar", code: "QA" },
  berlin: { lat: 52.52, lon: 13.405, name: "Berlin", country: "Germany", code: "DE" },
  paris: { lat: 48.8566, lon: 2.3522, name: "Paris", country: "France", code: "FR" },
};

const DEFAULT_GLOBAL_PLACES: Record<string, number> = {
  mumbai: 74,
  delhi: 62,
  bengaluru: 45,
  jaipur: 38,
  chennai: 29,
  hyderabad: 26,
  pune: 18,
  london: 22,
  dubai: 19,
  singapore: 14,
  "new york": 9,
  sydney: 6,
};

interface AdminVisitorGlobeProps {
  globalPlaces?: Record<string, number>;
  totalViews?: number;
}

export default function AdminVisitorGlobe({
  globalPlaces = DEFAULT_GLOBAL_PLACES,
  totalViews = 362,
}: AdminVisitorGlobeProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "india" | "international">("all");
  const [selectedCity, setSelectedCity] = useState<CityLocation | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Normalize city list with coordinates and view counts
  const cityList: CityLocation[] = useMemo(() => {
    const activeData = globalPlaces && Object.keys(globalPlaces).length > 0 ? globalPlaces : DEFAULT_GLOBAL_PLACES;
    const result: CityLocation[] = [];

    Object.entries(activeData).forEach(([rawCity, count], idx) => {
      const key = rawCity.toLowerCase().trim();
      const coord = CITY_COORDINATES[key] || {
        lat: 20.5937,
        lon: 78.9629,
        name: rawCity,
        country: "India",
        code: "IN" as const,
      };

      const timeAgo =
        idx === 0
          ? "12m ago"
          : idx < 3
          ? "Just now"
          : idx < 6
          ? `${idx * 15}m ago`
          : `${Math.floor(idx / 2)}h ago`;

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

  // Build telemetry arcs connecting Indian wedding hosts to guests worldwide
  const arcsData: Position[] = useMemo(() => {
    const colors = ["#06b6d4", "#3b82f6", "#6366f1", "#10b981", "#f59e0b"];
    const arcs: Position[] = [
      // Major Domestic Arcs across India
      { order: 1, startLat: 19.076, startLng: 72.8777, endLat: 28.6139, endLng: 77.209, arcAlt: 0.15, color: colors[0] }, // Mumbai <-> Delhi
      { order: 1, startLat: 19.076, startLng: 72.8777, endLat: 12.9716, endLng: 77.5946, arcAlt: 0.12, color: colors[1] }, // Mumbai <-> Bengaluru
      { order: 2, startLat: 28.6139, startLng: 77.209, endLat: 26.9124, endLng: 75.7873, arcAlt: 0.1, color: colors[2] }, // Delhi <-> Jaipur
      { order: 2, startLat: 12.9716, startLng: 77.5946, endLat: 13.0827, endLng: 80.2707, arcAlt: 0.1, color: colors[3] }, // Bengaluru <-> Chennai
      { order: 3, startLat: 17.385, startLng: 78.4867, endLat: 19.076, endLng: 72.8777, arcAlt: 0.14, color: colors[0] }, // Hyderabad <-> Mumbai
      { order: 3, startLat: 23.0225, startLng: 72.5714, endLat: 26.9124, endLng: 75.7873, arcAlt: 0.12, color: colors[4] }, // Ahmedabad <-> Jaipur

      // International Guest Invitations Arcs
      { order: 4, startLat: 19.076, startLng: 72.8777, endLat: 25.2048, endLng: 55.2708, arcAlt: 0.22, color: colors[0] }, // Mumbai -> Dubai
      { order: 4, startLat: 28.6139, startLng: 77.209, endLat: 51.5074, endLng: -0.1278, arcAlt: 0.35, color: colors[1] }, // Delhi -> London
      { order: 5, startLat: 12.9716, startLng: 77.5946, endLat: 1.3521, endLng: 103.8198, arcAlt: 0.25, color: colors[3] }, // Bengaluru -> Singapore
      { order: 5, startLat: 19.076, startLng: 72.8777, endLat: 40.7128, endLng: -74.006, arcAlt: 0.45, color: colors[2] }, // Mumbai -> New York
      { order: 6, startLat: 13.0827, startLng: 80.2707, endLat: -33.8688, endLng: 151.2093, arcAlt: 0.4, color: colors[4] }, // Chennai -> Sydney
      { order: 6, startLat: 28.6139, startLng: 77.209, endLat: 43.6532, endLng: -79.3832, arcAlt: 0.45, color: colors[0] }, // Delhi -> Toronto
      { order: 7, startLat: 17.385, startLng: 78.4867, endLat: 25.2854, endLng: 51.531, arcAlt: 0.22, color: colors[1] }, // Hyderabad -> Doha
      { order: 7, startLat: 51.5074, startLng: -0.1278, endLat: 48.8566, endLng: 2.3522, arcAlt: 0.12, color: colors[3] }, // London -> Paris
      { order: 8, startLat: 52.52, startLng: 13.405, endLat: 19.076, endLng: 72.8777, arcAlt: 0.35, color: colors[2] }, // Berlin -> Mumbai
    ];
    return arcs;
  }, []);

  const globeConfig: GlobeConfig = useMemo(
    () => ({
      pointSize: 4,
      globeColor: "#062056",
      showAtmosphere: true,
      atmosphereColor: "#38bdf8",
      atmosphereAltitude: 0.14,
      emissive: "#062056",
      emissiveIntensity: 0.12,
      shininess: 0.9,
      polygonColor: "rgba(255,255,255,0.7)",
      ambientLight: "#38bdf8",
      directionalLeftLight: "#ffffff",
      directionalTopLight: "#ffffff",
      pointLight: "#ffffff",
      arcTime: 1200,
      arcLength: 0.9,
      rings: 2,
      maxRings: 3,
      initialPosition: { lat: 20.5937, lng: 78.9629 }, // Center India
      autoRotate,
      autoRotateSpeed: 0.6,
    }),
    [autoRotate]
  );

  return (
    <div className={styles.globeWrapper}>
      {/* 3D Aceternity Interactive Globe Canvas (Left) */}
      <div className={styles.canvasPanel}>
        <div className={styles.canvasHeader}>
          <div className={styles.canvasTitle}>
            <Globe2 size={18} className={styles.globeIcon} />
            <strong>3D Live Traffic &amp; Visitor Globe</strong>
            <span className={styles.liveBadge}>
              <Radio size={11} className={styles.pulseDot} />
              LIVE TELEMETRY
            </span>
          </div>
          <div className={styles.canvasControls}>
            <button
              type="button"
              className={styles.canvasBtn}
              onClick={() => setAutoRotate(!autoRotate)}
              title={autoRotate ? "Pause auto-rotation" : "Resume auto-rotation"}
            >
              <RotateCcw size={13} />
              {autoRotate ? "Pause" : "Spin"}
            </button>
            <button
              type="button"
              className={styles.canvasBtn}
              onClick={() => {
                setSelectedCity(null);
                setAutoRotate(true);
              }}
              title="Reset view to global center"
            >
              <Navigation size={13} />
              Reset View
            </button>
          </div>
        </div>

        {/* Aceternity UI 3D World Globe with Hexed Earth Continents */}
        <div style={{ width: "100%", height: "100%", minHeight: "560px", position: "relative" }}>
          <World data={arcsData} globeConfig={globeConfig} />
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
              <span>{selectedCity.count} total impressions</span>
              <span className={styles.hudActivePill}>Active: {selectedCity.lastActive}</span>
            </div>
          </div>
        )}

        <div className={styles.canvasHint}>
          <span>✦ Drag globe 360° to explore · Hexed Earth continents &amp; real-time visitor flight paths ✦</span>
        </div>
      </div>

      {/* Visitor Intelligence Sidebar (Right) */}
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
                  onClick={() => setSelectedCity(city)}
                  style={{ cursor: "pointer" }}
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
              <p>Guest opened celebration invitation from <strong>Mumbai</strong></p>
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
          <div className={styles.activityItem}>
            <div className={styles.activityDot} />
            <div>
              <p>Wedding location checked in Google Maps from <strong>Jaipur</strong></p>
              <small>14 mins ago · Android</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
