'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  FaQrcode, FaUtensils, FaChartLine, FaMobileAlt, FaClock,
  FaShieldAlt, FaCheckCircle, FaTimesCircle, FaArrowRight,
  FaWhatsapp, FaEnvelope, FaServer, FaDatabase, FaLock, FaSyncAlt,
  FaExclamationCircle, FaIdCard, FaMapMarkerAlt, FaGlobe, FaUserSecret,
  FaExclamationTriangle, FaExpandArrowsAlt, FaTrash, FaImage
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { FaSpinner } from 'react-icons/fa';
import { TRANSLATIONS, Language } from '../../utils/translations';
import { BrandLoader } from '@/components/ui/BrandLoader';
import { Skeleton } from '@/components/ui/Skeleton';

export default function MarketingHomeClient() {
  const { isLoading, isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lang, setLang] = useState<Language>('en');

  // Persistence for language
  useEffect(() => {
    const saved = localStorage.getItem('digitalmenu_lang') as Language;
    if (saved && TRANSLATIONS[saved]) {
      setLang(saved);
    }
  }, []);

  const handleLanguageChange = (l: Language) => {
    setLang(l);
    localStorage.setItem('digitalmenu_lang', l);
  };

  const t = TRANSLATIONS[lang];

  const HERO_SLIDES = [
    {
      id: 1,
      headline: t.hero_headline_1,
      subtext: t.hero_subtext_1,
      cta: t.hero_cta_1,
      secondaryCta: t.hero_secondary_1,
      gradient: "from-blue-600 to-indigo-700",
    },
    {
      id: 2,
      headline: t.hero_headline_2,
      subtext: t.hero_subtext_2,
      cta: t.hero_cta_2,
      secondaryCta: t.hero_secondary_2,
      gradient: "from-indigo-600 to-purple-600",
    },
    {
      id: 3,
      headline: t.hero_headline_3,
      subtext: t.hero_subtext_3,
      cta: t.hero_cta_3,
      secondaryCta: t.hero_secondary_3,
      gradient: "from-purple-600 to-pink-600",
    }
  ];

  // Auto-slide logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Removed full-page loader to enable skeletons
  // if (isLoading) {
  //   return <BrandLoader />;
  // }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen bg-white text-gray-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden ${lang === 'hi' ? 'font-hindi' : lang === 'bn' ? 'font-bengali' : 'font-sans'}`}
    >

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
                <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
                  <FaQrcode className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tighter">
                  Digital Menu 
                </span>
              </motion.div>

              <div className="hidden md:flex items-center space-x-10">
                <NavItem href="#platform" label={t.nav_platform} />
                <NavItem href="#features" label={t.nav_features} />
                <NavItem href="#trust" label={t.nav_trust} />
                <NavItem href="#pricing" label={t.nav_pricing} />
              </div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-4"
              >
                {/* Language Toggle - Desktop Only */}
                <div className="hidden md:flex bg-gray-100 rounded-lg p-1 mr-2">
                  <button onClick={() => handleLanguageChange('en')} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'en' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>EN</button>
                  <button onClick={() => handleLanguageChange('hi')} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'hi' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>HI</button>
                  <button onClick={() => handleLanguageChange('bn')} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'bn' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>BN</button>
                </div>

                {isLoading ? (
                  <Skeleton width={100} height={40} className="rounded-xl" />
                ) : isAuthenticated ? (
                  <Link href="/admin/dashboard" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200">
                    {t.nav_dashboard}
                  </Link>
                ) : (
                  <>
                    <Link href="/auth" className="text-sm font-bold text-gray-600 hover:text-indigo-600">
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
                <button onClick={() => handleLanguageChange('en')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${lang === 'en' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>English</button>
                <button onClick={() => handleLanguageChange('hi')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${lang === 'hi' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>हिन्दी</button>
                <button onClick={() => handleLanguageChange('bn')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${lang === 'bn' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>বাংলা</button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* --- HERO SECTION --- */}
        <section className="relative h-screen min-h-[750px] flex items-center bg-white overflow-hidden ">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className={`absolute inset-0 bg-gradient-to-br ${HERO_SLIDES[currentSlide].gradient}`}
              style={{ opacity: 0.95 }}
            />
          </AnimatePresence>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full pt-12 md:pt-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="z-10 py-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <motion.span
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className={`inline-block px-5 py-2 bg-white/10 text-white text-[11px] font-black rounded-full mb-8 uppercase backdrop-blur-sm border border-white/10 ${lang === 'en' ? 'tracking-[0.25em]' : 'tracking-normal'}`}
                    >
                      {t.hero_badge}
                    </motion.span>
                    <h1 className={`text-5xl md:text-7xl lg:text-[84px] font-black text-white leading-[1.05] mb-8 tracking-[-0.04em] ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>
                      {HERO_SLIDES[currentSlide].headline}
                    </h1>
                    <p className={`text-2xl text-indigo-50/80 mb-12 max-w-xl font-medium ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>
                      {HERO_SLIDES[currentSlide].subtext}
                    </p>
                    <div className="flex flex-wrap gap-6">
                      <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
                        <Link href="/auth?mode=register" className="bg-white text-indigo-600 px-12 py-6 rounded-2xl font-black text-xl transition-all shadow-2xl flex items-center">
                          {HERO_SLIDES[currentSlide].cta}
                          <FaArrowRight className="ml-4" aria-hidden="true" />
                        </Link>
                      </motion.div>
                      <motion.button
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-12 py-6 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-2xl font-black text-xl transition-all flex items-center backdrop-blur-xl"
                        aria-label="View Product Demo"
                      >
                        {HERO_SLIDES[currentSlide].secondaryCta}
                      </motion.button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="relative hidden lg:block" aria-hidden="true">
                <motion.div
                  initial={{ scale: 0.9, rotate: -2, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className="relative z-10"
                >
                  <div className="bg-white/60 backdrop-blur-3xl border border-white/40 p-12 rounded-[5rem] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.18)] relative overflow-hidden">
                    <div className="flex justify-between items-center mb-10">
                      <div className="flex space-x-3">
                        <div className="w-4 h-4 bg-red-400 rounded-full" />
                        <div className="w-4 h-4 bg-yellow-400 rounded-full" />
                        <div className="w-4 h-4 bg-green-400 rounded-full" />
                      </div>
                      <div className="text-xs text-gray-400 font-bold uppercase tracking-widest bg-gray-100/50 px-4 py-1.5 rounded-full">digitalmenuorder.vercel.app</div>
                    </div>
                    <div className="space-y-8">
                      <div className="h-6 bg-gray-200/50 rounded-full w-3/4" />
                      <div className="grid grid-cols-2 gap-8">
                        <div className="h-40 bg-indigo-500/5 rounded-[2.5rem]" />
                        <div className="h-40 bg-purple-500/5 rounded-[2.5rem]" />
                      </div>
                      <div className="h-60 bg-gray-50 rounded-[3rem]" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex space-x-4" role="tablist" aria-label="Hero slides">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                role="tab"
                aria-selected={currentSlide === idx}
                aria-label={`Switch to slide ${idx + 1}`}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-700 ${currentSlide === idx ? 'bg-indigo-600 w-24' : 'bg-gray-200 w-12 hover:bg-indigo-300'}`}
              />
            ))}
          </div>
        </section>

        {/* --- STRATEGIC PIVOT: PROBLEMS WITH PRINTED MENUS (FULL SCREEN) --- */}
        <section id="crisis" className="min-h-[90vh] py-32 bg-slate-900 border-t items-center flex relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full mt-10">
            <div className="text-center mb-20">
              <span className={`text-red-400 font-black text-xs uppercase mb-6 block ${lang === 'en' ? 'tracking-[0.3em]' : 'tracking-normal'}`}>{t.crisis_badge}</span>
              <h2 className={`text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter mb-8 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{t.crisis_title}</h2>
              <p className={`text-2xl text-slate-400 max-w-3xl mx-auto ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>{t.crisis_desc}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ProblemFocusedCard icon={<FaMoneyBillWave />} title={t.crisis_prob1_t} desc={t.crisis_prob1_d} lang={lang} />
              <ProblemFocusedCard icon={<FaExclamationTriangle />} title={t.crisis_prob2_t} desc={t.crisis_prob2_d} lang={lang} />
              <ProblemFocusedCard icon={<FaExpandArrowsAlt />} title={t.crisis_prob3_t} desc={t.crisis_prob3_d} lang={lang} />
              <ProblemFocusedCard icon={<FaTrash />} title={t.crisis_prob4_t} desc={t.crisis_prob4_d} lang={lang} />
              <ProblemFocusedCard icon={<FaImage />} title={t.crisis_prob5_t} desc={t.crisis_prob5_d} lang={lang} />
              <ProblemFocusedCard icon={<FaClock />} title={t.crisis_prob6_t} desc={t.crisis_prob6_d} lang={lang} />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="mt-20 p-8 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-3xl border border-red-500/20 backdrop-blur-md text-center max-w-6xl mx-auto"
            >
              <h3 className="text-2xl md:text-4xl font-black text-rose-100 tracking-tight">{t.crisis_highlight}</h3>
            </motion.div>
          </div>
        </section>

        {/* --- LIFETIME FREE OFFER (SEPARATE SECTION) --- */}
        <section id="pricing" className="py-32 bg-gray-50 relative overflow-hidden flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 w-full relative">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-white rounded-3xl md:rounded-[4rem] p-8 md:p-16 shadow-[0_50px_100px_-20px_rgba(79,70,229,0.15)] border-4 border-indigo-600 relative z-10 text-center">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 md:px-8 py-2 md:py-2.5 rounded-full font-black text-[10px] md:text-sm uppercase tracking-widest shadow-xl whitespace-nowrap">
                  {t.offer_badge}
                </div>
                <span className="text-sm font-bold text-gray-900">Digital Menu Order</span>
                <div className="text-6xl md:text-8xl font-black text-gray-900 mb-4 md:mb-6 tracking-tighter uppercase italic">{t.offer_free}</div>
                <p className="text-lg md:text-xl text-gray-500 font-bold mb-6 md:mb-8">{t.offer_desc_p1} <br className="hidden md:block" /> {t.offer_desc_p2}</p>
                
                <div className={`mb-8 md:mb-10 p-4 md:p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 text-indigo-700 text-xs md:text-sm font-bold inline-block mx-auto max-w-lg ${lang !== 'en' ? 'indic-spacing' : ''}`}>
                   {t.offer_limit}
                </div>

                <div className="block">
                  <Link href="/auth?mode=register" className="inline-block w-full md:w-auto px-10 md:px-16 py-5 md:py-6 bg-indigo-600 text-white rounded-2xl md:rounded-[2rem] font-black text-xl md:text-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 mb-6 md:mb-8">
                    {t.offer_cta}
                  </Link>
                </div>
                <div className="flex items-center justify-center space-x-3 text-sm font-bold text-gray-400 group cursor-pointer" role="button" aria-label="Learn more about our free offer">
                  <span>{t.offer_learn}</span>
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-indigo-100 rounded-full blur-[100px] -z-10" aria-hidden="true" />
            </motion.div>
          </div>
        </section>

        {/* --- CORE PLATFORM: SOLUTION + STEPS --- */}
        <section id="platform" className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-24">
              <span className={`text-indigo-600 font-black text-xs uppercase mb-6 block ${lang === 'en' ? 'tracking-[0.3em]' : 'tracking-normal'}`}>{t.platform_badge}</span>
              <h2 className={`text-6xl md:text-7xl font-black text-gray-900 tracking-tighter mb-10 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{t.platform_title}</h2>
              <p className={`text-2xl text-gray-500 max-w-3xl mx-auto ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>
                {t.platform_desc}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="bg-indigo-600 rounded-[5rem] p-16 text-white text-left relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]" aria-hidden="true" />
                <h3 className="text-4xl font-black mb-12 flex items-center">
                  <FaMobileAlt className="mr-4" aria-hidden="true" /> {t.platform_setup}
                </h3>
                <div className="space-y-12 relative z-10">
                  <MiniStep num="1" title={t.plat_step1_title} desc={t.plat_step1_desc} lang={lang} />
                  <MiniStep num="2" title={t.plat_step2_title} desc={t.plat_step2_desc} lang={lang} />
                  <MiniStep num="3" title={t.plat_step3_title} desc={t.plat_step3_desc} lang={lang} />
                  <MiniStep num="4" title={t.plat_step4_title} desc={t.plat_step4_desc} lang={lang} />
                </div>
              </div>

              <div className="relative group" aria-hidden="true">
                <div className="bg-gray-100 rounded-[4.5rem] p-4 group-hover:scale-[1.02] transition-transform duration-700 shadow-2xl">
                  <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-inner p-10 h-[600px] flex items-center justify-center">
                    <div className="w-full h-full border-8 border-gray-50 rounded-[2.5rem] flex items-center justify-center relative bg-white">
                      <FaUtensils className="text-[150px] text-indigo-50" />
                      <div className="absolute inset-0 flex flex-col justify-end p-10">
                        <div className="h-12 bg-indigo-600 rounded-2xl w-full mb-4 shadow-xl" />
                        <div className="h-4 bg-gray-100 rounded-full w-2/3 mx-auto" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating tags */}
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -top-10 -right-10 bg-white p-6 rounded-3xl shadow-2xl border border-gray-100">
                  <FaCheckCircle className="text-green-500 text-3xl mb-2" />
                  <div className="font-black text-sm">{t.plat_float1}</div>
                </motion.div>
                <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0.5 }} className="absolute -bottom-5 -left-5 bg-white p-6 rounded-3xl shadow-2xl border border-gray-100">
                  <FaClock className="text-indigo-500 text-3xl mb-2" />
                  <div className="font-black text-sm">{t.plat_float2}</div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* --- CUSTOMER EXPERIENCE: FRICTIONLESS JOURNEY --- */}
        <section id="customer-journey" className="py-32 bg-indigo-50/50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-24">
              <span className={`text-indigo-600 font-black text-xs uppercase mb-6 block ${lang === 'en' ? 'tracking-[0.3em]' : 'tracking-normal'}`}>{t.cust_exp_badge}</span>
              <h2 className={`text-5xl md:text-7xl font-black text-gray-900 tracking-tighter mb-10 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{t.cust_exp_title}</h2>
              <p className={`text-2xl text-gray-500 max-w-4xl mx-auto ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>
                {t.cust_exp_desc}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-indigo-100/50 hover:shadow-2xl transition-all">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl mb-10 shadow-lg shadow-indigo-200">
                  <FaQrcode />
                </div>
                <h3 className={`text-3xl font-black text-gray-900 mb-6 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{t.cust_step1_t}</h3>
                <p className={`text-xl text-gray-500 ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>{t.cust_step1_d}</p>
              </div>

              <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-indigo-100/50 hover:shadow-2xl transition-all">
                <div className="w-20 h-20 bg-purple-600 rounded-3xl flex items-center justify-center text-white text-4xl mb-10 shadow-lg shadow-purple-200">
                  <FaUtensils />
                </div>
                <h3 className={`text-3xl font-black text-gray-900 mb-6 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{t.cust_step2_t}</h3>
                <p className={`text-xl text-gray-500 ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>{t.cust_step2_d}</p>
              </div>

              <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-indigo-100/50 hover:shadow-2xl transition-all">
                <div className="w-20 h-20 bg-green-600 rounded-3xl flex items-center justify-center text-white text-4xl mb-10 shadow-lg shadow-green-200">
                  <FaCheckCircle />
                </div>
                <h3 className={`text-3xl font-black text-gray-900 mb-6 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{t.cust_step3_t}</h3>
                <p className={`text-xl text-gray-500 ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>{t.cust_step3_d}</p>
              </div>
            </div>

            {/* No-App Highlight */}
            <div className="mt-24 text-center">
              <div className="inline-flex items-center space-x-4 bg-white px-8 py-4 rounded-full border border-indigo-100 shadow-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-lg font-bold text-gray-900">Digital Menu Order</span>
                <span className="text-lg font-black text-indigo-900 tracking-tight">No App Downloads Required. Works on every Browser.</span>
              </div>
            </div>
          </div>
        </section>

        {/* --- THE SAAS ENGINE: FEATURES --- */}
        <section id="features" className="py-32 bg-indigo-950 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" aria-hidden="true" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-24">
              <span className={`text-indigo-400 font-black text-xs uppercase mb-6 block ${lang === 'en' ? 'tracking-[0.3em]' : 'tracking-normal'}`}>{t.feat_badge}</span>
              <h2 className={`text-6xl md:text-[80px] font-black text-white tracking-tighter mb-10 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{t.feat_title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <FeatureCard
                icon={<FaSyncAlt aria-hidden="true" />}
                title={t.feat1_title}
                desc={t.feat1_desc}
                lang={lang}
              />
              <FeatureCard
                icon={<FaChartLine aria-hidden="true" />}
                title={t.feat2_title}
                desc={t.feat2_desc}
                lang={lang}
              />
              <FeatureCard
                icon={<FaShieldAlt aria-hidden="true" />}
                title={t.feat3_title}
                desc={t.feat3_desc}
                lang={lang}
              />
              <FeatureCard
                icon={<FaDatabase aria-hidden="true" />}
                title={t.feat4_title}
                desc={t.feat4_desc}
                lang={lang}
              />
              <FeatureCard
                icon={<FaUtensils aria-hidden="true" />}
                title={t.feat5_title}
                desc={t.feat5_desc}
                lang={lang}
              />
              <FeatureCard
                icon={<FaUserSecret aria-hidden="true" />}
                title={t.feat6_title}
                desc={t.feat6_desc}
                lang={lang}
              />
            </div>
          </div>
        </section>

        {/* --- TRUST ECOSYSTEM: ARCH + SECURITY + DATA + DEV --- */}
        <section id="trust" className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-stretch">

              {/* Column 1: Technology & Privacy */}
              <div className="space-y-20">
                <article>
                  <span className={`text-indigo-600 font-black text-xs uppercase mb-6 block ${lang === 'en' ? 'tracking-[0.3em]' : 'tracking-normal'}`}>{t.trust_badge}</span>
                  <h2 className={`text-5xl font-black text-gray-900 tracking-tighter mb-8 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{t.trust_title_p1} <br /> {t.trust_title_p2}</h2>
                  <p className={`text-xl text-gray-500 font-medium mb-10 ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>
                    {t.trust_desc}
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    <TechToken icon={<FaServer aria-hidden="true" />} label={t.trust_tech1} />
                    <TechToken icon={<FaDatabase aria-hidden="true" />} label={t.trust_tech2} />
                    <TechToken icon={<FaLock aria-hidden="true" />} label={t.trust_tech3} />
                    <TechToken icon={<FaCheckCircle aria-hidden="true" />} label={t.trust_tech4} />
                  </div>
                </article>

                <div className="bg-gray-50 p-12 rounded-[4rem] border border-gray-100 flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
                  <FaShieldAlt className="text-4xl text-indigo-600 mb-8" aria-hidden="true" />
                  <blockquote className={`text-2xl font-black text-gray-800 italic group-hover:scale-[1.02] transition-transform ${lang !== 'en' ? 'indic-spacing' : 'leading-snug'}`}>
                    {t.trust_quote}
                  </blockquote>
                </div>
              </div>

              {/* Column 2: Developer & Security Manifest */}
              <div className="flex flex-col">
                <div className="bg-indigo-950 rounded-[4.5rem] p-16 text-white flex-1 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-[100px]" aria-hidden="true" />
                  <div>
                    <h3 className="text-3xl font-black mb-10 flex items-center tracking-tight">
                      <FaLock className="mr-4 text-indigo-400" aria-hidden="true" /> {t.sec_manifest}
                    </h3>
                    <div className="space-y-8">
                      <SimpleSecurityPoint title={t.sec1_title} desc={t.sec1_desc} lang={lang} />
                      <SimpleSecurityPoint title={t.sec2_title} desc={t.sec2_desc} lang={lang} />
                      <SimpleSecurityPoint title={t.sec3_title} desc={t.sec3_desc} lang={lang} />
                    </div>
                  </div>

                  <div className="mt-16 pt-16 border-t border-white/10">
                    <div className="flex items-center space-x-6">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">
                        <FaIdCard className="text-indigo-400" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">{t.sec_dev}</div>
                        <div className="text-xl font-black tracking-tight" translate="no">Sahin Arman</div>
                        <div className="text-xs text-white/40 font-bold tracking-widest mt-1">sahin401099@gmail.com</div>
                        <div className="text-xs text-white/40 font-bold tracking-widest mt-0.5">+91 9563401099</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- CTA SECTION --- */}
        <section className="py-24 bg-white" aria-labelledby="cta-heading">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-indigo-600 rounded-[4rem] px-10 py-20 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" aria-hidden="true" />
              <h2 id="cta-heading" className={`text-5xl md:text-6xl font-black tracking-tighter mb-10 relative z-10 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{t.cta_title_p1} <br /> {t.cta_title_p2}</h2>
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-6 sm:space-y-0 sm:space-x-8 relative z-10">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Link href="/auth?mode=register" className="px-12 py-6 bg-white text-indigo-600 rounded-2xl font-black text-xl shadow-2xl hover:bg-gray-50 transition-all flex items-center">
                    {t.cta_btn}
                  </Link>
                </motion.div>
                <button
                  onClick={() => window.open('https://wa.me/919563401099', '_blank')}
                  className="flex items-center space-x-3 text-xl font-bold group"
                  aria-label="Contact support on WhatsApp"
                >
                  <FaWhatsapp className="text-3xl" aria-hidden="true" />
                  <span>{t.cta_chat}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white pt-20 pb-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex flex-col items-center mb-12">
            <div className="p-3 bg-indigo-600 rounded-2xl mb-6">
              <FaQrcode className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <span className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              digitalmenuorder.vercel.app
            </span>
          </div>
          <nav className={`flex justify-center space-x-12 text-sm font-black text-gray-400 mb-12 uppercase ${lang === 'en' ? 'tracking-[0.3em]' : 'tracking-normal font-medium'}`} aria-label="Footer navigation">
            <Link href="#" className="hover:text-indigo-600">{t.foot_privacy}</Link>
            <Link href="#" className="hover:text-indigo-600">{t.foot_terms}</Link>
            <Link href="#" className="hover:text-indigo-600">{t.foot_api}</Link>
          </nav>
          <div className={`text-gray-300 font-bold text-sm uppercase ${lang === 'en' ? 'tracking-widest' : 'tracking-normal'}`}>
            &copy; {new Date().getFullYear()} {t.foot_rights}
          </div>
        </div>
      </footer>

    </motion.div>
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


function MiniStep({ num, title, desc, lang }: { num: string, title: string, desc: string, lang: string }) {
  return (
    <div className="flex space-x-8 items-start group">
      <div className="text-4xl font-black text-white/20 select-none group-hover:text-white transition-colors" aria-hidden="true">{num}</div>
      <div>
        <h4 className={`text-2xl font-black mb-2 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{title}</h4>
        <p className={`text-indigo-100/60 text-lg ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>{desc}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, lang }: { icon: React.ReactNode, title: string, desc: string, lang: string }) {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      className="p-12 bg-white/5 backdrop-blur-xl rounded-[4rem] border border-white/5 hover:border-indigo-500/30 transition-all group"
    >
      <div className="mb-10 text-4xl text-indigo-400 transform group-hover:scale-110 group-hover:rotate-6 transition-all" aria-hidden="true">{icon}</div>
      <h3 className={`text-2xl font-black text-white mb-6 tracking-tight ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{title}</h3>
      <p className={`text-indigo-100/40 text-lg font-medium ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>{desc}</p>
    </motion.div>
  );
}

function TechToken({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
      <div className="text-indigo-600 mr-4 text-xl group-hover:scale-110 transition-transform" aria-hidden="true">{icon}</div>
      <span className="text-sm font-black text-gray-700 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function SimpleSecurityPoint({ title, desc, lang }: { title: string, desc: string, lang: string }) {
  return (
    <div className="flex items-start">
      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 mr-6 shrink-0" aria-hidden="true" />
      <div>
        <div className={`font-black text-white text-lg tracking-tight mb-1 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{title}</div>
        <div className={`text-indigo-100/40 text-sm font-medium ${lang !== 'en' ? 'indic-spacing' : ''}`}>{desc}</div>
      </div>
    </div>
  );
}

function FaMoneyBillWave(props: any) {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" height="1em" width="1em" {...props}>
      <path d="M621.16 54.46C582.37 38.19 543.55 32 504.75 32c-123.17-.01-246.33 62.27-369.5 62.27-30.56 0-61.1-4.72-91.66-14.16-4.14-1.28-8.54.44-10.7 4.14L3.44 135.2c-2.45 4.2-1.84 9.47 1.5 13.01l99.3 105.28c2.4 2.55 6.09 3.65 9.43 2.62 43.14-13.25 86.26-19.86 129.33-19.88 123.17 0 246.33 62.27 369.5 62.27 30.56 0 61.1-4.72 91.66-14.16 4.14-1.28 8.54.44 10.7-4.14l29.15-50.94c2.45-4.2 1.84-9.47-1.5-13.01L532.19 111.02c-2.4-2.55-6.09-3.65-9.43-2.62-43.14 13.25-86.26 19.86-129.33 19.88-123.17 0-246.33-62.27-369.5-62.27-30.56 0-61.1 4.72-91.66 14.16-4.14 1.28-8.54-.44-10.7 4.14L3.44 135.2c-2.45 4.2-1.84 9.47 1.5 13.01l99.3 105.28c2.4 2.55 6.09 3.65 9.43 2.62 43.14-13.25 86.26-19.86 129.33-19.88 123.17 0 246.33 62.27 369.5 62.27 30.56 0 61.1-4.72 91.66-14.16 4.14-1.28 8.54.44 10.7-4.14l29.15-50.94c2.45-4.2 1.84-9.47-1.5-13.01L532.19 111.02c-2.4-2.55-6.09-3.65-9.43-2.62-43.14 13.25-86.26 19.86-129.33 19.88zM320 352c-44.18 0-80-35.82-80-80s35.82-80 80-80 80 35.82 80 80-35.82 80-80 80z"></path>
    </svg>
  );
}

function ProblemFocusedCard({ icon, title, desc, lang }: { icon: React.ReactNode, title: string, desc: string, lang: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-8 bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-700/50 hover:border-red-500/30 transition-all group"
    >
      <div className="mb-6 text-3xl text-red-400 transform group-hover:scale-110 group-hover:-rotate-6 transition-all" aria-hidden="true">{icon}</div>
      <h3 className={`text-xl font-black text-white mb-3 tracking-tight ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{title}</h3>
      <p className={`text-slate-400 text-sm font-medium ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>{desc}</p>
    </motion.div>
  );
}
