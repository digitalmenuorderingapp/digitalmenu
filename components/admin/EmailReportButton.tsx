'use client';

import { useState } from 'react';
import { FaFileExcel, FaSpinner, FaEnvelope } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { requestEmailReport } from '@/services/report.api';
import { toast } from 'sonner';

interface EmailReportButtonProps {
  variant?: 'button' | 'card';
  className?: string;
}

export default function EmailReportButton({ variant = 'button', className = '' }: EmailReportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestReport = async () => {
    setIsLoading(true);
    try {
      await requestEmailReport();
      toast.success('Report requested! Check your email shortly.');
    } catch (error) {
      console.error('Failed to request report:', error);
      toast.error('Failed to request report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const buttonContent = (
    <>
      <FaFileExcel className="w-4 h-4" />
      <span>Email Monthly Report</span>
    </>
  );

  if (variant === 'card') {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleRequestReport}
        disabled={isLoading}
        className={`flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all disabled:opacity-50 ${className}`}
      >
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
          {isLoading ? (
            <FaSpinner className="w-6 h-6 text-green-600 animate-spin" />
          ) : (
            <FaEnvelope className="w-6 h-6 text-green-600" />
          )}
        </div>
        <span className="font-semibold text-gray-900">Email Report</span>
        <span className="text-xs text-gray-500 mt-1">Send to your inbox</span>
      </motion.button>
    );
  }

  return (
    <button
      onClick={handleRequestReport}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <>
          <FaSpinner className="w-4 h-4 animate-spin" />
          <span>Sending...</span>
        </>
      ) : (
        buttonContent
      )}
    </button>
  );
}
