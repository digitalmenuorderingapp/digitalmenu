import { Metadata } from 'next';
import LayoutClient from './layout-client';
import './globals.css';
import { Bricolage_Grotesque, DM_Sans, Noto_Sans_Devanagari, Noto_Sans_Bengali } from 'next/font/google';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bricolage',
  adjustFontFallback: false,
  preload: false,
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700'],
  preload: false,
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-devanagari',
  preload: false,
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-bengali',
  preload: false,
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
  verification: {
    google: 'agViap_l4BcxIcbeVcdCMQoDKl6Tqai1mZX9yVRt188',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`scroll-smooth ${bricolage.variable} ${dmSans.variable} ${notoDevanagari.variable} ${notoBengali.variable}`}>
      <body className="font-sans antialiased text-gray-900 overflow-x-hidden">
        <LayoutClient>
          {children}
        </LayoutClient>
      </body>
    </html>
  );
}
