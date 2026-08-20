/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Header from './components/Header';
import SurveyForm from './components/SurveyForm';
// import Dashboard from './components/Dashboard';
import Portal from './components/Portal';
import ErrorBoundary from './components/ErrorBoundary';
import ContactFeedbackModal from './components/ContactFeedbackModal';
import { Language, SurveyResponse, AppConfig, EmailLog, SystemIntegrationLog, PrincipalReport, SchoolItem, BeneficiaryFeedback } from './types';
import { sendOfficialEmail } from './utils/emailService';
import { getSafeTranslation } from './utils/translationHelper';
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
import { ShieldCheck, Wifi, Info, CheckCircle2, ChevronRight, HelpCircle, Cpu, Zap, Activity, MessageSquareHeart, Home, RotateCcw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Dashboard = lazy(() => import('./components/Dashboard'));

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

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);

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

  const [alertToast, setAlertToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [batchDetails, setBatchDetails] = useState<string>('');

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
    if (!isInitialLoaded) return;
    const timer = setTimeout(() => {
      savePrincipalReportsToStorage(principalReports);
    }, 1500);
    return () => clearTimeout(timer);
  }, [principalReports, isInitialLoaded]);

  const handleAddSurvey = (newSurveyData: Omit<SurveyResponse, 'id' | 'createdAt' | 'isSynced'>): SurveyResponse => {
    const surveyId = `SURV-${Math.floor(100 + Math.random() * 900)}`;
    const nowStr = new Date().toISOString();

    const newResponse: SurveyResponse = {
      ...newSurveyData,
      id: surveyId,
      createdAt: nowStr,
      lastUpdatedAt: nowStr,
      isSynced: isOnline
    };

    setSurveys((prev) => [newResponse, ...prev]);

    const ratedStaff = newResponse.staffSatisfaction && newResponse.staffSatisfaction > 0;
    const ratedReception = newResponse.receptionSatisfaction && newResponse.receptionSatisfaction > 0;
    const isNegativeFeedback = (ratedStaff && newResponse.staffSatisfaction < 3) || (ratedReception && newResponse.receptionSatisfaction < 3);

    if (isNegativeFeedback) {
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
        triggerReason: `Negative Feedback Alert`
      }));

      setEmailLogs((prev) => [...newEmailLogs, ...prev]);

      sendOfficialEmail({
        to: targetEmails,
        subject: `⚠️ تنبيه فوري: تقييم سلبي من مستفيد (${newResponse.beneficiaryName})`,
        bodyText: `تم استلام تقييم سلبي جديد...`,
        triggerReason: 'Negative Feedback Alert'
      });

      triggerToast(currentLang === 'ar' ? '⚠️ تم رصد تقييم سلبي!' : '⚠️ Negative feedback detected!', 'warning');
    } else {
      triggerToast(currentLang === 'ar' ? 'تم ارسال الطلب بنجاح' : 'Request sent successfully!', 'success');
    }

    return newResponse;
  };

  const handleDeleteSurvey = (id: string) => {
    setSurveys((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDeleteReport = (id: string) => {
    setPrincipalReports((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDeleteEmailLog = (id: string) => {
    setEmailLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const handleClearAllSurveys = () => {
    setSurveys([]);
    setPrincipalReports([]);
    setEmailLogs([]);
    setIntegrationLogs([]);
    clearAllSurveysFromStorage('admin');
  };

  const handleImportSurveys = async (newSurveys: SurveyResponse[], overwrite: boolean = false) => {
    if (!newSurveys || newSurveys.length === 0) return;
    setIsProcessingBatch(true);
    try {
      const result = await processSurveysInBatchAsync({
        newItems: newSurveys,
        existingSurveys: overwrite ? [] : surveys,
        adminEmails: config.adminEmails,
        isOnline,
        onProgress: (percent) => setBatchProgress(percent)
      });
      const { deduplicatedItems, negativeEmailLogs } = result;
      setSurveys((prev) => overwrite ? deduplicatedItems : [...deduplicatedItems, ...prev]);
      if (negativeEmailLogs) setEmailLogs((prev) => [...negativeEmailLogs, ...prev]);
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleAddPrincipalReport = (newRep: Omit<PrincipalReport, 'id' | 'createdAt' | 'isResolved'>) => {
    const report: PrincipalReport = {
      ...newRep,
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      isResolved: false
    };
    setPrincipalReports(prev => [report, ...prev]);
  };

  const handleToggleReportResolved = (id: string) => {
    setPrincipalReports(prev => prev.map(rep => rep.id === id ? { ...rep, isResolved: !rep.isResolved } : rep));
  };

  const handleUpdateReportStatus = (id: string, updates: Partial<PrincipalReport>) => {
    setPrincipalReports(prev => prev.map(rep => rep.id === id ? { ...rep, ...updates } : rep));
  };

  const handleToggleResolved = (id: string) => {
    setSurveys((prev) => prev.map((s) => s.id === id ? { ...s, isResolved: !s.isResolved } : s));
  };

  const handleSyncNow = () => {
    if (!isOnline) return;
    setSurveys((prev) => prev.map((s) => ({ ...s, isSynced: true })));
    setEmailLogs((prev) => prev.map((l) => ({ ...l, status: 'sent' })));
  };

  const handleTriggerManualBackup = () => {
    const dataStr = JSON.stringify({ surveys, emailLogs, integrationLogs, config }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const triggerToast = (message: string, type: 'success' | 'info' | 'warning') => {
    setAlertToast({ message, type });
    setTimeout(() => setAlertToast(null), 4000);
  };

  const unsyncedCount = surveys.filter((s) => !s.isSynced).length;
  const isDark = theme === 'dark';

  const handleUpdateConfig = (newConfig: AppConfig) => setConfig(newConfig);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans select-none antialiased transition-colors duration-300 ${
        isDark ? 'bg-[#0b1f2e] text-slate-100' : 'bg-[#f2f9fd] text-slate-900'
      }`}
      dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
    >
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

      <main className={`flex-1 flex flex-col relative min-h-0 ${userRole === 'portal' ? 'pb-12' : 'pb-32'}`}>
        {!isOnline && (
          <div className="w-full bg-amber-500 text-white font-bold text-xs py-2 px-4 text-center z-40">
            <Wifi className="w-4 h-4 inline-block mr-2" />
            <span>{currentLang === 'ar' ? 'أنت تعمل دون اتصال' : 'You are offline'}</span>
          </div>
        )}

        <div className="flex-1 relative">
          {userRole === 'portal' ? (
            <div key="portal-view" className="animate-fade-in h-full">
              <ErrorBoundary fallbackTitleAr="خطأ في تحميل البوابة الموحدة">
                <Portal
                  currentLang={currentLang}
                  surveys={surveys}
                  schools={schoolsList}
                  onToggleResolved={handleToggleResolved}
                  onUpdateSurvey={(updatedSurvey) => {
                    setSurveys(prev => prev.map(s => s.id === updatedSurvey.id ? updatedSurvey : s));
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
            <div key="survey-view" className="animate-fade-in p-4 max-w-4xl mx-auto w-full">
              <ErrorBoundary fallbackTitleAr="خطأ في تحميل نموذج الطلب">
                <SurveyForm
                  currentLang={currentLang}
                  onSubmit={handleAddSurvey}
                  schools={schoolsList}
                  onUpdateSurvey={(updatedSurvey) => {
                    setSurveys(prev => prev.map(s => s.id === updatedSurvey.id ? updatedSurvey : s));
                  }}
                  config={config}
                  isOnline={isOnline}
                  onBackToPortal={() => setUserRole('portal')}
                  theme={theme}
                />
              </ErrorBoundary>
            </div>
          ) : (
            <div key="dashboard-view" className="animate-fade-in flex-1">
              <ErrorBoundary fallbackTitleAr="خطأ في تحميل لوحة تحكم المسؤول">
                <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-12 h-12 text-teal-600 animate-spin" /></div>}>
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
                      setSurveys(prev => prev.map(s => s.id === updatedSurvey.id ? updatedSurvey : s));
                    }}
                    config={config}
                    onUpdateConfig={handleUpdateConfig}
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
                      setSurveys(prev => prev.map(s => s.id === id ? { ...s, assignedOfficerId: officerId, serviceEmployee: officerName, referredBy: role, referralNotes: notes } : s));
                    }}
                    onAssignPrincipalReport={(id, officerId, notes, role) => {
                      setPrincipalReports(prev => prev.map(rep => rep.id === id ? { ...rep, assignedOfficerId: officerId, referredBy: role, referralNotes: notes } : rep));
                    }}
                    theme={theme}
                    beneficiaryFeedbacks={beneficiaryFeedbacks}
                    onUpdateBeneficiaryFeedbacks={setBeneficiaryFeedbacks}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {isProcessingBatch && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl bg-slate-900 text-white p-5 rounded-3xl shadow-2xl">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">Processing Batch...</span>
                <span className="text-xs font-bold">{batchProgress}%</span>
             </div>
             <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-teal-500 h-full" style={{ width: `${batchProgress}%` }} />
             </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alertToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl border ${
              alertToast.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' :
              alertToast.type === 'warning' ? 'bg-amber-600 border-amber-400 text-white' :
              'bg-blue-600 border-blue-400 text-white'
            }`}
          >
            {alertToast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <ContactFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSendFeedback={handleSendFeedback}
        isDark={isDark}
      />
      
      {/* Floating Action Button for Feedback */}
      <button
        onClick={() => setIsFeedbackModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-teal-600 text-white p-4 rounded-full shadow-2xl hover:bg-teal-700 transition-transform active:scale-95"
      >
        <MessageSquareHeart className="w-6 h-6" />
      </button>
    </div>
  );
}
