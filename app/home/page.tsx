'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLoader } from '@/components/ui/BrandLoader';

export default function HomeRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/');
  }, [router]);

  return <BrandLoader />;
}
