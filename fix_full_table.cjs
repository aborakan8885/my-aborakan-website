const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Find start of inserted misplaced block around line 10354
const misplacedStartMarker = `{/* Stage & Grade */}
                              <td className="px-4 py-3.5 align-top">
                                                             {/* EQUIVALENCY OFFICER ACTION BLOCK */}`;

const originalTableMiddle = `{/* Stage & Grade */}
                              <td className="px-4 py-3.5 align-top">
                                <span className="block font-bold text-xs">
                                  {getStageName(survey.stage)}
                                </span>
                                <span className={\`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-black \${
                                  isDark ? 'bg-teal-950/50 text-teal-300 border border-teal-900' : 'bg-slate-100 text-slate-700'
                                }\`}>
                                  {isRtl ? 'الصف:' : 'Grade:'} {survey.grade || (isRtl ? 'غير محدد' : 'N/A')}
                                </span>
                              </td>

                              {/* Assigned Specialist details */}
                              <td className="px-4 py-3.5 align-top space-y-1">
                                <div>
                                  <span className="text-[10px] text-slate-400 block">{isRtl ? 'مشرف الشاغر:' : 'Vacancy Officer:'}</span>
                                  <span className="font-bold text-xs text-teal-700 dark:text-teal-300">
                                    {(survey as any).planningOfficerName || survey.serviceEmployee || (isRtl ? 'لم يحدد بعد' : 'Unassigned')}
                                  </span>
                                </div>
                                {(survey as any).leadershipOfficerName && (
                                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] text-slate-400 block">{isRtl ? 'مشرف القيادة للتسكين:' : 'Leadership Officer:'}</span>
                                    <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                                      {(survey as any).leadershipOfficerName}
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Pipeline Status Badge */}
                              <td className="px-4 py-3.5 align-top text-center">
                                <span className={\`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border \${
                                  (survey as any).returnedByPrincipal || status === 'returned_no_vacancy'
                                    ? 'bg-red-600 text-white border-red-700 animate-pulse shadow-xs'
                                    : isArchived
                                      ? isDark ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : isStaffingConfirmed
                                        ? isDark ? 'bg-sky-950/40 text-sky-300 border-sky-900/40' : 'bg-sky-100 text-sky-800 border-sky-300'
                                        : isDelayedOverOneDay
                                          ? 'bg-red-100 text-red-900 border-red-400 animate-pulse dark:bg-red-950/60 dark:text-red-200 dark:border-red-800'
                                          : isSentToLeadership
                                            ? isDark ? 'bg-amber-950/40 text-amber-300 border-amber-900/40' : 'bg-amber-100 text-amber-800 border-amber-300'
                                            : isVacancyOpened
                                              ? isDark ? 'bg-teal-950/40 text-teal-300 border-teal-900/40' : 'bg-teal-100 text-teal-800 border-teal-300'
                                              : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                                }\`}>
                                  {(survey as any).returnedByPrincipal || status === 'returned_no_vacancy'
                                    ? (isRtl ? '🚨 معاد للتخطيط' : '🚨 Returned to Planning')
                                    : isArchived
                                      ? (isRtl ? '📁✓ منجز ومكتمل' : 'Completed')
                                      : isStaffingConfirmed
                                        ? (isRtl ? '🏫✓ تم التسكين' : 'Staffing Confirmed')
                                        : isDelayedOverOneDay
                                          ? (isRtl ? '🚨 متأخر عند المدير' : 'Delayed at School')
                                          : isSentToLeadership
                                            ? (isRtl ? '🏫 عند مدير المدرسة' : 'At Principal')
                                            : isVacancyOpened
                                              ? (isRtl ? '🔓 تم فتح الشاغر' : 'Vacancy Opened')
                                              : (isRtl ? '📌 بانتظار التخطيط' : 'Pending Planning')}
                                </span>

                                {(survey as any).returnedByPrincipal && (
                                  <div className="mt-2 p-1.5 bg-red-50 dark:bg-red-950/40 text-[10px] text-red-800 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-900/50 text-start font-medium">
                                    <span className="font-bold block text-red-700 dark:text-red-300 me-1">🚨 سبب الإعادة من المدرسة:</span>
                                    {(survey as any).principalReturnReason || (isRtl ? 'الفصول ممتلئة ولا توجد طاقة استيعابية' : 'No space in classrooms')}
                                  </div>
                                )}

                                {(survey as any).staffingNote && (
                                  <div className="mt-2 p-1.5 bg-sky-50 dark:bg-sky-950/30 text-[10px] text-sky-800 dark:text-sky-300 rounded-lg border border-sky-200 dark:border-sky-900/40 text-start font-medium">
                                    <span className="font-bold block text-sky-600 dark:text-sky-400 me-1">📝 ملاحظات التسكين:</span>
                                    {(survey as any).staffingNote}
                                  </div>
                                )}
                              </td>

                              {/* Action controls for 4-stage pipeline */}
                              <td className="px-4 py-3.5 align-top text-center no-print">
                                <div className="flex flex-col gap-2 bg-slate-50/70 dark:bg-slate-900/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">`;

// Cut out from misplacedStartMarker up to the original EQUIVALENCY OFFICER ACTION BLOCK
const endMarker = `{/* EQUIVALENCY OFFICER ACTION BLOCK */}`;
const startIdx = content.indexOf(misplacedStartMarker);
const secondBlockIdx = content.indexOf(endMarker, startIdx + 1);

if (startIdx !== -1 && secondBlockIdx !== -1) {
  content = content.slice(0, startIdx) + originalTableMiddle + content.slice(secondBlockIdx);
  fs.writeFileSync('src/components/Dashboard.tsx', content);
  console.log('Fixed table structure cleanly!');
} else {
  console.error('Indices not found:', startIdx, secondBlockIdx);
}
