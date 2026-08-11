import re

with open('src/components/Portal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern matching the JSX block inside parent status banner
pattern = r"\{\(\(\) => \{\n\s*const isVac = \(survey as any\)\.isVacancyRequest;[\s\S]*?\}\)\(\)\}"

new_block = """{(() => {
                            const isVac = (survey as any).isVacancyRequest;
                            const st = (survey as any).vacancyRequestStatus;
                            const isDone = survey.isResolved || st === 'executed' || st === 'staffing_confirmed' || (survey as any).principalConfirmedStaffing;

                            // 4. Final Placement Approved
                            if (isDone) {
                              return (
                                <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                                  isDark ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                }`}>
                                  <CheckCircle className={`w-6 h-6 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                                  <div className="space-y-1">
                                    <span className="block text-sm sm:text-base font-black leading-snug">
                                      {isRtl 
                                        ? 'تبارك لك الإدارة العامة للتعليم بمنطقة المدينة المنورة بقبول ابنكم/ابنتكم' 
                                        : 'Congratulations! Your student has been accepted by Madinah Education Directorate.'}
                                    </span>
                                    <span className="block text-xs font-bold opacity-90">
                                      {isRtl ? 'تم اعتماد التسكين نهائياً بالمدرسة. للاطلاع على بيانات المدرسة وتقييم الخدمة المقدمة لك ألقِ نظرة أدناه.' : 'Placement confirmed. Please view school details and evaluate our service below.'}
                                    </span>
                                    {(survey as any).staffingNote && (
                                      <div className="mt-1 text-[11px] bg-white/60 dark:bg-black/20 p-2 rounded-lg font-bold">
                                        📌 {isRtl ? `ملاحظة التسكين الميداني: ${(survey as any).staffingNote}` : `Placement Note: ${(survey as any).staffingNote}`}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            // 2 & 3. Sent to school principal or returned by principal for vacancy study (retains sent message)
                            if (st === 'sent_to_school_principal' || (survey as any).sentToSchoolPrincipal || st === 'sent_to_leadership' || (survey as any).sentToLeadership || st === 'returned_to_eq_officer' || st === 'returned_from_principal') {
                              return (
                                <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                                  isDark ? 'bg-sky-950/30 border-sky-800/50 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-900'
                                }`}>
                                  <Clock className={`w-6 h-6 shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                                  <div>
                                    <span className="block text-sm font-black">
                                      {isRtl ? 'تم ارسال الطلب لمدير المدرسة' : 'Request Sent to School Principal'}
                                    </span>
                                    <span className="block text-xs font-bold opacity-90 mt-0.5">
                                      {isRtl ? 'تمت إحالة الطلب مباشرة لإدارة المدرسة المعنية لتسكين الطالب بالصفوف والتحقق الميداني من المقعد.' : 'Request forwarded to school principal for class assignment.'}
                                    </span>
                                  </div>
                                </div>
                              );
                            }

                            // 1. Appointment Scheduled & Equivalency Processing
                            if ((survey as any).appointmentDate || (survey as any).appointmentTime || (survey as any).appointmentDetails || st === 'appointment_scheduled') {
                              return (
                                <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                                  isDark ? 'bg-purple-950/30 border-purple-800/50 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-900'
                                }`}>
                                  <Clock className={`w-6 h-6 shrink-0 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                                  <div>
                                    <span className="block text-sm font-black">
                                      {isRtl ? 'تم تحديد الموعد وجاري عمل المعادلات' : 'Appointment Scheduled & Processing Equivalency'}
                                    </span>
                                    <span className="block text-xs font-bold opacity-90 mt-0.5">
                                      {isRtl 
                                        ? `موعد الحضور المحدد: ${(survey as any).appointmentDate || 'تم التحديد'} - ${(survey as any).appointmentTime || ''}. جاري دراسة وإعداد شهادة المعادلة.` 
                                        : 'Appointment details confirmed. Processing equivalency certificates.'}
                                    </span>
                                  </div>
                                </div>
                              );
                            }

                            // Vacancy Study with Planning Officer
                            if (isVac) {
                              return (
                                <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                                  isDark ? 'bg-amber-950/30 border-amber-800/50 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                                }`}>
                                  <Clock className={`w-6 h-6 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                                  <div>
                                    <span className="block text-sm font-black">
                                      {isRtl ? '📌 جاري دراسة فتح الشاغر بالفصول لدى مشرف التخطيط المدرسي' : '📌 Studying Vacancy Opening with Planning Supervisor'}
                                    </span>
                                    <span className="block text-xs font-bold opacity-90 mt-0.5">
                                      {isRtl ? 'تم تحويل الطلب لمشرف التخطيط المدرسي لدراسة الطاقة الاستيعابية بالفصول وفتح الشاغر المناسب.' : 'Ticket routed to planning supervisor to evaluate capacity and open vacancy.'}
                                    </span>
                                  </div>
                                </div>
                              );
                            }

                            // Standard Default Status
                            return (
                              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                                survey.isResolved
                                  ? isDark ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                              }`}>
                                {survey.isResolved ? (
                                  <CheckCircle className={`w-5 h-5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                                ) : (
                                  <Clock className={`w-5 h-5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                                )}
                                <div>
                                  <span className="block text-xs font-black">
                                    {survey.isResolved
                                      ? (isRtl ? 'تم الحل والمعالجة بنجاح' : 'Successfully Resolved')
                                      : (isRtl ? 'قيد المراجعة والمتابعة النشطة' : 'Under Active Review & Processing')
                                    }
                                  </span>
                                  <span className="block text-xs font-medium opacity-90 mt-0.5">
                                    {survey.isResolved
                                      ? (isRtl ? 'لقد تم تأمين المقعد الدراسي أو حل العائق بنجاح من قبل المسؤول.' : 'The specialized officer has secured the classroom seat successfully.')
                                      : (isRtl ? 'يقوم فريق عمل رعاية المستفيدين بدراسة طلبكم بجدية وسيتم تحديث الحالة فوراً.' : 'Our support team is studying your inquiry details to provide immediate assistance.')
                                    }
                                  </span>
                                </div>
                              </div>
                            );
                          })()}"""

if re.search(pattern, content):
    content = re.sub(pattern, new_block, content, count=1)
    with open('src/components/Portal.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Regex replacement successful!")
else:
    print("Regex match failed!")
