import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as React.FC<any>;
import {
  GlobeAltIcon,
  XMarkIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import HyperrealisticGlobe from "../components/HyperrealisticGlobe";
import { isroSatellites } from "../data/isroSatellites";

const getDebrisRiskStyles = (risk: string) => {
  const r = String(risk || "").toLowerCase();
  if (r.includes("high") || r.includes("severe") || r.includes("critical")) {
    return {
      color: "#EF4444",
      bg: "rgba(239,68,68,0.1)",
      border: "rgba(239,68,68,0.25)",
    };
  }
  if (r.includes("mod") || r.includes("med")) {
    return {
      color: "#FACC15",
      bg: "rgba(250,204,21,0.1)",
      border: "rgba(250,204,21,0.25)",
    };
  }
  return {
    color: "#22C55E",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.25)",
  };
};

// ── Site palette constants (from tailwind.config.js + index.css) ─────────────
const P = {
  neonBlue: "#4DA3FF", // neon.blue   — warm silver
  neonPurple: "#80BCFF", // neon.purple — dusty rose
  neonOrange: "#003D72", // neon.orange — davy's gray
  neonGreen: "#8A99AD", // neon.green  — dim gray (now muted slate gray)
  neonPink: "#B3D7FF", // neon.pink   — american silver
  bg: "#0c0c0e", // dark.card
  bgDark: "#08080a", // dark.secondary
  bgLighter: "#1c1b22", // dark.lighter
  border: "rgba(200,200,200,0.15)",
  borderHov: "rgba(200,200,200,0.3)",
};

// ── Layer config using site palette ─────────────────────────────────────────
const LAYER_CONFIG = [
  {
    key: "satellites",
    label: "ISRO Satellites",
    sublabel: "Active fleet",
    dotColor: P.neonBlue,
    activeBorder: P.neonBlue,
    activeBg: "rgba(204,183,174,0.08)",
    icon: SignalIcon,
  },
  {
    key: "orbits",
    label: "Orbital Paths",
    sublabel: "Trajectory lines",
    dotColor: "#FFFFFF",
    activeBorder: "rgba(255, 255, 255, 0.35)",
    activeBg: "rgba(255, 255, 255, 0.08)",
    icon: ({ className }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <ellipse cx="12" cy="12" rx="10" ry="4.5" />
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    key: "debris",
    label: "Space Debris",
    sublabel: "Tracked objects",
    dotColor: "#EF4444",
    activeBorder: "rgba(239, 68, 68, 0.35)",
    activeBg: "rgba(239, 68, 68, 0.08)",
    icon: ExclamationTriangleIcon,
  },
];

const Visualization3D = () => {
  const [selectedObject, setSelectedObject] = useState(null);
  const [fullscreenEl, setFullscreenEl] = useState<Element | null>(null);

  useEffect(() => {
    const handleFsChange = () => {
      setFullscreenEl(document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    document.addEventListener("msfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("msfullscreenchange", handleFsChange);
    };
  }, []);
  const [layers, setLayers] = useState({
    satellites: true,
    orbits: true,
    debris: true,
  });
  const [objects, setObjects] = useState([]);
  const [stats, setStats] = useState({
    totalObjects: 0,
    satellites: 0,
    debris: 0,
    highRisk: 0,
  });
  const utcClockRef = useRef(null); // direct DOM ref — avoids re-render every second

  // Live UTC clock — writes directly to DOM, no React state update
  useEffect(() => {
    const t = setInterval(() => {
      if (utcClockRef.current)
        utcClockRef.current.textContent =
          new Date().toISOString().slice(0, 19).replace("T", " ") + " UTC";
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Generate space objects
  const generateSpaceObjects = () => {
    const satellites = isroSatellites.map((sat, idx) => ({
      ...sat,
      latitude:
        sat.latitude || (sat.orbit === "GEO" ? 0 : (Math.random() - 0.5) * 120),
      longitude:
        sat.longitude ||
        (sat.orbit === "GEO"
          ? 70 + Math.random() * 20
          : (Math.random() - 0.5) * 360),
      velocity: sat.velocity || (sat.orbit === "GEO" ? 3.07 : 7.5),
      launchDate: (sat as any).launchDate || new Date("2020-01-01"),
      mass: (sat as any).mass || 1500,
      aop: (idx * 17) % 360,
      ma: (idx * 23) % 360,
    }));

    const debris = [];
    for (let i = 0; i < 150; i++) {
      // reduced from 350 for performance
      const rand = Math.random();
      let baseAlt,
        baseInc,
        isLEO = true;
      if (rand < 0.6) {
        baseAlt = 500 + Math.random() * 300;
        baseInc = 97.5 + (Math.random() - 0.5) * 5;
      } else if (rand < 0.8) {
        baseAlt = 600 + Math.random() * 400;
        baseInc = 85.0 + Math.random() * 10.0;
      } else {
        baseAlt = 35780 + Math.random() * 10;
        baseInc = (Math.random() - 0.5) * 3;
        isLEO = false;
      }
      debris.push({
        id: `debris-${i}`,
        name: `Space Debris ${i + 1}`,
        type: "debris",
        latitude: isLEO
          ? (Math.random() - 0.5) * 160
          : (Math.random() - 0.5) * 10,
        longitude: Math.random() * 360 - 180,
        altitude: baseAlt,
        velocity: isLEO
          ? 7.4 + (Math.random() - 0.5) * 0.5
          : 3.07 + (Math.random() - 0.5) * 0.1,
        inclination: baseInc,
        size: Math.random() * 8 + 0.1,
        riskLevel: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
        source: [
          "PSLV Stage Body",
          "GSLV Debris",
          "Space Debris",
          "Upper Stage Remnant",
        ][Math.floor(Math.random() * 4)],
        trackingConfidence: 75 + Math.random() * 25,
      });
    }
    return { satellites, debris };
  };

  useEffect(() => {
    const { satellites, debris } = generateSpaceObjects();
    setObjects([...satellites, ...debris]);
    setStats({
      totalObjects: satellites.length + debris.length,
      satellites: satellites.length,
      debris: debris.length,
      highRisk: debris.filter((d) => d.riskLevel === "high").length,
    });
  }, []);

  const toggleLayer = (key) =>
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  const filteredSatellites = useMemo(
    () => objects.filter((o) => o.type === "satellite" && layers.satellites),
    [objects, layers.satellites],
  );
  const filteredDebris = useMemo(
    () => objects.filter((o) => o.type === "debris" && layers.debris),
    [objects, layers.debris],
  );

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: P.bg,
        border: `1px solid ${P.border}`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      {/* ── Command Bar ─────────────────────────────────────────────────────── */}
      <MotionDiv
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ background: P.bgDark, borderBottom: `1px solid ${P.border}` }}
        className="px-5 py-4 flex flex-wrap items-center justify-between gap-4"
      >

        {/* KPI Chips */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: stats.satellites, label: "Satellites", dot: P.neonBlue },
            { value: stats.debris, label: "Debris Tracked", dot: "#FACC15" },
            { value: stats.highRisk, label: "High Risk", dot: "#EF4444" },
            {
              value: stats.totalObjects,
              label: "Total Objects",
              dot: P.neonBlue,
            },
          ].map(({ value, label, dot }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${P.border}`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: dot }}
              />
              <span className="text-sm font-normal font-mono text-white">
                {value}
              </span>
              <span className="text-[11px]" style={{ color: P.neonGreen }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* UTC clock + LIVE badge */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
          <div className="hidden md:block text-right">
            <p ref={utcClockRef} className="text-xs font-mono text-white/90">
              {new Date().toISOString().slice(0, 19).replace("T", " ")} UTC
            </p>
            <p className="text-[10px]" style={{ color: P.neonGreen }}>
              Indian Space Research Organisation
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.25)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#22C55E" }}
            />
            <span className="text-xs font-normal" style={{ color: "#22C55E" }}>
              LIVE
            </span>
          </div>
        </div>
      </MotionDiv>

      {/* ── Layer Controls ───────────────────────────────────────────────────── */}
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        style={{
          background: "rgba(8,8,10,0.7)",
          borderBottom: `1px solid ${P.border}`,
        }}
        className="px-5 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span
            className="text-[10px] uppercase tracking-widest font-normal mr-1 flex-shrink-0"
            style={{ color: P.neonGreen }}
          >
            Layers
          </span>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
            {LAYER_CONFIG.map(
              ({
                key,
                label,
                sublabel,
                dotColor,
                activeBorder,
                activeBg,
                icon: Icon,
              }) => {
                const isOn = layers[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleLayer(key)}
                    className="flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 w-fit"
                    style={{
                      background: isOn ? activeBg : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isOn ? activeBorder : P.border}`,
                      color: isOn ? "#e8e8e8" : P.neonGreen,
                    }}
                  >
                    {/* Mini toggle track */}
                    <span
                      className="relative flex-shrink-0 w-8 h-4 rounded-full transition-colors duration-200"
                      style={{
                        background: isOn
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(255,255,255,0.04)",
                      }}
                    >
                      <span
                        className="absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200"
                        style={{
                          background: isOn ? dotColor : "#3b3846",
                          left: isOn ? "17px" : "2px",
                        }}
                      />
                    </span>
                    <Icon
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: isOn ? dotColor : P.neonGreen }}
                    />
                    <span>{label}</span>
                    <span className="text-[10px]" style={{ color: P.neonGreen }}>
                      · {sublabel}
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </div>

        <span className="text-[11px] lg:ml-auto flex-shrink-0" style={{ color: P.neonGreen }}>
          Showing{" "}
          {(layers.satellites ? stats.satellites : 0) +
            (layers.debris ? stats.debris : 0)}{" "}
          objects
        </span>
      </MotionDiv>

      {/* ── Globe ───────────────────────────────────────────────────────────── */}
      <div className="h-[600px] relative">
        <HyperrealisticGlobe
          satellites={filteredSatellites}
          debris={filteredDebris}
          onObjectSelect={setSelectedObject}
          showControls={true}
          className="w-full h-full"
          settings={{ animationSpeed: 1, showOrbits: layers.orbits }}
        />
      </div>

      {/* ── Object Detail Modal ─────────────────────────────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {selectedObject && (
            <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedObject(null)}
                className="absolute inset-0"
                style={{
                  background: "rgba(0,0,0,0.8)",
                  backdropFilter: "blur(12px)",
                }}
              />

              <MotionDiv
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ type: "spring", stiffness: 340, damping: 28 }}
                className="relative w-full max-w-lg z-10 rounded-2xl overflow-hidden"
                style={{
                  background: P.bg,
                  border: `1px solid ${P.borderHov}`,
                  boxShadow: `0 0 60px rgba(0,0,0,0.9), 0 0 30px rgba(166,128,140,0.08)`,
                }}
              >
                {/* Modal header */}
                <div
                  className="px-5 pt-5 pb-4 flex items-start justify-between gap-3"
                  style={{
                    borderBottom: `1px solid ${P.border}`,
                    background:
                      selectedObject.type === "satellite"
                        ? "rgba(204,183,174,0.04)"
                        : "rgba(166,128,140,0.04)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background:
                          selectedObject.type === "satellite"
                            ? "rgba(204,183,174,0.08)"
                            : "rgba(250,204,21,0.08)",
                        border: `1px solid ${selectedObject.type === "satellite" ? P.border : "rgba(250,204,21,0.25)"}`,
                      }}
                    >
                      {selectedObject.type === "satellite" ? (
                        <RocketLaunchIcon
                          className="w-5 h-5"
                          style={{ color: P.neonBlue }}
                        />
                      ) : (
                        <ExclamationTriangleIcon
                          className="w-5 h-5"
                          style={{ color: "#FACC15" }}
                        />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-normal uppercase tracking-widest px-2 py-0.5 rounded-full"
                          style={{
                            color:
                              selectedObject.type === "satellite"
                                ? P.neonBlue
                                : "#FACC15",
                            background:
                              selectedObject.type === "satellite"
                                ? "rgba(204,183,174,0.1)"
                                : "rgba(250,204,21,0.1)",
                            border: `1px solid ${selectedObject.type === "satellite" ? "rgba(204,183,174,0.25)" : "rgba(250,204,21,0.25)"}`,
                          }}
                        >
                          {selectedObject.type === "satellite"
                            ? "ISRO Satellite"
                            : "Space Debris"}
                        </span>
                        {selectedObject.type === "debris" && (
                          <span
                            className="text-[10px] font-normal uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                              color: getDebrisRiskStyles(
                                selectedObject.riskLevel,
                              ).color,
                              background: getDebrisRiskStyles(
                                selectedObject.riskLevel,
                              ).bg,
                              border: `1px solid ${getDebrisRiskStyles(selectedObject.riskLevel).border}`,
                            }}
                          >
                            {selectedObject.riskLevel} risk
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-normal text-white tracking-tight leading-tight">
                        {selectedObject.name}
                      </h2>
                      {selectedObject.type === "satellite" &&
                        selectedObject.orbit && (
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: P.neonGreen }}
                          >
                            {selectedObject.orbit} Orbit ·{" "}
                            {selectedObject.operator || "ISRO"}
                          </p>
                        )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedObject(null)}
                    className="p-1.5 rounded-lg transition-all flex-shrink-0"
                    style={{
                      color: P.neonGreen,
                      border: "1px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.08)";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = P.neonGreen;
                    }}
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal body */}
                <div
                  className="p-5 space-y-3 max-h-[65vh] overflow-y-auto [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {/* Altitude + Velocity */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Altitude",
                        value: `${selectedObject.altitude?.toFixed(1)} km`,
                        sub:
                          selectedObject.altitude > 35000
                            ? "GEO"
                            : selectedObject.altitude > 2000
                              ? "MEO"
                              : "LEO",
                      },
                      {
                        label: "Velocity",
                        value: `${selectedObject.velocity?.toFixed(2)} km/s`,
                        sub: "Orbital speed",
                      },
                    ].map(({ label, value, sub }) => (
                      <div
                        key={label}
                        className="rounded-xl p-3"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: `1px solid ${P.border}`,
                        }}
                      >
                        <p
                          className="text-[10px] uppercase tracking-wider font-normal mb-1"
                          style={{ color: P.neonGreen }}
                        >
                          {label}
                        </p>
                        <p className="text-lg font-normal font-mono text-white leading-tight">
                          {value}
                        </p>
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: P.neonGreen }}
                        >
                          {sub}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Coordinates */}
                  <div
                    className="rounded-xl p-3"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${P.border}`,
                    }}
                  >
                    <p
                      className="text-[10px] uppercase tracking-wider font-normal mb-2"
                      style={{ color: P.neonGreen }}
                    >
                      Orbital Position
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                      {[
                        ["Latitude", `${selectedObject.latitude?.toFixed(4)}°`],
                        [
                          "Longitude",
                          `${selectedObject.longitude?.toFixed(4)}°`,
                        ],
                        selectedObject.inclination != null && [
                          "Inclination",
                          `${selectedObject.inclination?.toFixed(2)}°`,
                        ],
                      ]
                        .filter(Boolean)
                        .map(([k, v]) => (
                          <div key={k}>
                            <span
                              className="text-[10px]"
                              style={{ color: P.neonGreen }}
                            >
                              {k}
                            </span>
                            <p className="text-white font-normal">{v}</p>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Keplerian Elements — satellites only */}
                  {selectedObject.type === "satellite" &&
                    selectedObject.raan != null && (
                      <div
                        className="rounded-xl p-3"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: `1px solid ${P.border}`,
                        }}
                      >
                        <p
                          className="text-[10px] uppercase tracking-wider font-normal mb-2"
                          style={{ color: P.neonGreen }}
                        >
                          Keplerian Elements
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono">
                          {[
                            ["RAAN", `${selectedObject.raan?.toFixed(2)}°`],
                            [
                              "Arg. Perigee",
                              `${selectedObject.aop?.toFixed(2)}°`,
                            ],
                            [
                              "Mean Anomaly",
                              `${selectedObject.ma?.toFixed(2)}°`,
                            ],
                          ].map(([k, v]) => (
                            <div
                              key={k}
                              className="flex justify-between pb-1"
                              style={{ borderBottom: `1px solid ${P.border}` }}
                            >
                              <span style={{ color: P.neonGreen }}>{k}</span>
                              <span className="text-white">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Mission — satellites */}
                  {selectedObject.type === "satellite" && (
                    <div
                      className="rounded-xl p-3"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${P.border}`,
                      }}
                    >
                      <p
                        className="text-[10px] uppercase tracking-wider font-normal mb-2"
                        style={{ color: P.neonGreen }}
                      >
                        Mission
                      </p>
                      <p className="text-sm text-white leading-relaxed">
                        {selectedObject.mission}
                      </p>
                      {(selectedObject.mass || selectedObject.launchDate) && (
                        <div
                          className="flex gap-6 mt-3 pt-2 text-xs"
                          style={{ borderTop: `1px solid ${P.border}` }}
                        >
                          {selectedObject.mass && (
                            <div>
                              <span style={{ color: P.neonGreen }}>Mass </span>
                              <span className="text-white font-normal">
                                {selectedObject.mass} kg
                              </span>
                            </div>
                          )}
                          {selectedObject.launchDate && (
                            <div>
                              <span style={{ color: P.neonGreen }}>
                                Launch{" "}
                              </span>
                              <span className="text-white font-normal">
                                {new Date(
                                  selectedObject.launchDate,
                                ).getFullYear?.() || selectedObject.launchDate}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tracking — debris */}
                  {selectedObject.type === "debris" && (
                    <div
                      className="rounded-xl p-3"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${P.border}`,
                      }}
                    >
                      <p
                        className="text-[10px] uppercase tracking-wider font-normal mb-2"
                        style={{ color: P.neonGreen }}
                      >
                        Debris Tracking
                      </p>
                      <div className="space-y-2 text-xs">
                        {[
                          ["Size", `${selectedObject.size?.toFixed(2)} m`],
                          ["Source", selectedObject.source],
                          [
                            "Tracking Confidence",
                            `${selectedObject.trackingConfidence?.toFixed(1)}%`,
                          ],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span style={{ color: P.neonGreen }}>{k}</span>
                            <span className="text-white font-normal font-mono">
                              {v}
                            </span>
                          </div>
                        ))}
                        <div
                          className="mt-2 pt-2"
                          style={{ borderTop: `1px solid ${P.border}` }}
                        >
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ background: "rgba(255,255,255,0.06)" }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${selectedObject.trackingConfidence?.toFixed(0)}%`,
                                background: "#FFFFFF",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Risk indicator */}
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{
                      background:
                        selectedObject.type === "satellite"
                          ? "rgba(34,197,94,0.1)"
                          : getDebrisRiskStyles(selectedObject.riskLevel).bg,
                      border: `1px solid ${selectedObject.type === "satellite" ? "rgba(34,197,94,0.25)" : getDebrisRiskStyles(selectedObject.riskLevel).border}`,
                    }}
                  >
                    <ExclamationTriangleIcon
                      className="w-4 h-4 flex-shrink-0"
                      style={{
                        color:
                          selectedObject.type === "satellite"
                            ? "#22C55E"
                            : getDebrisRiskStyles(selectedObject.riskLevel)
                                .color,
                      }}
                    />
                    <div>
                      <p
                        className="text-[10px] uppercase tracking-wider font-normal"
                        style={{ color: P.neonGreen }}
                      >
                        Collision Risk
                      </p>
                      <p
                        className="text-xs font-medium"
                        style={{
                          color:
                            selectedObject.type === "satellite"
                              ? "#22C55E"
                              : getDebrisRiskStyles(selectedObject.riskLevel)
                                  .color,
                        }}
                      >
                        {selectedObject.type === "satellite"
                          ? "Zero risk — operating on active cleared orbit"
                          : `${selectedObject.riskLevel?.toUpperCase()} — active debris tracking enabled`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div
                  className="px-5 py-3 flex items-center justify-between"
                  style={{
                    borderTop: `1px solid ${P.border}`,
                    background: "rgba(8,8,10,0.5)",
                  }}
                >
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: P.neonGreen }}
                  >
                    Source: SGP4 / TLE · ISRO ISTRAC
                  </span>
                  <button
                    onClick={() => setSelectedObject(null)}
                    className="px-4 py-1.5 text-xs font-medium rounded-lg transition-all"
                    style={{
                      color: P.neonBlue,
                      border: `1px solid rgba(204,183,174,0.25)`,
                      background: "rgba(204,183,174,0.06)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(204,183,174,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(204,183,174,0.06)";
                    }}
                  >
                    Close
                  </button>
                </div>
              </MotionDiv>
            </div>
          )}
        </AnimatePresence>,
        fullscreenEl || document.body,
      )}
    </div>
  );
};

export default Visualization3D;
