/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Languages, ClipboardList, BarChart3, Wifi, WifiOff, Home, Sun, Moon } from 'lucide-react';
import { Language, AppConfig } from '../types';
import { TRANSLATIONS } from '../data/mockData';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: 'survey' | 'dashboard';
  onTabChange: (tab: 'survey' | 'dashboard') => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  config: AppConfig;
  unsyncedCount: number;
  userRole: 'portal' | 'parent' | 'admin';
  onBackToPortal: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Header({
  currentLang,
  onLanguageChange,
  activeTab,
  onTabChange,
  isOnline,
  onToggleOnline,
  config,
  unsyncedCount,
  userRole,
  onBackToPortal,
  theme,
  onToggleTheme
}: HeaderProps) {
  const t = TRANSLATIONS[currentLang];
  const isRtl = currentLang === 'ar';
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-50 w-full transition-colors duration-300 border-b backdrop-blur-md bg-opacity-95 ${
      isDark
        ? 'bg-[#022e2d]/90 border-teal-800/40 shadow-lg text-slate-100'
        : 'bg-white border-slate-200/80 shadow-xs text-slate-900'
    }`}>
      {/* Decorative top gradient line to reinforce Ministry of Education premium identity */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#2b87b7] via-[#269fa6] to-[#48b864]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center py-4 md:py-5 gap-4 md:gap-8">
          
          {/* 1. Right Side (In RTL: Ministry of Education Logo & Text) */}
          {/* On mobile, this will stay clean and centered */}
          <div className="flex items-center gap-3.5 justify-center md:justify-start w-full md:w-auto">
            <div className={`flex items-center justify-center shrink-0 p-1.5 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10 backdrop-blur-md' : ''}`}>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/76/Ministry_of_Education_%28Saudi_Arabia%29_%28logo%29.png"
                alt="Ministry of Education Logo"
                className={`h-14 sm:h-18 w-auto object-contain transition-all duration-300 hover:scale-[1.02] ${isDark ? 'brightness-110' : ''}`}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* 2. Center Side (The Four Levels of Authority requested) */}
          <div className={`flex flex-col items-center justify-center text-center w-full md:w-auto px-4 py-1.5 rounded-2xl border transition-colors ${
            isDark
              ? 'bg-[#033937]/60 border-teal-800/30'
              : 'bg-slate-50/50 border-slate-100/50'
          }`}>
            <span className={`font-extrabold text-[11px] sm:text-xs tracking-wider leading-none ${
              isDark ? 'text-teal-300' : 'text-slate-700'
            }`}>
              المملكة العربية السعودية
            </span>
            <span className="bg-gradient-to-r from-[#2b87b7] via-[#269fa6] to-[#48b864] bg-clip-text text-transparent font-black text-sm sm:text-lg leading-tight mt-1.5 drop-shadow-2xs">
              الادارة العامة للتعليم بالمدينة المنورة
            </span>
            <span className={`font-bold text-[11px] sm:text-xs leading-none mt-1 ${
              isDark ? 'text-teal-400' : 'text-slate-500'
            }`}>
              الشؤون التعليمية
            </span>
            <div className="relative mt-2">
              <span className="inline-flex items-center gap-1.5 px-4.5 py-1 bg-gradient-to-r from-[#2b87b7] via-[#269fa6] to-[#48b864] text-white font-extrabold text-xs sm:text-sm rounded-full shadow-sm shadow-teal-600/10">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                وحدة القبول
              </span>
            </div>
          </div>

          {/* 3. Left Controls (Action tabs, Lang, Network Status) */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-center md:justify-end shrink-0">
            
            {/* Desktop Back to Portal Button */}
            {userRole !== 'portal' && (
              <button
                onClick={onBackToPortal}
                className={`hidden md:flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border transition-all cursor-pointer shadow-xs ${
                  isDark
                    ? 'bg-teal-950/40 border-teal-700/50 text-teal-300 hover:bg-teal-900/40'
                    : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                }`}
                id="header-back-portal-desktop"
              >
                <Home className={`w-4 h-4 ${isDark ? 'text-teal-300' : 'text-blue-600'}`} />
                <span>{t.goBackPortal}</span>
              </button>
            )}

            {/* Simulated Indicators (Network, Theme, Language toggles) */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              
              {/* Network Toggle indicator */}
              <button
                onClick={onToggleOnline}
                title={isOnline ? t.onlineStatus : t.offlineStatus}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  isOnline
                    ? isDark
                      ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300 hover:bg-emerald-900/40'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    : isDark
                      ? 'bg-rose-950/40 border-rose-800/40 text-rose-300 hover:bg-rose-900/40 animate-pulse'
                      : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 animate-pulse'
                }`}
                id="header-network-toggle"
              >
                {isOnline ? (
                  <>
                    <Wifi className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <span className="hidden lg:inline">{t.onlineStatus}</span>
                    <span className="lg:hidden">{currentLang === 'ar' ? 'متصل' : 'Online'}</span>
                  </>
                ) : (
                  <>
                    <WifiOff className={`w-3.5 h-3.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                    <span className="hidden lg:inline">{t.offlineStatus}</span>
                    <span className="lg:hidden">{currentLang === 'ar' ? 'أوفلاين' : 'Offline'}</span>
                    {unsyncedCount > 0 && (
                      <span className="ml-1 bg-rose-600 text-white rounded-full text-[9px] px-1.5 py-0.5">
                        {unsyncedCount}
                      </span>
                    )}
                  </>
                )}
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={onToggleTheme}
                title={isDark ? (isRtl ? 'الوضع الفاتح' : 'Light Mode') : (isRtl ? 'الوضع الداكن' : 'Dark Mode')}
                className={`flex items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-amber-300 hover:bg-white/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                id="header-theme-toggle"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
                ) : (
                  <Moon className="w-4 h-4 text-blue-600" />
                )}
              </button>

              {/* Language Switcher */}
              <button
                onClick={() => onLanguageChange(currentLang === 'ar' ? 'en' : 'ar')}
                className={`flex items-center gap-1.5 px-3 py-2 border text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#002d2c] border-teal-800/40 hover:bg-[#003d3c] text-slate-200'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                id="header-language-toggle"
              >
                <Languages className={`w-3.5 h-3.5 ${isDark ? 'text-teal-300' : 'text-blue-600'}`} />
                <span>{t.changeLang}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Mobile-Only Back to Portal Button */}
        {userRole !== 'portal' && (
          <div className={`flex md:hidden border-t py-2.5 ${isDark ? 'border-teal-800/30' : 'border-slate-100'}`}>
            <button
              onClick={onBackToPortal}
              className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                isDark
                  ? 'bg-teal-950/40 border-teal-700/50 text-teal-300 hover:bg-teal-900/40'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
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

