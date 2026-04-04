'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaQrcode, FaArrowRight, FaShieldAlt, FaQuestionCircle,
  FaWhatsapp, FaEnvelope
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { TRANSLATIONS, Language } from '../../utils/translations';
import { Skeleton } from '@/components/ui/Skeleton';

type Lang = Language;

const content = {
  en: {
    badge: 'Privacy Policy',
    heading: 'Your Privacy Matters',
    updated: 'Last updated',
    back: '← Back to Home',
    agree: 'By using Digital Menu Order, you agree to this Privacy Policy.',
    sections: [
      {
        title: '1. What We Collect', isQ: true,
        body: [
          'When you sign up and use our platform, we collect only what we need:',
          '• Your name, restaurant name, email, and phone number.',
          '• The menu items, prices, and images you add.',
          '• Orders placed by your customers.',
          '• Basic usage info to improve the app.',
          'We never collect payment card details — payments are handled outside our platform.',
        ],
      },
      {
        title: '2. How We Use Your Data', isQ: true,
        body: [
          '• To run your digital menu and order system.',
          '• To send you a monthly summary of your orders and sales by email.',
          '• To notify you about important account or security updates.',
          '• To fix bugs and make the platform better.',
          'We never sell or share your data with anyone for advertising.',
        ],
      },
      {
        title: '3. Data Cleanup & Monthly Reports',
        body: [
          'We automatically delete order records older than 30 days to keep things fast and private.',
          'Before any data is deleted, we email you a full summary of your orders and sales — so you never lose your records.',
          '• Your active data stays on our servers as long as your account is open.',
          '• Old orders (30+ days) are cleared automatically each month.',
          '• You get an email report before every cleanup.',
          '• If you close your account, all data is removed within 30 days.',
        ],
      },
      {
        title: '4. Emails You\'ll Receive', isQ: true,
        body: [
          '• Monthly reports — automatic order and sales summaries.',
          '• On-demand exports — download your data anytime from the dashboard.',
          '• Service alerts — important security or account notices.',
          'You can turn off non-essential emails from your account settings.',
        ],
      },
      {
        title: '5. Security', isQ: true,
        body: [
          'Your data is protected by:',
          '• HTTPS encryption on all connections.',
          '• Email & password login — OTP verification on registration and password reset.',
          '• Access controls — only you can see your restaurant\'s data.',
          '• Regular security checks and updates.',
        ],
      },
      {
        title: '6. Third-Party Services',
        body: [
          'We use these services to run the platform:',
          '• Google OAuth (login)',
          '• Vercel (hosting)',
          '• MongoDB Atlas (database)',
          'Each has their own privacy policy.',
        ],
      },
      {
        title: '7. Your Rights',
        body: [
          '• Request a copy of your data anytime.',
          '• Update wrong info from your admin panel.',
          '• Ask us to delete your account and data.',
          '• Export your records via dashboard or email.',
        ],
      },
      {
        title: '8. Contact',
        body: [
          '• Email: digitalmenu.orderingapp@zohomail.in',
          '• WhatsApp: +91 9563401099',
        ],
      },
    ],
  },
  hi: {
    badge: 'गोपनीयता नीति',
    heading: 'आपकी प्राइवेसी हमारी जिम्मेदारी है',
    updated: 'अपडेट किया गया',
    back: '← होम पर जाएं',
    agree: 'Digital Menu Order इस्तेमाल करके आप इस प्राइवेसी पॉलिसी से सहमत होते हैं।',
    sections: [
      {
        title: '1. हम क्या जानकारी लेते हैं', isQ: true,
        body: [
          'जब आप अकाउंट बनाते हैं, हम केवल जरूरी जानकारी लेते हैं:',
          '• आपका नाम, रेस्टोरेंट का नाम, ईमेल और फोन नंबर।',
          '• आपके मेनू में डाली गई चीजें, कीमतें और फोटो।',
          '• ग्राहकों के ऑर्डर।',
          '• ऐप सुधारने के लिए बेसिक उपयोग जानकारी।',
          'हम कभी पेमेंट कार्ड की जानकारी नहीं लेते — पेमेंट हमारे बाहर होती है।',
        ],
      },
      {
        title: '2. हम यह जानकारी किसलिए काम में लेते हैं', isQ: true,
        body: [
          '• आपका डिजिटल मेनू और ऑर्डर सिस्टम चलाने के लिए।',
          '• हर महीने ऑर्डर और सेल्स की एक रिपोर्ट आपके ईमेल पर भेजने के लिए।',
          '• जरूरी अकाउंट या सिक्योरिटी अपडेट बताने के लिए।',
          '• ऐप में सुधार करने के लिए।',
          'हम आपकी जानकारी किसी को नहीं बेचते।',
        ],
      },
      {
        title: '3. डेटा कितने दिन रखते हैं', isQ: true,
        body: [
          'ऐप तेज और प्राइवेट रहे, इसलिए 30 दिन पुराने ऑर्डर अपने आप हट जाते हैं।',
          'हटाने से पहले पूरी रिपोर्ट आपके ईमेल पर भेज दी जाती है — आपका कोई रिकॉर्ड नहीं जाएगा।',
          '• जब तक अकाउंट चालू है, डेटा सुरक्षित रहता है।',
          '• 30 दिन पुराने ऑर्डर हर महीने खुद-ब-खुद हट जाते हैं।',
          '• हटाने से पहले ईमेल पर रिपोर्ट मिलती है।',
          '• अकाउंट बंद करने पर 30 दिनों में सारा डेटा पूरी तरह हटा दिया जाता है।',
        ],
      },
      {
        title: '4. आपको कौन से ईमेल आएंगे', isQ: true,
        body: [
          '• हर महीने ऑर्डर और सेल्स की रिपोर्ट।',
          '• जब चाहें डैशबोर्ड से डेटा डाउनलोड करें।',
          '• जरूरी अकाउंट या सिक्योरिटी अलर्ट।',
          'गैर-जरूरी ईमेल अकाउंट सेटिंग्स से बंद किए जा सकते हैं।',
        ],
      },
      {
        title: '5. आपका डेटा कितना सुरक्षित है', isQ: true,
        body: [
          'हम इन तरीकों से आपकी जानकारी को सुरक्षित रखते हैं:',
          '• सभी कनेक्शन पर HTTPS एन्क्रिप्शन।',
          '• ईमेल और पासवर्ड से लॉगिन — रजिस्ट्रेशन और पासवर्ड रिसेट पर OTP वेरिफिकेशन।',
          '• सिर्फ आप ही अपने रेस्टोरेंट का डेटा देख सकते हैं।',
          '• नियमित सिक्योरिटी जांच।',
        ],
      },
      {
        title: '6. आपके अधिकार',
        body: [
          '• कभी भी अपना डेटा देखने के लिए कह सकते हैं।',
          '• अपने पैनल से जानकारी ठीक कर सकते हैं।',
          '• अकाउंट और डेटा हटवाने का अनुरोध कर सकते हैं।',
          '• कभी भी ईमेल या डैशबोर्ड से डेटा एक्सपोर्ट करें।',
        ],
      },
      {
        title: '7. संपर्क करें',
        body: [
          '• ईमेल: digitalmenu.orderingapp@zohomail.in',
          '• WhatsApp: +91 9563401099',
        ],
      },
    ],
  },
  bn: {
    badge: 'গোপনীয়তা নীতি',
    heading: 'আপনার তথ্য আমাদের কাছে নিরাপদ',
    updated: 'আপডেট করা হয়েছে',
    back: '← হোমে ফিরুন',
    agree: 'Digital Menu Order ব্যবহার করলে আপনি এই গোপনীয়তা নীতিতে রাজি থাকছেন।',
    sections: [
      {
        title: '১. আমরা কী কী তথ্য নিই', isQ: true,
        body: [
          'অ্যাকাউন্ট খোলার সময় আমরা শুধু দরকারী তথ্যই নিই:',
          '• আপনার নাম, রেস্তোরাঁর নাম, ইমেইল ও ফোন নম্বর।',
          '• মেনুতে যোগ করা খাবার, দাম ও ছবি।',
          '• গ্রাহকদের অর্ডার।',
          '• অ্যাপ উন্নত করতে সাধারণ ব্যবহারের তথ্য।',
          'আমরা কখনো পেমেন্ট কার্ডের তথ্য নিই না — পেমেন্ট আমাদের বাইরে হয়।',
        ],
      },
      {
        title: '২. এই তথ্য দিয়ে আমরা কী করি', isQ: true,
        body: [
          '• আপনার ডিজিটাল মেনু ও অর্ডার সিস্টেম চালানো।',
          '• প্রতি মাসে অর্ডার ও বিক্রির একটি রিপোর্ট আপনার ইমেইলে পাঠানো।',
          '• অ্যাকাউন্ট বা নিরাপত্তা সম্পর্কিত জরুরি আপডেট জানানো।',
          '• অ্যাপের সমস্যা ঠিক করা ও মান বাড়ানো।',
          'আমরা আপনার তথ্য কখনো কাউকে বিক্রি করি না।',
        ],
      },
      {
        title: '৩. ডেটা কতদিন রাখা হয় ও মাসিক পরিষ্কার হয়', isQ: true,
        body: [
          'অ্যাপ দ্রুত ও প্রাইভেট রাখতে ৩০ দিনের পুরোনো অর্ডার রেকর্ড প্রতি মাসে এমনিতেই মুছে যায়।',
          'কিন্তু মুছে ফেলার আগেই আপনার ইমেইলে পুরো রিপোর্ট পাঠানো হয় — কোনো তথ্য হারাবে না।',
          '• অ্যাকাউন্ট চালু থাকলে ডেটা নিরাপদ থাকে।',
          '• ৩০ দিনের বেশি পুরোনো অর্ডার প্রতি মাসে স্বয়ংক্রিয়ভাবে মুছে যায়।',
          '• মুছে ফেলার আগে ইমেইলে রিপোর্ট চলে আসে।',
          '• অ্যাকাউন্ট বন্ধ করলে ৩০ দিনের মধ্যে সব ডেটা মুছে যায়।',
        ],
      },
      {
        title: '৪. কী কী সুবিধা ইমেইলে পাবেন', isQ: true,
        body: [
          '• প্রতি মাসে অর্ডার ও বিক্রির সারসংক্ষেপ রিপোর্ট।',
          '• যখন চাইবেন ড্যাশবোর্ড থেকে ডেটা ডাউনলোড করুন।',
          '• জরুরি অ্যাকাউন্ট বা নিরাপত্তা বিজ্ঞপ্তি।',
          'অপ্রয়োজনীয় ইমেইল অ্যাকাউন্ট সেটিংস থেকে বন্ধ করা যাবে।',
        ],
      },
      {
        title: '৫. আপনার তথ্য কতটা নিরাপদ', isQ: true,
        body: [
          'আমরা আপনার ডেটা এভাবে সুরক্ষিত রাখি:',
          '• সব সংযোগে HTTPS এনক্রিপশন।',
          '• ইমেইল ও পাসওয়ার্ড দিয়ে লগইন — নিবন্ধন ও পাসওয়ার্ড রিসেটে OTP যাচাইকরণ।',
          '• শুধু আপনি নিজেই আপনার রেস্তোরাঁর ডেটা দেখতে পারবেন।',
          '• নিয়মিত নিরাপত্তা পরীক্ষা ও আপডেট।',
        ],
      },
      {
        title: '৬. আপনার অধিকার',
        body: [
          '• যেকোনো সময় আপনার ডেটার কপি চাইতে পারবেন।',
          '• অ্যাডমিন প্যানেল থেকে ভুল তথ্য ঠিক করুন।',
          '• অ্যাকাউন্ট ও ডেটা মুছে ফেলতে আমাদের জানান।',
          '• ড্যাশবোর্ড বা ইমেইলে যেকোনো সময় ডেটা এক্সপোর্ট করুন।',
        ],
      },
      {
        title: '৭. যোগাযোগ',
        body: [
          '• ইমেইল: digitalmenu.orderingapp@zohomail.in',
          '• WhatsApp: +91 9563401099',
        ],
      },
    ],
  },
};

export default function PrivacyPolicyPage() {
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
                    <Link href="/auth?mode=register" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hidden sm:block">
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
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-5">
            <FaShieldAlt />{c.badge}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-gray-900 mb-3">{c.heading}</h1>
          <p className="text-gray-400 text-sm font-medium">{c.updated}: {dateStr}</p>
        </div>

        <div className="space-y-8">
          {c.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight mb-3 pb-3 border-b border-gray-100 flex items-center gap-2">
                {section.title}
                {section.isQ && (
                  <FaQuestionCircle className="text-indigo-400 shrink-0 text-base" aria-label="question" />
                )}
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
