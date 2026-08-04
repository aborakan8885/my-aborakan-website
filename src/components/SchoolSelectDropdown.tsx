import React, { useState, useRef, useEffect } from 'react';
import { SchoolItem } from '../types';
import { Search, Building2, Check, ChevronDown, X, Sparkles, Hash } from 'lucide-react';
import { normalizeArabicText, matchesSearchQuery } from './Dashboard';

export { normalizeArabicText };

interface SchoolSelectDropdownProps {
  schools: SchoolItem[];
  value: string;
  onChange: (schoolName: string, ministryCode?: string, schoolObj?: SchoolItem) => void;
  placeholder?: string;
  isDark?: boolean;
  isRtl?: boolean;
  required?: boolean;
  error?: string;
  id?: string;
  label?: string;
  helperText?: string;
}

export const SchoolSelectDropdown: React.FC<SchoolSelectDropdownProps> = ({
  schools,
  value,
  onChange,
  placeholder,
  isDark = false,
  isRtl = true,
  required = false,
  error,
  id = 'school-search-select',
  label,
  helperText
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter with ultra-high sensitivity matching
  const filteredSchools = schools.filter((school) => {
    return matchesSearchQuery(
      [
        school.nameAr,
        school.nameEn,
        school.ministryCode,
        (school as any).code,
        school.district,
        school.stage,
        school.gender === 'boys' ? 'بنين' : school.gender === 'girls' ? 'بنات' : 'مشترك'
      ],
      searchQuery
    );
  });

  const handleSelect = (school: SchoolItem) => {
    const codeToUse = school.ministryCode || (school as any).code;
    setSearchQuery(school.nameAr);
    onChange(school.nameAr, codeToUse, school);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    const matched = schools.find(s => s.nameAr.trim().toLowerCase() === val.trim().toLowerCase());
    onChange(val, matched ? (matched.ministryCode || (matched as any).code) : undefined, matched);
    if (!isOpen) setIsOpen(true);
  };

  const handleClear = () => {
    setSearchQuery('');
    onChange('');
    setIsOpen(true);
  };

  return (
    <div className="relative w-full" ref={containerRef} id={id}>
      {label && (
        <label className={`block text-xs font-black mb-1.5 ${isDark ? 'text-teal-200' : 'text-slate-700'}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none ${
          isRtl ? 'right-3.5' : 'left-3.5'
        }`}>
          <Building2 className={`w-4 h-4 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || (isRtl ? 'ابحث باسم المدرسة أو الرقم الوزاري (تحسس عالي)...' : 'Search school name or ministerial code...')}
          className={`w-full py-2.5 px-10 rounded-xl text-xs font-extrabold transition-all outline-none border ${
            error
              ? 'border-red-500 ring-2 ring-red-500/20'
              : isOpen
              ? isDark
                ? 'border-teal-500 ring-2 ring-teal-500/30 bg-slate-900 text-white'
                : 'border-teal-600 ring-2 ring-teal-600/20 bg-white text-slate-900'
              : isDark
              ? 'border-teal-800/60 bg-teal-950/30 text-teal-100 hover:border-teal-700'
              : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
          }`}
        />

        <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 ${
          isRtl ? 'left-3' : 'right-3'
        }`}>
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className={`p-1 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-all ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`p-1 rounded-md ${isDark ? 'text-teal-400' : 'text-slate-500'}`}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {error && <p className="mt-1 text-[11px] font-bold text-red-500">{error}</p>}
      {helperText && !error && (
        <p className={`mt-1 text-[10px] font-semibold ${isDark ? 'text-teal-300/80' : 'text-slate-500'}`}>
          {helperText}
        </p>
      )}

      {/* High-Sensitivity Filtered Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 w-full rounded-2xl shadow-2xl border max-h-64 overflow-y-auto backdrop-blur-md transition-all ${
            isDark
              ? 'bg-slate-900/95 border-teal-800/80 text-teal-100 divide-y divide-teal-900/40'
              : 'bg-white/98 border-teal-200 text-slate-800 divide-y divide-slate-100'
          }`}
        >
          <div className={`p-2 sticky top-0 z-10 flex items-center justify-between border-b text-[10px] font-black ${
            isDark ? 'bg-slate-900 text-teal-300 border-teal-800/60' : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            <span className="flex items-center gap-1">
              <Search className="w-3 h-3 text-teal-500" />
              {isRtl ? `نتائج البحث الذكي السريع (${filteredSchools.length} مدرسة)` : `Smart Results (${filteredSchools.length})`}
            </span>
            <span className="text-teal-600 dark:text-teal-400 font-extrabold flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" />
              {isRtl ? 'مطابقة عالية التحسس' : 'High Sensitivity Match'}
            </span>
          </div>

          {filteredSchools.length > 0 ? (
            filteredSchools.map((school) => {
              const isSelected = value && value.trim().toLowerCase() === school.nameAr.trim().toLowerCase();
              return (
                <button
                  key={school.id}
                  type="button"
                  onClick={() => handleSelect(school)}
                  className={`w-full text-start p-3 transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-teal-900/60 text-white font-black'
                        : 'bg-teal-50 text-teal-900 font-black'
                      : isDark
                      ? 'hover:bg-teal-950/80 text-teal-100'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs">{school.nameAr}</span>
                      {(school.ministryCode || (school as any).code) && (
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          isDark ? 'bg-teal-950 text-teal-300 border border-teal-800/60' : 'bg-teal-100/80 text-teal-900 border border-teal-200'
                        }`}>
                          <Hash className="w-2.5 h-2.5 opacity-70" />
                          {school.ministryCode || (school as any).code}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-teal-300/70 font-bold">
                      {school.stage && (
                        <span>
                          {school.stage === 'Elementary' ? (isRtl ? 'الابتدائية' : 'Elementary')
                            : school.stage === 'Intermediate' ? (isRtl ? 'المتوسطة' : 'Intermediate')
                            : school.stage === 'Secondary' ? (isRtl ? 'الثانوية' : 'Secondary')
                            : school.stage === 'Kindergarten' ? (isRtl ? 'رياض الأطفال' : 'Kindergarten')
                            : school.stage}
                        </span>
                      )}
                      {school.gender && (
                        <span>• {school.gender === 'boys' ? (isRtl ? 'بنين' : 'Boys') : school.gender === 'girls' ? (isRtl ? 'بنات' : 'Girls') : (isRtl ? 'مشترك' : 'Both')}</span>
                      )}
                      {school.district && <span>• {school.district}</span>}
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 ms-2" />}
                </button>
              );
            })
          ) : (
            <div className="p-4 text-center">
              <p className={`text-xs font-bold ${isDark ? 'text-teal-300' : 'text-slate-600'}`}>
                {isRtl ? `لم نجد مدرسة بالمطابقة المباشرة لـ: "${searchQuery}"` : `No direct school match for: "${searchQuery}"`}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(searchQuery);
                    setIsOpen(false);
                  }}
                  className="mt-2.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition-all inline-flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isRtl ? `اعتماد الاسم المدخل ("${searchQuery}")` : `Use custom name ("${searchQuery}")`}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
