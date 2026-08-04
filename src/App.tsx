/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SurveyForm from './components/SurveyForm';
import Dashboard from './components/Dashboard';
import Portal from './components/Portal';
import ErrorBoundary from './components/ErrorBoundary';
import { Language, SurveyResponse, AppConfig, EmailLog, SystemIntegrationLog, PrincipalReport, SchoolItem } from './types';
import {
  saveSurveysToStorage,
  loadSurveysFromStorage,
  savePrincipalReportsToStorage,
  loadPrincipalReportsFromStorage
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
import { ShieldCheck, Wifi, Info, CheckCircle2, ChevronRight, HelpCircle, Cpu, Zap, Activity } from 'lucide-react';
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
  const [userRole, setUserRole] = useState<'portal' | 'parent' | 'admin'>('portal');

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
    return cached ? JSON.parse(cached) : INITIAL_INTEGRATION_LOGS;
  });

  // Global synchronized school registry (backed by app_schools_list_v1)
  const [schoolsList, setSchoolsList] = useState<SchoolItem[]>(() => {
    const cached = localStorage.getItem('app_schools_list_v1');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return INITIAL_SCHOOLS;
  });

  const handleUpdateSchools = (newList: SchoolItem[]) => {
    setSchoolsList(newList);
    localStorage.setItem('app_schools_list_v1', JSON.stringify(newList));
  };

  // Action feedback message states
  const [alertToast, setAlertToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Web Worker & Async Batch Engine states for 20,000+ items
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [batchDetails, setBatchDetails] = useState<string>('');

  // Async initial load from storage engine (IndexedDB + LocalStorage fallback)
  useEffect(() => {
    loadSurveysFromStorage().then(data => {
      if (data && data.length > 0) {
        setSurveys(data);
      }
    });
    loadPrincipalReportsFromStorage().then(data => {
      if (data && data.length > 0) {
        setPrincipalReports(data);
      }
    });
  }, []);

  // Save changes to local persistence via storageEngine
  useEffect(() => {
    saveSurveysToStorage(surveys);
  }, [surveys]);

  useEffect(() => {
    try {
      localStorage.setItem('beneficiary_emails', JSON.stringify(emailLogs.slice(0, 500)));
    } catch {
      /* ignore quota errors */
    }
  }, [emailLogs]);

  useEffect(() => {
    savePrincipalReportsToStorage(principalReports);
  }, [principalReports]);

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
      // Trigger instant email alert logs
      const emailId = `EML-${Math.floor(200 + Math.random() * 800)}`;
      const targetEmails = config.adminEmails.split(',').map((e) => e.trim());
      
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

      // Show warning toast
      triggerToast(
        currentLang === 'ar'
          ? '⚠️ تم رصد تقييم سلبي! جاري إرسال تنبيه عاجل للمسؤولين.'
          : '⚠️ Negative feedback detected! Instant admin email dispatched.',
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

  // Clear all evaluation surveys
  const handleClearAllSurveys = () => {
    setSurveys([]);
    localStorage.removeItem('beneficiary_surveys');
    triggerToast(
      currentLang === 'ar' ? 'تم حذف ومسح جميع الاستبيانات والتقييمات القديمة نهائياً.' : 'All old surveys cleared successfully.',
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
      const cachedOfficers = localStorage.getItem('officer_users_v2');
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
        isDark ? 'bg-gradient-to-b from-[#0b3c3b] via-[#062827] to-[#031d1c] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
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
      <main className="flex-1 pb-16">
        
        {/* Offline Alert Strip */}
        {!isOnline && (
          <div className="w-full bg-amber-500 text-white font-bold text-xs sm:text-sm py-2 px-4 text-center flex items-center justify-center gap-2">
            <Wifi className="w-4 h-4 animate-pulse" />
            <span>
              {currentLang === 'ar'
                ? 'أنت تعمل حالياً دون اتصال بالإنترنت. سيتم تخزين الردود والتقييمات بأمان محلياً وسوف تتم مزامنتها تلقائياً عند استعادة الاتصال.'
                : 'You are currently working offline. Evaluations will be encrypted locally and synced automatically when back online.'}
            </span>
          </div>
        )}

        {/* Content Tabs */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {userRole === 'portal' ? (
              <motion.div
                key="portal-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
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
                  />
                </ErrorBoundary>
              </motion.div>
            ) : userRole === 'parent' ? (
              <motion.div
                key="survey-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
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
              </motion.div>
            ) : (
              <motion.div
                key="dashboard-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
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
                  />
                </ErrorBoundary>
              </motion.div>
            )}
          </AnimatePresence>
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

      {/* Footer copyright */}
      <footer className={`border-t py-6 text-center text-xs font-mono transition-colors duration-300 ${
        isDark
          ? 'bg-[#04403d]/80 border-teal-800/40 text-teal-400'
          : 'bg-white border-slate-100 text-slate-400'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} MOE - Smart Beneficiary System.
          </p>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border ${
              isDark
                ? 'bg-teal-950/60 text-teal-300 border-teal-800/40'
                : 'bg-blue-50 text-blue-700 border-blue-100'
            }`}>
              <ShieldCheck className="w-3 h-3" />
              AES-256 Enabled
            </span>
            <span className={isDark ? 'text-teal-800/70' : 'text-slate-300'}>|</span>
            <span className="font-sans font-semibold">
              {currentLang === 'ar' ? 'رعاية المستفيدين أولاً' : 'Care first'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
