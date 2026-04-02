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
}

const StatsCard = ({
  label,
  value,
  icon,
  description,
  variant = 'indigo',
  trend,
  isLoading = false
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

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className={`relative p-5 rounded-3xl border ${theme.bg} ${theme.border} shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group overflow-hidden`}
    >
      {/* Decorative background shapes */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500 ${theme.iconBg}`} />
      
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${theme.iconBg} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
          <div className={`${theme.iconColor} text-xl`}>
            {icon}
          </div>
        </div>
        
        {trend && (
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center ${
            trend.isUp ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
          }`}>
            {trend.value}
          </div>
        )}
      </div>

      <div className="space-y-1 relative z-10">
        <p className={`text-[10px] font-black uppercase tracking-widest ${theme.labelColor} opacity-70`}>
          {label}
        </p>
        <div className="flex items-baseline space-x-2">
          {isLoading ? (
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-lg" />
          ) : (
            <h3 className={`text-2xl font-black tracking-tight ${theme.valueColor}`}>
              {value}
            </h3>
          )}
        </div>
        {description && (
          <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-tight">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default StatsCard;
