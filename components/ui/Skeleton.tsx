'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export const Skeleton = ({ className = '', width, height, circle = false }: SkeletonProps) => {
  return (
    <div 
      className={`relative overflow-hidden bg-gray-200 ${circle ? 'rounded-full' : 'rounded-lg'} ${className}`}
      style={{ width, height }}
    >
      <motion.div
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear',
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
      />
    </div>
  );
};

export const CardSkeleton = () => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
    <div className="flex items-center gap-4">
      <Skeleton circle width={40} height={40} />
      <div className="space-y-2 flex-1">
        <Skeleton width="60%" height={12} />
        <Skeleton width="40%" height={8} />
      </div>
    </div>
    <Skeleton width="100%" height={100} className="mt-4" />
  </div>
);

export const StatsCardSkeleton = () => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
    <Skeleton circle width={48} height={48} />
    <div className="space-y-2">
      <Skeleton width={60} height={10} />
      <Skeleton width={80} height={20} />
    </div>
  </div>
);
export const OrderCardSkeleton = () => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <Skeleton width={120} height={16} />
        <Skeleton width={80} height={10} />
      </div>
      <Skeleton width={60} height={24} className="rounded-full" />
    </div>
    <div className="space-y-3 pt-2">
      <Skeleton width="100%" height={40} className="rounded-xl opacity-50" />
      <div className="flex justify-between border-t border-dashed border-gray-100 pt-3">
        <Skeleton width={100} height={12} />
        <Skeleton width={60} height={12} />
      </div>
    </div>
  </div>
);

export const MenuItemSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <Skeleton width="100%" height={192} className="rounded-none opacity-50" />
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <Skeleton width="30%" height={14} />
        <Skeleton width="20%" height={14} />
      </div>
      <Skeleton width="60%" height={18} />
      <div className="space-y-1">
        <Skeleton width="100%" height={10} />
        <Skeleton width="80%" height={10} />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton width="40%" height={24} />
        <div className="flex gap-2">
          <Skeleton circle width={32} height={32} />
          <Skeleton circle width={32} height={32} />
          <Skeleton circle width={32} height={32} />
        </div>
      </div>
    </div>
  </div>
);

export const TableCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton width={80} height={18} />
        <Skeleton width={60} height={12} />
      </div>
      <Skeleton circle width={32} height={32} />
    </div>
    <div className="flex flex-col items-center">
      <div className="relative p-1 bg-slate-100 rounded-[22px] w-full max-w-[340px] h-[400px] opacity-40">
        <Skeleton width="100%" height="100%" className="rounded-[18px]" />
      </div>
    </div>
  </div>
);

export const LedgerSkeleton = () => (
  <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-pulse">
    {/* Header Skeleton */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <div className="flex items-center space-x-5">
        <Skeleton width={48} height={48} className="rounded-2xl" />
        <div className="space-y-2">
          <Skeleton width={200} height={32} />
          <Skeleton width={150} height={12} />
        </div>
      </div>
      <div className="flex gap-4">
        <Skeleton width={200} height={48} className="rounded-2xl" />
        <Skeleton width={150} height={48} className="rounded-2xl" />
      </div>
    </div>

    {/* Stats Grid Skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>

    {/* Detailed Metrics Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-64 p-6 space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <Skeleton circle width={40} height={40} />
            <div className="space-y-2">
              <Skeleton width={100} height={14} />
              <Skeleton width={80} height={10} />
            </div>
          </div>
          <Skeleton width="100%" height={40} className="rounded-2xl" />
          <Skeleton width="100%" height={40} className="rounded-2xl" />
          <div className="pt-4 border-t border-gray-100">
             <Skeleton width="100%" height={40} />
          </div>
        </div>
      ))}
    </div>
    
    {/* Graph/Heatmap Skeleton */}
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 h-64">
      <div className="space-y-2 mb-8">
        <Skeleton width={120} height={18} />
        <Skeleton width={80} height={10} />
      </div>
      <div className="flex gap-3 items-end h-32">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={`${Math.random() * 100}%`} className="rounded-xl opacity-20" />
        ))}
      </div>
    </div>
  </div>
);

export const UserProfileSkeleton = () => (
  <div className="flex items-center space-x-3 mb-4 animate-pulse">
    <Skeleton circle width={40} height={40} className="bg-gray-100" />
    <div className="flex-1 space-y-2">
      <Skeleton width="100%" height={14} className="bg-gray-100" />
      <Skeleton width="60%" height={10} className="bg-gray-100" />
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-pulse">
    {/* Welcome Card Skeleton */}
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-8 h-48 opacity-20">
      <div className="space-y-4">
        <Skeleton width="40%" height={32} className="bg-white" />
        <Skeleton width="60%" height={16} className="bg-white" />
      </div>
    </div>

    {/* Stats Grid Skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>

    {/* Content Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Skeleton width="100%" height={300} className="rounded-2xl" />
      <Skeleton width="100%" height={300} className="rounded-2xl" />
    </div>
  </div>
);
