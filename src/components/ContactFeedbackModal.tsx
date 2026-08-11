import React, { useState } from 'react';
import { X, Send, User, Phone, MessageSquareHeart, Code2, CheckCircle2, Sparkles, MessageCircle } from 'lucide-react';
import { BeneficiaryFeedback } from '../types';
import { sendOfficialEmail } from '../utils/emailService';

interface ContactFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendFeedback: (feedback: Omit<BeneficiaryFeedback, 'id' | 'createdAt' | 'status'>) => void;
  isDark?: boolean;
}

export default function ContactFeedbackModal({
  isOpen,
  onClose,
  onSendFeedback,
  isDark = false
}: ContactFeedbackModalProps) {
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('الرجاء كتابة نص الملاحظة أو الاستفسار قبل الإرسال.');
      return;
    }

    const name = senderName.trim() || 'مستفيد زائر';
    const phone = senderPhone.trim() || 'غير محدد';
    const msgText = message.trim();

    onSendFeedback({
      senderName: name,
      senderPhone: phone,
      message: msgText
    });

    // Send notification email via official account qabulmadinah@gmail.com
    sendOfficialEmail({
      to: 'qabulmadinah@gmail.com',
      subject: `✉️ رسالة رأي/اقتراح جديدة من المستفيد: (${name})`,
      bodyText: `تم استلام ملاحظة أو مقترح جديد عبر نافذة التواصل والتطوير:\n\nاسم المستفيد: ${name}\nرقم الجوال: ${phone}\nنص الرسالة:\n${msgText}\n\nتاريخ الرسالة: ${new Date().toLocaleString('ar-SA')}`,
      triggerReason: 'Beneficiary Feedback Submission'
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSenderName('');
      setSenderPhone('');
      setMessage('');
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in dir-rtl" style={{ direction: 'rtl' }}>
      <div 
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border transition-all ${
          isDark 
            ? 'bg-[#022a28] border-teal-800/60 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Header Bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-5 border-b bg-gradient-to-r from-[#218caa] via-[#2883a4] to-[#3078a6] text-white rounded-t-3xl shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl border border-white/20 backdrop-blur-md">
              <MessageSquareHeart className="w-6 h-6 text-[#69cee3] animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight text-white">
                للتواصل وإبداء الملاحظات
              </h3>
              <p className="text-[11px] text-cyan-100 font-medium">
                يسعدنا استقبال ملاحظاتكم ومقترحاتكم والتواصل المباشر مع دعم النظام
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/15"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6">

          {/* Section 1: Developer Info & Contact */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${
            isDark 
              ? 'bg-[#218caa]/15 border-[#69cee3]/30 text-cyan-100' 
              : 'bg-cyan-50/70 border-[#218caa]/25 text-slate-900'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#218caa]/20">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#218caa] dark:text-[#69cee3]" />
                <h4 className="font-extrabold text-sm sm:text-base text-[#1b6583] dark:text-cyan-200">
                  👨‍💻 نبذة عن المبرمج ورقم التواصل
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#218caa] text-white shadow-2xs">
                مطور النظام
              </span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                <div className="leading-relaxed">
                  <span className="font-extrabold text-slate-700 dark:text-cyan-200 block text-xs">فكرة وتطوير النظام:</span>
                  <span className="font-black text-sm sm:text-base text-[#1b6583] dark:text-cyan-100 bg-cyan-100/90 dark:bg-[#218caa]/40 px-3 py-1 rounded-xl border border-[#218caa]/30 inline-block mt-1 shadow-2xs">
                    الأستاذ / سالم بن محمد الترجمي - وحدة القبول
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#218caa] dark:text-[#69cee3] shrink-0" />
                <p className="leading-relaxed">
                  <strong className="font-extrabold text-[#1b6583] dark:text-cyan-100">رقم التواصل الخاص:</strong>{' '}
                  <a 
                    href="tel:0553512200"
                    className="font-mono font-black text-sm sm:text-base dir-ltr inline-block text-[#218caa] dark:text-[#69cee3] hover:underline transition-colors"
                  >
                    0553512200
                  </a>
                </p>
              </div>

              <div className="p-3 bg-white/80 dark:bg-slate-900/70 rounded-xl border border-[#218caa]/25 dark:border-[#218caa]/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                تم تطوير هذا النظام وإعداد خوارزمياته المتقدمة لرعاية المستفيدين، وتسهيل إجراءات القبول والتسكين بالمدارس، ومتابعة بلاغات الشواغر بكفاءة عالية وشفافية كاملة.
              </div>

              {/* Direct Quick Contact Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="https://wa.me/966553512200"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>تواصل عبر الواتساب</span>
                </a>
                <a
                  href="tel:0553512200"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#218caa] to-[#3078a6] hover:brightness-110 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-[#69cee3]" />
                  <span>اتصال مباشر</span>
                </a>
              </div>
            </div>
          </div>

          {/* Section 2: Feedback Form */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${
            isDark 
              ? 'bg-slate-900/80 border-slate-800' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquareHeart className="w-5 h-5 text-amber-500" />
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                📝 مربع لكتابة الملاحظات وإرسالها للأدمن
              </h4>
            </div>

            {submitted ? (
              <div className="p-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl animate-fade-in">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto animate-bounce" />
                <h5 className="font-extrabold text-base text-emerald-900 dark:text-emerald-100">
                  تم إرسال ملاحظتك بنجاح للأدمن!
                </h5>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  شكراً لتواصلك واهتمامك. تم حفظ ملاحظتك في حساب الأدمن للمراجعة واتخاذ اللازم.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      اسم المستفيد <span className="text-slate-400 font-normal">(اختياري)</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="أدخل اسمك الكريم..."
                        className="w-full pr-9 pl-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      رقم التواصل / الجوال <span className="text-slate-400 font-normal">(اختياري)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                      <input
                        type="tel"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        placeholder="05xxxxxxxx"
                        className="w-full pr-9 pl-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none dir-ltr text-right"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    نص الملاحظة أو الاستفسار <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب جميع ملاحظاتك، مقترحاتك، أو الاستفسار هنا بالتفصيل ليتم إرسالها لمسؤول النظام (الأدمن)..."
                    className="w-full p-3 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none leading-relaxed"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-[#218caa] via-[#2883a4] to-[#3078a6] hover:brightness-110 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Send className="w-4 h-4 text-[#69cee3]" />
                    <span>🚀 إرسال الملاحظة للأدمن</span>
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
