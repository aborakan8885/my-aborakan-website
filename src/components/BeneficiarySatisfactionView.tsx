import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Star, 
  Search, 
  Filter, 
  Users, 
  Download, 
  Printer, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  MessageSquare, 
  TrendingUp, 
  Sparkles, 
  AlertCircle,
  Eye,
  UserCheck,
  GraduationCap,
  Layers,
  Smile,
  Meh,
  Frown,
  ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SurveyResponse, ProblemType } from '../types';

interface BeneficiarySatisfactionViewProps {
  surveys: SurveyResponse[];
  onUpdateSurvey?: (survey: SurveyResponse) => void;
  isDark?: boolean;
  isRtl?: boolean;
}

export default function BeneficiarySatisfactionView({
  surveys,
  onUpdateSurvey,
  isDark = false,
  isRtl = true
}: BeneficiarySatisfactionViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'boys' | 'girls'>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | '3' | '1-2' | 'unrated'>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [onlyWithNotes, setOnlyWithNotes] = useState<boolean>(false);
  const [selectedSurveyNote, setSelectedSurveyNote] = useState<SurveyResponse | null>(null);

  // Helper translations
  const getProblemName = (problemType: ProblemType | string): string => {
    switch (problemType) {
      case 'new_registration_saudi':
        return isRtl ? 'تسجيل مستجد (سعودي)' : 'New Registration (Saudi)';
      case 'new_registration_resident':
        return isRtl ? 'تسجيل مستجد (مقيم)' : 'New Registration (Resident)';
      case 'vacancies_unavailable':
      case 'vacancies_closed':
        return isRtl ? 'عدم توفر شواغر في المدارس' : 'No Vacancies Available';
      case 'student_density':
        return isRtl ? 'كثافة طلابية عالية في الفصول' : 'High Student Density';
      case 'unjustified_rejection':
        return isRtl ? 'رفض غير مبرر من المدرسة' : 'Unjustified Rejection';
      case 'distance_from_school':
        return isRtl ? 'بعد المسافة عن مقر السكن' : 'Distance from Residence';
      case 'unregistered_desire':
        return isRtl ? 'رغبة غير مسجلة' : 'Unregistered Desire';
      case 'cert_primary_eq':
        return isRtl ? 'معادلة شهادة ابتدائية' : 'Primary Cert Equivalency';
      case 'cert_intermediate_eq':
        return isRtl ? 'معادلة شهادة متوسطة' : 'Intermediate Cert Equivalency';
      case 'cert_secondary_eq':
        return isRtl ? 'معادلة شهادة ثانوية' : 'Secondary Cert Equivalency';
      case 'other':
        return isRtl ? 'أخرى' : 'Other';
      default:
        return String(problemType || (isRtl ? 'طلب عام' : 'General Request'));
    }
  };

  const getStageName = (stage: string): string => {
    if (stage === 'EarlyChildhood') return isRtl ? 'طفولة مبكرة' : 'Early Childhood';
    if (stage === 'Kindergarten') return isRtl ? 'رياض أطفال' : 'Kindergarten';
    if (stage === 'Primary') return isRtl ? 'ابتدائي' : 'Primary';
    if (stage === 'Intermediate') return isRtl ? 'متوسط' : 'Intermediate';
    if (stage === 'Secondary') return isRtl ? 'ثانوي' : 'Secondary';
    return stage || (isRtl ? 'غير محدد' : 'Unspecified');
  };

  // Extract clean beneficiary notes (excluding system automated audit trails)
  const getCleanBeneficiaryNotes = (notes?: string) => {
    if (!notes) return '';
    if (notes.includes('🚨') || notes.includes('طلب تسكين') || notes.includes('فتح الشاغر') || notes.includes('توجيه للقيادة') || notes.includes('تم إحالة الطلب')) {
      return '';
    }
    return notes.trim();
  };

  // Derived metrics and satisfaction stats
  const stats = useMemo(() => {
    const total = surveys.length;
    if (total === 0) {
      return {
        total: 0,
        ratedCount: 0,
        unratedCount: 0,
        avgOverall: '0.0',
        overallPct: 0,
        avgStaff: '0.0',
        avgReception: '0.0',
        boysCount: 0,
        boysRatedCount: 0,
        boysAvgSatisfaction: '0.0',
        boysSatisfactionPct: 0,
        girlsCount: 0,
        girlsRatedCount: 0,
        girlsAvgSatisfaction: '0.0',
        girlsSatisfactionPct: 0,
        withNotesCount: 0,
        star5Count: 0,
        star4Count: 0,
        star3Count: 0,
        starLowCount: 0,
      };
    }

    let totalStaff = 0;
    let totalReception = 0;
    let ratedCount = 0;
    let withNotesCount = 0;

    let boysTotal = 0;
    let boysStaffSum = 0;
    let boysReceptionSum = 0;
    let boysRated = 0;

    let girlsTotal = 0;
    let girlsStaffSum = 0;
    let girlsReceptionSum = 0;
    let girlsRated = 0;

    let star5Count = 0;
    let star4Count = 0;
    let star3Count = 0;
    let starLowCount = 0;

    surveys.forEach(s => {
      const staffVal = Number(s.staffSatisfaction) || 0;
      const recepVal = Number(s.receptionSatisfaction) || 0;
      const isRated = staffVal > 0 || recepVal > 0;
      const cleanNote = getCleanBeneficiaryNotes(s.notes);
      if (cleanNote) withNotesCount++;

      const isBoy = s.gender === 'boys' || (s.schoolName && (s.schoolName.includes('بنين') || s.schoolName.includes('ابتدائية') || s.schoolName.includes('متوسطة') || s.schoolName.includes('ثانوية')) && !s.schoolName.includes('بنات') && !s.schoolName.includes('طفولة مبكرة'));
      const isGirl = s.gender === 'girls' || (s.schoolName && (s.schoolName.includes('بنات') || s.stage === 'EarlyChildhood' || s.schoolName.includes('طفولة مبكرة')));

      if (isBoy) boysTotal++;
      if (isGirl) girlsTotal++;

      if (isRated) {
        ratedCount++;
        const sVal = staffVal || 5;
        const rVal = recepVal || 5;
        totalStaff += sVal;
        totalReception += rVal;

        const itemAvg = (sVal + rVal) / 2;
        if (itemAvg >= 4.5) star5Count++;
        else if (itemAvg >= 3.5) star4Count++;
        else if (itemAvg >= 2.5) star3Count++;
        else starLowCount++;

        if (isBoy) {
          boysRated++;
          boysStaffSum += sVal;
          boysReceptionSum += rVal;
        }
        if (isGirl) {
          girlsRated++;
          girlsStaffSum += sVal;
          girlsReceptionSum += rVal;
        }
      }
    });

    const activeRated = ratedCount > 0 ? ratedCount : 1;
    const avgStaffNum = ratedCount > 0 ? (totalStaff / activeRated) : 5.0;
    const avgRecepNum = ratedCount > 0 ? (totalReception / activeRated) : 5.0;
    const avgOverallNum = (avgStaffNum + avgRecepNum) / 2;
    const overallPct = Math.round((avgOverallNum / 5) * 100);

    const boysAvgNum = boysRated > 0 ? ((boysStaffSum + boysReceptionSum) / (boysRated * 2)) : 5.0;
    const girlsAvgNum = girlsRated > 0 ? ((girlsStaffSum + girlsReceptionSum) / (girlsRated * 2)) : 5.0;

    return {
      total,
      ratedCount,
      unratedCount: total - ratedCount,
      avgOverall: avgOverallNum.toFixed(1),
      overallPct,
      avgStaff: avgStaffNum.toFixed(1),
      avgReception: avgRecepNum.toFixed(1),
      boysCount: boysTotal,
      boysRatedCount: boysRated,
      boysAvgSatisfaction: boysAvgNum.toFixed(1),
      boysSatisfactionPct: Math.round((boysAvgNum / 5) * 100),
      girlsCount: girlsTotal,
      girlsRatedCount: girlsRated,
      girlsAvgSatisfaction: girlsAvgNum.toFixed(1),
      girlsSatisfactionPct: Math.round((girlsAvgNum / 5) * 100),
      withNotesCount,
      star5Count,
      star4Count,
      star3Count,
      starLowCount,
    };
  }, [surveys]);

  // Filtered surveys list
  const filteredSurveys = useMemo(() => {
    return surveys.filter(s => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (s.beneficiaryName || '').toLowerCase().includes(q);
        const matchesPhone = (s.phoneNumber || '').includes(q);
        const matchesSchool = (s.schoolName || '').toLowerCase().includes(q);
        const matchesEmployee = (s.serviceEmployee || '').toLowerCase().includes(q);
        const matchesNotes = (s.notes || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesSchool && !matchesEmployee && !matchesNotes) {
          return false;
        }
      }

      // 2. Gender Filter
      if (genderFilter !== 'all') {
        const isBoy = s.gender === 'boys' || (s.schoolName && (s.schoolName.includes('بنين') || s.schoolName.includes('ابتدائية') || s.schoolName.includes('متوسطة') || s.schoolName.includes('ثانوية')) && !s.schoolName.includes('بنات') && !s.schoolName.includes('طفولة مبكرة'));
        const isGirl = s.gender === 'girls' || (s.schoolName && (s.schoolName.includes('بنات') || s.stage === 'EarlyChildhood' || s.schoolName.includes('طفولة مبكرة')));
        if (genderFilter === 'boys' && !isBoy) return false;
        if (genderFilter === 'girls' && !isGirl) return false;
      }

      // 3. Rating Filter
      const staffVal = Number(s.staffSatisfaction) || 0;
      const recepVal = Number(s.receptionSatisfaction) || 0;
      const isRated = staffVal > 0 || recepVal > 0;
      const avgItem = isRated ? ((staffVal || 5) + (recepVal || 5)) / 2 : 0;

      if (ratingFilter === 'unrated' && isRated) return false;
      if (ratingFilter === '5' && avgItem < 4.5) return false;
      if (ratingFilter === '4' && (avgItem < 3.5 || avgItem >= 4.5)) return false;
      if (ratingFilter === '3' && (avgItem < 2.5 || avgItem >= 3.5)) return false;
      if (ratingFilter === '1-2' && (avgItem >= 2.5 || !isRated)) return false;

      // 4. Stage Filter
      if (stageFilter !== 'all' && s.stage !== stageFilter) {
        return false;
      }

      // 5. Notes Filter
      if (onlyWithNotes) {
        const note = getCleanBeneficiaryNotes(s.notes);
        if (!note) return false;
      }

      return true;
    });
  }, [surveys, searchQuery, genderFilter, ratingFilter, stageFilter, onlyWithNotes]);

  // Export to Excel with complete RTL support
  const handleExportExcel = () => {
    const dataRows = filteredSurveys.map((s, idx) => {
      const staffVal = Number(s.staffSatisfaction) || 5;
      const recepVal = Number(s.receptionSatisfaction) || 5;
      const avgVal = ((staffVal + recepVal) / 2).toFixed(1);
      const pct = Math.round((Number(avgVal) / 5) * 100);

      const isBoy = s.gender === 'boys' || (s.schoolName && (s.schoolName.includes('بنين') || s.schoolName.includes('ابتدائية') || s.schoolName.includes('متوسطة') || s.schoolName.includes('ثانوية')) && !s.schoolName.includes('بنات') && !s.schoolName.includes('طفولة مبكرة'));
      const genderLabel = isBoy ? 'بنين 👦' : 'بنات 👧';

      const cleanNotes = getCleanBeneficiaryNotes(s.notes);

      return {
        'م': idx + 1,
        'رقم المعاملة': s.id,
        'اسم المستفيد (ولي الأمر)': s.beneficiaryName || 'غير محدد',
        'جنس الطالب': genderLabel,
        'رقم الجوال': s.phoneNumber || '',
        'المدرسة المعنية': (s as any).vacancyOpenedSchoolName || s.schoolName || '',
        'المرحلة الدراسية': getStageName(s.stage),
        'الصف': s.grade || 'غير محدد',
        'نوع الطلب': getProblemName(s.problemType),
        'الموظف المختص': s.serviceEmployee || 'إدارة القبول والتوجيه',
        'تقييم أداء الموظف (1-5)': staffVal,
        'تقييم الاستقبال والتوجيه (1-5)': recepVal,
        'متوسط التقييم العام (من 5)': avgVal,
        'نسبة الرضا': `${pct}%`,
        'مقترحات وملاحظات ولي الأمر': cleanNotes || 'لا توجد ملاحظات إضافية',
        'تاريخ التقديم': new Date(s.createdAt).toLocaleDateString('ar-SA'),
        'حالة التسكين والمعالجة': s.isResolved ? 'تم المعالجة والتسكين ✅' : 'قيد المتابعة والإجراء'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    
    // Set Right-to-Left (RTL) views on worksheet
    worksheet['!views'] = [{ RTL: true }];

    // Auto calculate column widths
    worksheet['!cols'] = [
      { wch: 6 },  // م
      { wch: 16 }, // رقم المعاملة
      { wch: 25 }, // اسم المستفيد
      { wch: 14 }, // جنس الطالب
      { wch: 16 }, // رقم الجوال
      { wch: 30 }, // المدرسة المعنية
      { wch: 16 }, // المرحلة الدراسية
      { wch: 14 }, // الصف
      { wch: 26 }, // نوع الطلب
      { wch: 22 }, // الموظف المختص
      { wch: 22 }, // تقييم أداء الموظف
      { wch: 24 }, // تقييم الاستقبال
      { wch: 20 }, // متوسط التقييم العام
      { wch: 14 }, // نسبة الرضا
      { wch: 45 }, // مقترحات وملاحظات ولي الأمر
      { wch: 18 }, // تاريخ التقديم
      { wch: 26 }  // حالة التسكين
    ];

    const workbook = XLSX.utils.book_new();
    
    // Set Right-to-Left (RTL) view on workbook level
    if (!workbook.Workbook) workbook.Workbook = {};
    workbook.Workbook.Views = [{ RTL: true }];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'قياس رضا المستفيدين');
    XLSX.writeFile(workbook, `تقرير_قياس_رضا_المستفيدين_شامل_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-fade-in dir-rtl" style={{ direction: 'rtl' }}>
      
      {/* 1. Grand Header Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl transition-all relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-r from-[#0b2336] via-[#10304a] to-[#081f2f] border-amber-500/40 text-white' 
          : 'bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-700 border-amber-500 text-white shadow-amber-900/10'
      }`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 bg-white/15 rounded-2xl border border-white/20 backdrop-blur-md shadow-md text-amber-300">
              <Award className="w-9 h-9 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-400 text-slate-950 shadow-xs">
                  ⭐ منظومة حوكمة قياس رضا المستفيدين
                </span>
                <span className="text-xs text-amber-100 font-bold">• تقارير الجودة ورعاية أولياء الأمور</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1.5 flex items-center gap-2.5">
                <span>قياس رضا المستفيدين</span>
                <span className="text-base font-bold bg-white/20 px-3 py-0.5 rounded-xl">
                  {stats.avgOverall} / 5 ({stats.overallPct}%)
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-amber-100 font-medium mt-1 max-w-2xl leading-relaxed">
                لوحة تحكم إشرافية موحدة لتحليل تقييمات أولياء الأمور، تصنيف الرضا وفق جنس الطلاب (بنين / بنات)، والملاحظات المباشرة.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={handleExportExcel}
              className="px-5 py-3 bg-white text-slate-900 hover:bg-amber-50 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-95 border border-white"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>تصدير تقرير الإكسل (RTL) 📊</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-3 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-2xl border border-white/20 shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              <span>طباعة التقرير</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* 2. Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Metric 1: Overall Satisfaction */}
        <div className={`p-6 rounded-3xl border shadow-md transition-all flex flex-col justify-between ${
          isDark ? 'glass-card-dark text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">مؤشر الرضا العام</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-500">
              <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono">{stats.avgOverall}</span>
              <span className="text-sm font-bold text-slate-400">/ 5.0</span>
              <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mr-auto">
                {stats.overallPct}% رضا
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.overallPct}%` }}
              />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 font-bold flex justify-between">
            <span>من إجمالي {stats.ratedCount} مقيّم</span>
            <span>ممتاز ⭐⭐⭐⭐⭐</span>
          </div>
        </div>

        {/* Metric 2: Staff Support Rating */}
        <div className={`p-6 rounded-3xl border shadow-md transition-all flex flex-col justify-between ${
          isDark ? 'glass-card-dark text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">أداء ومساعدة الموظفين</span>
            <div className="p-2.5 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-teal-600 dark:text-teal-400">{stats.avgStaff}</span>
              <span className="text-sm font-bold text-slate-400">/ 5.0</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((Number(stats.avgStaff) / 5) * 100)}%` }}
              />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 font-bold">
            تقييم استجابة ومساعدة الكوادر المتخصصة
          </div>
        </div>

        {/* Metric 3: Reception Quality */}
        <div className={`p-6 rounded-3xl border shadow-md transition-all flex flex-col justify-between ${
          isDark ? 'glass-card-dark text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">جودة الاستقبال والتوجيه</span>
            <div className="p-2.5 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-blue-600 dark:text-blue-400">{stats.avgReception}</span>
              <span className="text-sm font-bold text-slate-400">/ 5.0</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((Number(stats.avgReception) / 5) * 100)}%` }}
              />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 font-bold">
            حسن الاستقبال والإرشاد والتوجيه
          </div>
        </div>

        {/* Metric 4: Feedback Comments Count */}
        <div className={`p-6 rounded-3xl border shadow-md transition-all flex flex-col justify-between ${
          isDark ? 'glass-card-dark text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">المقترحات والملاحظات الواردة</span>
            <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-purple-600 dark:text-purple-400">{stats.withNotesCount}</span>
              <span className="text-xs font-bold text-slate-400">مقترح ورسالة</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((stats.withNotesCount / (stats.total || 1)) * 100))}%` }}
              />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 font-bold">
            آراء ومقترحات مكتوبة بشفافية من أولياء الأمور
          </div>
        </div>

      </div>

      {/* 3. Detailed Satisfaction Breakdown by Student Gender (بنين / بنات) */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-lg ${
        isDark ? 'glass-card-dark text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4 mb-6 dark:border-teal-800/30">
          <div>
            <h3 className="text-lg sm:text-xl font-black flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-500" />
              <span>مؤشر قياس الرضا بحسب جنس الطالب (بنين / بنات)</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              مقارنة تحليلية دقيقة بين تقييمات أولياء أمور الطلاب والطالبات ونسب الرضا
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              👦 بنين: {stats.boysCount}
            </span>
            <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
              👧 بنات: {stats.girlsCount}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Boys Card */}
          <div className={`p-6 rounded-2xl border-2 transition-all ${
            isDark 
              ? 'bg-blue-950/20 border-blue-800/50' 
              : 'bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border-blue-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md">
                  <span className="text-xl">👦</span>
                </div>
                <div>
                  <h4 className="text-base font-black text-blue-900 dark:text-blue-200">
                    أولياء أمور الطلاب (بنين)
                  </h4>
                  <p className="text-xs text-blue-700/80 dark:text-blue-300/80 font-bold">
                    مدارس ومراحل البنين
                  </p>
                </div>
              </div>
              <div className="text-left">
                <span className="text-2xl sm:text-3xl font-black font-mono text-blue-700 dark:text-blue-300">
                  {stats.boysAvgSatisfaction}
                </span>
                <span className="text-xs font-bold text-slate-400"> / 5.0</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-300">نسبة الرضا العامة:</span>
                <span className="font-mono font-black text-blue-700 dark:text-blue-300">{stats.boysSatisfactionPct}%</span>
              </div>
              <div className="w-full bg-blue-100 dark:bg-blue-950 h-3 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${stats.boysSatisfactionPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500 pt-1">
                <span>إجمالي الطلبات: {stats.boysCount}</span>
                <span>المقيّمة: {stats.boysRatedCount}</span>
              </div>
            </div>
          </div>

          {/* Girls Card */}
          <div className={`p-6 rounded-2xl border-2 transition-all ${
            isDark 
              ? 'bg-pink-950/20 border-pink-800/50' 
              : 'bg-gradient-to-br from-pink-50/80 to-rose-50/50 border-pink-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-pink-600 text-white rounded-2xl shadow-md">
                  <span className="text-xl">👧</span>
                </div>
                <div>
                  <h4 className="text-base font-black text-pink-900 dark:text-pink-200">
                    أولياء أمور الطالبات (بنات)
                  </h4>
                  <p className="text-xs text-pink-700/80 dark:text-pink-300/80 font-bold">
                    مدارس البنات والطفولة المبكرة
                  </p>
                </div>
              </div>
              <div className="text-left">
                <span className="text-2xl sm:text-3xl font-black font-mono text-pink-700 dark:text-pink-300">
                  {stats.girlsAvgSatisfaction}
                </span>
                <span className="text-xs font-bold text-slate-400"> / 5.0</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-300">نسبة الرضا العامة:</span>
                <span className="font-mono font-black text-pink-700 dark:text-pink-300">{stats.girlsSatisfactionPct}%</span>
              </div>
              <div className="w-full bg-pink-100 dark:bg-pink-950 h-3 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full transition-all duration-500"
                  style={{ width: `${stats.girlsSatisfactionPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500 pt-1">
                <span>إجمالي الطلبات: {stats.girlsCount}</span>
                <span>المقيّمة: {stats.girlsRatedCount}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Star Rating Distribution Bar */}
        <div className="mt-8 pt-6 border-t dark:border-teal-800/30">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">
            توزيع النجوم ومستويات التقييم
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">5 نجوم (ممتاز ⭐)</span>
              <span className="text-xl font-black font-mono text-emerald-900 dark:text-emerald-200 mt-1 block">{stats.star5Count}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300 block">4 نجوم (جيد جداً ⭐)</span>
              <span className="text-xl font-black font-mono text-blue-900 dark:text-blue-200 mt-1 block">{stats.star4Count}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">3 نجوم (جيد ⭐)</span>
              <span className="text-xl font-black font-mono text-amber-900 dark:text-amber-200 mt-1 block">{stats.star3Count}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <span className="text-xs font-bold text-red-800 dark:text-red-300 block">نجمتان / نجمة (بحاجة لتحسين)</span>
              <span className="text-xl font-black font-mono text-red-900 dark:text-red-200 mt-1 block">{stats.starLowCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Controls & Filters Bar */}
      <div className={`p-5 rounded-3xl border shadow-sm space-y-4 ${
        isDark ? 'glass-card-dark' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، المدرسة، رقم الجوال، الموظف، أو نص الملاحظات..."
              className={`w-full pr-10 pl-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl border outline-none transition-all ${
                isDark 
                  ? 'bg-slate-900/60 border-teal-800/40 text-white focus:border-amber-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500 focus:bg-white'
              }`}
            />
          </div>

          {/* Gender Filter Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              onClick={() => setGenderFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                genderFilter === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              كل الجنسين ({surveys.length})
            </button>
            <button
              onClick={() => setGenderFilter('boys')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                genderFilter === 'boys'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40'
              }`}
            >
              <span>👦 بنين</span>
              <span>({stats.boysCount})</span>
            </button>
            <button
              onClick={() => setGenderFilter('girls')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                genderFilter === 'girls'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/40'
              }`}
            >
              <span>👧 بنات</span>
              <span>({stats.girlsCount})</span>
            </button>
          </div>
        </div>

        {/* Second Row of Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t dark:border-teal-800/30 text-xs">
          
          {/* Rating Level */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-400">مستوى التقييم:</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value as any)}
              className="p-1.5 border rounded-xl font-bold bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            >
              <option value="all">كل التقييمات</option>
              <option value="5">⭐⭐⭐⭐⭐ ممتاز (5 نجوم)</option>
              <option value="4">⭐⭐⭐⭐ جيد جداً (4 نجوم)</option>
              <option value="3">⭐⭐⭐ جيد (3 نجوم)</option>
              <option value="1-2">⚠️ بحاجة لتحسين (1-2)</option>
              <option value="unrated">لم يتم التقييم بعد</option>
            </select>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-400">المرحلة:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="p-1.5 border rounded-xl font-bold bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            >
              <option value="all">كل المراحل</option>
              <option value="EarlyChildhood">طفولة مبكرة</option>
              <option value="Kindergarten">رياض أطفال</option>
              <option value="Primary">ابتدائي</option>
              <option value="Intermediate">متوسط</option>
              <option value="Secondary">ثانوي</option>
            </select>
          </div>

          {/* Checkbox: Only with written suggestions */}
          <label className="flex items-center gap-2 font-bold cursor-pointer pr-2 select-none">
            <input
              type="checkbox"
              checked={onlyWithNotes}
              onChange={(e) => setOnlyWithNotes(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
            />
            <span>عرض الطلبات ذات الملاحظات والمقترحات المكتوبة فقط ✍️ ({stats.withNotesCount})</span>
          </label>

          <span className="mr-auto font-black text-slate-500">
            النتائج المعروضة: {filteredSurveys.length} من {surveys.length}
          </span>
        </div>
      </div>

      {/* 5. Detailed Surveys Evaluation Table */}
      <div className={`border rounded-3xl overflow-hidden shadow-lg ${
        isDark ? 'glass-card-dark' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b bg-slate-50/80 dark:bg-slate-900/80 font-black text-slate-600 dark:text-teal-300 dark:border-teal-800/40">
                <th className="p-3.5 text-center w-12">#</th>
                <th className="p-3.5">اسم ولي الأمر (المستفيد)</th>
                <th className="p-3.5 text-center">جنس الطالب</th>
                <th className="p-3.5">المدرسة المعنية</th>
                <th className="p-3.5 text-center">المرحلة والصف</th>
                <th className="p-3.5">نوع الطلب</th>
                <th className="p-3.5">الموظف المختص</th>
                <th className="p-3.5 text-center">أداء الموظف</th>
                <th className="p-3.5 text-center">الاستقبال</th>
                <th className="p-3.5 text-center">التقييم الإجمالي</th>
                <th className="p-3.5">المقترحات والملاحظات</th>
                <th className="p-3.5 text-center">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
              {filteredSurveys.length > 0 ? (
                filteredSurveys.map((survey, idx) => {
                  const staffVal = Number(survey.staffSatisfaction) || 0;
                  const recepVal = Number(survey.receptionSatisfaction) || 0;
                  const isRated = staffVal > 0 || recepVal > 0;
                  const avgVal = isRated ? (((staffVal || 5) + (recepVal || 5)) / 2).toFixed(1) : '-';
                  const cleanNotes = getCleanBeneficiaryNotes(survey.notes);

                  const isBoy = survey.gender === 'boys' || (survey.schoolName && (survey.schoolName.includes('بنين') || survey.schoolName.includes('ابتدائية') || survey.schoolName.includes('متوسطة') || survey.schoolName.includes('ثانوية')) && !survey.schoolName.includes('بنات') && !survey.schoolName.includes('طفولة مبكرة'));

                  return (
                    <tr 
                      key={survey.id}
                      className="hover:bg-amber-50/40 dark:hover:bg-teal-950/20 transition-colors"
                    >
                      <td className="p-3.5 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-3.5">
                        <span className="font-extrabold block text-slate-900 dark:text-white">
                          {survey.beneficiaryName || 'غير مدون'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {survey.phoneNumber}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {isBoy ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300/60 dark:border-blue-800/60">
                            👦 بنين
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-pink-100 text-pink-800 dark:bg-pink-950/70 dark:text-pink-300 border border-pink-300/60 dark:border-pink-800/60">
                            👧 بنات
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold">
                        {(survey as any).vacancyOpenedSchoolName || survey.schoolName}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="block font-bold">{getStageName(survey.stage)}</span>
                        {survey.grade && <span className="text-[10px] text-slate-400 font-mono">({survey.grade})</span>}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        {getProblemName(survey.problemType)}
                      </td>
                      <td className="p-3.5 font-bold text-slate-700 dark:text-slate-200">
                        {survey.serviceEmployee || 'إدارة القبول'}
                      </td>
                      <td className="p-3.5 text-center font-bold">
                        {staffVal > 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-500 font-mono font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            {staffVal}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-bold">
                        {recepVal > 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-500 font-mono font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            {recepVal}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {isRated ? (
                          <span className={`inline-block px-2.5 py-1 rounded-xl font-black font-mono text-[11px] ${
                            Number(avgVal) >= 4.5
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : Number(avgVal) >= 3.5
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            ⭐ {avgVal} / 5
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">لم يقيّم</span>
                        )}
                      </td>
                      <td className="p-3.5 max-w-xs">
                        {cleanNotes ? (
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-slate-700 dark:text-slate-200 font-bold" title={cleanNotes}>
                              {cleanNotes}
                            </p>
                            <button
                              onClick={() => setSelectedSurveyNote(survey)}
                              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer"
                              title="عرض الملاحظة كاملة"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">لا توجد ملاحظات</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(survey.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={12} className="p-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-bold">لا توجد سجلات مطابقة للبحث أو الفلترة الحالية</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note View Modal */}
      {selectedSurveyNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className={`rounded-3xl p-6 max-w-lg w-full shadow-2xl border space-y-4 ${
            isDark ? 'bg-[#0b2336] border-teal-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 dark:border-teal-800/40">
              <h4 className="font-black text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <span>ملاحظات ومقترح ولي الأمر</span>
              </h4>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                {selectedSurveyNote.beneficiaryName}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs sm:text-sm font-bold leading-relaxed">
              {getCleanBeneficiaryNotes(selectedSurveyNote.notes) || 'لا توجد ملاحظات'}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSurveyNote(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
