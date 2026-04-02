'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BrandLoader } from '@/components/ui/BrandLoader';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isLoading) {
      // Home page is now accessible to everyone
      router.replace('/home');
    }
  }, [router, isLoading]);

  // Show premium brand loader while checking auth/redirecting
  return <BrandLoader />;
}
