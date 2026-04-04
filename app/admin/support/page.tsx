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
  FaHome,
  FaClipboardList,
  FaChartLine,
  FaUtensils,
  FaTable,
  FaStore,
  FaDesktop,
  FaArrowLeft
} from 'react-icons/fa';
import { TRANSLATIONS, Language } from '@/utils/translations';

const faqs = [
  {
    question: "How do I update my restaurant's digital menu?",
    answer: "Navigate to the 'Menu' section in your sidebar. There you can add new categories, create food items with descriptions, images, and prices. Any changes are synced instantly to your QR codes."
  },
  {
    question: "How do I generate QR codes for new tables?",
    answer: "Go to the 'Tables' section. You can add new tables and instantly generate unique QR codes for each. You can download and print these to place them on your restaurant tables."
  },
  {
    question: "How do payments work with DigitalMenu?",
    answer: "DigitalMenu supports both Cash and Online payments. Customers can choose their preferred method at checkout. If they choose online, they can pay via the integrated gateway. You can verify all payments in the 'Orders' section."
  },
  {
    question: "What should I do if a device goes offline?",
    answer: "First, check your internet connection. If the issue persists, go to the 'Devices' section to see the status of all active terminals. You can refresh the connection or re-login if necessary."
  },
  {
    question: "How do I use keyboard shortcuts?",
    answer: "Press Alt + any key to quickly navigate between pages. For example, Alt + D for Dashboard, Alt + O for Orders, Alt + L for Ledger. Press Shift + ? to see all shortcuts. These work anywhere in the admin panel."
  }
];

const keyboardShortcuts = [
  { key: 'Alt + D', description: 'Go to Dashboard', icon: <FaHome className="w-4 h-4" /> },
  { key: 'Alt + O', description: 'Go to Orders', icon: <FaClipboardList className="w-4 h-4" /> },
  { key: 'Alt + L', description: 'Go to Ledger', icon: <FaChartLine className="w-4 h-4" /> },
  { key: 'Alt + M', description: 'Go to Menu', icon: <FaUtensils className="w-4 h-4" /> },
  { key: 'Alt + T', description: 'Go to Tables', icon: <FaTable className="w-4 h-4" /> },
  { key: 'Alt + R', description: 'Go to Restaurant Info', icon: <FaStore className="w-4 h-4" /> },
  { key: 'Alt + V', description: 'Go to Devices', icon: <FaDesktop className="w-4 h-4" /> },
  { key: 'Alt + H', description: 'Go to Help & Support', icon: <FaLifeRing className="w-4 h-4" /> },
  { key: 'Shift + ?', description: 'Show Keyboard Shortcuts', icon: <FaKeyboard className="w-4 h-4" /> },
  { key: 'Esc', description: 'Go Back / Close Modal', icon: <FaArrowLeft className="w-4 h-4" /> },
];

export default function SupportPage() {
  const [lang, setLang] = useState<Language>('hi');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <div className="p-6 lg:p-10 space-y-10 bg-gray-50/50 min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <FaLifeRing className="text-indigo-600 animate-pulse" />
            {t.support_title}
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic">{t.support_subtitle}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Language Toggle */}
          <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
            <button 
              onClick={() => handleLanguageChange('en')} 
              className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${lang === 'en' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:text-gray-800'}`}
            >
              EN
            </button>
            <button 
              onClick={() => handleLanguageChange('hi')} 
              className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${lang === 'hi' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:text-gray-800'}`}
            >
              HI
            </button>
            <button 
              onClick={() => handleLanguageChange('bn')} 
              className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${lang === 'bn' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:text-gray-800'}`}
            >
              BN
            </button>
          </div>

          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            <span className="text-sm font-bold text-gray-700">{t.support_status}</span>
          </div>
        </div>
      </div>

      {/* Primary Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-600/5 border border-indigo-50 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <FaHeadset size={80} />
          </div>
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
            <FaHeadset className="text-indigo-600 text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Voice Support</h3>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">Speak directly with our technical team for immediate assistance.</p>
          <a href="tel:+918250000000" className="flex items-center gap-2 text-indigo-600 font-black text-lg hover:underline underline-offset-4">
            Call +91 8250...
          </a>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-green-600/5 border border-green-50 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-green-600">
            <FaWhatsapp size={80} />
          </div>
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
            <FaWhatsapp className="text-green-600 text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">WhatsApp Business</h3>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">Send us screenshots or voice notes for operational troubleshooting.</p>
          <a href="https://wa.me/918250000000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-600 font-black text-lg hover:underline underline-offset-4">
            Chat on WhatsApp
          </a>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-blue-600/5 border border-blue-50 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-blue-600">
            <FaEnvelope size={80} />
          </div>
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
            <FaEnvelope className="text-blue-600 text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Official Email</h3>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">For non-urgent queries and detailed documentation requests.</p>
          <a href="mailto:support@digitalmenu.com" className="flex items-center gap-2 text-blue-600 font-black text-lg hover:underline underline-offset-4 overflow-hidden text-ellipsis whitespace-nowrap">
            support@digitalmenu.com
          </a>
        </motion.div>
      </div>

      {/* Security Section (NEW) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden text-white"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <FaShieldAlt size={120} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
              <FaShieldAlt className="text-red-400 text-2xl" />
            </div>
            <div>
              <h3 className="text-2xl font-black">{t.support_security_title}</h3>
              <p className="text-indigo-200/60 text-sm">{t.support_security_desc}</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2">
              <FaShieldAlt className="w-4 h-4" />
              {t.support_security_instruction_title}
            </h4>
            <p className="text-gray-300 text-sm mb-6">
              {t.support_security_instruction_body}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0 font-bold">1</div>
                <p className="text-sm text-gray-200">
                  {t.support_security_step1}
                </p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0 font-bold">2</div>
                <p className="text-sm text-gray-200">
                  {t.support_security_step2}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FAQ Section */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <FaQuestionCircle className="text-indigo-500" />
              {t.support_faq_title}
            </h3>
          </div>
          
          <div className="divide-y divide-gray-50">
            {faqs.map((faq, index) => (
              <div key={index} className="px-8 py-2">
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between py-6 text-left group"
                >
                  <span className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                    {faq.question}
                  </span>
                  <FaChevronDown className={`text-gray-400 transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-indigo-500' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-8 text-gray-500 leading-relaxed text-sm italic font-medium border-l-4 border-indigo-100 pl-6 ml-1">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Keyboard Shortcuts Section */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <FaKeyboard className="text-indigo-500" />
              {t.support_shortcuts_title}
            </h3>
            <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Pro Tips
            </span>
          </div>
          
          <div className="p-8">
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Navigate faster with these keyboard shortcuts. Press the key combinations anywhere in the admin panel to quickly jump to different sections.
            </p>
            
            <div className="grid grid-cols-1 gap-3">
              {keyboardShortcuts.map((shortcut, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                      {shortcut.icon}
                    </div>
                    <span className="font-medium text-gray-700 text-sm">{shortcut.description}</span>
                  </div>
                  <kbd className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-600 shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                    {shortcut.key}
                  </kbd>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs font-medium text-amber-800 flex items-center gap-2">
                <FaKeyboard className="w-3 h-3" />
                Tip: Shortcuts don't work while typing in input fields
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
