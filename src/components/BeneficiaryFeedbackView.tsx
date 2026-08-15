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
    const dataToExport = filteredFeedbacks.map((f, idx) => ({
      '#': idx + 1,
      'رقم الملاحظة': f.id,
      'اسم المستفيد': f.senderName || 'غير محدد',
      'رقم الجوال': f.senderPhone || 'غير محدد',
      'تاريخ الإرسال': new Date(f.createdAt).toLocaleString('ar-SA'),
      'الحالة': f.status === 'new' ? 'جديد' : 'تم الاطلاع',
      'نص الملاحظة': f.message,
      'ملاحظات الإدارة': f.notes || ''
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
                  لوحة تحكم الأدمن الخاصة
                </span>
                <span className="text-xs text-purple-200 font-bold">• حصرية لمسؤول النظام</span>
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
              <p className="text-[11px] font-bold text-emerald-200">تم الاطلاع عليها</p>
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
            placeholder="بحث بالاسم، رقم الجوال، أو نص الرسالة..."
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
          <button
            onClick={() => setStatusFilter('new')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'new'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            <span>جديدة 🆕</span>
            <span>({newCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('read')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'read'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <span>تم الاطلاع ✅</span>
            <span>({readCount})</span>
          </button>
        </div>
      </div>

      {/* Message Cards List */}
      {filteredFeedbacks.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${
          isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <MessageSquareHeart className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
          <h4 className="font-extrabold text-base text-slate-700 dark:text-slate-300">
            لا توجد ملاحظات أو رسائل مطابقة للبحث
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            عند إرسال أي مستفيد لملاحظة من تذييل الصفحة، ستظهر هنا فوراً لحساب الأدمن.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFeedbacks.map((fb) => (
            <div
              key={fb.id}
              className={`p-5 rounded-2xl border transition-all ${
                fb.status === 'new'
                  ? isDark
                    ? 'bg-[#0b2336]/90 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                    : 'bg-amber-50/40 border-amber-300 shadow-md ring-1 ring-amber-400/20'
                  : isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-200'
                  : 'bg-white border-slate-200 shadow-xs text-slate-900'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    fb.status === 'new' ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        {fb.senderName || 'مستفيد زائر'}
                      </h4>
                      {fb.status === 'new' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
                          جديد 🆕
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                          تم الاطلاع ✅
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-teal-600" />
                        <span className="font-mono dir-ltr">{fb.senderPhone || 'غير محدد'}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(fb.createdAt).toLocaleString('ar-SA')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {fb.senderPhone && fb.senderPhone !== 'غير محدد' && (
                    <a
                      href={`https://wa.me/966${fb.senderPhone.replace(/^0/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                      title="مراسلة عبر الواتساب"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">واتساب</span>
                    </a>
                  )}

                  <button
                    onClick={() => handleToggleStatus(fb.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                      fb.status === 'new'
                        ? 'bg-[#218caa] hover:bg-teal-800 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {fb.status === 'new' ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>تأشير كمقروء</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>تغيير لـ جديد</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setDeletingId(fb.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer"
                    title="حذف الرسالة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                {fb.message}
              </div>

              {/* Admin Note Section */}
              <div className="mt-3 pt-2">
                {editingNotesId === fb.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      placeholder="اكتب ملاحظات الإدارة الخاصة بهذه الرسالة..."
                      className="w-full p-2 text-xs rounded-xl border border-teal-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                      rows={2}
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setEditingNotesId(null)}
                        className="px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={() => handleSaveNotes(fb.id)}
                        className="px-3 py-1 bg-[#218caa] text-white rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        <span>حفظ الملاحظة</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    {fb.notes ? (
                      <p className="text-teal-700 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/60 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800">
                        📌 <strong>ملاحظة الأدمن:</strong> {fb.notes}
                      </p>
                    ) : (
                      <span className="text-slate-400 font-normal">لا توجد ملاحظات إدارية مدونة</span>
                    )}

                    <button
                      onClick={() => {
                        setEditingNotesId(fb.id);
                        setTempNotes(fb.notes || '');
                      }}
                      className="text-teal-600 dark:text-teal-400 hover:underline font-bold text-[11px] cursor-pointer"
                    >
                      {fb.notes ? 'تعديل ملاحظة الأدمن' : '+ إضافة ملاحظة إدارية'}
                    </button>
                  </div>
                )}
              </div>

              {/* Delete Modal Confirmation inside component */}
              {deletingId === fb.id && (
                <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-200">
                    هل أنت متأكد من حذف هذه الملاحظة نهائياً؟
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(fb.id)}
                      className="px-3 py-1 bg-rose-600 text-white text-xs font-black rounded-lg hover:bg-rose-700 cursor-pointer"
                    >
                      حذف الآن
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
