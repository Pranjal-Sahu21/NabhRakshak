import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as React.FC<any>;
import { Line, Bar } from 'react-chartjs-2';
import '../utils/chartConfig';
import {
  SunIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  SignalIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { getSpaceWeather, getSatellites } from '../services/api';
import { isroSatellites } from '../data/isroSatellites';
import toast from 'react-hot-toast';
import { ScrollContainer } from '../components/Common/ScrollContainer';


const getHazardStyles = (level: string) => {
  const normalized = String(level || '').toLowerCase();
  if (normalized.includes('high') || normalized.includes('critical') || normalized.includes('severe')) {
    return {
      border: 'border-red-500',
      badge: 'bg-red-500/20 text-red-400 border border-red-500/30'
    };
  }
  if (normalized.includes('mod')) {
    return {
      border: 'border-yellow-500',
      badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    };
  }
  return {
    border: 'border-green-500',
    badge: 'bg-green-500/20 text-green-400 border border-green-500/30'
  };
};

const getRiskCategoryStyles = (risk: string) => {
  const normalized = String(risk || '').toLowerCase();
  if (normalized.includes('severe') || normalized.includes('critical')) {
    return 'bg-red-500/20 text-red-400 border border-red-500/30';
  }
  if (normalized.includes('high')) {
    return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
  }
  if (normalized.includes('mod')) {
    return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
  }
  return 'bg-green-500/20 text-green-400 border border-green-500/30';
};

const getThreatColor = (level: string) => {
  const norm = String(level || '').toLowerCase();
  if (norm.includes('high') || norm.includes('severe') || norm.includes('critical')) return 'text-red-400';
  if (norm.includes('mod') || norm.includes('med')) return 'text-yellow-400';
  return 'text-green-400';
};

const SpaceWeather = () => {
  const [data, setData] = useState(null);
  const [satellitesList, setSatellitesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [orbitFilter, setOrbitFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [sortBy, setSortBy] = useState('health'); // 'health', 'risk', 'comm'
  const [alertFilter, setAlertFilter] = useState('all');
  const [hoveredRegion, setHoveredRegion] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setIsLoading(true);
        const [weatherRes, satsRes] = await Promise.all([
          getSpaceWeather(),
          getSatellites().catch(e => {
            console.error("Failed to load live satellites:", e);
            return null;
          })
        ]);
        setData(weatherRes && weatherRes.overview ? weatherRes : null);
        if (satsRes && satsRes.length > 0) {
          setSatellitesList(satsRes);
        } else {
          setSatellitesList(isroSatellites);
        }
        // If API returned flat/incomplete data, throw to use backup
        if (!weatherRes || !weatherRes.overview) {
          throw new Error('API returned flat response without expected structure');
        }
      } catch (error) {
        console.error('Failed to load space weather data:', error);
        toast.error('Unable to fetch live space weather. Loading backup telemetry.');
        // High fidelity backup telemetry mapping to the palette
        setData({
          overview: {
            risk_level: "Moderate",
            solar_activity_index: "145.2 sfu",
            kp_index: 4.3,
            solar_radiation: "1.2 pfu",
            mission_impact: "Moderate magnetic disturbance. Enhanced drag observed on satellites below 400km altitude. Elevated risk of single-event upsets in high-latitude regions."
          },
          solar_activity: {
            flux_trends: [
              {time: "00:00", xray: 1.2e-6, proton: 0.8},
              {time: "04:00", xray: 2.4e-6, proton: 0.9},
              {time: "08:00", xray: 8.5e-6, proton: 1.5},
              {time: "12:00", xray: 1.5e-5, proton: 2.1},
              {time: "16:00", xray: 9.2e-6, proton: 1.8},
              {time: "20:00", xray: 4.1e-6, proton: 1.3},
              {time: "24:00", xray: 3.0e-6, proton: 1.2}
            ],
            active_regions: [
              {id: "AR3363", coords: "S12W45", class: "Beta-Gamma-Delta", flare_prob: "85%"},
              {id: "AR3365", coords: "N18E12", class: "Beta", flare_prob: "30%"},
              {id: "AR3367", coords: "S08E78", class: "Alpha", flare_prob: "10%"}
            ],
            recent_events: [
              {time: "08:12 UTC", type: "Solar Flare", class: "M5.2", region: "AR3363", status: "Concluded"},
              {time: "09:30 UTC", type: "CME", velocity: "840 km/s", direction: "Earth-directed", status: "Transit (ETA 28h)"},
              {time: "11:45 UTC", type: "Radio Burst", class: "Type II", frequency: "24 MHz", status: "Concluded"}
            ]
          },
          geomagnetic_storm: {
            current_kp: 4.3,
            predictions_24_72h: [
              {time: "T+12h", kp: 3.7},
              {time: "T+24h", kp: 5.2},
              {time: "T+36h", kp: 4.8},
              {time: "T+48h", kp: 4.0},
              {time: "T+60h", kp: 3.2},
              {time: "T+72h", kp: 2.5}
            ],
            global_disturbance: "Active (minor storm threshold exceeded globally, auroral boundary pushed to 55 deg magnetic latitude)"
          },
          ai_recommendations: [
            {
              title: "Delay Thruster Firing (GSAT-31)",
              priority: "HIGH",
              confidence: 94,
              impact: "Prevent Single-Event Upsets (SEU)",
              reasoning: "Incoming Coronal Mass Ejection (CME) shock front is projected to intersect Earth's magnetosphere near the scheduled thruster burn window. Enhanced proton density increases solar particle event risk."
            },
            {
              title: "Orient Solar Arrays for Shielding",
              priority: "MEDIUM",
              confidence: 88,
              impact: "Mitigate Solar Radiation Damage",
              reasoning: "AR3363 is exhibiting high X-ray flux (M-class flares). Feathering panel configurations offsets solar wind pressure and minimizes radiation damage to photovoltaic cells."
            },
            {
              title: "Establish High-Latitude Backup Telemetry",
              priority: "LOW",
              confidence: 75,
              impact: "Maintain Communications Integrity",
              reasoning: "Geomagnetic storm forecast predicts Kp index reaching 5.2, which will likely induce ionospheric scintillation and signal attenuation across polar telemetry stations."
            }
          ],
          live_alerts: [
            {id: 1, severity: "moderate", message: "Coronal Mass Ejection (CME) transit tracking active. Estimated arrival: July 6th, 14:00 UTC.", timestamp: "09:30 UTC"},
            {id: 2, severity: "high", message: "M5.2 class solar flare registered from active region AR3363. Radio blackout level R2 observed.", timestamp: "08:15 UTC"},
            {id: 3, severity: "low", message: "Proton flux levels entering minor radiation storm threshold (S1 level).", timestamp: "07:45 UTC"}
          ],
          forecast: {
            day_1: {kp_max: 5.2, flare_class: "M-Class (80%)", hazard_level: "Moderate"},
            day_3: {kp_max: 4.0, flare_class: "C-Class (90%)", hazard_level: "Low"},
            day_7: {kp_max: 3.0, flare_class: "C-Class (50%)", hazard_level: "Low"}
          },
          historical_trends: [
            {date: "06-29", solar_flares: 3, geomagnetic_storms: 0, downtime_hours: 0.0},
            {date: "06-30", solar_flares: 5, geomagnetic_storms: 1, downtime_hours: 0.5},
            {date: "07-01", solar_flares: 8, geomagnetic_storms: 2, downtime_hours: 1.2},
            {date: "07-02", solar_flares: 12, geomagnetic_storms: 3, downtime_hours: 2.4},
            {date: "07-03", solar_flares: 6, geomagnetic_storms: 1, downtime_hours: 0.8},
            {date: "07-04", solar_flares: 4, geomagnetic_storms: 0, downtime_hours: 0.0}
          ]
        });
        setSatellitesList(isroSatellites);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, []);

  // Radiation map regions definition
  const radiationRegions = {
    innerBelt: {
      name: "Inner Van Allen Belt",
      altitude: "1,000 - 12,000 km",
      hazards: "High proton radiation. Induces micro-electronics lattice displacement, silicon degradation, and solar array fading.",
      risk: "Severe",
      colorClass: "fill-neon-blue/40 stroke-neon-blue"
    },
    outerBelt: {
      name: "Outer Van Allen Belt",
      altitude: "13,000 - 60,000 km",
      hazards: "High relativistic electron flux. Induces deep dielectric electrostatic charging (ESD) and surface sensor degradation.",
      risk: "High",
      colorClass: "fill-neon-purple/40 stroke-neon-purple"
    },
    saa: {
      name: "South Atlantic Anomaly (SAA)",
      altitude: "200 - 800 km (Lower-left sector)",
      hazards: "Dip in Earth's magnetic field exposes LEO satellites to direct proton flux. Primary cause of single-event upsets (SEU) and bit flips.",
      risk: "High (LEO specific)",
      colorClass: "fill-neon-green/40 stroke-neon-green"
    },
    polarHorns: {
      name: "Polar Radiation Corridors",
      altitude: "Auroral zone latitudes",
      hazards: "High-latitude solar particle events (SPE) direct access. Induces communication blackouts and magnetic guidance disturbance.",
      risk: "Moderate",
      colorClass: "fill-neon-pink/40 stroke-neon-pink"
    }
  };

  // Satellite vulnerability catalog calculation
  const satelliteVulnerabilities = useMemo(() => {
    if (!satellitesList || satellitesList.length === 0) return [];

    return satellitesList.map(sat => {
      let radRisk = 0;
      let commDisruption = 0;
      let powerRisk = 'Low';
      let solarExposure = 'Low';
      let thermalStress = 'Low';
      let healthScore = 100;

      // Deterministic calculation based on orbit type
      if (sat.orbit === 'LEO') {
        radRisk = Math.round(30 + (sat.altitude % 20));
        commDisruption = Math.round(25 + (sat.inclination > 80 ? 30 : 0));
        powerRisk = 'Low';
        solarExposure = 'Moderate';
        thermalStress = 'Low';
        healthScore = Math.round(95 - (radRisk / 15) - (commDisruption / 20));
      } else if (sat.orbit === 'GEO' || sat.orbit === 'GSO') {
        radRisk = Math.round(65 + (sat.longitude % 15));
        commDisruption = Math.round(45 + (sat.longitude % 10));
        powerRisk = 'High';
        solarExposure = 'High';
        thermalStress = 'Moderate';
        healthScore = Math.round(91 - (radRisk / 20) - (commDisruption / 25));
      } else if (sat.orbit === 'GTO') {
        radRisk = 92;
        commDisruption = 60;
        powerRisk = 'High';
        solarExposure = 'High';
        thermalStress = 'High';
        healthScore = 82;
      }

      return {
        ...sat,
        radRisk,
        commDisruption,
        powerRisk,
        solarExposure,
        thermalStress,
        healthScore
      };
    });
  }, [satellitesList]);

  // Filtering & sorting logic
  const filteredSatellites = useMemo(() => {
    let result = satelliteVulnerabilities;

    if (searchQuery) {
      result = result.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (orbitFilter !== 'All') {
      result = result.filter(s => s.orbit === orbitFilter);
    }

    if (riskFilter !== 'All') {
      result = result.filter(s => {
        if (riskFilter === 'High') return s.radRisk >= 70 || s.healthScore < 88;
        if (riskFilter === 'Moderate') return s.radRisk >= 40 && s.radRisk < 70 && s.healthScore >= 88;
        return s.radRisk < 40;
      });
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'health') return a.healthScore - b.healthScore; // ascending (show lowest health first)
      if (sortBy === 'risk') return b.radRisk - a.radRisk; // descending (show highest risk first)
      return b.commDisruption - a.commDisruption; // descending
    });
  }, [satelliteVulnerabilities, searchQuery, orbitFilter, riskFilter, sortBy]);

  // Alert severity color helpers
  const getAlertSeverityStyles = (severity: string) => {
    switch ((severity || '').toLowerCase()) {
      case 'high':
      case 'severe':
        return {
          bg: 'bg-red-500/10 border-red-500/30',
          text: 'text-red-400',
          indicator: 'bg-red-500 animate-pulse'
        };
      case 'moderate':
      case 'medium':
        return {
          bg: 'bg-yellow-500/10 border-yellow-500/30',
          text: 'text-yellow-400',
          indicator: 'bg-yellow-500'
        };
      default:
        return {
          bg: 'bg-green-500/10 border-green-500/30',
          text: 'text-green-400',
          indicator: 'bg-green-500'
        };
    }
  };

  const getWeatherRiskStyles = (risk: string) => {
    const r = (risk || '').toLowerCase();
    if (r === 'severe' || r === 'high') {
      return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', dot: 'bg-red-500' };
    } else if (r === 'moderate' || r === 'medium') {
      return { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', dot: 'bg-yellow-500' };
    } else {
      return { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', dot: 'bg-green-500' };
    }
  };

  const filteredAlerts = useMemo(() => {
    if (!data?.live_alerts) return [];
    if (alertFilter === 'all') return data.live_alerts;
    return data.live_alerts.filter(a => a.severity === alertFilter);
  }, [data, alertFilter]);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <SunIcon className="w-12 h-12 text-neon-blue animate-spin" />
        <span className="text-gray-400 text-sm tracking-wider font-normal">SYNCHRONIZING SOLAR MAGNETOMETRY...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-black text-[#e8e8e8]">

      {/* ─── SECTION 1: SPACE WEATHER OVERVIEW ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Risk Level */}
        {(() => {
          const rs = getWeatherRiskStyles(data.overview.risk_level);
          return (
            <div className="bg-[#0c0c0e]/95 border border-[#2a2a2a] rounded-xl p-5 shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent opacity-40" />
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal mb-1">Global Space Weather Risk</p>
                  <h3 className={`text-2xl font-normal ${rs.text} flex items-center space-x-2`}>
                    <span>{data.overview.risk_level}</span>
                    <span className={`w-2 h-2 rounded-full mt-1 ${rs.dot} animate-ping`} />
                  </h3>
                </div>
                <div className={`p-2.5 rounded-lg ${rs.bg} border ${rs.border}`}>
                  <ShieldExclamationIcon className={`w-6 h-6 ${rs.text}`} />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 leading-relaxed border-t border-white/5 pt-3">
                Solar wind conditions are active. Radiation shields monitored.
              </p>
            </div>
          );
        })()}

        {/* Card 2: Solar Activity Index */}
        <div className="bg-[#0c0c0e]/95 border border-[#2a2a2a] rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/10 to-transparent opacity-40" />
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal mb-1">Solar Radio Flux (F10.7)</p>
              <h3 className="text-2xl font-normal text-white">{data.overview.solar_activity_index}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-neon-blue/10 border border-neon-blue/30">
              <SunIcon className="w-6 h-6 text-neon-blue" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 leading-relaxed border-t border-white/5 pt-3">
            10.7cm flux density measuring coronal heating levels.
          </p>
        </div>

        {/* Card 3: Geomagnetic Storm level */}
        <div className="bg-[#0c0c0e]/95 border border-[#2a2a2a] rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-green/10 to-transparent opacity-40" />
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal mb-1">Geomagnetic Index (Kp)</p>
              <h3 className="text-2xl font-normal text-neon-green">Kp {data.overview.kp_index}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-neon-green/10 border border-neon-green/30">
              <BoltIcon className="w-6 h-6 text-neon-green" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 leading-relaxed border-t border-white/5 pt-3">
            Planetary 3-hour geomagnetic activity scale (0 to 9).
          </p>
        </div>

        {/* Card 4: Radiation Storm Level */}
        <div className="bg-[#0c0c0e]/95 border border-[#2a2a2a] rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/10 to-transparent opacity-40" />
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal mb-1">Solar Proton Flux</p>
              <h3 className="text-2xl font-normal text-neon-pink">{data.overview.solar_radiation}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-neon-pink/10 border border-neon-pink/30">
              <SignalIcon className="w-6 h-6 text-neon-pink" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 leading-relaxed border-t border-white/5 pt-3">
            Integral proton flux levels measuring solar particle density.
          </p>
        </div>

      </div>

      {/* Mission Impact Summary Panel */}
      <div className="bg-[#0c0c0e]/95 border border-[#2a2a2a] rounded-xl p-5 shadow-lg flex items-start space-x-4">
        <div className="p-2 bg-neon-blue/10 border border-neon-blue/30 rounded-lg text-neon-blue mt-0.5">
          <InformationCircleIcon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-normal text-white">Space Weather Mission Impact Summary</h4>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{data.overview.mission_impact}</p>
        </div>
      </div>

      {/* ─── SECTION 2: SOLAR ACTIVITY MONITORING ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* X-Ray Flux Trend Chart */}
        <div className="lg:col-span-2 bg-[#0c0c0e]/95 border border-[#2a2a2a] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-normal text-white uppercase tracking-wider">X-Ray & Proton Flux Trend (24h)</h4>
            <span className="text-[10px] text-gray-500">GOES-16 Solar Telemetry</span>
          </div>
          <div className="h-64">
            <Line
              data={{
                labels: (data.solar_activity.flux_trends || []).map((d: any) => d.time),
                datasets: [
                  {
                    label: 'X-Ray Flux',
                    data: (data.solar_activity.flux_trends || []).map((d: any) => d.xray),
                    borderColor: '#FF823A',
                    backgroundColor: 'rgba(255, 130, 58, 0.15)',
                    borderWidth: 1.5,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                  },
                  {
                    label: 'Proton Flux',
                    data: (data.solar_activity.flux_trends || []).map((d: any) => d.proton),
                    borderColor: '#00D2FF',
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                  },
                ],
              }}
              options={{
                scales: {
                  x: { grid: { color: '#222' }, ticks: { color: '#666', font: { size: 10 } } },
                  y: { grid: { color: '#222' }, ticks: { color: '#666', font: { size: 10 } } },
                },
              }}
            />
          </div>
        </div>

        {/* Active Regions & CME Alerts */}
        <div className="bg-[#0c0c0e]/95 border border-[#2a2a2a] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-normal text-white uppercase tracking-wider mb-3">Active Solar Regions</h4>
            <div className="space-y-2.5">
              {data.solar_activity.active_regions.map((region, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-black/40 border border-[#222] rounded-lg">
                  <div>
                    <span className="text-xs font-normal text-white">{region.id}</span>
                    <span className="text-[10px] text-gray-500 ml-2">({region.coords})</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-normal text-neon-blue">{region.class}</div>
                    <div className="text-[10px] text-gray-400">Flare Prob: {region.flare_prob}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#222]">
            <h4 className="text-sm font-normal text-white uppercase tracking-wider mb-2.5">Recent Solar Events</h4>
            <div className="space-y-2">
              {data.solar_activity.recent_events.map((event, idx) => (
                <div key={idx} className="text-xs flex justify-between text-gray-400">
                  <span>{event.time} - <span className="text-white font-medium">{event.type}</span> ({event.class || event.velocity})</span>
                  <span className="text-neon-green text-[10px]">{event.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ─── SECTION 3: GEOMAGNETIC STORM & FORECAST ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kp Gauge and predictions */}
        <div className="bg-[#0c0c0e]/95 border border-[#2a2a2a] rounded-xl p-5 shadow-lg flex flex-col items-center justify-center">
          <h4 className="text-sm font-normal text-white uppercase tracking-wider mb-4 self-start">Current Geomagnetic Index</h4>
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* SVG Arc Gauge */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="60" stroke="#1c1b22" strokeWidth="12" fill="transparent" />
              <circle cx="80" cy="80" r="60" stroke="#80BCFF" strokeWidth="12" fill="transparent"
                      strokeDasharray={2 * Math.PI * 60}
                      strokeDashoffset={(2 * Math.PI * 60) * (1 - data.geomagnetic_storm.current_kp / 9)} />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-white">Kp {data.geomagnetic_storm.current_kp}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Active Status</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center leading-relaxed">
            {data.geomagnetic_storm.global_disturbance}
          </p>
        </div>

        {/* Predicted Kp Index */}
        <div className="bg-[#0c0c0e]/95 border border-[#2a2a2a] rounded-xl p-5 shadow-lg">
          <h4 className="text-sm font-normal text-white uppercase tracking-wider mb-4">Predicted Kp Index (24-72h)</h4>
          <div className="h-48">
            <Bar
              data={{
                labels: (data.geomagnetic_storm.predictions_24_72h || []).map((d: any) => d.time),
                datasets: [
                  {
                    label: 'Kp Index',
                    data: (data.geomagnetic_storm.predictions_24_72h || []).map((d: any) => d.kp),
                    backgroundColor: (data.geomagnetic_storm.predictions_24_72h || []).map((d: any) => {
                      const kp = d.kp || 0;
                      if (kp >= 5.0) return '#EF4444'; // Red
                      if (kp >= 3.5) return '#FBBF24'; // Yellow
                      return '#10B981'; // Green
                    }),
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                scales: {
                  x: { grid: { color: '#222' }, ticks: { color: '#666', font: { size: 10 } } },
                  y: { grid: { color: '#222' }, ticks: { color: '#666', font: { size: 10 } }, min: 0, max: 9 },
                },
                plugins: { legend: { display: false } },
              }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-gray-500 border-t border-[#222] pt-2">
            <span>Storm Threshold Kp &ge; 5</span>
            <span className="text-neon-purple font-normal">Peak Forecast: Kp 5.2</span>
          </div>
        </div>

        {/* Space Weather Forecast Outlook */}
        <div className="bg-[#0c0c0e]/95 border border-[#2a2a2a] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <h4 className="text-sm font-normal text-white uppercase tracking-wider mb-3">7-Day Space Weather Forecast</h4>
          <div className="space-y-3">
            {[
              { title: 'Next 24 Hours', forecast: data?.forecast?.day_1 || { kp_max: 0, flare_class: 'N/A', hazard_level: 'Low' } },
              { title: '3-Day Outlook', forecast: data?.forecast?.day_3 || { kp_max: 0, flare_class: 'N/A', hazard_level: 'Low' } },
              { title: '7-Day Outlook', forecast: data?.forecast?.day_7 || { kp_max: 0, flare_class: 'N/A', hazard_level: 'Low' } },
            ].map(({ title, forecast }) => {
              const styles = getHazardStyles(forecast?.hazard_level);
              return (
                <div key={title} className={`flex justify-between items-center p-2.5 bg-black/40 border-l-2 ${styles.border} rounded-r-lg`}>
                  <div>
                    <div className="text-xs font-normal text-white">{title}</div>
                    <div className="text-[10px] text-gray-500">Max Kp: {forecast?.kp_max} | Flare: {forecast?.flare_class}</div>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded font-medium ${styles.badge}`}>
                    {forecast?.hazard_level}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ─── SECTION 4: RADIATION EXPOSURE MAP (INTERACTIVE SVG) ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Radial Map */}
        <div className="lg:col-span-2 bg-[#0c0c0e]/95 border border-[#2a2a2a] rounded-xl p-5 shadow-lg flex flex-col items-center justify-center">
          <div className="flex justify-between w-full mb-4">
            <div>
              <h4 className="text-sm font-normal text-white uppercase tracking-wider">Magnetosphere Radiation Exposure Map</h4>
              <p className="text-xs text-gray-400 mt-0.5">Concentric Van Allen Radiation Belts & SAA Anomaly model</p>
            </div>
            <span className="text-[10px] text-neon-blue border border-neon-blue/20 px-2 py-0.5 rounded-full h-fit">Interactive</span>
          </div>

          <div className="relative w-72 h-72 my-2 flex items-center justify-center">
            {/* SVG representing radiation regions */}
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Outer Belt Ring */}
              <circle cx="100" cy="100" r="85" 
                      className={`transition-all duration-300 stroke-2 cursor-pointer ${hoveredRegion === 'outerBelt' ? 'fill-neon-purple/30 stroke-neon-purple' : 'fill-transparent stroke-neon-purple/20'}`}
                      onClick={() => setHoveredRegion('outerBelt')}
                      onMouseEnter={() => setHoveredRegion('outerBelt')} />
              <circle cx="100" cy="100" r="75" 
                      className={`transition-all duration-300 stroke-2 cursor-pointer ${hoveredRegion === 'outerBelt' ? 'fill-neon-purple/30 stroke-neon-purple' : 'fill-transparent stroke-neon-purple/20'}`}
                      onClick={() => setHoveredRegion('outerBelt')}
                      onMouseEnter={() => setHoveredRegion('outerBelt')} />

              {/* Inner Belt Ring */}
              <circle cx="100" cy="100" r="50" 
                      className={`transition-all duration-300 stroke-2 cursor-pointer ${hoveredRegion === 'innerBelt' ? 'fill-neon-blue/30 stroke-neon-blue' : 'fill-transparent stroke-neon-blue/20'}`}
                      onClick={() => setHoveredRegion('innerBelt')}
                      onMouseEnter={() => setHoveredRegion('innerBelt')} />
              <circle cx="100" cy="100" r="40" 
                      className={`transition-all duration-300 stroke-2 cursor-pointer ${hoveredRegion === 'innerBelt' ? 'fill-neon-blue/30 stroke-neon-blue' : 'fill-transparent stroke-neon-blue/20'}`}
                      onClick={() => setHoveredRegion('innerBelt')}
                      onMouseEnter={() => setHoveredRegion('innerBelt')} />

              {/* South Atlantic Anomaly (SAA) Sector */}
              <path d="M 68 118 A 45 45 0 0 1 73 80 L 100 100 Z" 
                    className={`transition-all duration-300 cursor-pointer ${hoveredRegion === 'saa' ? 'fill-neon-green/50 stroke-neon-green' : 'fill-neon-green/20 stroke-neon-green/30'}`}
                    onClick={() => setHoveredRegion('saa')}
                    onMouseEnter={() => setHoveredRegion('saa')} />

              {/* Polar Radiation Horns */}
              <path d="M 85 45 Q 100 20 115 45 Q 100 55 85 45 Z" 
                    className={`transition-all duration-300 cursor-pointer ${hoveredRegion === 'polarHorns' ? 'fill-neon-pink/50 stroke-neon-pink' : 'fill-neon-pink/20 stroke-neon-pink/30'}`}
                    onClick={() => setHoveredRegion('polarHorns')}
                    onMouseEnter={() => setHoveredRegion('polarHorns')} />
              <path d="M 85 155 Q 100 180 115 155 Q 100 145 85 155 Z" 
                    className={`transition-all duration-300 cursor-pointer ${hoveredRegion === 'polarHorns' ? 'fill-neon-pink/50 stroke-neon-pink' : 'fill-neon-pink/20 stroke-neon-pink/30'}`}
                    onClick={() => setHoveredRegion('polarHorns')}
                    onMouseEnter={() => setHoveredRegion('polarHorns')} />

              {/* Central Earth representation */}
              <circle cx="100" cy="100" r="22" fill="#1c1b22" stroke="#4DA3FF" strokeWidth="2" />
              {/* Earth continent wireframe dots */}
              <circle cx="95" cy="95" r="3" fill="#4DA3FF" opacity="0.6" />
              <circle cx="105" cy="102" r="4" fill="#4DA3FF" opacity="0.6" />
              <circle cx="94" cy="105" r="2" fill="#4DA3FF" opacity="0.6" />

              {/* Text Indicators */}
              <text x="100" y="103" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="bold">EARTH</text>
              <text x="100" y="65" textAnchor="middle" fontSize="5" fill="#4DA3FF" opacity="0.8">LEO CORRIDOR</text>
              <text x="100" y="125" textAnchor="middle" fontSize="5" fill="#80BCFF" opacity="0.8">MEO CORRIDOR</text>
              <text x="100" y="187" textAnchor="middle" fontSize="5" fill="#B3D7FF" opacity="0.8">GEO CORRIDOR</text>
            </svg>
          </div>
          <div className="flex space-x-4 mt-2 text-[10px] text-gray-500">
            <span className="flex items-center"><span className="w-2 h-2 rounded bg-neon-blue mr-1.5" />Inner Belt</span>
            <span className="flex items-center"><span className="w-2 h-2 rounded bg-neon-purple mr-1.5" />Outer Belt</span>
            <span className="flex items-center"><span className="w-2 h-2 rounded bg-neon-green mr-1.5" />SAA</span>
            <span className="flex items-center"><span className="w-2 h-2 rounded bg-neon-pink mr-1.5" />Polar Zones</span>
          </div>
        </div>

        {/* Region Detail Panel */}
        <div className="bg-[#0c0c0e]/95 border border-[#2a2a2a] rounded-xl p-5 shadow-lg flex flex-col justify-between min-h-[300px]">
          <div>
            <h4 className="text-sm font-normal text-white uppercase tracking-wider mb-4">Region Radiation Profile</h4>
            <AnimatePresence mode="wait">
              {hoveredRegion ? (
                <MotionDiv
                  key={hoveredRegion}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider font-normal">Region Name</span>
                    <h5 className="text-base font-normal text-white mt-0.5">{radiationRegions[hoveredRegion].name}</h5>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider font-normal">Altitude / Extent</span>
                    <p className="text-xs text-neon-blue font-medium mt-0.5">{radiationRegions[hoveredRegion].altitude}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider font-normal">Corridor Hazards</span>
                    <p className="text-xs text-gray-350 leading-relaxed mt-1">{radiationRegions[hoveredRegion].hazards}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider font-normal">Risk Category</span>
                    <span className={`inline-block ml-3 px-2.5 py-0.5 text-[10px] rounded font-normal uppercase tracking-wider mt-1.5 ${getRiskCategoryStyles(radiationRegions[hoveredRegion].risk)}`}>
                      {radiationRegions[hoveredRegion].risk}
                    </span>
                  </div>
                </MotionDiv>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <InformationCircleIcon className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-400" />
                  <p className="text-xs">Hover or click on the radiation map regions to audit corridor threats.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
          {hoveredRegion && (
            <button
              onClick={() => setHoveredRegion(null)}
              className="text-xs text-gray-500 hover:text-white transition-colors border border-white/5 rounded py-1 mt-4"
            >
              Clear Audit Focus
            </button>
          )}
        </div>

      </div>

      {/* ─── SECTION 5: SATELLITE VULNERABILITY CATALOG ───────────────────── */}
      <div className="bg-[#0c0c0e]/95 border border-[#2a2a2a] rounded-xl p-5 shadow-lg space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-4">
          <div>
            <h4 className="text-sm font-normal text-white uppercase tracking-wider">Satellite Vulnerability Assessment</h4>
            <p className="text-xs text-gray-400 mt-0.5">Real-time space weather vulnerability scores for active ISRO satellites</p>
          </div>
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search satellite name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-black border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue transition-colors w-44"
              />
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
            </div>
            {/* Orbit Filter */}
            <div className="flex items-center bg-black border border-[#333] rounded-lg px-2 py-1 text-xs">
              <span className="text-gray-500 mr-1.5">Orbit:</span>
              <select
                value={orbitFilter}
                onChange={(e) => setOrbitFilter(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none border-none p-0 pr-5"
              >
                <option value="All" className="bg-[#0c0c0e]">All</option>
                <option value="LEO" className="bg-[#0c0c0e]">LEO</option>
                <option value="GEO" className="bg-[#0c0c0e]">GEO</option>
                <option value="GTO" className="bg-[#0c0c0e]">GTO</option>
              </select>
            </div>
            {/* Risk Filter */}
            <div className="flex items-center bg-black border border-[#333] rounded-lg px-2 py-1 text-xs">
              <span className="text-gray-500 mr-1.5">Risk:</span>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none border-none p-0 pr-5"
              >
                <option value="All" className="bg-[#0c0c0e]">All</option>
                <option value="High" className="bg-[#0c0c0e]">High Risk</option>
                <option value="Moderate" className="bg-[#0c0c0e]">Mod Risk</option>
                <option value="Low" className="bg-[#0c0c0e]">Low Risk</option>
              </select>
            </div>
            {/* Sort */}
            <div className="flex items-center bg-black border border-[#333] rounded-lg px-2 py-1 text-xs">
              <span className="text-gray-500 mr-1.5">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none border-none p-0 pr-5"
              >
                <option value="health" className="bg-[#0c0c0e]">Lowest Health</option>
                <option value="risk" className="bg-[#0c0c0e]">Highest Risk</option>
                <option value="comm" className="bg-[#0c0c0e]">Comm Distr.</option>
              </select>
            </div>
          </div>
        </div>

        {/* Catalog List / Grid */}
        <ScrollContainer keyDependency={`${searchQuery}-${orbitFilter}-${riskFilter}-${sortBy}`} maxClass="max-h-[440px]" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" shadowColor="from-black">
          {filteredSatellites.map((sat) => {
            const hs = sat.healthScore < 60
              ? { badge: 'bg-red-500/20 text-red-400 border border-red-500/30' }
              : sat.healthScore < 85
                ? { badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' }
                : { badge: 'bg-green-500/20 text-green-400 border border-green-500/30' };
            return (
              <div
                key={sat.id}
                className="p-4 bg-black/40 border border-[#222] rounded-xl hover:border-gray-500 transition-all duration-300 space-y-3.5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-sm font-normal text-white leading-tight">{sat.name}</h5>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">{sat.orbit} • {(sat.mission || 'Unknown mission').substring(0, 30)}...</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-normal uppercase tracking-wider ${hs.badge}`}>
                    Health: {sat.healthScore}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/5 pt-2.5 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Radiation Risk:</span>
                    <span className="font-normal text-white">{sat.radRisk}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comm Loss:</span>
                    <span className="font-normal text-white">{sat.commDisruption}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Solar Storm:</span>
                    <span className={`font-normal ${getThreatColor(sat.solarExposure)}`}>{sat.solarExposure}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Power Risk:</span>
                    <span className={`font-normal ${getThreatColor(sat.powerRisk)}`}>{sat.powerRisk}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredSatellites.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 text-xs">
              No satellites matching search or filter constraints.
            </div>
          )}
        </ScrollContainer>
      </div>

      {/* ─── SECTION 6: AI RECOMMENDATIONS & ALERTS ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* AI Recommendations */}
        <div className="lg:col-span-2 bg-[#0c0c0e]/95 border border-[#2a2a2a] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-normal text-white uppercase tracking-wider">AI Weather Action Protocol</h4>
            </div>
            <div className="space-y-4">
              {data.ai_recommendations.map((rec, idx) => {
                const isHigh = rec.priority === 'HIGH';
                return (
                  <div key={idx} className="p-4 bg-black/40 border border-[#222] rounded-xl flex items-start space-x-3">
                    <div className={`p-2 rounded-lg mt-0.5 ${isHigh ? 'bg-neon-purple/10 text-neon-purple' : 'bg-neon-blue/10 text-neon-blue'}`}>
                      <ExclamationTriangleIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h5 className="text-xs font-normal text-white">{rec.title}</h5>
                        <span className="text-[10px] text-gray-500">Conf: {rec.confidence}%</span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{rec.reasoning}</p>
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="text-[9px] uppercase tracking-wider bg-[#1a1a2e] text-gray-400 px-1.5 py-0.5 rounded">
                          Impact: {rec.impact}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Alerts Feed */}
        <div className="bg-[#0c0c0e]/95 border border-[#2a2a2a] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-normal text-white uppercase tracking-wider mb-3">Live Space Weather Alert Center</h4>
            
            {/* Filter buttons */}
            <div className="flex space-x-2 mb-3">
              {['all', 'high', 'moderate', 'low'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setAlertFilter(sev)}
                  className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border transition-colors ${
                    alertFilter === sev
                      ? sev === 'high'
                        ? 'bg-red-500 border-red-500 text-white font-normal'
                        : sev === 'moderate'
                        ? 'bg-yellow-500 border-yellow-500 text-black font-normal'
                        : sev === 'low'
                        ? 'bg-green-500 border-green-500 text-black font-normal'
                        : 'bg-neon-blue border-neon-blue text-black font-normal'
                      : 'bg-black border-[#333] text-gray-500 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <ScrollContainer keyDependency={alertFilter} maxClass="max-h-[300px]" className="space-y-3" shadowColor="from-[#0c0c0e]">
              {filteredAlerts.map((alert) => {
                const styles = getAlertSeverityStyles(alert.severity);
                return (
                  <div key={alert.id} className={`p-3 border rounded-xl flex items-start space-x-2.5 ${styles.bg}`}>
                    <span className={`w-2 h-2 rounded-full mt-1.5 ${styles.indicator}`} />
                    <div className="flex-1 space-y-0.5">
                      <p className="text-[11px] text-[#e8e8e8] leading-relaxed">{alert.message}</p>
                      <span className="text-[9px] text-gray-500 font-mono">{alert.timestamp}</span>
                    </div>
                  </div>
                );
              })}
              {filteredAlerts.length === 0 && (
                <div className="text-center py-12 text-gray-500 text-xs">
                  No active alerts. Magnetosphere nominal.
                </div>
              )}
            </ScrollContainer>
          </div>
        </div>

      </div>

      {/* ─── SECTION 7: HISTORICAL ANALYTICS ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Historical Storm/Flare count */}
        <div className="bg-[#0c0c0e]/95 border border-[#2a2a2a] rounded-xl p-5 shadow-lg">
          <h4 className="text-sm font-normal text-white uppercase tracking-wider mb-4">Historical Activity (7-Day Trend)</h4>
          <div className="h-60">
            <Line
              data={{
                labels: (data.historical_trends || []).map((d: any) => d.date),
                datasets: [
                  {
                    label: 'Solar Flares Registered',
                    data: (data.historical_trends || []).map((d: any) => d.solar_flares),
                    borderColor: '#F59E0B',
                    backgroundColor: '#F59E0B',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                  },
                  {
                    label: 'Geomagnetic Storm Events',
                    data: (data.historical_trends || []).map((d: any) => d.geomagnetic_storms),
                    borderColor: '#3B82F6',
                    backgroundColor: '#3B82F6',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                  },
                ],
              }}
              options={{
                layout: {
                  padding: {
                    top: 10,
                  },
                },
                scales: {
                  x: { grid: { color: '#222' }, ticks: { color: '#666', font: { size: 10 } } },
                  y: { grid: { color: '#222' }, ticks: { color: '#666', font: { size: 10 } }, grace: '25%' },
                },
                plugins: {
                  legend: { display: true, position: 'top' as const, labels: { boxWidth: 10, padding: 16 } },
                },
              }}
            />
          </div>
        </div>

        {/* Correlation between weather and satellite downtime */}
        <div className="bg-[#0c0c0e]/95 border border-[#2a2a2a] rounded-xl p-5 shadow-lg">
          <h4 className="text-sm font-normal text-white uppercase tracking-wider mb-4">Satellite Downtime Correlation</h4>
          <div className="h-60">
            <Bar
              data={{
                labels: (data.historical_trends || []).map((d: any) => d.date),
                datasets: [
                  {
                    label: 'Cumulative Downtime (Hours)',
                    data: (data.historical_trends || []).map((d: any) => d.downtime_hours),
                    backgroundColor: (data.historical_trends || []).map((d: any) => {
                      const hours = d.downtime_hours || 0;
                      if (hours >= 2.0) return '#EF4444'; // Red
                      if (hours >= 1.0) return '#FBBF24'; // Yellow
                      return '#10B981'; // Green
                    }),
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                scales: {
                  x: { grid: { color: '#222' }, ticks: { color: '#666', font: { size: 10 } } },
                  y: { grid: { color: '#222' }, ticks: { color: '#666', font: { size: 10 } } },
                },
                plugins: {
                  legend: { display: true, position: 'top' as const, labels: { boxWidth: 10, padding: 16 } },
                },
              }}
            />
          </div>
        </div>

      </div>

    </div>
  );
};

export default SpaceWeather;
