'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaQrcode, FaArrowRight, FaShieldAlt, FaQuestionCircle,
  FaWhatsapp, FaEnvelope, FaHeart, FaRocket, FaUsers
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { TRANSLATIONS, Language } from '../../utils/translations';
import { Skeleton } from '@/components/ui/Skeleton';

type Lang = Language;

export default function WhyFreePage() {
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-14 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6">
            <FaHeart className="text-[10px]" /> {t.why_free_badge}
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-gray-900 mb-6 leading-[0.9]">{t.why_free_title}</h1>
          <p className="text-xl sm:text-2xl text-indigo-600 font-bold tracking-tight">{t.why_free_headline}</p>
        </motion.div>

        <section className="space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gray-50 rounded-[2.5rem] p-8 md:p-12 border border-gray-100 flex flex-col md:flex-row gap-8 items-center"
          >
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
              <FaUsers className="text-3xl text-white" />
            </div>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed font-medium">
              {t.why_free_body1}
            </p>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="bg-indigo-600 rounded-[2.5rem] p-8 md:p-12 text-white flex flex-col md:flex-row gap-8 items-center shadow-2xl shadow-indigo-200"
          >
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center shrink-0 backdrop-blur-sm">
              <FaRocket className="text-3xl text-white" />
            </div>
            <p className="text-lg sm:text-xl text-indigo-50 leading-relaxed font-medium">
              {t.why_free_body2}
            </p>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="bg-white rounded-[2.5rem] p-8 md:p-12 border-4 border-dashed border-gray-100 flex flex-col md:flex-row gap-8 items-center"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center shrink-0">
              <FaShieldAlt className="text-3xl text-gray-400" />
            </div>
            <p className="text-lg sm:text-xl text-gray-500 leading-relaxed font-medium italic">
              {t.why_free_body3}
            </p>
          </motion.div>
        </section>

        <div className="mt-20 pt-10 border-t border-gray-100 text-center">
          <Link href="/auth?mode=register" className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
            {t.nav_getStarted} <FaArrowRight className="text-sm" />
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
