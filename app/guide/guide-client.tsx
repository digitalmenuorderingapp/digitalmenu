'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaQrcode, FaUtensils, FaChartLine, FaArrowRight, FaArrowLeft,
  FaCheckCircle, FaStore, FaListUl, FaWalking, FaMoneyBillWave,
  FaInfoCircle, FaRocket, FaGlobe
} from 'react-icons/fa';
import { TRANSLATIONS, Language } from '../../utils/translations';
import { BrandLoader } from '@/components/ui/BrandLoader';

export default function GuideClient() {
  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState('setup');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('digitalmenu_lang') as Language;
    if (saved && TRANSLATIONS[saved]) {
      setLang(saved);
    }
  }, []);

  if (!mounted) return <BrandLoader />;

  const t = TRANSLATIONS[lang];

  const handleLanguageChange = (l: Language) => {
    setLang(l);
    localStorage.setItem('digitalmenu_lang', l);
  };

  const sections = [
    { id: 'setup', icon: <FaStore />, title: t.guide_nav_setup, color: 'indigo' },
    { id: 'menu', icon: <FaListUl />, title: t.guide_nav_menu, color: 'purple' },
    { id: 'tables', icon: <FaQrcode />, title: t.guide_nav_tables, color: 'blue' },
    { id: 'orders', icon: <FaWalking />, title: t.guide_nav_orders, color: 'orange' },
    { id: 'audit', icon: <FaChartLine />, title: t.guide_nav_audit, color: 'emerald' },
  ];

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${lang === 'hi' ? 'font-hindi' : lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-[100] backdrop-blur-xl bg-white/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="p-2 bg-indigo-600 rounded-lg group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-100">
                <FaArrowLeft className="text-white text-xs" />
              </div>
              <span className="text-sm font-black text-slate-500 uppercase tracking-widest hidden sm:block">Back</span>
            </Link>

            <div className="flex items-center space-x-4">
              <div className="flex bg-slate-100 rounded-lg p-1">
                {['en', 'hi', 'bn'].map((l) => (
                  <button
                    key={l}
                    onClick={() => handleLanguageChange(l as Language)}
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${lang === l ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        
        {/* --- HERO --- */}
        <div className="text-center mb-12 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-indigo-100"
          >
            <FaRocket className="animate-bounce" />
            <span>{t.guide_title}</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6"
          >
            {t.guide_title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-2xl text-slate-500 max-w-3xl mx-auto font-medium"
          >
            {t.guide_subtitle}
          </motion.p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          
          {/* --- SIDE NAVIGATION --- */}
          <aside className="lg:w-64 shrink-0">
            <nav className="sticky top-28 space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all border ${
                    activeTab === section.id 
                    ? 'bg-white border-indigo-100 shadow-xl shadow-indigo-100/50 text-indigo-600' 
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-white hover:border-slate-100'
                  }`}
                >
                  <span className={`text-xl ${activeTab === section.id ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
                    {section.icon}
                  </span>
                  <span className="font-black text-sm tracking-tight">{section.title}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* --- CONTENT AREA --- */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-10 pb-20"
              >
                {activeTab === 'setup' && (
                  <GuideSection 
                    title={t.guide_setup_t}
                    desc={t.guide_setup_d}
                    steps={[t.guide_setup_s1, t.guide_setup_s2, t.guide_setup_s3]}
                    variant="indigo"
                  />
                )}
                {activeTab === 'menu' && (
                  <GuideSection 
                    title={t.guide_menu_t}
                    desc={t.guide_menu_d}
                    steps={[t.guide_menu_s1, t.guide_menu_s2, t.guide_menu_s3]}
                    variant="purple"
                  />
                )}
                {activeTab === 'tables' && (
                  <GuideSection 
                    title={t.guide_tables_t}
                    desc={t.guide_tables_d}
                    steps={[t.guide_tables_s1, t.guide_tables_s2, t.guide_tables_s3]}
                    variant="blue"
                  />
                )}
                {activeTab === 'orders' && (
                  <GuideSection 
                    title={t.guide_orders_t}
                    desc={t.guide_orders_d}
                    steps={[t.guide_orders_s1, t.guide_orders_s2, t.guide_orders_s3]}
                    variant="orange"
                  />
                )}
                {activeTab === 'audit' && (
                  <GuideSection 
                    title={t.guide_audit_t}
                    desc={t.guide_audit_d}
                    steps={[t.guide_audit_s1, t.guide_audit_s2, t.guide_audit_s3]}
                    variant="emerald"
                  />
                )}

                {/* --- NAVIGATION BUTTONS --- */}
                <div className="flex justify-between items-center pt-10 border-t border-slate-200">
                  <button 
                    onClick={() => {
                      const idx = sections.findIndex(s => s.id === activeTab);
                      if (idx > 0) setActiveTab(sections[idx-1].id);
                    }}
                    disabled={activeTab === 'setup'}
                    className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors font-bold"
                  >
                    <FaArrowLeft />
                    <span>Previous</span>
                  </button>
                  <button 
                    onClick={() => {
                      const idx = sections.findIndex(s => s.id === activeTab);
                      if (idx < sections.length - 1) setActiveTab(sections[idx+1].id);
                    }}
                    disabled={activeTab === 'audit'}
                    className="flex items-center space-x-2 text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-xl transition-all font-black text-lg disabled:opacity-0"
                  >
                    <span>Next Phase</span>
                    <FaArrowRight />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 py-16 text-center text-white mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-8">Ready to start?</h2>
          <Link href="/auth" className="inline-block bg-indigo-600 px-12 py-5 rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/20">
            {t.nav_getStarted}
          </Link>
        </div>
      </footer>
    </div>
  );
}

function GuideSection({ title, desc, steps, variant }: { title: string, desc: string, steps: string[], variant: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-600 shadow-indigo-100',
    purple: 'bg-purple-600 shadow-purple-100',
    blue: 'bg-blue-600 shadow-blue-100',
    orange: 'bg-orange-600 shadow-orange-100',
    emerald: 'bg-emerald-600 shadow-emerald-100',
  };

  const bgColors: Record<string, string> = {
    indigo: 'bg-indigo-50/50 border-indigo-100',
    purple: 'bg-purple-50/50 border-purple-100',
    blue: 'bg-blue-50/50 border-blue-100',
    orange: 'bg-orange-50/50 border-orange-100',
    emerald: 'bg-emerald-50/50 border-emerald-100',
  };

  const textColors: Record<string, string> = {
    indigo: 'text-indigo-600',
    purple: 'text-purple-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    emerald: 'text-emerald-600',
  };

  return (
    <div className="space-y-8">
      <div className={`p-8 md:p-12 rounded-[2.5rem] border ${bgColors[variant]} relative overflow-hidden backdrop-blur-sm`}>
        <div className={`absolute -top-10 -right-10 w-40 h-40 ${colors[variant]} opacity-10 rounded-full blur-3xl`} />
        
        <h2 className={`text-2xl md:text-4xl font-black mb-4 md:mb-6 tracking-tight ${variant === 'emerald' ? 'text-emerald-700' : 'text-slate-900'}`}>{title}</h2>
        <p className="text-base md:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">{desc}</p>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-start space-x-4 md:space-x-6 p-6 md:p-8 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className={`w-10 h-10 md:w-14 md:h-14 shrink-0 rounded-2xl ${colors[variant]} flex items-center justify-center text-white text-base md:text-xl font-bold shadow-lg group-hover:scale-110 transition-transform`}>
              {idx + 1}
            </div>
            <div className="pt-1.5 md:pt-3">
              <p className="text-base md:text-xl font-black text-slate-800 tracking-tight leading-tight">{step}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-6 bg-slate-900 rounded-3xl text-white flex items-center space-x-4">
        <FaInfoCircle className={textColors[variant]} />
        <p className="text-sm font-bold opacity-80 italic">Pro-Tip: Keep your dashboard open on a tablet for the best real-time order monitoring.</p>
      </div>
    </div>
  );
}
