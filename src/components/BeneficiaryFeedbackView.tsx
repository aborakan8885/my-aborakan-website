import React, { useState } from 'react';
import { 
  MessageSquareHeart, 
  Search, 
  Filter, 
  User, 
  Phone, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Inbox, 
  Download, 
  Eye, 
  EyeOff, 
  Save, 
  MessageCircle,
  Sparkles,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BeneficiaryFeedback } from '../types';

interface BeneficiaryFeedbackViewProps {
  feedbacks: BeneficiaryFeedback[];
  onUpdateFeedbacks?: (feedbacks: BeneficiaryFeedback[]) => void;
  isDark?: boolean;
  isRtl?: boolean;
}

export default function BeneficiaryFeedbackView({
  feedbacks,
  onUpdateFeedbacks,
  isDark = false,
  isRtl = true
}: BeneficiaryFeedbackViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read'>('all');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtered list
  const filteredFeedbacks = feedbacks.filter(fb => {
    const matchesSearch = 
      (fb.senderName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fb.senderPhone || '').includes(searchQuery) ||
      (fb.message || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'new' && fb.status === 'new') ||
      (statusFilter === 'read' && fb.status === 'read');
    
    return matchesSearch && matchesStatus;
  });

  const totalCount = feedbacks.length;
  const newCount = feedbacks.filter(f => f.status === 'new').length;
  const readCount = feedbacks.filter(f => f.status === 'read').length;

  const handleToggleStatus = (id: string) => {
    if (!onUpdateFeedbacks) return;
    const updated = feedbacks.map(f => {
      if (f.id === id) {
        return {
          ...f,
          status: (f.status === 'new' ? 'read' : 'new') as 'new' | 'read'
        };
      }
      return f;
    });
    onUpdateFeedbacks(updated);
  };

  const handleMarkAllRead = () => {
    if (!onUpdateFeedbacks) return;
    const updated = feedbacks.map(f => ({ ...f, status: 'read' as const }));
    onUpdateFeedbacks(updated);
  };

  const handleDelete = (id: string) => {
    if (!onUpdateFeedbacks) return;
    const updated = feedbacks.filter(f => f.id !== id);
    onUpdateFeedbacks(updated);
    setDeletingId(null);
  };

  const handleSaveNotes = (id: string) => {
    if (!onUpdateFeedbacks) return;
    const updated = feedbacks.map(f => {
      if (f.id === id) {
        return { ...f, notes: tempNotes };
      }
      return f;
    });
    onUpdateFeedbacks(updated);
    setEditingNotesId(null);
  };

  const handleExportExcel = () => {
    // دالة أمنية لتطهير النصوص ومنع استغلال تفعيلات المعادلات في ملف الإكسل
    const sanitizeForExcel = (text: string | undefined | null): string => {
      if (!text) return 'غير محدد';
      const trimmed = text.trim();
      // إذا كان النص يبدأ برموز رياضية، نضع علامة اقتباس مفردة لمنع التنفيذ التلقائي
      if (['=', '+', '-', '@'].some(char => trimmed.startsWith(char))) {
        return `'${trimmed}`;
      }
      return trimmed;
    };

    const dataToExport = filteredFeedbacks.map((f, idx) => ({
      '#': idx + 1,
      'رقم الملاحظة': sanitizeForExcel(f.id),
      'اسم المستفيد': sanitizeForExcel(f.senderName || 'غير محدد'),
      'رقم الجوال': sanitizeForExcel(f.senderPhone || 'غير محدد'),
      'تاريخ الإرسال': new Date(f.createdAt).toLocaleString('ar-SA'),
      'الحالة': f.status === 'new' ? 'جديد' : 'تم الاطلاع',
      'نص الملاحظة': sanitizeForExcel(f.message),
      'ملاحظات الإدارة': sanitizeForExcel(f.notes || 'لا يوجد ملاحظات مدونة')
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet['!views'] = [{ RTL: true }];
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 22 },
      { wch: 16 },
      { wch: 24 },
      { wch: 14 },
      { wch: 50 },
      { wch: 40 }
    ];

    const workbook = XLSX.utils.book_new();
    if (!workbook.Workbook) workbook.Workbook = {};
    workbook.Workbook.Views = [{ RTL: true }];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'ملاحظات المستفيدين');
    XLSX.writeFile(workbook, `beneficiary_feedbacks_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in dir-rtl" style={{ direction: 'rtl' }}>
      {/* Top Banner & Stats Header */}
      <div className={`p-6 rounded-3xl border shadow-lg transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-[#0b2336] via-[#10304a] to-[#071927] border-[#218caa]/40 text-white' 
          : 'bg-gradient-to-r from-[#218caa] via-[#2883a4] to-[#3078a6] border-[#3078a6] text-white'
      }`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/15 rounded-2xl border border-white/20 backdrop-blur-md shadow-xs">
              <MessageSquareHeart className="w-8 h-8 text-[#69cee3] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#69cee3] text-slate-900 shadow-2xs">
                  لوحة تحكم الأدمن
                </span>
                <span className="text-xs text-purple-200 font-bold">• صلاحية حصرية للمسؤول</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                ملاحظات ورسائل المستفيدين
              </h2>
              <p className="text-xs text-purple-100 font-medium mt-0.5">
                متابعة وإدارة الملاحظات والاستفسارات الواردة من تذييل النظام
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {newCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>تأشير الكل كمقروء</span>
              </button>
            )}
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white font-extrabold text-xs rounded-xl border border-white/20 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>تصدير إكسل</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-teal-100">إجمالي الرسائل الواردة</p>
              <h3 className="text-2xl font-black font-mono text-white mt-0.5">{totalCount}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-white/15 text-white">
              <Inbox className="w-5 h-5" />
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-400/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-200">الرسائل الجديدة (غير المقروءة)</p>
              <h3 className="text-2xl font-black font-mono text-amber-300 mt-0.5">{newCount}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-400/30 text-amber-200">
              <Sparkles className="w-5 h-5 animate-spin-slow" />
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-200">رسائل تم الاطلاع عليها</p>
              <h3 className="text-2xl font-black font-mono text-emerald-300 mt-0.5">{readCount}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-400/30 text-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باالسم، رقم الجوال، أو نص الرسالة..."
            className="w-full pr-10 pl-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#218caa] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            الكل ({totalCount})
          </button>
