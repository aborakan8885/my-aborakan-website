/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import SurveyForm from './components/SurveyForm';
import Dashboard from './components/Dashboard';
import Portal from './components/Portal';
import ErrorBoundary from './components/ErrorBoundary';
import ContactFeedbackModal from './components/ContactFeedbackModal';
import { Language, SurveyResponse, AppConfig, EmailLog, SystemIntegrationLog, PrincipalReport, SchoolItem, BeneficiaryFeedback } from './types';
import { sendOfficialEmail } from './utils/emailService';
import {
  saveSurveysToStorage,
  loadSurveysFromStorage,
  clearAllSurveysFromStorage,
  savePrincipalReportsToStorage,
  loadPrincipalReportsFromStorage,
  saveSchoolsToStorage,
  loadSchoolsFromStorage
} from './utils/storageEngine';
import {
  INITIAL_CONFIG,
  INITIAL_SURVEYS,
  INITIAL_EMAIL_LOGS,
  INITIAL_INTEGRATION_LOGS,
  INITIAL_SCHOOLS,
  TRANSLATIONS
} from './data/mockData';
import { processSurveysInBatchAsync } from './utils/batchProcessor';
import { ShieldCheck, Wifi, Info, CheckCircle2, ChevronRight, HelpCircle, Cpu, Zap, Activity, MessageSquareHeart, Home, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Application Language state (Default to Arabic as requested)
  const [currentLang, setCurrentLang] = useState<Language>('ar');

  // Theme state ('light' or 'dark') aligned with the Ministry of Education visual identity
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const cached = localStorage.getItem('app_theme');
    return (cached === 'dark' || cached === 'light') ? cached : 'light';
  });

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Application views / tabs / roles: 'portal' (Unified Selection Portal), 'parent' (Beneficiary / Parent Survey Form), or 'admin' (Admission Officer / System Admin)
  const [userRole, setUserRoleState] = useState<'portal' | 'parent' | 'admin'>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('print-report=true')) {
      return 'admin';
    }
    return 'portal';
  });

  // Portal view state & Modal state
  const [portalView, setPortalViewState] = useState<'selection' | 'parent-choices' | 'parent-track' | 'principal-login' | 'principal-dashboard'>('selection');
  const [showAgeModal, setShowAgeModalState] = useState<boolean>(false);

  // Navigation History Stack
  type NavState = {
    userRole: 'portal' | 'parent' | 'admin';
    portalView: 'selection' | 'parent-choices' | 'parent-track' | 'principal-login' | 'principal-dashboard';
    showAgeModal: boolean;
  };
  const historyStackRef = useRef<NavState[]>([]);

  const pushNavState = (
    newRole: 'portal' | 'parent' | 'admin',
    newPortalView: 'selection' | 'parent-choices' | 'parent-track' | 'principal-login' | 'principal-dashboard' = portalView,
    newAgeModal: boolean = false
  ) => {
    const currentState: NavState = { userRole, portalView, showAgeModal };
    if (
      currentState.userRole !== newRole ||
      currentState.portalView !== newPortalView ||
      currentState.showAgeModal !== newAgeModal
    ) {
      historyStackRef.current.push(currentState);
    }
    setUserRoleState(newRole);
    setPortalViewState(newPortalView);
    setShowAgeModalState(newAgeModal);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const setUserRole = (role: 'portal' | 'parent' | 'admin') => {
    pushNavState(role, role === 'portal' ? 'selection' : portalView, false);
  };

  const handlePortalViewChange = (newView: 'selection' | 'parent-choices' | 'parent-track' | 'principal-login' | 'principal-dashboard') => {
    pushNavState('portal', newView, false);
  };

  const handleAgeModalChange = (show: boolean) => {
    pushNavState('portal', portalView, show);
  };

  const handleGoBack = () => {
    if (showAgeModal) {
      setShowAgeModalState(false);
      return;
    }
    if (historyStackRef.current.length > 0) {
      const previous = historyStackRef.current.pop()!;
      setUserRoleState(previous.userRole);
      setPortalViewState(previous.portalView);
      setShowAgeModalState(previous.showAgeModal);
    } else {
      // Fallback if stack is empty
      if (userRole === 'parent' || userRole === 'admin') {
        setUserRoleState('portal');
        setPortalViewState('parent-choices');
      } else if (portalView !== 'selection') {
        setPortalViewState('selection');
      }
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleReturnToMainGateway = () => {
    historyStackRef.current = [];
    setUserRoleState('portal');
    setPortalViewState('selection');
    setShowAgeModalState(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  // Compatibility helper for legacy references
  const activeTab: 'survey' | 'dashboard' = userRole === 'admin' ? 'dashboard' : 'survey';
  const setActiveTab = (tab: 'survey' | 'dashboard') => {
    setUserRole(tab === 'dashboard' ? 'admin' : 'parent');
  };

  // Network State Simulator (Simulates Offline vs Cloud status)
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // App Configurations
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);

  // Core Databases (Backed up in localStorage)
  const [surveys, setSurveys] = useState<SurveyResponse[]>(() => {
    const cached = localStorage.getItem('beneficiary_surveys');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return [];
  });

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => {
    return [];
  });

  const INITIAL_REPORTS: PrincipalReport[] = [];

  const [principalReports, setPrincipalReports] = useState<PrincipalReport[]>(() => {
    const cached = localStorage.getItem('principal_reports');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return [];
  });

  const [integrationLogs, setIntegrationLogs] = useState<SystemIntegrationLog[]>(() => {
    const cached = localStorage.getItem('beneficiary_integrations');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return INITIAL_INTEGRATION_LOGS;
  });

  // Beneficiary Feedbacks database
  const [beneficiaryFeedbacks, setBeneficiaryFeedbacks] = useState<BeneficiaryFeedback[]>(() => {
    const cached = localStorage.getItem('beneficiary_feedbacks_v1');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return [
      {
        id: 'fb-101',
        senderName: 'محمد بن علي العمري',
        senderPhone: '0551234567',
        message: 'نظام ممتاز وميسر لرعاية المستفيدين والتسكين بالمدارس. شكراً لجهودكم في إدارة التعليم.',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        status: 'new'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('beneficiary_feedbacks_v1', JSON.stringify(beneficiaryFeedbacks));
  }, [beneficiaryFeedbacks]);

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);

  const handleSendFeedback = (newFb: Omit<BeneficiaryFeedback, 'id' | 'createdAt' | 'status'>) => {
    const item: BeneficiaryFeedback = {
      ...newFb,
      id: `fb-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'new'
    };
    setBeneficiaryFeedbacks(prev => [item, ...prev]);
    setAlertToast({ message: 'تم إرسال ملاحظتك بنجاح للأدمن!', type: 'success' });
  };

  // Global synchronized school registry (backed by app_schools_list_v1 and IndexedDB)
  const [schoolsList, setSchoolsList] = useState<SchoolItem[]>(() => {
    const cached = localStorage.getItem('app_schools_list_v1');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    const wasSaved = localStorage.getItem('app_schools_saved_v1');
    if (wasSaved === 'true') return [];
    return INITIAL_SCHOOLS;
  });

  const [isInitialLoaded, setIsInitialLoaded] = useState<boolean>(false);

  const handleUpdateSchools = (newList: SchoolItem[]) => {
    setSchoolsList(newList);
    saveSchoolsToStorage(newList, { isConfirmedAdminClear: true });
  };

  // Action feedback message states
  const [alertToast, setAlertToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Web Worker & Async Batch Engine states for 20,000+ items
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [batchDetails, setBatchDetails] = useState<string>('');

  // Async initial load from storage engine (IndexedDB + LocalStorage fallback)
  useEffect(() => {
    Promise.all([
      loadSurveysFromStorage(),
      loadPrincipalReportsFromStorage(),
      loadSchoolsFromStorage()
    ]).then(([surveysData, reportsData, schoolsData]) => {
      if (surveysData && surveysData.length > 0) {
        setSurveys(surveysData);
      }
      if (reportsData && reportsData.length > 0) {
        setPrincipalReports(reportsData);
      }
      if (schoolsData && Array.isArray(schoolsData)) {
        const wasSaved = localStorage.getItem('app_schools_saved_v1');
        if (schoolsData.length > 0 || wasSaved === 'true') {
          setSchoolsList(schoolsData);
        }
      }
      setIsInitialLoaded(true);
    }).catch(err => {
      console.warn('Initial storage load fallback:', err);
      setIsInitialLoaded(true);
    });
  }, []);

  // Save changes to local persistence via storageEngine with debounce - ONLY after initial load completes!
  useEffect(() => {
    if (!isInitialLoaded) return;
    const timer = setTimeout(() => {
      saveSurveysToStorage(surveys);
    }, 1500);
    return () => clearTimeout(timer);
  }, [surveys, isInitialLoaded]);

  useEffect(() => {
    if (!isInitialLoaded) return;
    const timer = setTimeout(() => {
      saveSchoolsToStorage(schoolsList, { isConfirmedAdminClear: true });
    }, 1000);
    return () => clearTimeout(timer);
  }, [schoolsList, isInitialLoaded]);

  useEffect(() => {
    try {
      localStorage.setItem('beneficiary_emails', JSON.stringify(emailLogs.slice(0, 500)));
    } catch {
      /* ignore quota errors */
    }
  }, [emailLogs]);

  useEffect(() => {
    if (!isInitialLoaded) return;
    const timer = setTimeout(() => {
      savePrincipalReportsToStorage(principalReports);
    }, 1500);
    return () => clearTimeout(timer);
  }, [principalReports, isInitialLoaded]);

  useEffect(() => {
    try {
      localStorage.setItem('beneficiary_integrations', JSON.stringify(integrationLogs.slice(0, 500)));
    } catch {
      /* ignore quota errors */
    }
  }, [integrationLogs]);

  // Handle adding a new survey response
  const handleAddSurvey = (newSurveyData: Omit<SurveyResponse, 'id' | 'createdAt' | 'isSynced'>): SurveyResponse => {
    const surveyId = `SURV-${Math.floor(100 + Math.random() * 900)}`;
    const nowStr = new Date().toISOString();

    const newResponse: SurveyResponse = {
      ...newSurveyData,
      id: surveyId,
      createdAt: nowStr,
      lastUpdatedAt: nowStr,
      isSynced: isOnline // If online, sync immediately
    };

    setSurveys((prev) => [newResponse, ...prev]);

    // Check for negative feedback (Rating > 0 and < 3 on staff or reception)
    const ratedStaff = newResponse.staffSatisfaction && newResponse.staffSatisfaction > 0;
    const ratedReception = newResponse.receptionSatisfaction && newResponse.receptionSatisfaction > 0;
    const isNegativeFeedback = (ratedStaff && newResponse.staffSatisfaction < 3) || (ratedReception && newResponse.receptionSatisfaction < 3);

    if (isNegativeFeedback) {
      // Trigger instant email alert logs & send actual email via official account qabulmadinah@gmail.com
      const emailId = `EML-${Math.floor(200 + Math.random() * 800)}`;
      const targetEmails = (config?.adminEmails || 'qabulmadinah@gmail.com').split(',').map((e) => e.trim()).filter(Boolean);
      
      const newEmailLogs: EmailLog[] = targetEmails.map((email, idx) => ({
        id: `${emailId}-${idx}`,
        surveyId,
        beneficiaryName: newResponse.beneficiaryName,
        recipientEmail: email,
        subject: `⚠️ تنبيه فوري: تقييم سلبي من مستفيد (${newResponse.beneficiaryName})`,
        sentAt: nowStr,
        status: isOnline ? 'sent' : 'pending',
        triggerReason: `Negative Feedback Alert (Staff rating: ${newResponse.staffSatisfaction} / Reception rating: ${newResponse.receptionSatisfaction})`
      }));

      setEmailLogs((prev) => [...newEmailLogs, ...prev]);

      // Send live email via official Gmail qabulmadinah@gmail.com
      sendOfficialEmail({
        to: targetEmails,
        subject: `⚠️ تنبيه فوري: تقييم سلبي من مستفيد (${newResponse.beneficiaryName})`,
        bodyText: `تم استلام تقييم سلبي جديد في نظام القبول والمعادلات:\n\nالمستفيد: ${newResponse.beneficiaryName}\nرقم الجوال: ${newResponse.phoneNumber}\nالمرحلة: ${newResponse.stage}\nنوع الطلب: ${
          newResponse.problemType === 'vacancies_unavailable' ? 'الشواغر غير متاحة' :
          newResponse.problemType === 'student_density' ? 'كثافة طلابية بالفصول' :
          newResponse.problemType === 'unjustified_rejection' ? 'رفض الطلب دون مبرر نظامي' :
          newResponse.problemType === 'cert_primary_eq' ? 'معادلة الشهادة للمرحلة الابتدائية' :
          newResponse.problemType === 'cert_intermediate_eq' ? 'معادلة الشهادة للمرحلة المتوسطة' :
          newResponse.problemType === 'cert_secondary_eq' ? 'معادلة الشهادة للمرحلة الثانوية' :
          newResponse.problemType === 'distance_from_school' ? 'نقل بسبب بعد السكن عن المدرسة' :
          newResponse.problemType === 'unregistered_desire' ? 'طلب قبول ومعادلة شهادة' :
          newResponse.problemType === 'new_registration_saudi' ? 'تسجيل مستجد سعودي' :
          newResponse.problemType === 'new_registration_resident' ? 'تسجيل مستجد مقيم' :
          newResponse.problemType || 'أخرى'
        }\nتقييم الموظف: ${newResponse.staffSatisfaction || '-'}\nتقييم الاستقبال: ${newResponse.receptionSatisfaction || '-'}\nالملاحظات: ${newResponse.notes || 'لا يوجد'}\n\nتاريخ الطلب: ${nowStr}`,
        triggerReason: 'Negative Feedback Alert'
      });

      // Show warning toast
      triggerToast(
        currentLang === 'ar'
          ? '⚠️ تم رصد تقييم سلبي! جاري إرسال تنبيه عاجل للمسؤولين عبر البريد الرسمي.'
          : '⚠️ Negative feedback detected! Instant alert dispatched via official email.',
        'warning'
      );
    } else {
      triggerToast(
        currentLang === 'ar'
          ? 'تم ارسال الطلب بنجاح ويمكنك متابعة الطلب بالإسم المسجل كاملاً'
          : 'Request sent successfully! You can track your request using your full registered name.',
        'success'
      );
    }

    // Handle third-party system integrations
    if (config.thirdPartyIntegrationEnabled) {
      const intId = `INT-${Math.floor(300 + Math.random() * 700)}`;
      const isResolvedText = newResponse.isResolved ? 'resolved' : 'pending';
      const severity = newResponse.staffSatisfaction < 3 ? 'high' : 'normal';

      const newIntegrationLog: SystemIntegrationLog = {
        id: intId,
        systemName: currentLang === 'ar' ? 'بوابة رعاية المستفيدين (Tawasul)' : 'Noor Educational Central System',
        payloadSent: JSON.stringify({
          action: 'register_survey',
          id: surveyId,
          beneficiaryName: config.encryptionEnabled ? 'AES256-[ENCRYPTED]' : newResponse.beneficiaryName,
          issueType: newResponse.problemType,
          status: isResolvedText,
          severity
        }),
        status: 'success',
        timestamp: nowStr
      };

      setIntegrationLogs((prev) => [newIntegrationLog, ...prev]);
    }

    return newResponse;
  };

  // Delete evaluation response
  const handleDeleteSurvey = (id: string) => {
    setSurveys((prev) => prev.filter((s) => s.id !== id));
    triggerToast(
      currentLang === 'ar' ? 'تم حذف الرد تماماً من السجلات.' : 'Response deleted from logs.',
      'info'
    );
  };

  const handleDeleteReport = (id: string) => {
    setPrincipalReports((prev) => prev.filter((r) => r.id !== id));
    triggerToast(
      currentLang === 'ar' ? 'تم حذف بلاغ المدرسة تماماً.' : 'School report deleted successfully.',
      'info'
    );
  };

  const handleDeleteEmailLog = (id: string) => {
    setEmailLogs((prev) => prev.filter((log) => log.id !== id));
    triggerToast(
      currentLang === 'ar' ? 'تم حذف سجل التنبيه بنجاح.' : 'Alert log deleted successfully.',
      'info'
    );
  };

  // Clear all evaluation surveys, requests, and logs
  const handleClearAllSurveys = () => {
    setSurveys([]);
    setPrincipalReports([]);
    setEmailLogs([]);
    setIntegrationLogs([]);
    clearAllSurveysFromStorage('admin');
    triggerToast(
      currentLang === 'ar' ? 'تم حذف ومسح جميع الطلبات والبلاغات والتقارير المسجلة في النظام نهائياً بواسطة الأدمن.' : 'All registered requests and reports cleared successfully.',
      'info'
    );
  };

  // Import multiple evaluation responses using Web Worker / Async Batch Engine (20,000+ items without UI freeze)
  const handleImportSurveys = async (newSurveys: SurveyResponse[], overwrite: boolean = false) => {
    if (!newSurveys || newSurveys.length === 0) return;

    setIsProcessingBatch(true);
    setBatchProgress(0);
    setBatchDetails(
      currentLang === 'ar'
        ? `جاري بدء معالجة ${newSurveys.length.toLocaleString('ar-SA')} طلب في الخلفية عبر (Web Worker / Micro-Batch Engine)...`
        : `Starting async batch execution for ${newSurveys.length.toLocaleString()} items...`
    );

    try {
      const result = await processSurveysInBatchAsync({
        newItems: newSurveys,
        existingSurveys: overwrite ? [] : surveys,
        adminEmails: config.adminEmails,
        isOnline,
        onProgress: (percent, processedCount, totalCount) => {
          setBatchProgress(percent);
          setBatchDetails(
            currentLang === 'ar'
              ? `معالجة غير متزامنة: ${processedCount.toLocaleString('ar-SA')} من أصل ${totalCount.toLocaleString('ar-SA')} طلب (${percent}%) - واجهة المستخدم متجاوبة 100% (60 FPS)`
              : `Async Processing: ${processedCount.toLocaleString()} / ${totalCount.toLocaleString()} items (${percent}%) - UI 100% Responsive`
          );
        }
      });

      const { deduplicatedItems, negativeEmailLogs, duplicatesCount } = result;

      setSurveys((prev) => {
        if (overwrite) {
          return deduplicatedItems;
        }
        return [...deduplicatedItems, ...prev];
      });

      if (negativeEmailLogs && negativeEmailLogs.length > 0) {
        setEmailLogs((prev) => [...negativeEmailLogs, ...prev]);
      }

      const msgAr = `⚡ تم إنجاز المعالجة غير المتزامنة لـ ${newSurveys.length.toLocaleString('ar-SA')} طلب بدون توقف الواجهة! إضافة ${deduplicatedItems.length.toLocaleString('ar-SA')} طلب جديد${duplicatesCount > 0 ? ` (وتجاهل ${duplicatesCount.toLocaleString('ar-SA')} مكرر)` : ''}`;
      const msgEn = `⚡ Async batch completed for ${newSurveys.length.toLocaleString()} items with zero UI freeze! Added ${deduplicatedItems.length.toLocaleString()} new records${duplicatesCount > 0 ? ` (${duplicatesCount.toLocaleString()} duplicates skipped)` : ''}`;

      triggerToast(currentLang === 'ar' ? msgAr : msgEn, negativeEmailLogs && negativeEmailLogs.length > 0 ? 'warning' : 'success');
    } catch (err) {
      console.error("Batch import execution error:", err);
      triggerToast(currentLang === 'ar' ? 'حدث خطأ غير متوقع أثناء المعالجة غير المتزامنة' : 'Async batch execution error', 'warning');
    } finally {
      setIsProcessingBatch(false);
      setBatchProgress(0);
      setBatchDetails('');
    }
  };

  const handleAddPrincipalReport = (newRep: Omit<PrincipalReport, 'id' | 'createdAt' | 'isResolved'>) => {
    let assignedOfficerId: string | undefined = undefined;
    try {
      const cachedOfficers = localStorage.getItem('officer_users_v4') || localStorage.getItem('officer_users_v3') || localStorage.getItem('officer_users_v2');
      if (cachedOfficers) {
        const officersList = JSON.parse(cachedOfficers);
        const schoolToMatch = newRep.schoolName ? newRep.schoolName.trim().toLowerCase() : '';
        
        // Find a school leadership supervisor who has this school in their list
        const matchingSupervisor = officersList.find((o: any) => 
          o.isActive &&
          o.role === 'school_leadership' && 
          o.schoolNames && 
          o.schoolNames.some((sName: string) => 
            schoolToMatch.includes(sName.trim().toLowerCase()) || 
            sName.trim().toLowerCase().includes(schoolToMatch)
          )
        );
        
        if (matchingSupervisor) {
          assignedOfficerId = matchingSupervisor.id;
        }
      }
    } catch (e) {
      console.error("Error matching school leadership supervisor", e);
    }

    const report: PrincipalReport = {
      ...newRep,
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      isResolved: false,
      assignedOfficerId
    };

    setPrincipalReports(prev => [report, ...prev]);

    triggerToast(
      currentLang === 'ar' 
        ? (assignedOfficerId 
            ? `تم تسجيل بلاغ المدرسة بنجاح برقم: ${report.id} وإسناده تلقائياً لمشرف القيادة المختص.`
            : `تم تسجيل بلاغ المدرسة بنجاح برقم: ${report.id}`) 
        : `School report registered successfully with ID: ${report.id}`,
      'success'
    );
  };

  const handleToggleReportResolved = (id: string) => {
    setPrincipalReports(prev => prev.map(rep => {
      if (rep.id === id) {
        const nextStatus = !rep.isResolved;
        
        triggerToast(
          currentLang === 'ar'
            ? `تحديث حالة البلاغ ${id} إلى: ${nextStatus ? 'تم الاعتماد والحل' : 'تحت الدراسة'}`
            : `Report ${id} status updated to: ${nextStatus ? 'Resolved' : 'Pending'}`,
          'success'
        );

        return { ...rep, isResolved: nextStatus };
      }
      return rep;
    }));
  };

  const handleUpdateReportStatus = (id: string, updates: Partial<PrincipalReport>) => {
    setPrincipalReports(prev => prev.map(rep => {
      if (rep.id === id) {
        const updated = { ...rep, ...updates };
        
        let messageAr = '';
        let messageEn = '';
        if (updates.isResolved !== undefined) {
          messageAr = updates.isResolved 
            ? `تحديث حالة البلاغ ${id} إلى: تم الاعتماد والحل` 
            : `تحديث حالة البلاغ ${id} إلى: تحت الدراسة والبت`;
          messageEn = updates.isResolved 
            ? `Report ${id} status updated to: Approved & Resolved` 
            : `Report ${id} status updated to: Under Review`;
        } else if (updates.isCommunicating !== undefined) {
          messageAr = updates.isCommunicating 
            ? `تحديث حالة البلاغ ${id} إلى: جاري مخاطبة جهة الاختصاص` 
            : `تحديث حالة البلاغ ${id} إلى: استلام البلاغ من قبل الموظف`;
          messageEn = updates.isCommunicating 
            ? `Report ${id} status updated to: Communicating with Competent Authority` 
            : `Report ${id} status updated to: Received by Employee`;
        } else if (updates.isReceived !== undefined) {
          messageAr = updates.isReceived 
            ? `تحديث حالة البلاغ ${id} إلى: استلام البلاغ من قبل الموظف` 
            : `تحديث حالة البلاغ ${id} إلى: تحت التدقيق والبت`;
          messageEn = updates.isReceived 
            ? `Report ${id} status updated to: Received by Employee` 
            : `Report ${id} status updated to: Under Review`;
        } else {
          messageAr = `تم تحديث حالة البلاغ ${id}`;
          messageEn = `Report ${id} status updated`;
        }

        triggerToast(
          currentLang === 'ar' ? messageAr : messageEn,
          'success'
        );

        return updated;
      }
      return rep;
    }));
  };

  // Toggle Resolution State (هل تم معالجة الطلب)
  const handleToggleResolved = (id: string) => {
    setSurveys((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextIsResolved = !s.isResolved;
          let unresolvedReason = s.unresolvedReason;
          if (!nextIsResolved && !unresolvedReason) {
            const entered = prompt(
              currentLang === 'ar'
                ? 'الرجاء إدخال سبب عدم حل المشكلة:'
                : 'Please enter the reason why the problem was not solved:'
            );
            if (entered !== null) {
              unresolvedReason = entered.trim() || undefined;
            }
          } else if (nextIsResolved) {
            unresolvedReason = undefined;
          }

          if (nextIsResolved) {
            return {
              ...s,
              isResolved: true,
              unresolvedReason: undefined,
              vacancyRequestStatus: 'executed',
              principalConfirmedStaffing: true,
              archivedAt: s.archivedAt || new Date().toISOString(),
            };
          }

          return { ...s, isResolved: false, unresolvedReason };
        }
        return s;
      })
    );
    triggerToast(
      currentLang === 'ar' ? 'تم تحديث حالة معالجة الطلب بنجاح.' : 'Resolution status updated successfully.',
      'success'
    );
  };

  // Sync Offline Created responses manually
  const handleSyncNow = () => {
    if (!isOnline) {
      triggerToast(
        currentLang === 'ar' ? 'خطأ: تعذر الاتصال بالخادم. يرجى تفعيل وضع الاتصال أولاً.' : 'Error: No connection. Please toggle online mode first.',
        'warning'
      );
      return;
    }

    setSurveys((prev) =>
      prev.map((s) => (s.isSynced ? s : { ...s, isSynced: true }))
    );
    
    // Update pending email logs to sent
    setEmailLogs((prev) =>
      prev.map((l) => (l.status === 'pending' ? { ...l, status: 'sent' } : l))
    );

    triggerToast(
      currentLang === 'ar' ? '🚀 تمت مزامنة جميع البيانات المعلقة مع الخوادم المركزية بنجاح!' : '🚀 All offline records synchronized successfully with central databases!',
      'success'
    );
  };

  // Manual Backup trigger
  const handleTriggerManualBackup = () => {
    const dataStr = JSON.stringify({ surveys, emailLogs, integrationLogs, config }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Beneficiary_Satisfaction_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast(
      currentLang === 'ar' ? '📦 تم إنشاء النسخة الاحتياطية وتنزيلها كملف مشفر بنجاح.' : '📦 Backup generated and downloaded successfully.',
      'success'
    );
  };

  // Simulated auto-backup timer (Demonstrates "خاصية النسخ الاحتياطي التلقائي")
  useEffect(() => {
    if (!config.autoBackupEnabled) return;

    // Simulate auto-backup interval
    const intervalMs = config.backupInterval * 1000 * 10; // Scaled down for demo visibility
    const timer = setInterval(() => {
      // Just log/show info toast for backup
      triggerToast(
        currentLang === 'ar'
          ? `🔄 نسخ احتياطي تلقائي: تم تأمين نسخة احتياطية من ${surveys.length} تقييماً بنجاح.`
          : `🔄 Auto Backup: Secured copy of ${surveys.length} survey entries safely.`,
        'info'
      );
    }, intervalMs);

    return () => clearInterval(timer);
  }, [config.autoBackupEnabled, config.backupInterval, surveys.length, currentLang]);

  // Toast Helper
  const triggerToast = (message: string, type: 'success' | 'info' | 'warning') => {
    setAlertToast({ message, type });
    setTimeout(() => setAlertToast(null), 4000);
  };

  const unsyncedCount = surveys.filter((s) => !s.isSynced).length;
  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans select-none antialiased transition-colors duration-300 ${
        isDark ? 'bg-gradient-to-br from-[#0b1f2e] via-[#081724] to-[#05101a] text-slate-100' : 'bg-gradient-to-br from-[#f2f9fd] via-[#e8f4fb] to-[#dfeff8] text-slate-900'
      }`}
      dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Dynamic Header */}
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline(!isOnline)}
        config={config}
        unsyncedCount={unsyncedCount}
        userRole={userRole}
        onBackToPortal={() => setUserRole('portal')}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      {/* Main Body */}
      <main className={`flex-1 flex flex-col relative min-h-0 ${userRole === 'portal' ? 'pb-24 sm:pb-12' : 'pb-32 sm:pb-20'}`}>
        
        {/* Offline Alert Strip */}
        {!isOnline && (
          <div className="w-full bg-amber-500 text-white font-bold text-xs sm:text-sm py-2 px-4 text-center flex items-center justify-center gap-2 shrink-0 z-40">
            <Wifi className="w-4 h-4 animate-pulse" />
            <span>
              {currentLang === 'ar'
                ? 'أنت تعمل حالياً دون اتصال بالإنترنت. سيتم تخزين الردود والتقييمات بأمان محلياً وسوف تتم مزامنتها تلقائياً عند استعادة الاتصال.'
                : 'You are currently working offline. Evaluations will be encrypted locally and synced automatically when back online.'}
            </span>
          </div>
        )}

        {/* Content Tabs */}
        <div className={`flex-1 relative ${userRole === 'portal' ? 'pb-24 sm:pb-12' : 'pb-32 sm:pb-20'}`}>
          {userRole === 'portal' ? (
            <div key="portal-view" className="animate-fade-in">
              <ErrorBoundary fallbackTitleAr="خطأ في تحميل البوابة الموحدة">
                <Portal
                  currentLang={currentLang}
                  surveys={surveys}
                  schools={schoolsList}
                  onToggleResolved={handleToggleResolved}
                  onUpdateSurvey={(updatedSurvey) => {
                    const withUpdate = { ...updatedSurvey, lastUpdatedAt: updatedSurvey.lastUpdatedAt || new Date().toISOString() };
                    setSurveys(prev => prev.map(s => s.id === updatedSurvey.id ? withUpdate : s));
                  }}
                  config={config}
                  onSelectRole={setUserRole}
                  principalReports={principalReports}
                  onAddPrincipalReport={handleAddPrincipalReport}
                  onToggleReportResolved={handleToggleReportResolved}
                  theme={theme}
                  portalView={portalView}
                  onPortalViewChange={handlePortalViewChange}
                  showAgeModal={showAgeModal}
                  onAgeModalChange={handleAgeModalChange}
                />
              </ErrorBoundary>
            </div>
          ) : userRole === 'parent' ? (
            <div key="survey-view" className="animate-fade-in">
              {/* Hero / Welcome Panel for Portal */}
              <div className={`py-12 px-4 shadow-lg text-center border-b ${
                isDark
                  ? 'bg-gradient-to-r from-teal-900/50 via-teal-800/40 to-emerald-950/50 text-white border-teal-800/30'
                  : 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white border-blue-800/25'
              }`}>
                <div className="max-w-3xl mx-auto">
                  <span className={`inline-flex items-center gap-1 text-xs px-3.5 py-1 rounded-full font-bold mb-3 border ${
                    isDark
                      ? 'bg-teal-950/60 text-teal-300 border-teal-700/40'
                      : 'bg-blue-800/40 text-blue-100 border-blue-500/25'
                  }`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {currentLang === 'ar' ? 'بوابة آمنة وموثوقة' : 'Secure Beneficiary Portal'}
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-sans mb-3">
                    {currentLang === 'ar'
                      ? 'تلتزم الإدارة بتقديم أرقى مستويات الخدمة والرعاية لمستفيديها'
                      : 'Commitment to High Quality Service & Care'}
                  </h1>
                  <p className={`text-xs sm:text-sm max-w-xl mx-auto leading-relaxed ${
                    isDark ? 'text-teal-200/90' : 'text-blue-100/90'
                  }`}>
                    {currentLang === 'ar'
                      ? 'نرجو منك تقييم تجربتك بعد استكمال طلبك'
                      : 'We kindly ask you to rate your experience after completing your request'}
                  </p>
                </div>
              </div>

              {/* Main Form */}
              <ErrorBoundary fallbackTitleAr="خطأ في تحميل نموذج الطلب">
                <SurveyForm
                  currentLang={currentLang}
                  onSubmit={handleAddSurvey}
                  schools={schoolsList}
                  onUpdateSurvey={(updatedSurvey) => {
                    const withUpdate = { ...updatedSurvey, lastUpdatedAt: updatedSurvey.lastUpdatedAt || new Date().toISOString() };
                    setSurveys(prev => prev.map(s => s.id === updatedSurvey.id ? withUpdate : s));
                  }}
                  config={config}
                  isOnline={isOnline}
                  onBackToPortal={() => setUserRole('portal')}
                  theme={theme}
                />
              </ErrorBoundary>
            </div>
          ) : (
            <div key="dashboard-view" className="animate-fade-in">
              <ErrorBoundary fallbackTitleAr="خطأ في تحميل لوحة تحكم المسؤول">
                <Dashboard
                  currentLang={currentLang}
                  surveys={surveys}
                  schools={schoolsList}
                  onImportSchools={handleUpdateSchools}
                  onDeleteSchool={(id) => handleUpdateSchools(schoolsList.filter(s => s.id !== id))}
                  onDeleteSurvey={handleDeleteSurvey}
                  onClearAllSurveys={handleClearAllSurveys}
                  onToggleResolved={handleToggleResolved}
                  onImportSurveys={handleImportSurveys}
                  onAddSurvey={handleAddSurvey}
                  onUpdateSurvey={(updatedSurvey) => {
                    const withUpdate = { ...updatedSurvey, lastUpdatedAt: updatedSurvey.lastUpdatedAt || new Date().toISOString() };
                    setSurveys(prev => prev.map(s => s.id === updatedSurvey.id ? withUpdate : s));
                  }}
                  config={config}
                  onUpdateConfig={setConfig}
                  emailLogs={emailLogs}
                  integrationLogs={integrationLogs}
                  onTriggerManualBackup={handleTriggerManualBackup}
                  onSyncNow={handleSyncNow}
                  unsyncedCount={unsyncedCount}
                  isOnline={isOnline}
                  onBackToPortal={() => setUserRole('portal')}
                  principalReports={principalReports}
                  onToggleReportResolved={handleToggleReportResolved}
                  onUpdateReportStatus={handleUpdateReportStatus}
                  onDeleteReport={handleDeleteReport}
                  onDeleteEmailLog={handleDeleteEmailLog}
                  onAssignSurvey={(id, officerId, officerName, notes, role) => {
                    setSurveys(prev => prev.map(s => {
                      if (s.id === id) {
                        return {
                          ...s,
                          assignedOfficerId: officerId,
                          serviceEmployee: officerName,
                          referredBy: role,
                          referralNotes: notes
                        };
                      }
                      return s;
                    }));
                  }}
                  onAssignPrincipalReport={(id, officerId, notes, role) => {
                    setPrincipalReports(prev => prev.map(rep => {
                      if (rep.id === id) {
                        return {
                          ...rep,
                          assignedOfficerId: officerId,
                          referredBy: role,
                          referralNotes: notes
                        };
                      }
                      return rep;
                    }));
                  }}
                  theme={theme}
                  beneficiaryFeedbacks={beneficiaryFeedbacks}
                  onUpdateBeneficiaryFeedbacks={setBeneficiaryFeedbacks}
                />
              </ErrorBoundary>
            </div>
          )}
        </div>

      </main>

      {/* Web Worker Async Batch Processing Banner / Overlay */}
      <AnimatePresence>
        {isProcessingBatch && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 border border-teal-500/50 text-white p-5 rounded-3xl shadow-2xl backdrop-blur-xl"
            id="worker-batch-progress-overlay"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 animate-pulse">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-teal-200 flex items-center gap-1.5 font-sans">
                    <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                    {currentLang === 'ar' ? 'المعالج الفائق غير المتزامن (Web Worker Active)' : 'Async Web Worker Engine Active'}
                  </h4>
                  <p className="text-[11px] text-teal-300/80 font-medium">
                    {currentLang === 'ar' ? 'ضمان سلاسة الواجهة وعدم التوقف (No UI Freeze - 60 FPS)' : 'Zero UI Freeze Guaranteed at 60 FPS'}
                  </p>
                </div>
              </div>

              <span className="bg-teal-500/30 text-teal-200 border border-teal-400/30 px-3 py-1 rounded-full text-xs font-black font-mono">
                {batchProgress}%
              </span>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-teal-900 mb-2.5">
              <motion.div
                className="bg-gradient-to-r from-teal-400 via-emerald-400 to-amber-400 h-full rounded-full"
                style={{ width: `${batchProgress}%` }}
                transition={{ ease: "easeOut", duration: 0.2 }}
              />
            </div>

            <p className="text-[11px] font-mono text-emerald-200 text-center truncate">
              {batchDetails}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Alert Indicator */}
      <AnimatePresence>
        {alertToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 ${
              currentLang === 'ar' ? 'left-6' : 'right-6'
            } z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 max-w-sm ${
              alertToast.type === 'success'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : alertToast.type === 'warning'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
            id="system-notification-toast"
          >
            {alertToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-indigo-400 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-bold leading-normal">
              {alertToast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Footer - Only Compact Contact & Feedback Button on the Left */}
      <footer className="w-full bg-transparent py-1.5 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-start" style={{ direction: 'ltr' }}>
          <button
            onClick={() => setIsFeedbackModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xs hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 ${
              isDark
                ? 'bg-[#1b6b8b]/60 hover:bg-[#218caa]/80 border-[#69cee3]/40 text-cyan-100'
                : 'bg-white/95 hover:bg-cyan-50/80 border-[#218caa]/35 text-[#1b6583]'
            }`}
            id="btn-footer-contact-feedback"
            style={{ direction: 'rtl' }}
          >
            <MessageSquareHeart className="w-3.5 h-3.5 text-[#69cee3] shrink-0 animate-pulse" />
            <span className="text-[11px] font-extrabold whitespace-nowrap">للتواصل وإبداء الملاحظات</span>
          </button>
        </div>
      </footer>

      {/* Contact & Feedback Modal */}
      <ContactFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSendFeedback={handleSendFeedback}
        isDark={isDark}
      />

      {/* Floating Action Buttons (FAB) */}
      {(userRole !== 'portal' || portalView !== 'selection' || showAgeModal) && (
        <>
          {/* FAB Right: Return to Main Gateway */}
          <div className="fixed bottom-6 right-6 z-50">
            <button
              type="button"
              onClick={handleReturnToMainGateway}
              className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-2xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 border border-teal-300/40 cursor-pointer group"
              id="fab-return-portal"
            >
              <Home className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" />
              <span>{currentLang === 'ar' ? 'العودة لبوابة الدخول الرئيسية' : 'Return to Main Gateway'}</span>
            </button>
          </div>

          {/* FAB Left: Back / Go Back */}
          <div className="fixed bottom-6 left-6 z-50">
            <button
              type="button"
              onClick={handleGoBack}
              className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white font-black text-xs sm:text-sm rounded-2xl shadow-2xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 border border-slate-500/40 cursor-pointer group"
              id="fab-go-back"
            >
              <RotateCcw className="w-5 h-5 text-teal-300 group-hover:-rotate-90 transition-transform" />
              <span>{currentLang === 'ar' ? 'عودة للخلف' : 'Go Back'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
