import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as React.FC<any>;
import {
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const FilterPanel = ({ filters, onFiltersChange, isOpen, onToggle }) => {
  const [expandedSections, setExpandedSections] = useState({
    type: true,
    risk: true,
    altitude: true,
    status: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (category, value, checked) => {
    const currentValues = filters[category] || [];
    let newValues;
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(v => v !== value);
    }
    onFiltersChange({ ...filters, [category]: newValues });
  };

  const handleRangeChange = (category, field, value) => {
    onFiltersChange({
      ...filters,
      [category]: { ...filters[category], [field]: value }
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      type: [],
      risk: [],
      status: [],
      altitude: { min: 0, max: 50000 },
      operator: ''
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.type?.length > 0) count += filters.type.length;
    if (filters.risk?.length > 0) count += filters.risk.length;
    if (filters.status?.length > 0) count += filters.status.length;
    if (filters.operator?.length > 0) count += 1;
    if (filters.altitude?.min > 0 || filters.altitude?.max < 50000) count += 1;
    return count;
  };

  const SectionHeader = ({ title, section }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/5 transition-colors rounded"
    >
      <span className="text-sm font-normal text-gray-200 uppercase tracking-wider">{title}</span>
      {expandedSections[section]
        ? <ChevronUpIcon className="w-3.5 h-3.5 text-gray-500" />
        : <ChevronDownIcon className="w-3.5 h-3.5 text-gray-500" />}
    </button>
  );

  const CheckboxFilter = ({ options, category }) => (
    <div className="space-y-1.5 mt-1">
      {options.map(option => (
        <label key={option.value} className="flex items-center gap-2.5 cursor-pointer group px-1">
          <input
            type="checkbox"
            checked={filters[category]?.includes(option.value) || false}
            onChange={(e) => handleFilterChange(category, option.value, e.target.checked)}
            className="w-3.5 h-3.5 rounded border-gray-600 bg-black/60 text-blue-500 focus:ring-1 focus:ring-blue-500 accent-blue-500"
          />
          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{option.label}</span>
          {option.count !== undefined && (
            <span className="text-xs text-gray-600 ml-auto">{option.count}</span>
          )}
        </label>
      ))}
    </div>
  );

  const typeOptions = [
    { value: 'satellite', label: 'Satellites', count: 54 },
    { value: 'debris', label: 'Debris', count: 350 },
  ];

  const riskOptions = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'decomposed', label: 'Decomposed' }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <MotionDiv
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <AdjustmentsHorizontalIcon className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-normal text-white">Advanced Filters</span>
            {getActiveFilterCount() > 0 && (
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-normal">
                {getActiveFilterCount()} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getActiveFilterCount() > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onToggle}
              className="text-gray-500 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-px bg-[#1a1a1a]">
          {/* Object Type */}
          <div className="bg-[#0d0d0d] p-3">
            <SectionHeader title="Object Type" section="type" />
            <AnimatePresence>
              {expandedSections.type && (
                <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <CheckboxFilter options={typeOptions} category="type" />
                </MotionDiv>
              )}
            </AnimatePresence>
          </div>

          {/* Risk Level */}
          <div className="bg-[#0d0d0d] p-3">
            <SectionHeader title="Risk Level" section="risk" />
            <AnimatePresence>
              {expandedSections.risk && (
                <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <CheckboxFilter options={riskOptions} category="risk" />
                </MotionDiv>
              )}
            </AnimatePresence>
          </div>

          {/* Status */}
          <div className="bg-[#0d0d0d] p-3">
            <SectionHeader title="Status" section="status" />
            <AnimatePresence>
              {expandedSections.status && (
                <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <CheckboxFilter options={statusOptions} category="status" />
                </MotionDiv>
              )}
            </AnimatePresence>
          </div>

          {/* Altitude Range */}
          <div className="bg-[#0d0d0d] p-3 col-span-2 md:col-span-1">
            <SectionHeader title="Altitude" section="altitude" />
            <AnimatePresence>
              {expandedSections.altitude && (
                <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-2 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Min</span>
                        <span className="text-blue-400 font-mono">{filters.altitude?.min || 0} km</span>
                      </div>
                      <input
                        type="range" min="0" max="50000" step="100"
                        value={filters.altitude?.min || 0}
                        onChange={(e) => handleRangeChange('altitude', 'min', parseInt(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#2a2a2a] accent-blue-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Max</span>
                        <span className="text-blue-400 font-mono">{filters.altitude?.max || 50000} km</span>
                      </div>
                      <input
                        type="range" min="0" max="50000" step="100"
                        value={filters.altitude?.max || 50000}
                        onChange={(e) => handleRangeChange('altitude', 'max', parseInt(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#2a2a2a] accent-blue-500"
                      />
                    </div>
                  </div>
                </MotionDiv>
              )}
            </AnimatePresence>
          </div>

          {/* Operator Search */}
          <div className="bg-[#0d0d0d] p-3 col-span-2 md:col-span-1">
            <p className="text-xs font-normal text-gray-500 uppercase tracking-wider px-1 mb-2">Operator</p>
            <input
              type="text"
              placeholder="e.g. ISRO, NASA..."
              value={filters.operator || ''}
              onChange={(e) => onFiltersChange({ ...filters, operator: e.target.value })}
              className="w-full px-3 py-1.5 bg-black/60 border border-[#2a2a2a] rounded text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="px-4 py-2.5 border-t border-[#222] flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-600 mr-1">Quick:</span>
          {[
            { label: '🔴 High Risk', action: () => onFiltersChange({ ...filters, risk: ['critical', 'high'] }), cls: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' },
            { label: '🛰 Active Sats', action: () => onFiltersChange({ ...filters, type: ['satellite'], status: ['active'] }), cls: 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' },
            { label: '💨 Debris Only', action: () => onFiltersChange({ ...filters, type: ['debris'] }), cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20' },
            { label: 'LEO (< 2000 km)', action: () => onFiltersChange({ ...filters, altitude: { min: 0, max: 2000 } }), cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' },
            { label: 'GEO (> 35k km)', action: () => onFiltersChange({ ...filters, altitude: { min: 35000, max: 50000 } }), cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20' },
          ].map(({ label, action, cls }) => (
            <button key={label} onClick={action} className={`px-2.5 py-1 text-xs border rounded-full transition-colors ${cls}`}>
              {label}
            </button>
          ))}
          <button
            onClick={clearAllFilters}
            className="px-2.5 py-1 text-xs bg-[#1a1a1a] text-gray-500 border border-[#2a2a2a] rounded-full hover:text-white hover:border-gray-500 transition-colors ml-auto"
          >
            ✕ Reset
          </button>
        </div>
      </MotionDiv>
    </AnimatePresence>
  );
};

export default FilterPanel;