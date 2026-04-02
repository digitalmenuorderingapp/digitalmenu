'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: Shortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
      const altMatches = !!shortcut.altKey === event.altKey;
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;

      if (keyMatches && ctrlMatches && altMatches && shiftMatches) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

export const useGlobalShortcuts = (onShowShortcuts?: () => void) => {
  const router = useRouter();

  const shortcuts: Shortcut[] = [
    { key: 'd', altKey: true, action: () => router.push('/admin/dashboard'), description: 'Go to Dashboard' },
    { key: 'o', altKey: true, action: () => router.push('/admin/orders'), description: 'Go to Orders' },
    { key: 'l', altKey: true, action: () => router.push('/admin/ledger'), description: 'Go to Ledger' },
    { key: 'm', altKey: true, action: () => router.push('/admin/menu'), description: 'Go to Menu' },
    { key: 't', altKey: true, action: () => router.push('/admin/tables'), description: 'Go to Tables' },
    { key: 'r', altKey: true, action: () => router.push('/admin/restaurant'), description: 'Go to Restaurant Info' },
    { key: 'v', altKey: true, action: () => router.push('/admin/devices'), description: 'Go to Devices' },
    { key: 'h', altKey: true, action: () => router.push('/admin/support'), description: 'Go to Help & Support' },
    { key: '?', shiftKey: true, action: () => {
      if (onShowShortcuts) {
        onShowShortcuts();
      } else {
        router.push('/admin/support');
      }
    }, description: 'Show Keyboard Shortcuts' },
    { key: 'Escape', action: () => {
      // Close any modals or go back
      if (window.history.length > 1) {
        window.history.back();
      }
    }, description: 'Go Back / Close Modal' },
  ];

  useKeyboardShortcuts(shortcuts);
  return shortcuts;
};
