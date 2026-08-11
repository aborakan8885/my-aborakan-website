const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Replace the old action block with the clean 5-icon equivalency action block
const oldBlock = `                                  {/* EQUIVALENCY OFFICER ACTION BLOCK */}
                                  {!isArchived && isEq && !isEqDone && canEqAuth && (
                                    <div className="p-3.5 bg-purple-500/10 dark:bg-purple-950/40 border-2 border-purple-400 dark:border-purple-800/80 rounded-2xl space-y-3 text-start shadow-sm">
                                      <div className="flex items-center justify-between gap-2 border-b border-purple-200 dark:border-purple-800 pb-2">
                                        <span className="font-black text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                                          🎓 {isRtl ? 'إجراءات مسؤول معادلة الشهادات المعتمدة:' : 'Equivalency Officer Actions:'}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          {(survey as any).isReceivedByEqOfficer && (
                                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border border-emerald-400/50">
                                              ✓ {isRtl ? 'تم استلام الطلب' : 'Received'}
                                            </span>
                                          )}
                                          {survey.hasReviewAppointment && (
                                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-400/50">
                                              📅 {isRtl ? 'تم تحديد موعد مراجعة' : 'Appointment Set'}
                                            </span>
                                          )}
                                        </div>
                                      </div>`;

const newBlock = `                                  {/* EQUIVALENCY OFFICER ACTION BLOCK */}
                                  {!isArchived && isEq && !isEqDone && canEqAuth && (
                                    <div className="p-4 bg-purple-500/10 dark:bg-purple-950/40 border-2 border-purple-400 dark:border-purple-800/80 rounded-2xl space-y-4 text-start shadow-sm" id={\`eq-actions-block-\${survey.id}\`}>
                                      <div className="flex items-center justify-between gap-2 border-b border-purple-200 dark:border-purple-800 pb-2.5">
                                        <div className="flex items-center gap-2">
                                          <span className="p-1.5 rounded-lg bg-purple-600 text-white font-black text-xs">📜</span>
                                          <span className="font-black text-xs text-purple-950 dark:text-purple-200">
                                            {isRtl ? 'منظومة إجراءات مسؤول معادلة الشهادات:' : 'Certificate Equivalency Officer System:'}
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          {(survey as any).isReceivedByEqOfficer && (
                                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border border-emerald-400/50">
                                              ✓ {isRtl ? 'مستلم' : 'Received'}
                                            </span>
                                          )}
                                          {survey.hasReviewAppointment && (
                                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-400/50">
                                              📅 {isRtl ? 'تم تحديد موعد' : 'Appt Set'}
                                            </span>
                                          )}
                                          {(survey.equalizationDocAttached || (survey as any).equalizationCompleted) && (
                                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-900 dark:text-blue-200 border border-blue-400/50">
                                              📄 {isRtl ? 'المعادلة مرفوعة' : 'Eq Doc Uploaded'}
                                            </span>
                                          )}
                                        </div>
                                      </div>`;

const idx = content.indexOf(oldBlock);
if (idx !== -1) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync('src/components/Dashboard.tsx', content);
  console.log('Replaced header at index', idx);
} else {
  console.log('Old block not found directly, checking index...');
}
