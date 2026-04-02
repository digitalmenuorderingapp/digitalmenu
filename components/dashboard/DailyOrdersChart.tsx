'use client';

import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { FaChartBar, FaChartArea, FaCalendarDay } from 'react-icons/fa';

interface HourlyData {
  hour: number;
  orders: number;
  revenue: number;
}

interface DailyData {
  date: string;
  orders: number;
  revenue: number;
}

interface DailyOrdersChartProps {
  data: HourlyData[] | DailyData[];
  isLoading?: boolean;
  mode?: 'hourly' | 'daily';
}

const DailyOrdersChart = ({ data, isLoading = false, mode = 'hourly' }: DailyOrdersChartProps) => {
  const [chartType, setChartType] = React.useState<'area' | 'bar'>('area');

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${period}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const chartData = data.map(item => {
    if (mode === 'hourly' && 'hour' in item) {
      return {
        ...item,
        time: formatHour(item.hour),
        revenueLabel: `₹${Math.round(item.revenue)}`
      };
    } else if ('date' in item) {
      return {
        ...item,
        time: formatDate(item.date),
        revenueLabel: `₹${Math.round(item.revenue)}`
      };
    }
    return { ...item, time: '', revenueLabel: '' };
  });

  if (isLoading) {
    return (
      <div className="w-full h-[400px] bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm animate-pulse flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
        <div className="h-4 w-48 bg-gray-100 rounded-lg" />
        <div className="w-full h-full bg-gray-50 rounded-3xl" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">{label} (IST)</p>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white flex justify-between gap-8">
              <span className="opacity-70">Orders:</span>
              <span className="text-indigo-400">{payload[0].value}</span>
            </p>
            <p className="text-sm font-bold text-white flex justify-between gap-8">
              <span className="opacity-70">Revenue:</span>
              <span className="text-emerald-400">₹{Math.round(payload[1]?.value || 0)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 overflow-hidden"
    >
      <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
            <FaChartArea className="text-xl" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Orders Performance</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mt-0.5">
              {mode === 'daily' ? 'Date-wise transaction trends' : 'Real-time daily transaction trends'}
            </p>
          </div>
        </div>

        <div className="flex items-center bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
          <button 
            onClick={() => setChartType('area')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 transition-all ${
              chartType === 'area' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100/50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <FaChartArea />
            <span>Volume</span>
          </button>
          <button 
            onClick={() => setChartType('bar')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 transition-all ${
              chartType === 'bar' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100/50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <FaChartBar />
            <span>Revenue</span>
          </button>
        </div>
      </div>

      <div className="p-8 h-[400px] relative">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="orders" 
                stroke="#4f46e5" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorOrders)" 
                animationDuration={2000}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                animationDuration={2000}
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" radius={[10, 10, 0, 0]} animationDuration={2000}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.revenue > 0 ? '#4f46e5' : '#f1f5f9'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="px-8 pb-8 flex items-center justify-center space-x-8">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-lg shadow-indigo-200" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Volume</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sales Revenue</span>
        </div>
      </div>
    </motion.div>
  );
};

export default DailyOrdersChart;
