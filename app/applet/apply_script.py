import os

with open('src/components/Dashboard.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = '''                                       {/* Admissions Officer Alternative School Selection & Re-referral Actions */}
                                       {(activeOfficer.role === 'supervisor' || activeOfficer.role === 'admin' || activeOfficer.role === 'director' || (survey as any).referringOfficerId === activeOfficer.id) && ('''

banner = '''                                       {/* Second Return Banner for Leadership Officer */}
                                       {((survey as any).isSecondReturnByPrincipal || ((survey as any).principalReturnCount && (survey as any).principalReturnCount >= 2)) && (
                                         <div className="p-3 rounded-xl bg-red-600 text-white font-black text-xs space-y-2 border-2 border-red-800 animate-pulse text-start shadow-lg">
                                           <div className="flex items-center gap-1.5">
                                             <span className="text-base">🚨</span>
                                             <span>{isRtl ? 'إعادة الطلب للمرة الثانية من مدير المدرسة - يتطلب تدخل مشرف القيادة المدرسية الميداني المباشر!' : 'Second Return by Principal - Requires Direct Leadership Intervention!'}</span>
                                           </div>
                                           <p className="text-[10px] font-bold text-red-100 leading-relaxed">
                                             {isRtl 
                                               ? 'تعذر تسكين الطالب من المدرسة للمرة الثانية. تم نقل الصلاحية كاملة لمشرف القيادة المدرسية للتسكين الفعلي والإغلاق.' 
                                               : 'Student placement failed twice. Full authority escalated to Leadership Officer for manual placement.'}
                                           </p>

                                           {(activeOfficer.role === 'school_leadership' || activeOfficer.role === 'admin' || activeOfficer.role === 'director') && (
                                             <div className="pt-1 space-y-1.5">
                                               <input
                                                 type="text"
                                                 value={staffingNotesMap[survey.id] || ''}
                                                 onChange={(e) => setStaffingNotesMap({ ...staffingNotesMap, [survey.id]: e.target.value })}
                                                 placeholder={isRtl ? 'اكتب ملاحظات وتوجيهات القيادة المدرسية للتسكين والحل الميداني...' : 'Enter leadership staffing notes...'}
                                                 className="w-full text-[10px] p-2 rounded-lg bg-white text-slate-900 font-bold outline-none focus:ring-2 focus:ring-amber-300"
                                               />
                                               <button
                                                 onClick={() => {
                                                   const note = staffingNotesMap[survey.id] || 'تم التسكين الفعلي الميداني بتدخل مباشر من مشرف القيادة المدرسية';
                                                   if (onUpdateSurvey) {
                                                     onUpdateSurvey({
                                                       ...survey,
                                                       isResolved: true,
                                                       vacancyRequestStatus: 'staffing_confirmed',
                                                       principalConfirmedStaffing: true,
                                                       returnedByPrincipal: false,
                                                       staffingNote: note,
                                                       notes: isRtl ? `🔒 تم تأكيد التسكين النهائي وإغلاق المعاملة بتدخل مباشر من مشرف القيادة المدرسية (${activeOfficer.nameAr}). الملاحظات: ${note}` : `Staffed & resolved by leadership: ${note}`
                                                     } as any);
                                                     alert(isRtl ? '✓ تم تأكيد التسكين الميداني النهائي وإغلاق المعاملة بنجاح!' : 'Final staffing confirmed & resolved successfully!');
                                                   }
                                                 }}
                                                 className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-black rounded-lg cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
                                               >
                                                 <span>🔒 {isRtl ? 'تأكيد التسكين النهائي الميداني وإغلاق المعاملة' : 'Confirm Final Staffing & Close'}</span>
                                               </button>
                                             </div>
                                           )}
                                         </div>
                                       )}

                                       {/* Admissions & Planning Officer Alternative School Selection & Re-referral Actions */}
                                       {(activeOfficer.role === 'supervisor' || activeOfficer.role === 'school_planning' || activeOfficer.role === 'admin' || activeOfficer.role === 'director' || (survey as any).referringOfficerId === activeOfficer.id) && ('''

if target in code:
    code = code.replace(target, banner, 1)
    print("MATCHED AND REPLACED!")
else:
    print("TARGET NOT MATCHED!")

with open('src/components/Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
