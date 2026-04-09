'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FaDownload,
  FaFileExcel,
  FaSpinner,
  FaCalendarAlt,
  FaCloudDownloadAlt,
  FaChartLine,
  FaHistory,
  FaCheckCircle
} from 'react-icons/fa';
import api from '@/services/api';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

interface MonthData {
  month: number;
  year: number;
  monthName: string;
  isCurrentMonth: boolean;
  isEnabled: boolean;
}

interface UserData {
  createdAt?: string;
  businessName?: string;
}

export default function ReportPage() {
  const { user } = useAuth();
  const [months, setMonths] = useState<MonthData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [availableReports, setAvailableReports] = useState<Record<string, string>>({});
  const [userData, setUserData] = useState<UserData>({});

  // Generate months from createdAt to current month
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/auth/profile');
        if (response.data.success) {
          setUserData(response.data.user || {});
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();
    fetchAvailableReports();
  }, []);

  useEffect(() => {
    const generateMonths = () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const startDate = userData.createdAt
        ? new Date(userData.createdAt)
        : new Date(currentYear, currentMonth - 11, 1);
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

      setMonths(monthList.reverse());
      setIsLoading(false);
    };

    if (userData) {
      generateMonths();
    }
  }, [userData]);

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

    if (!selectedMonth.isCurrentMonth && cloudinaryUrl) {
      setIsDownloading(true);
      try {
        const response = await api.get(`/ledger/download-report?month=${selectedMonth.month + 1}&year=${selectedMonth.year}`, {
          responseType: 'blob'
        });

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
        fetchAvailableReports();
      } catch (error) {
        console.error('Failed to generate report:', error);
        toast.error('Failed to generate report. Please try again.', { id: loadingToast });
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    toast.error('Report not available for this month. Only current month reports can be generated.');
  };

  const getMonthStatus = (monthData: MonthData) => {
    const monthKey = `${monthData.year}-${String(monthData.month + 1).padStart(2, '0')}`;
    const hasCloudinaryUrl = availableReports[monthKey];

    if (monthData.isCurrentMonth) {
      return { label: 'Live', color: 'bg-green-100 text-green-700 border-green-200', icon: null };
    }

    if (hasCloudinaryUrl) {
      return { label: 'Available', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <FaCloudDownloadAlt className="w-3 h-3" /> };
    }

    return { label: 'N/A', color: 'bg-gray-100 text-gray-400 border-gray-200', icon: null };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <FaSpinner className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Download Reports</h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                  {userData.businessName || 'Business'} Ledger Reports
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Month Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <FaCheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Reports</p>
                    <p className="text-sm font-black text-gray-900">Current Month</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FaCloudDownloadAlt className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Archived</p>
                    <p className="text-sm font-black text-gray-900">Cloud Storage</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <FaFileExcel className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Format</p>
                    <p className="text-sm font-black text-gray-900">Excel (.xlsx)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Month Selection */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <FaHistory className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Select Month</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Choose a month to download</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                  {months.map((monthData) => {
                    const status = getMonthStatus(monthData);
                    const isSelected = selectedMonth?.month === monthData.month &&
                      selectedMonth?.year === monthData.year;
                    const isAvailable = monthData.isCurrentMonth ||
                      availableReports[`${monthData.year}-${String(monthData.month + 1).padStart(2, '0')}`];

                    return (
                      <motion.button
                        key={`${monthData.year}-${monthData.month}`}
                        onClick={() => handleMonthSelect(monthData)}
                        disabled={!isAvailable}
                        whileHover={{ scale: isAvailable ? 1.02 : 1 }}
                        whileTap={{ scale: isAvailable ? 0.98 : 1 }}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 shadow-md'
                            : 'bg-gray-50 border-transparent hover:bg-gray-100 hover:border-gray-200'
                        } ${
                          !isAvailable
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            monthData.isCurrentMonth ? 'bg-green-100' : 'bg-white border border-gray-200'
                          }`}>
                            <FaCalendarAlt className={`w-5 h-5 ${
                              monthData.isCurrentMonth ? 'text-green-600' : 'text-gray-500'
                            }`} />
                          </div>
                          <div className="text-left">
                            <p className={`font-bold text-sm ${
                              isSelected ? 'text-indigo-900' : 'text-gray-800'
                            }`}>
                              {monthData.monthName}
                            </p>
                            {monthData.isCurrentMonth && (
                              <p className="text-xs text-green-600 font-bold flex items-center mt-0.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                                Current Month
                              </p>
                            )}
                          </div>
                        </div>

                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border flex items-center space-x-1 ${status.color}`}>
                          {status.icon}
                          <span>{status.label}</span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Download Action */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Download Card */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 bg-gradient-to-br from-indigo-50 to-white border-b border-gray-100">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                    <FaFileExcel className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-center text-lg font-black text-gray-900 uppercase tracking-tight">
                    {selectedMonth ? selectedMonth.monthName : 'Select a Month'}
                  </h3>
                  <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {selectedMonth?.isCurrentMonth ? 'Live Report Available' : 'Download Ready'}
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  {selectedMonth ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Report Type</span>
                          <span className="font-bold text-gray-900">Ledger Summary</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Format</span>
                          <span className="font-bold text-gray-900">Excel (.xlsx)</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Status</span>
                          <span className={`font-bold px-2 py-1 rounded-full text-xs ${
                            selectedMonth.isCurrentMonth
                              ? 'bg-green-100 text-green-700'
                              : availableReports[`${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`]
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-500'
                          }`}>
                            {selectedMonth.isCurrentMonth
                              ? 'Ready to Generate'
                              : availableReports[`${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`]
                                ? 'Available'
                                : 'Not Available'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <Button
                          onClick={handleDownload}
                          isLoading={isDownloading}
                          disabled={!selectedMonth ||
                            (!selectedMonth.isCurrentMonth &&
                              !availableReports[`${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`])}
                          fullWidth
                          size="lg"
                          leftIcon={<FaDownload className="w-5 h-5" />}
                          variant={selectedMonth?.isCurrentMonth ? 'primary' : 'secondary'}
                        >
                          {isDownloading
                            ? 'Processing...'
                            : selectedMonth?.isCurrentMonth
                              ? 'Generate & Download'
                              : 'Download Report'}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaCalendarAlt className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">
                        Select a month from the list to download your report
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Status Guide</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-200 font-bold">Live</span>
                    <span className="text-xs text-gray-600">Current month - Generate fresh report</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full border border-blue-200 font-bold">Available</span>
                    <span className="text-xs text-gray-600">Archived report - Direct download</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-400 rounded-full border border-gray-200 font-bold">N/A</span>
                    <span className="text-xs text-gray-600">Not available for download</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
