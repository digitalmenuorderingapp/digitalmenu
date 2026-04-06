import { Metadata } from 'next';
import GuideClient from './guide-client';

export const metadata: Metadata = {
  title: 'DigitalMenu | Official Merchant Launch Guide',
  description: 'Learn how to set up your restaurant, build your digital menu, and manage QR orders with our step-by-step guide. Available in Hindi, Bengali, and English.',
  keywords: ['restaurant setup guide', 'QR menu manual', 'digital ordering help', 'how to use DigitalMenu', 'merchant onboarding'],
  alternates: {
    canonical: 'https://digitalmenuorder.vercel.app/guide',
  },
  openGraph: {
    title: 'DigitalMenu | Official Merchant Launch Guide',
    description: 'Transform your restaurant with DigitalMenu. Step-by-step setup guide for modern dining.',
    url: 'https://digitalmenuorder.vercel.app/guide',
    images: [{ 
      url: 'https://digitalmenuorder.vercel.app/guide-og.png',
      width: 1200,
      height: 630,
      alt: 'DigitalMenu Guide',
    }],
    locale: 'en_US',
    type: 'article',
  },
};

export default function GuidePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to set up DigitalMenu for your Restaurant",
    "description": "A comprehensive guide for restaurant owners to digitize their business with QR-based ordering.",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Create Account",
        "text": "Sign up with your restaurant name and basic details."
      },
      {
        "@type": "HowToStep",
        "name": "Build Menu",
        "text": "Add categories and items with photos and prices."
      },
      {
        "@type": "HowToStep",
        "name": "Print QR Codes",
        "text": "Generate unique QR codes for each table and print them."
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GuideClient />
    </>
  );
}
