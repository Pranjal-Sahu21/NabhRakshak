import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MotionAside = motion.aside as React.FC<any>;
const MotionDiv = motion.div as React.FC<any>;
import {
  HomeIcon,
  RocketLaunchIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  CubeIcon,
  SunIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  RocketLaunchIcon as RocketLaunchIconSolid,
  GlobeAltIcon as GlobeAltIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  BeakerIcon as BeakerIconSolid,
  DocumentChartBarIcon as DocumentChartBarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  CubeIcon as CubeIconSolid,
  SunIcon as SunIconSolid
} from '@heroicons/react/24/solid';

interface SidebarProps { sidebarOpen: boolean; setSidebarOpen: (v: boolean) => void; }
const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      description: 'Overview & Statistics'
    },
    {
      name: '3D Visualization',
      href: '/3d-visualization',
      icon: CubeIcon,
      iconSolid: CubeIconSolid,
      description: 'Interactive Globe View'
    },
    {
      name: 'Rockets',
      href: '/rockets',
      icon: RocketLaunchIcon,
      iconSolid: RocketLaunchIconSolid,
      description: 'Launch Vehicles'
    },
    {
      name: 'Satellites',
      href: '/satellites',
      icon: GlobeAltIcon,
      iconSolid: GlobeAltIconSolid,
      description: 'Active Satellites'
    },
    {
      name: 'Alerts',
      href: '/alerts',
      icon: ExclamationTriangleIcon,
      iconSolid: ExclamationTriangleIconSolid,
      description: 'Collision Warnings'
    },
    {
      name: 'Simulation',
      href: '/simulation',
      icon: BeakerIcon,
      iconSolid: BeakerIconSolid,
      description: 'Mission Planning'
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: DocumentChartBarIcon,
      iconSolid: DocumentChartBarIconSolid,
      description: 'Analytics & Export'
    },
    {
      name: 'Space Weather',
      href: '/space-weather',
      icon: SunIcon,
      iconSolid: SunIconSolid,
      description: 'Space Weather'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Cog6ToothIcon,
      iconSolid: Cog6ToothIconSolid,
      description: 'Configuration'
    }
  ];

  const sidebarVariants = {
    open: {
      width: '280px',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      width: '80px',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  const itemVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      opacity: 0,
      x: -20,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <MotionAside
      variants={sidebarVariants}
      animate={sidebarOpen ? 'open' : 'closed'}
      className="bg-dark-card/80 backdrop-blur-xl border-r border-neon-blue/20 flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-neon-blue/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
            <span className="text-white font-normal text-lg">N</span>
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <MotionDiv
                variants={itemVariants}
                initial="closed"
                animate="open"
                exit="closed"
              >
                <h2 className="text-xl font-normal text-white">NabhRakshak</h2>
                <p className="text-xs text-gray-400">Mission Control</p>
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = isActive ? item.iconSolid : item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group relative flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 text-white border border-neon-blue/30'
                    : 'text-gray-400 hover:text-white hover:bg-dark-lighter/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator */}
                  {isActive && (
                    <MotionDiv
                      layoutId="activeTab"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-neon-blue to-neon-purple rounded-r-full"
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30
                      }}
                    />
                  )}

                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <Icon className={`w-6 h-6 ${isActive ? 'text-neon-blue' : ''}`} />
                  </div>

                  {/* Text content */}
                  <AnimatePresence>
                    {sidebarOpen && (
                      <MotionDiv
                        variants={itemVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className="ml-3 flex-1 min-w-0"
                      >
                        <p className="text-sm font-medium truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {item.description}
                        </p>
                      </MotionDiv>
                    )}
                  </AnimatePresence>

                  {/* Tooltip for collapsed state */}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-dark-card border border-neon-blue/20 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.description}</p>
                    </div>
                  )}

                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon-blue/0 to-neon-purple/0 group-hover:from-neon-blue/5 group-hover:to-neon-purple/5 transition-all duration-200" />
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neon-blue/20">
        <AnimatePresence>
          {sidebarOpen ? (
            <MotionDiv
              variants={itemVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="text-center"
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                <span className="text-xs text-gray-400">System Online</span>
              </div>
              <p className="text-xs text-gray-500">
                v2.1.0 • {new Date().getFullYear()}
              </p>
            </MotionDiv>
          ) : (
            <MotionDiv
              variants={itemVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="flex justify-center"
            >
              <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse" />
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </MotionAside>
  );
};

export default Sidebar;
