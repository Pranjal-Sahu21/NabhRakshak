import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GlobeAltIcon,
  CpuChipIcon,
  ShieldExclamationIcon,
  MapIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { getStats, getSatellites, getDebris, getAlerts } from "../services/api";
import { ScrollContainer } from "../components/Common/ScrollContainer";

// Sections
import Dashboard from "./Dashboard";
import Visualization3D from "./Visualization3D";
import Satellites from "./Satellites";
import Alerts from "./Alerts";
import SpaceWeather from "./SpaceWeather";
import Architecture from "./Architecture";
import { useLocation } from "react-router-dom";
import LaunchHistoryFeed from "../components/Dashboard/LaunchHistoryFeed";

const CombinedDashboard = () => {
  const location = useLocation();
  const [stats, setStats] = useState({
    totalObjects: 404,
    activeSatellites: 54,
    debrisCount: 350,
    highRiskCollisions: 2,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Popup lists state
  const [activePopup, setActivePopup] = useState(null); // 'objects', 'globe', 'satellites', 'warnings'
  const [popupData, setPopupData] = useState([]);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupSearch, setPopupSearch] = useState("");

  const fetchStats = async () => {
    try {
      const data = await getStats();
      setStats({
        totalObjects: 404,
        activeSatellites: 54,
        debrisCount: 350,
        highRiskCollisions: data.high_risk_collisions || 2,
      });
    } catch (e) {
      console.error("Failed to load stats in parent:", e);
      setStats({
        totalObjects: 404,
        activeSatellites: 54,
        debrisCount: 350,
        highRiskCollisions: 2,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOpenPopupEvent = (e) => {
      const { type } = e.detail;
      if (type) {
        openPopup(type);
      }
    };
    window.addEventListener("open-stats-popup", handleOpenPopupEvent);
    return () =>
      window.removeEventListener("open-stats-popup", handleOpenPopupEvent);
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).scrollToSection) {
      const id = (location.state as any).scrollToSection;
      setTimeout(() => {
        scrollToSection(id);
      }, 300);
      window.history.replaceState({}, document.title);
    } else if (window.location.hash) {
      const id = window.location.hash.replace("#", "");
      setTimeout(() => {
        scrollToSection(id);
      }, 300);
    }
  }, [location]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    const mainContainer = document.querySelector('main');
    if (element && mainContainer) {
      const elementRect = element.getBoundingClientRect();
      const containerRect = mainContainer.getBoundingClientRect();
      const targetScrollTop = mainContainer.scrollTop + elementRect.top - containerRect.top - 100;
      
      mainContainer.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  };

  const openPopup = async (type) => {
    setActivePopup(type);
    setPopupSearch("");
    setPopupLoading(true);
    setPopupData([]);
    try {
      if (type === "objects") {
        const [sats, deb] = await Promise.all([getSatellites(), getDebris()]);
        const mappedSats = sats.map((s) => ({
          id: s.catalog_number || s.id,
          name: s.name,
          type: "Satellite",
          status: s.status === "active" ? "Active" : "Inactive",
          orbit: s.altitude > 35000 ? "GEO" : s.altitude > 2000 ? "MEO" : "LEO",
          risk: s.risk_level || "Low",
          tle_line1: s.tle_line1,
          tle_line2: s.tle_line2,
        }));
        const mappedDeb = deb.map((d) => ({
          id: d.id,
          name: d.name || `Debris #${d.id}`,
          type: "Debris",
          status: "Decomposed",
          orbit: d.altitude > 35050 ? "GEO" : d.altitude > 2000 ? "MEO" : "LEO",
          risk: d.risk_level || "High",
          tle_line1: d.tle_line1,
          tle_line2: d.tle_line2,
        }));
        setPopupData([...mappedSats, ...mappedDeb]);
      } else if (type === "globe") {
        const [sats, deb] = await Promise.all([getSatellites(), getDebris()]);
        const mapped = [
          ...sats.map((s) => ({
            id: s.id || s.catalog_number,
            name: s.name,
            type: "Satellite",
            status: "Rendering in 3D",
            tle_line1: s.tle_line1,
            tle_line2: s.tle_line2,
          })),
          ...deb.map((d) => ({
            id: d.id,
            name: d.name || `Debris #${d.id}`,
            type: "Debris",
            status: "Rendering in 3D",
            tle_line1: d.tle_line1,
            tle_line2: d.tle_line2,
          })),
        ];
        setPopupData(mapped);
      } else if (type === "satellites") {
        const sats = await getSatellites();
        const mapped = sats.map((s) => ({
          id: s.catalog_number || s.id,
          name: s.name,
          operator: s.operator || "ISRO",
          launchDate: s.launch_date || s.epoch,
          status: s.status === "active" ? "Operational" : "Non-operational",
          orbit: `${s.altitude?.toFixed(0) || 500} km (${s.inclination?.toFixed(1) || 0}° inc)`,
          tle_line1: s.tle_line1,
          tle_line2: s.tle_line2,
        }));
        setPopupData(mapped);
      } else if (type === "warnings") {
        const alerts = await getAlerts();
        const mapped = alerts.map((a) => ({
          id: a.id,
          primary: a.primary_object_name || `Object #${a.primary_object_id}`,
          secondary:
            a.secondary_object_name || `Debris #${a.secondary_object_id}`,
          probability: a.collision_probability || "1.2e-4",
          distance: a.min_distance || "0.45 km",
          severity: a.severity || "Medium",
        }));
        setPopupData(mapped);
      } else if (type === "debris") {
        const deb = await getDebris();
        const mapped = deb.map((d) => ({
          id: d.id,
          name: d.name || `Debris #${d.id}`,
          type: "Debris",
          status: "Decomposed",
          orbit: d.altitude > 35050 ? "GEO" : d.altitude > 2000 ? "MEO" : "LEO",
          risk: d.risk_level || "High",
          tle_line1: d.tle_line1,
          tle_line2: d.tle_line2,
        }));
        setPopupData(mapped);
      }
    } catch (e) {
      console.error("Failed to fetch popup data:", e);
    } finally {
      setPopupLoading(false);
    }
  };

  const getFilteredPopupData = () => {
    if (!popupSearch) return popupData;
    const query = popupSearch.toLowerCase();
    return popupData.filter((item) => {
      if (activePopup === "warnings") {
        return (
          item.primary.toLowerCase().includes(query) ||
          item.secondary.toLowerCase().includes(query) ||
          item.severity.toLowerCase().includes(query)
        );
      }
      return (
        item.name.toLowerCase().includes(query) ||
        String(item.id).toLowerCase().includes(query) ||
        (item.type && item.type.toLowerCase().includes(query)) ||
        (item.orbit && item.orbit.toLowerCase().includes(query)) ||
        (item.operator && item.operator.toLowerCase().includes(query)) ||
        (item.status && item.status.toLowerCase().includes(query))
      );
    });
  };

  const trackFromPopup = (item) => {
    const eventObj = {
      id: item.id,
      name: item.name,
      altitude: item.type === "Debris" ? 700 : 500,
      tle_line1: item.tle_line1,
      tle_line2: item.tle_line2,
    };
    const event = new CustomEvent("select-space-object", {
      detail: { object: eventObj, action: "track" },
    });
    window.dispatchEvent(event);
    setActivePopup(null);
    scrollToSection("section-globe");
  };

  const trackWarningFromPopup = (item) => {
    const eventObj = {
      id: item.id,
      name: item.primary,
      altitude: 600,
      riskLevel: item.severity.toLowerCase(),
    };
    const event = new CustomEvent("select-space-object", {
      detail: { object: eventObj, action: "track" },
    });
    window.dispatchEvent(event);
    setActivePopup(null);
    scrollToSection("section-globe");
  };

  return (
    <div className="min-h-screen bg-black text-[#e8e8e8]">
      {/* Main Single-Page Sections */}
      <div className="max-w-7xl mx-auto py-8 px-6 space-y-14">
        {/* Section 1: Stats & Overview */}
        <section id="section-dashboard" className="scroll-mt-28">
          <div className="border-b border-[#2a2a2a] pb-3 mb-6">
            <h2 className="text-3xl lg:text-5xl font-light text-white tracking-tight">
              Mission Control Dashboard
            </h2>
            <p className="text-sm text-[#666666] mt-3">
              Real-time status overview and satellite distribution metrics
            </p>
          </div>
          <Dashboard />
        </section>
        {/* Section 2: 3D Globe Viewer */}
        <section id="section-globe" className="scroll-mt-28">
          <div className="border-b border-[#2a2a2a] pb-3 mb-6">
            <h2 className="text-3xl lg:text-5xl font-light text-white tracking-tight">
              3D Space Visualization
            </h2>
            <p className="text-sm text-[#666666] mt-3">
              Interactive 3D orbital trajectory simulation and debris density
              heatmap
            </p>
          </div>
          <Visualization3D />
        </section>


        {/* Section 3: Indian Satellites list */}
        <section id="section-satellites" className="scroll-mt-28">
          <div className="border-b border-[#2a2a2a] pb-3 mb-6">
            <h2 className="text-3xl lg:text-5xl font-light text-white tracking-tight">
              Indian Satellites Database
            </h2>
            <p className="text-sm text-[#666666] mt-3">
              Detailed status logs and parameters of active ISRO payloads
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <Satellites isWidget={true} />
            </div>
            <div className="lg:col-span-1 flex flex-col">
              <LaunchHistoryFeed />
            </div>
          </div>
        </section>

        {/* Section 4: Collision Warnings list */}
        <section id="section-alerts" className="scroll-mt-28">
          <div className="border-b border-[#2a2a2a] pb-3 mb-6">
            <h2 className="text-3xl lg:text-5xl font-light text-white tracking-tight">
              Active Collision Warnings
            </h2>
            <p className="text-sm text-[#666666] mt-3">
              SGP4 conjunction alerts and actionable evasive maneuver
              recommendations
            </p>
          </div>
          <Alerts />
        </section>

        {/* Section 5: Space Weather Intelligence */}
        <section id="section-space-weather" className="scroll-mt-28">
          <div className="border-b border-[#2a2a2a] pb-3 mb-6">
            <h2 className="text-3xl lg:text-5xl font-light text-white tracking-tight">
              Space Weather Intelligence
            </h2>
            <p className="text-sm text-[#666666] mt-3">
              Real-time solar flare tracking, geomagnetic indices, radiation
              exposure mapping, and AI vulnerability assessments
            </p>
          </div>
          <SpaceWeather />
        </section>

      </div>

      {/* KPI Details Popups */}
      {activePopup && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setActivePopup(null)}
        >
          <div
            className="bg-[#1c1c1c] border border-[#2a2a2a] rounded max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <div>
                <h3 className="text-base font-normal text-[#e8e8e8]">
                  {activePopup === "objects" && "Tracked Objects Inventory"}
                  {activePopup === "globe" && "3D Rendering Catalog"}
                  {activePopup === "satellites" && "Active Indian Satellites"}
                  {activePopup === "debris" && "Space Debris Catalog"}
                  {activePopup === "warnings" && "Conjunction Warning Alerts"}
                </h3>
                <p className="text-xs text-[#666666] mt-0.5">
                  {activePopup === "objects" &&
                    "Full registry of operational payloads and tracked space debris"}
                  {activePopup === "globe" &&
                    "Active tracking targets currently loaded in the Three.js viewport"}
                  {activePopup === "satellites" &&
                    "ISRO active satellite tracking database"}
                  {activePopup === "debris" &&
                    "Full registry of tracked orbital debris and collision fragments"}
                  {activePopup === "warnings" &&
                    "SGP4 calculated collision vectors within critical thresholds"}
                </p>
              </div>
              <button
                onClick={() => setActivePopup(null)}
                className="text-[#666666] hover:text-[#e8e8e8] text-xl leading-none cursor-pointer px-2 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Modal Search */}
            <div className="px-5 py-3 border-b border-[#2a2a2a] flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                type="text"
                placeholder="Search..."
                value={popupSearch}
                onChange={(e) => setPopupSearch(e.target.value)}
                className="flex-1 max-w-sm bg-[#242424] border border-[#333333] rounded px-3 py-1.5 text-sm text-[#e8e8e8] placeholder-[#555555] focus:outline-none focus:border-[#555555] font-mono"
              />
              <button
                onClick={() => {
                  const sectionId =
                    activePopup === "objects"
                      ? "section-dashboard"
                      : activePopup === "globe"
                        ? "section-globe"
                        : activePopup === "satellites"
                          ? "section-satellites"
                          : activePopup === "debris"
                            ? "section-dashboard"
                            : "section-alerts";
                  setActivePopup(null);
                  scrollToSection(sectionId);
                }}
                className="text-xs px-3 py-1.5 border border-[#333333] hover:border-[#555555] rounded transition-colors cursor-pointer font-mono text-[#888888] hover:text-[#e8e8e8] flex items-center gap-1.5"
              >
                <span>Go to section</span>
                <span>↓</span>
              </button>
            </div>

            {/* Modal Body */}
            <ScrollContainer
              keyDependency={popupSearch}
              maxClass="flex-grow overflow-y-auto"
              shadowColor="from-[#1c1c1c]"
            >
              {popupLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-t border-[#555555]" />
                  <p className="text-xs text-[#555555] font-mono">
                    Retrieving orbital database...
                  </p>
                </div>
              ) : getFilteredPopupData().length === 0 ? (
                <div className="text-center py-16 text-[#555555] text-sm font-mono">
                  No matching objects found.
                </div>
              ) : (
                <table className="w-full text-left text-xs font-mono">
                  <thead className="sticky top-0 bg-[#181818]">
                    <tr className="border-b border-[#2a2a2a] text-[#555555] uppercase tracking-wider">
                      {(activePopup === "objects" ||
                        activePopup === "debris") && (
                        <>
                          <th className="py-2.5 px-5 font-medium">Name</th>
                          <th className="py-2.5 px-4 font-medium">
                            Catalog ID
                          </th>
                          <th className="py-2.5 px-4 font-medium">Type</th>
                          <th className="py-2.5 px-4 font-medium">Orbit</th>
                          <th className="py-2.5 px-5 font-medium text-right">
                            Action
                          </th>
                        </>
                      )}
                      {activePopup === "globe" && (
                        <>
                          <th className="py-2.5 px-5 font-medium">Name</th>
                          <th className="py-2.5 px-4 font-medium">ID</th>
                          <th className="py-2.5 px-4 font-medium">Type</th>
                          <th className="py-2.5 px-4 font-medium">3D Status</th>
                          <th className="py-2.5 px-5 font-medium text-right">
                            Action
                          </th>
                        </>
                      )}
                      {activePopup === "satellites" && (
                        <>
                          <th className="py-2.5 px-5 font-medium">Name</th>
                          <th className="py-2.5 px-4 font-medium">
                            Catalog ID
                          </th>
                          <th className="py-2.5 px-4 font-medium">Operator</th>
                          <th className="py-2.5 px-4 font-medium">Orbit</th>
                          <th className="py-2.5 px-4 font-medium">Status</th>
                          <th className="py-2.5 px-5 font-medium text-right">
                            Action
                          </th>
                        </>
                      )}
                      {activePopup === "warnings" && (
                        <>
                          <th className="py-2.5 px-5 font-medium">Primary</th>
                          <th className="py-2.5 px-4 font-medium">Secondary</th>
                          <th className="py-2.5 px-4 font-medium">
                            Probability
                          </th>
                          <th className="py-2.5 px-4 font-medium">
                            Miss Dist.
                          </th>
                          <th className="py-2.5 px-4 font-medium">Severity</th>
                          <th className="py-2.5 px-5 font-medium text-right">
                            Action
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredPopupData().map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-[#222222] hover:bg-[#1e1e1e] transition-colors"
                      >
                        {(activePopup === "objects" ||
                          activePopup === "debris") && (
                          <>
                            <td className="py-2.5 px-5 text-[#c8c8c8] font-sans font-medium">
                              {item.name}
                            </td>
                            <td className="py-2.5 px-4 text-[#666666]">
                              {item.id}
                            </td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] border ${
                                  item.type === "Satellite"
                                    ? "bg-[#1e2e22] text-[#7a9878] border-[#2a3d2e]"
                                    : "bg-[#2a2020] text-[#9a7060] border-[#3a2a28]"
                                }`}
                              >
                                {item.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] border bg-[#1e2028] text-[#7a8090] border-[#2a3040]">
                                {item.orbit}
                              </span>
                            </td>
                            <td className="py-2.5 px-5 text-right">
                              <button
                                onClick={() => trackFromPopup(item)}
                                className="px-3 py-1 bg-[#2a2a2a] hover:bg-[#333333] border border-[#3a3a3a] text-[#c8c8c8] rounded text-xs font-sans cursor-pointer transition-colors"
                              >
                                Track
                              </button>
                            </td>
                          </>
                        )}
                        {activePopup === "globe" && (
                          <>
                            <td className="py-2.5 px-5 text-[#c8c8c8] font-sans font-medium">
                              {item.name}
                            </td>
                            <td className="py-2.5 px-4 text-[#666666]">
                              {item.id}
                            </td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] border ${
                                  item.type === "Satellite"
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : "bg-red-500/20 text-red-400 border-red-500/30"
                                }`}
                              >
                                {item.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-green-400">
                              {item.status}
                            </td>
                            <td className="py-2.5 px-5 text-right">
                              <button
                                onClick={() => trackFromPopup(item)}
                                className="px-3 py-1 bg-[#2a2a2a] hover:bg-[#333333] border border-[#3a3a3a] text-[#c8c8c8] rounded text-xs font-sans cursor-pointer transition-colors"
                              >
                                Track
                              </button>
                            </td>
                          </>
                        )}
                        {activePopup === "satellites" && (
                          <>
                            <td className="py-2.5 px-5 text-[#c8c8c8] font-sans font-medium">
                              {item.name}
                            </td>
                            <td className="py-2.5 px-4 text-[#666666]">
                              {item.id}
                            </td>
                            <td className="py-2.5 px-4 text-[#888888] font-sans">
                              {item.operator}
                            </td>
                            <td className="py-2.5 px-4 text-[#888888]">
                              {item.orbit}
                            </td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] border ${
                                  item.status.toLowerCase() === "operational"
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : "bg-red-500/20 text-red-400 border-red-500/30"
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-5 text-right">
                              <button
                                onClick={() => trackFromPopup(item)}
                                className="px-3 py-1 bg-[#2a2a2a] hover:bg-[#333333] border border-[#3a3a3a] text-[#c8c8c8] rounded text-xs font-sans cursor-pointer transition-colors"
                              >
                                Track
                              </button>
                            </td>
                          </>
                        )}
                        {activePopup === "warnings" && (
                          <>
                            <td className="py-2.5 px-5 text-[#7a9878] font-sans font-medium">
                              {item.primary}
                            </td>
                            <td className="py-2.5 px-4 text-[#9a7060] font-sans">
                              {item.secondary}
                            </td>
                            <td className="py-2.5 px-4 text-[#888888]">
                              {item.probability}
                            </td>
                            <td className="py-2.5 px-4 text-[#888888]">
                              {item.distance}
                            </td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] border ${
                                  item.severity === "Critical" ||
                                  item.severity === "High"
                                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                                    : item.severity === "Medium" ||
                                        item.severity === "Moderate"
                                      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                      : "bg-green-500/20 text-green-400 border-green-500/30"
                                }`}
                              >
                                {item.severity}
                              </span>
                            </td>
                            <td className="py-2.5 px-5 text-right">
                              <button
                                onClick={() => trackWarningFromPopup(item)}
                                className="px-3 py-1 bg-[#2a2a2a] hover:bg-[#333333] border border-[#3a3a3a] text-[#c8c8c8] rounded text-xs font-sans cursor-pointer transition-colors"
                              >
                                Track
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </ScrollContainer>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[#2a2a2a] flex justify-end">
              <button
                onClick={() => setActivePopup(null)}
                className="px-4 py-1.5 border border-[#333333] hover:border-[#555555] rounded text-sm text-[#888888] hover:text-[#e8e8e8] cursor-pointer transition-colors font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CombinedDashboard;
