/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SurveyResponse, EmailLog, SystemIntegrationLog, AppConfig, SchoolItem } from '../types';

export const EMPLOYEES = [
  { id: 'emp_1', nameAr: 'سالم بن محمد الترجمي', nameEn: 'Salem Al-Turjumi' }
];

export const INITIAL_CONFIG: AppConfig = {
  adminEmails: 'qabulmadinah@gmail.com, admin@edu.gov.sa',
  autoBackupEnabled: true,
  backupInterval: 60,
  encryptionEnabled: true,
  thirdPartyIntegrationEnabled: true,
  institutionNameAr: 'وزارة التعليم - إدارة رعاية المستفيدين بالمدينة المنورة',
  institutionNameEn: 'Ministry of Education - Beneficiary Care Dept (Madinah)'
};

export const INITIAL_SURVEYS: SurveyResponse[] = [];

export const INITIAL_EMAIL_LOGS: EmailLog[] = [
  {
    id: 'EML-201',
    surveyId: 'SURV-102',
    beneficiaryName: 'سارة بنت محمد العتيبي',
    recipientEmail: 'admin@edu.gov.sa',
    subject: '⚠️ تنبيه فوري: تقييم سلبي من مستفيد (سارة بنت محمد العتيبي)',
    sentAt: '2026-07-07T08:16:00Z',
    status: 'sent',
    triggerReason: 'Negative Feedback Alert (Staff rating: 2)'
  },
  {
    id: 'EML-202',
    surveyId: 'SURV-103',
    beneficiaryName: 'خالد بن فهد الدوسري',
    recipientEmail: 'admin@edu.gov.sa',
    subject: '⚠️ تنبيه فوري: تقييم سلبي من مستفيد (خالد بن فهد الدوسري)',
    sentAt: '2026-07-07T14:46:00Z',
    status: 'sent',
    triggerReason: 'Negative Feedback Alert (Staff rating: 1)'
  },
  {
    id: 'EML-203',
    surveyId: 'SURV-105',
    beneficiaryName: 'عبد الرحمن بن صالح الحربي',
    recipientEmail: 'supervisor@edu.gov.sa',
    subject: '⚠️ تنبيه فوري: تقييم سلبي من مستفيد (عبد الرحمن بن صالح الحربي)',
    sentAt: '2026-07-08T09:21:00Z',
    status: 'sent',
    triggerReason: 'Negative Feedback Alert (Staff rating: 1)'
  }
];

export const INITIAL_INTEGRATION_LOGS: SystemIntegrationLog[] = [
  {
    id: 'INT-301',
    systemName: 'نظام نور التعليمي (Noor System)',
    payloadSent: '{"action":"update_satisfaction","id":"SURV-101","status":"resolved"}',
    status: 'success',
    timestamp: '2026-07-06T10:30:15Z'
  },
  {
    id: 'INT-302',
    systemName: 'نظام رعاية المستفيدين الموحد (Tawasul)',
    payloadSent: '{"action":"escalate_ticket","id":"SURV-102","severity":"medium"}',
    status: 'success',
    timestamp: '2026-07-07T08:15:30Z'
  },
  {
    id: 'INT-303',
    systemName: 'نظام نور التعليمي (Noor System)',
    payloadSent: '{"action":"escalate_ticket","id":"SURV-103","severity":"high"}',
    status: 'success',
    timestamp: '2026-07-07T14:45:20Z'
  }
];

export const TRANSLATIONS = {
  ar: {
    // Layout
    appTitle: 'نظام إدارة رضا المستفيدين الذكي',
    beneficiaryPortal: 'بوابة المستفيد',
    adminDashboard: 'لوحة تحكم الإدارة',
    changeLang: 'English',
    currentLanguage: 'العربية',
    offlineStatus: 'أنت تعمل دون اتصال بالإنترنت (سيتم الحفظ محلياً)',
    onlineStatus: 'متصل بالإنترنت ومزامن مع السحابة',
    syncNow: 'مزامنة الآن',
    allSynced: 'تمت مزامنة جميع البيانات بنجاح',
    unsyncedCount: 'بيانات غير متزامنة تنتظر الشبكة: {count}',

    // Form fields
    formTitle: 'استمارة تقديم طلب التحاق بالمدرسة',
    formSubtitle: 'فضلا يرجى تعبئة بيانات  الطلب أو الشكوى الخاصة بنجلك وتحديد المعوقات المصادفة لتيسير الإجراء والتوجيه السليم.',
    beneficiaryName: 'اسم المستفيد / المراجع كاملاً',
    namePlaceholder: 'أدخل الاسم الثلاثي أو الرباعي',
    phoneNumber: 'رقم الهاتف المحمول',
    phonePlaceholder: '05xxxxxxxx',
    stage: 'المرحلة الدراسية',
    stageEarlyChildhood: 'الطفولة المبكرة',
    stageKindergarten: 'رياض الأطفال',
    stagePrimary: 'الابتدائية',
    stageIntermediate: 'المتوسطة',
    stageSecondary: 'الثانوية',
    stageSelect: 'اختر المرحلة الدراسية',
    sector: 'القطاع الإداري / التعليمي',
    sectorPlaceholder: 'مثال: القطاع الشمالي، قطاع الرياض، إلخ',
    schoolName: 'اسم المدرسة المعنية',
    schoolPlaceholder: 'أدخل اسم المدرسة كاملاً',
    problemType: 'نوع الطلب الرئيسي',
    problemSelect: 'اختر نوع الطلب',
    probNewSaudi: 'تسجيل مستجد سعودي',
    probNewResident: 'تسجيل مستجد مقيم',
    probVacancies: 'الشواغر غير متاحة',
    probDensity: 'كثافة طلابية بالفصول',
    probRejection: 'رفض الطلب دون مبرر نظامي',
    probPrimaryEq: 'معادلة الشهادة للمرحلة الابتدائية',
    probIntermediateEq: 'معادلة الشهادة للمرحلة المتوسطة',
    probSecondaryEq: 'معادلة الشهادة للمرحلة الثانوية',
    probDistance: 'نقل بسبب بعد السكن عن المدرسة',
    probUnregistered: 'طلب قبول ومعادلة شهادة',
    probOther: 'أخرى / ملاحظة عامة',
    serviceEmployee: 'اسم الموظف مقدم الخدمة',
    employeeSelect: 'اختر الموظف مقدم الخدمة',
    filterEmployee: 'جميع الموظفين',
    colEmployee: 'الموظف مقدم الخدمة',
    
    // Form Questions
    isResolved: 'هل تم معالجة طلبك أو حل مشكلتك من قبل الموظفين؟',
    yes: 'نعم، تم الحل',
    no: 'لا، لم يتم الحل بعد',
    unresolvedReasonLabel: 'سبب عدم حل المشكلة',
    unresolvedReasonPlaceholder: 'الرجاء كتابة سبب عدم حل المشكلة بالتفصيل...',
    staffSatisfaction: 'مدى رضاك عن تعامل وأداء الموظف المختص',
    receptionSatisfaction: 'مدى رضاك عن جودة الاستقبال والتوجيه',
    reviewerNotes: 'ملاحظات وتفاصيل إضافية يسجلها المراجع',
    notesPlaceholder: 'اكتب هنا أي تفاصيل إضافية حول طلبك، جودة التعامل، أو أي مقترحات للتطوير...',
    submitBtn: 'إرسال التقييم بأمان',
    submitting: 'جاري الإرسال والتشفير المتقدم...',
    formSuccess: 'شكرًا لك! تم استلام تقييمك بنجاح وتشفيره بأعلى معايير الأمان لحماية خصوصيتك.',
    negativeAlertWarning: '⚠️ تم رصد ملاحظات سلبية، جاري إرسال تنبيه فوري بالبريد الإلكتروني لمسؤولي الجودة لاتخاذ الإجراء الفوري.',

    // Dashboard General
    dashboardTitle: 'لوحة التحكم والتحليلات الذكية',
    statsOverview: 'نظرة عامة على الإحصائيات المباشرة',
    totalSurveys: 'إجمالي التقييمات',
    overallSatisfaction: 'معدل الرضا العام',
    resolvedRate: 'نسبة حل الطلبات',
    negativeAlerts: 'تنبيهات سلبية فورية',
    offlineSurveys: 'تقييمات أوفلاين',
    syncStatus: 'حالة التشفير والمزامنة',
    exportCSV: 'تصدير النتائج (CSV)',
    activeConfig: 'الإعدادات النشطة',

    // Dashboard Tabs
    tabOverview: 'التحليلات والرسوم البيانية',
    tabResponses: 'الطلبات المرسلة',
    tabAlerts: 'سجل التنبيهات الفورية',
    tabIntegrations: 'المزامنة والربط الإلكتروني',
    tabSettings: 'لوحة الإعدادات الشاملة',

    // Table
    searchPlaceholder: 'بحث باسم المستفيد، الهاتف، أو المدرسة...',
    filterStage: 'جميع المراحل',
    filterProblem: 'جميع المشاكل',
    filterResolved: 'حالة الحل (الكل)',
    colId: 'المعرف',
    colName: 'المستفيد',
    colPhone: 'الهاتف',
    colDetails: 'التفاصيل والقطاع',
    colProblem: 'نوع الطلب',
    colResolved: 'هل عولج؟',
    colRatings: 'التقييمات (الموظف / الاستقبال)',
    colDate: 'التاريخ والوقت',
    noData: 'لا توجد ردود مطابقة لمعايير البحث.',

    // Charts
    chartSatisfactionBreakdown: 'توزيع رضا المستفيدين (أداء الموظفين)',
    chartProblemTypes: 'نسب توزيع أنواع الطلبات الشائعة',
    chartResolvedVsUnresolved: 'معدل معالجة طلبات المستفيدين',
    chartAverageByStage: 'متوسط الرضا حسب المرحلة الدراسية',
    chartRatingLabel: 'نجوم التقييم',
    chartCountLabel: 'عدد المستفيدين',

    // Alerts Screen
    alertsDescription: 'يتم رصد التقييمات السلبية (أقل من 3 نجوم) فوراً وإرسال تنبيه آلي مشفر بالبريد الإلكتروني إلى المسؤولين لضمان التدخل السريع وحل الشكوى.',
    alertSubject: 'عنوان الرسالة الإلكترونية',
    alertRecipient: 'المسؤول المستلم',
    alertReason: 'سبب التنبيه التلقائي',
    alertStatus: 'حالة الإرسال',
    alertStatusSent: 'تم الإرسال فوراً',
    noAlerts: 'مستويات الخدمة ممتازة! لا توجد تنبيهات لتقييمات سلبية نشطة.',

    // Settings Screen
    settingsTitle: 'إعدادات النظام والتحكم المتقدم',
    settingsEmailsLabel: 'البريد الإلكتروني للمسؤولين (لفصلها بفاصلة)',
    settingsBackupLabel: 'النسخ الاحتياطي التلقائي للبيانات',
    settingsIntervalLabel: 'فترة النسخ الاحتياطي التلقائي (بالدقائق)',
    settingsEncryptionLabel: 'تفعيل التشفير المتقدم لحماية خصوصية المستفيدين (AES-256 / SHA)',
    settingsIntegrationLabel: 'تكامل مباشر مع الأنظمة الحالية (نظام نور / تواصل)',
    settingsInstAr: 'اسم المؤسسة (بالعربية)',
    settingsInstEn: 'اسم المؤسسة (بالإنجليزية)',
    saveSettingsBtn: 'حفظ الإعدادات المتقدمة',
    settingsSaved: 'تم حفظ كافة إعدادات النظام بنجاح وتفعيل بروتوكولات المزامنة.',
    backupSuccess: '📦 تم إنشاء نسخة احتياطية تلقائية مشفرة بنجاح وتنزيلها بصيغة JSON لحماية البيانات.',
    manualBackupBtn: 'تنزيل نسخة احتياطية فورية (Backup)',
    mockIntegrationStatus: 'حالة التكامل: نشط ومتوافق مع الأنظمة الخارجية',

    // Encryption Log / Info
    encryptionActive: 'تشفير البيانات نشط ومؤمن بالكامل',
    encryptionDetails: 'يتم تخزين بيانات الهوية ورقم الهاتف مشفرة محلياً وقبل المزامنة السحابية لضمان الامتثال لسياسات حماية الخصوصية الوطنية والأمن السيبراني.',

    // Unified Access Portal & School Principal Keys
    portalTitle: 'منصة الخدمات الموحدة للقبول',
    portalSubtitle: 'يرجى اختيار صفتك أو هويتك للدخول إلى الخدمة المخصصة لك بكل أمان وسهولة',
    roleParent: 'مستفيد (ولي أمر)',
    roleParentDesc: 'لتقديم طلب تسجيل أو نقل أو شكوى أو ملاحظة أو دعم ومتابعة خاصة في قبول الطلاب فقط',
    rolePrincipal: 'مستفيد (مدير مدرسة)',
    rolePrincipalDesc: 'بوابة مخصصة لمدراء المدارس لتسجيل الدخول ومتابعة طلبات أولياء الأمور وتحديث الشواغر بمدارسهم.',
    roleMap: 'خارطة المدارس التعليمية',
    roleMapIndependent: 'رابط خارجي مستقل',
    roleMapDesc: 'بوابة مخصصة للمستفيدين لمعرفة المدارس القريبة من المدرسة المرغوبة او المستهدفة بالمسافة للتسجيل أو النقل',
    roleMapAction: 'زيارة الخارطة الآن',
    roleAdmin: 'مسئول القبول',
    roleAdminDesc: 'الدخول للوحة التحكم الرئيسية الشاملة، متابعة الإحصائيات الفورية، وتخصيص إعدادات النظام.',
    goBackPortal: 'العودة لبوابة الدخول الرئيسية',
    
    // Principal Login Form
    principalLoginTitle: 'بوابة تسجيل دخول مدراء المدارس',
    principalLoginSubtitle: 'الرجاء إدخال بيانات الاعتماد المعتمدة لمدرستكم للوصول إلى لوحة المتابعة والتحكم المخصصة',
    schoolCode: 'الرمز الوزاري للمدرسة',
    schoolCodePlaceholder: 'أدخل الرمز الوزاري للمدرسة (مثال: 45012)',
    principalName: 'اسم مدير/ة المدرسة كاملاً',
    principalNamePlaceholder: 'أدخل اسم مدير أو مديرة المدرسة المعتمد',
    principalPassword: 'كلمة مرور المدرسة المعتمدة',
    principalPasswordPlaceholder: 'أدخل كلمة المرور الخاصة بمدرستكم',
    principalLoginBtn: 'تسجيل دخول آمن وبدء المتابعة',
    principalDashboardTitle: 'لوحة متابعة مدير المدرسة المخصصة',
    principalDashboardSubtitle: 'متابعة تقييمات أولياء الأمور وحل المشاكل الخاصة بمدرستكم وإحصائيات الرضا',
    schoolStats: 'إحصائيات المدرسة الحالية',
    schoolSurveys: 'الطلبات والشكاوى الواردة لمدرستكم',
    schoolSatisfaction: 'رضا أولياء الأمور بمدرستكم',
    schoolResolvedPct: 'معالجة الطلبات بمدرستكم',
    schoolTotalSurveys: 'إجمالي تقييمات مدرستكم',
    schoolUnresolvedTitle: 'الطلبات المعلقة بمدرستكم (تحتاج معالجة فورية)',
    schoolResolvedTitle: 'الطلبات التي تم حلها بمدرستكم بنجاح',
    schoolNoData: 'لا توجد تقييمات مسجلة لمدرستكم حالياً.'
  },
  en: {
    // Layout
    appTitle: 'Smart Beneficiary Satisfaction System',
    beneficiaryPortal: 'Beneficiary Portal',
    adminDashboard: 'Admin Dashboard',
    changeLang: 'العربية',
    currentLanguage: 'English',
    offlineStatus: 'You are working offline (Data will be saved locally)',
    onlineStatus: 'Online & synced with cloud',
    syncNow: 'Sync Now',
    allSynced: 'All data synchronized successfully',
    unsyncedCount: 'Unsynced local records: {count}',

    // Form fields
    formTitle: 'Beneficiary Satisfaction Survey',
    formSubtitle: 'We are pleased to hear your opinion and feedback to provide the best educational services in our institution.',
    beneficiaryName: 'Beneficiary Full Name',
    namePlaceholder: 'Enter full name',
    phoneNumber: 'Mobile Phone Number',
    phonePlaceholder: '05xxxxxxxx',
    stage: 'Educational Stage',
    stageEarlyChildhood: 'Early Childhood',
    stageKindergarten: 'Kindergarten',
    stagePrimary: 'Primary',
    stageIntermediate: 'Intermediate',
    stageSecondary: 'Secondary',
    stageSelect: 'Select school stage',
    sector: 'Administrative / Educational Sector',
    sectorPlaceholder: 'e.g. Northern Sector, Riyadh Sector, etc.',
    schoolName: 'Relevant School Name',
    schoolPlaceholder: 'Enter full school name',
    problemType: 'Main Request Type',
    problemSelect: 'Select Request Type',
    probNewSaudi: 'New Saudi Registration',
    probNewResident: 'New Resident Registration',
    probVacancies: 'Vacancies are not available',
    probDensity: 'High student density in classrooms',
    probRejection: 'Rejection of request without justification',
    probPrimaryEq: 'Equivalency of Primary School Certificate',
    probIntermediateEq: 'Equivalency of Intermediate School Certificate',
    probSecondaryEq: 'Equivalency of Secondary School Certificate',
    probDistance: 'Distance of residence from school',
    probUnregistered: 'Registered in unregistered desire',
    probOther: 'Other / General Feedback',
    serviceEmployee: 'Employee Providing Service',
    employeeSelect: 'Select employee providing service',
    filterEmployee: 'All Employees',
    colEmployee: 'Service Provider',

    // Form Questions
    isResolved: 'Was your request resolved or issue solved by the staff?',
    yes: 'Yes, resolved',
    no: 'No, not resolved yet',
    unresolvedReasonLabel: 'Reason for not resolving the issue',
    unresolvedReasonPlaceholder: 'Please describe the reason why the problem was not solved...',
    staffSatisfaction: 'Your satisfaction with the specialized employee\'s performance & support',
    receptionSatisfaction: 'Your satisfaction with reception and direction quality',
    reviewerNotes: 'Additional notes or remarks recorded by the reviewer',
    notesPlaceholder: 'Write any additional details about your request, service quality, or suggestions for improvement here...',
    submitBtn: 'Submit Secure Evaluation',
    submitting: 'Submitting and applying advanced encryption...',
    formSuccess: 'Thank you! Your survey was received successfully and encrypted using the highest security standards to protect your privacy.',
    negativeAlertWarning: '⚠️ Negative feedback detected! An instant alert email is being sent to the Quality Control managers for immediate action.',

    // Dashboard General
    dashboardTitle: 'Analytics & Smart Dashboard',
    statsOverview: 'Live Statistics Overview',
    totalSurveys: 'Total Surveys',
    overallSatisfaction: 'Overall Satisfaction',
    resolvedRate: 'Resolution Rate',
    negativeAlerts: 'Instant Negative Alerts',
    offlineSurveys: 'Offline Submissions',
    syncStatus: 'Encryption & Sync Status',
    exportCSV: 'Export Results (CSV)',
    activeConfig: 'Active Configuration',

    // Dashboard Tabs
    tabOverview: 'Analytics & Charts',
    tabResponses: 'Responses Log & Management',
    tabAlerts: 'Instant Alerts Log',
    tabIntegrations: 'Sync & Integration',
    tabSettings: 'Comprehensive Settings',

    // Table
    searchPlaceholder: 'Search by beneficiary name, phone, or school...',
    filterStage: 'All Stages',
    filterProblem: 'All Request Types',
    filterResolved: 'Resolution Status (All)',
    colId: 'ID',
    colName: 'Beneficiary',
    colPhone: 'Phone',
    colDetails: 'Details & Sector',
    colProblem: 'Request Type',
    colResolved: 'Resolved?',
    colRatings: 'Ratings (Staff / Reception)',
    colDate: 'Date & Time',
    noData: 'No responses match your search criteria.',

    // Charts
    chartSatisfactionBreakdown: 'Beneficiary Satisfaction Distribution (Staff)',
    chartProblemTypes: 'Common Request Types Distribution',
    chartResolvedVsUnresolved: 'Beneficiary Request Resolution Rate',
    chartAverageByStage: 'Average Satisfaction by School Stage',
    chartRatingLabel: 'Star Rating',
    chartCountLabel: 'Beneficiaries Count',

    // Alerts Screen
    alertsDescription: 'Negative feedback (under 3 stars) is immediately detected, and an automated encrypted email alert is sent to administrators to ensure swift intervention and complaint resolution.',
    alertSubject: 'Email Subject',
    alertRecipient: 'Recipient Manager',
    alertReason: 'Trigger Reason',
    alertStatus: 'Send Status',
    alertStatusSent: 'Sent Instantly',
    noAlerts: 'Service levels are excellent! No active negative alerts.',

    // Settings Screen
    settingsTitle: 'System Settings & Advanced Controls',
    settingsEmailsLabel: 'Administrators Emails (comma-separated)',
    settingsBackupLabel: 'Automated Data Backup',
    settingsIntervalLabel: 'Auto Backup Interval (Minutes)',
    settingsEncryptionLabel: 'Enable Advanced Encryption for Beneficiary Privacy (AES-256 / SHA)',
    settingsIntegrationLabel: 'Direct Integration with Existing Systems (Noor System / Tawasul)',
    settingsInstAr: 'Institution Name (Arabic)',
    settingsInstEn: 'Institution Name (English)',
    saveSettingsBtn: 'Save Advanced Settings',
    settingsSaved: 'All system settings saved successfully and synchronization protocols activated.',
    backupSuccess: '📦 An automated encrypted backup has been generated and downloaded as JSON successfully to protect data.',
    manualBackupBtn: 'Download Instant Backup',
    mockIntegrationStatus: 'Integration Status: Active and compatible with external platforms',

    // Encryption Log / Info
    encryptionActive: 'Data Encryption is Fully Active',
    encryptionDetails: 'Identity and phone number data are stored encrypted locally and before cloud synchronization to ensure compliance with national privacy and cybersecurity policies.',

    // Unified Access Portal & School Principal Keys
    portalTitle: 'Unified Admissions Services Platform',
    portalSubtitle: 'Please select your identity to proceed to the designated service securely',
    roleParent: 'Beneficiary (Parent)',
    roleParentDesc: 'To submit a registration, transfer, complaint, note, or specialized support and follow-up request regarding student admissions only.',
    rolePrincipal: 'Beneficiary (School Principal)',
    rolePrincipalDesc: 'Dedicated portal for school principals to sign in, monitor parent requests, and update vacancies.',
    roleMap: 'Educational Schools Map',
    roleMapIndependent: 'Independent External Link',
    roleMapDesc: 'A portal dedicated to beneficiaries to find schools near their desired or target school by distance for registration or transfer',
    roleMapAction: 'Visit Map Now',
    roleAdmin: 'Admission Officer',
    roleAdminDesc: 'Access the comprehensive analytical dashboard, real-time statistics, and system settings.',
    goBackPortal: 'Back to Main Access Portal',
    
    // Principal Login Form
    principalLoginTitle: 'School Principals Sign-In',
    principalLoginSubtitle: 'Please enter your approved school credentials to access your monitoring dashboard',
    schoolCode: 'Ministerial School Code',
    schoolCodePlaceholder: 'Enter ministerial school code (e.g., 45012)',
    principalName: 'Principal Full Name',
    principalNamePlaceholder: 'Enter principal\'s full name',
    principalPassword: 'School Secure Password',
    principalPasswordPlaceholder: 'Enter your password',
    principalLoginBtn: 'Secure Sign In',
    principalDashboardTitle: 'School Principal Monitoring Dashboard',
    principalDashboardSubtitle: 'Track parent satisfaction, handle school complaints, and review local analytics',
    schoolStats: 'Current School Analytics',
    schoolSurveys: 'Parent Requests & Inquiries Received',
    schoolSatisfaction: 'School Parent Satisfaction Rate',
    schoolResolvedPct: 'School Request Resolution Rate',
    schoolTotalSurveys: 'Total School Evaluations',
    schoolUnresolvedTitle: 'Pending Requests Requiring Urgent Resolution',
    schoolResolvedTitle: 'Successfully Resolved School Requests',
    schoolNoData: 'No surveys registered for your school yet.'
  }
};

export const INITIAL_SCHOOLS: SchoolItem[] = [
  { id: 'sch_101', nameAr: 'مدرسة أحد الابتدائية', nameEn: 'Ohod Elementary School', ministryCode: '1001', stage: 'Elementary', gender: 'boys', district: 'القطاع الشرقي' },
  { id: 'sch_102', nameAr: 'ثانوية الفتح بالمدينة المنورة', nameEn: 'Al-Fateh Secondary School', ministryCode: '1002', stage: 'Secondary', gender: 'boys', district: 'القطاع الشمالي' },
  { id: 'sch_103', nameAr: 'مجمع طيبة التعليمي', nameEn: 'Taiba Educational Complex', ministryCode: '1003', stage: 'All', gender: 'boys', district: 'القطاع الغربي' },
  { id: 'sch_104', nameAr: 'المتوسطة الثانية عشر للبنات', nameEn: '12th Intermediate School for Girls', ministryCode: '1004', stage: 'Intermediate', gender: 'girls', district: 'القطاع الشمالي' },
  { id: 'sch_105', nameAr: 'مدرسة الأنصار المتوسطة', nameEn: 'Al-Ansar Intermediate School', ministryCode: '1005', stage: 'Intermediate', gender: 'boys', district: 'القطاع الجنوبي' },
  { id: 'sch_106', nameAr: 'مدرسة القباء الابتدائية', nameEn: 'Quba Elementary School', ministryCode: '1006', stage: 'Elementary', gender: 'boys', district: 'القطاع الجنوبي' },
  { id: 'sch_107', nameAr: 'ثانوية الملك فهد', nameEn: 'King Fahd Secondary School', ministryCode: '1007', stage: 'Secondary', gender: 'boys', district: 'القطاع الغربي' },
  { id: 'sch_108', nameAr: 'الروضة السادسة بالمدينة', nameEn: '6th Kindergarten', ministryCode: '1008', stage: 'Kindergarten', gender: 'both', district: 'القطاع الشرقي' },
  { id: 'sch_109', nameAr: 'مدرسة الإمام الشاطبي النموذجية', nameEn: 'Al-Shatibi Model School', ministryCode: '1009', stage: 'Elementary', gender: 'boys', district: 'القطاع الوسط' },
  { id: 'sch_110', nameAr: 'المتوسطة الأولى للبنات', nameEn: '1st Intermediate School for Girls', ministryCode: '1010', stage: 'Intermediate', gender: 'girls', district: 'القطاع الوسط' },
];
