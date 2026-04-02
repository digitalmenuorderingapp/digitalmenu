'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaKeyboard, FaHome, FaClipboardList, FaChartLine, FaUtensils, FaTable, FaStore, FaMobileAlt, FaLifeRing } from 'react-icons/fa';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: 'Alt + D', description: 'Go to Dashboard', icon: <FaHome className="w-4 h-4" /> },
  { key: 'Alt + O', description: 'Go to Orders', icon: <FaClipboardList className="w-4 h-4" /> },
  { key: 'Alt + L', description: 'Go to Ledger', icon: <FaChartLine className="w-4 h-4" /> },
  { key: 'Alt + M', description: 'Go to Menu', icon: <FaUtensils className="w-4 h-4" /> },
  { key: 'Alt + T', description: 'Go to Tables', icon: <FaTable className="w-4 h-4" /> },
  { key: 'Alt + R', description: 'Go to Restaurant Info', icon: <FaStore className="w-4 h-4" /> },
  { key: 'Alt + V', description: 'Go to Devices', icon: <FaMobileAlt className="w-4 h-4" /> },
  { key: 'Alt + H', description: 'Go to Help & Support', icon: <FaLifeRing className="w-4 h-4" /> },
  { key: 'Shift + ?', description: 'Show Keyboard Shortcuts', icon: <FaKeyboard className="w-4 h-4" /> },
  { key: 'Esc', description: 'Go Back / Close Modal', icon: <FaTimes className="w-4 h-4" /> },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaKeyboard className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Navigate quickly through the admin panel using these keyboard shortcuts. 
                  Shortcuts don't work while typing in input fields.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {shortcuts.map((shortcut, index) => (
                  <motion.div
                    key={shortcut.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-gray-200 text-indigo-600">
                      {shortcut.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                          {shortcut.key}
                        </kbd>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{shortcut.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-600 text-xs font-bold">!</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Pro Tip</p>
                    <p className="text-xs text-amber-700 mt-1">
                      These shortcuts are designed to work globally across the admin panel. 
                      They won't interfere with typing in forms, search boxes, or text areas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
