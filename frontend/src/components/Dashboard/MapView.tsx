import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as React.FC<any>;
import {
  GlobeAltIcon,
  CubeIcon,
  MapIcon,
  EyeIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

import CesiumGlobe from '../CesiumGlobe';
import { isroSatellites } from '../../data/isroSatellites';

const MapView = ({ mode, objects, isLoading }) => {
  const containerRef = useRef(null);

  const [selectedObject, setSelectedObject] = useState(null);
  const [mapLayers, setMapLayers] = useState({
    satellites: true,
    debris: true,
    rockets: true,
    orbits: false,
    heatmap: false
  });

  // Generate ISRO satellite fleet data (54 active payloads)
  const generateSampleObjects = () => {
    const formattedSatellites = isroSatellites.map(sat => ({
      ...sat,
      latitude: sat.latitude || (sat.orbit === 'GEO' ? 0 : (Math.random() - 0.5) * 120),
      longitude: sat.longitude || (sat.orbit === 'GEO' ? 70 + Math.random() * 20 : (Math.random() - 0.5) * 360),
    }));

    const sampleObjects = [...formattedSatellites];

    for (let i = 0; i < 15; i++) {
      sampleObjects.push({
        id: `debris-${i}`,
        name: `Space Debris Fragment ${i + 1}`,
        type: 'debris',
        latitude: (Math.random() - 0.5) * 180,
        longitude: (Math.random() - 0.5) * 360,
        altitude: 200 + Math.random() * 1500,
        velocity: 6 + Math.random() * 4,
        riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        source: ['PSLV Upper Stage', 'Satellite Fragment', 'Mission Related'][Math.floor(Math.random() * 3)],
        trackingConfidence: 60 + Math.random() * 40
      } as any);
    }

    return sampleObjects;
  };

  // Use provided objects or generate sample data
  const displayObjects = objects && objects.length > 0 ? objects : generateSampleObjects();

  // Performance monitoring with enhanced metrics
  const [performanceStats, setPerformanceStats] = useState({
    fps: 0,
    memory: 0,
    triangles: 0,
    drawCalls: 0,
    lodLevel: 'high'
  });


























  // Toggle layer visibility
  const toggleLayer = (layerName) => {
    setMapLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  const getObjectCount = (type) => {
    if (!objects || !Array.isArray(objects)) return 0;
    return objects.filter(obj => obj.type === type).length;
  };

  // Error boundary component


  return (
    <div className="relative h-full rounded-lg overflow-hidden">
      {/* 3D/2D Container */}
      {mode === '3d' ? (
        <MotionDiv
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full"
        >
          <CesiumGlobe
            satellites={displayObjects.filter(obj => obj.type === 'satellite')}
            debris={displayObjects.filter(obj => obj.type === 'debris')}
            onObjectSelect={setSelectedObject}
          />
        </MotionDiv>
      ) : (
        <MotionDiv
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          ref={containerRef}
          className="w-full h-full bg-gradient-to-br from-dark-primary via-dark-secondary to-dark-primary relative overflow-hidden"
        >
          {/* 2D World Map with Object Visualization */}
          <div className="w-full h-full relative">
            {/* World Map Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-dark-primary to-purple-900/20">
              {/* Continents Outline */}
              <svg className="w-full h-full opacity-30" viewBox="0 0 1000 500">
                {/* Simplified world map paths */}
                <path
                  d="M150,200 Q200,180 250,200 Q300,220 350,200 Q400,180 450,200 L500,220 Q550,200 600,220 Q650,240 700,220 Q750,200 800,220 L850,200"
                  stroke="rgba(59, 130, 246, 0.5)"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M100,250 Q150,230 200,250 Q250,270 300,250 Q350,230 400,250 L450,270 Q500,250 550,270 Q600,290 650,270 Q700,250 750,270 L800,250"
                  stroke="rgba(59, 130, 246, 0.5)"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M200,300 Q250,280 300,300 Q350,320 400,300 Q450,280 500,300 L550,320 Q600,300 650,320 Q700,340 750,320"
                  stroke="rgba(59, 130, 246, 0.5)"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>

              {/* Grid Lines */}
              <div className="absolute inset-0">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={`h-${i}`}
                    className="absolute w-full border-t border-neon-blue/10"
                    style={{ top: `${i * 10}%` }}
                  />
                ))}
                {[...Array(20)].map((_, i) => (
                  <div
                    key={`v-${i}`}
                    className="absolute h-full border-l border-neon-blue/10"
                    style={{ left: `${i * 5}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Object Markers */}
            <div className="absolute inset-0">
              {displayObjects.slice(0, 50).map((obj, index) => {
                const x = (obj.longitude + 180) / 360 * 100;
                const y = (90 - obj.latitude) / 180 * 100;

                return (
                  <MotionDiv
                    key={obj.id || index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02, duration: 0.3 }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onClick={() => setSelectedObject(obj)}
                  >
                    <div className={`w-2 h-2 rounded-full ${obj.type === 'satellite' ? 'bg-neon-blue' : 'bg-red-400'
                      } shadow-lg group-hover:scale-150 transition-transform duration-200`}>
                      <div className={`absolute inset-0 rounded-full animate-ping ${obj.type === 'satellite' ? 'bg-neon-blue' : 'bg-red-400'
                        } opacity-75`} />
                    </div>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-dark-lighter/90 backdrop-blur-sm text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      {obj.name || `${obj.type} ${index + 1}`}
                    </div>
                  </MotionDiv>
                );
              })}
            </div>

            {/* 2D Mode Info */}
            <div className="absolute top-4 left-4 glass-card p-4 max-w-xs">
              <div className="flex items-center space-x-2 mb-2">
                <MapIcon className="w-5 h-5 text-neon-blue" />
                <h3 className="text-sm font-normal text-white">2D Map View</h3>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Flat projection showing object positions. Switch to 3D for interactive globe.
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-neon-blue rounded-full"></div>
                  <span className="text-gray-300">Satellites ({displayObjects.filter(obj => obj.type === 'satellite').length})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-gray-300">Debris ({displayObjects.filter(obj => obj.type === 'debris').length})</span>
                </div>
              </div>
            </div>

            {/* Performance Note */}
            <div className="absolute bottom-4 right-4 glass-card p-3">
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <CubeIcon className="w-4 h-4 text-neon-purple" />
                <span>Switch to 3D for full interactive experience</span>
              </div>
            </div>
          </div>
        </MotionDiv>
      )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-dark-primary/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white">Loading orbital data...</p>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Map Controls */}
      {!isLoading && mode === '3d' && (
        <div className="absolute top-4 left-4 space-y-2">
          {/* Layer Controls */}
          <div className="glass-card p-3 space-y-2">
            <h4 className="text-sm font-medium text-white mb-2">Layers</h4>

            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={mapLayers.satellites}
                onChange={() => toggleLayer('satellites')}
                className="rounded border-gray-600 bg-dark-lighter text-neon-blue focus:ring-neon-blue"
              />
              <span className="text-gray-300">Satellites ({getObjectCount('satellite')})</span>
            </label>

            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={mapLayers.debris}
                onChange={() => toggleLayer('debris')}
                className="rounded border-gray-600 bg-dark-lighter text-neon-blue focus:ring-neon-blue"
              />
              <span className="text-gray-300">Debris ({getObjectCount('debris')})</span>
            </label>

            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={mapLayers.rockets}
                onChange={() => toggleLayer('rockets')}
                className="rounded border-gray-600 bg-dark-lighter text-neon-blue focus:ring-neon-blue"
              />
              <span className="text-gray-300">Rockets ({getObjectCount('rocket')})</span>
            </label>

            <hr className="border-gray-600" />

            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={mapLayers.orbits}
                onChange={() => toggleLayer('orbits')}
                className="rounded border-gray-600 bg-dark-lighter text-neon-blue focus:ring-neon-blue"
              />
              <span className="text-gray-300">Orbit Paths</span>
            </label>

            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={mapLayers.heatmap}
                onChange={() => toggleLayer('heatmap')}
                className="rounded border-gray-600 bg-dark-lighter text-neon-blue focus:ring-neon-blue"
              />
              <span className="text-gray-300">Density Heatmap</span>
            </label>
          </div>


        </div>
      )}

      {/* Legend */}
      {!isLoading && mode === '3d' && (
        <div className="absolute bottom-4 left-4">
          <div className="glass-card p-3">
            <h4 className="text-sm font-medium text-white mb-2">Legend</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                <span className="text-gray-300">Satellites</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-gray-300">Debris</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-gray-300">Rockets</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Object Info Panel */}
      <AnimatePresence>
        {selectedObject && (
          <MotionDiv
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-4 right-4 w-80 glass-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-normal text-white">{selectedObject.name}</h3>
              <button
                onClick={() => setSelectedObject(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="text-white capitalize">{selectedObject.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Altitude:</span>
                <span className="text-white">{selectedObject.altitude} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Risk Level:</span>
                <span className={`px-2 py-1 rounded text-xs ${selectedObject.risk === 'critical' ? 'bg-red-500/20 text-red-400' :
                  selectedObject.risk === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    selectedObject.risk === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                  }`}>
                  {selectedObject.risk?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Operator:</span>
                <span className="text-white">{selectedObject.operator || 'Unknown'}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-600">
              <button className="neon-button w-full py-2 text-sm">
                View Details
              </button>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapView;