import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as React.FC<any>;
const MotionTr = motion.tr as React.FC<any>;
import {
  GlobeAltIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

import { isroSatellites } from '../data/isroSatellites';
import { getSatellites } from '../services/api';
import { ScrollContainer } from '../components/Common/ScrollContainer';

const Satellites = ({ isWidget = false }) => {
  const [satellites, setSatellites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSatellite, setSelectedSatellite] = useState(null);
  const [statusTab, setStatusTab] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const [filters, setFilters] = useState({
    status: [],
    operator: [],
    purpose: [],
    orbit: [],
    powerStatus: [],
    altitudeRange: { min: 0, max: 50000 }
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table');

  // Collapse list on filter/tab changes to keep page compact
  useEffect(() => {
    setIsExpanded(false);
  }, [statusTab, searchQuery, filters]);

  // Map ISRO satellite to frontend format
  const mapSatellite = (obj) => {
    const alt = obj.altitude || 0;
    let orbit = obj.orbit || 'LEO';
    if (!obj.orbit) {
      if (alt > 35000) orbit = 'GEO';
      else if (alt > 2000) orbit = 'MEO';
      else if (obj.inclination > 95) orbit = 'SSO';
    }

    return {
      id: obj.id || obj.catalog_number,
      name: obj.name || 'Unknown',
      operator: obj.operator || 'ISRO',
      purpose: obj.mission || 'Earth Observation',
      status: obj.status === 'active' ? 'operational' : 'non-operational',
      powerStatus: obj.status === 'active' ? 'nominal' : 'off',
      launchDate: new Date(obj.launchDate || obj.epoch || Date.now()),
      altitude: alt,
      velocity: obj.velocity || (alt > 35000 ? 3.07 : 7.5),
      mass: obj.mass || 1500,
      orbit,
      inclination: obj.inclination || 0,
      period: obj.period || obj.orbital_period || (alt > 35000 ? 1436 : 90),
      apogee: obj.apogee || alt,
      perigee: obj.perigee || alt,
      signalStrength: 85 + Math.random() * 15,
      batteryLevel: 70 + Math.random() * 30,
      solarPanelEfficiency: 80 + Math.random() * 20,
      lastContact: new Date(Date.now() - Math.random() * 3600000),
      nextPass: new Date(Date.now() + Math.random() * 3600000 * 2),
      riskLevel: obj.risk_level || obj.risk || 'low',
      eccentricity: obj.eccentricity || 0,
      country: obj.country || 'India',
      mission: obj.mission || '',
    };
  };

  // Load ISRO-only satellite data from live backend endpoint
  useEffect(() => {
    const loadLiveSatellites = async () => {
      try {
        setIsLoading(true);
        const liveData = await getSatellites();
        if (liveData && liveData.length > 0) {
          setSatellites(liveData.map(mapSatellite));
        } else {
          setSatellites(isroSatellites.map(mapSatellite));
        }
      } catch (e) {
        console.error("Error loading live satellites, falling back to static fleet:", e);
        setSatellites(isroSatellites.map(mapSatellite));
      } finally {
        setIsLoading(false);
      }
    };
    loadLiveSatellites();
  }, []);

  // Filter and sort satellites
  const filteredSatellites = useMemo(() => {
    let filtered = [...satellites];

    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(s.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.operator.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Quick status tab filtering
    if (statusTab === 'active') {
      filtered = filtered.filter(s => s.status === 'operational');
    } else if (statusTab === 'inactive') {
      filtered = filtered.filter(s => s.status === 'non-operational');
    }

    if (filters.status.length > 0)
      filtered = filtered.filter(s => filters.status.includes(s.status));
    if (filters.operator.length > 0)
      filtered = filtered.filter(s => filters.operator.includes(s.operator));
    if (filters.orbit.length > 0)
      filtered = filtered.filter(s => filters.orbit.includes(s.orbit));

    filtered = filtered.filter(s =>
      s.altitude >= filters.altitudeRange.min &&
      s.altitude <= filters.altitudeRange.max
    );

    filtered.sort((a, b) => {
      let aVal = a[sortBy], bVal = b[sortBy];
      if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    return filtered;
  }, [satellites, searchQuery, statusTab, filters, sortBy, sortOrder]);

  const displayedSatellites = useMemo(() => {
    return filteredSatellites.slice(0, 8);
  }, [filteredSatellites]);

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const exportData = (format) => {
    const rows = filteredSatellites.map(s => ({
      ID: s.id, Name: s.name, Operator: s.operator,
      Status: s.status, Altitude: s.altitude.toFixed(1),
      Inclination: s.inclination.toFixed(2), Orbit: s.orbit,
      Period: s.period.toFixed(1), RiskLevel: s.riskLevel
    }));
    if (format === 'csv') {
      const csv = [Object.keys(rows[0]).join(','), ...rows.map(r => Object.values(r).join(','))].join('\n');
      downloadFile(csv, 'satellites.csv', 'text/csv');
    } else {
      downloadFile(JSON.stringify(rows, null, 2), 'satellites.json', 'application/json');
    }
  };

  const downloadFile = (content, filename, type) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = filename;
    a.click();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'text-green-400 bg-green-500/20';
      case 'non-operational': return 'text-red-400 bg-red-500/20';
      case 'partially-operational': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational': return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
      case 'non-operational': return <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />;
      default: return <ClockIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRiskBadgeStyle = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'text-red-400 bg-red-500/10 border border-red-500/20';
      case 'medium':
      case 'moderate':
        return 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20';
      case 'low':
      default:
        return 'text-green-400 bg-green-500/10 border border-green-500/20';
    }
  };

  const SatelliteCard = ({ satellite }) => (
    <MotionDiv
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-4 hover:bg-dark-lighter/30 transition-colors cursor-pointer"
      onClick={() => setSelectedSatellite(satellite)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <GlobeAltIcon className="w-5 h-5 text-neon-blue" />
          <div>
            <h3 className="font-medium text-white text-sm">{satellite.name}</h3>
            <p className="text-xs text-gray-400">{satellite.id}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(satellite.status)}`}>
          {satellite.status.replace('-', ' ').toUpperCase()}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Operator:</span>
          <span className="text-gray-300">{satellite.operator}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Altitude:</span>
          <span className="text-white">{satellite.altitude.toFixed(0)} km</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Orbit:</span>
          <span className="text-white">{satellite.orbit}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Risk:</span>
          <span className={`capitalize font-medium ${satellite.riskLevel === 'critical' ? 'text-red-400' :
              satellite.riskLevel === 'high' ? 'text-orange-400' :
                satellite.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
            }`}>{satellite.riskLevel}</span>
        </div>
      </div>
    </MotionDiv>
  );

  if (isLoading) {
    return (
      <div className={isWidget ? "" : "min-h-screen bg-dark p-6"}>
        <div className={isWidget ? "" : "max-w-7xl mx-auto"}>
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-600/30 rounded w-64"></div>
            <div className="h-12 bg-gray-600/20 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-600/20 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isWidget ? "" : "min-h-screen bg-dark p-6"}>
      <div className={isWidget ? "space-y-6" : "max-w-7xl mx-auto space-y-6"}>
        {/* Header */}
        {!isWidget && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <GlobeAltIcon className="w-8 h-8 text-neon-blue" />
              <div>
                <h1 className="text-3xl text-white">Satellites</h1>
                <p className="text-gray-400">Monitor active and inactive satellite systems</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="glass-card px-4 py-2">
                <span className="text-sm text-gray-400">Operational: </span>
                <span className="text-lg text-green-400">
                  {satellites.filter(s => s.status === 'operational').length.toLocaleString()}
                </span>
              </div>
              <div className="glass-card px-4 py-2">
                <span className="text-sm text-gray-400">Total Systems: </span>
                <span className="text-lg text-neon-blue">{satellites.length.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Search and Controls */}
        <div className="glass-card p-6 relative z-20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search satellites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-lighter border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
                />
              </div>

              {/* Quick Status Tabs for Active/Inactive monitoring */}
              <div className="flex bg-dark-lighter border border-gray-700 rounded-lg p-1 w-fit self-start sm:self-auto">
                <button
                  onClick={() => setStatusTab('all')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    statusTab === 'all'
                      ? 'bg-neon-blue text-dark shadow-md font-normal'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  View All
                </button>
                <button
                  onClick={() => setStatusTab('active')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center space-x-1.5 ${
                    statusTab === 'active'
                      ? 'bg-green-500 text-black shadow-md font-normal'
                      : 'text-gray-400 hover:text-green-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping inline-block" />
                  <span>Active</span>
                </button>
                <button
                  onClick={() => setStatusTab('inactive')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center space-x-1.5 ${
                    statusTab === 'inactive'
                      ? 'bg-red-500 text-white shadow-md font-normal'
                      : 'text-gray-400 hover:text-red-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                  <span>Inactive</span>
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-normal transition-colors ${showFilters ? 'bg-neon-blue text-dark' : 'glass-button'}`}>
                <FunnelIcon className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>
              <div className="relative group">
                <button className="flex items-center space-x-1.5 glass-button px-3 py-1.5 rounded-md text-xs font-normal">
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
                <div className="absolute right-0 top-full mt-1.5 w-36 glass-card p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30">
                  <button onClick={() => exportData('csv')} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-300 hover:bg-dark-lighter rounded">Export as CSV</button>
                  <button onClick={() => exportData('json')} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-300 hover:bg-dark-lighter rounded">Export as JSON</button>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="mt-6 pt-6 border-t border-gray-700 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                    <select multiple className="w-full bg-dark-lighter border border-gray-600 rounded-lg text-white p-2"
                      onChange={(e) => setFilters(prev => ({ ...prev, status: Array.from(e.target.selectedOptions, o => o.value) }))}>
                      <option value="operational">Operational</option>
                      <option value="non-operational">Non-operational</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Orbit Type</label>
                    <select multiple className="w-full bg-dark-lighter border border-gray-600 rounded-lg text-white p-2"
                      onChange={(e) => setFilters(prev => ({ ...prev, orbit: Array.from(e.target.selectedOptions, o => o.value) }))}>
                      <option value="LEO">LEO</option>
                      <option value="MEO">MEO</option>
                      <option value="GEO">GEO</option>
                      <option value="SSO">SSO</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Altitude Range (km)</label>
                    <div className="flex space-x-2">
                      <input type="number" placeholder="Min" className="w-full bg-dark-lighter border border-gray-600 rounded-lg text-white p-2 text-sm"
                        onChange={(e) => setFilters(prev => ({ ...prev, altitudeRange: { ...prev.altitudeRange, min: Number(e.target.value) } }))} />
                      <input type="number" placeholder="Max" className="w-full bg-dark-lighter border border-gray-600 rounded-lg text-white p-2 text-sm"
                        onChange={(e) => setFilters(prev => ({ ...prev, altitudeRange: { ...prev.altitudeRange, max: Number(e.target.value) || 50000 } }))} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={() => setFilters({ status: [], operator: [], purpose: [], orbit: [], powerStatus: [], altitudeRange: { min: 0, max: 50000 } })}
                    className="text-sm text-gray-400 hover:text-white transition-colors">
                    Clear All Filters
                  </button>
                </div>
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>

        {/* Satellites Display */}
        <div className="glass-card overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-lighter/50 text-xs uppercase tracking-wider text-gray-400">
                <tr className="border-b border-gray-700/50">
                  <th className="px-6 py-4 text-left font-normal">
                    <button onClick={() => handleSort('name')} className="hover:text-white transition-colors">Satellite</button>
                  </th>
                  <th className="px-6 py-4 text-left font-normal">
                    <button onClick={() => handleSort('operator')} className="hover:text-white transition-colors">Operator</button>
                  </th>
                  <th className="px-6 py-4 text-left font-normal">Mission</th>
                  <th className="px-6 py-4 text-left font-normal">Orbit</th>
                  <th className="px-6 py-4 text-left font-normal">Status</th>
                  <th className="px-6 py-4 text-left font-normal">
                    <button onClick={() => handleSort('altitude')} className="hover:text-white transition-colors">Altitude</button>
                  </th>
                  <th className="px-6 py-4 text-left font-normal">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {displayedSatellites.map((s, i) => (
                  <MotionTr key={s.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.01, 0.5) }}
                    className="hover:bg-dark-lighter/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedSatellite(s)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <GlobeAltIcon className="w-5 h-5 text-neon-blue flex-shrink-0" />
                        <div>
                          <div className="text-white font-medium">{s.name}</div>
                          <div className="text-sm text-gray-400">{s.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{s.operator}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm max-w-[200px] truncate">{s.mission}</td>
                    <td className="px-6 py-4 text-gray-300">{s.orbit}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(s.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(s.status)}`}>
                          {s.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{s.altitude.toFixed(0)} km</td>
                    <td className="px-6 py-4">
                      <span className={`capitalize px-2.5 py-1 rounded text-xs font-medium ${getRiskBadgeStyle(s.riskLevel)}`}>{s.riskLevel}</span>
                    </td>
                  </MotionTr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-gray-700/60">
            {displayedSatellites.map((s, i) => (
              <MotionDiv
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.01, 0.5) }}
                className="p-4 hover:bg-dark-lighter/30 transition-colors cursor-pointer"
                onClick={() => setSelectedSatellite(s)}
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center space-x-2">
                    <GlobeAltIcon className="w-5 h-5 text-neon-blue flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.id}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskBadgeStyle(s.riskLevel)}`}>
                    {s.riskLevel.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                  <div>
                    <span className="text-gray-500">Operator: </span>
                    <span className="text-gray-300">{s.operator}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Altitude: </span>
                    <span className="text-white">{s.altitude.toFixed(0)} km</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Orbit: </span>
                    <span className="text-gray-300">{s.orbit}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-500">Status: </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusColor(s.status)}`}>
                      {s.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </MotionDiv>
            ))}
          </div>
        </div>

        {filteredSatellites.length > 8 && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setIsExpanded(true)}
              className="px-6 py-2.5 bg-dark-lighter border border-gray-700 hover:border-neon-blue rounded-xl text-sm text-gray-300 hover:text-white transition-all shadow-lg flex items-center space-x-2"
            >
              <span>View All ({filteredSatellites.length})</span>
            </button>
          </div>
        )}

        {/* Full Satellites Database Modal Popup */}
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
                  className="relative w-full max-w-6xl bg-dark/95 backdrop-blur-2xl border border-gray-700/80 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden z-10 p-6 text-white flex flex-col max-h-[85vh]"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4 flex-shrink-0">
                    <div>
                      <h2 className="text-2xl text-white flex items-center">
                        Indian Spacecraft Registry
                      </h2>
                    </div>
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="p-2 hover:bg-gray-800 rounded-full transition-all border border-transparent hover:border-gray-700 text-gray-400 hover:text-white"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Table Container */}
                  <ScrollContainer
                    maxClass="max-h-[58vh]"
                    shadowColor="from-[#0c0c0e]"
                    keyDependency={filteredSatellites.length}
                    className="flex-1 overflow-auto pr-1"
                  >
                    {/* Desktop Table View */}
                    <table className="w-full hidden md:table">
                      <thead className="bg-dark-lighter sticky top-0 z-10 backdrop-blur-md text-xs uppercase tracking-wider text-gray-400">
                        <tr className="border-b border-gray-700">
                          <th className="px-6 py-4 text-left font-normal">
                            <button onClick={() => handleSort('name')} className="text-gray-400 hover:text-white">Satellite</button>
                          </th>
                          <th className="px-6 py-4 text-left font-normal">
                            <button onClick={() => handleSort('operator')} className="text-gray-400 hover:text-white">Operator</button>
                          </th>
                          <th className="px-6 py-4 text-left font-normal">Mission</th>
                          <th className="px-6 py-4 text-left font-normal">Orbit</th>
                          <th className="px-6 py-4 text-left font-normal">Status</th>
                          <th className="px-6 py-4 text-left font-normal">
                            <button onClick={() => handleSort('altitude')} className="text-gray-400 hover:text-white">Altitude</button>
                          </th>
                          <th className="px-6 py-4 text-left font-normal">Risk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {filteredSatellites.map((s, i) => (
                          <tr key={s.id}
                            className="hover:bg-dark-lighter/30 transition-colors cursor-pointer"
                            onClick={() => { setSelectedSatellite(s); setIsExpanded(false); }}>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <GlobeAltIcon className="w-5 h-5 text-neon-blue flex-shrink-0" />
                                <div>
                                  <div className="text-white font-normal">{s.name}</div>
                                  <div className="text-sm text-gray-400">{s.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-300">{s.operator}</td>
                            <td className="px-6 py-4 text-gray-400 text-sm max-w-[200px] truncate">{s.mission}</td>
                            <td className="px-6 py-4 text-gray-300">{s.orbit}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(s.status)}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(s.status)}`}>
                                  {s.status.replace('-', ' ').toUpperCase()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-300">{s.altitude.toFixed(0)} km</td>
                            <td className="px-6 py-4">
                              <span className={`capitalize px-2.5 py-1 rounded text-xs font-medium ${getRiskBadgeStyle(s.riskLevel)}`}>{s.riskLevel}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Mobile Card List View */}
                    <div className="md:hidden divide-y divide-gray-700/60">
                      {filteredSatellites.map((s, i) => (
                        <div
                          key={s.id}
                          className="py-4 first:pt-0 last:pb-0 hover:bg-dark-lighter/30 transition-colors cursor-pointer"
                          onClick={() => { setSelectedSatellite(s); setIsExpanded(false); }}
                        >
                          <div className="flex items-start justify-between mb-2.5">
                            <div className="flex items-center space-x-2">
                              <GlobeAltIcon className="w-5 h-5 text-neon-blue flex-shrink-0" />
                              <div>
                                <p className="text-white font-medium text-sm">{s.name}</p>
                                <p className="text-xs text-gray-400">{s.id}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskBadgeStyle(s.riskLevel)}`}>
                              {s.riskLevel.toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                            <div>
                              <span className="text-gray-500">Operator: </span>
                              <span className="text-gray-300">{s.operator}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Altitude: </span>
                              <span className="text-white">{s.altitude.toFixed(0)} km</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Orbit: </span>
                              <span className="text-gray-300">{s.orbit}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-500">Status: </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusColor(s.status)}`}>
                                {s.status.replace('-', ' ').toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollContainer>
                </MotionDiv>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Detail Modal */}
        {createPortal(
          <AnimatePresence>
            {selectedSatellite && (
              <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedSatellite(null)}>
                <MotionDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  className="glass-card p-5 sm:p-6 max-w-4xl w-full max-h-[90vh] flex flex-col"
                  onClick={(e) => e.stopPropagation()}>
                  {/* Header — never scrolls away */}
                  <div className="flex items-center justify-between mb-5 flex-shrink-0">
                    <h3 className="text-xl sm:text-2xl text-white">{selectedSatellite.name}</h3>
                    <button onClick={() => setSelectedSatellite(null)} className="text-gray-400 hover:text-white text-xl flex-shrink-0 ml-3">×</button>
                  </div>

                  {/* Scrollable body — only scrolls when content taller than remaining space */}
                  <div className="overflow-y-auto flex-1 min-h-0 pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                      <div className="space-y-4">
                        <h4 className="text-base font-semibold text-neon-blue">Basic Information</h4>
                        <div className="space-y-3 text-sm">
                          {[
                            ['Catalog #', selectedSatellite.id],
                            ['Operator', selectedSatellite.operator],
                            ['Status', selectedSatellite.status.replace('-', ' ').toUpperCase()],
                            ['Risk Level', selectedSatellite.riskLevel],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between gap-3">
                              <span className="text-gray-400 flex-shrink-0">{label}:</span>
                              <span className="text-white text-right">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-base font-semibold text-neon-blue">Orbital Parameters</h4>
                        <div className="space-y-3 text-sm">
                          {[
                            ['Altitude', `${selectedSatellite.altitude.toFixed(1)} km`],
                            ['Inclination', `${selectedSatellite.inclination.toFixed(2)}°`],
                            ['Period', `${selectedSatellite.period.toFixed(1)} min`],
                            ['Orbit Type', selectedSatellite.orbit],
                            ['Eccentricity', selectedSatellite.eccentricity.toFixed(6)],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between gap-3">
                              <span className="text-gray-400 flex-shrink-0">{label}:</span>
                              <span className="text-white text-right">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4 sm:col-span-2 md:col-span-1">
                        <h4 className="text-base font-semibold text-neon-blue">System Status</h4>
                        <div className="space-y-3 text-sm">
                          {[
                            ['Signal Strength', `${selectedSatellite.signalStrength.toFixed(1)}%`],
                            ['Battery Level', `${selectedSatellite.batteryLevel.toFixed(1)}%`],
                            ['Solar Efficiency', `${selectedSatellite.solarPanelEfficiency.toFixed(1)}%`],
                            ['Last Contact', selectedSatellite.lastContact.toLocaleTimeString()],
                            ['Next Pass', selectedSatellite.nextPass.toLocaleTimeString()],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between gap-3">
                              <span className="text-gray-400 flex-shrink-0">{label}:</span>
                              <span className="text-white text-right">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer buttons — never scrolls away */}
                  <div className="mt-5 flex flex-col sm:flex-row gap-3 flex-shrink-0">
                    <button className="neon-button sm:flex-1 py-2">Track Satellite</button>
                    <button className="glass-button sm:flex-1 py-2">Communication Log</button>
                    <button className="glass-button sm:flex-1 py-2">Generate Report</button>
                  </div>
                </MotionDiv>
              </MotionDiv>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </div>
  );
};

export default Satellites;
