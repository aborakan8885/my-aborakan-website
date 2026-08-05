/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Languages, Home, Sun, Moon } from 'lucide-react';
import { Language, AppConfig } from '../types';
import { TRANSLATIONS } from '../data/mockData';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: 'survey' | 'dashboard';
  onTabChange: (tab: 'survey' | 'dashboard') => void;
  isOnline?: boolean;
  onToggleOnline?: () => void;
  config: AppConfig;
  unsyncedCount?: number;
  userRole: 'portal' | 'parent' | 'admin';
  onBackToPortal: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Header({
  currentLang,
  onLanguageChange,
  userRole,
  onBackToPortal,
  theme,
  onToggleTheme
}: HeaderProps) {
  const t = TRANSLATIONS[currentLang];
  const isRtl = currentLang === 'ar';
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-50 w-full transition-colors duration-300 border-b backdrop-blur-md ${
      isDark
        ? 'bg-[#012221] border-teal-800/50 shadow-md text-slate-100'
        : 'bg-[#004B49] border-teal-900 shadow-md text-white'
    }`}>
      {/* Decorative top gradient line to reinforce Ministry of Education premium identity */}
      <div className="h-1 w-full bg-gradient-to-r from-[#2b87b7] via-[#269fa6] to-[#48b864]" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center py-2 md:py-2.5 gap-2 md:gap-6">
          
          {/* 1. Right Side (In RTL: Ministry of Education Logo) */}
          <div className="flex items-center gap-3 justify-center md:justify-start w-full md:w-auto">
            <div className="flex items-center justify-center shrink-0 p-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xs">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/76/Ministry_of_Education_%28Saudi_Arabia%29_%28logo%29.png"
                alt="Ministry of Education Logo"
                className="h-10 sm:h-12 w-auto object-contain transition-all duration-300 hover:scale-[1.02] brightness-110 drop-shadow-xs"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* 2. Center Side (The Four Levels of Authority) */}
          <div className="flex flex-col items-center justify-center text-center w-full md:w-auto px-4 py-1.5 rounded-xl border bg-white/10 border-white/15 backdrop-blur-xs">
            <span className="font-extrabold text-[10px] sm:text-[11px] tracking-wider leading-none text-teal-100">
              المملكة العربية السعودية
            </span>
            <span className="text-white font-black text-xs sm:text-sm leading-tight mt-0.5 drop-shadow-2xs">
              الادارة العامة للتعليم بالمدينة المنورة
            </span>
            <span className="font-bold text-[10px] sm:text-[11px] leading-none mt-0.5 text-teal-200">
              الشؤون التعليمية
            </span>
            <div className="relative mt-1">
              <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-gradient-to-r from-[#2b87b7] via-[#269fa6] to-[#48b864] text-white font-extrabold text-[11px] sm:text-xs rounded-full shadow-xs">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                وحدة القبول
              </span>
            </div>
          </div>

          {/* 3. Left Controls (Action tabs, Lang, Theme) */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto justify-center md:justify-end shrink-0">
            
            {/* Desktop Back to Portal Button */}
            {userRole !== 'portal' && (
              <button
                onClick={onBackToPortal}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-xs bg-white/10 hover:bg-white/20 border-white/20 text-white"
                id="header-back-portal-desktop"
              >
                <Home className="w-3.5 h-3.5 text-teal-200" />
                <span>{t.goBackPortal}</span>
              </button>
            )}

            {/* Simulating Indicators (Theme, Language toggles) */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              
              {/* Theme Toggle Button */}
              <button
                onClick={onToggleTheme}
                title={isDark ? (isRtl ? 'الوضع الفاتح' : 'Light Mode') : (isRtl ? 'الوضع الداكن' : 'Dark Mode')}
                className="flex items-center justify-center p-2 rounded-lg border transition-all cursor-pointer bg-white/10 border-white/20 text-amber-300 hover:bg-white/20"
                id="header-theme-toggle"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
                ) : (
                  <Moon className="w-4 h-4 text-amber-200" />
                )}
              </button>

              {/* Language Switcher */}
              <button
                onClick={() => onLanguageChange(currentLang === 'ar' ? 'en' : 'ar')}
                className="flex items-center gap-1.5 px-3 py-2 border text-xs font-bold rounded-lg transition-all cursor-pointer bg-white/10 border-white/20 hover:bg-white/20 text-white"
                id="header-language-toggle"
              >
                <Languages className="w-3.5 h-3.5 text-teal-200" />
                <span>{t.changeLang}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Mobile-Only Back to Portal Button */}
        {userRole !== 'portal' && (
          <div className="flex md:hidden border-t py-2 border-white/15">
            <button
              onClick={onBackToPortal}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer bg-white/10 border-white/20 text-white"
              id="header-back-portal-mobile"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t.goBackPortal}</span>
            </button>
          </div>
        )}

      </div>
    </header>
  );
}

