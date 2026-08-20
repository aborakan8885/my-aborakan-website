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
    <header className="sticky top-0 z-50 w-full bg-[#023d38] border-b border-teal-800/40 shadow-xl text-white">
      {/* Top multi-color gradient line (Cyan -> Green) */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#179bad] via-[#1bb3a2] via-[#28c792] to-[#60e090]" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-0.5 sm:py-1">
        <div className="flex flex-col md:flex-row justify-between items-center gap-1 md:gap-3">
          
          {/* 1. Right Side (Text Card: Kingdom, Education Directorate, Educational Affairs) */}
          <div className="flex flex-col items-center text-center w-full md:w-auto shrink-0">
            <div className="flex flex-col items-center justify-center text-center px-5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-md">
              <span className="font-extrabold text-[10px] sm:text-[11px] tracking-wide text-teal-100">
                المملكة العربية السعودية
              </span>
              <span className="text-white font-black text-xs sm:text-sm leading-tight mt-0.5 drop-shadow-xs">
                الإدارة العامة للتعليم بالمدينة المنورة
              </span>
              <span className="font-bold text-[10px] sm:text-[11px] leading-none mt-0.5 text-teal-200">
                الشؤون التعليمية
              </span>
            </div>
          </div>

          {/* 2. Center (Ministry of Education Logo in rounded translucent frame) */}
          <div className="flex items-center justify-center shrink-0 w-full md:w-auto my-0.5 md:my-0">
            <div className="flex items-center justify-center shrink-0 p-2 sm:p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-md">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/76/Ministry_of_Education_%28Saudi_Arabia%29_%28logo%29.png"
                alt="Ministry of Education Logo"
                className="h-10 sm:h-12 w-auto object-contain transition-all duration-300 hover:scale-[1.02] filter brightness-110 drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* 3. Left Side (Back button, Admission Unit Badge, Theme & Language Toggles) */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-center md:justify-end shrink-0">
            {/* Admission Unit Badge - Isolated from text card, in front of theme & lang toggles */}
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#179bad] via-[#218caa] to-[#2eb882] text-white font-black text-[11px] sm:text-xs rounded-full shadow-md border border-white/30 shrink-0">
              <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse shadow-xs" />
              <span>وحدة القبول</span>
            </span>

            {/* Language Switcher */}
            <button
              onClick={() => onLanguageChange(currentLang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer bg-white/10 hover:bg-white/20 border border-white/20 text-white shadow-xs"
              id="header-language-toggle"
            >
              <span>{currentLang === 'ar' ? 'English' : 'العربية'}</span>
              <Languages className="w-3.5 h-3.5 text-teal-200" />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={isDark ? (isRtl ? 'الوضع الفاتح' : 'Light Mode') : (isRtl ? 'الوضع الداكن' : 'Dark Mode')}
              className="flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer bg-white/10 hover:bg-white/20 border border-white/20 text-amber-300 shadow-xs"
              id="header-theme-toggle"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-amber-200" />
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

