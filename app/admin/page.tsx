'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLoader } from '@/components/ui/BrandLoader';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect /admin to /admin/dashboard
    router.replace('/admin/dashboard');
  }, [router]);

  return <BrandLoader />;
}
