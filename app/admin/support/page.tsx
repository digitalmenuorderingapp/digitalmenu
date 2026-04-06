'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaLifeRing, 
  FaEnvelope, 
  FaWhatsapp, 
  FaQuestionCircle, 
  FaChevronDown, 
  FaHeadset,
  FaClock,
  FaShieldAlt,
  FaKeyboard,
  FaChartLine,
  FaArrowLeft
} from 'react-icons/fa';
import { TRANSLATIONS, Language } from '@/utils/translations';
import Link from 'next/link';

export default function SupportPage() {
  const [lang, setLang] = useState<Language>('en');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-6 lg:p-10 bg-[#f8f9fc] min-h-screen">
      {/* Premium Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-12"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-3xl rounded-[3rem] -z-10" />
        <div className="bg-white/70 backdrop-blur-xl border border-white/50 p-8 rounded-[2rem] shadow-xl shadow-indigo-500/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <FaLifeRing className="text-white text-3xl animate-[spin_4s_linear_infinite]" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                {t.support_title}
              </h1>
              <p className="text-indigo-600/70 font-bold text-sm tracking-wide uppercase mt-1">
                {t.support_subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 p-1.5 bg-gray-100/50 rounded-2xl border border-gray-200/50">
              {(['en', 'hi', 'bn'] as const).map((l) => (
                <button 
                  key={l}
                  onClick={() => handleLanguageChange(l)} 
                  className={`px-5 py-2 text-[10px] font-black rounded-xl transition-all duration-300 tracking-widest ${
                    lang === l 
                      ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 bg-green-50 px-5 py-2.5 rounded-2xl border border-green-100 shadow-sm">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <span className="text-xs font-black text-green-700 uppercase tracking-widest leading-none">
                {t.support_status}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-12"
      >
        {/* Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div variants={item} whileHover={{ y: -5 }} className="group">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden h-full">
              <div className="absolute -top-10 -right-10 text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors duration-500 transform group-hover:scale-110">
                <FaHeadset size={160} />
              </div>
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors duration-300">
                <FaHeadset className="text-indigo-600 text-2xl group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">{t.support_voice_title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">
                {t.support_voice_desc}
              </p>
              <a href="tel:+919563401099" className="inline-flex items-center px-6 py-3 bg-gray-50 text-indigo-600 rounded-xl font-black text-sm border border-gray-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm">
                Call +91 95634 01099
              </a>
            </div>
          </motion.div>

          <motion.div variants={item} whileHover={{ y: -5 }} className="group">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-green-500/10 transition-all duration-300 relative overflow-hidden h-full">
              <div className="absolute -top-10 -right-10 text-green-500/5 group-hover:text-green-500/10 transition-colors duration-500 transform group-hover:scale-110">
                <FaWhatsapp size={160} />
              </div>
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors duration-300">
                <FaWhatsapp className="text-green-600 text-2xl group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">{t.support_whatsapp_title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">
                {t.support_whatsapp_desc}
              </p>
              <a href="https://wa.me/919563401099" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 bg-gray-50 text-green-600 rounded-xl font-black text-sm border border-gray-100 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all shadow-sm">
                Chat on WhatsApp
              </a>
            </div>
          </motion.div>

          <motion.div variants={item} whileHover={{ y: -5 }} className="group">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden h-full">
              <div className="absolute -top-10 -right-10 text-blue-500/5 group-hover:text-blue-500/10 transition-colors duration-500 transform group-hover:scale-110">
                <FaEnvelope size={160} />
              </div>
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                <FaEnvelope className="text-blue-600 text-2xl group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">{t.support_email_title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">
                {t.support_email_desc}
              </p>
              <a href="mailto:digitalmenu.orderingapp@zohomail.in" className="inline-flex items-center px-6 py-3 bg-gray-50 text-blue-600 rounded-xl font-black text-xs border border-gray-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm break-all">
                Mail Team Support
              </a>
            </div>
          </motion.div>
        </div>

        {/* Combined Policy & Security Awareness */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div variants={item} className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 -mr-8 -mt-8">
              <FaShieldAlt size={160} />
            </div>
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30 backdrop-blur-sm">
                  <FaShieldAlt className="text-red-400 text-2xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">{t.support_security_title}</h3>
                  <p className="text-indigo-200/60 font-medium text-sm italic">{t.support_security_desc}</p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                <h4 className="text-red-400 font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-ping" />
                  {t.support_security_instruction_title}
                </h4>
                <p className="text-indigo-100/90 text-sm font-medium leading-relaxed mb-6 italic opacity-80">
                  {t.support_security_instruction_body}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group">
                    <div className="w-10 h-10 bg-indigo-500/20 text-indigo-300 rounded-xl flex items-center justify-center shrink-0 font-black group-hover:bg-indigo-500 group-hover:text-white transition-all">1</div>
                    <p className="text-[13px] text-gray-300 font-medium leading-tight">
                      {t.support_security_step1}
                    </p>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group">
                    <div className="w-10 h-10 bg-indigo-500/20 text-indigo-300 rounded-xl flex items-center justify-center shrink-0 font-black group-hover:bg-indigo-500 group-hover:text-white transition-all">2</div>
                    <p className="text-[13px] text-gray-300 font-medium leading-tight">
                      {t.support_security_step2}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-amber-100 shadow-xl shadow-amber-900/5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute bottom-0 right-0 p-8 opacity-[0.03] -mb-10 -mr-10">
              <FaChartLine size={240} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
                  <FaChartLine className="text-amber-500 text-2xl" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{t.support_report_policy_title}</h3>
                  </div>
                  <p className="text-amber-600/70 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Data Retention Notice</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600 font-medium leading-relaxed text-sm whitespace-pre-line bg-amber-50/30 p-5 rounded-3xl border border-amber-50">
                  {t.support_report_policy_desc}
                </p>
                <div className="flex items-center gap-4 text-red-600 bg-red-50 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-wider border border-red-100 shadow-sm leading-relaxed translate-y-2">
                  <FaClock className="text-lg shrink-0 animate-pulse" />
                  <span>{t.support_report_policy_warning}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* FAQ & Shortcuts Integration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
          {/* FAQ Accordion */}
          <motion.div variants={item} className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="p-10 bg-gray-50/50 border-b border-gray-100">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <FaQuestionCircle className="text-indigo-600 text-xl" />
                </div>
                {t.support_faq_title}
              </h3>
            </div>
            
            <div className="p-2 flex-1">
              {t.support_faqs.map((faq: any, index: number) => (
                <div key={index} className="px-6">
                  <button 
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className={`w-full flex items-center justify-between py-6 px-4 text-left group transition-all rounded-2xl mb-1 ${openFaq === index ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
                  >
                    <span className={`font-bold transition-colors ${openFaq === index ? 'text-indigo-600' : 'text-gray-800'}`}>
                      {faq.question}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${openFaq === index ? 'bg-indigo-600 text-white rotate-180' : 'bg-gray-100 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                      <FaChevronDown size={14} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-8 text-gray-500 leading-relaxed text-sm font-medium border-l-4 border-indigo-100 ml-4 py-2 opacity-80 italic">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Clean Keyboard Shortcuts */}
          <motion.div variants={item} className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="p-10 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FaKeyboard className="text-purple-600 text-xl" />
                </div>
                {t.support_shortcuts_title}
              </h3>
              <span className="px-4 py-1.5 bg-purple-600 text-white text-[10px] font-black uppercase tracking-[0.25em] rounded-full shadow-lg shadow-purple-200">
                {t.support_shortcuts_pro}
              </span>
            </div>
            
            <div className="p-10 space-y-8 flex-1">
              <p className="text-sm text-gray-500 italic font-medium leading-relaxed border-l-4 border-gray-100 pl-6">
                {t.support_shortcuts_desc}
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                {t.support_shortcuts.map((shortcut: any, index: number) => (
                  <motion.div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl hover:bg-white hover:shadow-md transition-all duration-300 border border-transparent hover:border-gray-100 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-white shadow-sm border border-gray-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-xs ring-0 group-hover:ring-4 ring-purple-50 transition-all">
                        {index + 1}
                      </div>
                      <span className="font-bold text-gray-700 text-[13px]">{shortcut.description}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {shortcut.key.split('+').map((part: string, i: number) => (
                        <span key={i} className="flex items-center gap-1.5">
                          <kbd className="min-w-[40px] px-2.5 py-1.5 bg-white border-b-[3px] border-gray-300 rounded-lg text-[10px] font-black text-gray-600 shadow-sm transition-all group-hover:border-purple-600 group-hover:text-purple-600">
                            {part.trim()}
                          </kbd>
                          {i < shortcut.key.split('+').length - 1 && <span className="text-gray-300 font-black">+</span>}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-8 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-100 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 text-amber-500/10 rotate-12 group-hover:scale-110 transition-transform">
                  <FaKeyboard size={64} />
                </div>
                <p className="text-xs font-black text-amber-700 uppercase tracking-widest flex items-center gap-3">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                  {t.support_shortcuts_tip}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
