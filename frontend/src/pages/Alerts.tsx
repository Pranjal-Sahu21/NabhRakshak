import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const MotionDiv = motion.div as React.FC<any>;
import {
  ExclamationTriangleIcon,
  BellIcon,
  ShieldExclamationIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  FireIcon,
  InformationCircleIcon,
  PlayIcon,
  PauseIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

import { isroSatellites } from '../data/isroSatellites';
import { getAlerts } from '../services/api';

// ── Priority order for sorting ──────────────────────────────────────────────
const STATUS_PRIORITY = { active: 0, investigating: 1, acknowledged: 2, resolved: 3 };
const SEVERITY_PRIORITY = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filters, setFilters] = useState({ severity: [], status: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  // ── Map backend alert ──────────────────────────────────────────────────────
  const mapBackendAlert = (raw, index) => {
    const sev = raw.severity || 'low';
    const prob = (raw.collision_probability || 0) * 100;
    const missDist = raw.miss_distance || 0;
    const obj1Name = raw.object1?.name || 'Unknown Satellite';
    const obj2Name = raw.object2?.name || 'Unknown Debris';
    const recText = raw.recommendation || 'Continue routine monitoring';
    return {
      id: raw.id || `ISRO-CONJ-${String(index + 1).padStart(3, '0')}`,
      title: sev === 'critical' || sev === 'high' ? 'Potential Collision Detected' : 'Conjunction Warning',
      description: `${sev.charAt(0).toUpperCase() + sev.slice(1)} risk conjunction between ${obj1Name} and ${obj2Name}. ` +
        `Miss distance: ${missDist.toFixed(2)} km. Collision probability: ${prob.toFixed(4)}%. Altitude: ${raw.altitude || 0} km`,
      severity: sev,
      type: 'collision',
      status: raw.status === 'active' ? 'active' : raw.status === 'monitoring' ? 'investigating' : (raw.status || 'investigating'),
      source: 'SGP4/TLE',
      timestamp: raw.closest_approach_time ? new Date(raw.closest_approach_time) : new Date(),
      probability: prob,
      miss_distance: missDist,
      altitude: raw.altitude || 0,
      relative_velocity: raw.relative_velocity || 0,
      timeToEvent: raw.time_to_approach ? raw.time_to_approach / 60 : 0,
      affectedObjects: 2,
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolvedAt: null,
      object1: { name: obj1Name, type: raw.object1?.type === 'satellite' ? 'Satellite' : (raw.object1?.type || 'Satellite') },
      object2: { name: obj2Name, type: raw.object2?.type === 'debris' ? 'Debris' : (raw.object2?.type || 'Debris') },
      recommendations: sev === 'critical'
        ? [recText, 'Notify ISRO satellite operator', 'Alert ground control at ISTRAC']
        : sev === 'high'
          ? [recText, 'Prepare avoidance maneuver', 'Update orbital predictions via NORAD']
          : [recText, 'Update TLE tracking data', 'Log conjunction event'],
    };
  };

  // ── Fetch alerts ───────────────────────────────────────────────────────────
  const fetchLiveAlerts = async () => {
    try {
      const res = await getAlerts('all');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setAlerts(res.data.map((a, i) => mapBackendAlert(a, i)));
      } else {
        throw new Error('Empty response');
      }
    } catch {
      const leoSats = isroSatellites.filter(s => s.orbit === 'LEO');
      const severities = ['critical', 'critical', 'high', 'high', 'medium', 'medium', 'low', 'low'];
      const debrisTypes = ['PSLV Stage-4 Body', 'GSLV Debris Fragment', 'Mission Payload Adapter',
        'Upper Stage Remnant', 'SRM Nozzle Fragment', 'Solar Panel Debris', 'CZ-3B Debris', 'Rokot Fragment'];
      setAlerts(leoSats.slice(0, 8).map((sat, i) => {
        const sev = severities[i % severities.length];
        const prob = sev === 'critical' ? 0.0012 + Math.random() * 0.002
          : sev === 'high' ? 0.0004 + Math.random() * 0.0008
          : sev === 'medium' ? 0.00005 + Math.random() * 0.0003
          : Math.random() * 0.00005;
        const missDist = sev === 'critical' ? 0.1 + Math.random() * 0.4
          : sev === 'high' ? 0.5 + Math.random() * 1.5
          : 2 + Math.random() * 8;
        const debris = debrisTypes[i % debrisTypes.length];
        const statuses = { critical: 'active', high: 'active', medium: 'investigating', low: 'acknowledged' };
        return {
          id: `ISRO-CONJ-${String(i + 1).padStart(3, '0')}`,
          title: sev === 'critical' || sev === 'high' ? 'Potential Collision Detected' : 'Conjunction Warning',
          description: `${sev.charAt(0).toUpperCase() + sev.slice(1)} risk conjunction between ${sat.name} ` +
            `and ${debris}. Miss distance: ${missDist.toFixed(2)} km. ` +
            `Collision probability: ${(prob * 100).toFixed(4)}%. Altitude: ${sat.altitude} km.`,
          severity: sev, type: 'collision',
          status: statuses[sev] || 'investigating',
          source: 'SGP4/TLE', timestamp: new Date(Date.now() - i * 3600000 * 2),
          probability: prob * 100, miss_distance: missDist, altitude: sat.altitude,
          relative_velocity: 7.2 + Math.random() * 1.8,
          timeToEvent: sev === 'critical' ? 30 + Math.random() * 90 : 120 + Math.random() * 1440,
          affectedObjects: 2, acknowledgedBy: null, acknowledgedAt: null, resolvedAt: null,
          object1: { name: sat.name, type: 'Satellite' },
          object2: { name: debris, type: 'Debris' },
          recommendations: sev === 'critical'
            ? ['Initiate collision avoidance maneuver immediately', 'Notify ISRO satellite operator', 'Alert ground control at ISTRAC']
            : sev === 'high'
              ? ['Monitor conjunction closely', 'Prepare avoidance maneuver', 'Update orbital predictions via NORAD']
              : ['Continue routine monitoring', 'Update TLE tracking data', 'Log conjunction event'],
        };
      }));
    } finally {
      setIsLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => { fetchLiveAlerts(); }, []);
  useEffect(() => {
    if (!realTimeEnabled) return;
    const interval = setInterval(fetchLiveAlerts, 60000);
    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  // ── Filter + Sort: active first, then by severity ─────────────────────────
  const filteredAlerts = useMemo(() => {
    let filtered = [...alerts];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.object1?.name?.toLowerCase().includes(q) ||
        a.object2?.name?.toLowerCase().includes(q)
      );
    }

    if (filters.severity.length > 0)
      filtered = filtered.filter(a => filters.severity.includes(a.severity));
    if (filters.status.length > 0)
      filtered = filtered.filter(a => filters.status.includes(a.status));

    // Sort: status priority first (active first), then severity
    filtered.sort((a, b) => {
      const sp = (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9);
      if (sp !== 0) return sp;
      return (SEVERITY_PRIORITY[a.severity] ?? 9) - (SEVERITY_PRIORITY[b.severity] ?? 9);
    });

    return filtered;
  }, [alerts, searchQuery, filters]);

  const acknowledgeAlert = (alertId) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, status: 'acknowledged', acknowledgedBy: 'Mission Controller', acknowledgedAt: new Date() } : a
    ));
    if (selectedAlert?.id === alertId)
      setSelectedAlert(prev => prev ? { ...prev, status: 'acknowledged' } : null);
  };

  const resolveAlert = (alertId) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, status: 'resolved', resolvedAt: new Date() } : a
    ));
    if (selectedAlert?.id === alertId)
      setSelectedAlert(prev => prev ? { ...prev, status: 'resolved' } : null);
  };

  const exportData = (format) => {
    const rows = filteredAlerts.map(a => ({
      ID: a.id, Title: a.title, Severity: a.severity,
      Status: a.status, Source: a.source,
      Timestamp: a.timestamp.toISOString(),
      Probability: a.probability.toFixed(4) + '%',
      MissDistance: a.miss_distance?.toFixed(2) + ' km',
    }));
    const content = format === 'csv'
      ? [Object.keys(rows[0]).join(','), ...rows.map(r => Object.values(r).join(','))].join('\n')
      : JSON.stringify(rows, null, 2);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' }));
    a.download = `alerts.${format}`;
    a.click();
  };

  // ── Style helpers ──────────────────────────────────────────────────────────
  const SEVERITY_STYLES = {
    critical: {
      border: 'border-l-red-500/80',
      badge: 'bg-red-950/40 text-red-400 border border-red-900/40',
      glow: 'shadow-[0_0_10px_rgba(239,68,68,0.2)]',
      dot: 'bg-red-500 animate-pulse',
      bar: 'bg-red-500/80',
      icon: <FireIcon className="w-4 h-4" />,
      label: 'CRITICAL',
    },
    high: {
      border: 'border-l-orange-500/80',
      badge: 'bg-orange-950/30 text-orange-400 border border-orange-900/30',
      glow: '',
      dot: 'bg-orange-500',
      bar: 'bg-orange-500/80',
      icon: <ExclamationTriangleIcon className="w-4 h-4" />,
      label: 'HIGH',
    },
    medium: {
      border: 'border-l-yellow-500/80',
      badge: 'bg-yellow-950/40 text-yellow-400 border border-yellow-900/40',
      glow: '',
      dot: 'bg-yellow-500',
      bar: 'bg-yellow-500/80',
      icon: <ShieldExclamationIcon className="w-4 h-4" />,
      label: 'MEDIUM',
    },
    low: {
      border: 'border-l-green-500/80',
      badge: 'bg-green-950/40 text-green-400 border border-green-900/40',
      glow: '',
      dot: 'bg-green-500',
      bar: 'bg-green-500/80',
      icon: <InformationCircleIcon className="w-4 h-4" />,
      label: 'LOW',
    },
  };

  const STATUS_STYLES = {
    active: 'bg-gray-800/30 text-gray-300 border border-gray-700/40',
    investigating: 'bg-gray-800/30 text-gray-400 border border-gray-700/40',
    acknowledged: 'bg-gray-800/30 text-gray-400 border border-gray-700/40',
    resolved: 'bg-gray-800/30 text-gray-500 border border-gray-700/40',
  };

  const STATUS_ICONS = {
    active: <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300 mr-1.5" />,
    investigating: <EyeIcon className="w-3 h-3 mr-1 text-gray-400" />,
    acknowledged: <ClockIcon className="w-3 h-3 mr-1 text-gray-400" />,
    resolved: <CheckCircleIcon className="w-3 h-3 mr-1 text-gray-500" />,
  };

  const sev = (s) => SEVERITY_STYLES[s] || SEVERITY_STYLES.low;

  // ── Dynamic filter toggle helper ───────────────────────────────────────────
  const toggleFilter = (key, value) => {
    setFilters(prev => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      };
    });
  };

  const clearFilters = () => setFilters({ severity: [], status: [] });

  const activeFilterCount = filters.severity.length + filters.status.length;

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    active: alerts.filter(a => a.status === 'active').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    investigating: alerts.filter(a => a.status === 'investigating').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    total: alerts.length,
  }), [alerts]);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-[#111]/80 border border-[#222] rounded-xl animate-pulse" />
          ))}
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-[#111]/80 border border-[#222] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 text-white">

      {/* ── Top Stats Bar ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Active', value: stats.active, color: 'text-gray-300', bg: 'bg-[#181818]/70 border-gray-800/30' },
          { label: 'Critical', value: stats.critical, color: 'text-gray-300', bg: 'bg-[#181818]/70 border-gray-800/30' },
          { label: 'High Risk', value: stats.high, color: 'text-gray-400', bg: 'bg-[#151515]/70 border-gray-800/30' },
          { label: 'Investigating', value: stats.investigating, color: 'text-gray-400', bg: 'bg-[#121212]/70 border-gray-800/30' },
          { label: 'Resolved', value: stats.resolved, color: 'text-gray-500', bg: 'bg-[#0d0d0d]/70 border-gray-800/30' },
          { label: 'Total Alerts', value: stats.total, color: 'text-gray-300', bg: 'bg-[#0d0d0d] border-[#1e1e1e]' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`border rounded-xl px-4 py-3 flex flex-col gap-1 ${bg}`}>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</span>
            <span className={`text-2xl font-normal ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-4 py-3 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search alerts, satellites, debris..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-black/60 border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-gray-600 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
            showFilters || activeFilterCount > 0
              ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
          }`}
        >
          <FunnelIcon className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-500 text-white text-[10px] font-normal rounded-full w-4 h-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Live toggle */}
        <button
          onClick={() => setRealTimeEnabled(r => !r)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
            realTimeEnabled
              ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <SignalIcon className="w-4 h-4" />
          <span>{realTimeEnabled ? '● Live' : 'Paused'}</span>
        </button>

        {/* Refresh */}
        <button
          onClick={fetchLiveAlerts}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <ArrowTrendingUpIcon className="w-4 h-4" />
          <span>Refresh</span>
        </button>

        {/* Export */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white text-sm transition-colors">
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export</span>
          </button>
          <div className="absolute right-0 top-full mt-1 w-36 bg-[#111] border border-[#2a2a2a] rounded-lg p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-xl">
            <button onClick={() => exportData('csv')} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded transition-colors">CSV</button>
            <button onClick={() => exportData('json')} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded transition-colors">JSON</button>
          </div>
        </div>

        {lastRefresh && (
          <span className="text-xs text-gray-600 ml-auto hidden sm:block">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* ── Dynamic Filter Panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <MotionDiv
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-4 space-y-4"
          >
            {/* Severity filter row */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-normal mb-2.5">Severity</p>
              <div className="flex flex-wrap gap-2">
                {['critical', 'high', 'medium', 'low'].map(s => {
                  const active = filters.severity.includes(s);
                  const st = sev(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleFilter('severity', s)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        active ? st.badge : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? st.dot : 'bg-gray-600'}`} />
                      {st.label}
                      <span className="text-[10px] opacity-60">
                        ({alerts.filter(a => a.severity === s).length})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status filter row */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-normal mb-2.5">Status</p>
              <div className="flex flex-wrap gap-2">
                {['active', 'investigating', 'acknowledged', 'resolved'].map(s => {
                  const active = filters.status.includes(s);
                  const style = STATUS_STYLES[s];
                  return (
                    <button
                      key={s}
                      onClick={() => toggleFilter('status', s)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        active ? style : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
                      }`}
                    >
                      {active && STATUS_ICONS[s]}
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                      <span className="text-[10px] opacity-60 ml-1">
                        ({alerts.filter(a => a.status === s).length})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex justify-end pt-1 border-t border-[#1a1a1a]">
                <button onClick={clearFilters} className="text-xs text-gray-600 hover:text-white transition-colors">
                  ✕ Clear all filters
                </button>
              </div>
            )}
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* ── Active-first section label ──────────────────────────────────────── */}
      {filteredAlerts.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-gray-600 uppercase tracking-wider font-normal">
            {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''} — sorted by priority
          </span>
          {stats.active > 0 && (
            <span className="flex items-center gap-1 text-xs  font-medium">
              <span className="w-1.5 h-1.5 rounded-full" />
              {stats.active} active
            </span>
          )}
        </div>
      )}

      {/* ── Alert Cards ────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl">
            <CheckCircleIcon className="w-14 h-14 text-green-400/50" />
            <div className="text-center">
              <h3 className="text-lg font-normal text-gray-300 mb-1">No Alerts Found</h3>
              <p className="text-sm text-gray-600">
                {activeFilterCount > 0 || searchQuery ? 'Try adjusting your filters.' : 'All systems nominal.'}
              </p>
            </div>
            {(activeFilterCount > 0 || searchQuery) && (
              <button onClick={() => { clearFilters(); setSearchQuery(''); }}
                className="text-xs text-blue-400 hover:text-blue-300 underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredAlerts.map((alert, index) => {
              const st = sev(alert.severity);
              const isActive = alert.status === 'active';
              return (
                <MotionDiv
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
                  onClick={() => setSelectedAlert(alert)}
                  className={`relative bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl py-5 px-6 cursor-pointer hover:bg-[#121212] hover:border-[#2a2a2a] transition-all duration-200 group`}
                >
                  {/* Active indicator dot */}
                  {isActive && (
                    <span className={`absolute top-3.5 right-3.5 w-2 h-2 rounded-full ${st.dot}`} />
                  )}

                  <div className="flex items-start gap-4 pr-6">
                    {/* Severity icon bubble */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${st.badge}`}>
                      {st.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Row 1: Title + badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-sm font-normal text-white">{alert.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-normal tracking-wide ${st.badge}`}>
                          {st.label}
                        </span>
                        <span className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLES[alert.status] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                          {STATUS_ICONS[alert.status]}
                          {alert.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Row 2: Object pair */}
                      <div className="flex items-center gap-1.5 mb-3.5">
                        <span className="text-xs font-medium text-blue-400 truncate max-w-[140px]">{alert.object1?.name}</span>
                        <ChevronRightIcon className="w-3 h-3 text-gray-600 flex-shrink-0" />
                        <span className="text-xs text-amber-400 truncate max-w-[140px]">{alert.object2?.name}</span>
                      </div>

                      {/* Row 3: Key metrics */}
                      <div className="flex flex-wrap gap-4 text-xs mb-5">
                        <div>
                          <span className="text-gray-500">Prob.</span>
                          <span className={`ml-1 font-mono font-normal ${alert.probability > 0.1 ? 'text-red-400' : alert.probability > 0.01 ? 'text-amber-400' : 'text-gray-300'}`}>
                            {alert.probability.toFixed(4)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Miss Dist.</span>
                          <span className={`ml-1 font-mono font-normal ${alert.miss_distance < 0.5 ? 'text-red-400' : alert.miss_distance < 2 ? 'text-amber-400' : 'text-gray-300'}`}>
                            {alert.miss_distance?.toFixed(2)} km
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Alt.</span>
                          <span className="ml-1 font-mono text-gray-300">{alert.altitude?.toFixed(0)} km</span>
                        </div>
                        {alert.timeToEvent > 0 && (
                          <div>
                            <span className="text-gray-500">TCA in</span>
                            <span className={`ml-1 font-mono font-normal ${alert.timeToEvent < 60 ? 'text-red-400' : alert.timeToEvent < 360 ? 'text-amber-400' : 'text-gray-300'}`}>
                              {alert.timeToEvent < 60
                                ? `${alert.timeToEvent.toFixed(0)}m`
                                : `${(alert.timeToEvent / 60).toFixed(1)}h`}
                            </span>
                          </div>
                        )}
                        <div className="ml-auto">
                          <span className="text-gray-600">{alert.timestamp.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Probability risk bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${st.bar}`}
                            style={{ width: `${Math.min(100, (alert.probability / 0.2) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-600 w-16 text-right">Risk level</span>
                      </div>
                    </div>
                  </div>

                  {/* Hover detail arrow */}
                  <ChevronRightIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
                </MotionDiv>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* ── Detail Modal ───────────────────────────────────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {selectedAlert && (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[200] p-4"
              onClick={() => setSelectedAlert(null)}
            >
              <MotionDiv
                initial={{ scale: 0.93, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.93, opacity: 0, y: 20 }}
                transition={{ type: 'spring', duration: 0.4 }}
                className="bg-[#0c0c0c] border border-[#1e1e1e] rounded-2xl max-w-3xl w-full max-h-[88vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="flex items-start justify-between p-5 border-b border-[#1a1a1a] rounded-t-2xl">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${sev(selectedAlert.severity).badge}`}>
                      {sev(selectedAlert.severity).icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-normal ${sev(selectedAlert.severity).badge}`}>
                          {sev(selectedAlert.severity).label}
                        </span>
                        <span className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLES[selectedAlert.status]}`}>
                          {STATUS_ICONS[selectedAlert.status]}
                          {selectedAlert.status.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-lg font-normal text-white">{selectedAlert.title}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedAlert.id}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedAlert(null)} className="text-gray-600 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-all">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  {/* Objects */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Primary Object', obj: selectedAlert.object1, color: 'text-blue-400', border: 'border-blue-900/30' },
                      { label: 'Secondary Object', obj: selectedAlert.object2, color: 'text-amber-400', border: 'border-amber-900/30' },
                    ].map(({ label, obj, color, border }) => (
                      <div key={label} className={`p-4 rounded-xl bg-black/40 border ${border}`}>
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</p>
                        <h4 className="text-sm font-medium text-white truncate">{obj.name}</h4>
                        <p className={`text-[10px] mt-0.5 ${color}`}>{obj.type}</p>
                      </div>
                    ))}
                  </div>

                  {/* Collision Parameters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#111]/30 p-4 rounded-xl border border-[#222]">
                    {[
                      { label: 'Collision Prob.', value: `${selectedAlert.probability.toFixed(4)}%`, warn: selectedAlert.probability > 0.05 },
                      { label: 'Miss Distance', value: `${selectedAlert.miss_distance?.toFixed(2)} km`, warn: selectedAlert.miss_distance < 1 },
                      { label: 'Altitude', value: `${selectedAlert.altitude?.toFixed(0)} km` },
                      { label: 'Rel. Velocity', value: `${selectedAlert.relative_velocity?.toFixed(1)} km/s` },
                    ].map(({ label, value, warn }) => (
                      <div key={label}>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
                        <p className={`text-base font-normal font-mono mt-0.5 ${warn ? 'text-red-400 font-bold' : 'text-white'}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Approach countdown */}
                  {selectedAlert.timeToEvent > 0 && (
                    <div className="flex items-center gap-4 bg-red-950/10 border border-red-900/20 p-4 rounded-xl">
                      <ClockIcon className="w-8 h-8 text-red-400 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Closest Approach In</p>
                        <p className={`text-xl font-normal font-mono ${selectedAlert.timeToEvent < 60 ? 'text-red-400' : selectedAlert.timeToEvent < 360 ? 'text-amber-400' : 'text-white'}`}>
                          {selectedAlert.timeToEvent < 60
                            ? `${selectedAlert.timeToEvent.toFixed(0)} minutes`
                            : `${(selectedAlert.timeToEvent / 60).toFixed(1)} hours`}
                        </p>
                        <p className="text-sm text-gray-300 font-mono">{selectedAlert.timestamp.toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Recommended Action Steps</p>
                    <div className="space-y-1.5">
                      {selectedAlert.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-gray-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                          <p className="leading-normal">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {selectedAlert.status === 'active' && (
                      <>
                        <button
                          onClick={() => acknowledgeAlert(selectedAlert.id)}
                          className="flex-1 min-w-[140px] py-2.5 text-sm font-medium bg-white/5 text-gray-400 border border-white/10 rounded-xl hover:text-white hover:border-white/20 transition-colors"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => resolveAlert(selectedAlert.id)}
                          className="flex-1 min-w-[140px] py-2.5 text-sm font-medium bg-white/5 text-gray-400 border border-white/10 rounded-xl hover:text-white hover:border-white/20 transition-colors"
                        >
                          Mark Resolved
                        </button>
                      </>
                    )}
                    {selectedAlert.status === 'acknowledged' && (
                      <button
                        onClick={() => resolveAlert(selectedAlert.id)}
                        className="flex-1 min-w-[140px] py-2.5 text-sm font-medium bg-white/5 text-gray-400 border border-white/10 rounded-xl hover:text-white hover:border-white/20 transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedAlert(null)}
                      className="flex-1 min-w-[140px] py-2.5 text-sm font-medium bg-white/5 text-gray-400 border border-white/10 rounded-xl hover:text-white hover:border-white/20 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </MotionDiv>
            </MotionDiv>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default Alerts;