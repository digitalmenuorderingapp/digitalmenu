'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { FaSpinner } from 'react-icons/fa';

// Dynamically import the entire page content with SSR disabled
const CustomerPageContent = dynamic(() => import('@/components/customer/CustomerPageContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pb-24">
      <FaSpinner className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  )
});

export default function CustomerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pb-24">
        <FaSpinner className="w-8 h-8 animate-spin text-indigo-600" />
        <div className="fixed bottom-6 left-0 right-0 px-4 z-50 flex justify-center opacity-50 pointer-events-none">
          <div className="h-14 w-64 bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-lg" />
        </div>
      </div>
    }>
      <CustomerPageContent />
    </Suspense>
  );
}
