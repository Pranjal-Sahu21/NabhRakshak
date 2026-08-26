import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Galaxy from './Galaxy';

const MotionDiv = motion.div as React.FC<any>;
const MotionP = motion.p as React.FC<any>;
const MotionG = motion.g as React.FC<any>;

interface LoadingScreenProps {
  onComplete: () => void;
  onSweepStart?: () => void;
}

const LoadingScreen = ({ onComplete, onSweepStart }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [earthLoaded, setEarthLoaded] = useState(false);

  const steps = [
    'Connecting to satellite network...',
    'Loading orbital telemetry data...',
    'Initializing tracking filters...',
    'Preparing mission dashboard...'
  ];

  const satelliteRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!earthLoaded) return;
    let animId: number;
    const startTime = Date.now();
    const period = 4000; // 4 seconds for one full orbit

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const angle = (elapsed / period) * 2 * Math.PI;

      // Clockwise ellipse path coordinates
      const x = 60 * Math.sin(angle);
      const y = -24 * Math.cos(angle);
      // y < 0 is the top half (behind Earth), y >= 0 is the bottom half (in front of Earth)
      const zIndex = y < 0 ? '5' : '20';

      if (satelliteRef.current) {
        satelliteRef.current.style.transform = `translate(${x}px, ${y}px)`;
        satelliteRef.current.style.zIndex = zIndex;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [earthLoaded]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setLoadingComplete(true);
          }, 250); // slight pause before sweep
          return 100;
        }
        const next = prev + (1.2 + Math.random() * 1.0);
        return next > 100 ? 100 : next;
      });
    }, 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress < 25) setStatusIndex(0);
    else if (progress < 55) setStatusIndex(1);
    else if (progress < 85) setStatusIndex(2);
    else setStatusIndex(3);
  }, [progress]);

  useEffect(() => {
    if (loadingComplete && onSweepStart) {
      onSweepStart();
    }
  }, [loadingComplete, onSweepStart]);

  const orbitVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  const floatVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <>
      <MotionDiv
        initial={{ clipPath: 'inset(0 0 0 0)' }}
        animate={loadingComplete ? { clipPath: 'inset(0 0 0 150%)' } : {}}
        transition={{ duration: 3.0, ease: [0.76, 0, 0.24, 1] }}
        onAnimationComplete={() => {
          if (loadingComplete) {
            onComplete();
          }
        }}
        className="fixed inset-0 bg-[#08080a] flex items-center justify-center z-[999] overflow-hidden"
      >
        {/* Galaxy WebGL Background */}
        <Galaxy
          glowIntensity={0.08}
          density={1.2}
          mouseInteraction={false}
          speed={0.25}
          rotationSpeed={0.02}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
        />

        {/* Main Loading Content */}
        <MotionDiv
          animate={loadingComplete ? { filter: 'blur(15px)', opacity: 0, scale: 0.95 } : { filter: 'blur(0px)', opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
          className="absolute inset-0 flex flex-col items-center justify-between pt-48 pb-20"
        >
          {/* Logo and Orbits (Center Group) */}
          <div className="flex flex-col items-center">
            {/* Orbital System */}
            <div className="relative w-32 h-32 mb-8">
              {/* Central Earth */}
              <div className="absolute inset-0 w-20 h-20 m-auto rounded-full overflow-hidden border border-blue-500/30 bg-[#080f1e] shadow-[0_0_20px_rgba(59,130,246,0.4)] z-10">
                <MotionDiv
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="w-full h-full"
                >
                  <img
                    src="/assets/earth-blue-marble.jpg"
                    alt="Earth"
                    className="w-full h-full object-cover scale-[1.15]"
                    onLoad={() => setEarthLoaded(true)}
                  />
                </MotionDiv>
              </div>

              {/* Ellipse Ring (Direct sibling, visible only after Earth loads) */}
              {earthLoaded && (
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 m-auto border border-white/15 rounded-full w-[120px] h-[48px] pointer-events-none z-0"
                />
              )}

              {/* Revolving Satellite (Direct sibling sharing stacking context with Earth, visible only after Earth loads) */}
              {earthLoaded && (
                <MotionDiv
                  ref={satelliteRef}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 m-auto w-8 h-8 flex items-center justify-center pointer-events-none"
                >
                  <img
                    src="/assets/satellite.png"
                    alt="Revolving Satellite"
                    className="w-8 h-8 object-contain transform rotate-[25deg] drop-shadow-[0_0_8px_rgba(0,210,255,0.6)]"
                  />
                </MotionDiv>
              )}
            </div>

            {/* Logo and Text */}
            <div className="flex items-center justify-center space-x-3 text-center">
              <img
                src="/assets/nabhrakshak-logo.svg"
                alt="NabhRakshak Logo"
                className="w-12 h-12 object-contain"
              />
              <div className="text-left">
                <h1 className="text-3xl font-normal text-white">NabhRakshak</h1>
                <p className="text-sm text-gray-400">Space Debris Monitoring</p>
              </div>
            </div>
          </div>

          {/* Loader Bar & Changing Text (Bottom Group) */}
          <div className="flex flex-col items-center">
            {/* Animated Loading Status */}
            <div className="h-6 mb-3">
              <AnimatePresence mode="wait">
                <MotionP
                  key={statusIndex}
                  className="text-gray-400 text-xs font-mono tracking-widest uppercase"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {steps[statusIndex]}
                </MotionP>
              </AnimatePresence>
            </div>

            {/* Progress Bar */}
            <div className="w-64 h-1 bg-dark-lighter rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neon-blue to-neon-purple transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

        </MotionDiv>

      </MotionDiv>

      {/* Sweeping Satellite Overlay */}
      {loadingComplete && (
        <MotionDiv
          initial={{ left: '0%', opacity: 0 }}
          animate={{
            left: '150%',
            opacity: [0, 1, 1, 1]
          }}
          style={{ x: '-50%', y: '-50%', top: '50%' }}
          transition={{
            left: { duration: 3.0, ease: [0.76, 0, 0.24, 1] },
            opacity: { times: [0, 0.1, 0.9, 1], duration: 3.0, ease: 'linear' }
          }}
          className="fixed z-[1000] pointer-events-none"
        >
          {/* Real Satellite Image */}
          <img
            src="/assets/satellite.png"
            alt="Satellite"
            className="w-36 h-36 object-contain transform rotate-[25deg] drop-shadow-[0_0_25px_rgba(0,210,255,0.5)]"
          />
        </MotionDiv>
      )}
    </>
  );
};

export default LoadingScreen;
