import React from 'react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as React.FC<any>;
const MotionH3 = motion.h3 as React.FC<any>;
const MotionP = motion.p as React.FC<any>;
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  trend, 
  isLoading = false,
  description 
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return {
          bg: 'from-neon-purple/10 to-neon-purple/5',
          border: 'border-neon-purple/20',
          icon: 'text-neon-purple',
          glow: 'shadow-neon-purple/5'
        };
      case 'red':
        return {
          bg: 'from-neon-red/10 to-neon-red/5',
          border: 'border-neon-red/20',
          icon: 'text-neon-red',
          glow: 'shadow-neon-red/5'
        };
      case 'yellow':
        return {
          bg: 'from-neon-orange/10 to-neon-orange/5',
          border: 'border-neon-orange/20',
          icon: 'text-neon-orange',
          glow: 'shadow-neon-orange/5'
        };
      case 'purple':
        return {
          bg: 'from-neon-purple/10 to-neon-purple/5',
          border: 'border-neon-purple/20',
          icon: 'text-neon-purple',
          glow: 'shadow-neon-purple/5'
        };
      default:
        return {
          bg: 'from-neon-blue/10 to-neon-blue/5',
          border: 'border-neon-blue/20',
          icon: 'text-neon-blue',
          glow: 'shadow-neon-blue/5'
        };
    }
  };

  const colors = getColorClasses();
  const isPositiveTrend = trend && trend.startsWith('+');
  const isNegativeTrend = trend && trend.startsWith('-');

  return (
    <MotionDiv
      whileHover={{ scale: 1.02, y: -2 }}
      className={`glass-card p-6 border ${colors.border} ${colors.glow} shadow-lg relative overflow-hidden group`}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border}`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>
          
          {trend && (
            <div className={`flex items-center space-x-1 text-sm ${
              isPositiveTrend ? 'text-neon-blue' : 
              isNegativeTrend ? 'text-neon-purple' : 
              'text-gray-400'
            }`}>
              {isPositiveTrend && <ArrowUpIcon className="w-4 h-4" />}
              {isNegativeTrend && <ArrowDownIcon className="w-4 h-4" />}
              <span className="font-medium">{trend}</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-2">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 bg-gray-600/30 rounded animate-pulse" />
              <div className="h-4 bg-gray-600/20 rounded animate-pulse w-3/4" />
            </div>
          ) : (
            <>
              <MotionH3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl font-normal text-white mb-1"
              >
                {value}
              </MotionH3>
              <MotionP
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-gray-300 text-sm font-medium"
              >
                {title}
              </MotionP>
            </>
          )}
        </div>

        {/* Description */}
        {description && !isLoading && (
          <MotionP
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-xs text-gray-400 mt-2"
          >
            {description}
          </MotionP>
        )}

        {/* Animated Progress Bar */}
        {!isLoading && (
          <MotionDiv
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1, delay: 0.5 }}
            className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${colors.bg} opacity-60`}
          />
        )}
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </MotionDiv>
  );
};

export default StatsCard;