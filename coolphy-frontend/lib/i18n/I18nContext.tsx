'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import en from '@/locales/en.json';
import ru from '@/locales/ru.json';
import zh from '@/locales/zh.json';

type Locale = 'en' | 'ru' | 'zh';
type Messages = typeof en;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  messages: Messages;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const messages: Record<Locale, Messages> = {
  en,
  ru,
  zh,
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [locale, setLocaleState] = useState<Locale>('en');

  // Initialize locale from user settings
  useEffect(() => {
    if (user?.settings) {
      const userLang = (user.settings as any).language as Locale | undefined;
      if (userLang && ['en', 'ru', 'zh'].includes(userLang)) {
        setLocaleState(userLang);
      }
    }
  }, [user]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  // Translation function with nested key support (e.g., "nav.dashboard")
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = messages[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  const value: I18nContextType = {
    locale,
    setLocale,
    t,
    messages: messages[locale],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
