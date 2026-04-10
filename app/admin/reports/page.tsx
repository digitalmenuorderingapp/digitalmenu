'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  FaFileExcel,
  FaDownload,
  FaCalendarAlt,
  FaCloudDownloadAlt,
  FaSearch,
  FaFileAlt,
  FaChartLine,
  FaHistory
} from 'react-icons/fa';
import Button from '@/components/ui/Button';

interface MonthData {
  month: number;
  year: number;
  monthName: string;
  isCurrentMonth: boolean;
  isEnabled: boolean;
  cloudinaryUrl?: string;
}

export default function ReportsPage() {
  const [months, setMonths] = useState<MonthData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [availableReports, setAvailableReports] = useState<Record<string, string>>({});
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      generateMonths();
      fetchAvailableReports();
    }
  }, [isAuthenticated, user?.createdAt]);

  const generateMonths = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Default to start of account or 12 months back
    const userCreatedAt = user?.createdAt;
    const startDate = userCreatedAt ? new Date(userCreatedAt) : new Date(currentYear, currentMonth - 11, 1);
    const startMonth = startDate.getMonth();
    const startYear = startDate.getFullYear();
    
    const monthList: MonthData[] = [];
    let year = startYear;
    let month = startMonth;
    
    while (year < currentYear || (year === currentYear && month <= currentMonth)) {
      const isCurrentMonth = year === currentYear && month === currentMonth;
      
      monthList.push({
        month,
        year,
        monthName: new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' }),
        isCurrentMonth,
        isEnabled: isCurrentMonth,
      });
      
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
    setMonths(monthList);
    setIsLoading(false);
  };

  const fetchAvailableReports = async () => {
    try {
      const response = await api.get('/ledger/available-reports');
      if (response.data.success) {
        setAvailableReports(response.data.reports || {});
      }
    } catch (error) {
      console.error('Failed to fetch available reports:', error);
    }
  };

  const handleDownload = async (monthData: MonthData) => {
    const monthKey = `${monthData.year}-${String(monthData.month + 1).padStart(2, '0')}`;
    const cloudinaryUrl = availableReports[monthKey];

    setIsDownloading(true);
    const loadingToast = toast.loading(`Preparing report for ${monthData.monthName}...`);
    
    try {
      let response;
      if (monthData.isCurrentMonth) {
        // Generate live for current month
        response = await api.post('/ledger/generate-and-download', {
          month: monthData.month + 1,
          year: monthData.year
        }, { responseType: 'blob' });
      } else if (cloudinaryUrl) {
        // Download from Cloudinary proxy
        response = await api.get(`/ledger/download-report?month=${monthData.month + 1}&year=${monthData.year}`, {
          responseType: 'blob'
        });
      } else {
        toast.error('Report not available for this period.', { id: loadingToast });
        setIsDownloading(false);
        return;
      }

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ledger-report-${monthKey}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Report downloaded successfully!`, { id: loadingToast });
      fetchAvailableReports(); // Refresh available list
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download report.', { id: loadingToast });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Reporting Center</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Audit • Exports • Compliance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Reports List */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8 px-2">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Financial Reports</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Monthly Ledger Statements</p>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                <FaFileExcel className="w-3 h-3" />
                <span>Format: .XLSX</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {months.map((m) => {
                const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
                const hasCloudinary = availableReports[monthKey];
                const isAvailable = m.isCurrentMonth || hasCloudinary;

                return (
                  <motion.div
                    key={monthKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`group p-5 rounded-2xl border-2 transition-all duration-300 ${
                      isAvailable 
                        ? 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-lg' 
                        : 'bg-gray-50 border-transparent opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${
                          m.isCurrentMonth ? 'bg-green-100 text-green-600' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          <FaCalendarAlt />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{m.monthName}</p>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${
                            m.isCurrentMonth ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {m.isCurrentMonth ? 'Live / Current' : hasCloudinary ? 'Available in Cloud' : 'Not Generated'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => isAvailable && handleDownload(m)}
                        disabled={!isAvailable || isDownloading}
                        className={`p-3 rounded-xl transition-all ${
                          isAvailable
                            ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md active:scale-95'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isDownloading ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <FaDownload />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
            
            <h3 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center">
              <FaFileAlt className="mr-3 text-indigo-400" /> Export Guide
            </h3>
            
            <ul className="space-y-6">
              <li className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <span className="font-black text-indigo-400">01</span>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-1">Live Reports</p>
                  <p className="text-[11px] text-indigo-100/70 leading-relaxed">Current month reports are generated in real-time based on your latest orders.</p>
                </div>
              </li>
              <li className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <span className="font-black text-indigo-400">02</span>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-1">Archived Reports</p>
                  <p className="text-[11px] text-indigo-100/70 leading-relaxed">Past months are stored in the secure cloud. Simply click download to retrieve them.</p>
                </div>
              </li>
              <li className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <span className="font-black text-indigo-400">03</span>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-1">Integrity Sync</p>
                  <p className="text-[11px] text-indigo-100/70 leading-relaxed">Always use the ''Recalculate'' button in Ledger before generating final reports.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
             <div className="flex items-center space-x-3 mb-4">
               <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                 <FaHistory className="text-amber-600" />
               </div>
               <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Recent Activity</h3>
             </div>
             <p className="text-[11px] text-gray-500 leading-relaxed italic">
               No recent downloads recorded in this session. Your download history is cleared when you refresh the page.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
