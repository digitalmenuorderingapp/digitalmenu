'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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

const SECTION_IDS = ['hero', 'crisis', 'pricing', 'platform', 'customer-journey', 'features', 'trust', 'footer'];
const SECTION_LABELS = ['Home', 'Problems', 'Pricing', 'Platform', 'Experience', 'Features', 'Security', 'Contact'];

export default function MarketingHomeClient() {
  const { isLoading, isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lang, setLang] = useState<Language>('hi');
  const [activeSection, setActiveSection] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const isScrolling = useRef(false);
  const touchStartY = useRef(0);

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

  // Detect desktop
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const scrollToSection = useCallback((index: number) => {
    const id = SECTION_IDS[index];
    const el = document.getElementById(id);
    if (!el) return;
    isScrolling.current = true;
    setActiveSection(index);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { isScrolling.current = false; }, 900);
  }, []);

  // Intersection Observer — track which section is visible
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTION_IDS.forEach((id, idx) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(idx); },
        { threshold: 0.4 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  // Wheel snap (desktop only)
  useEffect(() => {
    if (!isDesktop) return;
    const handleWheel = (e: WheelEvent) => {
      if (isScrolling.current) return;
      const delta = e.deltaY;
      if (Math.abs(delta) < 30) return;
      e.preventDefault();
      const next = delta > 0
        ? Math.min(activeSection + 1, SECTION_IDS.length - 1)
        : Math.max(activeSection - 1, 0);
      if (next !== activeSection) scrollToSection(next);
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isDesktop, activeSection, scrollToSection]);

  // Keyboard arrow snap (desktop only)
  useEffect(() => {
    if (!isDesktop) return;
    const handleKey = (e: KeyboardEvent) => {
      if (isScrolling.current) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToSection(Math.min(activeSection + 1, SECTION_IDS.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToSection(Math.max(activeSection - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isDesktop, activeSection, scrollToSection]);

  // Touch swipe snap (desktop only)
  useEffect(() => {
    if (!isDesktop) return;
    const handleTouchStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling.current) return;
      const delta = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(delta) < 50) return;
      const next = delta > 0
        ? Math.min(activeSection + 1, SECTION_IDS.length - 1)
        : Math.max(activeSection - 1, 0);
      if (next !== activeSection) scrollToSection(next);
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDesktop, activeSection, scrollToSection]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen bg-white text-gray-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden ${lang === 'hi' ? 'font-hindi' : lang === 'bn' ? 'font-bengali' : 'font-sans'}`}
    >

      {/* Side dot navigation — desktop only */}
      {isDesktop && (
        <nav className="fixed right-5 top-1/2 -translate-y-1/2 z-[200] flex flex-col gap-3" aria-label="Page sections">
          {SECTION_IDS.map((id, idx) => (
            <button
              key={id}
              onClick={() => scrollToSection(idx)}
              title={SECTION_LABELS[idx]}
              aria-label={`Go to ${SECTION_LABELS[idx]}`}
              className="group relative flex items-center justify-end"
            >
              <span className="absolute right-6 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[10px] font-black text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                {SECTION_LABELS[idx]}
              </span>
              <span className={`block rounded-full transition-all duration-300 shadow-sm ${activeSection === idx
                ? 'w-3 h-3 bg-indigo-600 shadow-indigo-300 shadow-md'
                : 'w-2 h-2 bg-gray-300 hover:bg-indigo-400'
                }`} />
            </button>
          ))}
        </nav>
      )}

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

              <div className="hidden lg:flex items-center space-x-10">
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
                  <button onClick={() => handleLanguageChange('en')} className={`w-10 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'en' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>EN</button>
                  <button onClick={() => handleLanguageChange('hi')} className={`w-10 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'hi' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>HI</button>
                  <button onClick={() => handleLanguageChange('bn')} className={`w-10 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'bn' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>BN</button>
                </div>

                {isLoading ? (
                  <Skeleton width={100} height={40} className="rounded-xl" />
                ) : isAuthenticated ? (
                  <Link href="/admin/dashboard" className="flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200">
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

      <main>
        {/* --- HERO SECTION --- */}
        <section id="hero" className="relative min-h-[100dvh] flex items-start md:items-center bg-white overflow-hidden pt-28 pb-12 md:pt-0 md:pb-0">
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

          <div className="max-w-7xl mx-auto pt-12 px-4 sm:px-6 lg:px-8 relative w-full md:pt-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">
              <div className="z-10 py-4 md:py-10">
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
                      className={`inline-block px-4 py-1.5 bg-white/10 text-white text-[10px] font-black rounded-full mb-6 md:mb-8 uppercase backdrop-blur-sm border border-white/10 ${lang === 'en' ? 'tracking-[0.25em]' : 'tracking-normal'}`}
                    >
                      {t.hero_badge}
                    </motion.span>
                    <h1 className={`text-5xl sm:text-6xl md:text-7xl  font-black text-white leading-[1.15] md:leading-[1.05] mb-6 md:mb-8 tracking-[-0.04em] ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>
                      {HERO_SLIDES[currentSlide].headline}
                    </h1>
                    <p className={`text-xl sm:text-2xl md:text-3xl text-indigo-50/80 mb-10 md:mb-12 max-w-xl font-medium ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>
                      {HERO_SLIDES[currentSlide].subtext}
                    </p>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-5 sm:gap-6">
                      <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
                        <Link href="/auth?mode=register" className="bg-white text-indigo-600 px-6 sm:px-10 md:px-12 py-3.5 sm:py-5 md:py-6 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg md:text-xl transition-all shadow-2xl flex items-center justify-center w-full sm:w-auto">
                          {HERO_SLIDES[currentSlide].cta}
                          <FaArrowRight className="ml-3" aria-hidden="true" />
                        </Link>
                      </motion.div>
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
          <div className="absolute bottom-6 md:bottom-16 left-1/2 -translate-x-1/2 flex space-x-3 md:space-x-4" role="tablist" aria-label="Hero slides">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                role="tab"
                aria-selected={currentSlide === idx}
                aria-label={`Switch to slide ${idx + 1}`}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-700 ${currentSlide === idx ? 'bg-white w-12 md:w-24' : 'bg-white/40 w-6 md:w-12 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </section>

        {/* --- STRATEGIC PIVOT: PROBLEMS WITH PRINTED MENUS (FULL SCREEN) --- */}
        <section id="crisis" className="min-h-screen py-8 md:py-12 lg:py-16 bg-slate-900 border-t items-center flex relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="w-full px-4 sm:px-8 lg:px-16 xl:px-24 relative z-10">
            <div className="text-center mb-10 md:mb-16">
              <span className={`text-red-400 font-black text-xs uppercase mb-4 md:mb-6 block ${lang === 'en' ? 'tracking-[0.3em]' : 'tracking-normal'}`}>{t.crisis_badge}</span>
              <h2 className={`text-3xl sm:text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter mb-4 md:mb-8 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{t.crisis_title}</h2>
              <p className={`text-base sm:text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>{t.crisis_desc}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
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
              className="mt-8 md:mt-16 p-5 md:p-8 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl md:rounded-3xl border border-red-500/20 backdrop-blur-md text-center max-w-6xl mx-auto"
            >
              <h3 className="text-xl md:text-2xl lg:text-4xl font-black text-rose-100 tracking-tight">{t.crisis_highlight}</h3>
            </motion.div>
          </div>
        </section>

        {/* --- LIFETIME FREE OFFER (SEPARATE SECTION) --- */}
        <section id="pricing" className="min-h-screen py-8 md:py-12 lg:py-16 bg-gray-50 relative overflow-hidden flex items-center justify-center">
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
                <Link href="/affordable" className="flex items-center justify-center space-x-3 text-sm font-bold text-gray-400 group cursor-pointer hover:text-indigo-600 transition-colors" role="button" aria-label="Learn more about our affordable offer">
                  <span>{t.offer_learn}</span>
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Link>
              </div>
              <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-indigo-100 rounded-full blur-[100px] -z-10" aria-hidden="true" />
            </motion.div>
          </div>
        </section>

        {/* --- CORE PLATFORM: SOLUTION + STEPS --- */}
        <section id="platform" className="min-h-screen py-8 md:py-12 lg:py-16 bg-white flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-6 md:mb-8">
              <span className={`text-indigo-600 font-black text-xs uppercase mb-3 md:mb-4 block ${lang === 'en' ? 'tracking-[0.3em]' : 'tracking-normal'}`}>{t.platform_badge}</span>
              <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter mb-4 md:mb-6 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{t.platform_title}</h2>
              <p className={`text-base sm:text-lg md:text-xl text-gray-500 max-w-3xl mx-auto ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>
                {t.platform_desc}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-stretch">
              <div className="bg-indigo-600 rounded-3xl md:rounded-[3.5rem] p-6 sm:p-9 md:p-12 text-white text-left relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]" aria-hidden="true" />
                <h3 className="text-xl md:text-3xl font-black mb-5 md:mb-8 flex items-center">
                  <FaMobileAlt className="mr-3" aria-hidden="true" /> {t.platform_setup}
                </h3>
                <div className="space-y-5 md:space-y-8 relative z-10">
                  <MiniStep num="1" title={t.plat_step1_title} desc={t.plat_step1_desc} lang={lang} />
                  <MiniStep num="2" title={t.plat_step2_title} desc={t.plat_step2_desc} lang={lang} />
                  <MiniStep num="3" title={t.plat_step3_title} desc={t.plat_step3_desc} lang={lang} />
                  <MiniStep num="4" title={t.plat_step4_title} desc={t.plat_step4_desc} lang={lang} />
                </div>
              </div>

              <div className="relative group hidden lg:flex flex-col" aria-hidden="true">
                <div className="bg-gray-100 rounded-[4.5rem] p-4 group-hover:scale-[1.02] transition-transform duration-700 shadow-2xl flex-1 flex flex-col">
                  <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-inner p-8 flex-1 flex items-center justify-center">
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
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-6 md:-top-10 -right-2 md:-right-10 bg-white p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl border border-gray-100 z-20 scale-90 md:scale-100"
                >
                  <FaCheckCircle className="text-green-500 text-xl md:text-3xl mb-1 md:mb-2" />
                  <div className="font-black text-[10px] md:text-sm whitespace-nowrap">{t.plat_float1}</div>
                </motion.div>
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                  className="absolute -bottom-2 md:-bottom-5 -left-2 md:-left-5 bg-white p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl border border-gray-100 z-20 scale-90 md:scale-100"
                >
                  <FaClock className="text-indigo-500 text-xl md:text-3xl mb-1 md:mb-2" />
                  <div className="font-black text-[10px] md:text-sm whitespace-nowrap">{t.plat_float2}</div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* --- CUSTOMER EXPERIENCE: FRICTIONLESS JOURNEY --- */}
        <section id="customer-journey" className="min-h-screen py-8 md:py-12 lg:py-16 bg-indigo-50/50 relative overflow-hidden flex items-center">
          <div className="w-full px-4 sm:px-8 lg:px-16 xl:px-24">
            <div className="text-center mb-6 md:mb-8 lg:mb-10">
              <span className={`text-indigo-600 font-black text-xs uppercase mb-4 md:mb-6 block ${lang === 'en' ? 'tracking-[0.3em]' : 'tracking-normal'}`}>{t.cust_exp_badge}</span>
              <h2 className={`text-3xl sm:text-5xl md:text-7xl font-black text-gray-900 tracking-tighter mb-5 md:mb-10 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{t.cust_exp_title}</h2>
              <p className={`text-base sm:text-xl md:text-2xl text-gray-500 max-w-4xl mx-auto ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>
                {t.cust_exp_desc}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 lg:gap-12">
              <div className="bg-white p-5 sm:p-8 md:p-12 rounded-2xl md:rounded-[3.5rem] shadow-xl border border-indigo-100/50 hover:shadow-2xl transition-all">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white text-2xl sm:text-4xl mb-5 sm:mb-10 shadow-lg shadow-indigo-200">
                  <FaQrcode />
                </div>
                <h3 className={`text-xl sm:text-3xl font-black text-gray-900 mb-3 sm:mb-6 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{t.cust_step1_t}</h3>
                <p className={`text-base sm:text-xl text-gray-500 ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>{t.cust_step1_d}</p>
              </div>

              <div className="bg-white p-5 sm:p-8 md:p-12 rounded-2xl md:rounded-[3.5rem] shadow-xl border border-indigo-100/50 hover:shadow-2xl transition-all">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white text-2xl sm:text-4xl mb-5 sm:mb-10 shadow-lg shadow-purple-200">
                  <FaUtensils />
                </div>
                <h3 className={`text-xl sm:text-3xl font-black text-gray-900 mb-3 sm:mb-6 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{t.cust_step2_t}</h3>
                <p className={`text-base sm:text-xl text-gray-500 ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>{t.cust_step2_d}</p>
              </div>

              <div className="bg-white p-5 sm:p-8 md:p-12 rounded-2xl md:rounded-[3.5rem] shadow-xl border border-indigo-100/50 hover:shadow-2xl transition-all">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-green-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white text-2xl sm:text-4xl mb-5 sm:mb-10 shadow-lg shadow-green-200">
                  <FaCheckCircle />
                </div>
                <h3 className={`text-xl sm:text-3xl font-black text-gray-900 mb-3 sm:mb-6 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{t.cust_step3_t}</h3>
                <p className={`text-base sm:text-xl text-gray-500 ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>{t.cust_step3_d}</p>
              </div>
            </div>

            {/* No-App Highlight */}
            <div className="mt-10 md:mt-16 lg:mt-24 text-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-0 sm:space-x-4 bg-white px-5 sm:px-8 py-3 sm:py-4 rounded-full border border-indigo-100 shadow-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm sm:text-lg font-bold text-gray-900">Digital Menu Order</span>
                <span className="text-sm sm:text-lg font-black text-indigo-900 tracking-tight">No App Downloads Required. Works on every Browser.</span>
              </div>
            </div>
          </div>
        </section>

        {/* --- THE SAAS ENGINE: FEATURES --- */}
        <section id="features" className="min-h-screen py-8 md:py-12 lg:py-16 bg-indigo-950 relative overflow-hidden flex items-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" aria-hidden="true" />
          <div className="w-full px-4 sm:px-8 lg:px-16 xl:px-24">
            <div className="text-center mb-6 md:mb-8 lg:mb-10">
              <span className={`text-indigo-400 font-black text-xs uppercase mb-4 md:mb-6 block ${lang === 'en' ? 'tracking-[0.3em]' : 'tracking-normal'}`}>{t.feat_badge}</span>
              <h2 className={`text-3xl sm:text-5xl md:text-6xl lg:text-[80px] font-black text-white tracking-tighter mb-5 md:mb-10 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{t.feat_title}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-8 lg:gap-10">
              <FeatureCard icon={<FaSyncAlt aria-hidden="true" />} title={t.feat1_title} desc={t.feat1_desc} lang={lang} />
              <FeatureCard icon={<FaChartLine aria-hidden="true" />} title={t.feat2_title} desc={t.feat2_desc} lang={lang} />
              <FeatureCard icon={<FaShieldAlt aria-hidden="true" />} title={t.feat3_title} desc={t.feat3_desc} lang={lang} />
              <FeatureCard icon={<FaDatabase aria-hidden="true" />} title={t.feat4_title} desc={t.feat4_desc} lang={lang} />
              <FeatureCard icon={<FaUtensils aria-hidden="true" />} title={t.feat5_title} desc={t.feat5_desc} lang={lang} />
              <FeatureCard icon={<FaUserSecret aria-hidden="true" />} title={t.feat6_title} desc={t.feat6_desc} lang={lang} />
            </div>
          </div>
        </section>

        {/* --- TRUST ECOSYSTEM: ARCH + SECURITY + DATA + DEV --- */}
        <section id="trust" className="min-h-screen py-8 md:py-14 bg-white flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-stretch">

              {/* Column 1: Technology & Privacy */}
              <div className="space-y-6 md:space-y-10">
                <article>
                  <span className={`text-indigo-600 font-black text-xs uppercase mb-4 md:mb-5 block ${lang === 'en' ? 'tracking-[0.3em]' : 'tracking-normal'}`}>{t.trust_badge}</span>
                  <h2 className={`text-3xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4 md:mb-6 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{t.trust_title_p1} <br /> {t.trust_title_p2}</h2>
                  <p className={`text-base md:text-lg text-gray-500 font-medium mb-5 md:mb-8 ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>
                    {t.trust_desc}
                  </p>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <TechToken icon={<FaServer aria-hidden="true" />} label={t.trust_tech1} />
                    <TechToken icon={<FaDatabase aria-hidden="true" />} label={t.trust_tech2} />
                    <TechToken icon={<FaLock aria-hidden="true" />} label={t.trust_tech3} />
                    <TechToken icon={<FaCheckCircle aria-hidden="true" />} label={t.trust_tech4} />
                  </div>
                </article>

                <div className="bg-gray-50 p-5 sm:p-7 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/5 rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full translate-y-1/2 -translate-x-1/2" aria-hidden="true" />

                  {/* Quote */}
                  <div className="relative flex items-start gap-3 mb-5">
                    <FaShieldAlt className="text-lg text-indigo-500 mt-0.5 shrink-0" aria-hidden="true" />
                    <blockquote className={`text-sm sm:text-base font-bold text-gray-700 italic leading-relaxed ${lang !== 'en' ? 'indic-spacing' : ''}`}>
                      {t.trust_quote}
                    </blockquote>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 mb-5" />

                  {/* Feature 1: Email Export */}
                  <div className="flex items-start gap-3 sm:gap-4 mb-4 group/item">
                    <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 group-hover/item:bg-indigo-600 transition-colors">
                      <FaEnvelope className="text-indigo-600 group-hover/item:text-white transition-colors text-sm" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="font-black text-gray-900 text-sm tracking-tight">
                        {lang === 'bn' ? 'ইমেইলে এক্সপোর্ট করুন যেকোনো সময়' : lang === 'hi' ? 'कभी भी ईमेल एक्सपोर्ट करें' : 'Email Export — Anytime'}
                      </div>
                      <div className="text-xs text-gray-400 font-medium mt-0.5">
                        {lang === 'bn' ? 'আপনার সব অর্ডার ও রিপোর্ট ইনস্ট্যান্টলি পাঠানো হবে।' : lang === 'hi' ? 'अपने सभी ऑर्डर और रिपोर्ट तुरंत प्राप्त करें।' : 'All orders & reports sent to your inbox instantly.'}
                      </div>
                    </div>
                    <span className="ml-auto text-[10px] font-black text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full whitespace-nowrap self-start">
                      {lang === 'bn' ? 'বিনামূল্যে' : 'FREE'}
                    </span>
                  </div>

                  {/* Feature 2: Monthly Auto-Report Email */}
                  <div className="flex items-start gap-3 sm:gap-4 mb-4 group/item">
                    <div className="w-9 h-9 md:w-10 md:h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 group-hover/item:bg-orange-500 transition-colors">
                      <FaChartLine className="text-orange-500 group-hover/item:text-white transition-colors text-sm" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="font-black text-gray-900 text-sm tracking-tight">
                        {lang === 'bn' ? 'মাসিক রিপোর্ট নিবন্ধিত মেইলে' : lang === 'hi' ? 'मासिक रिपोर्ट पंजीकृत ईमेल पर' : 'Monthly Report to Registered Email'}
                      </div>
                      <div className="text-xs text-gray-400 font-medium mt-0.5">
                        {lang === 'bn' ? 'প্রতি মাসে আপনার অর্ডার ও বিক্রির রিপোর্ট স্বয়ংক্রিয়ভাবে পাঠানো হয়।' : lang === 'hi' ? 'हर महीने ऑर्डर और बिक्री रिपोर्ट स्वचालित रूप से भेजी जाती है।' : 'Order & sales summary auto-sent to your registered email every month.'}
                      </div>
                    </div>
                    <span className="ml-auto text-[10px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full whitespace-nowrap self-start">
                      {lang === 'bn' ? 'স্বয়ংক্রিয়' : 'AUTO'}
                    </span>
                  </div>

                  {/* Feature 3: Auto Monthly Cleanup */}
                  <div className="flex items-start gap-3 sm:gap-4 group/item">
                    <div className="w-9 h-9 md:w-10 md:h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0 group-hover/item:bg-purple-600 transition-colors">
                      <FaSyncAlt className="text-purple-600 group-hover/item:text-white transition-colors text-sm" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="font-black text-gray-900 text-sm tracking-tight">
                        {lang === 'bn' ? 'প্রতি মাসে স্বয়ংক্রিয় পরিষ্কার' : lang === 'hi' ? 'मासिक ऑटो क्लीनअप' : 'Auto Monthly Cleanup'}
                      </div>
                      <div className="text-xs text-gray-400 font-medium mt-0.5">
                        {lang === 'bn' ? 'পুরোনো ডেটা নিজেই সরে যায়, স্পিড সবসময় ফাস্ট থাকে।' : lang === 'hi' ? 'पुराना डेटा अपने आप हट जाता है, गति हमेशा तेज रहती है।' : 'Old records auto-cleared monthly. Speed stays blazing fast.'}
                      </div>
                    </div>
                    <span className="ml-auto text-[10px] font-black text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full whitespace-nowrap self-start">
                      {lang === 'bn' ? 'অটো' : 'AUTO'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 2: Developer & Security Manifest */}
              <div className="flex flex-col">
                <div className="bg-indigo-950 rounded-3xl md:rounded-[3rem] p-6 sm:p-10 md:p-12 text-white flex-1 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-[100px]" aria-hidden="true" />
                  <div>
                    <h3 className="text-xl md:text-2xl font-black mb-5 md:mb-8 flex items-center tracking-tight">
                      <FaLock className="mr-3 text-indigo-400" aria-hidden="true" /> {t.sec_manifest}
                    </h3>
                    <div className="space-y-5 md:space-y-6">
                      <SimpleSecurityPoint title={t.sec1_title} desc={t.sec1_desc} lang={lang} />
                      <SimpleSecurityPoint title={t.sec2_title} desc={t.sec2_desc} lang={lang} />
                      <SimpleSecurityPoint title={t.sec3_title} desc={t.sec3_desc} lang={lang} />
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/10">
                    <div className="flex items-center space-x-4 md:space-x-5">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                        <FaIdCard className="text-indigo-400" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">{t.sec_dev}</div>
                        <div className="text-base md:text-lg font-black tracking-tight" translate="no">Sahin Arman</div>
                        <div className="text-xs text-white/40 font-bold tracking-widest mt-1">digitalmenu.orderingapp@zohomail.in</div>
                        <div className="text-xs text-white/40 font-bold tracking-widest mt-0.5">+91 9563401099</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


      </main>

      {/* --- CTA + FOOTER SECTION (LAST SNAP) --- */}
      <div id="footer" className="min-h-screen flex flex-col">
        {/* --- CTA SECTION --- */}
        <section id="cta" className="w-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 relative overflow-hidden flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8" aria-labelledby="cta-heading">
          <div className="absolute inset-0 bg-black/10" aria-hidden="true" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" aria-hidden="true" />

          <div className="relative z-10 max-w-6xl mx-auto text-center w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white/10 backdrop-blur-md rounded-3xl md:rounded-[4rem] p-6 md:p-12 border border-white/20 shadow-2xl"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl md:rounded-[4rem]" aria-hidden="true" />

              <h2 className={`text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter mb-6 md:mb-8 relative z-10 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200">
                  {t.cta_title_p1} <br /> {t.cta_title_p2}
                </span>
              </h2>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 relative z-10">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Link href="/auth?mode=register" className="group relative px-6 sm:px-10 py-3 sm:py-5 bg-white text-indigo-600 rounded-2xl sm:rounded-3xl font-black text-base sm:text-lg md:text-xl shadow-2xl hover:shadow-3xl hover:bg-gray-50 transition-all flex items-center justify-center w-full sm:w-auto overflow-hidden">
                    <span className="relative z-10">{t.cta_btn}</span>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <button
                    onClick={() => window.open('https://wa.me/919563401099', '_blank')}
                    className="group relative flex items-center justify-center space-x-3 text-white text-base sm:text-lg font-bold bg-green-500 hover:bg-green-400 px-5 sm:px-7 py-3 sm:py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto overflow-hidden"
                    aria-label="Contact support on WhatsApp"
                  >
                    <FaWhatsapp className="text-lg sm:text-xl group-hover:scale-110 transition-transform relative z-10" />
                    <span className="relative z-10">{t.cta_chat}</span>
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="bg-slate-950 text-white relative pt-4 md:pt-6">
          {/* Main footer body */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4 md:pt-6 md:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

              {/* Column 1: Brand */}
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="flex items-center space-x-3 mb-5">
                  <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/40">
                    <FaQrcode className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                    Digital Menu Order
                  </span>
                </div>
                <p className={`text-slate-400 text-sm leading-relaxed mb-7 max-w-xs ${lang !== 'en' ? 'indic-spacing' : ''}`}>
                  {lang === 'bn'
                    ? 'আপনার রেস্তোরাঁর জন্য ডিজিটাল মেনু ও অর্ডার ম্যানেজমেন্ট — সম্পূর্ণ বিনামূল্যে।'
                    : lang === 'hi'
                      ? 'आपके रेस्तरां के लिए डिजिटल मेनू और ऑर्डर मैनेजमेंट — बिल्कुल मुफ्त।'
                      : 'Digital menu & order management for your restaurant — completely free.'}
                </p>
                {/* Contact buttons */}
                <div className="flex flex-col gap-3">
                  <a
                    href="https://wa.me/919563401099"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 px-4 py-2.5 rounded-xl text-sm font-bold transition-all group w-fit"
                    aria-label="Contact on WhatsApp"
                  >
                    <FaWhatsapp className="text-lg group-hover:scale-110 transition-transform" />
                    <span>+91 9563401099</span>
                  </a>
                  <a
                    href="mailto:digitalmenu.orderingapp@zohomail.in"
                    className="flex items-center gap-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 px-4 py-2.5 rounded-xl text-sm font-bold transition-all group w-fit"
                    aria-label="Send email"
                  >
                    <FaEnvelope className="text-lg group-hover:scale-110 transition-transform" />
                    <span>digitalmenu.orderingapp@zohomail.in</span>
                  </a>
                </div>
              </div>

              {/* Column 2: Quick Links */}
              <div>
                <h3 className={`text-xs font-black uppercase text-slate-500 mb-5 ${lang === 'en' ? 'tracking-[0.25em]' : 'tracking-normal'}`}>
                  {lang === 'bn' ? 'পেজ লিংক' : lang === 'hi' ? 'पेज लिंक' : 'Quick Links'}
                </h3>
                <ul className="space-y-3">
                  {[
                    { href: '#platform', label: lang === 'bn' ? 'প্ল্যাটফর্ম' : lang === 'hi' ? 'प्लेटफ़ॉर्म' : 'Platform' },
                    { href: '#features', label: lang === 'bn' ? 'ফিচার সমূহ' : lang === 'hi' ? 'विशेषताएँ' : 'Features' },
                    { href: '#trust', label: lang === 'bn' ? 'নিরাপত্তা' : lang === 'hi' ? 'सुरक्षा' : 'Security' },
                    { href: '#pricing', label: lang === 'bn' ? 'মূল্য' : lang === 'hi' ? 'मूल्य निर्धारण' : 'Pricing' },
                    { href: '#crisis', label: lang === 'bn' ? 'সমস্যাগুলো' : lang === 'hi' ? 'समस्याएँ' : 'The Problem' },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-2 group"
                      >
                        <span className="w-1 h-1 bg-indigo-500 rounded-full group-hover:w-2 transition-all" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3: Legal */}
              <div>
                <h3 className={`text-xs font-black uppercase text-slate-500 mb-5 ${lang === 'en' ? 'tracking-[0.25em]' : 'tracking-normal'}`}>
                  {lang === 'bn' ? 'আইনি তথ্য' : lang === 'hi' ? 'कानूनी' : 'Legal'}
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/privacy-policy" className="text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-2 group">
                      <span className="w-1 h-1 bg-purple-500 rounded-full group-hover:w-2 transition-all" />
                      {t.foot_privacy}
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms-of-service" className="text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-2 group">
                      <span className="w-1 h-1 bg-purple-500 rounded-full group-hover:w-2 transition-all" />
                      {t.foot_terms}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className={`text-slate-600 text-xs font-bold ${lang === 'en' ? 'tracking-widest uppercase' : 'tracking-normal'}`}>
                &copy; {new Date().getFullYear()} {t.foot_rights}
              </p>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-slate-600 text-xs font-bold">
                  {lang === 'bn' ? 'সব সিস্টেম চালু আছে' : lang === 'hi' ? 'सभी सिस्टम चालू' : 'All systems operational'}
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>

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
    <div className="flex space-x-4 md:space-x-8 items-start group">
      <div className="text-2xl md:text-4xl font-black text-white/20 select-none group-hover:text-white transition-colors shrink-0" aria-hidden="true">{num}</div>
      <div>
        <h4 className={`text-lg md:text-2xl font-black mb-1 md:mb-2 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{title}</h4>
        <p className={`text-indigo-100/60 text-sm md:text-lg ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>{desc}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, lang }: { icon: React.ReactNode, title: string, desc: string, lang: string }) {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      className="p-5 sm:p-8 md:p-12 bg-white/5 backdrop-blur-xl rounded-2xl md:rounded-[4rem] border border-white/5 hover:border-indigo-500/30 transition-all group"
    >
      <div className="mb-5 sm:mb-10 text-3xl sm:text-4xl text-indigo-400 transform group-hover:scale-110 group-hover:rotate-6 transition-all" aria-hidden="true">{icon}</div>
      <h3 className={`text-xl sm:text-2xl font-black text-white mb-3 sm:mb-6 tracking-tight ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{title}</h3>
      <p className={`text-indigo-100/40 text-sm sm:text-lg font-medium ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>{desc}</p>
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
      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 mr-4 md:mr-6 shrink-0" aria-hidden="true" />
      <div>
        <div className={`font-black text-white text-base md:text-lg tracking-tight mb-1 ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{title}</div>
        <div className={`text-indigo-100/40 text-xs md:text-sm font-medium ${lang !== 'en' ? 'indic-spacing' : ''}`}>{desc}</div>
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
      className="p-5 sm:p-8 bg-slate-800/50 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] border border-slate-700/50 hover:border-red-500/30 transition-all group"
    >
      <div className="mb-4 sm:mb-6 text-2xl sm:text-3xl text-red-400 transform group-hover:scale-110 group-hover:-rotate-6 transition-all" aria-hidden="true">{icon}</div>
      <h3 className={`text-base sm:text-xl font-black text-white mb-2 sm:mb-3 tracking-tight ${lang !== 'en' ? 'indic-heading-spacing' : ''}`}>{title}</h3>
      <p className={`text-slate-400 text-sm font-medium ${lang !== 'en' ? 'indic-spacing' : 'leading-relaxed'}`}>{desc}</p>
    </motion.div>
  );
}
