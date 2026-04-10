'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaQrcode, FaArrowRight, FaFileContract,
  FaWhatsapp, FaEnvelope
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { TRANSLATIONS, Language } from '../../utils/translations';
import { Skeleton } from '@/components/ui/Skeleton';

type Lang = Language;

const content = {
  en: {
    badge: 'Terms of Service',
    heading: 'Terms of Service',
    updated: 'Last updated',
    back: '← Back to Home',
    agree: 'By using Digital Menu Order, you agree to these Terms of Service.',
    sections: [
      {
        title: '1. By Using This App, You Agree',
        body: [
          'When you sign up and use Digital Menu Order, it means you\'ve read and agreed to these terms. If you don\'t agree, please don\'t use the platform.',
        ],
      },
      {
        title: '2. What This Platform Does',
        body: [
          'Digital Menu Order helps restaurant owners run their business digitally — at an affordable price. You can:',
          '• Create a QR-based digital menu customers can scan at the table.',
          '• Receive and manage real-time orders.',
          '• Track your daily and monthly sales.',
          '• Export order reports to your email.',
          'It\'s affordable to use with a minimal annual subscription after the trial period.',
        ],
      },
      {
        title: '3. Your Responsibilities',
        body: [
          '• Provide accurate information when signing up.',
          '• Keep your login credentials safe.',
          '• Tell us immediately if you think your account has been accessed by someone else.',
          '• Don\'t share your account with others.',
        ],
      },
      {
        title: '4. What You Must Not Do',
        body: [
          '• Use the platform for anything illegal.',
          '• Add fake or misleading menu content.',
          '• Try to hack or disrupt the platform.',
          '• Use bots or scrapers to access the app.',
        ],
      },
      {
        title: '5. Your Data & Monthly Cleanup',
        body: [
          'Order records are automatically deleted after 30 days to keep the platform fast and private.',
          'Before any cleanup, we email you a full report of your orders and sales — your records are never lost.',
          '• You can also export your data anytime from the admin dashboard.',
          'Important: If you need your records for longer than 30 days, save them yourself. We are not responsible for data after the cleanup cycle.',
        ],
      },
      {
        title: '6. Your Menu Content',
        body: [
          '• The platform itself (design, code, branding) belongs to Digital Menu Order.',
          '• Your menu items, photos, and content remain yours.',
          '• You must have the rights to any images you upload.',
        ],
      },
      {
        title: '7. Uptime',
        body: [
          'We work hard to keep the platform running, but we can\'t guarantee 100% uptime. There may be brief downtime for maintenance or unexpected issues.',
        ],
      },
      {
        title: '8. Our Liability',
        body: [
          'The platform is provided as-is. We\'re not responsible for any loss of revenue, data, or business resulting from platform issues or downtime.',
        ],
      },
      {
        title: '9. Closing Your Account',
        body: [
          'You can delete your account from settings anytime. We\'ll remove all your data within 30 days.',
          'We can suspend accounts that misuse the platform.',
        ],
      },
      {
        title: '10. Updates to These Terms',
        body: [
          'We may update these terms occasionally. If something major changes, we\'ll email you. Continuing to use the app means you accept the new terms.',
        ],
      },
      {
        title: '11. Applicable Law',
        body: [
          'These terms are governed by Indian law. Any disputes will be handled in courts in West Bengal, India.',
        ],
      },
      {
        title: '12. Contact',
        body: [
          'Questions? We\'re happy to help:',
          '• Email: digitalmenu.orderingapp@zohomail.in',
          '• WhatsApp: +91 9563401099',
        ],
      },
    ],
  },
  hi: {
    badge: 'सेवा शर्तें',
    heading: 'उपयोग की शर्तें',
    updated: 'अपडेट किया गया',
    back: '← होम पर जाएं',
    agree: 'Digital Menu Order इस्तेमाल करने का मतलब है कि आप इन शर्तों को मानते हैं।',
    sections: [
      {
        title: '1. अकाउंट बनाते ही ये शर्तें लागू होती हैं',
        body: [
          'जब आप Digital Menu Order पर अकाउंट बनाते हैं या ऐप इस्तेमाल करते हैं, तो इसका मतलब है कि आपने ये शर्तें पढ़ ली हैं और माना है। अगर आप नहीं मानते, तो कृपया ऐप इस्तेमाल न करें।',
        ],
      },
      {
        title: '2. यह ऐप क्या करता है',
        body: [
          'Digital Menu Order रेस्टोरेंट मालिकों के लिए एक फ्री डिजिटल मेनू और ऑर्डर मैनेजमेंट ऐप है। इससे आप:',
          '• QR कोड से चलने वाला डिजिटल मेनू बना सकते हैं।',
          '• रियल टाइम में ग्राहकों के ऑर्डर पा सकते हैं।',
          '• रोज और महीने की सेल्स देख सकते हैं।',
          '• ऑर्डर रिपोर्ट ईमेल पर मंगा सकते हैं।',
          'अभी के लिए यह बिल्कुल फ्री है।',
        ],
      },
      {
        title: '3. आपकी जिम्मेदारी',
        body: [
          '• सही जानकारी भरें।',
          '• अपना लॉगिन पासवर्ड और अकाउंट सुरक्षित रखें।',
          '• अगर किसी और ने आपका अकाउंट खोला हो, तो हमें फौरन बताएं।',
          '• अकाउंट किसी दूसरे को न दें।',
        ],
      },
      {
        title: '4. क्या नहीं करना है',
        body: [
          '• ऐप को गलत कामों के लिए इस्तेमाल न करें।',
          '• झूठी या भ्रामक मेनू जानकारी न डालें।',
          '• ऐप को हैक करने या खराब करने की कोशिश न करें।',
          '• बॉट या ऑटोमेटेड टूल से ऐप एक्सेस न करें।',
        ],
      },
      {
        title: '5. डेटा और मासिक सफाई',
        body: [
          'ऐप तेज और सुरक्षित रहे इसलिए 30 दिन पुराने ऑर्डर अपने आप हट जाते हैं।',
          'हटाने से पहले आपके ईमेल पर पूरी रिपोर्ट भेज दी जाती है — कोई रिकॉर्ड नहीं जाएगा।',
          '• डैशबोर्ड से जब चाहें डेटा डाउनलोड करें।',
          'ध्यान रखें: अगर आपको 30 दिन से ज्यादा रिकॉर्ड चाहिए, तो उन्हें खुद सेव करें। सफाई के बाद गए डेटा की जिम्मेदारी हमारी नहीं होती।',
        ],
      },
      {
        title: '6. आपकी कंटेंट आपकी है',
        body: [
          '• ऐप का डिजाइन, कोड और ब्रांड Digital Menu Order का है।',
          '• आपके मेनू आइटम, फोटो और कंटेंट आपके हैं।',
          '• जो फोटो डालें वो आपकी अपनी होनी चाहिए।',
        ],
      },
      {
        title: '7. ऐप कब बंद हो सकता है',
        body: [
          'हम कोशिश करते हैं कि ऐप हमेशा चलता रहे, लेकिन maintenance या अचानक आई दिक्कत की वजह से कभी-कभी ऐप कुछ देर बंद हो सकता है।',
        ],
      },
      {
        title: '8. अकाउंट बंद करना',
        body: [
          'आप कभी भी सेटिंग्स से अकाउंट हटा सकते हैं। 30 दिनों में सारा डेटा मिटा दिया जाएगा।',
          'अगर कोई ऐप का गलत इस्तेमाल करे, तो हम उसका अकाउंट बंद कर सकते हैं।',
        ],
      },
      {
        title: '9. शर्तों में बदलाव',
        body: [
          'कभी-कभी हम ये शर्तें अपडेट कर सकते हैं। बड़ा बदलाव होने पर ईमेल से बताया जाएगा। ऐप इस्तेमाल जारी रखने का मतलब है कि आप नई शर्तें मान रहे हैं।',
        ],
      },
      {
        title: '10. कानून',
        body: [
          'ये शर्तें भारतीय कानून के तहत हैं। किसी भी विवाद का निपटारा पश्चिम बंगाल के न्यायालय में होगा।',
        ],
      },
      {
        title: '11. कोई सवाल हो तो',
        body: [
          '• ईमेल: digitalmenu.orderingapp@zohomail.in',
          '• WhatsApp: +91 9563401099',
        ],
      },
    ],
  },
  bn: {
    badge: 'সেবার শর্তাবলী',
    heading: 'ব্যবহারের শর্তাবলী',
    updated: 'আপডেট করা হয়েছে',
    back: '← হোমে ফিরুন',
    agree: 'Digital Menu Order ব্যবহার করলে বোঝা যায় আপনি এই শর্তগুলো মেনে নিয়েছেন।',
    sections: [
      {
        title: '১. অ্যাকাউন্ট খুললেই এই শর্ত প্রযোজ্য',
        body: [
          'Digital Menu Order-এ অ্যাকাউন্ট তৈরি করা বা অ্যাপ ব্যবহার করা মানে আপনি এই শর্তগুলো পড়েছেন ও মেনে নিয়েছেন। রাজি না হলে অ্যাপটি ব্যবহার করবেন না।',
        ],
      },
      {
        title: '২. এই অ্যাপ কী করে',
        body: [
          'Digital Menu Order রেস্তোরাঁ মালিকদের জন্য একটি বিনামূল্যের ডিজিটাল মেনু ও অর্ডার ম্যানেজমেন্ট অ্যাপ। এটি দিয়ে আপনি:',
          '• QR কোডে সহজে দেখা যায় এমন ডিজিটাল মেনু তৈরি করতে পারবেন।',
          '• সরাসরি গ্রাহকদের অর্ডার পাবেন।',
          '• দৈনিক ও মাসিক বিক্রির হিসাব রাখতে পারবেন।',
          '• ইমেইলে অর্ডার রিপোর্ট পাঠাতে পারবেন।',
          'এখন সম্পূর্ণ বিনামূল্যে ব্যবহার করা যাচ্ছে।',
        ],
      },
      {
        title: '৩. আপনার দায়িত্ব',
        body: [
          '• সঠিক তথ্য দিয়ে রেজিস্ট্রেশন করুন।',
          '• লগইন তথ্য নিজে সংরক্ষণ করুন।',
          '• অ্যাকাউন্টে অন্য কেউ ঢুকেছে মনে হলে আমাদের জানান।',
          '• অ্যাকাউন্ট অন্যকে দেবেন না।',
        ],
      },
      {
        title: '৪. যা করা যাবে না',
        body: [
          '• অ্যাপটি কোনো অবৈধ কাজে ব্যবহার করবেন না।',
          '• ভুয়া বা বিভ্রান্তিকর মেনু তথ্য যোগ করবেন না।',
          '• অ্যাপ হ্যাক করার চেষ্টা করবেন না।',
          '• বট বা স্বয়ংক্রিয় টুল দিয়ে অ্যাপ অ্যাক্সেস করবেন না।',
        ],
      },
      {
        title: '৫. ডেটা ও মাসিক পরিষ্কার',
        body: [
          'অ্যাপ দ্রুত ও নিরাপদ রাখতে ৩০ দিনের পুরোনো অর্ডার প্রতি মাসে এমনিতেই মুছে যায়।',
          'কিন্তু মুছে ফেলার আগেই আপনার ইমেইলে পুরো রিপোর্ট পাঠানো হয় — কোনো তথ্য হারাবে না।',
          '• ড্যাশবোর্ড থেকে যেকোনো সময় ডেটা ডাউনলোড করতে পারবেন।',
          'মাথায় রাখুন: ৩০ দিনের বেশি রেকর্ড দরকার হলে নিজে সেভ করে রাখুন। পরিষ্কারের পর মুছে যাওয়া ডেটার দায় আমাদের নয়।',
        ],
      },
      {
        title: '৬. আপনার কন্টেন্ট আপনার',
        body: [
          '• অ্যাপের ডিজাইন, কোড ও ব্র্যান্ড Digital Menu Order-এর।',
          '• আপনার মেনু আইটেম, ছবি ও কন্টেন্ট আপনারই থাকবে।',
          '• যেসব ছবি আপলোড করবেন সেগুলো আপনার নিজের হতে হবে।',
        ],
      },
      {
        title: '৭. অ্যাপ কখন বন্ধ থাকতে পারে',
        body: [
          'আমরা সবসময় অ্যাপ চালু রাখার চেষ্টা করি, তবে মেইনটেন্যান্স বা হঠাৎ কোনো সমস্যায় কিছু সময় বন্ধ থাকতে পারে।',
        ],
      },
      {
        title: '৮. অ্যাকাউন্ট বন্ধ করা',
        body: [
          'আপনি যেকোনো সময় সেটিংস থেকে অ্যাকাউন্ট মুছতে পারবেন। ৩০ দিনের মধ্যে সব ডেটা মুছে যাবে।',
          'অ্যাপের অপব্যবহার হলে আমরা অ্যাকাউন্ট বন্ধ করতে পারি।',
        ],
      },
      {
        title: '৯. শর্তে পরিবর্তন হলে',
        body: [
          'মাঝে মাঝে শর্তাবলী আপডেট হতে পারে। বড় পরিবর্তন হলে ইমেইলে জানানো হবে। অ্যাপ ব্যবহার চালিয়ে গেলে বোঝা যাবে আপনি নতুন শর্ত মেনে নিয়েছেন।',
        ],
      },
      {
        title: '১০. আইন',
        body: [
          'এই শর্তাবলী ভারতীয় আইন অনুযায়ী। যেকোনো বিরোধ পশ্চিমবঙ্গের আদালতে মীমাংসা হবে।',
        ],
      },
      {
        title: '১১. যোগাযোগ',
        body: [
          'কোনো প্রশ্ন থাকলে আমাদের সাথে কথা বলুন:',
          '• ইমেইল: digitalmenu.orderingapp@zohomail.in',
          '• WhatsApp: +91 9563401099',
        ],
      },
    ],
  },
};

export default function TermsOfServicePage() {
  const { isLoading, isAuthenticated } = useAuth();
  const [lang, setLang] = useState<Lang>('hi');

  // Persistence for language
  useEffect(() => {
    const saved = localStorage.getItem('digitalmenu_lang') as Lang;
    if (saved && TRANSLATIONS[saved]) {
      setLang(saved);
    }
  }, []);

  const handleLanguageChange = (l: Language) => {
    setLang(l);
    localStorage.setItem('digitalmenu_lang', l);
  };

  const t = TRANSLATIONS[lang];
  const c = content[lang];
  const dateStr = new Date().toLocaleDateString(
    lang === 'bn' ? 'bn-BD' : lang === 'hi' ? 'hi-IN' : 'en-IN',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <div className={`min-h-screen bg-white text-gray-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden ${lang === 'hi' ? 'font-hindi' : lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
      {/* --- NAVBAR --- */}
      <header>
        <nav className="fixed top-0 w-full z-[100] backdrop-blur-md bg-white/70 border-b border-gray-100" aria-label="Main navigation">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3"
              >
                <Link href="/" className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
                    <FaQrcode className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tighter">
                    Digital Menu
                  </span>
                </Link>
              </motion.div>

              <div className="hidden lg:flex items-center space-x-10">
                <NavItem href="/#platform" label={t.nav_platform} />
                <NavItem href="/#features" label={t.nav_features} />
                <NavItem href="/#trust" label={t.nav_trust} />
                <NavItem href="/#pricing" label={t.nav_pricing} />
              </div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-4"
              >
                {/* Language Toggle - Desktop Only */}
                <div className="hidden md:flex bg-gray-100 rounded-lg p-1 mr-2">
                  <button onClick={() => handleLanguageChange('en')} className={`w-10 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'en' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>EN</button>
                  <button onClick={() => handleLanguageChange('hi')} className={`w-10 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'hi' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>HI</button>
                  <button onClick={() => handleLanguageChange('bn')} className={`w-10 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'bn' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>BN</button>
                </div>

                {isLoading ? (
                  <Skeleton width={100} height={40} className="rounded-xl" />
                ) : isAuthenticated ? (
                  <Link href="/admin/dashboard" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200">
                    {t.nav_dashboard}
                  </Link>
                ) : (
                  <>
                    <Link href="/auth" className="px-5 py-2.5 text-sm font-bold text-gray-600 md:text-gray-600 hover:text-indigo-600 border border-gray-200 md:border-none rounded-xl md:rounded-0 transition-all md:hover:bg-transparent hover:bg-gray-50 active:scale-95 md:active:scale-100">
                      {t.nav_login}
                    </Link>
                    <Link href="/auth" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hidden sm:block">
                      {t.nav_getStarted}
                    </Link>
                  </>
                )}
              </motion.div>
            </div>

            {/* Language Toggle - Mobile Only (Below main nav content) */}
            <div className="md:hidden flex justify-center pb-4 pt-1 border-t border-gray-50">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button onClick={() => handleLanguageChange('en')} className={`w-24 py-1.5 text-xs font-bold rounded-md transition-all ${lang === 'en' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>English</button>
                <button onClick={() => handleLanguageChange('hi')} className={`w-24 py-1.5 text-xs font-bold rounded-md transition-all ${lang === 'hi' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>हिन्दी</button>
                <button onClick={() => handleLanguageChange('bn')} className={`w-24 py-1.5 text-xs font-bold rounded-md transition-all ${lang === 'bn' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>বাংলা</button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-5">
            <FaFileContract />{c.badge}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-gray-900 mb-3">{c.heading}</h1>
          <p className="text-gray-400 text-sm font-medium">{c.updated}: {dateStr}</p>
        </div>

        <div className="space-y-8">
          {c.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight mb-3 pb-3 border-b border-gray-100">
                {section.title}
              </h2>
              <div className="space-y-2">
                {section.body.map((line, j) => (
                  <p key={j} className={`text-gray-600 text-sm sm:text-base leading-relaxed ${line.startsWith('•') ? 'pl-4' : ''}`}>
                    {line}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-gray-400 font-medium">{c.agree}</p>
          <Link href="/" className="flex items-center gap-2 text-indigo-600 font-black text-sm hover:gap-3 transition-all whitespace-nowrap">
            {c.back} <FaArrowRight className="text-xs" />
          </Link>
        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function NavItem({ href, label }: { href: string, label: string }) {
  return (
    <Link
      href={href}
      className="text-[13px] font-black text-gray-400 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]"
    >
      {label}
    </Link>
  );
}
