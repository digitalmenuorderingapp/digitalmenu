'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { BrandLoader } from '@/components/ui/BrandLoader';

function RootLoadingWrapper({ children }: { children: React.ReactNode }) {
  // Loading states are now handled on a per-page/per-layout basis
  // (e.g., BrandLoader on home page, Skeletons in admin)
  return <>{children}</>;
}

// Google Client ID - replace with your actual client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <RootLoadingWrapper>
          {children}
        </RootLoadingWrapper>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: 'white',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#EF4444',
                secondary: 'white',
              },
            },
          }}
        />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
