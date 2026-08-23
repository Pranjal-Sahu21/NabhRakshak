import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as React.FC<any>;
import { isroSatellites } from "../../data/isroSatellites";
import { ScrollContainer } from "../Common/ScrollContainer";

// ─── Static Mission Data ──────────────────────────────────────────────────────

const STATIC_MISSIONS = [
  {
    id: 1,
    missionName: "GSLV Mk III-M1",
    rocketType: "GSLV",
    launchDate: "2019-07-22T09:13:00Z",
    payload: "Chandrayaan-2",
    payloadMass: 3850,
    orbitType: "GTO",
    status: "monitoring",
    catalogId: "ISRO-2019-042",
  },
  {
    id: 2,
    missionName: "PSLV-C44",
    rocketType: "PSLV",
    launchDate: "2019-01-24T06:37:00Z",
    payload: "Microsat-R",
    payloadMass: 740,
    orbitType: "LEO",
    status: "decayed",
    catalogId: "ISRO-2019-006",
  },
  {
    id: 3,
    missionName: "PSLV-C46",
    rocketType: "PSLV",
    launchDate: "2019-05-22T03:30:00Z",
    payload: "RISAT-2B",
    payloadMass: 615,
    orbitType: "LEO",
    status: "active",
    catalogId: "ISRO-2019-028",
  },
  {
    id: 4,
    missionName: "PSLV-C47",
    rocketType: "PSLV",
    launchDate: "2019-11-27T03:25:00Z",
    payload: "Cartosat-3",
    payloadMass: 1625,
    orbitType: "SSO",
    status: "active",
    catalogId: "ISRO-2019-077",
  },
  {
    id: 5,
    missionName: "PSLV-C49",
    rocketType: "PSLV",
    launchDate: "2020-11-07T09:02:00Z",
    payload: "EOS-01",
    payloadMass: 1710,
    orbitType: "SSO",
    status: "active",
    catalogId: "ISRO-2020-074",
  },
  {
    id: 6,
    missionName: "PSLV-C50",
    rocketType: "PSLV",
    launchDate: "2020-12-17T10:41:00Z",
    payload: "CMS-01",
    payloadMass: 1410,
    orbitType: "GEO",
    status: "active",
    catalogId: "ISRO-2020-089",
  },
  {
    id: 7,
    missionName: "PSLV-C51",
    rocketType: "PSLV",
    launchDate: "2021-02-28T10:24:00Z",
    payload: "Amazonia-1",
    payloadMass: 637,
    orbitType: "SSO",
    status: "active",
    catalogId: "ISRO-2021-015",
  },
  {
    id: 8,
    missionName: "GSLV-F10",
    rocketType: "GSLV",
    launchDate: "2021-08-12T03:13:00Z",
    payload: "EOS-03",
    payloadMass: 2268,
    orbitType: "GTO",
    status: "decayed",
    catalogId: "ISRO-2021-063",
  },
  {
    id: 9,
    missionName: "PSLV-C52",
    rocketType: "PSLV",
    launchDate: "2022-02-14T06:00:00Z",
    payload: "EOS-04",
    payloadMass: 1710,
    orbitType: "SSO",
    status: "active",
    catalogId: "ISRO-2022-010",
  },
  {
    id: 10,
    missionName: "LVM3-M2",
    rocketType: "LVM3",
    launchDate: "2023-03-26T09:00:00Z",
    payload: "OneWeb India-2",
    payloadMass: 5805,
    orbitType: "LEO",
    status: "active",
    catalogId: "ISRO-2023-021",
  },
  {
    id: 11,
    missionName: "PSLV-C55",
    rocketType: "PSLV",
    launchDate: "2023-04-22T09:49:00Z",
    payload: "TeLEOS-2",
    payloadMass: 741,
    orbitType: "SSO",
    status: "active",
    catalogId: "ISRO-2023-030",
  },
  {
    id: 12,
    missionName: "PSLV-C56",
    rocketType: "PSLV",
    launchDate: "2023-07-30T06:01:00Z",
    payload: "DS-SAR",
    payloadMass: 352,
    orbitType: "SSO",
    status: "active",
    catalogId: "ISRO-2023-055",
  },
  {
    id: 13,
    missionName: "PSLV-C57",
    rocketType: "PSLV",
    launchDate: "2023-09-02T11:50:00Z",
    payload: "Aditya-L1",
    payloadMass: 1480,
    orbitType: "GTO",
    status: "monitoring",
    catalogId: "ISRO-2023-068",
  },
  {
    id: 14,
    missionName: "LVM3-M3",
    rocketType: "LVM3",
    launchDate: "2024-03-22T12:00:00Z",
    payload: "OneWeb India-3",
    payloadMass: 5796,
    orbitType: "LEO",
    status: "active",
    catalogId: "ISRO-2024-018",
  },
  {
    id: 15,
    missionName: "SSLV-D3",
    rocketType: "SSLV",
    launchDate: "2024-08-16T03:47:00Z",
    payload: "EOS-08",
    payloadMass: 175,
    orbitType: "SSO",
    status: "active",
    catalogId: "ISRO-2024-052",
  },
];

// Build the complete list of 54 missions dynamically from the fleet
const buildAllMissions = () => {
  const covered = new Set(STATIC_MISSIONS.map((m) => m.payload.toLowerCase()));
  const list = [...STATIC_MISSIONS];

  isroSatellites.forEach((sat, idx) => {
    const lowerName = sat.name.toLowerCase();
    let isCovered = false;
    for (const p of covered) {
      if (lowerName.includes(p) || p.includes(lowerName)) {
        isCovered = true;
        break;
      }
    }
    if (isCovered) return;

    // Determine rocket type
    let rocketType = "PSLV";
    if (sat.name.startsWith("GSAT") || sat.name.startsWith("INSAT")) {
      rocketType = "GSLV";
    } else if (
      sat.name.startsWith("EOS-08") ||
      sat.name.startsWith("SSLV") ||
      sat.name.startsWith("INS-")
    ) {
      rocketType = "SSLV";
    } else if (sat.name.startsWith("OneWeb")) {
      rocketType = "LVM3";
    }

    // Determine launch date staggered between 2019 and 2024
    const year = 2019 + (idx % 6);
    const month = 1 + (idx % 12);
    const day = 1 + (idx % 28);
    const hour = idx % 24;
    const min = idx % 60;
    const launchDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00Z`;

    // Determine mission name
    let missionName = "";
    if (rocketType === "GSLV") {
      missionName = `GSLV-F${12 + (idx % 8)}`;
    } else if (rocketType === "LVM3") {
      missionName = `LVM3-M${4 + (idx % 4)}`;
    } else if (rocketType === "SSLV") {
      missionName = `SSLV-D${4 + (idx % 2)}`;
    } else {
      missionName = `PSLV-C${40 + (idx % 15)}`;
    }

    list.push({
      id: 100 + idx,
      missionName,
      rocketType,
      launchDate,
      payload: sat.name,
      payloadMass: (sat as any).mass || 1200 + (idx % 10) * 150,
      orbitType: sat.orbit || "LEO",
      status: sat.status === "active" ? "active" : "decayed",
      catalogId: sat.id,
    });
  });

  // Sort chronologically in ascending order
  return list.sort(
    (a, b) =>
      new Date(a.launchDate).getTime() - new Date(b.launchDate).getTime(),
  );
};

const MISSIONS = buildAllMissions();

// ─── Style Maps ──────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  active: { bg: "#1e2e22", text: "#7a9878", dot: "#7a9878", label: "Active" },
  decommissioned: {
    bg: "#222222",
    text: "#888888",
    dot: "#888888",
    label: "Decommissioned",
  },
  monitoring: {
    bg: "#2a2418",
    text: "#9a8060",
    dot: "#9a8060",
    label: "Monitoring",
  },
  decayed: { bg: "#1e1e1e", text: "#666666", dot: "#555555", label: "Decayed" },
};

const ROCKET_STYLES = {
  PSLV: { bg: "#1e2030", text: "#8899cc" },
  GSLV: { bg: "#201e30", text: "#aa88cc" },
  LVM3: { bg: "#202830", text: "#7aabcc" },
  SSLV: { bg: "#1e2820", text: "#7acc99" },
};

const ORBIT_STYLES = {
  LEO: { bg: "#1e2020", text: "#6aabab" },
  GEO: { bg: "#20201e", text: "#ababaa" },
  SSO: { bg: "#201e1e", text: "#cc8888" },
  GTO: { bg: "#1e201e", text: "#88aa88" },
};

const ROCKET_FILTERS = ["All", "PSLV", "GSLV", "LVM3", "SSLV"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getYear(isoString) {
  return new Date(isoString).getFullYear();
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Chip({ label, bg, text, style = {} }: any) {
  return (
    <span
      style={{
        backgroundColor: bg,
        color: text,
        fontSize: "10px",
        fontWeight: 400,
        letterSpacing: "0.06em",
        padding: "2px 7px",
        borderRadius: "3px",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {label}
    </span>
  );
}

function MissionRow({ mission, showYear }) {
  const status = STATUS_STYLES[mission.status] || STATUS_STYLES.monitoring;
  const rocket = ROCKET_STYLES[mission.rocketType] || ROCKET_STYLES.PSLV;
  const orbit = ORBIT_STYLES[mission.orbitType] || ORBIT_STYLES.LEO;
  const year = getYear(mission.launchDate);

  return (
    <>
      {showYear && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 0 6px 0",
          }}
        >
          <div style={{ width: "32px", flexShrink: 0 }} />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 400,
              letterSpacing: "0.14em",
              color: "#4a4a4a",
              textTransform: "uppercase",
            }}
          >
            {year}
          </span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#2a2a2a" }} />
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          position: "relative",
        }}
      >
        {/* Timeline column */}
        <div
          style={{
            width: "32px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            alignSelf: "stretch",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "1px",
              backgroundColor: "#2a2a2a",
            }}
          />
          <div
            style={{
              marginTop: "14px",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: status.dot,
              flexShrink: 0,
              zIndex: 1,
              border: "2px solid #111111",
              outline: `1px solid ${status.dot}`,
            }}
          />
        </div>

        {/* Card */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(255,255,255,0.02)",
            border: "1px solid #222222",
            borderRadius: "6px",
            padding: "10px 14px",
            margin: "4px 0 4px 10px",
            cursor: "default",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#444444";
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#222222";
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)";
          }}
        >
          {/* Top row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "6px",
              marginBottom: "5px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: "#555555",
                fontVariantNumeric: "tabular-nums",
                marginRight: "2px",
              }}
            >
              {formatDate(mission.launchDate)}
            </span>
            <Chip
              label={mission.rocketType}
              bg={rocket.bg}
              text={rocket.text}
            />
            <Chip label={mission.orbitType} bg={orbit.bg} text={orbit.text} />
          </div>

          {/* Mission name */}
          <div
            style={{
              fontSize: "13px",
              fontWeight: 400,
              color: "#e8e8e8",
              letterSpacing: "0.02em",
              marginBottom: "5px",
              lineHeight: 1.3,
            }}
          >
            {mission.missionName}
          </div>

          {/* Bottom row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "11px", color: "#888888" }}>
              {mission.payload}
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "#444444",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {mission.payloadMass.toLocaleString()} kg
            </span>
            <span style={{ flex: 1 }} />
            <Chip label={status.label} bg={status.bg} text={status.text} />
            <span
              style={{
                fontSize: "9px",
                color: "#383838",
                fontFamily: "monospace",
                letterSpacing: "0.04em",
              }}
            >
              {mission.catalogId}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LaunchHistoryFeed() {
  const [search, setSearch] = useState("");
  const [rocketFilter, setRocketFilter] = useState("All");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
  }, [search, rocketFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MISSIONS.filter((m) => {
      const matchesSearch =
        !q ||
        m.missionName.toLowerCase().includes(q) ||
        m.payload.toLowerCase().includes(q) ||
        m.catalogId.toLowerCase().includes(q);
      const matchesRocket =
        rocketFilter === "All" || m.rocketType === rocketFilter;
      return matchesSearch && matchesRocket;
    });
  }, [search, rocketFilter]);

  const displayed = useMemo(() => {
    const idx = filtered.findIndex((m) => m.missionName === "PSLV-C46");
    if (idx !== -1) {
      return filtered.slice(0, idx + 1);
    }
    return filtered.slice(0, 8);
  }, [filtered]);

  const yearsShown = new Set();
  const modalYearsShown = new Set();

  return (
    <div
      style={{
        backgroundColor: "rgba(0,0,0,0.4)",
        border: "1px solid #222222",
        borderRadius: "8px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 400,
              color: "#e8e8e8",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            ISRO Launch History
          </div>
          <div style={{ fontSize: "10px", color: "#555555", marginTop: "2px" }}>
            {filtered.length} of {MISSIONS.length} missions
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#555555"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: "absolute",
              left: "9px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search missions…"
            style={{
              backgroundColor: "#000000",
              border: "1px solid #222222",
              borderRadius: "5px",
              color: "#e8e8e8",
              fontSize: "11px",
              padding: "6px 10px 6px 28px",
              outline: "none",
              width: "180px",
              caretColor: "#ffffff",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#444444";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#222222";
            }}
          />
        </div>
      </div>

      {/* Rocket filter pills */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "14px",
          flexWrap: "wrap",
        }}
      >
        {ROCKET_FILTERS.map((rf) => {
          const active = rocketFilter === rf;
          const rStyle = rf !== "All" ? ROCKET_STYLES[rf] : null;
          return (
            <button
              key={rf}
              onClick={() => setRocketFilter(rf)}
              style={{
                backgroundColor: active
                  ? rStyle
                    ? rStyle.bg
                    : "#2a2a2a"
                  : "#161616",
                color: active ? (rStyle ? rStyle.text : "#aaaaaa") : "#555555",
                border: `1px solid ${active ? (rStyle ? rStyle.bg : "#3a3a3a") : "#222222"}`,
                borderRadius: "4px",
                fontSize: "10px",
                fontWeight: 400,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                padding: "4px 10px",
                cursor: "pointer",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.color = "#888888";
                  e.currentTarget.style.borderColor = "#2a2a2a";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.color = "#555555";
                  e.currentTarget.style.borderColor = "#222222";
                }
              }}
            >
              {rf}
            </button>
          );
        })}
      </div>

      {/* Scrollable list */}
      <ScrollContainer
        keyDependency={`${search}-${rocketFilter}`}
        maxClass="flex-grow overflow-y-auto"
        className="overflow-x-hidden"
        shadowColor="from-black"
      >
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "#444444",
              fontSize: "12px",
              letterSpacing: "0.04em",
            }}
          >
            No missions match your search.
          </div>
        ) : (
          displayed.map((mission) => {
            const year = getYear(mission.launchDate);
            const showYear = !yearsShown.has(year);
            if (showYear) yearsShown.add(year);
            return (
              <MissionRow
                key={mission.id}
                mission={mission}
                showYear={showYear}
              />
            );
          })
        )}

        {/* Timeline end cap */}
        {filtered.length > 0 && (
          <div
            style={{ display: "flex", alignItems: "center", padding: "4px 0" }}
          >
            <div
              style={{
                width: "32px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  backgroundColor: "#2a2a2a",
                }}
              />
            </div>
          </div>
        )}
      </ScrollContainer>

      {filtered.length > 8 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "12px",
          }}
        >
          <button
            onClick={() => setIsExpanded(true)}
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid #222222",
              borderRadius: "6px",
              color: "#e8e8e8",
              fontSize: "11px",
              fontWeight: 400,
              padding: "6px 16px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#444444";
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#222222";
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
            }}
          >
            View All ({filtered.length})
          </button>
        </div>
      )}

      {/* Full Launch History Modal Popup */}
      {createPortal(
        <AnimatePresence>
          {isExpanded && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              {/* Backdrop overlay with blur */}
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsExpanded(false)}
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
              />

              {/* Modal Card */}
              <MotionDiv
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="relative w-full max-w-3xl bg-black border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden z-10 p-6 text-white flex flex-col max-h-[85vh]"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4 flex-shrink-0">
                  <div>
                    <h2 className="text-2xl font-normal text-white">
                      ISRO Space Mission Registry
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#9ca3af",
                      cursor: "pointer",
                      fontSize: "28px",
                      lineHeight: "1",
                      padding: "4px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#9ca3af";
                    }}
                  >
                    &times;
                  </button>
                </div>

                {/* Timeline Container */}
                <ScrollContainer
                  keyDependency={`${search}-${rocketFilter}`}
                  maxClass="flex-grow overflow-y-auto"
                  shadowColor="from-black"
                >
                  {filtered.map((mission) => {
                    const year = getYear(mission.launchDate);
                    const showYear = !modalYearsShown.has(year);
                    if (showYear) modalYearsShown.add(year);
                    return (
                      <MissionRow
                        key={mission.id}
                        mission={mission}
                        showYear={showYear}
                      />
                    );
                  })}

                  {/* Timeline end cap */}
                  {filtered.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "4px 0",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            width: "4px",
                            height: "4px",
                            borderRadius: "50%",
                            backgroundColor: "#2a2a2a",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </ScrollContainer>
              </MotionDiv>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
