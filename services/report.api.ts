import axios from 'axios';
import api from './api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ReportOptions {
  reportType: 'monthly' | 'full' | 'custom';
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
  includeOnlyVerified?: boolean;
}

export interface AvailableMonth {
  value: string;
  label: string;
  year: number;
  month: number;
}

/**
 * Request email report via POST /ledger/exportreporttomail
 * Sends detailed monthly report (month start to today) to user's email
 */
export const requestEmailReport = async (): Promise<void> => {
  const response = await api.post(`${API_BASE_URL}/ledger/exportreporttomail`);
  return response.data;
};
