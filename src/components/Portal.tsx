import React, { useState, useMemo, useEffect } from 'react';
import { verifyCivilIdMatch, extractCivilIdFromSchool, cleanDigitsString } from '../utils/civilId';
import { AgeVerificationModal } from './AgeVerificationModal';
import { 
  Map,
  Users, 
  School, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Sparkles,
  Info,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  HelpCircle,
  FileCheck2,
  Calendar,
  Plus,
  Send,
  User,
  Phone,
  Layers,
  HelpCircle as HelpIcon,
  Star,
  Building2,
  X,
  XCircle,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, SurveyResponse, AppConfig, PrincipalReport, SchoolItem } from '../types';
import { TRANSLATIONS, INITIAL_SCHOOLS } from '../data/mockData';
import { SchoolSelectDropdown } from './SchoolSelectDropdown';
import { isMatchingPrincipalSchool, getRequestTypeInfo, cleanSchoolName, normalizeArabicText, isSurveyEqualizationRequest, isSurveyTransferRequest } from '../utils/storageEngine';

interface PortalProps {
  currentLang: Language;
  surveys: SurveyResponse[];
  onToggleResolved: (id: string) => void;
  onUpdateSurvey?: (survey: SurveyResponse) => void;
  config: AppConfig;
  onSelectRole: (role: 'parent' | 'admin') => void;
  principalReports?: PrincipalReport[];
  onAddPrincipalReport?: (report: Omit<PrincipalReport, 'id' | 'createdAt' | 'isResolved'>) => void;
  onToggleReportResolved?: (id: string) => void;
  theme?: 'light' | 'dark';
  schools?: SchoolItem[];
  portalView?: 'selection' | 'parent-choices' | 'parent-track' | 'principal-login' | 'principal-dashboard';
  onPortalViewChange?: (view: 'selection' | 'parent-choices' | 'parent-track' | 'principal-login' | 'principal-dashboard') => void;
  showAgeModal?: boolean;
  onAgeModalChange?: (show: boolean) => void;
}

export default function Portal({
  currentLang,
  surveys,
  onToggleResolved,
  onUpdateSurvey,
  config,
  onSelectRole,
  principalReports = [],
  onAddPrincipalReport,
  onToggleReportResolved,
  theme = 'light',
  schools = INITIAL_SCHOOLS,
  portalView: portalViewProp,
  onPortalViewChange,
  showAgeModal: showAgeModalProp,
  onAgeModalChange
}: PortalProps) {
  const isRtl = currentLang === 'ar';
  const t = TRANSLATIONS[currentLang];
  const isDark = theme === 'dark';

  const activeSchools = useMemo(() => {
    if (schools !== undefined && schools !== INITIAL_SCHOOLS) {
      return schools;
    }
    const cached = localStorage.getItem('app_schools_list_v1');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return schools || INITIAL_SCHOOLS;
  }, [schools]);

  // Portal view state: 'selection' | 'parent-choices' | 'parent-track' | 'principal-login' | 'principal-dashboard'
  const [view, setViewInternal] = useState<'selection' | 'parent-choices' | 'parent-track' | 'principal-login' | 'principal-dashboard'>(portalViewProp || 'selection');

  // Age Verification Modal State for Student Grade 1 Admission
  const [showAgeModal, setShowAgeModalInternal] = useState<boolean>(showAgeModalProp || false);

  // Map Warning Modal State
  const [showMapWarningModal, setShowMapWarningModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (portalViewProp !== undefined && portalViewProp !== view) {
      setViewInternal(portalViewProp);
    }
  }, [portalViewProp]);

  useEffect(() => {
    if (showAgeModalProp !== undefined && showAgeModalProp !== showAgeModal) {
      setShowAgeModalInternal(showAgeModalProp);
    }
  }, [showAgeModalProp]);

  const setView = (v: 'selection' | 'parent-choices' | 'parent-track' | 'principal-login' | 'principal-dashboard') => {
    setViewInternal(v);
    if (onPortalViewChange) onPortalViewChange(v);
  };

  const setShowAgeModal = (s: boolean) => {
    setShowAgeModalInternal(s);
    if (onAgeModalChange) onAgeModalChange(s);
  };

  const handleActionWithMapWarning = (action: () => void) => {
    setPendingAction(() => action);
    setShowMapWarningModal(true);
  };

  // Parent Tracking & Evaluation States
  const [searchName, setSearchName] = useState('');
  const [evals, setEvals] = useState<Record<string, {
    staffSatisfaction: number;
    receptionSatisfaction: number;
    notes: string;
    isResolved: boolean;
    success?: boolean;
    submitted?: boolean;
  }>>({});
  const [hoverStaff, setHoverStaff] = useState<Record<string, number>>({});
  const [hoverReception, setHoverReception] = useState<Record<string, number>>({});

  // Principal Login Form States
  const [schoolCode, setSchoolCode] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [principalMobile, setPrincipalMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [principalAuthMode, setPrincipalAuthMode] = useState<'login' | 'register' | 'forgot_password'>('login');

  // Principal Password Recovery States
  const [principalForgotStep, setPrincipalForgotStep] = useState<1 | 2>(1);
  const [principalForgotQuery, setPrincipalForgotQuery] = useState('');
  const [principalForgotGenCode, setPrincipalForgotGenCode] = useState('');
  const [principalForgotEnteredCode, setPrincipalForgotEnteredCode] = useState('');
  const [principalForgotNewPwd, setPrincipalForgotNewPwd] = useState('');
  const [principalForgotConfirmPwd, setPrincipalForgotConfirmPwd] = useState('');
  const [principalForgotSuccessMsg, setPrincipalForgotSuccessMsg] = useState('');
  const [principalForgotFoundAccount, setPrincipalForgotFoundAccount] = useState<any>(null);

  // Logged-in Principal Session State
  const [selectedSchoolData, setSelectedSchoolData] = useState<SchoolItem | null>(null);
  const [isSchoolDataConfirmed, setIsSchoolDataConfirmed] = useState(false);
  const [enteredCivilId, setEnteredCivilId] = useState('');
  const [civilIdErrorMsg, setCivilIdErrorMsg] = useState('');

  const [principalSession, setPrincipalSession] = useState<{
    schoolCode: string;
    schoolName: string;
    principalName: string;
    mobile?: string;
  } | null>(null);

  // Active filter for principal dashboard: 'all' | 'pending' | 'resolved'
  const [principalTab, setPrincipalTab] = useState<'all' | 'pending' | 'resolved'>('all');

  // Principal dashboard secondary tab: 'parents' | 'placement-requests' | 'eq-placement-requests' | 'principal-reports'
  const [dashboardSubTab, setDashboardSubTab] = useState<'parents' | 'placement-requests' | 'eq-placement-requests' | 'principal-reports'>('placement-requests');

  // Active filter for placement requests from admissions unit: 'all' | 'pending' | 'confirmed'
  const [placementFilter, setPlacementFilter] = useState<'all' | 'pending' | 'confirmed'>('pending');

  // Notes written by school principal when confirming placement
  const [principalNotesMap, setPrincipalNotesMap] = useState<Record<string, string>>({});

  // Modal state for Principal Return Request
  const [returnModalSurvey, setReturnModalSurvey] = useState<SurveyResponse | null>(null);
  const [returnReasonText, setReturnReasonText] = useState<string>('سعة الطاقة الاستيعابية مغلقة من التخطيط المدرسي');
  const [returnReasonError, setReturnReasonError] = useState<string>('');

  // Whether showing new report form
  const [isReporting, setIsReporting] = useState(false);

  // Form states for principal report
  const [repStage, setRepStage] = useState('Primary');
  const [repMobile, setRepMobile] = useState('');
  const [repProblemType, setRepProblemType] = useState<'vacancies_closed' | 'class_density'>('vacancies_closed');
  const [repClosedVacanciesOption, setRepClosedVacanciesOption] = useState<'specific' | 'all' | undefined>('all');
  const [repSpecificClosedClassesText, setRepSpecificClosedClassesText] = useState('');
  const [repProposedSolution, setRepProposedSolution] = useState<'open_class' | 'modify_budget' | undefined>(undefined);
  const [repOpenClassSubOption, setRepOpenClassSubOption] = useState<'no_teachers' | 'needs_teachers' | undefined>(undefined);
  const [repBudgetProposalText, setRepBudgetProposalText] = useState('');
  const [repRequiredSpecialtiesText, setRepRequiredSpecialtiesText] = useState('');
  const [formSuccessMsg, setFormSuccessMsg] = useState('');
  const [formErrorMsg, setFormErrorMsg] = useState('');


  // Extract unique school names from current surveys to populate quick-select dropdown
  const uniqueSchools = useMemo(() => {
    const names = new Set<string>();
    surveys.forEach(s => {
      if (s.schoolName) names.add(s.schoolName.trim());
    });
    // Add default popular schools if list is small
    if (names.size === 0) {
      names.add('مجمع طيبة التعليمي');
      names.add('مدرسة أحد الابتدائية');
      names.add('ثانوية الفتح بالمدينة المنورة');
    }
    return Array.from(names);
  }, [surveys]);

  // Handle principal login submission
  const handlePrincipalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!schoolName.trim()) {
      setLoginError(isRtl ? 'الرجاء إدخال اسم المدرسة.' : 'Please enter school name.');
      return;
    }
    if (!password.trim()) {
      setLoginError(isRtl ? 'الرجاء إدخال كلمة المرور.' : 'Please enter password.');
      return;
    }

    if (principalAuthMode === 'register') {
      if (!schoolName.trim()) {
        setLoginError(isRtl ? 'الرجاء اختيار أو إدخال اسم المدرسة.' : 'Please select school name.');
        return;
      }
      if (!isSchoolDataConfirmed) {
        setLoginError(isRtl ? 'الرجاء النقر على زر "تأكيد صحة بيانات المدرسة" أولاً لمتابعة إدخال الرقم السري.' : 'Please confirm school data first.');
        return;
      }
      if (!schoolCode.trim()) {
        setLoginError(isRtl ? 'الرجاء التأكد من استدعاء الرقم الوزاري المعتمد للمدرسة.' : 'Please verify ministerial school code.');
        return;
      }
      if (!principalName.trim()) {
        setLoginError(isRtl ? 'الرجاء التأكد من استدعاء اسم مدير المدرسة.' : 'Please verify school principal name.');
        return;
      }
      if (!principalMobile.trim()) {
        setLoginError(isRtl ? 'الرجاء التأكد من استدعاء رقم الجوال.' : 'Please verify mobile number.');
        return;
      }
      if (!password.trim()) {
        setLoginError(isRtl ? 'الرجاء إدخال الرقم السري.' : 'Please enter secret key / password.');
        return;
      }
      if (!confirmPassword.trim()) {
        setLoginError(isRtl ? 'الرجاء تكرار إدخال الرقم السري للتأكيد.' : 'Please repeat password for confirmation.');
        return;
      }
      if (password !== confirmPassword) {
        setLoginError(isRtl ? 'عفواً، الرقم السري وتكراره غير متطابقين. يرجى التأكد من كتابة نفس كلمة المرور.' : 'Passwords do not match.');
        return;
      }

      // Check that password contains both letters (Arabic or English) and numbers
      const hasLetters = /[a-zA-Z\u0600-\u06FF]/.test(password);
      const hasDigits = /[0-9]/.test(password);
      if (!hasLetters || !hasDigits) {
        setLoginError(isRtl ? 'عفواً، يجب أن يتكون الرقم السري من أحرف وأرقام معاً (مثال: S123456 أو M2026).' : 'Password must contain both letters and numbers (e.g. S123456).');
        return;
      }

      // Persist registered principal account to localStorage
      try {
        const existingRegsRaw = localStorage.getItem('registered_principals_v1');
        const existingRegs = existingRegsRaw ? JSON.parse(existingRegsRaw) : [];
        const newReg = {
          schoolCode: schoolCode.trim(),
          schoolName: schoolName.trim(),
          principalName: principalName.trim(),
          mobile: principalMobile.trim(),
          password: password.trim(),
          registeredAt: new Date().toISOString()
        };
        const filteredRegs = existingRegs.filter((r: any) => r.schoolName.trim().toLowerCase() !== schoolName.trim().toLowerCase());
        filteredRegs.push(newReg);
        localStorage.setItem('registered_principals_v1', JSON.stringify(filteredRegs));
      } catch (err) {
        console.error('Failed to persist principal account', err);
      }

      // Set session
      setPrincipalSession({
        schoolCode: schoolCode.trim(),
        schoolName: schoolName.trim(),
        principalName: principalName.trim(),
        mobile: principalMobile.trim()
      });
    } else {
      // Login Mode (Only School Name & Password/Secret Key)
      // Check if registered locally
      let foundReg: any = null;
      try {
        const existingRegsRaw = localStorage.getItem('registered_principals_v1');
        const existingRegs = existingRegsRaw ? JSON.parse(existingRegsRaw) : [];
        foundReg = existingRegs.find((r: any) => r.schoolName.trim().toLowerCase() === schoolName.trim().toLowerCase());
      } catch (e) {
        // ignore
      }

      if (foundReg) {
        if (foundReg.password && foundReg.password !== password.trim()) {
          setLoginError(isRtl ? 'عفواً، الرقم السري المدخل غير صحيح!' : 'Incorrect password!');
          return;
        }
      }

      // Try to find if this school exists in current principal reports
      const matchedReport = principalReports.find(
        r => r.schoolName.trim().toLowerCase() === schoolName.trim().toLowerCase()
      );

      let finalSchoolCode = foundReg?.schoolCode || '';
      let finalPrincipalName = foundReg?.principalName || '';
      let finalMobile = foundReg?.mobile || '';

      if (!finalSchoolCode) {
        if (matchedReport) {
          finalSchoolCode = matchedReport.schoolCode;
          finalPrincipalName = matchedReport.principalName;
          finalMobile = matchedReport.mobile;
        } else {
          // Look up in schools list
          const normInput = normalizeArabicText(schoolName);
          const matchedSchoolObj = schools.find(sch => {
            const schCode = String(sch.ministryCode || sch.code || sch.id || '').trim();
            const schNameAr = normalizeArabicText(sch.nameAr);
            return schNameAr === normInput || (schCode && schCode === schoolName.trim());
          });

          if (matchedSchoolObj) {
            finalSchoolCode = String(matchedSchoolObj.ministryCode || matchedSchoolObj.code || matchedSchoolObj.id || '45013');
            finalPrincipalName = 'أ. مدير المدرسة';
            finalMobile = '0554445555';
          } else {
            // Find in surveys
            const matchedSurvey = surveys.find(
              s => normalizeArabicText(s.schoolName) === normInput
            );
            if (matchedSurvey && matchedSurvey.schoolCode) {
              finalSchoolCode = matchedSurvey.schoolCode;
              finalPrincipalName = 'أ. مدير المدرسة';
              finalMobile = '0550000000';
            } else {
              // Fallback
              finalSchoolCode = '45013';
              finalPrincipalName = 'أ. مدير المدرسة';
              finalMobile = '0554445555';
            }
          }
        }
      }

      setPrincipalSession({
        schoolCode: finalSchoolCode,
        schoolName: schoolName.trim(),
        principalName: finalPrincipalName,
        mobile: finalMobile
      });
    }

    setView('principal-dashboard');
  };

  // Filtered surveys for logged in principal's school
  const schoolSurveys = useMemo(() => {
    if (!principalSession || !surveys) return [];
    return surveys.filter(s => isMatchingPrincipalSchool(s, principalSession, schools));
  }, [surveys, principalSession, schools]);

  // School Stats calculations
  const schoolStats = useMemo(() => {
    const total = schoolSurveys.length;
    if (total === 0) return { total: 0, avgSatisfaction: 0, resolvedPct: 0, pending: 0, resolved: 0 };

    let totalSatisfaction = 0;
    let resolvedCount = 0;

    schoolSurveys.forEach(s => {
      totalSatisfaction += (s.staffSatisfaction + s.receptionSatisfaction) / 2;
      if (s.isResolved) resolvedCount++;
    });

    return {
      total,
      avgSatisfaction: Number((totalSatisfaction / total).toFixed(1)),
      resolvedPct: Math.round((resolvedCount / total) * 100),
      pending: total - resolvedCount,
      resolved: resolvedCount
    };
  }, [schoolSurveys]);

  // Filtered list by active tab
  const displayedSchoolSurveys = useMemo(() => {
    return schoolSurveys.filter(s => {
      if (principalTab === 'pending') return !s.isResolved;
      if (principalTab === 'resolved') return s.isResolved;
      return true;
    });
  }, [schoolSurveys, principalTab]);

  // Principal's own school reports
  const myReports = useMemo(() => {
    if (!principalSession || !principalReports) return [];
    return principalReports.filter(r => {
      if (r.schoolCode && principalSession.schoolCode && r.schoolCode === principalSession.schoolCode) return true;
      if (r.schoolName && principalSession.schoolName && normalizeArabicText(r.schoolName) === normalizeArabicText(principalSession.schoolName)) return true;
      return false;
    });
  }, [principalReports, principalSession]);

  // Incoming placement requests sent to this principal's school
  const placementRequests = useMemo(() => {
    if (!principalSession || !surveys) return [];

    return surveys.filter((s) => {
      if (!s) return false;
      const matchesSchool = isMatchingPrincipalSchool(s, principalSession, schools);
      if (!matchesSchool) return false;

      // Any request that is either sent/referred to the school or has a placement / registration / transfer / eq nature:
      const isSentOrPlacement = 
        (s as any).sentToSchoolPrincipal || 
        s.vacancyRequestStatus === 'sent_to_school_principal' || 
        (s as any).sentToLeadership || 
        s.vacancyRequestStatus === 'sent_to_leadership' || 
        (s as any).isVacancyRequest || 
        s.vacancyRequestStatus === 'approved' || 
        s.vacancyRequestStatus === 'pending_vacancy' ||
        s.vacancyRequestStatus === 'pending' ||
        s.vacancyRequestStatus === 'staffing_confirmed' || 
        s.vacancyRequestStatus === 'executed' ||
        (s as any).principalConfirmedStaffing ||
        (s as any).isEqualizationRequest ||
        (s as any).isNonFreshStudent ||
        s.serviceType === 'registration' ||
        s.serviceType === 'transfer' ||
        s.serviceType === 'new' ||
        s.problemType === 'vacancies_unavailable' ||
        (s.problemType as string) === 'vacancies_closed' ||
        s.problemType === 'unregistered_desire' ||
        s.problemType === 'unjustified_rejection' ||
        s.problemType === 'new_registration_saudi' ||
        s.problemType === 'new_registration_resident' ||
        s.problemType === 'student_density' ||
        s.problemType === 'distance_from_school' ||
        s.problemType?.startsWith('cert_');

      return isSentOrPlacement;
    });
  }, [surveys, principalSession, schools]);

  // Equivalency Placement Requests (طلبات التسكين وفق المعادلات)
  const equivalencyPlacementRequests = useMemo(() => {
    return placementRequests.filter((s) => isSurveyEqualizationRequest(s));
  }, [placementRequests]);

  // Admissions Placement Requests (طلبات التسكين المرسلة من وحدة القبول - excludes Equivalency Requests)
  const admissionsPlacementRequests = useMemo(() => {
    return placementRequests.filter((s) => !isSurveyEqualizationRequest(s));
  }, [placementRequests]);

  // Active Placement Source List based on active subtab
  const activePlacementSourceList = useMemo(() => {
    if (dashboardSubTab === 'eq-placement-requests') {
      return equivalencyPlacementRequests;
    }
    return admissionsPlacementRequests;
  }, [dashboardSubTab, equivalencyPlacementRequests, admissionsPlacementRequests]);

  // Filtered placement requests according to active placement sub-filter
  const displayedPlacementRequests = useMemo(() => {
    return activePlacementSourceList.filter(s => {
      const isConfirmed = s.principalConfirmedStaffing || s.vacancyRequestStatus === 'staffing_confirmed' || s.vacancyRequestStatus === 'executed';
      const isReturned = (s as any).returnedByPrincipal || s.vacancyRequestStatus === 'returned_no_vacancy';
      if (placementFilter === 'pending') return !isConfirmed && !isReturned;
      if (placementFilter === 'confirmed') return isConfirmed;
      return true;
    });
  }, [activePlacementSourceList, placementFilter]);

  const getProblemName = (key: string, surveyObj?: SurveyResponse) => {
    if (surveyObj) {
      const info = getRequestTypeInfo(surveyObj, isRtl);
      return `${info.label} (${info.subLabel})`;
    }
    switch (key) {
      case 'new_registration_saudi': return isRtl ? 'تسجيل جديد (سعودي)' : 'New Registration (Saudi)';
      case 'new_registration_resident': return isRtl ? 'تسجيل جديد (مقيم)' : 'New Registration (Resident)';
      case 'vacancies_unavailable': return isRtl ? 'نقل طالب (طلب شاغر)' : 'Student Transfer (Vacancy)';
      case 'student_density': return isRtl ? 'نقل طالب (كثافة بالفصول)' : 'Student Transfer (Density)';
      case 'unjustified_rejection': return isRtl ? 'معاملة قبول (رفض دون مبرر)' : 'Admission Case (Rejection)';
      case 'cert_primary_eq': return isRtl ? 'معادلة مؤهلات (المرحلة الابتدائية)' : 'Equivalency (Primary)';
      case 'cert_intermediate_eq': return isRtl ? 'معادلة مؤهلات (المرحلة المتوسطة)' : 'Equivalency (Intermediate)';
      case 'cert_secondary_eq': return isRtl ? 'معادلة مؤهلات (المرحلة الثانوية)' : 'Equivalency (Secondary)';
      case 'distance_from_school': return isRtl ? 'نقل طالب (بعد السكن)' : 'Student Transfer (Distance)';
      case 'unregistered_desire': return isRtl ? 'تسجيل جديد (قبول بالرغبة)' : 'New Registration (Desired)';
      case 'vacancies_closed': return isRtl ? 'نقل طالب (شواغر مغلقة)' : 'Student Transfer (Closed)';
      case 'class_density': return isRtl ? 'نقل طالب (كثافة فصول)' : 'Student Transfer (Density)';
      default: return isRtl ? 'معاملة قبول / أخرى' : 'Admission Case / Other';
    }
  };

  // Handler for Principal clicking "اعتماد التسكين الميداني ✅" (Approve Staffing)
  const handleConfirmPlacement = (survey: SurveyResponse) => {
    const customNote = principalNotesMap[survey.id]?.trim() || (isRtl ? 'تم تسكين الطالب/ة بالمدرسة بنجاح وتأكيد الاعتماد النهائي من مدير/ة المدرسة.' : 'Student placed successfully by school principal.');
    const now = new Date().toISOString();

    const updatedSurvey: SurveyResponse = {
      ...survey,
      isResolved: true, // Mark resolved and closed upon principal staffing confirmation
      vacancyRequestStatus: 'staffing_confirmed',
      principalConfirmedStaffing: true,
      sentToSchoolPrincipal: true,
      staffingConfirmedAt: now,
      archivedAt: now,
      staffingConfirmedBy: principalSession?.principalName || 'مدير المدرسة',
      staffingConfirmedSchoolName: principalSession?.schoolName || survey.schoolName,
      staffingConfirmedStage: survey.stage,
      staffingConfirmedGrade: survey.grade,
      staffingNote: customNote,
      unresolvedReason: customNote,
      transferAttachmentData: undefined,
      transferAttachmentName: undefined,
      attachmentsPurgedByPrincipal: true,
    };

    if (onUpdateSurvey) {
      onUpdateSurvey(updatedSurvey);
    }
  };

  // Handler for Principal opening return request modal
  const handleReturnPlacement = (survey: SurveyResponse) => {
    setReturnModalSurvey(survey);
    setReturnReasonText('سعة الطاقة الاستيعابية مغلقة من التخطيط المدرسي');
    setReturnReasonError('');
  };

  const handleConfirmReturnPlacement = () => {
    if (!returnModalSurvey) return;
    if (!returnReasonText.trim()) {
      setReturnReasonError(isRtl ? 'الرجاء تدوين سبب تعذر التسكين بوضوح.' : 'Please state return reason clearly.');
      return;
    }

    const now = new Date().toISOString();
    const reasonClean = returnReasonText.trim();

    const returnCount = ((returnModalSurvey as any).principalReturnCount || 0) + 1;
    const isSecondReturn = returnCount >= 2;
    const updatedSurvey: SurveyResponse = {
      ...returnModalSurvey,
      isResolved: false,
      vacancyRequestStatus: 'returned_no_vacancy',
      returnedByPrincipal: true,
      sentToPlanningOfficer: true, // Automatically appears in Planning Officer account to open vacancy
      sentToLeadership: true, // Automatically appears in School Leadership account to follow up
      principalReturnCount: returnCount,
      isSecondReturnByPrincipal: isSecondReturn,
      principalReturnReason: reasonClean,
      returnedAt: now,
      notes: isRtl
        ? `🚨 أعيد الطلب من مدير المدرسة (${principalSession?.principalName || 'مدير المدرسة'}) بسبب تعذر التسكين وعدم توفر شاغر بالصف/المرحلة. السبب: (${reasonClean}). ظهرت المعاملة أوتوماتيكياً في حساب مسؤول التخطيط لفتح شاغر وفي حساب القيادة المدرسية لمتابعة التسكين.`
        : `Request returned by principal due to no vacancy: ${reasonClean}. Routed to Planning Officer and School Leadership automatically.`
    };

    if (onUpdateSurvey) {
      onUpdateSurvey(updatedSurvey);
    }

    setReturnModalSurvey(null);

    alert(isRtl
      ? `🚨 تم إعادة الطلب لعدم توفر شاغر بنجاح!\n\n• سبب الإعادة: (${reasonClean})\n• ظهرت المعاملة أوتوماتيكياً في حساب مسؤول التخطيط لفتح شاغر بالمرحلة والصف المطلوبين.\n• ظهرت المعاملة أوتوماتيكياً في حساب القيادة المدرسية لمتابعة التسكين.`
      : `Request returned to Planning Officer and School Leadership due to no vacancy.`);
  };

  // Handle principal report submit handler
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrorMsg('');
    setFormSuccessMsg('');

    if (!repMobile.trim()) {
      setFormErrorMsg(isRtl ? 'الرجاء إدخال رقم الجوال.' : 'Please enter mobile number.');
      return;
    }

    if (repProblemType === 'vacancies_closed') {
      if (!repClosedVacanciesOption) {
        setFormErrorMsg(isRtl ? 'الرجاء تحديد خيار الشواغر المغلقة (فصول معينة أو جميع الفصول).' : 'Please select closed vacancies option.');
        return;
      }
      if (repClosedVacanciesOption === 'specific' && !repSpecificClosedClassesText.trim()) {
        setFormErrorMsg(isRtl ? 'الرجاء كتابة الفصول المغلقة.' : 'Please enter specific closed classes.');
        return;
      }
    }

    if (repProblemType === 'class_density') {
      if (!repProposedSolution) {
        setFormErrorMsg(isRtl ? 'الرجاء اختيار الحل المقترح من الخيارات المتاحة.' : 'Please select proposed solution.');
        return;
      }
      if (repProposedSolution === 'open_class') {
        if (!repOpenClassSubOption) {
          setFormErrorMsg(isRtl ? 'الرجاء تحديد خيار توفير المعلمين.' : 'Please select teacher provisioning option.');
          return;
        }
        if (repOpenClassSubOption === 'needs_teachers' && !repRequiredSpecialtiesText.trim()) {
          setFormErrorMsg(isRtl ? 'الرجاء كتابة التخصصات المطلوبة لفتح الفصل.' : 'Please enter required specialties.');
          return;
        }
      }
      if (repProposedSolution === 'modify_budget' && !repBudgetProposalText.trim()) {
        setFormErrorMsg(isRtl ? 'الرجاء كتابة مقترح تعديل ميزانية الفصول.' : 'Please write your class budget proposal.');
        return;
      }
    }

    if (onAddPrincipalReport && principalSession) {
      onAddPrincipalReport({
        schoolName: principalSession.schoolName,
        schoolCode: principalSession.schoolCode,
        stage: repStage,
        principalName: principalSession.principalName,
        mobile: repMobile,
        problemType: repProblemType,
        closedVacanciesOption: repProblemType === 'vacancies_closed' ? repClosedVacanciesOption : undefined,
        specificClosedClassesText: (repProblemType === 'vacancies_closed' && repClosedVacanciesOption === 'specific') ? repSpecificClosedClassesText : undefined,
        proposedSolution: repProblemType === 'class_density' ? repProposedSolution : undefined,
        openClassSubOption: (repProblemType === 'class_density' && repProposedSolution === 'open_class') ? repOpenClassSubOption : undefined,
        budgetProposalText: (repProblemType === 'class_density' && repProposedSolution === 'modify_budget') ? repBudgetProposalText : undefined,
        requiredSpecialtiesText: (repProblemType === 'class_density' && repProposedSolution === 'open_class' && repOpenClassSubOption === 'needs_teachers') ? repRequiredSpecialtiesText : undefined
      });

      setFormSuccessMsg(isRtl ? 'تم تسجيل البلاغ والطلب المقترح بنجاح وإرساله لمسئول القبول والتوجيه.' : 'Report submitted successfully to the admission officer.');
      
      // Reset form fields
      setRepMobile('');
      setRepProblemType('vacancies_closed');
      setRepClosedVacanciesOption(undefined);
      setRepSpecificClosedClassesText('');
      setRepProposedSolution(undefined);
      setRepOpenClassSubOption(undefined);
      setRepBudgetProposalText('');
      setRepRequiredSpecialtiesText('');
      
      setTimeout(() => {
        setFormSuccessMsg('');
        setIsReporting(false);
      }, 3000);
    }
  };

  // Filtered surveys based on parent name query - strictly matching guardian name as registered
  const matchedSurveys = useMemo(() => {
    const query = searchName.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!query) return [];
    return surveys.filter(s => {
      const bName = (s.beneficiaryName || '').trim().toLowerCase().replace(/\s+/g, ' ');
      return bName === query;
    });
  }, [searchName, surveys]);

  // Handle saving evaluation from parent track view
  const handleSaveEval = (survey: SurveyResponse) => {
    const local = evals[survey.id] || {
      staffSatisfaction: survey.staffSatisfaction || 0,
      receptionSatisfaction: survey.receptionSatisfaction || 0,
      notes: '',
      isResolved: survey.isResolved || false,
    };

    const staffSat = local.staffSatisfaction > 0 ? local.staffSatisfaction : 5;
    const receptionSat = local.receptionSatisfaction > 0 ? local.receptionSatisfaction : 5;
    const userNotes = (local.notes || '').trim();
    const nowIso = new Date().toISOString();

    const updatedSurvey: SurveyResponse = {
      ...survey,
      staffSatisfaction: staffSat,
      receptionSatisfaction: receptionSat,
      notes: userNotes || survey.notes,
      isResolved: true,
      beneficiaryEvaluationSubmitted: true,
      evaluationSubmittedAt: nowIso,
      lastUpdatedAt: nowIso
    };

    if (onUpdateSurvey) {
      onUpdateSurvey(updatedSurvey);
    }

    // Direct persistence fallback to localStorage
    try {
      const cached = localStorage.getItem('beneficiary_surveys');
      if (cached) {
        const list = JSON.parse(cached);
        const updatedList = list.map((s: any) => s.id === survey.id ? updatedSurvey : s);
        localStorage.setItem('beneficiary_surveys', JSON.stringify(updatedList));
      }
    } catch { /* ignore */ }

    // Mark submitted and success in state
    setEvals(prev => ({
      ...prev,
      [survey.id]: {
        staffSatisfaction: staffSat,
        receptionSatisfaction: receptionSat,
        notes: userNotes,
        isResolved: true,
        submitted: true,
        success: true
      }
    }));

    // Alert user
    alert(isRtl 
      ? '✅ تم حفظ وإرسال تقييمكم بنجاح! تم فتح وعرض بيانات التسكين والمدرسة المعتمدة أدناه.' 
      : '✅ Your evaluation has been submitted successfully! Placement details are unlocked below.');

    // Clear success banner animation after 4 seconds (keeping submitted: true)
    setTimeout(() => {
      setEvals(prev => ({
        ...prev,
        [survey.id]: {
          ...(prev[survey.id] || local),
          submitted: true,
          success: false
        }
      }));
    }, 4000);
  };


  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 sm:py-2" id="portal-root">
      
      {/* VIEW 1: ROLE SELECTION LAUNCHPAD */}
      {view === 'selection' && (
        <div
          key="portal-selection"
          className="py-0.5 sm:py-1 space-y-2 max-w-6xl mx-auto px-4 animate-fade-in"
        >
            {/* Header Title */}
            <div className="text-center max-w-2xl mx-auto space-y-0">
              <h1 className={`text-xl sm:text-2xl font-black tracking-tight leading-tight transition-colors ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}>
                {t.portalTitle}
              </h1>
              <p className={`text-[10px] sm:text-xs font-medium max-w-xl mx-auto leading-relaxed transition-colors ${
                isDark ? 'text-teal-200/80' : 'text-slate-500'
              }`}>
                {t.portalSubtitle}
              </p>
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 max-w-6xl mx-auto">
              
              {/* Card 1: Educational Schools Map (خارطة المدارس التعليمية) */}
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                onClick={() => window.open('https://mapedumadinah.com/', '_blank')}
                className={`group relative rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between overflow-hidden shadow-sm border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 hover:border-cyan-400'
                    : 'bg-white border-slate-200 hover:border-cyan-500 hover:shadow-lg'
                }`}
              >
                {/* Decorative background glow */}
                <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl transition-all ${
                  isDark ? 'bg-cyan-500/5 group-hover:bg-cyan-500/10' : 'bg-cyan-500/5 group-hover:bg-cyan-500/10'
                }`} />
                
                <div className="space-y-3">
                  {/* White Icon Wrapper - Colored Icon */}
                  <div className={`p-2.5 w-fit rounded-xl shadow-sm border transition-all duration-300 ${
                    isDark ? 'bg-slate-700 border-slate-600 text-cyan-400' : 'bg-white border-slate-100 text-cyan-600'
                  }`}>
                    <Map className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className={`font-extrabold text-base sm:text-lg transition-colors ${
                      isDark ? 'text-white group-hover:text-cyan-300' : 'text-slate-800 group-hover:text-cyan-600'
                    }`}>
                      {(t as any).roleMap || (isRtl ? 'خارطة المدارس التعليمية' : 'Educational Schools Map')}
                    </h3>
                    <p className={`text-[11px] sm:text-xs font-semibold leading-relaxed ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                      {(t as any).roleMapIndependent || (isRtl ? 'رابط خارجي مستقل' : 'Independent External Link')}
                    </p>
                    <p className={`text-xs sm:text-sm font-medium leading-relaxed pt-1 ${isDark ? 'text-teal-200/70' : 'text-slate-500'}`}>
                      {(t as any).roleMapDesc || (isRtl 
                        ? 'بوابة مخصصة للمستفيدين لمعرفة المدارس القريبة من المدرسة المرغوبة او المستهدفة بالمسافة للتسجيل أو النقل'
                        : 'A portal dedicated to beneficiaries to find schools near their desired or target school by distance for registration or transfer')}
                    </p>
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 pt-3 font-bold text-xs sm:text-sm group-hover:gap-2.5 transition-all ${
                  isDark ? 'text-cyan-300' : 'text-cyan-600'
                }`}>
                  <span>{(t as any).roleMapAction || (isRtl ? 'زيارة الخارطة الآن' : 'Visit Map Now')}</span>
                  {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </div>
              </motion.div>

              {/* Card 2: Parent Beneficiary (ولي أمر) */}
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                onClick={() => setView('parent-choices')}
                className={`group relative rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between overflow-hidden shadow-sm border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 hover:border-teal-400'
                    : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-lg'
                }`}
              >
                {/* Decorative background glow */}
                <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl transition-all ${
                  isDark ? 'bg-teal-500/5 group-hover:bg-teal-500/10' : 'bg-blue-500/5 group-hover:bg-blue-500/10'
                }`} />
                
                <div className="space-y-3">
                  {/* White Icon Wrapper - Colored Icon */}
                  <div className={`p-2.5 w-fit rounded-xl shadow-sm border transition-all duration-300 ${
                    isDark ? 'bg-slate-700 border-slate-600 text-teal-400' : 'bg-white border-slate-100 text-blue-600'
                  }`}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className={`font-extrabold text-base sm:text-lg transition-colors ${
                      isDark ? 'text-white group-hover:text-teal-300' : 'text-slate-800 group-hover:text-blue-600'
                    }`}>
                      {t.roleParent}
                    </h3>
                    <p className={`text-[11px] sm:text-xs font-semibold leading-relaxed ${isDark ? 'text-teal-400' : 'text-slate-400'}`}>
                      {isRtl ? 'دخول مباشر بدون حساب' : 'Direct access without registration'}
                    </p>
                    <p className={`text-xs sm:text-sm font-medium leading-relaxed pt-1 ${isDark ? 'text-teal-200/70' : 'text-slate-500'}`}>
                      {t.roleParentDesc}
                    </p>
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 pt-3 font-bold text-xs sm:text-sm group-hover:gap-2.5 transition-all ${
                  isDark ? 'text-teal-300' : 'text-blue-600'
                }`}>
                  <span>{isRtl ? 'بدء الخدمة الآن' : 'Start Service'}</span>
                  {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </div>
              </motion.div>

              {/* Card 3: School Principal Beneficiary (مدير مدرسة) */}
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                onClick={() => {
                  setView('principal-login');
                  setPrincipalAuthMode('login');
                  setLoginError('');
                }}
                className={`group relative rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between overflow-hidden shadow-sm border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 hover:border-emerald-400'
                    : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-lg'
                }`}
              >
                {/* Decorative background glow */}
                <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl transition-all ${
                  isDark ? 'bg-emerald-500/5 group-hover:bg-emerald-500/10' : 'bg-emerald-500/5 group-hover:bg-emerald-500/10'
                }`} />
                
                <div className="space-y-3">
                  {/* White Icon Wrapper - Colored Icon */}
                  <div className={`p-2.5 w-fit rounded-xl shadow-sm border transition-all duration-300 ${
                    isDark ? 'bg-slate-700 border-slate-600 text-emerald-400' : 'bg-white border-slate-100 text-emerald-600'
                  }`}>
                    <School className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className={`font-extrabold text-base sm:text-lg transition-colors ${
                      isDark ? 'text-white group-hover:text-emerald-300' : 'text-slate-800 group-hover:text-emerald-600'
                    }`}>
                      {t.rolePrincipal}
                    </h3>
                    <p className={`text-[11px] sm:text-xs font-extrabold leading-relaxed ${isDark ? 'text-teal-400' : 'text-emerald-500'}`}>
                      {isRtl ? 'يتطلب رمز أمن' : 'Requires secure code'}
                    </p>
                    <p className={`text-xs sm:text-sm font-medium leading-relaxed pt-1 ${isDark ? 'text-teal-200/70' : 'text-slate-500'}`}>
                      {t.rolePrincipalDesc}
                    </p>
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 pt-3 font-bold text-xs sm:text-sm group-hover:gap-2.5 transition-all ${
                  isDark ? 'text-emerald-300' : 'text-emerald-600'
                }`}>
                  <span>{isRtl ? 'تسجيل دخول للمدرسة' : 'School Sign In'}</span>
                  {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </div>
              </motion.div>

              {/* Card 4: Department Staff (منسوبي الإدارة) */}
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                onClick={() => onSelectRole('admin')}
                className={`group relative rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between overflow-hidden shadow-sm border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 hover:border-amber-400'
                    : 'bg-white border-slate-200 hover:border-indigo-500 hover:shadow-lg'
                }`}
              >
                {/* Decorative background glow */}
                <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl transition-all ${
                  isDark ? 'bg-amber-500/5 group-hover:bg-amber-500/10' : 'bg-indigo-500/5 group-hover:bg-indigo-500/10'
                }`} />
                
                <div className="space-y-3">
                  {/* White Icon Wrapper - Colored Icon */}
                  <div className={`p-2.5 w-fit rounded-xl shadow-sm border transition-all duration-300 ${
                    isDark ? 'bg-slate-700 border-slate-600 text-amber-400' : 'bg-white border-slate-100 text-indigo-600'
                  }`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className={`font-extrabold text-base sm:text-lg transition-colors ${
                      isDark ? 'text-white group-hover:text-amber-300' : 'text-slate-800 group-hover:text-indigo-600'
                    }`}>
                      {isRtl ? 'منسوبي الإدارة' : 'Department Staff'}
                    </h3>
                    <p className={`text-[11px] sm:text-xs font-semibold leading-relaxed ${isDark ? 'text-teal-400' : 'text-slate-400'}`}>
                      {isRtl ? 'بوابة إدارة وحوكمة الأنظمة والتحليلات' : 'Administrative governance & analytics'}
                    </p>
                    <p className={`text-xs sm:text-sm font-medium leading-relaxed pt-1 ${isDark ? 'text-teal-200/70' : 'text-slate-500'}`}>
                      {isRtl
                        ? 'بوابة الدخول للمصرح لهم من منسوبي الإدارة العامة للتعليم بمنطقة المدينة المنورة'
                        : 'Entry portal for authorized staff of the General Administration of Education in Madinah Region'}
                    </p>
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 pt-3 font-bold text-xs sm:text-sm group-hover:gap-2.5 transition-all ${
                  isDark ? 'text-amber-300' : 'text-indigo-600'
                }`}>
                  <span>{isRtl ? 'تسجيل الدخول لمنسوبي الإدارة' : 'Department Staff Login'}</span>
                  {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </div>
              </motion.div>

            </div>
          </div>
        )}

        {/* VIEW: PARENT CHOICES */}
        {view === 'parent-choices' && (
          <motion.div
            key="portal-parent-choices"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            {/* Header Title */}
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className={`inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full font-bold border transition-colors ${
                isDark
                  ? 'bg-[#0b2a3f] text-teal-300 border-teal-800/40'
                  : 'bg-blue-50 text-blue-700 border-blue-100/50'
              }`}>
                <Users className={`w-4 h-4 ${isDark ? 'text-teal-400' : 'text-blue-600'}`} />
                {isRtl ? 'بوابة المستفيد (ولي الأمر)' : 'Beneficiary (Parent) Portal'}
              </span>
              <h1 className={`text-3xl font-black tracking-tight leading-tight transition-colors ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}>
                {isRtl ? 'تلتزم الإدارة بتقديم أرقى مستويات الخدمة والرعاية لمستفيديها' : 'Select Desired Service'}
              </h1>
              <p className={`text-sm font-semibold leading-relaxed transition-colors ${
                isDark ? 'text-teal-200/80' : 'text-slate-500'
              }`}>
                {isRtl 
                  ? 'نرجو منك تقييم تجربتك بعد استكمال طلبك' 
                  : 'Please select to submit a new request or check & evaluate existing requests associated with your name.'}
              </p>
            </div>

            {/* Grid of Three Choices */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              
              {/* Option A: Submit Request */}
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                onClick={() => {
                  handleActionWithMapWarning(() => {
                    try {
                      localStorage.setItem('student_service_type', 'new');
                    } catch {}
                    setShowAgeModal(true);
                  });
                }}
                className={`group relative rounded-3xl p-5 cursor-pointer transition-all flex flex-col justify-between overflow-hidden shadow-xs border ${
                  isDark
                    ? 'glass-card-dark hover:border-teal-400 hover:shadow-teal-500/5'
                    : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-xl'
                }`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl transition-all ${
                  isDark ? 'bg-teal-500/5 group-hover:bg-teal-500/10' : 'bg-blue-500/5 group-hover:bg-blue-500/10'
                }`} />

                <div className="space-y-5">
                  <div className={`glass-icon-container p-3.5 ${
                    isDark ? 'glass-icon-dark-blue group-hover:bg-teal-400 group-hover:text-[#061c24]' : 'glass-icon-light-blue group-hover:bg-blue-600 group-hover:text-white'
                  }`}>
                    <Plus className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className={`font-extrabold text-lg transition-colors ${
                      isDark ? 'text-white group-hover:text-teal-300' : 'text-slate-800 group-hover:text-blue-600'
                    }`}>
                      {isRtl ? 'تقديم طلب جديد' : 'Submit New Request'}
                    </h3>
                    <p className={`text-xs font-medium leading-relaxed pt-1 ${isDark ? 'text-teal-200/70' : 'text-slate-500'}`}>
                      {isRtl 
                        ? 'تعبئة استبيان قياس الرضا وتقديم بلاغ أو شكوى جديدة بخصوص القبول والتوجيه.' 
                        : 'Fill out the satisfaction survey and submit a new report or inquiry regarding admission.'}
                    </p>
                  </div>
                </div>

                <div className={`flex items-center gap-2 pt-6 font-bold text-xs group-hover:gap-3 transition-all ${
                  isDark ? 'text-teal-300' : 'text-blue-600'
                }`}>
                  <span>{isRtl ? 'بدء تقديم الطلب' : 'Start Submission'}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </div>
              </motion.div>

              {/* Option B: Transfer Student Request */}
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                onClick={() => {
                  handleActionWithMapWarning(() => {
                    try {
                      localStorage.setItem('student_service_type', 'transfer');
                    } catch {}
                    onSelectRole('parent');
                  });
                }}
                className={`group relative rounded-3xl p-5 cursor-pointer transition-all flex flex-col justify-between overflow-hidden shadow-xs border ${
                  isDark
                    ? 'glass-card-dark hover:border-emerald-400 hover:shadow-emerald-500/5'
                    : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-xl'
                }`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl transition-all ${
                  isDark ? 'bg-emerald-500/5 group-hover:bg-emerald-500/10' : 'bg-emerald-500/5 group-hover:bg-emerald-500/10'
                }`} />

                <div className="space-y-5">
                  <div className={`glass-icon-container p-3.5 ${
                    isDark ? 'glass-icon-dark-blue group-hover:bg-emerald-400 group-hover:text-[#061c24]' : 'glass-icon-light-blue group-hover:bg-emerald-600 group-hover:text-white'
                  }`}>
                    <ArrowRightLeft className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className={`font-extrabold text-lg transition-colors flex flex-wrap items-center gap-1.5 ${
                      isDark ? 'text-white group-hover:text-emerald-300' : 'text-slate-800 group-hover:text-emerald-600'
                    }`}>
                      {isRtl ? (
                        <>
                          <span>طلب نقل طالب</span>
                          <span className="inline-block px-2.5 py-0.5 text-xs sm:text-sm font-black rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs">
                            ومعادلة المؤهلات
                          </span>
                        </>
                      ) : (
                        <>
                          <span>Transfer Student Request</span>
                          <span className="inline-block px-2 py-0.5 text-xs font-black rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            & Qualifications
                          </span>
                        </>
                      )}
                    </h3>
                    <p className={`text-xs font-medium leading-relaxed pt-1 ${isDark ? 'text-teal-200/70' : 'text-slate-500'}`}>
                      {isRtl 
                        ? 'تقديم طلب نقل طالب إلى مدرسة أخرى، أو تقديم طلب معادلة المؤهلات الدراسية.' 
                        : 'Submit student transfer to another school or qualification equivalency request.'}
                    </p>
                  </div>
                </div>

                <div className={`flex items-center gap-2 pt-6 font-bold text-xs group-hover:gap-3 transition-all ${
                  isDark ? 'text-emerald-300' : 'text-emerald-600'
                }`}>
                  <span>{isRtl ? 'تقديم طلب نقل' : 'Apply for Transfer'}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </div>
              </motion.div>

              {/* Option C: Track Request by Name */}
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                onClick={() => setView('parent-track')}
                className={`group relative rounded-3xl p-5 cursor-pointer transition-all flex flex-col justify-between overflow-hidden shadow-xs border ${
                  isDark
                    ? 'glass-card-dark hover:border-amber-400 hover:shadow-amber-500/5'
                    : 'bg-white border-slate-200 hover:border-amber-500 hover:shadow-xl'
                }`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl transition-all ${
                  isDark ? 'bg-amber-500/5 group-hover:bg-amber-500/10' : 'bg-amber-500/5 group-hover:bg-amber-500/10'
                }`} />

                <div className="space-y-5">
                  <div className={`glass-icon-container p-3.5 ${
                    isDark ? 'glass-icon-dark-indigo group-hover:bg-amber-400 group-hover:text-[#061c24]' : 'glass-icon-light-indigo group-hover:bg-amber-600 group-hover:text-white'
                  }`}>
                    <Eye className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className={`font-extrabold text-lg transition-colors ${
                      isDark ? 'text-white group-hover:text-amber-300' : 'text-slate-800 group-hover:text-amber-600'
                    }`}>
                      {isRtl ? 'متابعة الطلب والتقييم بالاسم' : 'Track & Evaluate Request by Name'}
                    </h3>
                    <p className={`text-xs font-medium leading-relaxed pt-1 ${isDark ? 'text-teal-200/70' : 'text-slate-500'}`}>
                      {isRtl 
                        ? 'الاستعلام الفوري عن حالة المعالجة للطلب الخاص بك باسمك، وتعبئة التقييم مباشرة.' 
                        : 'Check resolution status instantly using the beneficiary’s name and complete the rating.'}
                    </p>
                  </div>
                </div>

                <div className={`flex items-center gap-2 pt-6 font-bold text-xs group-hover:gap-3 transition-all ${
                  isDark ? 'text-amber-300' : 'text-amber-600'
                }`}>
                  <span>{isRtl ? 'متابعة وتقييم الآن' : 'Track & Rate Now'}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </div>
              </motion.div>

            </div>

            {/* Back Button Removed as requested */}
          </motion.div>
        )}

        {/* VIEW: PARENT TRACKING */}
        {view === 'parent-track' && (
          <motion.div
            key="portal-parent-track"
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Tracking Search Card */}
            <div className={`border rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden ${
              isDark ? 'glass-card-dark' : 'bg-white border-slate-200'
            }`}>
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 to-yellow-600" />
              
              <div className="text-center space-y-2">
                <div className={`inline-flex items-center justify-center p-3 rounded-2xl mb-1 ${
                  isDark ? 'glass-icon-container glass-icon-dark-indigo' : 'bg-amber-50 text-amber-600'
                }`}>
                  <Eye className="w-6 h-6" />
                </div>
                <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {isRtl ? 'الاستعلام ومتابعة الطلب بالاسم' : 'Inquiry & Request Tracking by Name'}
                </h2>
                <p className={`text-xs font-semibold leading-relaxed px-4 ${isDark ? 'text-teal-300' : 'text-slate-500'}`}>
                  {isRtl 
                    ? 'أدخل الاسم الثنائي أو الثلاثي للمستفيد المدخل في الطلب للحصول المباشر على حالة الطلب واستبيان التقييم.' 
                    : 'Enter the beneficiary dual or triple name used in submission for instant access to status & ratings.'}
                </p>
              </div>

              {/* Clear notice message for beneficiary */}
              <div className={`max-w-xl mx-auto p-4 rounded-2xl border text-start flex items-start gap-3.5 ${
                isDark ? 'bg-amber-950/40 border-amber-800/50 text-amber-200' : 'bg-amber-50/90 border-amber-200 text-amber-900'
              }`}>
                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-extrabold block text-amber-700 dark:text-amber-400">
                    {isRtl ? '📌 تنبيه هام لولي الأمر (المستفيد):' : '📌 Important Notice for Guardian:'}
                  </span>
                  <p className="font-bold leading-relaxed">
                    {isRtl
                      ? 'حرصاً على الخصوصية ودقة البيانات، لا يظهر في صفحة المتابعة سوى الطلب المسجل باسم ولي الأمر المطابق تماماً لما تم تدوينه عند تقديم الطلب.'
                      : 'For privacy and data precision, only requests matching the exact full name of the guardian as recorded during submission will be displayed.'}
                  </p>
                </div>
              </div>

              {/* Search input group */}
              <div className="space-y-1.5 max-w-xl mx-auto">
                <label className={`block text-xs font-extrabold ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                  {isRtl ? 'اسم المستفيد بالكامل' : 'Full Beneficiary Name'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute top-3.5 right-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder={isRtl ? 'مثال: فيصل محمد الترجمي' : 'e.g. Faisal Mohammed'}
                    className={`w-full pr-10 pl-4 py-3 text-sm font-bold rounded-xl outline-none transition-all focus:ring-2 ${
                      isDark
                        ? 'bg-[#0b2336] border-teal-800/50 text-white focus:border-amber-400 focus:bg-[#061c24] focus:ring-amber-950'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500 focus:bg-white focus:ring-amber-100'
                    }`}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Results Block */}
            <div className="space-y-6">
              {searchName.trim().length > 0 ? (
                matchedSurveys.length > 0 ? (
                  <div className="space-y-6">
                    <h3 className={`text-lg font-black border-b pb-2 ${isDark ? 'text-teal-300 border-teal-800/30' : 'text-slate-800 border-slate-100'}`}>
                      {isRtl ? `الطلبات المطابقة (${matchedSurveys.length})` : `Matching Requests (${matchedSurveys.length})`}
                    </h3>
                    
                    {matchedSurveys.map((survey) => {
                      const local = evals[survey.id] || {
                        staffSatisfaction: survey.staffSatisfaction || 0,
                        receptionSatisfaction: survey.receptionSatisfaction || 0,
                        notes: '',
                        isResolved: survey.isResolved || false,
                      };

                      return (
                        <div
                          key={survey.id}
                          className={`border rounded-3xl p-6 sm:p-8 shadow-md space-y-6 transition-all ${
                            isDark ? 'glass-card-dark' : 'bg-white border-slate-200'
                          }`}
                        >
                          {/* Top row: ID and Date */}
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 dark:border-teal-800/20">
                            <div>
                              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${
                                isDark ? 'bg-teal-950 text-teal-300' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {survey.id}
                              </span>
                              <h4 className={`text-base font-black mt-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                {survey.beneficiaryName}
                              </h4>
                            </div>
                            <div className="text-right">
                              <span className="block text-xs font-semibold text-slate-400">
                                {isRtl ? 'تاريخ التقديم:' : 'Submission Date:'}
                              </span>
                              <span className={`text-xs font-extrabold ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                                {new Date(survey.createdAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
                                  year: 'numeric', month: 'long', day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Info Fields Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                            <div>
                              <span className="block text-xs font-semibold text-slate-400">{isRtl ? 'المدرسة المعنية:' : 'School:'}</span>
                              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                {survey.schoolName}
                                {survey.firstSchoolName && survey.firstSchoolName !== survey.schoolName && (
                                  <span className="block text-[10px] text-slate-400 mt-0.5 font-medium italic">
                                    {isRtl ? 'الرغبة الأصلية: ' : 'Original Desire: '} {survey.firstSchoolName}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="block text-xs font-semibold text-slate-400">{isRtl ? 'المرحلة والصف:' : 'Stage & Grade:'}</span>
                              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                {isRtl ? (survey.stage === 'EarlyChildhood' ? 'طفولة مبكرة' : survey.stage === 'Kindergarten' ? 'رياض أطفال' : survey.stage === 'Primary' ? 'ابتدائي' : survey.stage === 'Intermediate' ? 'متوسط' : 'ثانوي') : survey.stage} {survey.grade ? `(${survey.grade})` : ''}
                              </span>
                            </div>
                            <div>
                              <span className="block text-xs font-semibold text-slate-400">{isRtl ? 'نوع الطلب الرئيسي:' : 'Main Request Type:'}</span>
                              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                {getProblemName(survey.problemType)}
                              </span>
                            </div>
                          </div>

                          {/* Scheduled Review Appointment Box for Equivalency (Only shown when not finalized) */}
                          {!((survey as any).principalConfirmedStaffing || (survey as any).vacancyRequestStatus === 'staffing_confirmed' || (survey as any).vacancyRequestStatus === 'executed' || survey.isResolved) && ((survey as any).hasReviewAppointment || (survey as any).appointmentDate) && (
                            <div className={`p-4 rounded-2xl border text-start space-y-3 shadow-sm ${
                              isDark ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-950'
                            }`}>
                              <div className="flex items-center justify-between gap-2 border-b border-amber-200/60 dark:border-amber-800/60 pb-2.5">
                                <div className="flex items-center gap-2 font-black text-sm text-amber-900 dark:text-amber-200">
                                  <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                  <span>{isRtl ? '📅 موعد مراجعة إدارة القبول لمعادلة المؤهلات:' : '📅 Equivalency Review Appointment:'}</span>
                                </div>
                                {(survey as any).appointmentSetAt && (
                                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-200/70 dark:bg-amber-900/60 font-bold text-amber-900 dark:text-amber-200">
                                    {new Date((survey as any).appointmentSetAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-bold">
                                <div className="p-2.5 rounded-xl bg-white/90 dark:bg-black/40 border border-amber-200 dark:border-amber-800">
                                  <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-400 block">{isRtl ? 'يوم وتاريخ المراجعة:' : 'Appointment Date:'}</span>
                                  <span className="text-sm font-black text-slate-900 dark:text-white">
                                    {(survey as any).appointmentDate || 'لم يحدد'}
                                  </span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white/90 dark:bg-black/40 border border-amber-200 dark:border-amber-800">
                                  <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-400 block">{isRtl ? 'ساعة المراجعة:' : 'Appointment Time:'}</span>
                                  <span className="text-sm font-black text-slate-900 dark:text-white">
                                    {(survey as any).appointmentTime || '09:00 صباحاً'}
                                  </span>
                                </div>
                              </div>

                              {(survey as any).appointmentLocationLink && (
                                <div className="pt-1">
                                  <a
                                    href={(survey as any).appointmentLocationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
                                  >
                                    <span>📍 {isRtl ? 'فتح موقع المقر والمراجعة على خرائط Google' : 'Open Location on Google Maps'}</span>
                                  </a>
                                </div>
                              )}

                              {/* Prominent Warning Message to Beneficiary */}
                              <div className="p-3.5 rounded-xl bg-red-600 text-white font-extrabold text-xs shadow-md border-2 border-red-700 flex items-start gap-2.5">
                                <AlertTriangle className="w-5 h-5 text-yellow-300 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <span className="font-black underline block text-yellow-300 text-sm">{isRtl ? '⚠️ تنبيه تحذيري هام جداً لولي الأمر:' : '⚠️ Critical Warning Notice:'}</span>
                                  <p className="leading-relaxed text-xs">
                                    {(survey as any).appointmentNote || (isRtl ? 'يرجى إحضار جميع المستندات والمؤهلات الرسمية والأصلية والشهادات الدراسية عند مراجعة الإدارة في الموعد المحدد لعمل المعادلة.' : 'Please bring all official documents, qualifications, and original certificates upon visiting the administration at the appointed date.')}
                                  </p>
                                </div>
                              </div>

                              {/* Beneficiary Attendance Confirmation Option */}
                              <div className="pt-2 border-t border-amber-200/80 dark:border-amber-800/80 flex flex-wrap items-center justify-between gap-3">
                                {(survey as any).appointmentCancelledDueToNoShow ? (
                                  <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-900 dark:text-red-200 font-extrabold text-xs border border-red-300 flex items-center gap-2 w-full">
                                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                                    <span>{isRtl ? '❌ تم إلغاء الطلب من قبل مسؤول المعادلات لعدم حضور المستفيد للموعد المحدد.' : 'Request cancelled due to no-show.'}</span>
                                  </div>
                                ) : (survey as any).appointmentConfirmedByBeneficiary ? (
                                  <div className="flex items-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 w-full">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span>
                                      {isRtl 
                                        ? `✅ تم تأكيد حضور الموعد من قبلك بنجاح بتاريخ: ${new Date((survey as any).appointmentConfirmedAt || Date.now()).toLocaleDateString('ar-SA')} - ظهر التحديث لدى مسؤول المعادلات.` 
                                        : 'Attendance confirmed by beneficiary'}
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onUpdateSurvey) {
                                        onUpdateSurvey({
                                          ...survey,
                                          appointmentConfirmedByBeneficiary: true,
                                          appointmentConfirmedAt: new Date().toISOString()
                                        } as any);
                                      }
                                      alert(isRtl ? '✅ تم تأكيد حضورك للموعد بنجاح! سيظهر التحديث لمسؤول المعادلات.' : 'Attendance confirmed successfully!');
                                    }}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>{isRtl ? 'تأكيد حضور الموعد مع مسؤول المعادلات' : 'Confirm Appointment Attendance'}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Request Processing & Final Placement Status Banners */}
                          {(() => {
                            const isVac = (survey as any).isVacancyRequest;
                            const st = (survey as any).vacancyRequestStatus;
                            const isDone = survey.isResolved || st === 'executed' || st === 'staffing_confirmed' || (survey as any).principalConfirmedStaffing;

                            // 1. FINAL PLACEMENT APPROVED (Congratulation & Mandatory Evaluation first)
                            if (isDone) {
                              const placedSchoolName = (survey as any).staffingConfirmedSchoolName || (survey as any).vacancyOpenedSchoolName || survey.schoolName;
                              const confirmedStage = (survey as any).staffingConfirmedStage || survey.stage;
                              const confirmedGrade = (survey as any).staffingConfirmedGrade || survey.grade;
                              const stageFormatted = isRtl ? (confirmedStage === 'EarlyChildhood' ? 'طفولة مبكرة' : confirmedStage === 'Kindergarten' ? 'رياض أطفال' : confirmedStage === 'Primary' ? 'ابتدائي' : confirmedStage === 'Intermediate' ? 'متوسط' : 'ثانوي') : confirmedStage;
                              const hasSubmittedRating = Boolean(
                                local.success || 
                                evals[survey.id]?.submitted ||
                                (survey as any).beneficiaryEvaluationSubmitted
                              );

                              return (
                                <div className="space-y-5">
                                  {/* Step 1: Education Directorate Congratulation Banner (Exact wording requested) */}
                                  <div className={`p-5 sm:p-6 rounded-3xl border text-center space-y-2 shadow-md ${
                                    isDark ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100' : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                                  }`}>
                                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 mb-1">
                                      <CheckCircle className="w-9 h-9" />
                                    </div>
                                    <h3 className="text-base sm:text-xl font-black leading-snug text-emerald-900 dark:text-emerald-200">
                                      {isRtl 
                                        ? '( تبارك لك الادارة العامة للتعليم بمنطقة المدينة المنورة قبول ابنكم / ابنتكم )' 
                                        : '( Madinah Education Directorate congratulates you on the acceptance of your student )'}
                                    </h3>
                                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-teal-200 max-w-2xl mx-auto leading-relaxed">
                                      {isRtl 
                                        ? 'وللاطلاع على بيانات المدرسة نأمل منكم أولاً تقييم الخدمة وإبداء المقترحات والملاحظات بكل شفافية' 
                                        : 'To view school and placement details, please first evaluate the service and share your feedback.'}
                                    </p>
                                  </div>

                                  {/* Step 2: Beneficiary Satisfaction & Evaluation Form */}
                                  <div className={`p-5 sm:p-6 rounded-3xl border space-y-5 shadow-sm ${
                                    isDark ? 'bg-teal-950/40 border-teal-800/40' : 'bg-white border-slate-200'
                                  }`}>
                                    <div className="flex items-center justify-between gap-3 border-b pb-3 border-slate-100 dark:border-teal-800/40">
                                      <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-amber-500" />
                                        <h4 className={`text-sm sm:text-base font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                          {isRtl ? 'استبيان قياس رضا المستفيد والتقييم' : 'Beneficiary Satisfaction & Evaluation Survey'}
                                        </h4>
                                      </div>
                                      {hasSubmittedRating && (
                                        <span className="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                          {isRtl ? '✓ تم إرسال التقييم بنجاح' : '✓ Evaluation Submitted'}
                                        </span>
                                      )}
                                    </div>

                                    {/* Success Notification */}
                                    {local.success && (
                                      <div className={`border rounded-2xl p-4 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-300 ${
                                        isDark ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                      }`}>
                                        <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" />
                                        <span>{isRtl ? 'تم حفظ وإرسال تقييمكم بنجاح! تم فتح تفاصيل وبيانات التسكين أدناه.' : 'Your rating has been saved! School details are now available below.'}</span>
                                      </div>
                                    )}

                                    {/* Star 1: Staff performance */}
                                    <div className="space-y-2">
                                      <label className={`block text-xs font-extrabold ${isDark ? 'text-teal-200' : 'text-slate-700'}`}>
                                        {isRtl ? '1. تقييم رضاك عن أداء ومساعدة الموظف المختص بالخدمة:' : '1. Satisfaction with specialized employee performance:'}
                                      </label>
                                      <div className="flex items-center gap-1.5">
                                        {[1, 2, 3, 4, 5].map((star) => {
                                          const hoverVal = hoverStaff[survey.id] || 0;
                                          const isFilled = hoverVal ? star <= hoverVal : star <= (local.staffSatisfaction || 0);
                                          return (
                                            <button
                                              key={star}
                                              type="button"
                                              onClick={() => {
                                                setEvals(prev => ({
                                                  ...prev,
                                                  [survey.id]: {
                                                    ...(prev[survey.id] || local),
                                                    staffSatisfaction: star
                                                  }
                                                }));
                                              }}
                                              onMouseEnter={() => {
                                                setHoverStaff(prev => ({ ...prev, [survey.id]: star }));
                                              }}
                                              onMouseLeave={() => {
                                                setHoverStaff(prev => ({ ...prev, [survey.id]: 0 }));
                                              }}
                                              className="focus:outline-none transition-transform hover:scale-110 active:scale-125 cursor-pointer p-1"
                                            >
                                              <Star
                                                className={`w-7 h-7 sm:w-8 sm:h-8 ${
                                                  isFilled
                                                    ? 'fill-amber-400 text-amber-400 filter drop-shadow-sm'
                                                    : 'text-slate-300 dark:text-slate-600'
                                                }`}
                                              />
                                            </button>
                                          );
                                        })}
                                        <span className={`text-xs font-black mr-2 px-2.5 py-1 rounded-lg ${
                                          (local.staffSatisfaction || 0) > 0 
                                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300' 
                                            : 'text-slate-400 dark:text-slate-500'
                                        }`}>
                                          {(local.staffSatisfaction || 0) > 0 ? `${local.staffSatisfaction} / 5` : (isRtl ? 'يرجى التقييم' : 'Please rate')}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Star 2: Reception quality */}
                                    <div className="space-y-2">
                                      <label className={`block text-xs font-extrabold ${isDark ? 'text-teal-200' : 'text-slate-700'}`}>
                                        {isRtl ? '2. تقييم رضاك عن جودة الاستقبال والتوجيه والإرشاد بالإدارة:' : '2. Satisfaction with reception and guidance quality:'}
                                      </label>
                                      <div className="flex items-center gap-1.5">
                                        {[1, 2, 3, 4, 5].map((star) => {
                                          const hoverVal = hoverReception[survey.id] || 0;
                                          const isFilled = hoverVal ? star <= hoverVal : star <= (local.receptionSatisfaction || 0);
                                          return (
                                            <button
                                              key={star}
                                              type="button"
                                              onClick={() => {
                                                setEvals(prev => ({
                                                  ...prev,
                                                  [survey.id]: {
                                                    ...(prev[survey.id] || local),
                                                    receptionSatisfaction: star
                                                  }
                                                }));
                                              }}
                                              onMouseEnter={() => {
                                                setHoverReception(prev => ({ ...prev, [survey.id]: star }));
                                              }}
                                              onMouseLeave={() => {
                                                setHoverReception(prev => ({ ...prev, [survey.id]: 0 }));
                                              }}
                                              className="focus:outline-none transition-transform hover:scale-110 active:scale-125 cursor-pointer p-1"
                                            >
                                              <Star
                                                className={`w-7 h-7 sm:w-8 sm:h-8 ${
                                                  isFilled
                                                    ? 'fill-amber-400 text-amber-400 filter drop-shadow-sm'
                                                    : 'text-slate-300 dark:text-slate-600'
                                                }`}
                                              />
                                            </button>
                                          );
                                        })}
                                        <span className={`text-xs font-black mr-2 px-2.5 py-1 rounded-lg ${
                                          (local.receptionSatisfaction || 0) > 0 
                                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300' 
                                            : 'text-slate-400 dark:text-slate-500'
                                        }`}>
                                          {(local.receptionSatisfaction || 0) > 0 ? `${local.receptionSatisfaction} / 5` : (isRtl ? 'يرجى التقييم' : 'Please rate')}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Additional Comments Textarea (Clean empty box without placeholder as requested) */}
                                    <div className="space-y-2">
                                      <label className={`block text-xs font-extrabold ${isDark ? 'text-teal-200' : 'text-slate-700'}`}>
                                        {isRtl ? '3. المقترحات والملاحظات:' : '3. Suggestions & Feedback:'}
                                      </label>
                                      <textarea
                                        value={local.notes || ''}
                                        onChange={(e) => {
                                          setEvals(prev => ({
                                            ...prev,
                                            [survey.id]: {
                                              ...(prev[survey.id] || local),
                                              notes: e.target.value
                                            }
                                          }));
                                        }}
                                        placeholder=""
                                        rows={3}
                                        className={`w-full p-4 text-xs sm:text-sm font-semibold rounded-2xl border transition-all outline-none focus:ring-2 ${
                                          isDark ? 'bg-teal-950/60 text-white focus:bg-teal-950' : 'bg-slate-50 focus:bg-white text-slate-900'
                                        } border-slate-200 dark:border-teal-800/40 focus:border-emerald-500 focus:ring-emerald-100`}
                                      />
                                    </div>

                                    {/* Action Button: Save Evaluation & Show School Details */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveEval(survey)}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer"
                                      >
                                        <Send className="w-4 h-4" />
                                        <span>{isRtl ? 'حفظ وإرسال التقييم وعرض بيانات التسكين' : 'Save & Send Rating & View Placement'}</span>
                                      </button>
                                      
                                      {hasSubmittedRating && (
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                                          {isRtl ? 'يمكنك تحديث التقييم والملاحظات في أي وقت بالضغط على حفظ وإرسال.' : 'You can update your feedback anytime.'}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Step 3: School Placement Details (Visible once staffing is confirmed) */}
                                  <div className={`p-5 sm:p-6 rounded-3xl border space-y-4 shadow-sm animate-in fade-in duration-300 ${
                                    isDark ? 'bg-teal-950/40 border-teal-700/60 text-teal-100' : 'bg-white border-emerald-300 text-slate-800'
                                  }`}>
                                      <div className="flex items-center gap-2 border-b pb-3 border-emerald-200 dark:border-teal-800/60 font-black text-sm text-emerald-800 dark:text-emerald-300">
                                        <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                        <span>{isRtl ? '🏫 بيانات المدرسة المسكن بها الطالب والمرحلة والصف:' : '🏫 Placed School & Grade Details:'}</span>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-extrabold">
                                        <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-black/30 border border-emerald-200 dark:border-emerald-800">
                                          <span className="text-[10px] opacity-75 block text-slate-500 dark:text-teal-400">{isRtl ? 'المدرسة المسكن عليها:' : 'Assigned School:'}</span>
                                          <span className="text-sm sm:text-base font-black text-emerald-900 dark:text-emerald-200">{placedSchoolName}</span>
                                        </div>
                                        <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-black/30 border border-emerald-200 dark:border-emerald-800">
                                          <span className="text-[10px] opacity-75 block text-slate-500 dark:text-teal-400">{isRtl ? 'المرحلة الدراسية:' : 'Stage:'}</span>
                                          <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{stageFormatted}</span>
                                        </div>
                                        <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-black/30 border border-emerald-200 dark:border-emerald-800">
                                          <span className="text-[10px] opacity-75 block text-slate-500 dark:text-teal-400">{isRtl ? 'الصف المسكن به:' : 'Assigned Grade:'}</span>
                                          <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{confirmedGrade || 'غير محدد'}</span>
                                        </div>
                                      </div>

                                      {/* Vacancy Opened Choice & Planning details */}
                                      {((survey as any).vacancyOpenedChoice || (survey as any).vacancyOpenReason || (survey as any).vacancyOpenedSchoolName) && (
                                        <div className={`p-3.5 rounded-2xl border text-start space-y-2 ${
                                          isDark ? 'bg-teal-950/60 border-teal-800 text-teal-200' : 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                                        }`}>
                                          <div className="flex items-center gap-2 font-black text-xs text-emerald-700 dark:text-emerald-300">
                                            <Sparkles className="w-4 h-4 text-emerald-500" />
                                            <span>{isRtl ? 'تفاصيل ومعلومات الشاغر والتسكين المعتمدة من التخطيط:' : 'Approved Vacancy Placement Details:'}</span>
                                          </div>
                                          
                                          {(survey as any).vacancyOpenedSchoolName && (
                                            <div className="text-xs font-bold">
                                              <span className="opacity-75">{isRtl ? 'المدرسة المسكن عليها والرغبة: ' : 'Placed School: '}</span>
                                              <span className="font-extrabold underline text-emerald-800 dark:text-emerald-200">
                                                {(survey as any).vacancyOpenedSchoolName}
                                                {(survey as any).vacancyOpenedChoice ? ` (${
                                                  (survey as any).vacancyOpenedChoice === '1st' ? (isRtl ? 'الرغبة الأولى' : '1st Choice')
                                                  : (survey as any).vacancyOpenedChoice === '2nd' ? (isRtl ? 'الرغبة الثانية' : '2nd Choice')
                                                  : (survey as any).vacancyOpenedChoice === '3rd' ? (isRtl ? 'الرغبة الثالثة' : '3rd Choice')
                                                  : (isRtl ? 'مدرسة بديلة قريبة' : 'Alternative School')
                                                })` : ''}
                                              </span>
                                            </div>
                                          )}

                                          {(survey as any).vacancyOpenReason && (
                                            <div className="text-xs font-semibold p-2.5 rounded-xl bg-white/70 dark:bg-black/20 border border-emerald-200 dark:border-emerald-900">
                                              <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">{isRtl ? '💡 سبب وتوضيح التخطيط المدرسي لولي الأمر:' : '💡 Planning Explanation:'}</span>
                                              <p className="leading-relaxed">{(survey as any).vacancyOpenReason}</p>
                                            </div>
                                          )}

                                          {((survey as any).previousSchoolName || (survey as any).vacancyRerouteReason) && (
                                            <div className="text-xs font-semibold p-2.5 rounded-xl bg-indigo-50/80 dark:bg-black/30 border border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200 space-y-1">
                                              <span className="font-bold text-indigo-800 dark:text-indigo-300 block mb-0.5">
                                                🔀 {isRtl ? 'بيانات التسكين والمدرسة البديلة:' : 'Alternative School Placement Info:'}
                                              </span>
                                              <p>
                                                {isRtl ? `المدرسة السابقة: ${(survey as any).previousSchoolName || 'المدرسة الأولى'} ⬅️ المدرسة الحالية المعينة: ${survey.schoolName}` : `Previous: ${(survey as any).previousSchoolName} ⬅️ Current: ${survey.schoolName}`}
                                              </p>
                                              {(survey as any).vacancyRerouteReason && (
                                                <p className="font-extrabold text-indigo-800 dark:text-indigo-300 bg-white/70 dark:bg-black/40 p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900 mt-1">
                                                  💡 {isRtl ? `سبب تغيير المدرسة: ${(survey as any).vacancyRerouteReason}` : `Reason for school change: ${(survey as any).vacancyRerouteReason}`}
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      <div className="p-3.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs shadow-xs flex items-center gap-3">
                                        <Clock className="w-5 h-5 shrink-0 text-slate-900" />
                                        <span className="leading-relaxed">
                                          {isRtl 
                                            ? '⚡ تأكيد وتوجيه عاجل لولي الأمر: يرجى المبادرة وسرعة مراجعة إدارة المدرسة المسكن بها الطالب/ة لاستكمال باقي إجراءات القيد والتثبيت الفعلي بالفصول.'
                                            : '⚡ Important Note: Please quickly visit the school administration to finalize enrollment procedures.'}
                                        </span>
                                      </div>

                                      {(survey as any).staffingNote && (
                                        <div className="text-[11px] bg-slate-50 dark:bg-black/20 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold">
                                          📌 {isRtl ? `ملاحظة التسكين الميداني: ${(survey as any).staffingNote}` : `Placement Note: ${(survey as any).staffingNote}`}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              }

                            // 2 & 3. Sent to school principal or returned by principal for vacancy study
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
                          })()}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* No Matching Results Found */
                  <div className={`p-8 text-center border border-dashed rounded-3xl ${
                    isDark ? 'border-teal-800/30 bg-[#092233]/50' : 'border-slate-200 bg-white'
                  }`}>
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                    <h4 className={`font-extrabold text-sm ${isDark ? 'text-teal-300' : 'text-slate-800'}`}>
                      {isRtl ? 'لا يوجد طلب مسجل باسم ولي الأمر المطابق' : 'No requests found for this exact guardian name'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                      {isRtl 
                        ? 'يرجى كتابة اسم ولي الأمر (المستفيد) تماماً كما تم مدوّناً عند تقديم الطلب (مثال: فيصل محمد الترجمي).' 
                        : 'Please type the guardian full name exactly as entered during submission.'}
                    </p>
                  </div>
                )
              ) : (
                /* Prompt before typing search */
                <div className={`p-10 text-center border border-dashed rounded-3xl ${
                  isDark ? 'border-teal-800/30 bg-[#092233]/30' : 'border-slate-200 bg-slate-50/50'
                }`}>
                  <User className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <h4 className={`font-bold text-sm ${isDark ? 'text-teal-300' : 'text-slate-500'}`}>
                    {isRtl ? 'أدخل اسم ولي الأمر بالكامل لتتبع الطلب' : 'Enter full guardian name to track request'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    {isRtl 
                      ? 'اكتب اسم ولي الأمر كما قمت بإدخاله تماماً عند تقديم الطلب لعرض تفاصيل المعاملة والتقييم.' 
                      : 'Type the guardian name exactly as entered during submission to view request details.'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 2: PRINCIPAL LOGIN SCREEN */}
        {view === 'principal-login' && (
          <motion.div
            key="principal-login-form"
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="max-w-md mx-auto"
          >
            {/* Back Button */}
            <button
              onClick={() => {
                setView('selection');
                setLoginError('');
              }}
              className={`mb-6 flex items-center gap-2 text-sm font-bold transition-all cursor-pointer ${
                isDark ? 'text-teal-400 hover:text-teal-300' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{t.goBackPortal}</span>
            </button>

            {/* Login Card */}
            <div className={`border rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden ${
              isDark ? 'glass-card-dark' : 'bg-white border-slate-200'
            }`}>
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#218caa] via-[#2883a4] to-[#3078a6]" />
              
              <div className="text-center space-y-2">
                <div className={`inline-flex items-center justify-center p-3 rounded-2xl mb-1 ${
                  isDark ? 'glass-icon-container glass-icon-dark-emerald' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <School className="w-6 h-6" />
                </div>
                <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {principalAuthMode === 'login'
                    ? (isRtl ? 'تسجيل دخول مدير المدرسة' : 'School Principal Login')
                    : (isRtl ? 'تسجيل جديد لمدير المدرسة' : 'New School Principal Registration')}
                </h2>
                <p className={`text-xs font-semibold leading-relaxed px-4 ${isDark ? 'text-teal-300' : 'text-slate-500'}`}>
                  {principalAuthMode === 'login'
                    ? (isRtl ? 'الرجاء إدخال اسم المدرسة والرقم السري للمتابعة' : 'Enter school name and password to continue')
                    : (isRtl ? 'سجل حساب مدرسة جديد لمتابعة البلاغات والطلبات' : 'Register a new school to track reports and requests')}
                </p>
              </div>

              {/* Toggle tabs for login / registration */}
              <div className={`p-1 rounded-2xl flex items-center border ${
                isDark ? 'bg-[#0b2336] border-teal-800/45' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setPrincipalAuthMode('login');
                    setLoginError('');
                  }}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    principalAuthMode === 'login'
                      ? isDark
                        ? 'bg-[#218caa] text-white shadow-lg'
                        : 'bg-white text-emerald-700 shadow-sm border border-slate-200/50'
                      : isDark
                        ? 'text-teal-400 hover:text-teal-300'
                        : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{isRtl ? '🔑 تسجيل دخول' : '🔑 Sign In'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrincipalAuthMode('register');
                    setLoginError('');
                  }}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    principalAuthMode === 'register'
                      ? isDark
                        ? 'bg-[#218caa] text-white shadow-lg'
                        : 'bg-white text-emerald-700 shadow-sm border border-slate-200/50'
                      : isDark
                        ? 'text-teal-400 hover:text-teal-300'
                        : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{isRtl ? '📝 تسجيل جديد' : '📝 Register'}</span>
                </button>
              </div>

              {loginError && (
                <div className={`border rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2 ${
                  isDark ? 'bg-rose-950/30 border-rose-800/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handlePrincipalLogin} className="space-y-4">
                
                {/* 1. اسم المدرسة - اختيار واستدعاء البيانات التلقائي من السجل المرفق */}
                <div className="space-y-1.5" id="form-group-school-name">
                  <SchoolSelectDropdown
                    schools={activeSchools}
                    value={schoolName}
                    onChange={(name, code, schoolObj) => {
                      setSchoolName(name);
                      
                      // Auto-retrieve school object from activeSchools dataset
                      const matched = schoolObj || activeSchools.find(s => 
                        s.nameAr.trim().toLowerCase() === name.trim().toLowerCase() ||
                        (code && (s.ministryCode === code || (s as any).code === code))
                      );

                      if (matched) {
                        setSelectedSchoolData(matched);
                        const c = matched.ministryCode || (matched as any).code || '45013';
                        setSchoolCode(c);

                        // Auto-retrieve principal name from file / customFields or generated default
                        const retrievedName = (matched as any).principalName || 
                          matched.customFields?.['اسم مدير المدرسة'] || 
                          matched.customFields?.['اسم مدير/ة المدرسة'] || 
                          matched.customFields?.['اسم المدير'] || 
                          matched.customFields?.['المدير'] || 
                          `أ. مدير ${matched.nameAr}`;
                        setPrincipalName(retrievedName);

                        // Auto-retrieve principal mobile from file / customFields or generated default
                        const retrievedMobile = (matched as any).principalMobile || 
                          (matched as any).mobile || 
                          matched.customFields?.['رقم الجوال'] || 
                          matched.customFields?.['الجوال'] || 
                          `055${(c + '0000000').slice(0, 7)}`;
                        setPrincipalMobile(retrievedMobile);
                      } else {
                        setSelectedSchoolData(null);
                        if (code) setSchoolCode(code);
                      }
                      
                      // Reset confirmation state and passwords on changing school selection
                      setIsSchoolDataConfirmed(false);
                      setPassword('');
                      setConfirmPassword('');
                      setEnteredCivilId('');
                      setCivilIdErrorMsg('');
                    }}
                    label={principalAuthMode === 'register'
                      ? (isRtl ? '1. اسم المدرسة (اختر لاستدعاء السجل رسمياً من الملف)' : '1. Select School (Fetches record automatically)')
                      : (isRtl ? 'اسم المدرسة (البحث الذكي عالي التحسس)' : 'School Name')}
                    required
                    isDark={isDark}
                    isRtl={isRtl}
                    placeholder={isRtl ? '🔍 اكتب اسم المدرسة أو الرقم الوزاري للفرز الفوري...' : 'Type school name or ministerial code...'}
                    helperText={principalAuthMode === 'register'
                      ? (isRtl ? '⚡ بمجرد كتابة وتحديد المدرسة، يستدعي النظام تلقائياً كافة بياناتها من الملف المرفق في التطبيق لمراجعتها وتأكيدها.' : 'Automatically fetches official school metadata upon selection.')
                      : (isRtl ? '⚡ قائمة منسدلة ذكية تتأثر مباشرة بحالة تحسس الأحرف للبحث السريع عن كافة مدارس المنطقة.' : 'Smart dropdown search.')}
                  />
                </div>

                {/* LOGIN MODE ONLY FIELDS */}
                {principalAuthMode === 'login' && (
                  <div className="space-y-1.5" id="form-group-login-password">
                    <div className="flex items-center justify-between">
                      <label className={`block text-xs font-extrabold ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                        {isRtl ? 'الرقم السري' : 'Secret Key / Password'} <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setPrincipalAuthMode('forgot_password');
                          setPrincipalForgotStep(1);
                          setLoginError('');
                          setPrincipalForgotSuccessMsg('');
                        }}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline cursor-pointer"
                      >
                        {isRtl ? '🔑 نسيت كلمة المرور؟' : 'Forgot Password?'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isRtl ? 'أدخل الرقم السري...' : 'Enter secret key...'}
                        className={`w-full px-4 py-3 text-sm font-medium rounded-xl outline-none transition-all focus:ring-2 ${
                          isDark
                            ? 'bg-[#0b2336] border-teal-800/50 text-white focus:border-emerald-400 focus:bg-[#061c24] focus:ring-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-100'
                        }`}
                        required
                        id="principal-login-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* FORGOT PASSWORD MODE FOR PRINCIPAL */}
                {principalAuthMode === 'forgot_password' && (
                  <div className="space-y-4 pt-1">
                    {principalForgotSuccessMsg && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 text-xs font-bold">
                        {principalForgotSuccessMsg}
                      </div>
                    )}

                    {principalForgotStep === 1 ? (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-teal-950/30 border-teal-800/40' : 'bg-slate-50 border-slate-200'}`}>
                          <h4 className={`text-xs font-black mb-1 ${isDark ? 'text-teal-200' : 'text-slate-800'}`}>
                            {isRtl ? 'استرجاع كلمة المرور بحساب مدير المدرسة' : 'School Principal Password Recovery'}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-teal-300 leading-relaxed">
                            {isRtl
                              ? 'يرجى إدخال اسم المدرسة أو الرقم الوزاري لاستعادة كلمة المرور عبر كود التحقق الآمن.'
                              : 'Enter school name or code to recover password using verification code.'}
                          </p>
                        </div>

                        <div>
                          <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                            {isRtl ? 'اسم المدرسة أو الرقم الوزاري' : 'School Name or Code'}
                          </label>
                          <input
                            type="text"
                            value={principalForgotQuery}
                            onChange={(e) => setPrincipalForgotQuery(e.target.value)}
                            placeholder={isRtl ? 'مثال: مدرسة أحد الابتدائية أو 45013' : 'e.g. Ohod School or 45013'}
                            className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none transition-all ${
                              isDark ? 'bg-[#0b2336] border-teal-800/50 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const query = principalForgotQuery.trim().toLowerCase();
                            if (!query) {
                              setLoginError(isRtl ? 'الرجاء كتابة اسم المدرسة أو الرقم الوزاري' : 'Please enter school name or code');
                              return;
                            }

                            // Search registered principals
                            let regs: any[] = [];
                            try {
                              const raw = localStorage.getItem('registered_principals_v1');
                              if (raw) regs = JSON.parse(raw);
                            } catch {}

                            const found = regs.find(r => 
                              r.schoolName.trim().toLowerCase().includes(query) ||
                              (r.schoolCode && r.schoolCode.toLowerCase() === query)
                            ) || {
                              schoolName: principalForgotQuery.trim(),
                              schoolCode: '45013',
                              principalName: 'مدير المدرسة',
                              mobile: '0550000000'
                            };

                            const code = Math.floor(100000 + Math.random() * 900000).toString();
                            setPrincipalForgotGenCode(code);
                            setPrincipalForgotFoundAccount(found);
                            setPrincipalForgotStep(2);
                            setLoginError('');
                            alert(isRtl ? `🔒 كود التحقق لاسترجاع كلمة مرور مدير المدرسة (${found.schoolName}): ${code}` : `Recovery code: ${code}`);
                          }}
                          className="w-full py-3 bg-[#218caa] hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          {isRtl ? 'إرسال كود التحقق لاسترجاع كلمة المرور' : 'Send Verification Code'}
                        </button>
                      </div>
                    ) : (
                      /* STEP 2: Enter Code & Set New Password */
                      <div className="space-y-4">
                        <div className={`p-3 rounded-xl border text-xs font-bold ${isDark ? 'bg-teal-900/30 border-teal-800/40 text-teal-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                          {isRtl ? `تم توليد كود التأكيد للحساب: ${principalForgotFoundAccount?.schoolName}` : `Verification code generated for ${principalForgotFoundAccount?.schoolName}`}
                        </div>

                        <div>
                          <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                            {isRtl ? 'كود التحقق المرسل (6 أرقام)' : 'Verification Code'}
                          </label>
                          <input
                            type="text"
                            value={principalForgotEnteredCode}
                            onChange={(e) => setPrincipalForgotEnteredCode(e.target.value)}
                            placeholder="123456"
                            className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono font-bold text-center tracking-widest ${
                              isDark ? 'bg-[#0b2336] border-teal-800/50 text-teal-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          />
                        </div>

                        <div>
                          <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                            {isRtl ? 'كلمة المرور الجديدة (أحرف وأرقام)' : 'New Password (Letters & Digits)'}
                          </label>
                          <input
                            type="password"
                            value={principalForgotNewPwd}
                            onChange={(e) => setPrincipalForgotNewPwd(e.target.value)}
                            placeholder="S123456"
                            className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold ${
                              isDark ? 'bg-[#0b2336] border-teal-800/50 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          />
                        </div>

                        <div>
                          <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                            {isRtl ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                          </label>
                          <input
                            type="password"
                            value={principalForgotConfirmPwd}
                            onChange={(e) => setPrincipalForgotConfirmPwd(e.target.value)}
                            placeholder="S123456"
                            className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold ${
                              isDark ? 'bg-[#0b2336] border-teal-800/50 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (principalForgotEnteredCode.trim() !== principalForgotGenCode) {
                                setLoginError(isRtl ? 'كود التحقق غير صحيح!' : 'Invalid code!');
                                return;
                              }
                              if (!principalForgotNewPwd.trim()) {
                                setLoginError(isRtl ? 'الرجاء إدخال كلمة المرور الجديدة' : 'Please enter new password');
                                return;
                              }
                              if (principalForgotNewPwd !== principalForgotConfirmPwd) {
                                setLoginError(isRtl ? 'كلمتا المرور غير متطابقتين!' : 'Passwords do not match!');
                                return;
                              }
                              const hasLetters = /[a-zA-Z\u0600-\u06FF]/.test(principalForgotNewPwd);
                              const hasDigits = /[0-9]/.test(principalForgotNewPwd);
                              if (!hasLetters || !hasDigits) {
                                setLoginError(isRtl ? 'يجب أن تحتوي كلمة المرور على أحرف وأرقام معاً (مثل S123456)' : 'Password must contain letters and digits');
                                return;
                              }

                              // Update persisted record
                              try {
                                const raw = localStorage.getItem('registered_principals_v1');
                                const regs = raw ? JSON.parse(raw) : [];
                                const targetIdx = regs.findIndex((r: any) => 
                                  r.schoolName.trim().toLowerCase() === principalForgotFoundAccount.schoolName.trim().toLowerCase()
                                );
                                if (targetIdx !== -1) {
                                  regs[targetIdx].password = principalForgotNewPwd.trim();
                                } else {
                                  regs.push({
                                    ...principalForgotFoundAccount,
                                    password: principalForgotNewPwd.trim()
                                  });
                                }
                                localStorage.setItem('registered_principals_v1', JSON.stringify(regs));
                              } catch {}

                              setPassword(principalForgotNewPwd.trim());
                              setSchoolName(principalForgotFoundAccount.schoolName);
                              setPrincipalForgotSuccessMsg(isRtl ? '✅ تم استرجاع وتحديث كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.' : 'Password reset successfully!');
                              setPrincipalAuthMode('login');
                              setLoginError('');
                            }}
                            className="flex-1 py-3 bg-[#218caa] hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                          >
                            {isRtl ? 'تأكيد واسترجاع كلمة المرور' : 'Confirm Password Reset'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPrincipalAuthMode('login');
                              setLoginError('');
                            }}
                            className={`px-4 py-3 rounded-xl border text-xs font-bold ${
                              isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {isRtl ? 'إلغاء' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* REGISTER MODE: AUTOMATIC RETRIEVAL, DATA CONFIRMATION CARD, AND PASSWORD UNLOCK */}
                {principalAuthMode === 'register' && (
                  <div className="space-y-4 pt-1">
                    
                    {/* 2. بطاقة مراجعة وتأكيد بيانات المدرسة المستدعاة تلقائياً من الملف */}
                    {(selectedSchoolData || schoolName) ? (
                      <div className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 ${
                        isDark ? 'bg-[#092538] border-teal-800/60 shadow-lg' : 'bg-slate-50/90 border-slate-200 shadow-sm'
                      }`}>
                        <div className="flex items-center justify-between border-b pb-2.5 dark:border-teal-800/30">
                          <div className="flex items-center gap-2">
                            <Building2 className={`w-4 h-4 ${isDark ? 'text-teal-300' : 'text-slate-700'}`} />
                            <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {isRtl ? 'بيانات السجل الرسمي المستدعاة تلقائياً من الملف' : 'Auto-Fetched Official School Record'}
                            </span>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isDark ? 'bg-teal-950 text-teal-300 border border-teal-800/40' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isRtl ? 'مستدعى من السجل' : 'Fetched from File'}
                          </span>
                        </div>

                        {/* Grid of Official Auto-Retrieved Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#092233] border-teal-800/30' : 'bg-white border-slate-200/80'}`}>
                            <span className="block text-[10px] font-extrabold text-slate-400">{isRtl ? 'الرقم الوزاري المعتمد:' : 'Ministerial Code:'}</span>
                            <span className={`font-black font-mono ${isDark ? 'text-teal-200' : 'text-slate-800'}`}>
                              #{schoolCode || selectedSchoolData?.ministryCode || (selectedSchoolData as any)?.code || '45013'}
                            </span>
                          </div>

                          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#092233] border-teal-800/30' : 'bg-white border-slate-200/80'}`}>
                            <span className="block text-[10px] font-extrabold text-slate-400">{isRtl ? 'اسم مدير/ة المدرسة:' : 'Principal Name:'}</span>
                            <span className={`font-black truncate block ${isDark ? 'text-teal-200' : 'text-slate-800'}`}>
                              {principalName || (isRtl ? 'أ. مدير المدرسة' : 'Principal')}
                            </span>
                          </div>

                          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#092233] border-teal-800/30' : 'bg-white border-slate-200/80'}`}>
                            <span className="block text-[10px] font-extrabold text-slate-400">{isRtl ? 'رقم الجوال:' : 'Mobile Number:'}</span>
                            <span className={`font-black font-mono ${isDark ? 'text-teal-200' : 'text-slate-800'}`}>
                              {principalMobile || '0550000000'}
                            </span>
                          </div>

                          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#092233] border-teal-800/30' : 'bg-white border-slate-200/80'}`}>
                            <span className="block text-[10px] font-extrabold text-slate-400">{isRtl ? 'المرحلة والقطاع:' : 'Stage & District:'}</span>
                            <span className={`font-black truncate block ${isDark ? 'text-teal-200' : 'text-slate-800'}`}>
                              {selectedSchoolData?.stage || 'جميع المراحل'} - {selectedSchoolData?.district || 'المدينة'}
                            </span>
                          </div>
                        </div>

                        {/* Confirmation Button, Civil ID Input, or Status Badge */}
                        {!isSchoolDataConfirmed ? (
                          <div className="pt-2 space-y-3 border-t dark:border-teal-800/30">
                            
                            {/* Hidden Password / Civil Registry Input Field with Icon */}
                            <div className="space-y-1.5" id="form-group-civil-id">
                              <div className="flex items-center justify-between">
                                <label className={`block text-xs font-black flex items-center gap-1.5 ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                                  <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                                  <span>{isRtl ? 'كلمة السر المخفية للتحقق (رقم السجل المدني للمدير):' : 'Hidden Secret Password (Civil Registry ID):'}</span>
                                  <span className="text-rose-500">*</span>
                                </label>
                              </div>
                              <div className="relative">
                                <Lock className="absolute top-3.5 right-3.5 w-4 h-4 text-slate-400" />
                                <input
                                  type="password"
                                  value={enteredCivilId}
                                  onChange={(e) => {
                                    setEnteredCivilId(e.target.value);
                                    setCivilIdErrorMsg('');
                                    setLoginError('');
                                  }}
                                  placeholder={isRtl ? 'أدخل كلمة السر المخفية / السجل المدني...' : 'Enter hidden secret password (Civil ID)...'}
                                  className={`w-full pr-10 pl-4 py-2.5 text-xs font-mono font-bold rounded-xl outline-none transition-all border ${
                                    civilIdErrorMsg
                                      ? 'border-rose-500 bg-rose-50/70 text-rose-900 focus:ring-2 focus:ring-rose-200'
                                      : isDark
                                      ? 'bg-[#092233] border-teal-800/60 text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-950'
                                      : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100'
                                  }`}
                                />
                              </div>

                              {/* Explicit Error Message */}
                              {civilIdErrorMsg && (
                                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-black flex items-center gap-2">
                                  <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                                  <span>{civilIdErrorMsg}</span>
                                </div>
                              )}
                            </div>

                            <div className={`p-2.5 rounded-xl border text-[11px] font-bold flex items-center gap-2 ${
                              isDark ? 'bg-amber-950/30 border-amber-800/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}>
                              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                              <span>{isRtl ? 'السجل المدني هو كلمة السر المخفية للتحقق من هويتك كمدير مدرسة والمطابقة مع الملف الرسمي.' : 'The Civil ID acts as the secret hidden password to verify your principal identity.'}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const trimmedCivilId = enteredCivilId.trim();
                                if (!trimmedCivilId) {
                                  setCivilIdErrorMsg(isRtl ? '❌ كلمة السر المخفية / السجل المدني مطلوبة، يرجى الإدخال' : '❌ Secret password required');
                                  setLoginError(isRtl ? 'كلمة السر المخفية غير صحيحة' : 'Incorrect secret');
                                  setIsSchoolDataConfirmed(false);
                                  return;
                                }

                                const schoolObjToUse = selectedSchoolData || activeSchools.find(s => 
                                  (schoolCode && (s.ministryCode === schoolCode || (s as any).code === schoolCode)) || 
                                  (schoolName && s.nameAr.trim().toLowerCase() === schoolName.trim().toLowerCase())
                                );

                                const { isMatch, expectedId, wasFoundInFile } = verifyCivilIdMatch(trimmedCivilId, schoolObjToUse, schoolCode);

                                if (!isMatch) {
                                  setIsSchoolDataConfirmed(false);
                                  const errMsg = wasFoundInFile 
                                    ? (isRtl 
                                        ? `❌ السجل المدني المدخل (${trimmedCivilId}) غير مطابق للسجل المسجل للمدرسة في الملف المرفوع. يرجى التأكد وإعادة المحاولة.` 
                                        : `❌ Civil ID (${trimmedCivilId}) does not match the record in the uploaded file.`)
                                    : (isRtl 
                                        ? `❌ السجل المدني المدخل غير صحيح. يرجى إدخال 10 أرقام تبدأ بـ 1 أو 2.` 
                                        : `❌ Incorrect Civil ID format. Please enter a 10-digit ID.`);
                                  setCivilIdErrorMsg(errMsg);
                                  setLoginError(isRtl ? 'كلمة السر المخفية غير صحيحة' : 'Incorrect secret password');
                                  return;
                                }

                                // Matched! Unlock setting password
                                setIsSchoolDataConfirmed(true);
                                setCivilIdErrorMsg('');
                                setLoginError('');
                                const codeToUse = schoolObjToUse?.ministryCode || (schoolObjToUse as any)?.code || schoolCode;
                                if (codeToUse) setSchoolCode(codeToUse);
                              }}
                              className="w-full py-3 px-4 bg-[#218caa] hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>{isRtl ? '✅ التحقق من كلمة السر المخفية وتأكيد قبول التسجيل' : 'Verify Hidden Secret Password & Confirm Registration'}</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2 text-xs font-black">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{isRtl ? '✓ تم القبول وتأكيد صحة كلمة السر المخفية للمدير' : '✓ Verified and confirmed'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsSchoolDataConfirmed(false)}
                              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-teal-300 underline cursor-pointer shrink-0"
                            >
                              {isRtl ? 'تغيير / إعادة التحقق' : 'Change'}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`p-4 rounded-2xl border border-dashed text-center space-y-1.5 ${
                        isDark ? 'border-teal-800/40 bg-[#092233]/30' : 'border-slate-300 bg-slate-50'
                      }`}>
                        <Building2 className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="text-xs font-black text-slate-500 dark:text-teal-300">
                          {isRtl ? 'يرجى كتابة واختيار اسم المدرسة أعلاه أولاً' : 'Select school name above first'}
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          {isRtl ? 'سيتم استدعاء الرقم الوزاري واسم المدير ورقم الجوال رسمياً من الملف المرفق لتأكيدها' : 'Official details will be fetched automatically.'}
                        </p>
                      </div>
                    )}

                    {/* 3. إدخال وتكرار الرقم السري فقط (تُفتح فقط بعد تأكيد البيانات) */}
                    {isSchoolDataConfirmed ? (
                      <div className="space-y-3.5 pt-2 border-t dark:border-teal-800/30">
                        <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                          isDark ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{isRtl ? 'خطوة تعيين كلمة المرور: أدخل الرقم السري المكون من أحرف وأرقام ثم أكرره:' : 'Final step: Set password containing letters & numbers and confirm it:'}</span>
                        </div>

                        {/* ملخص البيانات المستدماة المعتمدة */}
                        <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          isDark ? 'bg-[#092233] border-teal-800/40 text-teal-200' : 'bg-slate-100/80 border-slate-200 text-slate-700'
                        }`}>
                          <div className="flex justify-between items-center text-[11px] font-black border-b pb-1 dark:border-teal-800/30">
                            <span>{isRtl ? 'الرقم الوزاري المعتمد:' : 'Code:'} <strong className="text-emerald-500 font-mono">#{schoolCode}</strong></span>
                            <span>{isRtl ? 'الجوال:' : 'Mobile:'} <strong className="font-mono">{principalMobile}</strong></span>
                          </div>
                          <div className="text-[11px] font-black truncate">
                            {isRtl ? 'مدير/ة المدرسة:' : 'Principal:'} <strong className="text-slate-900 dark:text-white">{principalName}</strong>
                          </div>
                        </div>

                        {/* إدخال الرقم السري */}
                        <div className="space-y-1.5" id="form-group-password">
                          <label className={`block text-xs font-extrabold ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                            {isRtl ? 'إدخال الرقم السري (أحرف وأرقام)' : 'Set Password (Letters & Numbers)'} <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="absolute top-3.5 right-3.5 w-4 h-4 text-slate-400" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder={isRtl ? 'مثال: S123456 أو M2026...' : 'e.g. S123456 or M2026...'}
                              className={`w-full pr-10 pl-12 py-3 text-sm font-medium rounded-xl outline-none transition-all focus:ring-2 ${
                                isDark
                                  ? 'bg-[#0b2336] border-teal-800/50 text-white focus:border-emerald-400 focus:bg-[#061c24] focus:ring-emerald-950'
                                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-100'
                              }`}
                              required
                              id="principal-reg-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                            <Sparkles className="w-3 h-3 shrink-0" />
                            <span>{isRtl ? 'شرط كلمة المرور: يجب أن تتضمن أرقاماً وأحرفاً معاً (مثل S123456).' : 'Password must include both letters and digits.'}</span>
                          </p>
                        </div>

                        {/* تكرار الرقم السري */}
                        <div className="space-y-1.5" id="form-group-confirm-password">
                          <label className={`block text-xs font-extrabold ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                            {isRtl ? 'تكرار الرقم السري (تأكيد)' : 'Repeat Password'} <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="absolute top-3.5 right-3.5 w-4 h-4 text-slate-400" />
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder={isRtl ? 'أعد كتابة الرقم السري للتأكيد...' : 'Confirm password...'}
                              className={`w-full pr-10 pl-12 py-3 text-sm font-medium rounded-xl outline-none transition-all focus:ring-2 ${
                                isDark
                                  ? 'bg-[#0b2336] border-teal-800/50 text-white focus:border-emerald-400 focus:bg-[#061c24] focus:ring-emerald-950'
                                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-100'
                              }`}
                              required
                              id="principal-reg-confirm-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {confirmPassword && password !== confirmPassword && (
                            <p className="text-[10px] font-black text-rose-500 flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{isRtl ? '⚠️ كلمتا المرور غير متطابقتين' : '⚠️ Passwords do not match'}</span>
                            </p>
                          )}
                          {confirmPassword && password === confirmPassword && (
                            <p className="text-[10px] font-black text-emerald-500 flex items-center gap-1 mt-1">
                              <CheckCircle className="w-3 h-3 shrink-0" />
                              <span>{isRtl ? '✓ كلمتا المرور متطابقتان' : '✓ Passwords match'}</span>
                            </p>
                          )}
                        </div>

                      </div>
                    ) : (
                      /* Locked prompt when school data hasn't been confirmed yet */
                      <div className={`p-4 rounded-2xl border border-dashed text-center space-y-1.5 ${
                        isDark ? 'border-teal-800/40 bg-[#092233]/30' : 'border-slate-300 bg-slate-50/70'
                      }`}>
                        <Lock className="w-5 h-5 text-slate-400 mx-auto" />
                        <h4 className={`text-xs font-black ${isDark ? 'text-teal-200' : 'text-slate-700'}`}>
                          {isRtl ? 'حقول تعيين الرقم السري مغلقة حالياً' : 'Password fields locked'}
                        </h4>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                          {isRtl 
                            ? 'الرجاء اختيار المدرسة والنقر على زر "تأكيد صحة بيانات المدرسة" أعلاه لاستدعاء السجل وفتح تعيين الرقم السري وتكراره.' 
                            : 'Confirm school data above to unlock password entry.'}
                        </p>
                      </div>
                    )}

                  </div>
                )}

                <button
                  type="submit"
                  disabled={principalAuthMode === 'register' && !isSchoolDataConfirmed}
                  className={`w-full py-3.5 text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 shadow-md ${
                    principalAuthMode === 'register' && !isSchoolDataConfirmed
                      ? 'opacity-50 cursor-not-allowed bg-slate-400'
                      : isDark
                        ? 'bg-gradient-to-r from-[#218caa] via-[#2883a4] to-[#3078a6] hover:brightness-110 shadow-[#0b2336]/50'
                        : 'bg-gradient-to-r from-[#218caa] to-[#3078a6] hover:brightness-105 shadow-[#218caa]/20'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {principalAuthMode === 'login'
                      ? (isRtl ? 'تسجيل دخول' : 'Sign In')
                      : (isRtl ? '🔒 إنهاء التسجيل والبدء' : 'Register & Start')}
                  </span>
                </button>

              </form>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: DEDICATED SCHOOL PRINCIPAL DASHBOARD */}
        {view === 'principal-dashboard' && principalSession && (
          <motion.div
            key="principal-dashboard"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            {/* Header / Welcome Banner */}
            <div className={`p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border transition-all ${
              isDark
                ? 'bg-gradient-to-r from-[#0b2336] via-[#10304a] to-[#071927] text-white border-[#218caa]/40'
                : 'bg-gradient-to-r from-[#218caa] via-[#2883a4] to-[#3078a6] text-white border-[#3078a6]/20'
            }`}>
              {/* background design */}
              <div className="absolute right-0 bottom-0 top-0 w-80 bg-white/5 rounded-l-full blur-3xl" />
              
              <div className="space-y-3 relative z-10">
                <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs px-3.5 py-1 rounded-full font-bold border ${
                  isDark ? 'bg-teal-950/60 text-teal-300 border-teal-700/40' : 'bg-emerald-800/40 text-emerald-100 border-emerald-500/25'
                }`}>
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  {isRtl ? 'بوابة المدير المعتمدة والآمنة' : 'Verified Principal Portal'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                  {isRtl ? `مرحباً بك، أ. ${principalSession.principalName}` : `Welcome, Principal ${principalSession.principalName}`}
                </h1>
                <p className={`text-xs sm:text-sm max-w-xl font-medium ${isDark ? 'text-teal-200/90' : 'text-emerald-100/90'}`}>
                  {isRtl 
                    ? `تتابع الآن استبيانات أولياء الأمور وحل المشكلات لـ: ${principalSession.schoolName} (الرمز الوزاري: ${principalSession.schoolCode})`
                    : `You are monitoring feedback and solving problems for: ${principalSession.schoolName} (Code: ${principalSession.schoolCode})`}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0 relative z-10">
                <button
                  onClick={() => {
                    setView('selection');
                    setPrincipalSession(null);
                  }}
                  className={`px-4.5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                    isDark
                      ? 'bg-teal-950/50 hover:bg-teal-900/50 text-white border-teal-800/40'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>{t.goBackPortal}</span>
                </button>
              </div>
            </div>

            {/* School Stats Overview Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Stat 1: Total Surveys */}
              <div className={`p-6 rounded-2xl shadow-xs flex items-center gap-4 border ${
                isDark ? 'glass-card-dark' : 'bg-white border-slate-200'
              }`}>
                {/* Transparent glass design for the icon */}
                <div className={`glass-icon-container p-3.5 ${isDark ? 'glass-icon-dark-emerald' : 'glass-icon-light-emerald'}`}>
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <span className={`block text-xs font-bold ${isDark ? 'text-teal-400' : 'text-slate-400'}`}>{t.schoolTotalSurveys}</span>
                  <span className={`block text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{schoolStats.total}</span>
                </div>
              </div>

              {/* Stat 2: Avg Satisfaction */}
              <div className={`p-6 rounded-2xl shadow-xs flex items-center gap-4 border ${
                isDark ? 'glass-card-dark' : 'bg-white border-slate-200'
              }`}>
                {/* Transparent glass design for the icon */}
                <div className={`glass-icon-container p-3.5 ${isDark ? 'glass-icon-dark-indigo' : 'glass-icon-light-indigo'}`}>
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className={`block text-xs font-bold ${isDark ? 'text-teal-400' : 'text-slate-400'}`}>{t.schoolSatisfaction}</span>
                  <span className={`block text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {schoolStats.total > 0 ? `${schoolStats.avgSatisfaction} / 5` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Stat 3: Resolved Rate */}
              <div className={`p-6 rounded-2xl shadow-xs flex items-center gap-4 border ${
                isDark ? 'glass-card-dark' : 'bg-white border-slate-200'
              }`}>
                {/* Transparent glass design for the icon */}
                <div className={`glass-icon-container p-3.5 ${isDark ? 'glass-icon-dark-blue' : 'glass-icon-light-blue'}`}>
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className={`block text-xs font-bold ${isDark ? 'text-teal-400' : 'text-slate-400'}`}>{t.schoolResolvedPct}</span>
                  <span className={`block text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {schoolStats.total > 0 ? `${schoolStats.resolvedPct}%` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Stat 4: Pending complaints */}
              <div className={`p-6 rounded-2xl shadow-xs flex items-center gap-4 border relative ${
                isDark ? 'glass-card-dark' : 'bg-white border-slate-200'
              }`}>
                {/* Transparent glass design for the icon */}
                <div className={`glass-icon-container p-3.5 relative ${isDark ? 'glass-icon-dark-rose' : 'glass-icon-light-rose'}`}>
                  <Clock className="w-6 h-6" />
                  {schoolStats.pending > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
                </div>
                <div>
                  <span className={`block text-xs font-bold ${isDark ? 'text-teal-400' : 'text-slate-400'}`}>
                    {isRtl ? 'المشاكل المعلقة بالمدرسة' : 'Pending School Issues'}
                  </span>
                  <span className={`block text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{schoolStats.pending}</span>
                </div>
              </div>

            </div>

            {/* Principal Dashboard Navigation Sub-Tabs */}
            <div className={`flex flex-wrap gap-4 sm:gap-6 mb-6 border-b transition-colors ${isDark ? 'border-teal-800/20' : 'border-slate-200'}`}>
              <button
                onClick={() => {
                  setDashboardSubTab('placement-requests');
                  setIsReporting(false);
                }}
                className={`pb-3 text-sm font-extrabold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                  dashboardSubTab === 'placement-requests'
                    ? isDark
                      ? 'border-sky-400 text-sky-300 font-black'
                      : 'border-sky-600 text-sky-700 font-black'
                    : `border-transparent ${isDark ? 'text-teal-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`
                }`}
                id="portal-subtab-placement-requests"
              >
                <Building2 className={`w-4 h-4 ${isDark ? 'text-sky-300' : 'text-sky-600'}`} />
                <span>{isRtl ? 'طلبات التسكين المرسلة من وحدة القبول' : 'Placement Requests from Admissions'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                  isDark
                    ? 'bg-sky-950/60 text-sky-300 border-sky-800/40'
                    : 'bg-sky-50 text-sky-700 border-sky-100'
                }`}>
                  {admissionsPlacementRequests.length}
                </span>
                {admissionsPlacementRequests.filter(s => !s.principalConfirmedStaffing && s.vacancyRequestStatus !== 'staffing_confirmed' && s.vacancyRequestStatus !== 'executed').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </button>

              <button
                onClick={() => {
                  setDashboardSubTab('eq-placement-requests');
                  setIsReporting(false);
                }}
                className={`pb-3 text-sm font-extrabold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                  dashboardSubTab === 'eq-placement-requests'
                    ? isDark
                      ? 'border-purple-400 text-purple-300 font-black'
                      : 'border-purple-600 text-purple-700 font-black'
                    : `border-transparent ${isDark ? 'text-teal-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`
                }`}
                id="portal-subtab-eq-placement-requests"
              >
                <FileCheck2 className={`w-4 h-4 ${isDark ? 'text-purple-300' : 'text-purple-600'}`} />
                <span>{isRtl ? 'طلبات التسكين وفق المعادلات' : 'Placement Requests according to Equivalency'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                  isDark
                    ? 'bg-purple-950/60 text-purple-300 border-purple-800/40'
                    : 'bg-purple-50 text-purple-700 border-purple-100'
                }`}>
                  {equivalencyPlacementRequests.length}
                </span>
                {equivalencyPlacementRequests.filter(s => !s.principalConfirmedStaffing && s.vacancyRequestStatus !== 'staffing_confirmed' && s.vacancyRequestStatus !== 'executed').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </button>

              <button
                onClick={() => {
                  setDashboardSubTab('parents');
                  setIsReporting(false);
                }}
                className={`pb-3 text-sm font-extrabold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                  dashboardSubTab === 'parents'
                    ? isDark
                      ? 'border-teal-400 text-teal-300 font-black'
                      : 'border-emerald-600 text-emerald-700 font-black'
                    : `border-transparent ${isDark ? 'text-teal-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`
                }`}
                id="portal-subtab-parents"
              >
                <Users className={`w-4 h-4 ${isDark ? 'text-teal-300' : 'text-emerald-600'}`} />
                <span>{isRtl ? 'استبيانات أولياء الأمور' : 'Parent Inquiries & Surveys'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                  isDark
                    ? 'bg-teal-950/60 text-teal-300 border-teal-800/40'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                }`}>
                  {schoolSurveys.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setDashboardSubTab('principal-reports');
                  setIsReporting(false);
                }}
                className={`pb-3 text-sm font-extrabold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                  dashboardSubTab === 'principal-reports'
                    ? isDark
                      ? 'border-teal-400 text-teal-300 font-black'
                      : 'border-emerald-600 text-emerald-700 font-black'
                    : `border-transparent ${isDark ? 'text-teal-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`
                }`}
                id="portal-subtab-reports"
              >
                <School className={`w-4 h-4 ${isDark ? 'text-teal-300' : 'text-emerald-600'}`} />
                <span>{isRtl ? 'بلاغات المدرسة والحلول المقترحة' : 'School Reports & Solutions'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                  isDark
                    ? 'bg-teal-950/60 text-teal-300 border-teal-800/40'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                }`}>
                  {myReports.length}
                </span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* SUB-TAB 0: PLACEMENT REQUESTS FROM ADMISSIONS OR EQUIVALENCY */}
              {(dashboardSubTab === 'placement-requests' || dashboardSubTab === 'eq-placement-requests') && (
                <motion.div
                  key="placement-requests-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Section Header */}
                  <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDark ? 'bg-sky-950/20 border-sky-800/30' : 'bg-sky-50/60 border-sky-100'
                  }`}>
                    <div className="space-y-1">
                      <h2 className={`text-lg font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        <Building2 className={`w-5 h-5 ${isDark ? 'text-sky-300' : 'text-sky-600'}`} />
                        <span>{isRtl ? 'طلبات التسكين الواردة من وحدة القبول والتوجيه' : 'Incoming Placement Requests'}</span>
                      </h2>
                      <p className={`text-xs font-semibold ${isDark ? 'text-sky-200/80' : 'text-slate-500'}`}>
                        {isRtl 
                          ? 'اعتماد طلبات التسكين الميدانية المحالة لمدرستكم. بمجرد النقر على (اعتماد التسكين) تنتهي مرحلة الطلب وتظهر النتيجة مباشرة في حساب المستفيد للتقييم وتؤرشف المعاملة.' 
                          : 'Review and approve placement requests sent to your school. Confirming placement finalizes the request, updates beneficiary portal for rating, and archives it in reports.'}
                      </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className={`flex p-1 rounded-xl border shrink-0 ${
                      isDark ? 'bg-[#092538] border-teal-800/40' : 'bg-white border-slate-200'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setPlacementFilter('all')}
                        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                          placementFilter === 'all'
                            ? 'bg-sky-600 text-white shadow-xs'
                            : isDark ? 'text-teal-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {isRtl ? 'الكل' : 'All'} ({placementRequests.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlacementFilter('pending')}
                        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                          placementFilter === 'pending'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : isDark ? 'text-teal-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {isRtl ? 'بانتظار التسكين' : 'Pending'} ({placementRequests.filter(s => !s.principalConfirmedStaffing && s.vacancyRequestStatus !== 'staffing_confirmed' && s.vacancyRequestStatus !== 'executed').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlacementFilter('confirmed')}
                        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                          placementFilter === 'confirmed'
                            ? 'bg-[#218caa] text-white shadow-xs'
                            : isDark ? 'text-teal-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {isRtl ? 'تم التسكين' : 'Placed'} ({placementRequests.filter(s => s.principalConfirmedStaffing || s.vacancyRequestStatus === 'staffing_confirmed' || s.vacancyRequestStatus === 'executed').length})
                      </button>
                    </div>
                  </div>

                  {/* Placement Requests Grid */}
                  {displayedPlacementRequests.length === 0 ? (
                    <div className={`border rounded-2xl p-12 text-center font-medium space-y-2 ${
                      isDark ? 'glass-card-dark border-teal-800/25 text-teal-400/60' : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      <Building2 className="w-10 h-10 text-slate-300 mx-auto opacity-60" />
                      <p>{isRtl ? 'لا توجد طلبات تسكين مطابقة في هذا الفرز حالياً.' : 'No placement requests found matching this filter.'}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {displayedPlacementRequests.map((req) => {
                        const isConfirmed = req.principalConfirmedStaffing || req.vacancyRequestStatus === 'staffing_confirmed' || req.vacancyRequestStatus === 'executed';

                        return (
                          <motion.div
                            key={req.id}
                            layout
                            className={`border rounded-3xl p-6 transition-all flex flex-col justify-between space-y-5 relative overflow-hidden ${
                              isDark 
                                ? 'glass-card-dark border-teal-800/25' 
                                : isConfirmed ? 'bg-emerald-50/20 border-emerald-200 shadow-xs' : 'bg-white border-slate-200 shadow-md'
                            }`}
                          >
                            {/* Status Header Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 dark:border-teal-800/20">
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-md ${
                                  isDark ? 'bg-teal-950 text-teal-300' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  #{req.id}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1 ${
                                  isConfirmed 
                                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300'
                                }`}>
                                  {isConfirmed ? (
                                    <>
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                      <span>{isRtl ? 'تم التسكين وانتهت المرحلة' : 'Placed & Finalized'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                      <span>{isRtl ? 'بانتظار اعتماد التسكين' : 'Awaiting Placement Approval'}</span>
                                    </>
                                  )}
                                </span>
                              </div>

                              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {req.createdAt ? new Date(req.createdAt).toLocaleDateString('ar-SA') : ''}
                              </span>
                            </div>

                            {/* Student & Parent Info */}
                            <div className="space-y-3">
                              {(() => {
                                const reqType = getRequestTypeInfo(req, isRtl);
                                return (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border shadow-xs ${reqType.badgeClass}`}>
                                      <span>{reqType.icon}</span>
                                      <span>{reqType.label}</span>
                                      {reqType.subLabel && <span className="opacity-80 text-[11px] font-bold">({reqType.subLabel})</span>}
                                    </span>
                                  </div>
                                );
                              })()}

                              <div>
                                <span className="text-[11px] font-bold text-slate-400 block">{isRtl ? 'اسم الطالب / المستفيد:' : 'Beneficiary / Student Name:'}</span>
                                <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                  {req.beneficiaryName}
                                </h3>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#0a283c] border-teal-800/30' : 'bg-slate-50 border-slate-100'}`}>
                                  <span className="block text-[10px] font-extrabold text-slate-400">{isRtl ? 'المرحلة والصف:' : 'Stage & Grade:'}</span>
                                  <span className={`font-bold ${isDark ? 'text-teal-200' : 'text-slate-800'}`}>
                                    {req.stage} {req.grade ? `(${req.grade})` : ''}
                                  </span>
                                </div>

                                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#0a283c] border-teal-800/30' : 'bg-slate-50 border-slate-100'}`}>
                                  <span className="block text-[10px] font-extrabold text-slate-400">{isRtl ? 'الجنس والحي:' : 'Gender & Sector:'}</span>
                                  <span className={`font-bold ${isDark ? 'text-teal-200' : 'text-slate-800'}`}>
                                    {req.gender === 'girls' ? (isRtl ? 'طالبات' : 'Girls') : (isRtl ? 'بنين' : 'Boys')} - {req.neighborhood || req.sector || 'المدينة'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-teal-300/80">
                                <Phone className="w-3.5 h-3.5 text-amber-500" />
                                <span>{req.phoneNumber}</span>
                              </div>

                              {/* Admissions Referral Note Box */}
                              <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                                isDark ? 'bg-sky-950/20 border-sky-800/30 text-sky-200' : 'bg-sky-50/70 border-sky-100 text-sky-900'
                              }`}>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-extrabold flex items-center gap-1.5 text-sky-700 dark:text-sky-300">
                                    <Send className="w-3.5 h-3.5" />
                                    {isRtl ? 'إحالة وحدة القبول والتوجيه:' : 'Admissions Referral:'}
                                  </span>
                                  <span className="text-[10px] opacity-75 font-mono">
                                    {(req as any).referringOfficerName || 'إدارة القبول والتخطيط'}
                                  </span>
                                </div>
                                <p className="font-medium italic leading-relaxed">
                                  "{(req as any).referralNotes || req.notes || (isRtl ? 'طلب تسكين طالب بالفصول المدرسية بناء على الشواغر وحساب الطاقة الاستيعابية' : 'Placement referral request')}"
                                </p>
                              </div>
                            </div>

                            {/* Placement Execution Action Block */}
                            <div className="pt-3 border-t dark:border-teal-800/20 space-y-3">
                              {/* Principal Attachment Print & Purge Warning Notice */}
                              {req.transferAttachmentData ? (
                                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <p className="font-bold leading-relaxed">
                                      {isRtl
                                        ? 'تنبيه هام لمدير المدرسة: يرجى طباعة الإثباتات المرفقة وحفظها في ملف الطالب الورقي، حيث سيتم حذف كافة المرفقات نهائياً من النظام والسيرفر فور القبول والتسكين لتفريغ المساحة.'
                                        : 'Important Notice: Please print attached proofs and save in student paper file; they will be deleted permanently from system after placement confirmation to save storage.'}
                                    </p>
                                  </div>
                                  <div className="pt-1">
                                    <a
                                      href={req.transferAttachmentData}
                                      download={req.transferAttachmentName || 'transfer-proof'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                                    >
                                      <span>🖨️ طباعة / معاينة الإثبات المرفق ({req.transferAttachmentName || 'الملف المرفق'})</span>
                                    </a>
                                  </div>
                                </div>
                              ) : req.attachmentsPurgedByPrincipal ? (
                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-bold flex items-center gap-1.5">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>{isRtl ? 'تم طباعة الإثبات وحذف المرفق تلقائياً من النظام بعد التسكين لتفريغ المساحة.' : 'Attachment printed and purged from system.'}</span>
                                </div>
                              ) : null}

                              {!isConfirmed ? (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <label className={`block text-[11px] font-extrabold ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                                      {isRtl ? 'تحديد الفصل / ملاحظات التسكين الميدانية:' : 'Classroom / Placement Notes:'}
                                    </label>
                                    <input
                                      type="text"
                                      value={principalNotesMap[req.id] || ''}
                                      onChange={(e) => setPrincipalNotesMap({ ...principalNotesMap, [req.id]: e.target.value })}
                                      placeholder={isRtl ? 'مثال: تم التسكين بالفصل 2/أ - بالصف الثاني ابتدائي...' : 'e.g. Placed in Class 2/A...'}
                                      className={`w-full px-3.5 py-2 text-xs font-bold rounded-xl outline-none transition-all border ${
                                        isDark
                                          ? 'bg-[#071d2c] border-teal-800/50 text-white focus:border-emerald-400'
                                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
                                      }`}
                                    />
                                  </div>

                                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmPlacement(req)}
                                      className="flex-1 py-3 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-500 hover:scale-[1.01]"
                                    >
                                      <CheckCircle className="w-4 h-4 text-white" />
                                       <span>{isRtl ? 'اعتماد التسكين الميداني ✅' : 'Approve Placement ✅'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleReturnPlacement(req)}
                                      className="py-3 px-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-red-500 shadow-sm"
                                      title={isRtl ? 'إعادة الطلب لمسؤول القبول لعدم توفر شاغر فعلي بالمدرسة' : 'Return request due to no actual vacancy'}
                                    >
                                      <AlertTriangle className="w-4 h-4 text-white" />
                                      <span>{isRtl ? 'إعادة الطلب (تعذر التسكين/لا يوجد شاغر) 🚨' : 'Return Request (No Vacancy) 🚨'}</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span className="font-black text-xs">{isRtl ? '✅ تم التسكين ونُهيت مرحلة الطلب بنجاح' : '✅ Placed & Finalized Successfully'}</span>
                                  </div>
                                  {(req as any).staffingNote && (
                                    <p className="text-xs font-semibold">
                                      📌 {isRtl ? `ملاحظة التسكين: ${(req as any).staffingNote}` : `Note: ${(req as any).staffingNote}`}
                                    </p>
                                  )}
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-emerald-500/20 mt-1">
                                    <div className="text-[10px] font-bold">
                                      <span className="opacity-70 block">{isRtl ? 'المدرسة:' : 'School:'}</span>
                                      <span>{(req as any).staffingConfirmedSchoolName || req.schoolName}</span>
                                    </div>
                                    <div className="text-[10px] font-bold">
                                      <span className="opacity-70 block">{isRtl ? 'المرحلة:' : 'Stage:'}</span>
                                      <span>{(req as any).staffingConfirmedStage || req.stage}</span>
                                    </div>
                                    <div className="text-[10px] font-bold">
                                      <span className="opacity-70 block">{isRtl ? 'الصف:' : 'Grade:'}</span>
                                      <span>{(req as any).staffingConfirmedGrade || req.grade || '---'}</span>
                                    </div>
                                  </div>
                                  <div className="text-[10px] opacity-80 flex flex-wrap gap-3 font-mono pt-1.5 border-t border-emerald-500/10">
                                    {(req as any).staffingConfirmedBy && <span>{isRtl ? `المدير المعتمِد: ${(req as any).staffingConfirmedBy}` : `By: ${(req as any).staffingConfirmedBy}`}</span>}
                                    {(req as any).staffingConfirmedAt && <span>{new Date((req as any).staffingConfirmedAt).toLocaleString('ar-SA')}</span>}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
              {/* SUB-TAB 1: PARENT INQUIRIES & SURVEYS */}
              {dashboardSubTab === 'parents' && (
                <motion.div
                  key="parents-surveys-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-3 ${
                    isDark ? 'border-teal-800/25' : 'border-slate-100'
                  }`}>
                    <div className="space-y-1">
                      <h2 className={`text-lg font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        <MessageSquare className={`w-5 h-5 ${isDark ? 'text-teal-300' : 'text-emerald-600'}`} />
                        <span>{t.schoolSurveys}</span>
                      </h2>
                      <p className={`text-xs font-semibold ${isDark ? 'text-teal-400/80' : 'text-slate-400'}`}>
                        {isRtl 
                          ? 'مراجعة وتقييم طلبات أولياء الأمور لمعالجة المشاكل بنقرة واحدة وتثبيت الحلول' 
                          : 'Review parent requests to instantly resolve issues and document details'}
                      </p>
                    </div>

                    {/* Filters */}
                    <div className={`flex p-1 rounded-xl border self-start sm:self-auto shrink-0 ${
                      isDark ? 'bg-[#092538] border-teal-800/40' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <button
                        onClick={() => setPrincipalTab('all')}
                        className={`px-4.5 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                          principalTab === 'all'
                            ? isDark ? 'bg-teal-600 text-white shadow-sm' : 'bg-[#218caa] text-white shadow-sm'
                            : `${isDark ? 'text-teal-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`
                        }`}
                      >
                        {isRtl ? 'الكل' : 'All'} ({schoolSurveys.length})
                      </button>
                      <button
                        onClick={() => setPrincipalTab('pending')}
                        className={`px-4.5 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                          principalTab === 'pending'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : `${isDark ? 'text-teal-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`
                        }`}
                      >
                        {isRtl ? 'تحت المعالجة' : 'Pending'} ({schoolStats.pending})
                      </button>
                      <button
                        onClick={() => setPrincipalTab('resolved')}
                        className={`px-4.5 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                          principalTab === 'resolved'
                            ? isDark ? 'bg-teal-600 text-white shadow-sm' : 'bg-[#218caa] text-white shadow-sm'
                            : `${isDark ? 'text-teal-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`
                        }`}
                      >
                        {isRtl ? 'تم الحل' : 'Resolved'} ({schoolStats.resolved})
                      </button>
                    </div>
                  </div>

                  {/* Grid of parent submissions */}
                  {displayedSchoolSurveys.length === 0 ? (
                    <div className={`border rounded-2xl p-12 text-center font-medium space-y-2 ${
                      isDark ? 'glass-card-dark border-teal-800/25 text-teal-400/60' : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      <HelpCircle className="w-10 h-10 text-slate-300 mx-auto opacity-60" />
                      <p>{t.schoolNoData}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {displayedSchoolSurveys.map((survey) => {
                        const getProblemName = (pt: string) => {
                          if (pt === 'vacancies_unavailable') return t.probVacancies;
                          if (pt === 'student_density') return t.probDensity;
                          if (pt === 'unjustified_rejection') return t.probRejection;
                          if (pt === 'cert_primary_eq') return t.probPrimaryEq;
                          if (pt === 'cert_intermediate_eq') return t.probIntermediateEq;
                          if (pt === 'cert_secondary_eq') return t.probSecondaryEq;
                          if (pt === 'distance_from_school') return t.probDistance;
                          if (pt === 'unregistered_desire') return t.probUnregistered;
                          return t.probOther;
                        };

                        const getStageName = (stg: string) => {
                          if (stg === 'EarlyChildhood') return t.stageEarlyChildhood;
                          if (stg === 'Kindergarten') return t.stageKindergarten;
                          if (stg === 'Primary') return t.stagePrimary;
                          if (stg === 'Intermediate') return t.stageIntermediate;
                          return t.stageSecondary;
                        };

                        return (
                          <motion.div
                            key={survey.id}
                            layout
                            className={`border rounded-2xl p-6 transition-all flex flex-col justify-between space-y-4 ${
                              isDark
                                ? 'glass-card-dark border-teal-800/25 hover:shadow-teal-950/20'
                                : 'bg-white border-slate-200 shadow-xs hover:shadow-md'
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Header Block */}
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{survey.beneficiaryName}</h4>
                                  <p className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-teal-400/70' : 'text-slate-400'}`}>{survey.phoneNumber}</p>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  survey.isResolved 
                                    ? isDark
                                      ? 'bg-emerald-950/35 border border-emerald-800/30 text-emerald-300'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    : isDark
                                      ? 'bg-amber-950/35 border border-amber-800/30 text-amber-300'
                                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {survey.isResolved ? (
                                    <>
                                      <CheckCircle className="w-3 h-3" />
                                      <span>{t.yes}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3" />
                                      <span>{isRtl ? 'انتظار الحل' : 'Pending resolution'}</span>
                                    </>
                                  )}
                                </span>
                              </div>

                              {/* Problem badge & stage */}
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {(() => {
                                  const reqType = getRequestTypeInfo(survey, isRtl);
                                  return (
                                    <span className={`px-2.5 py-0.5 rounded-lg font-black text-[11px] border ${reqType.badgeClass}`}>
                                      {reqType.icon} {reqType.label} - {reqType.subLabel}
                                    </span>
                                  );
                                })()}
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  isDark ? 'bg-teal-950/60 text-teal-300 border border-teal-900' : 'bg-slate-100/80 text-slate-600'
                                }`}>
                                  {getStageName(survey.stage)}
                                </span>
                              </div>

                              {/* School choices and pledge */}
                              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-teal-950/40 border border-slate-200 dark:border-teal-900/50 space-y-1 text-[11px] font-bold text-start">
                                <div className="text-slate-800 dark:text-teal-100">
                                  🏫 <span className="text-slate-500 font-medium">{isRtl ? 'الرغبة الأولى:' : '1st Choice:'}</span> {survey.firstSchoolName || survey.schoolName}
                                </div>
                                {survey.secondSchoolName && (
                                  <div className="text-slate-700 dark:text-teal-200">
                                    🏫 <span className="text-slate-500 font-medium">{isRtl ? 'الرغبة الثانية:' : '2nd Choice:'}</span> {survey.secondSchoolName}
                                  </div>
                                )}
                                {survey.thirdSchoolName && (
                                  <div className="text-slate-700 dark:text-teal-200">
                                    🏫 <span className="text-slate-500 font-medium">{isRtl ? 'الرغبة الثالثة:' : '3rd Choice:'}</span> {survey.thirdSchoolName}
                                  </div>
                                )}
                                {survey.agreedToAlternativeSchoolPlacement && (
                                  <div className="pt-1 text-[10px] text-amber-800 dark:text-amber-300 font-black flex items-center gap-1">
                                    <span>☑️ {isRtl ? 'موافقة وتعهد ولي الأمر: تسكين الطالب/ة في أقرب مدرسة متاحة عند تعذر الرغبات' : 'Guardian Pledge: Agreement to nearest available school'}</span>
                                  </div>
                                )}
                              </div>

                              {/* Notes if any */}
                              {survey.notes && (
                                <div className={`p-3 rounded-xl border text-xs font-semibold italic ${
                                  isDark
                                    ? 'bg-[#0b2a3f]/40 border-teal-800/30 text-teal-200'
                                    : 'bg-slate-50 border-slate-100/60 text-slate-600'
                                }`}>
                                  "{survey.notes}"
                                </div>
                              )}

                              {/* Unresolved Reason if pending */}
                              {!survey.isResolved && survey.unresolvedReason && (
                                <div className={`p-3 rounded-xl border text-xs font-semibold ${
                                  isDark
                                    ? 'bg-amber-950/20 border-amber-900/35 text-amber-300'
                                    : 'bg-amber-50/40 border-amber-100 text-amber-800'
                                }`}>
                                  <span className="font-extrabold block mb-1">{t.unresolvedReasonLabel}:</span>
                                  "{survey.unresolvedReason}"
                                </div>
                              )}
                            </div>

                            {/* Interactive toggle block */}
                            <div className={`pt-3 border-t flex items-center justify-between gap-4 ${
                              isDark ? 'border-teal-800/20' : 'border-slate-100'
                            }`}>
                              <span className={`text-[10px] font-mono flex items-center gap-1 ${isDark ? 'text-teal-400/50' : 'text-slate-400'}`}>
                                <Calendar className="w-3.5 h-3.5" />
                                {survey.createdAt ? String(survey.createdAt).split('T')[0] : '2026-08-12'}
                              </span>
                              
                              {survey.isResolved ? (
                                <div className={`px-3 py-1.5 text-xs font-black rounded-lg flex items-center gap-1.5 border ${
                                  isDark
                                    ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                }`}>
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>{isRtl ? '✓ تم حل الاستبيان' : '✓ Resolved'}</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onToggleResolved(survey.id)}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border ${
                                    isDark
                                      ? 'bg-gradient-to-r from-[#218caa] to-[#3078a6] border-transparent text-white hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-teal-950/40'
                                      : 'bg-[#218caa] border-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                                  }`}
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>{isRtl ? 'تحديث كـ تم الحل' : 'Mark as Resolved'}</span>
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* SUB-TAB 2: PRINCIPAL REPORTS & REQUESTS */}
              {dashboardSubTab === 'principal-reports' && (
                <motion.div
                  key="principal-reports-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Reporting Panel Content */}
                  {!isReporting ? (
                    <div className="space-y-6">
                      {/* Section Title & Add Button */}
                      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-3 ${
                        isDark ? 'border-teal-800/25' : 'border-slate-100'
                      }`}>
                        <div className="space-y-1">
                          <h2 className={`text-lg font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            <School className={`w-5 h-5 ${isDark ? 'text-teal-300' : 'text-emerald-600'}`} />
                            <span>{isRtl ? 'طلبات وبلاغات المدرسة الموجهة للإدارة' : 'School Official Reports'}</span>
                          </h2>
                          <p className={`text-xs font-semibold ${isDark ? 'text-teal-400/80' : 'text-slate-400'}`}>
                            {isRtl 
                              ? 'رفع ومتابعة بلاغات العجز والشواغر والحلول المقترحة من قبلكم كمدير مدرسة للبت فيها فوراً من قبل مسئول القبول والتوجيه.' 
                              : 'Log issues, propose classroom modifications, and monitor official support resolutions.'}
                          </p>
                        </div>

                        <button
                          onClick={() => setIsReporting(true)}
                          className={`px-4 py-2.5 text-white text-xs sm:text-sm font-extrabold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto ${
                            isDark
                              ? 'bg-gradient-to-r from-[#218caa] to-[#3078a6] hover:from-emerald-500 hover:to-teal-500 shadow-teal-950/40'
                              : 'bg-[#218caa] hover:bg-emerald-500 shadow-emerald-600/10'
                          }`}
                          id="principal-add-report-btn"
                        >
                          <Plus className="w-4.5 h-4.5" />
                          <span>{isRtl ? 'تسجيل بلاغ/طلب جديد' : 'Log New Report / Solution'}</span>
                        </button>
                      </div>

                      {/* List of existing principal reports */}
                      {myReports.length === 0 ? (
                        <div className={`border rounded-2xl p-12 text-center font-medium space-y-4 max-w-xl mx-auto ${
                          isDark ? 'glass-card-dark border-teal-800/25' : 'bg-white border-slate-200'
                        }`}>
                          <div className={`inline-flex items-center justify-center p-4 rounded-full ${
                            isDark ? 'bg-teal-950/60 text-teal-400' : 'bg-slate-50 text-slate-400'
                          }`}>
                            <School className="w-8 h-8" />
                          </div>
                          <div className="space-y-1">
                            <p className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-700'}`}>{isRtl ? 'لا توجد بلاغات مسجلة حتى الآن' : 'No school reports logged yet'}</p>
                            <p className={`text-xs ${isDark ? 'text-teal-400/70' : 'text-slate-400'}`}>{isRtl ? 'يمكنك استخدام خيار تسجيل بلاغ جديد لرفع أي مشكلات في الشواغر أو الكثافة بالفصول.' : 'You can log issues or classroom adjustments using the button above.'}</p>
                          </div>
                          <button
                            onClick={() => setIsReporting(true)}
                            className={`px-5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              isDark
                                ? 'bg-teal-950/50 hover:bg-teal-900/50 text-teal-300 border-teal-800/40'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100'
                            }`}
                          >
                            {isRtl ? 'إنشاء أول بلاغ الآن' : 'Create First Report'}
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {myReports.map((rep) => {
                            const getProblemLabel = (pt: string) => {
                              if (pt === 'vacancies_closed') return isRtl ? 'الشواغر مغلقة' : 'Closed Vacancies';
                              if (pt === 'class_density') return isRtl ? 'كثافة بالفصول' : 'Class Density';
                              return pt;
                            };

                            const getStageLabel = (stg: string) => {
                              if (stg === 'Kindergarten') return isRtl ? 'رياض الأطفال' : 'Kindergarten';
                              if (stg === 'EarlyChildhood') return isRtl ? 'الطفولة مبكرة' : 'Early Childhood';
                              if (stg === 'Primary') return isRtl ? 'الابتدائي' : 'Primary';
                              if (stg === 'Intermediate') return isRtl ? 'المتوسط' : 'Intermediate';
                              if (stg === 'Secondary') return isRtl ? 'الثانوي' : 'Secondary';
                              return stg;
                            };

                            return (
                              <motion.div
                                key={rep.id}
                                layout
                                className={`border rounded-2xl p-6 transition-all flex flex-col justify-between space-y-4 ${
                                  isDark
                                    ? 'glass-card-dark border-teal-800/25'
                                    : 'bg-white border-slate-200 shadow-xs hover:shadow-md'
                                }`}
                              >
                                <div className="space-y-3">
                                  {/* Header Block */}
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                                        isDark ? 'bg-teal-950 text-teal-300 border border-teal-900' : 'bg-slate-100 text-slate-600'
                                      }`}>
                                        {rep.id}
                                      </span>
                                      <h4 className={`font-bold text-sm mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{rep.principalName}</h4>
                                      <p className={`text-[10px] font-mono ${isDark ? 'text-teal-400/70' : 'text-slate-400'}`}>{isRtl ? 'الجوال: ' : 'Mobile: '}{rep.mobile}</p>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                      rep.isResolved 
                                        ? isDark
                                          ? 'bg-emerald-950/35 border border-emerald-800/30 text-emerald-300'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : isDark
                                          ? 'bg-amber-950/35 border border-amber-800/30 text-amber-300 animate-pulse'
                                          : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                                    }`}>
                                      {rep.isResolved ? (
                                        <>
                                          <CheckCircle className="w-3 h-3" />
                                          <span>{isRtl ? 'تم الحل والاعتماد' : 'Resolved & Approved'}</span>
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="w-3 h-3" />
                                          <span>{isRtl ? 'تحت الإجراء والتدقيق' : 'Under Review'}</span>
                                        </>
                                      )}
                                    </span>
                                  </div>

                                  {/* Badges */}
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    <span className={`border px-2.5 py-0.5 rounded-md font-extrabold text-[10px] ${
                                      isDark
                                        ? 'bg-blue-950/40 border-blue-900 text-blue-300'
                                        : 'bg-blue-50 border-blue-100/50 text-blue-700'
                                    }`}>
                                      {getProblemLabel(rep.problemType)}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-md font-extrabold text-[10px] ${
                                      isDark ? 'bg-teal-950 text-teal-300 border border-teal-900' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {getStageLabel(rep.stage)}
                                    </span>
                                  </div>

                                  {/* Interactive custom solutions output */}
                                  {rep.problemType === 'vacancies_closed' && (
                                    <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                                      isDark ? 'bg-[#0b2a3f]/40 border-teal-850/20' : 'bg-slate-50 border-slate-100/80'
                                    }`}>
                                      <span className={`font-extrabold block border-b pb-1 ${
                                        isDark ? 'text-teal-300 border-teal-800/40' : 'text-slate-700 border-slate-200'
                                      }`}>
                                        {isRtl ? '📋 تفاصيل الشواغر المغلقة:' : '📋 Closed Vacancies Details:'}
                                      </span>
                                      <div className={`font-semibold space-y-1.5 ${isDark ? 'text-teal-200/90' : 'text-slate-600'}`}>
                                        <div className="flex items-center gap-1.5">
                                          <span>- {isRtl ? 'خيارات الفصول:' : 'Classes options:'}</span>
                                          <span className={`border px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                            isDark ? 'bg-blue-950/40 border-blue-900 text-blue-300' : 'bg-blue-50 border-blue-100/30 text-blue-700'
                                          }`}>
                                            {rep.closedVacanciesOption === 'specific' 
                                              ? (isRtl ? 'فصول معينة' : 'Specific classes') 
                                              : (isRtl ? 'جميع الفصول' : 'All classes')}
                                          </span>
                                        </div>
                                        {rep.closedVacanciesOption === 'specific' && rep.specificClosedClassesText && (
                                          <div className={`p-2 rounded-lg border italic text-[11px] mt-1 ${
                                            isDark ? 'bg-teal-950/55 border-teal-900 text-teal-300' : 'bg-white border-slate-200/50 text-slate-500'
                                          }`}>
                                            {isRtl ? 'الفصول المغلقة: ' : 'Closed classes: '}"{rep.specificClosedClassesText}"
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {rep.problemType === 'class_density' && (
                                    <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                                      isDark ? 'bg-[#0b2a3f]/40 border-teal-850/20' : 'bg-slate-50 border-slate-100/80'
                                    }`}>
                                      <span className={`font-extrabold block border-b pb-1 ${
                                        isDark ? 'text-teal-300 border-teal-800/40' : 'text-slate-700 border-slate-200'
                                      }`}>
                                        {isRtl ? '💡 الحل المقترح من قبل مدير المدرسة:' : '💡 Proposed solution by School Principal:'}
                                      </span>
                                      {rep.proposedSolution === 'open_class' && (
                                        <div className={`font-semibold space-y-1.5 ${isDark ? 'text-teal-200/90' : 'text-slate-600'}`}>
                                          <div className="flex items-center gap-1.5">
                                            <span>- {isRtl ? 'فتح فصل' : 'Open a class'}</span>
                                            <span className={`border px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                              isDark
                                                ? 'bg-emerald-950/30 border-emerald-900 text-emerald-300'
                                                : 'bg-emerald-50 border-emerald-100/30 text-emerald-700'
                                            }`}>
                                              {rep.openClassSubOption === 'no_teachers' 
                                                ? (isRtl ? 'بدون توفير معلمين' : 'Without providing teachers') 
                                                : (isRtl ? 'يحتاج توفير معلمين' : 'Needs providing teachers')}
                                            </span>
                                          </div>
                                          {rep.openClassSubOption === 'needs_teachers' && rep.requiredSpecialtiesText && (
                                            <div className={`p-2 rounded-lg border italic text-[11px] mt-1 ${
                                              isDark ? 'bg-teal-950/55 border-teal-900 text-teal-300' : 'bg-white border-slate-200/50 text-slate-500'
                                            }`}>
                                              {isRtl ? 'التخصصات المطلوبة: ' : 'Required Specialties: '}"{rep.requiredSpecialtiesText}"
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      {rep.proposedSolution === 'modify_budget' && (
                                        <div className={`font-semibold space-y-1 ${isDark ? 'text-teal-200/90' : 'text-slate-600'}`}>
                                          <span className="block">- {isRtl ? 'تعديل ميزانية الفصول' : 'Modify classroom budget'}</span>
                                          <div className={`p-2 rounded-lg border italic text-[11px] ${
                                            isDark ? 'bg-teal-950/55 border-teal-900 text-teal-300' : 'bg-white border-slate-200/50 text-slate-500'
                                          }`}>
                                            "{rep.budgetProposalText}"
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Creation Timestamp and Actions */}
                                <div className={`pt-3 border-t flex items-center justify-between text-[10px] font-mono ${
                                  isDark ? 'border-teal-800/20 text-teal-400/50' : 'border-slate-100 text-slate-400'
                                }`}>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {rep.createdAt ? String(rep.createdAt).split('T')[0] : '2026-08-12'} {rep.createdAt && String(rep.createdAt).includes('T') ? String(rep.createdAt).split('T')[1]?.substring(0, 5) || '' : ''}
                                  </span>
                                  
                                  {onToggleReportResolved && (
                                    <button
                                      onClick={() => onToggleReportResolved(rep.id)}
                                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 border ${
                                        rep.isResolved
                                          ? isDark
                                            ? 'bg-amber-950/40 border-amber-800/30 text-amber-300 hover:bg-amber-900/40'
                                            : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                          : isDark
                                            ? 'bg-emerald-950/40 border-emerald-800/30 text-emerald-300 hover:bg-emerald-900/40'
                                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                      }`}
                                    >
                                      <span>
                                        {rep.isResolved
                                          ? (isRtl ? 'تغيير لغير معتمد' : 'Mark as Pending')
                                          : (isRtl ? 'اعتماد وحل البلاغ' : 'Approve & Resolve')}
                                      </span>
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* THE NEW DETAILED REPORT FORM SECTION */
                    <motion.div
                      key="principal-new-report-form"
                      initial={{ opacity: 0, scale: 0.99 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.99 }}
                      className={`border rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden ${
                        isDark ? 'glass-card-dark border-teal-800/25' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#218caa] to-[#3078a6]" />
                      
                      {/* Back button */}
                      <button
                        onClick={() => {
                          setIsReporting(false);
                          setFormErrorMsg('');
                        }}
                        className={`mb-6 flex items-center gap-2 text-xs font-bold cursor-pointer transition-colors ${
                          isDark ? 'text-teal-400 hover:text-teal-300' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        <span>{isRtl ? 'إلغاء والعودة للقائمة' : 'Cancel and go back'}</span>
                      </button>

                      {/* Header */}
                      <div className="space-y-2 mb-6">
                        <h2 className={`text-xl font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          <Plus className={`w-5 h-5 ${isDark ? 'text-teal-300' : 'text-emerald-600'}`} />
                          <span>{isRtl ? 'تسجيل بلاغ/طلب إلكتروني جديد' : 'Log New School Report'}</span>
                        </h2>
                        <p className={`text-xs font-semibold ${isDark ? 'text-teal-400/80' : 'text-slate-400'}`}>
                          {isRtl 
                            ? 'الرجاء ملء تفاصيل المشكلة وتحديد الميزانيات أو الفصول المقترحة لإرسالها فوراً للوزارة.' 
                            : 'Please fill in details about school vacancies or density issues.'}
                        </p>
                      </div>

                      {/* Feedback messages */}
                      {formErrorMsg && (
                        <div className={`mb-4 border rounded-xl p-3 text-xs font-bold flex items-center gap-2 ${
                          isDark ? 'bg-rose-950/30 border-rose-800/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}>
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{formErrorMsg}</span>
                        </div>
                      )}

                      {formSuccessMsg && (
                        <div className={`mb-4 border rounded-xl p-4 text-xs sm:text-sm font-bold flex items-center gap-2 ${
                          isDark ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}>
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>{formSuccessMsg}</span>
                        </div>
                      )}

                      <form onSubmit={handleReportSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* 1. School Name (prefilled, read-only) */}
                          <div className="space-y-1.5">
                            <label className={`block text-xs font-extrabold ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                              {isRtl ? 'اسم المدرسة (معبأ تلقائياً)' : 'School Name (Prefilled)'}
                            </label>
                            <div className="relative">
                              <School className="absolute top-3.5 right-3.5 w-4 h-4 text-slate-400" />
                              <input
                                type="text"
                                value={principalSession.schoolName}
                                disabled
                                className={`w-full pr-10 pl-4 py-3 text-xs sm:text-sm font-bold rounded-xl cursor-not-allowed outline-none border ${
                                  isDark
                                    ? 'bg-[#061b27] border-teal-900 text-teal-400/60'
                                    : 'bg-slate-100 border-slate-200 text-slate-500'
                                }`}
                              />
                            </div>
                          </div>

                          {/* 2. Ministerial Code (prefilled, read-only) */}
                          <div className="space-y-1.5">
                            <label className={`block text-xs font-extrabold ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                              {isRtl ? 'الرقم الوزاري (معبأ تلقائياً)' : 'Ministerial Code (Prefilled)'}
                            </label>
                            <div className="relative">
                              <Lock className="absolute top-3.5 right-3.5 w-4 h-4 text-slate-400" />
                              <input
                                type="text"
                                value={principalSession.schoolCode}
                                disabled
                                className={`w-full pr-10 pl-4 py-3 text-xs sm:text-sm font-mono font-bold rounded-xl cursor-not-allowed outline-none border ${
                                  isDark
                                    ? 'bg-[#061b27] border-teal-900 text-teal-400/60'
                                    : 'bg-slate-100 border-slate-200 text-slate-500'
                                }`}
                              />
                            </div>
                          </div>

                          {/* 3. School Stage */}
                          <div className="space-y-1.5">
                            <label className={`block text-xs font-extrabold ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                              {isRtl ? 'المرحلة الدراسية للبلاغ' : 'School Stage'} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <Layers className="absolute top-3.5 right-3.5 w-4 h-4 text-slate-400" />
                              <select
                                value={repStage}
                                onChange={(e) => setRepStage(e.target.value)}
                                className={`w-full pr-10 pl-4 py-3 text-xs sm:text-sm font-bold rounded-xl outline-none appearance-none cursor-pointer border transition-all ${
                                  isDark
                                    ? 'bg-[#0b2336] border-teal-800/50 text-white focus:border-emerald-400 focus:bg-[#061c24]'
                                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
                                }`}
                              >
                                <option value="Kindergarten">{isRtl ? 'رياض الأطفال' : 'Kindergarten'}</option>
                                <option value="EarlyChildhood">{isRtl ? 'الطفولة المبكرة' : 'Early Childhood'}</option>
                                <option value="Primary">{isRtl ? 'الابتدائي' : 'Primary'}</option>
                                <option value="Intermediate">{isRtl ? 'المتوسط' : 'Intermediate'}</option>
                                <option value="Secondary">{isRtl ? 'الثانوي' : 'Secondary'}</option>
                              </select>
                              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                                {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </div>
                            </div>
                          </div>

                          {/* 4. Principal Name (prefilled, read-only) */}
                          <div className="space-y-1.5">
                            <label className={`block text-xs font-extrabold ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                              {isRtl ? 'اسم مدير/ة المدرسة (معبأ تلقائياً)' : 'Principal Name (Prefilled)'}
                            </label>
                            <div className="relative">
                              <User className="absolute top-3.5 right-3.5 w-4 h-4 text-slate-400" />
                              <input
                                type="text"
                                value={principalSession.principalName}
                                disabled
                                className={`w-full pr-10 pl-4 py-3 text-xs sm:text-sm font-bold rounded-xl cursor-not-allowed outline-none border ${
                                  isDark
                                    ? 'bg-[#061b27] border-teal-900 text-teal-400/60'
                                    : 'bg-slate-100 border-slate-200 text-slate-500'
                                }`}
                              />
                            </div>
                          </div>

                          {/* 5. Mobile (editable) */}
                          <div className="space-y-1.5">
                            <label className={`block text-xs font-extrabold ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                              {isRtl ? 'رقم جوال المدير للتواصل' : 'Principal Mobile'} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <Phone className="absolute top-3.5 right-3.5 w-4 h-4 text-slate-400" />
                              <input
                                type="text"
                                value={repMobile}
                                onChange={(e) => setRepMobile(e.target.value.replace(/\D/g, ''))}
                                placeholder={isRtl ? 'مثال: 0551234567' : 'e.g., 0551234567'}
                                className={`w-full pr-10 pl-4 py-3 text-xs sm:text-sm font-medium rounded-xl outline-none border transition-all ${
                                  isDark
                                    ? 'bg-[#0b2336] border-teal-800/50 text-white focus:border-emerald-400 focus:bg-[#061c24]'
                                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
                                }`}
                                required
                              />
                            </div>
                          </div>

                          {/* 6. Problem Type Dropdown */}
                          <div className="space-y-1.5">
                            <label className={`block text-xs font-extrabold ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                              {isRtl ? 'نوع الطلب' : 'Request Type'} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <HelpCircle className="absolute top-3.5 right-3.5 w-4 h-4 text-slate-400" />
                              <select
                                value={repProblemType}
                                onChange={(e) => {
                                  const val = e.target.value as 'vacancies_closed' | 'class_density';
                                  setRepProblemType(val);
                                  if (val !== 'class_density') {
                                    setRepProposedSolution(undefined);
                                    setRepOpenClassSubOption(undefined);
                                    setRepBudgetProposalText('');
                                    setRepClosedVacanciesOption('all');
                                  } else {
                                    setRepProposedSolution('open_class');
                                    setRepOpenClassSubOption('no_teachers');
                                    setRepClosedVacanciesOption(undefined);
                                    setRepSpecificClosedClassesText('');
                                  }
                                }}
                                className={`w-full pr-10 pl-4 py-3 text-xs sm:text-sm font-bold rounded-xl outline-none appearance-none cursor-pointer border transition-all ${
                                  isDark
                                    ? 'bg-[#0b2336] border-teal-800/50 text-white focus:border-emerald-400 focus:bg-[#061c24]'
                                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
                                }`}
                              >
                                <option value="vacancies_closed">{isRtl ? 'الشواغر مغلقة' : 'Closed Vacancies'}</option>
                                <option value="class_density">{isRtl ? 'كثافة بالفصول' : 'Class Density'}</option>
                              </select>
                              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                                {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* DYNAMIC SECTION FOR CLOSED VACANCIES OPTIONS - When Problem Type is "الشواغر مغلقة" */}
                        <AnimatePresence>
                          {repProblemType === 'vacancies_closed' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className={`border rounded-2xl p-5 sm:p-6 space-y-4 overflow-hidden ${
                                isDark ? 'bg-[#0b2336]/30 border-teal-800/35' : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className={`flex items-center gap-2 pb-2 border-b ${
                                isDark ? 'border-teal-800/25' : 'border-slate-200/60'
                              }`}>
                                <span className="h-5.5 w-1.5 bg-[#218caa] rounded-full" />
                                <h3 className={`font-extrabold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                  {isRtl ? 'تفاصيل خيارات الشواغر المغلقة' : 'Closed Vacancies Details'}
                                </h3>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Option A: جميع الفصول */}
                                <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${
                                  repClosedVacanciesOption === 'all'
                                    ? isDark
                                      ? 'border-emerald-400 ring-2 ring-emerald-950/40 bg-[#0b2d42]/60'
                                      : 'border-emerald-500 ring-2 ring-emerald-500/10 bg-white'
                                    : isDark
                                      ? 'border-teal-800/40 bg-[#092233]/50 hover:border-teal-700/60 text-teal-300'
                                      : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <input
                                      type="radio"
                                      name="closed_vacancies_option"
                                      checked={repClosedVacanciesOption === 'all'}
                                      onChange={() => {
                                        setRepClosedVacanciesOption('all');
                                        setRepSpecificClosedClassesText('');
                                      }}
                                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                    />
                                    <span className={`font-extrabold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                      {isRtl ? 'جميع الفصول مغلقة' : 'All classes are closed'}
                                    </span>
                                  </div>
                                  <p className={`text-[11px] leading-normal pr-6 ${isDark ? 'text-teal-400/80' : 'text-slate-400'}`}>
                                    {isRtl ? 'الشواغر مغلقة لكافة فصول المرحلة الدراسية المحددة بالكامل.' : 'All slots are closed for this scholastic stage completely.'}
                                  </p>
                                </label>

                                {/* Option B: فصول معينة */}
                                <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${
                                  repClosedVacanciesOption === 'specific'
                                    ? isDark
                                      ? 'border-emerald-400 ring-2 ring-emerald-950/40 bg-[#0b2d42]/60'
                                      : 'border-emerald-500 ring-2 ring-emerald-500/10 bg-white'
                                    : isDark
                                      ? 'border-teal-800/40 bg-[#092233]/50 hover:border-teal-700/60 text-teal-300'
                                      : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <input
                                      type="radio"
                                      name="closed_vacancies_option"
                                      checked={repClosedVacanciesOption === 'specific'}
                                      onChange={() => {
                                        setRepClosedVacanciesOption('specific');
                                      }}
                                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                    />
                                    <span className={`font-extrabold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                      {isRtl ? 'فصول معينة' : 'Specific classes'}
                                    </span>
                                  </div>
                                  <p className={`text-[11px] leading-normal pr-6 ${isDark ? 'text-teal-400/80' : 'text-slate-400'}`}>
                                    {isRtl ? 'تحديد فصول دراسية مغلقة بعينها مع إتاحة الباقي.' : 'Specify particular closed classrooms while others remain open.'}
                                  </p>
                                </label>
                              </div>

                              {/* CONDITIONAL FIELD: Specific closed classrooms text */}
                              <AnimatePresence>
                                {repClosedVacanciesOption === 'specific' && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="space-y-1.5"
                                  >
                                    <label className={`block text-xs font-extrabold ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                                      {isRtl ? 'تسجيل الفصول المغلقة المحددة' : 'Specify the closed classes'} <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                      value={repSpecificClosedClassesText}
                                      onChange={(e) => setRepSpecificClosedClassesText(e.target.value)}
                                      placeholder={isRtl ? 'مثال: الصف الأول أ، الصف الثاني ب...' : 'e.g. First Grade A, Second Grade B...'}
                                      rows={2}
                                      className={`w-full px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl outline-none transition-all resize-none border ${
                                        isDark
                                          ? 'bg-[#0b2336] border-teal-850/50 text-white focus:bg-[#061c24] focus:border-emerald-400'
                                          : 'bg-white border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100/50 text-slate-900'
                                      }`}
                                      required
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* DYNAMIC SOLUTION SECTION - When Problem Type is "كثافة بالفصول" */}
                        <AnimatePresence>
                          {repProblemType === 'class_density' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className={`border rounded-2xl p-5 sm:p-6 space-y-4 overflow-hidden ${
                                isDark ? 'bg-[#0b2336]/30 border-teal-800/35' : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className={`flex items-center gap-2 pb-2 border-b ${
                                isDark ? 'border-teal-800/25' : 'border-slate-200/60'
                              }`}>
                                <span className="h-5.5 w-1.5 bg-[#218caa] rounded-full" />
                                <h3 className={`font-extrabold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                  {isRtl ? 'الحل المقترح من قبل مدير المدرسة' : 'Proposed Solution by School Principal'}
                                </h3>
                              </div>

                              {/* Solution choices */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                
                                {/* Option A: فتح فصل */}
                                <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${
                                  repProposedSolution === 'open_class'
                                    ? isDark
                                      ? 'border-emerald-400 ring-2 ring-emerald-950/40 bg-[#0b2d42]/60'
                                      : 'border-emerald-500 ring-2 ring-emerald-500/10 bg-white'
                                    : isDark
                                      ? 'border-teal-800/40 bg-[#092233]/50 hover:border-teal-700/60 text-teal-300'
                                      : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <input
                                      type="radio"
                                      name="proposed_solution"
                                      checked={repProposedSolution === 'open_class'}
                                      onChange={() => {
                                        setRepProposedSolution('open_class');
                                        setRepOpenClassSubOption('no_teachers');
                                        setRepBudgetProposalText('');
                                      }}
                                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                    />
                                    <span className={`font-extrabold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                      {isRtl ? 'فتح فصل' : 'Open a new class'}
                                    </span>
                                  </div>
                                  <p className={`text-[11px] leading-normal pr-6 ${isDark ? 'text-teal-400/80' : 'text-slate-400'}`}>
                                    {isRtl ? 'طلب فتح فصول دراسية جديدة لإعادة توزيع الطلاب وتخفيف الكثافة.' : 'Propose establishing a new class to reduce density.'}
                                  </p>
                                </label>

                                {/* Option B: تعديل ميزانية الفصول */}
                                <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${
                                  repProposedSolution === 'modify_budget'
                                    ? isDark
                                      ? 'border-emerald-400 ring-2 ring-emerald-950/40 bg-[#0b2d42]/60'
                                      : 'border-emerald-500 ring-2 ring-emerald-500/10 bg-white'
                                    : isDark
                                      ? 'border-teal-800/40 bg-[#092233]/50 hover:border-teal-700/60 text-teal-300'
                                      : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <input
                                      type="radio"
                                      name="proposed_solution"
                                      checked={repProposedSolution === 'modify_budget'}
                                      onChange={() => {
                                        setRepProposedSolution('modify_budget');
                                        setRepOpenClassSubOption(undefined);
                                        setRepBudgetProposalText('');
                                      }}
                                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                    />
                                    <span className={`font-extrabold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                      {isRtl ? 'تعديل ميزانية الفصول' : 'Modify classroom budget'}
                                    </span>
                                  </div>
                                  <p className={`text-[11px] leading-normal pr-6 ${isDark ? 'text-teal-400/80' : 'text-slate-400'}`}>
                                    {isRtl ? 'مقترح تعديل ميزانية التوزيع أو الفئات المعتمدة للمدرسة لتناسب الإقبال.' : 'Propose modifying the active classroom quota allocation.'}
                                  </p>
                                </label>

                              </div>

                              {/* CONDITIONAL SUB-OPTIONS: Open Class */}
                              <AnimatePresence>
                                {repProposedSolution === 'open_class' && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className={`p-4 rounded-xl border space-y-3 ${
                                      isDark ? 'bg-emerald-950/15 border-emerald-900/35' : 'bg-emerald-50/40 border-emerald-100/30'
                                    }`}
                                  >
                                    <span className={`block text-xs font-black ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                                      {isRtl ? 'تحديد الخيار المناسب لفتح الفصل:' : 'Choose provisioning requirement:'}
                                    </span>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                      <label className={`flex items-center gap-2 cursor-pointer font-bold text-xs ${isDark ? 'text-teal-300' : 'text-slate-600'}`}>
                                        <input
                                          type="radio"
                                          name="open_class_sub"
                                          checked={repOpenClassSubOption === 'no_teachers'}
                                          onChange={() => {
                                            setRepOpenClassSubOption('no_teachers');
                                            setRepRequiredSpecialtiesText('');
                                          }}
                                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                        />
                                        <span>{isRtl ? 'بدون توفير معلمين' : 'Without providing teachers'}</span>
                                      </label>
                                      
                                      <label className={`flex items-center gap-2 cursor-pointer font-bold text-xs ${isDark ? 'text-teal-300' : 'text-slate-600'}`}>
                                        <input
                                          type="radio"
                                          name="open_class_sub"
                                          checked={repOpenClassSubOption === 'needs_teachers'}
                                          onChange={() => setRepOpenClassSubOption('needs_teachers')}
                                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                        />
                                        <span>{isRtl ? 'يحتاج توفير معلمين' : 'Needs providing teachers'}</span>
                                      </label>
                                    </div>

                                    {/* CONDITIONAL SUB-FIELD FOR SPECIALTIES */}
                                    <AnimatePresence>
                                      {repOpenClassSubOption === 'needs_teachers' && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          className="pt-2 space-y-1.5 overflow-hidden"
                                        >
                                          <label className={`block text-xs font-extrabold ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                                            {isRtl ? 'تسجيل التخصصات المطلوبة لفتح الفصل' : 'Required Specialties for New Class'} <span className="text-red-500">*</span>
                                          </label>
                                          <textarea
                                            value={repRequiredSpecialtiesText}
                                            onChange={(e) => setRepRequiredSpecialtiesText(e.target.value)}
                                            placeholder={isRtl ? 'مثال: رياضيات، لغة عربية، علوم...' : 'e.g. Mathematics, Arabic, Science...'}
                                            rows={2}
                                            className={`w-full px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl outline-none transition-all resize-none border ${
                                              isDark
                                                ? 'bg-[#0b2336] border-teal-850/50 text-white focus:bg-[#061c24] focus:border-emerald-400'
                                                : 'bg-white border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100/50 text-slate-900'
                                            }`}
                                            required
                                          />
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* CONDITIONAL SUB-OPTIONS: Modify Budget */}
                              <AnimatePresence>
                                {repProposedSolution === 'modify_budget' && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="space-y-1.5"
                                  >
                                    <label className={`block text-xs font-extrabold ${isDark ? 'text-teal-300' : 'text-slate-700'}`}>
                                      {isRtl ? 'المقترح في تعديل ميزانية الفصول بالتفصيل' : 'Classroom Budget Proposal Details'} <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                      value={repBudgetProposalText}
                                      onChange={(e) => setRepBudgetProposalText(e.target.value)}
                                      placeholder={isRtl ? 'يكتب مدير المدرسة المقترح في التعديل هنا بالتفصيل...' : 'Write your budget modification proposal detail here...'}
                                      rows={3}
                                      className={`w-full px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl outline-none transition-all resize-none border ${
                                        isDark
                                          ? 'bg-[#0b2336] border-teal-850/50 text-white focus:bg-[#061c24] focus:border-emerald-400'
                                          : 'bg-white border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100/50 text-slate-900'
                                      }`}
                                      required
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>

                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Submit Button */}
                        <div className="pt-2">
                          <button
                            type="submit"
                            className={`w-full sm:w-auto px-6 py-3.5 text-white font-extrabold text-sm sm:text-base rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                              isDark
                                ? 'bg-gradient-to-r from-[#218caa] to-[#3078a6] hover:from-emerald-500 hover:to-teal-500 shadow-teal-950/40'
                                : 'bg-[#218caa] hover:bg-emerald-500 shadow-emerald-600/10'
                            }`}
                            id="principal-submit-report-form-btn"
                          >
                            <Send className="w-4 h-4" />
                            <span>{isRtl ? 'إرسال البلاغ والمقترح فوراً' : 'Submit Official Report'}</span>
                          </button>
                        </div>

                      </form>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      {/* Return Request Reason Modal */}
      {returnModalSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border space-y-5 ${
            isDark ? 'bg-[#071d2c] border-teal-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b pb-4 dark:border-teal-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-red-600 dark:text-red-400">
                    {isRtl ? '🚨 إعادة الطلب (تعذر التسكين/لا يوجد شاغر)' : 'Return Request (No Vacancy)'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {isRtl ? `الطالب/ة: ${returnModalSurvey.beneficiaryName} - رقم الطلب #${returnModalSurvey.id}` : `Student: ${returnModalSurvey.beneficiaryName}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReturnModalSurvey(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preset Quick Options */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-teal-200">
                {isRtl ? 'اختر سبباً سريعاً أو قم بكتابة السبب بالتفصيل:' : 'Select quick reason or write detail:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  'سعة الطاقة الاستيعابية مغلقة من التخطيط المدرسي',
                  'الشواغر مغلقة من التخطيط المدرسي',
                  'عدم توفر المسار المطلوب بالمدرسة'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setReturnReasonText(preset);
                      setReturnReasonError('');
                    }}
                    className={`p-2.5 rounded-xl text-xs text-start font-bold transition-all border cursor-pointer ${
                      returnReasonText === preset
                        ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-300 shadow-2xs'
                        : isDark ? 'bg-[#0a283c] border-teal-800/40 text-slate-300 hover:border-teal-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    • {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Detail Reason Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-teal-200">
                {isRtl ? 'نص سبب الإعادة (تدوين مخصص لمسؤول القبول):' : 'Reason for return:'}
              </label>
              <textarea
                rows={3}
                value={returnReasonText}
                onChange={(e) => {
                  setReturnReasonText(e.target.value);
                  setReturnReasonError('');
                }}
                placeholder={isRtl ? 'اكتب بالتفصيل سبب تعذر تسكين الطالب/ة بالمدرسة...' : 'Enter reason...'}
                className={`w-full p-3 text-xs font-bold rounded-2xl outline-none transition-all border ${
                  returnReasonError
                    ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30'
                    : isDark
                      ? 'bg-[#061c24] border-teal-800/60 text-white focus:border-red-400'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-red-500 focus:bg-white'
                }`}
              />
              {returnReasonError && (
                <p className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{returnReasonError}</span>
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t dark:border-teal-800/40">
              <button
                type="button"
                onClick={() => setReturnModalSurvey(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmReturnPlacement}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{isRtl ? 'تأكيد وإعادة الطلب لمسؤول القبول 🚨' : 'Confirm Return'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Warning Modal */}
      <AnimatePresence>
        {showMapWarningModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border ${
                isDark ? 'bg-[#061c24] border-teal-800/60' : 'bg-white border-slate-200'
              }`}
            >
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
              
              <div className="p-8 space-y-6 text-start">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${
                    isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Map className="w-8 h-8" />
                  </div>
                  <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {isRtl ? 'تنبيه استرشادي هام' : 'Important Guidance Notice'}
                  </h3>
                </div>

                <p className={`text-sm font-bold leading-relaxed ${isDark ? 'text-teal-100/90' : 'text-slate-600'}`}>
                  {isRtl 
                    ? "عزيزي المستفيد، يرجى الاطلاع على الخارطة التعليمية للقبول قبل تعبئة الطلب، وذلك لتحديد المدارس القريبة والمتاحة جغرافياً لإدراجها في قائمة رغباتك. في حال معرفتك بها مسبقاً، يمكنك الضغط على متابعة، أو الضغط على الزر المخصص لزيارة الخارطة."
                    : "Dear beneficiary, please review the Educational Map for admission before filling out the request to identify nearby and geographically available schools to include in your preferences. If you are already aware of them, you can click Continue, or click the dedicated button to visit the map."}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      window.open('https://mapedumadinah.com/', '_blank');
                    }}
                    className={`w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-md cursor-pointer ${
                      isDark 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
                    }`}
                  >
                    <Map className="w-4 h-4" />
                    <span>{isRtl ? 'زيارة الخارطة' : 'Visit Map'}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowMapWarningModal(false);
                      if (pendingAction) {
                        pendingAction();
                        setPendingAction(null);
                      }
                    }}
                    className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm transition-all border cursor-pointer ${
                      isDark 
                        ? 'bg-transparent border-teal-800/60 text-teal-300 hover:bg-teal-900/30' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isRtl ? 'متابعة' : 'Continue'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Admission Age Verification Modal */}
      <AgeVerificationModal
        isOpen={showAgeModal}
        onClose={() => setShowAgeModal(false)}
        onProceed={(details) => {
          setShowAgeModal(false);
          try {
            localStorage.setItem('student_age_verification', JSON.stringify(details));
          } catch (e) { /* ignore */ }
          onSelectRole('parent');
        }}
        isDark={isDark}
        isRtl={isRtl}
      />
    </div>
  );
}
