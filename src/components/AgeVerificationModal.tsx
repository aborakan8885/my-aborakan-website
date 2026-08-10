import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  FileText,
  X,
  Sparkles,
  Info,
  Award,
  ArrowLeft,
  CalendarDays
} from 'lucide-react';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (details: {
    status: 'direct' | 'exemption';
    birthDate: string;
    hijriBirthDate?: string;
    declarationAccepted: boolean;
    stageName: string;
  }) => void;
  isDark?: boolean;
  isRtl?: boolean;
}

export const HIJRI_MONTHS_AR = [
  '1. محرم',
  '2. صفر',
  '3. ربيع الأول',
  '4. ربيع الآخر',
  '5. جمادى الأولى',
  '6. جمادى الآخرة',
  '7. رجب',
  '8. شعبان',
  '9. رمضان',
  '10. شوال',
  '11. ذو القعدة',
  '12. ذو الحجة',
];

export const GREGORIAN_MONTHS_AR = [
  '1 - يناير (يناير)',
  '2 - فبراير (فبراير)',
  '3 - مارس (مارس)',
  '4 - أبريل (أبريل)',
  '5 - مايو (مايو)',
  '6 - يونيو (يونيو)',
  '7 - يوليو (يوليو)',
  '8 - أغسطس (أغسطس)',
  '9 - سبتمبر (سبتمبر)',
  '10 - أكتوبر (أكتوبر)',
  '11 - نوفمبر (نوفمبر)',
  '12 - ديسمبر (ديسمبر)',
];

/**
 * Convert Hijri date (Year, Month 1-12, Day 1-30) to ISO Gregorian YYYY-MM-DD
 * Uses native Intl Um Al Qura calendar matching Saudi Arabia official standard.
 */
export function convertHijriToGregorian(hYear: number, hMonth: number, hDay: number): string {
  try {
    const approxGYear = Math.floor(621.5774 + hYear * 0.970224);
    const testDate = new Date(Date.UTC(approxGYear, hMonth - 1, 15));

    const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });

    for (let i = -70; i <= 70; i++) {
      const candidate = new Date(testDate.getTime() + i * 86400000);
      const parts = formatter.formatToParts(candidate);
      let candHDay = 0, candHMonth = 0, candHYear = 0;
      for (const p of parts) {
        if (p.type === 'day') candHDay = parseInt(p.value, 10);
        if (p.type === 'month') candHMonth = parseInt(p.value, 10);
        if (p.type === 'year') candHYear = parseInt(p.value, 10);
      }
      if (candHYear === hYear && candHMonth === hMonth && candHDay === hDay) {
        const y = candidate.getUTCFullYear();
        const m = String(candidate.getUTCMonth() + 1).padStart(2, '0');
        const d = String(candidate.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
  } catch (err) {
    console.error('Hijri conversion error:', err);
  }
  return '2020-08-24';
}

/**
 * Extract Hijri date parts (day, month, year, formatted string) from a Gregorian YYYY-MM-DD string
 */
export function getHijriPartsFromGregorian(dobString: string) {
  if (!dobString) return { day: 5, month: 1, year: 1442, formatted: '' };
  const parts = dobString.split('-');
  if (parts.length !== 3) return { day: 5, month: 1, year: 1442, formatted: '' };

  const birthDate = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));

  try {
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    const formatted = formatter.format(birthDate);

    const numFormatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
    const numParts = numFormatter.formatToParts(birthDate);
    let day = 1, month = 1, year = 1442;
    for (const p of numParts) {
      if (p.type === 'day') day = parseInt(p.value, 10);
      if (p.type === 'month') month = parseInt(p.value, 10);
      if (p.type === 'year') year = parseInt(p.value, 10);
    }
    return { day, month, year, formatted };
  } catch {
    return { day: 5, month: 1, year: 1442, formatted: '' };
  }
}

export function evaluateStudentAge(dobString: string) {
  if (!dobString) {
    return {
      category: 'none' as const,
      hijriDate: '',
      calculatedAgeFormatted: '',
      messageAr: '',
    };
  }

  const parts = dobString.split('-');
  if (parts.length !== 3) {
    return { category: 'none' as const, hijriDate: '', calculatedAgeFormatted: '', messageAr: '' };
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const birthDate = new Date(Date.UTC(year, month, day));

  const directLimit = new Date(Date.UTC(2020, 7, 24)); // 24 August 2020 (5 Muharram 1442 AH)
  const exemptionStart = new Date(Date.UTC(2020, 7, 25)); // 25 August 2020 (6 Muharram 1442 AH)
  const exemptionEnd = new Date(Date.UTC(2020, 10, 22)); // 22 November 2020 (7 Rabi' al-Thani 1442 AH)

  const hijriInfo = getHijriPartsFromGregorian(dobString);

  if (birthDate <= directLimit) {
    return {
      category: 'direct' as const,
      hijriDate: hijriInfo.formatted,
      calculatedAgeFormatted: '6 سنوات أو أكثر (مستوفي نظامياً للقبول المباشر)',
      messageAr: 'الطالب/الطالبة أتم السن النظامي للقبول المباشر للصف الأول الابتدائي بدون شروط تجاوز.',
    };
  } else if (birthDate >= exemptionStart && birthDate <= exemptionEnd) {
    return {
      category: 'exemption' as const,
      hijriDate: hijriInfo.formatted,
      calculatedAgeFormatted: '5 سنوات و9 أشهر إلى 6 سنوات (فترة التجاوز الـ 90 يوماً)',
      messageAr: 'الطالب/الطالبة يقل عمره عن السن النظامي بفترة لا تتجاوز 90 يوماً. يخضع للقبول الاستثنائي بشرط إتمام سنة بالروضة (المستوى الثالث).',
    };
  } else {
    return {
      category: 'underage' as const,
      hijriDate: hijriInfo.formatted,
      calculatedAgeFormatted: 'أقل من 5 سنوات و9 أشهر (غير مستوفي للسن)',
      messageAr: 'عفواً، الطالب/الطالبة لم يبلغ السن النظامي المعتمد للقبول (دون السن المسموح حتى بنسبة التجاوز الـ 90 يوماً).',
    };
  }
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  isDark = false,
  isRtl = true,
}) => {
  const [selectedStage, setSelectedStage] = useState<'primary_grade1' | 'kindergarten' | 'other'>('primary_grade1');
  const [dateMode, setDateMode] = useState<'gregorian' | 'hijri'>('gregorian');
  
  // Gregorian birth date state
  const [birthDate, setBirthDate] = useState<string>('2020-08-20');

  // Gregorian breakdown dropdown states
  const [gregorianDay, setGregorianDay] = useState<number>(20);
  const [gregorianMonth, setGregorianMonth] = useState<number>(8);
  const [gregorianYear, setGregorianYear] = useState<number>(2020);
  
  // Hijri birth date breakdown state
  const [hijriDay, setHijriDay] = useState<number>(1);
  const [hijriMonth, setHijriMonth] = useState<number>(1);
  const [hijriYear, setHijriYear] = useState<number>(1442);

  const [declarationAccepted, setDeclarationAccepted] = useState<boolean>(false);

  // Sync Gregorian & Hijri dropdown breakdown whenever birthDate changes
  useEffect(() => {
    if (birthDate) {
      const parts = birthDate.split('-');
      if (parts.length === 3) {
        setGregorianYear(parseInt(parts[0], 10));
        setGregorianMonth(parseInt(parts[1], 10));
        setGregorianDay(parseInt(parts[2], 10));
      }

      const hParts = getHijriPartsFromGregorian(birthDate);
      setHijriDay(hParts.day);
      setHijriMonth(hParts.month);
      setHijriYear(hParts.year);
    }
  }, [birthDate]);

  // Handle Gregorian dropdown change
  const handleGregorianChange = (day: number, month: number, year: number) => {
    setGregorianDay(day);
    setGregorianMonth(month);
    setGregorianYear(year);
    const formattedIso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setBirthDate(formattedIso);
    setDeclarationAccepted(false);
  };

  // Handle Hijri dropdown change
  const handleHijriChange = (day: number, month: number, year: number) => {
    setHijriDay(day);
    setHijriMonth(month);
    setHijriYear(year);
    const convertedGDate = convertHijriToGregorian(year, month, day);
    setBirthDate(convertedGDate);
    setDeclarationAccepted(false);
  };

  const evaluation = useMemo(() => evaluateStudentAge(birthDate), [birthDate]);

  if (!isOpen) return null;

  const handleProceedClick = () => {
    if (selectedStage !== 'primary_grade1') {
      onProceed({
        status: 'direct',
        birthDate: birthDate || '',
        hijriBirthDate: evaluation.hijriDate,
        declarationAccepted: false,
        stageName: selectedStage === 'kindergarten' ? 'رياض الأطفال' : 'مراحل تعليمية أخرى',
      });
      return;
    }

    if (evaluation.category === 'direct') {
      onProceed({
        status: 'direct',
        birthDate,
        hijriBirthDate: evaluation.hijriDate,
        declarationAccepted: false,
        stageName: 'الصف الأول الابتدائي',
      });
    } else if (evaluation.category === 'exemption' && declarationAccepted) {
      onProceed({
        status: 'exemption',
        birthDate,
        hijriBirthDate: evaluation.hijriDate,
        declarationAccepted: true,
        stageName: 'الصف الأول الابتدائي (مستثنى بشرط الروضة)',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div
        className={`w-full max-w-2xl rounded-3xl p-5 sm:p-7 border shadow-2xl relative transition-all ${
          isDark
            ? 'bg-slate-900/95 text-white border-teal-800/80 shadow-teal-950/50'
            : 'bg-white text-slate-900 border-slate-200 shadow-slate-300/50'
        }`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header Ribbon */}
        <div className="flex items-start justify-between border-b pb-4 mb-5 border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-teal-600/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 border border-teal-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300/40">
                  {isRtl ? 'وزارة التعليم - القواعد التنفيذية للقبول' : 'Ministry Regulation Audit'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black mt-1 leading-tight text-slate-800 dark:text-teal-200">
                {isRtl ? 'شاشة التثبت من السن النظامي للقبول والتسجيل' : 'Student Age Verification Portal'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stage Selector */}
        <div className="mb-5 space-y-2">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
            {isRtl ? '1️⃣ حدد المرحلة التعليمية المراد التسجيل فيها:' : '1️⃣ Select Educational Stage:'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'primary_grade1', labelAr: 'الصف الأول الابتدائي 🎒', descAr: 'خاضع لاحتساب السن النظامي' },
              { id: 'kindergarten', labelAr: 'رياض الأطفال 👶', descAr: 'المستوى الأول / الثاني / الثالث' },
              { id: 'other', labelAr: 'المراحل الأعلى 🏫', descAr: 'تحويل أو نقل لصفوف أخرى' },
            ].map((stg) => (
              <button
                key={stg.id}
                type="button"
                onClick={() => setSelectedStage(stg.id as any)}
                className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                  selectedStage === stg.id
                    ? isDark
                      ? 'bg-teal-900/60 border-teal-400 text-teal-100 ring-2 ring-teal-500/30'
                      : 'bg-teal-50 border-teal-600 text-teal-900 ring-2 ring-teal-500/20'
                    : isDark
                      ? 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-extrabold">{stg.labelAr}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{stg.descAr}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedStage === 'primary_grade1' ? (
          <div className="space-y-5">
            {/* Regulatory Rules Banner */}
            <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed space-y-1.5 ${
              isDark ? 'bg-slate-850 border-slate-750 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="font-extrabold text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                <Info className="w-4 h-4 shrink-0" />
                <span>{isRtl ? 'ضوابط السن النظامي المعتمدة للعام الدراسي الحالي:' : 'Approved Regulatory Rules:'}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 pr-1">
                <li>
                  <strong className="text-emerald-600 dark:text-emerald-400">القبول المباشر:</strong> مواليد <strong>24 أغسطس 2020م (5 محرم 1442هـ)</strong> أو قبل ذلك.
                </li>
                <li>
                  <strong className="text-amber-600 dark:text-amber-400">فترة التجاوز (90 يوماً):</strong> مواليد الفترة من <strong>25 أغسطس 2020م إلى 22 نوفمبر 2020م (6 محرم 1442هـ - 7 ربيع الآخر 1442هـ)</strong> (يشترط إتمام سنة دراسية كاملة بالروضة المستوى الثالث).
                </li>
              </ul>
            </div>

            {/* Calendar Mode Switcher (Gregorian vs Hijri) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-800 dark:text-teal-200 flex items-center gap-1.5">
                  <CalendarDays className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
                  <span>{isRtl ? '2️⃣ أدخل تاريخ ميلاد الطالب/الطالبة:' : '2️⃣ Enter Student Date of Birth:'}</span>
                </label>

                {/* Switcher Pills */}
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setDateMode('gregorian')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      dateMode === 'gregorian'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isRtl ? '📅 ميلادي (قوائم منسدلة)' : '📅 Gregorian Dropdowns'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateMode('hijri')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      dateMode === 'hijri'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isRtl ? '🌙 هجري (أم القرى)' : '🌙 Hijri Dropdowns'}
                  </button>
                </div>
              </div>

              {/* Date Input Box Based on Mode - Both using clean 3-column Dropdowns */}
              {dateMode === 'gregorian' ? (
                <div className="space-y-2 p-3.5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/80">
                  <div className="text-xs font-black text-teal-800 dark:text-teal-300 mb-2">
                    {isRtl ? 'اختر اليوم والشهر والسنة بالتقويم الميلادي:' : 'Select Gregorian Day, Month & Year:'}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Gregorian Day */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                        {isRtl ? 'اليوم الميلادي:' : 'Day:'}
                      </label>
                      <select
                        value={gregorianDay}
                        onChange={(e) => handleGregorianChange(parseInt(e.target.value, 10), gregorianMonth, gregorianYear)}
                        className={`w-full px-2.5 py-2.5 rounded-xl text-xs font-black border outline-none ${
                          isDark ? 'bg-slate-800 border-teal-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Gregorian Month */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                        {isRtl ? 'الشهر الميلادي:' : 'Month:'}
                      </label>
                      <select
                        value={gregorianMonth}
                        onChange={(e) => handleGregorianChange(gregorianDay, parseInt(e.target.value, 10), gregorianYear)}
                        className={`w-full px-2 py-2.5 rounded-xl text-xs font-black border outline-none ${
                          isDark ? 'bg-slate-800 border-teal-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        {GREGORIAN_MONTHS_AR.map((mName, idx) => (
                          <option key={idx + 1} value={idx + 1}>
                            {mName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Gregorian Year */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                        {isRtl ? 'السنة الميلادية:' : 'Year:'}
                      </label>
                      <select
                        value={gregorianYear}
                        onChange={(e) => handleGregorianChange(gregorianDay, gregorianMonth, parseInt(e.target.value, 10))}
                        className={`w-full px-2 py-2.5 rounded-xl text-xs font-black border outline-none ${
                          isDark ? 'bg-slate-800 border-teal-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        {[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023].map((y) => (
                          <option key={y} value={y}>
                            {y}م
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Equivalent Hijri display */}
                  {evaluation.hijriDate && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 mt-2">
                      <span>🌙 {isRtl ? `التاريخ الهجري المطابق (أم القرى):` : `Corresponding Hijri:`}</span>
                      <span className="font-black text-amber-600 dark:text-amber-400">{evaluation.hijriDate}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 p-3.5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/80">
                  <div className="text-xs font-black text-teal-800 dark:text-teal-300 mb-2">
                    {isRtl ? 'اختر اليوم والشهر والسنة بالتقويم الهجري:' : 'Select Hijri Day, Month & Year:'}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Hijri Day */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                        {isRtl ? 'اليوم الهجري:' : 'Hijri Day:'}
                      </label>
                      <select
                        value={hijriDay}
                        onChange={(e) => handleHijriChange(parseInt(e.target.value, 10), hijriMonth, hijriYear)}
                        className={`w-full px-2.5 py-2.5 rounded-xl text-xs font-black border outline-none ${
                          isDark ? 'bg-slate-800 border-teal-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Hijri Month */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                        {isRtl ? 'الشهر الهجري:' : 'Hijri Month:'}
                      </label>
                      <select
                        value={hijriMonth}
                        onChange={(e) => handleHijriChange(hijriDay, parseInt(e.target.value, 10), hijriYear)}
                        className={`w-full px-2 py-2.5 rounded-xl text-xs font-black border outline-none ${
                          isDark ? 'bg-slate-800 border-teal-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        {HIJRI_MONTHS_AR.map((mName, idx) => (
                          <option key={idx + 1} value={idx + 1}>
                            {mName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Hijri Year */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                        {isRtl ? 'السنة الهجرية:' : 'Hijri Year:'}
                      </label>
                      <select
                        value={hijriYear}
                        onChange={(e) => handleHijriChange(hijriDay, hijriMonth, parseInt(e.target.value, 10))}
                        className={`w-full px-2 py-2.5 rounded-xl text-xs font-black border outline-none ${
                          isDark ? 'bg-slate-800 border-teal-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        {[1437, 1438, 1439, 1440, 1441, 1442, 1443, 1444, 1445].map((y) => (
                          <option key={y} value={y}>
                            {y} هـ
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Equivalent Gregorian Conversion display */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 mt-2">
                    <span>📅 {isRtl ? 'التاريخ الميلادي المحسوب تلقائياً:' : 'Calculated Gregorian Date:'}</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">{birthDate}</span>
                  </div>
                </div>
              )}

              {/* Preset Buttons for Quick Testing */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400">{isRtl ? 'نماذج للتجربة:' : 'Quick Presets:'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setBirthDate('2019-11-10');
                    setDateMode('gregorian');
                    setDeclarationAccepted(false);
                  }}
                  className="px-2 py-1 text-[10px] font-extrabold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer hover:scale-105 transition-transform"
                >
                  🟢 5 ربيع الأول 1441هـ (قبول مباشر)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBirthDate('2020-09-15');
                    setDateMode('gregorian');
                    setDeclarationAccepted(false);
                  }}
                  className="px-2 py-1 text-[10px] font-extrabold rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-pointer hover:scale-105 transition-transform"
                >
                  🟡 27 محرم 1442هـ (استثناء تجاوز الروضة)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBirthDate('2021-01-20');
                    setDateMode('gregorian');
                    setDeclarationAccepted(false);
                  }}
                  className="px-2 py-1 text-[10px] font-extrabold rounded-lg bg-red-50 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800 cursor-pointer hover:scale-105 transition-transform"
                >
                  🔴 7 جمادى الآخرة 1442هـ (دون السن النظامي)
                </button>
              </div>
            </div>

            {/* Evaluation Result Card */}
            {evaluation.category === 'direct' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/50 space-y-3 animate-scale-up">
                <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <h4 className="text-sm sm:text-base font-black">
                    {isRtl ? '1️⃣ القبول المباشر (بدون شروط تجاوز) - مستوفي نظامياً ✓' : '1️⃣ Direct Admission Eligible ✓'}
                  </h4>
                </div>
                <p className="text-xs font-bold leading-relaxed text-emerald-900 dark:text-emerald-200">
                  {evaluation.messageAr}
                </p>
                <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300/90 bg-emerald-100/60 dark:bg-emerald-950/60 p-2.5 rounded-xl flex flex-wrap items-center gap-2">
                  <span>{isRtl ? `التاريخ الميلادي: ${birthDate}` : `Gregorian: ${birthDate}`}</span>
                  <span>•</span>
                  <span>{isRtl ? `التاريخ الهجري: ${evaluation.hijriDate || 'معتمد'}` : `Hijri: ${evaluation.hijriDate}`}</span>
                </div>
              </div>
            )}

            {evaluation.category === 'exemption' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/60 space-y-3.5 animate-scale-up">
                <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-6 h-6 shrink-0 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-sm sm:text-base font-black">
                    {isRtl ? '2️⃣ القبول بنسبة التجاوز (الاستثناء المحدود - 90 يوماً)' : '2️⃣ Exception Grace Period Admission'}
                  </h4>
                </div>
                
                <p className="text-xs font-bold leading-relaxed text-amber-900 dark:text-amber-200">
                  {evaluation.messageAr}
                </p>

                <div className="p-3.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 space-y-2">
                  <div className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{isRtl ? 'إقرار وتعهد ولي الأمر النظامي (إلزامي):' : 'Mandatory Guardian Declaration:'}</span>
                  </div>
                  
                  <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={declarationAccepted}
                      onChange={(e) => setDeclarationAccepted(e.target.checked)}
                      className="w-5 h-5 rounded border-amber-400 text-teal-600 focus:ring-teal-500 mt-0.5 shrink-0 cursor-pointer"
                    />
                    <span className="text-[11px] font-extrabold leading-relaxed text-amber-950 dark:text-amber-100 select-none">
                      {isRtl
                        ? 'أقر وأتعهد أنا ولي الأمر بأن الطالب/الطالبة قد أتم سنة دراسية كاملة في مرحلة رياض الأطفال (المستوى الثالث) بروضة مرخصة ومعتمدة، وأمتلك وثيقة الإثبات الرسمية وأتحمل المسؤولية النظامية الكاملة عن صحة ذلك.'
                        : 'I declare that the student completed a full year in Kindergarten Level 3 with official documentation.'}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {evaluation.category === 'underage' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-red-500/10 border-2 border-red-500/60 space-y-3 animate-scale-up">
                <div className="flex items-center gap-2.5 text-red-700 dark:text-red-400">
                  <XCircle className="w-6 h-6 shrink-0" />
                  <h4 className="text-sm sm:text-base font-black">
                    {isRtl ? 'غير مستوفي للسن النظامي المعتمد (رفض نظامي)' : 'Ineligible - Underage'}
                  </h4>
                </div>
                <p className="text-xs font-bold leading-relaxed text-red-900 dark:text-red-200">
                  {evaluation.messageAr}
                </p>
                <div className="text-[11px] font-semibold text-red-800 dark:text-red-300 bg-red-100/60 dark:bg-red-950/60 p-2.5 rounded-xl">
                  {isRtl
                    ? `تاريخ الميلاد الأدنى المسموح به للقبول هذا العام حتى مع نسبة التجاوز هو 22 نوفمبر 2020م (7 ربيع الآخر 1442هـ). تاريخ ميلاد الطالب الحالي هو بعد الحد المسموح به.`
                    : 'Minimum allowed birth date is 22 November 2020.'}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-xs font-bold leading-relaxed text-teal-900 dark:text-teal-200">
            {isRtl
              ? 'المرحلة المختارة لا تخضع لشرط السن النظامي المباشر للصف الأول الابتدائي. يمكنك الانتقال مباشرة لتقديم الطلب وسيقوم الفريق المختص بمراجعة كافة البيانات.'
              : 'Selected stage does not require primary 1st grade age verification. You can proceed directly.'}
          </div>
        )}

        {/* Modal Action Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs font-black bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {isRtl ? 'إلغاء والعودة' : 'Cancel & Return'}
          </button>

          {selectedStage === 'primary_grade1' ? (
            evaluation.category === 'direct' ? (
              <button
                type="button"
                onClick={handleProceedClick}
                className="w-full sm:w-auto px-7 py-3 rounded-2xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105"
              >
                <span>{isRtl ? 'المتابعة لتقديم الطلب (قبول مباشر) ⬅️' : 'Proceed to Application ⬅️'}</span>
              </button>
            ) : evaluation.category === 'exemption' ? (
              <button
                type="button"
                disabled={!declarationAccepted}
                onClick={handleProceedClick}
                className={`w-full sm:w-auto px-7 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                  declarationAccepted
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 cursor-pointer hover:scale-105'
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed opacity-70'
                }`}
              >
                <span>{isRtl ? 'المتابعة لتقديم الطلب (مقر بشرط الروضة) ⬅️' : 'Proceed with Declaration ⬅️'}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto px-7 py-3 rounded-2xl text-xs font-black bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
              >
                <span>{isRtl ? 'غير مسموح المتابعة (غير مستوفي للسن)' : 'Ineligible to Proceed'}</span>
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={handleProceedClick}
              className="w-full sm:w-auto px-7 py-3 rounded-2xl text-xs font-black bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <span>{isRtl ? 'المتابعة لتقديم الطلب ⬅️' : 'Proceed ⬅️'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
