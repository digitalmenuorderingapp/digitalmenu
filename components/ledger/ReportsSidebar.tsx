'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaDownload, 
  FaFileExcel, 
  FaSpinner, 
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaCloudDownloadAlt
} from 'react-icons/fa';
import api from '@/services/api';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';

interface MonthData {
  month: number;
  year: number;
  monthName: string;
  isCurrentMonth: boolean;
  isEnabled: boolean;
  cloudinaryUrl?: string;
  generatedAt?: string;
}

interface ReportsSidebarProps {
  userCreatedAt?: string;
}

export default function ReportsSidebar({ userCreatedAt }: ReportsSidebarProps) {
  const [months, setMonths] = useState<MonthData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [availableReports, setAvailableReports] = useState<Record<string, string>>({});

  // Generate months from createdAt to current month
  useEffect(() => {
    const generateMonths = () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Default to 12 months back if no createdAt
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
          isEnabled: isCurrentMonth, // Only current month is enabled for live generation
        });
        
        month++;
        if (month > 11) {
          month = 0;
          year++;
        }
      }
      
      // Reverse to show most recent first
      setMonths(monthList.reverse());
    };
    
    generateMonths();
    fetchAvailableReports();
  }, [userCreatedAt]);

  // Fetch available reports from Cloudinary
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

  const handleMonthSelect = (monthData: MonthData) => {
    setSelectedMonth(monthData);
  };

  const handleDownload = async () => {
    if (!selectedMonth) {
      toast.error('Please select a month first');
      return;
    }

    const monthKey = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;
    const cloudinaryUrl = availableReports[monthKey];

    // If previous month with Cloudinary URL, download from there
    if (!selectedMonth.isCurrentMonth && cloudinaryUrl) {
      setIsDownloading(true);
      try {
        // Download from Cloudinary
        const response = await api.get(`/ledger/download-report?month=${selectedMonth.month + 1}&year=${selectedMonth.year}`, {
          responseType: 'blob'
        });
        
        // Create download link
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
        
        toast.success(`Downloaded report for ${selectedMonth.monthName}`);
      } catch (error) {
        console.error('Failed to download report:', error);
        toast.error('Failed to download report. Please try again.');
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    // If current month, generate and download
    if (selectedMonth.isCurrentMonth) {
      setIsDownloading(true);
      const loadingToast = toast.loading('Generating your report...');
      
      try {
        const response = await api.post('/ledger/generate-and-download', {
          month: selectedMonth.month + 1,
          year: selectedMonth.year
        }, {
          responseType: 'blob'
        });
        
        // Create download link
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
        
        toast.success(`Report for ${selectedMonth.monthName} generated and downloaded!`, { id: loadingToast });
        
        // Refresh available reports
        fetchAvailableReports();
      } catch (error) {
        console.error('Failed to generate report:', error);
        toast.error('Failed to generate report. Please try again.', { id: loadingToast });
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    // Previous month without Cloudinary URL
    toast.error('Report not available for this month. Only current month reports can be generated.');
  };

  const getMonthStatus = (monthData: MonthData) => {
    const monthKey = `${monthData.year}-${String(monthData.month + 1).padStart(2, '0')}`;
    const hasCloudinaryUrl = availableReports[monthKey];
    
    if (monthData.isCurrentMonth) {
      return { label: 'Live', color: 'bg-green-100 text-green-700', icon: null };
    }
    
    if (hasCloudinaryUrl) {
      return { label: 'Download', color: 'bg-blue-100 text-blue-700', icon: <FaCloudDownloadAlt className="w-3 h-3" /> };
    }
    
    return { label: 'N/A', color: 'bg-gray-100 text-gray-400', icon: null };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
          <FaFileExcel className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Monthly Reports</h3>
          <p className="text-xs text-gray-500">Download ledger reports</p>
        </div>
      </div>

      {/* Month Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Select Month
        </label>
        
        <div className="max-h-64 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
          {months.map((monthData) => {
            const status = getMonthStatus(monthData);
            const isSelected = selectedMonth?.month === monthData.month && 
                            selectedMonth?.year === monthData.year;
            
            return (
              <motion.button
                key={`${monthData.year}-${monthData.month}`}
                onClick={() => handleMonthSelect(monthData)}
                disabled={!monthData.isEnabled && !availableReports[`${monthData.year}-${String(monthData.month + 1).padStart(2, '0')}`]}
                whileHover={{ scale: monthData.isEnabled ? 1.02 : 1 }}
                whileTap={{ scale: monthData.isEnabled ? 0.98 : 1 }}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                  isSelected 
                    ? 'bg-indigo-50 border-2 border-indigo-200' 
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                } ${
                  !monthData.isEnabled && !availableReports[`${monthData.year}-${String(monthData.month + 1).padStart(2, '0')}`]
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    monthData.isCurrentMonth ? 'bg-green-100' : 'bg-gray-200'
                  }`}>
                    <FaCalendarAlt className={`w-4 h-4 ${
                      monthData.isCurrentMonth ? 'text-green-600' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="text-left">
                    <p className={`font-medium text-sm ${
                      isSelected ? 'text-indigo-900' : 'text-gray-700'
                    }`}>
                      {monthData.monthName}
                    </p>
                    {monthData.isCurrentMonth && (
                      <p className="text-xs text-green-600 font-medium">Current Month</p>
                    )}
                  </div>
                </div>
                
                <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center space-x-1 ${status.color}`}>
                  {status.icon}
                  <span>{status.label}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Download Button */}
      <div className="pt-3 border-t border-gray-100">
        <Button
          onClick={handleDownload}
          isLoading={isDownloading}
          disabled={!selectedMonth || isDownloading}
          fullWidth
          leftIcon={<FaDownload className="w-4 h-4" />}
          variant={selectedMonth?.isCurrentMonth ? 'primary' : 'secondary'}
        >
          {isDownloading 
            ? 'Processing...' 
            : selectedMonth?.isCurrentMonth 
              ? 'Generate & Download'
              : 'Download Report'
          }
        </Button>
        
        {selectedMonth && !selectedMonth.isCurrentMonth && !availableReports[`${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`] && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Report not available. Only current month can be generated.
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Legend</p>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Live - Generate Now</span>
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Download - From Cloud</span>
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-400 rounded-full">N/A - Not Available</span>
        </div>
      </div>
    </div>
  );
}
