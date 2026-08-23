import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as React.FC<any>;
import {
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { ScrollContainer } from '../Common/ScrollContainer';
const ObjectList = ({ objects, isLoading, searchQuery }) => {
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedObject, setSelectedObject] = useState(null);

  // Sort and filter objects
  const sortedObjects = useMemo(() => {
    if (!objects) return [];

    let filtered = [...objects];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(obj =>
        (obj.name ? String(obj.name) : '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (obj.id ? String(obj.id) : '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (obj.operator ? String(obj.operator) : '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy] !== undefined && a[sortBy] !== null ? a[sortBy] : '';
      let bValue = b[sortBy] !== undefined && b[sortBy] !== null ? b[sortBy] : '';

      // Handle different data types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [objects, searchQuery, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getRiskColor = (risk) => {
    const r = (risk || 'low').toLowerCase();
    switch (r) {
      case 'critical':
      case 'high':
        return 'text-red-400 bg-red-500/20 border border-red-500/30';
      case 'moderate':
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30';
      case 'low':
        return 'text-green-400 bg-green-500/20 border border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border border-gray-500/30';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'satellite':
        return <CheckCircleIcon className="w-4 h-4 text-neon-blue" />;
      case 'debris':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />;
      case 'rocket':
        return <ArrowTopRightOnSquareIcon className="w-4 h-4 text-yellow-400" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    return (status || '').toLowerCase() === 'active' ? 'text-neon-green' : 'text-gray-400';
  };

  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left hover:text-neon-blue transition-colors"
    >
      <span>{children}</span>
      {sortBy === field && (
        sortOrder === 'asc' ? 
        <ChevronUpIcon className="w-4 h-4" /> : 
        <ChevronDownIcon className="w-4 h-4" />
      )}
    </button>
  );

  if (isLoading) {
    return (
      <div className="glass-card p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-600/30 rounded w-32 animate-pulse" />
            <div className="h-4 bg-gray-600/20 rounded w-16 animate-pulse" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-600/30 rounded animate-pulse" />
              <div className="h-3 bg-gray-600/20 rounded w-3/4 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-normal text-white">Tracked Objects</h3>
          <span className="text-sm text-gray-400">
            {sortedObjects.length} objects
          </span>
        </div>
      </div>

      {/* Table Header */}
      <div className="p-4 border-b border-gray-700 hidden md:block">
        <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-400">
          <SortButton field="name">Name</SortButton>
          <SortButton field="type">Type</SortButton>
          <SortButton field="altitude">Altitude</SortButton>
          <SortButton field="risk">Risk</SortButton>
          <SortButton field="status">Status</SortButton>
        </div>
      </div>

      {/* Object List */}
      <ScrollContainer keyDependency={searchQuery} maxClass="max-h-96" shadowColor="from-black">
        <AnimatePresence>
          {sortedObjects.length === 0 ? (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center"
            >
              <EyeIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No objects found</p>
              {searchQuery && (
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your search criteria
                </p>
              )}
            </MotionDiv>
          ) : (
            sortedObjects.map((object, index) => (
              <MotionDiv
                key={object.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border-b border-gray-700 last:border-b-0 hover:bg-dark-lighter/30 transition-colors cursor-pointer"
                onClick={() => setSelectedObject(object)}
              >
                {/* Desktop View */}
                <div className="hidden md:grid grid-cols-5 gap-4 p-4 items-center">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(object.type)}
                    <div>
                      <p className="text-white font-medium text-sm">{object.name}</p>
                      <p className="text-xs text-gray-400">{object.id}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="capitalize text-gray-300 text-sm">
                      {object.type}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-white text-sm">{object.altitude} km</span>
                  </div>
                  
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(object.risk)}`}>
                      {(object.risk || 'low').toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <span className={`text-sm font-medium ${getStatusColor(object.status)}`}>
                      {(object.status || 'active').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Mobile View */}
                <div className="md:hidden p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(object.type)}
                      <div>
                        <p className="text-white font-medium text-sm">{object.name}</p>
                        <p className="text-xs text-gray-400">{object.id}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(object.risk)}`}>
                      {(object.risk || 'low').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Type: </span>
                      <span className="text-gray-300 capitalize">{object.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Altitude: </span>
                      <span className="text-white">{object.altitude} km</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Status: </span>
                      <span className={`font-medium ${getStatusColor(object.status)}`}>
                        {(object.status || 'active').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Operator: </span>
                      <span className="text-gray-300">{object.operator}</span>
                    </div>
                  </div>
                </div>
              </MotionDiv>
            ))
          )}
        </AnimatePresence>
      </ScrollContainer>

      {/* Object Detail Modal */}
      <AnimatePresence>
        {selectedObject && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedObject(null)}
          >
            <MotionDiv
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-5 sm:p-7 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-normal text-white">{selectedObject.name}</h3>
                <button
                  onClick={() => setSelectedObject(null)}
                  className="text-gray-400 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Object ID:</span>
                  <span className="text-white font-mono">{selectedObject.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white capitalize">{selectedObject.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Altitude:</span>
                  <span className="text-white">{selectedObject.altitude} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Inclination:</span>
                  <span className="text-white">{selectedObject.inclination}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Velocity:</span>
                  <span className="text-white">{selectedObject.velocity} km/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Level:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(selectedObject.risk)}`}>
                    {selectedObject.risk.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-medium ${getStatusColor(selectedObject.status)}`}>
                    {selectedObject.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Operator:</span>
                  <span className="text-white">{selectedObject.operator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Launch Date:</span>
                  <span className="text-white">
                    {selectedObject.launchDate && !isNaN(Date.parse(selectedObject.launchDate))
                      ? new Date(selectedObject.launchDate).toLocaleDateString()
                      : selectedObject.launchDate || 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button className="neon-button sm:flex-1 py-2">
                  Track Object
                </button>
                <button className="glass-button sm:flex-1 py-2">
                  View Orbit
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ObjectList;