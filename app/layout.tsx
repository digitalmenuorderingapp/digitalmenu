import { Metadata } from 'next';
import LayoutClient from './layout-client';
import './globals.css';
import { Bricolage_Grotesque, Inter, Hind, Hind_Siliguri } from 'next/font/google';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bricolage',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const hind = Hind({
  subsets: ['latin', 'devanagari'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-hind',
});

const hindSiliguri = Hind_Siliguri({
  subsets: ['latin', 'bengali'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-hind-siliguri',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://digitalmenu.vercel.app'),
  title: {
    default: 'Digital Menu | Smart Restaurant Ordering',
    template: '%s | Digital Menu',
  },
  description: 'The smart, real-time QR-based ordering system for modern restaurants.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`scroll-smooth ${bricolage.variable} ${inter.variable} ${hind.variable} ${hindSiliguri.variable}`}>
      <body className="font-sans antialiased text-gray-900 overflow-x-hidden">
        <LayoutClient>
          {children}
        </LayoutClient>
      </body>
    </html>
  );
}
