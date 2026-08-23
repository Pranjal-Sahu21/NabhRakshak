import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as React.FC<any>;
const MotionTr = motion.tr as React.FC<any>;
import {
  RocketLaunchIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

import { getRockets } from '../services/api';

const Rockets = () => {
  const [rockets, setRockets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRocket, setSelectedRocket] = useState(null);
  const [filters, setFilters] = useState({
    status: [], agency: [], mission: [],
    dateRange: { start: '', end: '' }
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);

  // Map backend rocket to frontend format
  const mapRocket = (obj) => ({
    id: obj.id,
    name: obj.name,
    agency: obj.manufacturer || 'Unknown',
    mission: obj.target_orbit ? `${obj.target_orbit} Mission` : 'Unknown',
    status: obj.active ? 'active' : 'deorbited',
    launchDate: new Date(),
    altitude: obj.target_orbit === 'GEO' ? 35786 : obj.target_orbit === 'MEO' ? 20200 : 550,
    velocity: 7.5,
    mass: obj.payload_capacity?.LEO || 10000,
    payload: (obj.payload_capacity?.LEO || 10000) / 1000,
    orbit: obj.target_orbit || 'LEO',
    inclination: obj.target_orbit === 'SSO' ? 98 : 51.6,
    apogee: obj.target_orbit === 'GEO' ? 35786 : 600,
    perigee: obj.target_orbit === 'GEO' ? 35786 : 500,
    riskLevel: obj.risk_assessment || 'low',
    reusable: obj.reusable,
    launchSites: obj.launch_sites || [],
    payloadCapacity: obj.payload_capacity || {},
  });

  useEffect(() => {
    const loadRockets = async () => {
      try {
        const data = await getRockets();
        setRockets(data.map(mapRocket));
      } catch (error) {
        console.error('Failed to load rockets:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRockets();
  }, []);

  const filteredRockets = useMemo(() => {
    let filtered = [...rockets];

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.mission.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filters.status.length > 0) filtered = filtered.filter(r => filters.status.includes(r.status));
    if (filters.agency.length > 0) filtered = filtered.filter(r => filters.agency.includes(r.agency));

    filtered.sort((a, b) => {
      let aVal = a[sortBy], bVal = b[sortBy];
      if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    return filtered;
  }, [rockets, searchQuery, filters, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const exportData = (format) => {
    const rows = filteredRockets.map(r => ({
      ID: r.id, Name: r.name, Agency: r.agency, Mission: r.mission,
      Status: r.status, Orbit: r.orbit, Risk: r.riskLevel,
      Reusable: r.reusable ? 'Yes' : 'No',
      'Payload LEO (kg)': r.payloadCapacity.LEO || 'N/A',
    }));
    if (format === 'csv') {
      const csv = [Object.keys(rows[0]).join(','), ...rows.map(r => Object.values(r).join(','))].join('\n');
      downloadFile(csv, 'rockets.csv', 'text/csv');
    } else {
      downloadFile(JSON.stringify(rows, null, 2), 'rockets.json', 'application/json');
    }
  };

  const downloadFile = (content, filename, type) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = filename;
    a.click();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
      case 'deorbited': return <ClockIcon className="w-4 h-4 text-gray-400" />;
      case 'failed': return <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />;
      default: return <CalendarIcon className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'deorbited': return 'text-gray-400 bg-gray-500/20';
      case 'failed': return 'text-red-400 bg-red-500/20';
      default: return 'text-blue-400 bg-blue-500/20';
    }
  };

  const getRiskColor = (risk) => {
    switch ((risk || '').toLowerCase()) {
      case 'critical':
      case 'high':
        return 'text-red-400 bg-red-500/20 border border-red-500/30';
      case 'moderate':
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30';
      case 'low':
      default:
        return 'text-green-400 bg-green-500/20 border border-green-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark p-6">
        <div className="max-w-7xl mx-auto animate-pulse space-y-6">
          <div className="h-8 bg-gray-600/30 rounded w-64"></div>
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-600/20 rounded"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <RocketLaunchIcon className="w-8 h-8 text-neon-blue" />
            <div>
              <h1 className="text-3xl font-normal text-white">Rocket Bodies</h1>
              <p className="text-gray-400">Monitor and track rocket stages and bodies</p>
            </div>
          </div>
          <div className="glass-card px-4 py-2">
            <span className="text-sm text-gray-400">Total: </span>
            <span className="text-lg font-normal text-neon-blue">{filteredRockets.length}</span>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="glass-card p-6 relative z-20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search rockets..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-lighter border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-neon-blue" />
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${showFilters ? 'bg-neon-blue text-dark' : 'glass-button'}`}>
                <FunnelIcon className="w-4 h-4" /><span>Filters</span>
              </button>
              <div className="relative group">
                <button className="flex items-center space-x-2 glass-button px-4 py-2">
                  <ArrowDownTrayIcon className="w-4 h-4" /><span>Export</span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 glass-card p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30">
                  <button onClick={() => exportData('csv')} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-dark-lighter rounded">Export as CSV</button>
                  <button onClick={() => exportData('json')} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-dark-lighter rounded">Export as JSON</button>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="mt-6 pt-6 border-t border-gray-700 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                    <select multiple className="w-full bg-dark-lighter border border-gray-600 rounded-lg text-white p-2"
                      onChange={(e) => setFilters(prev => ({ ...prev, status: Array.from(e.target.selectedOptions, o => o.value) }))}>
                      <option value="active">Active</option>
                      <option value="deorbited">Deorbited</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Agency</label>
                    <select multiple className="w-full bg-dark-lighter border border-gray-600 rounded-lg text-white p-2"
                      onChange={(e) => setFilters(prev => ({ ...prev, agency: Array.from(e.target.selectedOptions, o => o.value) }))}>
                      <option value="SpaceX">SpaceX</option>
                      <option value="ULA">ULA</option>
                      <option value="Arianespace">Arianespace</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={() => setFilters({ status: [], agency: [], mission: [], dateRange: { start: '', end: '' } })}
                    className="text-sm text-gray-400 hover:text-white">Clear All Filters</button>
                </div>
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-lighter/50 text-xs uppercase tracking-wider text-gray-400">
                <tr className="border-b border-gray-700/50">
                  {[['name', 'Rocket'], ['agency', 'Agency'], ['orbit', 'Orbit'], ['status', 'Status'], ['riskLevel', 'Risk']].map(([field, label]) => (
                    <th key={field} className="px-6 py-4 text-left font-normal">
                      <button onClick={() => handleSort(field)} className="hover:text-white transition-colors">{label}</button>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-left font-normal">Payload (LEO)</th>
                  <th className="px-6 py-4 text-left font-normal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredRockets.map((rocket, i) => (
                  <MotionTr key={rocket.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="hover:bg-dark-lighter/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <RocketLaunchIcon className="w-5 h-5 text-neon-blue" />
                        <div>
                          <div className="text-white font-medium">{rocket.name}</div>
                          <div className="text-sm text-gray-400">{rocket.reusable ? '♻ Reusable' : 'Expendable'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{rocket.agency}</td>
                    <td className="px-6 py-4 text-gray-300">{rocket.orbit}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(rocket.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rocket.status)}`}>
                          {rocket.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(rocket.riskLevel)}`}>
                        {rocket.riskLevel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {rocket.payloadCapacity.LEO ? `${rocket.payloadCapacity.LEO.toLocaleString()} kg` : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelectedRocket(rocket)} className="text-neon-blue hover:text-neon-purple transition-colors">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </MotionTr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedRocket && (
            <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedRocket(null)}>
              <MotionDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-normal text-white">{selectedRocket.name}</h3>
                  <button onClick={() => setSelectedRocket(null)} className="text-gray-400 hover:text-white text-xl">×</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-normal text-neon-blue">Basic Information</h4>
                    <div className="space-y-3 text-sm">
                      {[
                        ['Manufacturer', selectedRocket.agency],
                        ['Status', selectedRocket.status.toUpperCase()],
                        ['Reusable', selectedRocket.reusable ? 'Yes' : 'No'],
                        ['Risk Assessment', selectedRocket.riskLevel.toUpperCase()],
                        ['Target Orbit', selectedRocket.orbit],
                        ['Launch Sites', (selectedRocket.launchSites || []).join(', ') || 'N/A'],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-gray-400">{label}:</span>
                          <span className="text-white text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-lg font-normal text-neon-blue">Payload Capacity</h4>
                    <div className="space-y-3 text-sm">
                      {Object.entries(selectedRocket.payloadCapacity).map(([orbit, capacity]) => (
                        <div key={orbit} className="flex justify-between">
                          <span className="text-gray-400">{orbit}:</span>
                          <span className="text-white">{capacity?.toLocaleString()} kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex space-x-3">
                  <button className="neon-button flex-1 py-2">Plan Launch</button>
                  <button className="glass-button flex-1 py-2">View Trajectory</button>
                  <button className="glass-button flex-1 py-2">Generate Report</button>
                </div>
              </MotionDiv>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Rockets;