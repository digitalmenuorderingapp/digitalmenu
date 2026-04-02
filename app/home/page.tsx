import { Metadata } from 'next';
import MarketingHomeClient from './home-client';

export const metadata: Metadata = {
  title: 'DigitalMenu | Smart QR Restaurant Ordering System',
  description: 'Transform your restaurant with DigitalMenu. Let customers scan, order, and pay instantly. Reduce errors, increase speed, and boost profits with our contactless QR menu system.',
  keywords: ['QR menu', 'digital restaurant ordering', 'contactless dining', 'restaurant POS', 'smart menu system', 'SaaS for restaurants'],
  alternates: {
    canonical: 'https://digitalmenu.vercel.app/home',
  },
  openGraph: {
    title: 'DigitalMenu | The Future of Dining',
    description: 'The fastest QR-based ordering system for modern restaurants.',
    url: 'https://digitalmenu.vercel.app/home',
    siteName: 'DigitalMenu',
    images: [{ 
      url: 'https://digitalmenu.vercel.app/og-image.png',
      width: 1200,
      height: 630,
      alt: 'DigitalMenu QR System',
    }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DigitalMenu | The Future of Dining',
    description: 'The fastest QR-based ordering system for modern restaurants.',
    images: ['https://digitalmenu.vercel.app/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketingHomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "DigitalMenu",
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "120"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingHomeClient />
    </>
  );
}
