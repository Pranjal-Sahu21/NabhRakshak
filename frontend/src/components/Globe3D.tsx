// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import CesiumGlobe from './CesiumGlobe';

const Globe3D = ({
  satellites = [],
  debris = [],
  onObjectSelect,
  className = "",
  showControls = true,
  showPerformanceMonitor = false,
  showLoadingOverlay = true,
  settings = {},
  containerHeight = "h-[400px]",
  isLoading = false,
  mode = "3d" // "3d" or "2d"
}) => {
  const [globeReady, setGlobeReady] = useState(false);
  const globeRef = useRef(null);

  // Default settings
  const defaultSettings = {
    enableAtmosphere: true,
    enableClouds: true,
    enableStars: true,
    enableGlow: true,
    quality: 'high',
    animationSpeed: 1,
    showOrbits: false,
    showHeatmap: false,
    showCollisionPaths: false,
    ...settings
  };

  useEffect(() => {
    // Simulate globe initialization
    const timer = setTimeout(() => {
      setGlobeReady(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Generate sample data if none provided
  const generateSampleData = () => {
    const sampleSatellites = [];
    const sampleDebris = [];

    // Generate 15 sample satellites
    for (let i = 0; i < 15; i++) {
      sampleSatellites.push({
        id: `sample-sat-${i}`,
        name: `Satellite ${i + 1}`,
        type: 'satellite',
        latitude: Math.random() * 180 - 90,
        longitude: Math.random() * 360 - 180,
        altitude: 400 + Math.random() * 800,
        velocity: 7.5 + Math.random() * 2,
        status: Math.random() > 0.1 ? 'active' : 'inactive'
      });
    }

    // Generate 25 sample debris
    for (let i = 0; i < 25; i++) {
      sampleDebris.push({
        id: `sample-debris-${i}`,
        name: `Debris ${i + 1}`,
        type: 'debris',
        latitude: Math.random() * 180 - 90,
        longitude: Math.random() * 360 - 180,
        altitude: 200 + Math.random() * 1200,
        velocity: 6 + Math.random() * 4,
        size: Math.random() * 5 + 0.5,
        riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
      });
    }

    return { sampleSatellites, sampleDebris };
  };

  const { sampleSatellites, sampleDebris } = useMemo(() => generateSampleData(), []); // memoized — only runs once
  const displaySatellites = satellites.length > 0 ? satellites : sampleSatellites;
  const displayDebris = debris.length > 0 ? debris : sampleDebris;

  if (mode === "2d") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`relative ${containerHeight} ${className}`}
      >
        <div className="glass-card p-4 h-full relative overflow-hidden">
          {/* 2D World Map Fallback */}
          <div className="w-full h-full bg-gradient-to-br from-dark-secondary to-dark-primary rounded-lg relative overflow-hidden">
            {/* Map Background */}
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 1000 500" className="w-full h-full">
                {/* Simplified world continents */}
                <path d="M150,200 Q200,180 250,200 L300,220 Q350,200 400,210 L450,200 Q500,190 550,200 L600,210 Q650,200 700,205 L750,200 Q800,195 850,200"
                  stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" fill="none" />
                <path d="M100,250 Q150,230 200,250 L250,270 Q300,250 350,260 L400,250 Q450,240 500,250 L550,260 Q600,250 650,255 L700,250 Q750,245 800,250"
                  stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" fill="none" />
                <path d="M200,300 Q250,280 300,300 L350,320 Q400,300 450,310 L500,300 Q550,290 600,300 L650,310 Q700,300 750,305"
                  stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" fill="none" />
              </svg>
            </div>

            {/* Grid Lines */}
            <div className="absolute inset-0">
              <svg viewBox="0 0 1000 500" className="w-full h-full">
                {/* Latitude lines */}
                {[100, 150, 200, 250, 300, 350, 400].map(y => (
                  <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
                ))}
                {/* Longitude lines */}
                {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(x => (
                  <line key={x} x1={x} y1="0" x2={x} y2="500" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
                ))}
              </svg>
            </div>

            {/* Object Markers */}
            <div className="absolute inset-0">
              {/* Satellite markers */}
              {displaySatellites.slice(0, 30).map((sat, index) => (
                <motion.div
                  key={sat.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="absolute w-2 h-2 bg-blue-400 rounded-full cursor-pointer hover:scale-150 transition-transform"
                  style={{
                    left: `${((sat.longitude + 180) / 360) * 100}%`,
                    top: `${((90 - sat.latitude) / 180) * 100}%`,
                  }}
                  onClick={() => onObjectSelect && onObjectSelect(sat)}
                  title={`${sat.name} - ${sat.status}`}
                />
              ))}

              {/* Debris markers */}
              {displayDebris.slice(0, 40).map((debris, index) => (
                <motion.div
                  key={debris.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                  className="absolute w-1.5 h-1.5 bg-red-400 rounded-full cursor-pointer hover:scale-150 transition-transform"
                  style={{
                    left: `${((debris.longitude + 180) / 360) * 100}%`,
                    top: `${((90 - debris.latitude) / 180) * 100}%`,
                  }}
                  onClick={() => onObjectSelect && onObjectSelect(debris)}
                  title={`${debris.name} - Risk: ${debris.riskLevel}`}
                />
              ))}
            </div>

            {/* Info Panel */}
            <div className="absolute bottom-4 left-4 glass-card p-3">
              <div className="text-xs space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-300">Satellites: {displaySatellites.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-gray-300">Debris: {displayDebris.length}</span>
                </div>
              </div>
            </div>

            {/* Mode Indicator */}
            <div className="absolute top-4 right-4 glass-card p-2">
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <GlobeAltIcon className="w-4 h-4 text-neon-blue" />
                <span>2D Map View</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className={`relative ${containerHeight} ${className}`}
    >
      <div className="glass-card p-2 h-full relative overflow-hidden">
        {/* Loading Overlay */}
        <AnimatePresence>
          {(isLoading || !globeReady) && showLoadingOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-dark-primary/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-normal text-white mb-2">Initializing 3D Globe</h3>
                <p className="text-gray-400">Loading space objects and rendering engine...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Performance Monitor */}
        {showPerformanceMonitor && (
          <div className="absolute top-4 right-4 glass-card p-3 z-40">
            <div className="text-xs space-y-1">
              <div className="flex items-center justify-between space-x-3">
                <span className="text-gray-400">Objects:</span>
                <span className="text-neon-blue font-mono">{displaySatellites.length + displayDebris.length}</span>
              </div>
              <div className="flex items-center justify-between space-x-3">
                <span className="text-gray-400">Satellites:</span>
                <span className="text-green-400 font-mono">{displaySatellites.length}</span>
              </div>
              <div className="flex items-center justify-between space-x-3">
                <span className="text-gray-400">Debris:</span>
                <span className="text-red-400 font-mono">{displayDebris.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Globe Component */}
        <div className="w-full h-full">
          <CesiumGlobe
            satellites={displaySatellites}
            debris={displayDebris}
            onObjectSelect={onObjectSelect}
          />
        </div>

        {/* Globe Status Indicator */}
        <div className="absolute bottom-4 left-4 glass-card p-3 z-40">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <GlobeAltIcon className="w-4 h-4 text-neon-blue" />
            <span>Hyperrealistic 3D Globe</span>
            <div className={`w-2 h-2 rounded-full animate-pulse ${globeReady ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Globe3D;