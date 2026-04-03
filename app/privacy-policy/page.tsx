'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaQrcode, FaArrowRight, FaShieldAlt, FaQuestionCircle } from 'react-icons/fa';

type Lang = 'en' | 'hi' | 'bn';

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
          'Any privacy questions? Reach us:',
          '• Email: sahin401099@gmail.com',
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
          'कोई सवाल हो तो हमसे बात करें:',
          '• ईमेल: sahin401099@gmail.com',
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
          'কোনো প্রশ্ন থাকলে আমাদের সাথে কথা বলুন:',
          '• ইমেইল: sahin401099@gmail.com',
          '• WhatsApp: +91 9563401099',
        ],
      },
    ],
  },
};

export default function PrivacyPolicyPage() {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('digitalmenu_lang') as Lang;
    if (saved && content[saved]) setLang(saved);
  }, []);

  const handleLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('digitalmenu_lang', l);
  };

  const c = content[lang];
  const dateStr = new Date().toLocaleDateString(
    lang === 'bn' ? 'bn-BD' : lang === 'hi' ? 'hi-IN' : 'en-IN',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <div className={`min-h-screen bg-white text-gray-900 ${lang === 'hi' ? 'font-hindi' : lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/80 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center space-x-2.5 shrink-0">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <FaQrcode className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 hidden sm:block">
              Digital Menu Order
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['en', 'hi', 'bn'] as Lang[]).map((l) => (
                <button key={l} onClick={() => handleLang(l)}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all ${lang === l ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <Link href="/" className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors whitespace-nowrap">
              {c.back}
            </Link>
          </div>
        </div>
      </nav>

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
