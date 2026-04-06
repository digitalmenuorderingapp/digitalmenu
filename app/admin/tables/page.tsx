'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import QRCodeStyling from 'qr-code-styling';
import { useAuth } from '@/context/AuthContext';
import type { RestaurantAdmin } from '@/context/AuthContext';
import CryptoJS from 'crypto-js';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  FaPlus,
  FaTrash,
  FaQrcode,
  FaSpinner,
  FaPrint,
  FaTimes,
  FaDownload,
  FaUtensils,
} from 'react-icons/fa';
import { Skeleton, TableCardSkeleton } from '@/components/ui/Skeleton';

interface Table {
  _id: string;
  tableNumber: number;
  seats: number;
  qrCode: string;
}

// QR Code Styling Options
const getQRCodeOptions = (data: string): any => ({
  width: 260,
  height: 260,
  type: 'svg' as const,
  data,
  margin: 4,
  qrOptions: {
    typeNumber: 0 as any,
    mode: 'Byte' as any,
    errorCorrectionLevel: 'H' as any,
  },
  dotsOptions: {
    color: '#4f46e5',
    type: 'rounded' as any,
  },
  cornersSquareOptions: {
    color: '#7c3aed',
    type: 'extra-rounded' as any,
  },
  cornersDotOptions: {
    color: '#4f46e5',
    type: 'dot' as any,
  },
  backgroundOptions: {
    color: '#ffffff',
  },
});

// Smaller QR for print layout
const getPrintQROptions = (data: string): any => ({
  width: 220,
  height: 220,
  type: 'svg' as const,
  data,
  margin: 3,
  qrOptions: {
    typeNumber: 0 as any,
    mode: 'Byte' as any,
    errorCorrectionLevel: 'H' as any,
  },
  dotsOptions: {
    color: '#4f46e5',
    type: 'rounded' as any,
  },
  cornersSquareOptions: {
    color: '#7c3aed',
    type: 'extra-rounded' as any,
  },
  cornersDotOptions: {
    color: '#4f46e5',
    type: 'dot' as any,
  },
  backgroundOptions: {
    color: '#ffffff',
  },
});

const QRSticker = ({
  table,
  user,
  isPrint = false,
  url
}: {
  table: Table,
  user: any,
  isPrint?: boolean,
  url: string
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    const options = isPrint ? getPrintQROptions(url) : getQRCodeOptions(url);
    const qr = new QRCodeStyling(options as any);
    qr.append(containerRef.current);
  }, [url, isPrint]);

  // Use actual print dimensions for both dashboard and print modal
  const stickerStyles = { height: '138mm', width: '101mm' };

  return (
    <div
      className="relative p-[4px] bg-gradient-to-tr from-slate-300 via-indigo-100 to-slate-200 rounded-[22px] shadow-xl overflow-hidden flex flex-col shrink-0"
      style={stickerStyles}
    >
      <div className="bg-white rounded-[18px] p-5 h-full flex flex-col justify-between border border-gray-100 shadow-inner overflow-hidden">
        {/* Header - Corner Balanced */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            {user?.logo ? (
              <img
                src={user.logo}
                alt="Logo"
                className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                <FaUtensils className="w-6 h-6 text-indigo-400" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-900 truncate uppercase tracking-tight leading-tight">
                {user?.restaurantName || 'Digital Menu'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[150px]">
                {user?.motto || 'Premium Experience'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[12px] font-black text-white bg-slate-900 px-3 py-1 rounded-lg uppercase tracking-widest shadow-sm">
              Table {table.tableNumber}
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1">
              {table.seats} Seats
            </span>
          </div>
        </div>

        {/* QR Code Section - Main Priority */}
        <div className="flex-1 flex items-center justify-center py-2">
          <div className="relative bg-white rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] p-2 border border-gray-100/50">
            <div
              ref={containerRef}
              className="w-[280px] h-[260px] [&_svg]:w-full [&_svg]:h-full"
            />
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-200 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-200 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-200 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-200 rounded-br-lg"></div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="text-center mt-3">
          <div className="bg-slate-900 rounded-xl px-4 py-3 inline-flex flex-col items-center justify-center w-full text-white shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-2 mb-0.5 relative z-10">
              <FaUtensils className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white">Scan & Order Now</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter relative z-10">
              Powered by <span className="text-indigo-400 font-black">DigitalMenuExpert</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TableManagementPage() {
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [seats, setSeats] = useState('4');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Encryption key - in production, this should be stored securely
  const ENCRYPTION_KEY = 'dm-2026';

  const generateEncryptedUrl = (tableNumber: number) => {
    // Get user from localStorage or context
    const storedUser = localStorage.getItem('user');
    let userData = null;
    
    if (storedUser) {
      try {
        userData = JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing user:', error);
      }
    }
    
    const restaurantId = userData?._id || userData?.id || user?._id || user?.id;
    
    if (!restaurantId) {
      console.error('No restaurant ID available');
      return '#';
    }

    // Compact encrypted format for shorter URLs
    // We only encrypt essential data: restaurantId and tableNumber
    const payload = `${restaurantId}:${tableNumber}`;
    const encrypted = CryptoJS.AES.encrypt(payload, ENCRYPTION_KEY).toString()
      .replace(/\+/g, '-') // URL safe
      .replace(/\//g, '_') // URL safe
      .replace(/=+$/, ''); // Remove padding
    
    return `${window.location.origin}/customer?q=${encrypted}`;
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await api.get('/table');
      setTables(response.data.data);
    } catch (error) {
      toast.error('Failed to load tables');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber) return;

    setIsSubmitting(true);
    try {
      await api.post('/table', {
        tableNumber: parseInt(tableNumber),
        seats: parseInt(seats) || 4
      });
      toast.success('Table created successfully');
      setTableNumber('');
      setSeats('4');
      setIsModalOpen(false);
      fetchTables();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create table');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      await api.delete(`/table/${id}`);
      toast.success('Table deleted');
      fetchTables();
    } catch (error) {
      toast.error('Failed to delete table');
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'QR Codes - DigitalMenu',
  });


  // Prepare tables for print layout (4 per page)
  const printTables = [...tables].sort((a, b) => a.tableNumber - b.tableNumber);
  const pages = [];
  for (let i = 0; i < printTables.length; i += 4) {
    pages.push(printTables.slice(i, i + 4));
  }

  // Remove full-page blocking loader

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          {user?.logo && (
            <img
              src={user.logo}
              alt="Restaurant Logo"
              className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.restaurantName || 'Table Management'}</h1>
            <p className="text-gray-600 mt-1">Manage your tables and generate QR codes for customers.</p>
          </div>
        </div>
        <div className="flex space-x-3">
          {tables.length > 0 && (
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <FaPrint className="w-4 h-4" />
              <span>Print QR</span>
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => <TableCardSkeleton key={i} />)
        ) : (
          tables.map((table) => (
            <div key={table._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Table {table.tableNumber}
                  </h3>
                  <p className="text-sm text-gray-500">{table.seats} seats</p>
                </div>
                <button
                  onClick={() => handleDelete(table._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col items-center">
                <QRSticker
                  table={table}
                  user={user}
                  url={generateEncryptedUrl(table.tableNumber)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
          <FaQrcode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No tables yet</h3>
          <p className="text-gray-500 mb-4">Create your first table to generate a QR code.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add Table
          </button>
        </div>
      )}

      {/* Add Table Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Table</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g., 1"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Seats *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g., 4"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmitting ? <FaSpinner className="w-5 h-5 animate-spin mx-auto" /> : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsPrintModalOpen(false)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-4xl">
              <div className="flex items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Print QR Codes</h2>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                {tables.length} QR codes will be printed on {pages.length} page(s).
              </p>

              <div className="bg-gray-100 rounded-lg p-4 mb-6 max-h-[500px] overflow-y-auto">
                <style>
                  {`
                    @media print {
                      @page {
                        margin: 0 !important;
                        size: A4 portrait !important;
                      }
                      body {
                        margin: 0 !important;
                        padding: 0 !important;
                      }
                      .no-print {
                        display: none !important;
                      }
                    }
                  `}
                </style>
                <div ref={printRef} className="bg-white p-0">
                  {pages.map((pageTables, pageIndex) => (
                    <div
                      key={pageIndex}
                      className="page-break-after"
                      style={{
                        width: '210mm',
                        minHeight: '297mm',
                        padding: '5mm 2.75mm',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 101mm)',
                        gap: '3.5mm 2.5mm',
                        breakAfter: 'page',
                      }}
                    >
                      {pageTables.map((table) => (
                        <QRSticker
                          key={table._id}
                          table={table}
                          user={user}
                          url={generateEncryptedUrl(table.tableNumber)}
                          isPrint
                        />
                      ))}
                      {/* Fill empty slots for 4-per-page layout */}
                      {Array.from({ length: 4 - pageTables.length }).map((_, idx) => (
                        <div
                          key={`empty-${idx}`}
                          className="border-2 border-dashed border-slate-200 rounded-[10px]"
                          style={{ height: '138mm', width: '101mm' }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2"
                >
                  <FaPrint className="w-4 h-4" />
                  <span>Print Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
