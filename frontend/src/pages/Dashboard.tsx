import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as React.FC<any>;
import {
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Components
import ObjectList from '../components/Dashboard/ObjectList';
import FilterPanel from '../components/Dashboard/FilterPanel';

// Real API
import { getAlerts } from '../services/api';

import { isroSatellites } from '../data/isroSatellites';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh] = useState(true);


  const [objects, setObjects] = useState(isroSatellites);
  const [filteredObjects, setFilteredObjects] = useState(isroSatellites);
  const [filters, setFilters] = useState({
    type: [],
    altitude: { min: 0, max: 50000 },
    risk: [],
    status: [],
    operator: ''
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Map ISRO satellites to the ObjectList format
      const mappedSats = isroSatellites.map(sat => ({
        id: sat.id,
        name: sat.name,
        type: 'satellite',
        altitude: Math.round(sat.altitude || 0),
        inclination: sat.inclination || 0,
        status: sat.status || 'active',
        risk: sat.risk || 'low',
        operator: sat.operator || 'ISRO',
        launchDate: 'ISRO',
        position: { lat: sat.latitude || 0, lng: sat.longitude || 0 },
        velocity: sat.velocity || 7.5,
        mission: sat.mission || '',
        orbit: sat.orbit || 'LEO'
      }));

      // Generate matching 350 debris objects to display in the main inventory table
      const mappedDebris = [];
      for (let i = 0; i < 350; i++) {
        const rand = Math.random();
        let alt, inc, orbit = 'LEO';

        if (rand < 0.6) {
          alt = 500 + Math.random() * 300;
          inc = 97.5 + (Math.random() - 0.5) * 5;
        } else if (rand < 0.8) {
          alt = 600 + Math.random() * 400;
          inc = 85.0 + Math.random() * 10.0;
        } else {
          alt = 35780 + Math.random() * 10;
          inc = (Math.random() - 0.5) * 3;
          orbit = 'GEO';
        }

        mappedDebris.push({
          id: `debris-${i}`,
          name: `Space Debris ${i + 1}`,
          type: 'debris',
          altitude: Math.round(alt),
          inclination: inc,
          status: 'decomposed',
          risk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          operator: 'Debris',
          launchDate: 'N/A',
          position: { lat: (Math.random() - 0.5) * 160, lng: Math.random() * 360 - 180 },
          velocity: orbit === 'LEO' ? 7.4 : 3.07,
          mission: 'Inactive space fragmentation debris',
          orbit: orbit
        });
      }

      const combined = [...mappedSats, ...mappedDebris];
      setObjects(combined);
      setFilteredObjects(combined);


    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter objects based on current filters
  useEffect(() => {
    let filtered = objects;

    if (searchQuery) {
      filtered = filtered.filter(obj =>
        obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(obj.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (obj.operator || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(obj => filters.type.includes(obj.type));
    }

    if (filters.altitude) {
      filtered = filtered.filter(obj =>
        obj.altitude >= (filters.altitude.min || 0) && obj.altitude <= (filters.altitude.max || 50000)
      );
    }

    if (filters.risk && filters.risk.length > 0) {
      filtered = filtered.filter(obj => filters.risk.includes(obj.risk));
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(obj => filters.status.includes(obj.status));
    }

    if (filters.operator) {
      filtered = filtered.filter(obj =>
        (obj.operator || '').toLowerCase().includes(filters.operator.toLowerCase())
      );
    }

    setFilteredObjects(filtered);
  }, [objects, searchQuery, filters]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <MotionDiv
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 text-white"
    >

      {/* Main Content Area: Search & Filter & Object List Table */}
      <div className="grid grid-cols-1 gap-6">
        <MotionDiv variants={itemVariants} className="space-y-6">
          <div className="bg-black/80 border border-[#003D72]/30 rounded-xl p-4 shadow-md backdrop-blur-md">
            <div className="space-y-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search objects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black text-white border border-[#003D72]/40 rounded-lg focus:border-[#80BCFF] focus:outline-none transition-colors"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-sm text-neon-blue hover:text-neon-purple transition-colors font-medium"
              >
                <FunnelIcon className="w-4 h-4" />
                <span>Advanced Filters</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFilterChange}
              isOpen={true}
              onToggle={() => setShowFilters(false)}
            />
          )}

          <div className="bg-black/80 border border-[#003D72]/30 rounded-xl p-4 shadow-md backdrop-blur-md">
            <ObjectList
              objects={filteredObjects}
              isLoading={isLoading}
              searchQuery={searchQuery}
            />
          </div>
        </MotionDiv>
      </div>
    </MotionDiv>
  );
};

export default Dashboard;