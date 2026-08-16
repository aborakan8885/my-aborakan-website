/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { SurveyResponse, OfficerUser } from '../types';
import { exportRequestsBackupToExcel, filterSurveysByDateAndType, createFullSystemBackupSnapshot, BackupFilterOptions, getProblemTypeArabicLabel } from '../utils/storageEngine';
import { Download, Calendar, Filter, Database, FileSpreadsheet, ShieldCheck, CheckCircle2, X, AlertCircle, FileText, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DateBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveys: SurveyResponse[];
  officers?: OfficerUser[];
  activeOfficer?: OfficerUser;
  isDark?: boolean;
  isRtl?: boolean;
}

const MONTHS_AR = [
  { value: '1', label: '1 - يناير (January)' },
  { value: '2', label: '2 - فبراير (February)' },
  { value: '3', label: '3 - مارس (March)' },
  { value: '4', label: '4 - أبريل (April)' },
  { value: '5', label: '5 - مايو (May)' },
  { value: '6', label: '6 - يونيو (June)' },
  { value: '7', label: '7 - يوليو (July)' },
  { value: '8', label: '8 - أغسطس (August)' },
  { value: '9', label: '9 - سبتمبر (September)' },
  { value: '10', label: '10 - أكتوبر (October)' },
  { value: '11', label: '11 - نوفمبر (November)' },
  { value: '12', label: '12 - ديسمبر (December)' }
];

export default function DateBackupModal({
  isOpen,
  onClose,
  surveys,
  officers,
  activeOfficer,
  isDark = false
}: DateBackupModalProps) {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [exportMessage, setExportMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  // Extract available years from real records
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    const currentYear = new Date().getFullYear().toString();
    yearsSet.add(currentYear);
    yearsSet.add((Number(currentYear) - 1).toString());

    surveys.forEach(s => {
      if (s.createdAt) {
        const y = new Date(s.createdAt).getFullYear().toString();
        if (!isNaN(Number(y))) yearsSet.add(y);
      }
    });

    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [surveys]);

  // Current filters object
  const currentFilters: BackupFilterOptions = useMemo(() => ({
    year: selectedYear,
    month: selectedMonth,
    day: selectedDay,
    problemType: selectedType,
    stage: selectedStage,
    gender: selectedGender,
    status: selectedStatus
  }), [selectedYear, selectedMonth, selectedDay, selectedType, selectedStage, selectedGender, selectedStatus]);

  // Real-time matching count
  const matchingRecords = useMemo(() => {
    return filterSurveysByDateAndType(surveys, currentFilters);
  }, [surveys, currentFilters]);

  if (!isOpen) return null;

  const handleExportExcel = () => {
    const result = exportRequestsBackupToExcel(surveys, currentFilters, officers);
    if (result.success) {
      setExportMessage({
        text: `تم تصدير النسخة الاحتياطية بنجاح بصيغة Excel (${result.count} طلب) باسم:\n${result.filename}`,
        type: 'success'
      });
    } else {
      setExportMessage({
        text: 'لا توجد طلبات تطابق التاريخ والنوع المحدد لتصديرها.',
        type: 'warning'
      });
    }
  };

  const handleFullBackupSnapshot = async () => {
    try {
      const msg = await createFullSystemBackupSnapshot();
      setExportMessage({ text: msg, type: 'success' });
    } catch (e) {
      setExportMessage({ text: 'تعذر إنشاء النسخة الشاملة', type: 'warning' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl" id="modal-date-backup">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl border ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        } p-6 md:p-8 relative`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="إغلاق النافذة"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6 border-b pb-4 border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              أخذ نسخة احتياطية للطلبات (Excel بالعام والشهر واليوم والنوع)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              تصدير رسمي دقيق مع الحفاظ التام على البيانات في قواعد البيانات المشفرة
            </p>
          </div>
        </div>

        {/* Notice alert */}
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm text-emerald-800 dark:text-emerald-200 space-y-1">
            <p className="font-bold">حماية وتأمين البيانات ضد أي فقدان:</p>
            <p>جميع الطلبات والملفات المرفوعة يتم حفظها محلياً في قاعدة بيانات IndexedDB الصلبة. لا يمكن تصفير أو حذف أي طلب إلا من حساب الإدارة العليا (Admin) بصلاحية صريحة.</p>
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* 1. Year */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              السنة (Year)
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-sm font-semibold transition-all ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
              } focus:ring-2 focus:ring-emerald-500`}
            >
              <option value="all">كل السنوات (جميع السجلات)</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>سنة {yr}</option>
              ))}
            </select>
          </div>

          {/* 2. Month */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              الشهر (Month)
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-sm font-semibold transition-all ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
              } focus:ring-2 focus:ring-emerald-500`}
            >
              <option value="all">كل الأشهر (كامل السنة)</option>
              {MONTHS_AR.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* 3. Day */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              اليوم (Day)
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-sm font-semibold transition-all ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
              } focus:ring-2 focus:ring-emerald-500`}
            >
              <option value="all">كل الأيام (كامل الشهر)</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d.toString()}>يوم {d}</option>
              ))}
            </select>
          </div>

          {/* 4. Request Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              نوع الطلب / المعاملة
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-sm font-semibold transition-all ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
              } focus:ring-2 focus:ring-emerald-500`}
            >
              <option value="all">الكل (كافة أنواع الطلبات)</option>
              <option value="equalizations">معادلات الشهادات الدراسية (ابتدائي / متوسط / ثانوي)</option>
              <option value="vacancies">طلبات الشواغر والنقل المدرسي</option>
              <option value="registrations">تسجيل مستجد (سعودي / مقيم)</option>
              <option value="cert_primary_eq">معادلة شهادة - المرحلة الابتدائية</option>
              <option value="cert_intermediate_eq">معادلة شهادة - المرحلة المتوسطة</option>
              <option value="cert_secondary_eq">معادلة شهادة - المرحلة الثانوية</option>
              <option value="student_density">كثافة طلابية بالفصول</option>
              <option value="unjustified_rejection">رفض القبول دون مبرر</option>
              <option value="distance_from_school">بعد السكن عن المدرسة</option>
              <option value="other">استفسارات وطلبات أخرى</option>
            </select>
          </div>

          {/* 5. Stage */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              المرحلة الدراسية
            </label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-sm font-semibold transition-all ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
              } focus:ring-2 focus:ring-emerald-500`}
            >
              <option value="all">كل المراحل الدراسية</option>
              <option value="الابتدائية">المرحلة الابتدائية</option>
              <option value="المتوسطة">المرحلة المتوسطة</option>
              <option value="الثانوية">المرحلة الثانوية</option>
              <option value="رياض الأطفال">رياض الأطفال</option>
            </select>
          </div>

          {/* 6. Gender */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              نوع الجنس
            </label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-sm font-semibold transition-all ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
              } focus:ring-2 focus:ring-emerald-500`}
            >
              <option value="all">الكل (بنين وبنات)</option>
              <option value="boys">بنين فقط</option>
              <option value="girls">بنات فقط</option>
            </select>
          </div>
        </div>

        {/* Live Matching Count Banner */}
        <div className={`p-4 rounded-xl mb-6 flex items-center justify-between border ${
          matchingRecords.length > 0 
            ? isDark ? 'bg-slate-800/80 border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-200' 
            : isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className={`w-5 h-5 ${matchingRecords.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`} />
            <div>
              <span className="font-bold text-sm">
                عدد الطلبات المطابقة للفلترة المحددة: ({matchingRecords.length}) طلب
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                إجمالي السجلات الكلية المحفوظة بالنظام: ({surveys.length}) سجل
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedYear('all');
              setSelectedMonth('all');
              setSelectedDay('all');
              setSelectedType('all');
              setSelectedStage('all');
              setSelectedGender('all');
            }}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>

        {/* Export Status Toast Message */}
        {exportMessage && (
          <div className={`p-3 rounded-xl mb-6 text-sm flex items-center gap-2 ${
            exportMessage.type === 'success' 
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200' 
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
          }`}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="whitespace-pre-line font-medium">{exportMessage.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleFullBackupSnapshot}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
              title="تصدير لقطة احتياطية كاملة لجميع قواعد البيانات"
            >
              <Database className="w-4 h-4 text-cyan-500" />
              أخذ نسخة شاملة للنظام (JSON)
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              إلغاء
            </button>
            <button
              onClick={handleExportExcel}
              disabled={matchingRecords.length === 0}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                matchingRecords.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/20 active:scale-95'
                  : 'bg-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <Download className="w-4 h-4" />
              تصدير ملف الإكسل الآن (.xlsx)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
