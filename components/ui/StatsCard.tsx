'use client';

import React from 'react';
import { IconType } from 'react-icons';
import { motion } from 'framer-motion';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  variant?: 'indigo' | 'green' | 'amber' | 'blue' | 'red' | 'purple' | 'emerald';
  trend?: {
    value: string;
    isUp?: boolean;
  };
  isLoading?: boolean;
  isMini?: boolean;
}

const StatsCard = ({
  label,
  value,
  icon,
  description,
  variant = 'indigo',
  trend,
  isLoading = false,
  isMini = false
}: StatsCardProps) => {
  const themes = {
    indigo: {
      bg: 'bg-indigo-50/50',
      border: 'border-indigo-100/50',
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      valueColor: 'text-indigo-900',
      labelColor: 'text-indigo-600'
    },
    green: {
      bg: 'bg-green-50/50',
      border: 'border-green-100/50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      valueColor: 'text-green-900',
      labelColor: 'text-green-600'
    },
    emerald: {
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-100/50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      valueColor: 'text-emerald-900',
      labelColor: 'text-emerald-600'
    },
    amber: {
      bg: 'bg-amber-50/50',
      border: 'border-amber-100/50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      valueColor: 'text-amber-900',
      labelColor: 'text-amber-600'
    },
    blue: {
      bg: 'bg-blue-50/50',
      border: 'border-blue-100/50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      valueColor: 'text-blue-900',
      labelColor: 'text-blue-600'
    },
    red: {
      bg: 'bg-red-50/50',
      border: 'border-red-100/50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      valueColor: 'text-red-900',
      labelColor: 'text-red-600'
    },
    purple: {
      bg: 'bg-purple-50/50',
      border: 'border-purple-100/50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      valueColor: 'text-purple-900',
      labelColor: 'text-purple-600'
    }
  };

  const theme = themes[variant];

  if (isMini) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`relative p-3 rounded-2xl border flex items-center space-x-3 ${theme.bg} ${theme.border} transition-all duration-300 group h-full`}
      >
        <div className={`w-9 h-9 rounded-xl ${theme.iconBg} flex items-center justify-center ${theme.iconColor} text-base group-hover:scale-110 transition-transform flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[9px] font-black uppercase tracking-wider ${theme.labelColor} opacity-70 truncate`}>
            {label}
          </p>
          <h4 className={`text-base font-black tracking-tight ${theme.valueColor} truncate`}>
            {value}
          </h4>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className={`relative p-4 rounded-3xl border ${theme.bg} ${theme.border} shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group overflow-hidden h-full flex flex-col justify-between`}
    >
      {/* Decorative background shapes */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500 ${theme.iconBg}`} />
      
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 ${theme.iconBg} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            <div className={`${theme.iconColor} text-lg`}>
              {icon}
            </div>
          </div>
          
          {trend && (
            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center ${
              trend.isUp ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
            }`}>
              {trend.value}
            </div>
          )}
        </div>

        <div className="space-y-0.5 relative z-10">
          <p className={`text-[9px] font-black uppercase tracking-widest ${theme.labelColor} opacity-70`}>
            {label}
          </p>
          <div className="flex items-baseline space-x-2">
            {isLoading ? (
              <div className="h-6 w-20 bg-gray-200 animate-pulse rounded-lg" />
            ) : (
              <h3 className={`text-lg font-black tracking-tight ${theme.valueColor}`}>
                {value}
              </h3>
            )}
          </div>
        </div>
      </div>

      {description && (
        <p className="text-[9px] text-gray-500 font-bold mt-2 uppercase tracking-tight relative z-10 border-t border-black/5 pt-2">
          {description}
        </p>
      )}
    </motion.div>
  );
};

export default StatsCard;
