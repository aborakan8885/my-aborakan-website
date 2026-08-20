/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AgeVerificationModal } from './AgeVerificationModal';
import {
  User,
  Phone,
  School,
  FileQuestion,
  Star,
  MessageSquare,
  Send,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Building,
  GraduationCap,
  UserCheck,
  Home,
  ArrowRight,
  ArrowLeft,
  ArrowRightLeft,
  X,
  Users,
  MapPin,
  ClipboardList,
  CheckSquare,
  HelpCircle,
  Clock,
  ThumbsUp,
  FileText,
  Bookmark,
  Upload
} from 'lucide-react';
import { Language, SurveyResponse, ProblemType, AppConfig, SchoolItem } from '../types';
import { TRANSLATIONS, INITIAL_SCHOOLS } from '../data/mockData';
import { SchoolSelectDropdown } from './SchoolSelectDropdown';

interface SurveyFormProps {
  currentLang: Language;
  onSubmit: (survey: Omit<SurveyResponse, 'id' | 'createdAt' | 'isSynced'>) => SurveyResponse;
  onUpdateSurvey: (survey: SurveyResponse) => void;
  config: AppConfig;
  isOnline: boolean;
  onBackToPortal?: () => void;
  theme?: 'light' | 'dark';
  schools?: SchoolItem[];
}

export default function SurveyForm({
  currentLang,
  onSubmit,
  onUpdateSurvey,
  config,
  isOnline,
  onBackToPortal,
  theme,
  schools = INITIAL_SCHOOLS
}: SurveyFormProps) {
  const t = TRANSLATIONS[currentLang];
  const isRtl = currentLang === 'ar';
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

  // -----------------------------------------------------------------
  // Phase 1 (Submission Form) States
  // -----------------------------------------------------------------
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [parentName, setParentName] = useState('');
  const [studentAge, setStudentAge] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'boys' | 'girls' | ''>('');

  // Nationality & Residency States
  const [nationality, setNationality] = useState('سعودي');
  const [nationalitySearch, setNationalitySearch] = useState('');
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [residencyType, setResidencyType] = useState<'regular' | 'visit' | 'other' | ''>('regular');
  const [customResidencyType, setCustomResidencyType] = useState('');

  // Service Type & Transfer Mode states
  const [serviceType] = useState<'new' | 'transfer'>(() => {
    try {
      const stored = localStorage.getItem('student_service_type');
      if (stored === 'transfer') return 'transfer';
    } catch { /* ignore */ }
    return 'new';
  });
  const isTransferMode = serviceType === 'transfer';

  // Transfer-specific fields
  const [transferReason, setTransferReason] = useState<string>('registered_unlisted_desire');
  const [transferReasonCustom, setTransferReasonCustom] = useState<string>('');
  const [transferAttachmentName, setTransferAttachmentName] = useState<string>('');
  const [transferAttachmentData, setTransferAttachmentData] = useState<string>('');
  const [transferAttachmentType, setTransferAttachmentType] = useState<string>('');
  const [transferAttachmentSize, setTransferAttachmentSize] = useState<number>(0);
  const [transferAttachmentError, setTransferAttachmentError] = useState<string>('');
  const [guardianTransferPledge, setGuardianTransferPledge] = useState<boolean>(false);

  // Student Category Selection: 'fresh' (مستجد) or 'non_fresh' (غير مستجد)
  const [studentCategoryType, setStudentCategoryType] = useState<'fresh' | 'non_fresh'>(() => isTransferMode ? 'non_fresh' : 'fresh');
  
  // New state for request path selection (as requested by user)
  const [requestPath, setRequestPath] = useState<'transfer' | 'equivalency' | ''>(() => {
    if (isTransferMode) return 'transfer';
    return '';
  });

  const [equalizationStage, setEqualizationStage] = useState<'primary' | 'intermediate' | 'secondary' | 'other_qualification' | ''>('');
  const [equalizationOtherQualification, setEqualizationOtherQualification] = useState('');
  const [equalizationNotes, setEqualizationNotes] = useState('');
  
  // Modal states for guidelines
  const [showEqGuidelinesModal, setShowEqGuidelinesModal] = useState(false);
  const [hasAcceptedEqGuidelines, setHasAcceptedEqGuidelines] = useState(false);
  const [tempAcceptGuideline, setTempAcceptGuideline] = useState(false);

  const [stage, setStage] = useState('');
  const [grade, setGrade] = useState('');
  const [sector, setSector] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [secondSchoolName, setSecondSchoolName] = useState('');
  const [thirdSchoolName, setThirdSchoolName] = useState('');
  const [agreedToAlternativeSchoolPlacement, setAgreedToAlternativeSchoolPlacement] = useState<boolean>(false);
  const [problemType, setProblemType] = useState<ProblemType | ''>('');
  const [otherProblemDetails, setOtherProblemDetails] = useState('');
  const [contactedSchool, setContactedSchool] = useState<'yes' | 'no' | ''>('');
  const [schoolFeedback, setSchoolFeedback] = useState('');

  const ALL_NATIONALITIES = [
    'سعودي', 'إماراتي', 'كويتي', 'عماني', 'قطري', 'بحريني', 
    'يمني', 'أردني', 'فلسطيني', 'لبناني', 'سوري', 'عراقي', 
    'مصري', 'سوداني', 'ليبي', 'تونس', 'جزائري', 'مغربي', 
    'موريتاني', 'صومالي', 'جيبوتي', 'جزر القمر',
    'باكستاني', 'هندي', 'بنغلاديشي', 'فلبيني', 'أندونيسي', 'سريلانكي', 'نيبالي',
    'تركي', 'أفغاني', 'إيراني', 'صيني', 'ياباني', 'كوري جنوبي', 'كوري شمالي',
    'ماليزي', 'تايلاندي', 'فيتنامي', 'سنغافوري', 'بروناي', 'منغولي', 'أوزبكي', 'كازاخي', 'طاجيكي', 'تركمانستاني', 'قيرغيزستاني',
    'أمريكي', 'كندي', 'مكسيكي', 'برازيلي', 'أرجنتيني', 'كولومبي', 'بيروفي', 'تشيلي',
    'فنزويلي', 'إكوادوري', 'بوليفي', 'باراغواياني', 'أوروغواياني', 'بنمي', 'كوبي', 'جامايكي', 'دومينيكاني', 'هندوراسي', 'سلفادوري', 'نيكاراغوي', 'كوستاريكي', 'غواتيمالي',
    'بريطاني', 'فرنسي', 'ألماني', 'إيطالي', 'إسباني', 'هولندي', 'بلجيكي', 'سويسري',
    'نمساوي', 'سويدي', 'نرويجي', 'دنماركي', 'فنلندي', 'إيرلندي', 'برتغالي', 'يوناني',
    'روسي', 'أوكراني', 'بولندي', 'روماني', 'تشيكي', 'مجري', 'بلغاري', 'صربي', 'كرواتي', 'ألباني', 'بوسني', 'إستوني', 'لاتفي', 'ليتواني', 'سلوفاكي', 'سلوفيني', 'قبرصي', 'مالطي', 'أيسلندي', 'لوكسومبورغي',
    'إثيوبي', 'إريتري', 'نيجيري', 'كينيا', 'تنزانيا', 'أوغندا', 'جنوب أفريقيا', 'غانا', 'السنغال', 'مالي', 'النيجر', 'تشاد', 'الكاميرون', 'ساحل العاج', 'أنغولا', 'موزمبيق', 'مدغشقر', 'زيمبابوي', 'زامبيا', 'رواندا', 'بوروندي', 'غينيا', 'بنين', 'توغو', 'سيراليون', 'ليبيريا',
    'أسترالي', 'نيوزيلندي', 'فيجي', 'بابوا غينيا الجديدة',
    'أرميني', 'أذربيجاني', 'جورجي', 'كامبودي', 'لاوسي', 'ميانماري', 'تيمور الشرقية',
    'ألباني', 'أندوري', 'بيلاروسي', 'مقدوني', 'مولدوفي', 'موناكو', 'سان مارينو', 'فاتيكان',
    'أنتيغوا وبربودا', 'جزر البهاما', 'بربادوس', 'بليز', 'دومينيكا', 'غرينادا', 'غويانا', 'هايتي', 'سانت كيتس ونيفيس', 'سانت لوسيا', 'سانت فنسنت وغرينادين', 'سورينام', 'ترينيداد وتوباغو',
    'بوتسوانا', 'بوركينا فاسو', 'الرأس الأخضر', 'جمهورية أفريقيا الوسطى', 'جمهورية الكونغو الديمقراطية', 'جمهورية الكونغو', 'غينيا الاستوائية', 'الغابون', 'غامبيا', 'غينيا بيساو', 'ليسوتو', 'مالاوي', 'موريشيوس', 'ناميبيا', 'سيشل', 'جنوب السودان', 'إسواتيني'
  ];

  // -----------------------------------------------------------------
  // Phase 2 (Tracking & Evaluation Form) States
  // -----------------------------------------------------------------
  const [isResolved, setIsResolved] = useState<boolean | null>(null);
  const [unresolvedReason, setUnresolvedReason] = useState('');
  const [staffSatisfaction, setStaffSatisfaction] = useState<number>(0);
  const [receptionSatisfaction, setReceptionSatisfaction] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Star hover feedback states
  const [staffHover, setStaffHover] = useState<number>(0);
  const [receptionHover, setReceptionHover] = useState<number>(0);

  // Intro Header Hooks (Moved here to avoid React hook violation)
  const currentFormTitle = useMemo(() => {
    if (isTransferMode) {
      if (requestPath === 'equivalency') {
        return isRtl ? 'نموذج تقديم طلب معادلة المؤهلات' : 'Request for Equivalency of Credentials';
      }
      return isRtl ? 'نموذج تقديم طلب نقل طالب إلى مدرسة أخرى' : 'Student Transfer Request Form';
    }
    return t.formTitle;
  }, [isTransferMode, requestPath, isRtl, t.formTitle]);

  const currentFormSubtitle = useMemo(() => {
    if (isTransferMode) {
      if (requestPath === 'equivalency') {
        return isRtl ? 'بوابة معادلة الشهادات والمؤهلات الدراسية - إدارة التعليم بالمدينة المنورة' : 'Qualifications and credentials equivalency portal';
      }
      return isRtl ? 'نظام نقل الطلاب وتوزيع الرغبات وإرفاق الإثباتات المستندية - إدارة التعليم بالمدينة المنورة' : 'Student transfer & placement portal';
    }
    return isRtl ? 'فضلاً يرجى تعبئة بيانات الطلب أو الشكوى الخاصة بنجلك وتحديد المعوقات المصادفة لتيسير الإجراء والتوجيه السليم.' : 'Please specify the educational request details below to resolve constraints immediately.';
  }, [isTransferMode, requestPath, isRtl]);

  // -----------------------------------------------------------------
  // Flow and Validation States
  // -----------------------------------------------------------------
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [evalErrors, setEvalErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // True once Phase 1 is submitted
  const [showEvaluation, setShowEvaluation] = useState(false); // True when "Track and Evaluate" clicked
  const [evalSubmitted, setEvalSubmitted] = useState(false); // True once Evaluation is submitted
  const [createdSurvey, setCreatedSurvey] = useState<SurveyResponse | null>(null);
  const [showNegativeAlert, setShowNegativeAlert] = useState(false);

  // Age Verification State & LocalStorage Loader
  const [showAgeModal, setShowAgeModal] = useState<boolean>(false);
  const [verifiedAgeInfo, setVerifiedAgeInfo] = useState<{
    status: 'direct' | 'exemption';
    birthDate: string;
    declarationAccepted: boolean;
    stageName: string;
  } | null>(null);

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch { /* ignore */ }

    if (isTransferMode) {
      setStudentCategoryType('non_fresh');
    }

    try {
      const stored = localStorage.getItem('student_age_verification');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.status === 'direct' || parsed.status === 'exemption')) {
          setVerifiedAgeInfo(parsed);
          if (parsed.stageName && parsed.stageName.includes('الابتدائي')) {
            setStage('Primary');
          }
        }
      }
    } catch { /* ignore */ }
  }, [isTransferMode]);

  // File Upload Handler for Supporting Documents (< 3MB)
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setTransferAttachmentError('');
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setTransferAttachmentError(isRtl ? '⚠️ حجم الملف يتجاوز الحد الأقصى (3 ميجابايت).' : 'File size exceeds 3MB limit.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setTransferAttachmentError(isRtl ? '⚠️ نوع الملف غير مدعوم. يرجى إرفاق صورة (JPG/PNG) أو ملف (PDF).' : 'Unsupported file type. Upload image or PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTransferAttachmentData(reader.result as string);
      setTransferAttachmentName(file.name);
      setTransferAttachmentType(file.type);
      setTransferAttachmentSize(file.size);
    };
    reader.readAsDataURL(file);
  };

  // Administrative Sector options
  const SECTORS = [
    'منطقة المدينة المنورة (المقر الرئيسي)',
    'محافظة ينبع',
    'محافظة الحناكية',
    'محافظة العلا',
    'محافظة بدر',
    'محافظة خيبر',
    'محافظة مهد الذهب',
    'محافظة العيص',
    'محافظة وادي الفرع'
  ];

  // Helper: dynamic grades based on stage
  const getGradesForStage = (selectedStage: string) => {
    if (isRtl) {
      switch (selectedStage) {
        case 'EarlyChildhood':
        case 'Kindergarten':
          return ['المستوى الأول (روضة)', 'المستوى الثاني (روضة)', 'المستوى الثالث (روضة)'];
        case 'Primary':
          return [
            'الصف الأول الابتدائي',
            'الصف الثاني الابتدائي',
            'الصف الثالث الابتدائي',
            'الصف الرابع الابتدائي',
            'الصف الخامس الابتدائي',
            'الصف السادس الابتدائي'
          ];
        case 'Intermediate':
          return ['الصف الأول المتوسط', 'الصف الثاني المتوسط', 'الصف الثالث المتوسط'];
        case 'Secondary':
          return ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'];
        default:
          return [];
      }
    } else {
      switch (selectedStage) {
        case 'EarlyChildhood':
        case 'Kindergarten':
          return ['Level 1 (KG)', 'Level 2 (KG)', 'Level 3 (KG)'];
        case 'Primary':
          return ['1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade'];
        case 'Intermediate':
          return ['1st Intermediate', '2nd Intermediate', '3rd Intermediate'];
        case 'Secondary':
          return ['1st Secondary', '2nd Secondary', '3rd Secondary'];
        default:
          return [];
      }
    }
  };

  // Phase 1: Form Validation
  const validatePhase1 = () => {
    const newErrors: Record<string, string> = {};

    if (!beneficiaryName.trim()) {
      newErrors.beneficiaryName = isRtl ? 'يرجى إدخال اسم المستفيد / الطالب كاملاً' : 'Please enter full beneficiary / student name';
    }

    if (!parentName.trim()) {
      newErrors.parentName = isRtl ? 'يرجى إدخال اسم ولي الأمر كاملاً' : 'Please enter full parent name';
    }

    const phoneRegex = /^(05|5)\d{8}$/;
    if (!phoneNumber) {
      newErrors.phoneNumber = isRtl ? 'يرجى إدخال رقم الهاتف المحمول' : 'Please enter phone number';
    } else if (!phoneRegex.test(phoneNumber.trim())) {
      newErrors.phoneNumber = isRtl ? 'رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام' : 'Phone number must start with 05 and be 10 digits';
    }

    if (!nationality.trim()) {
      newErrors.nationality = isRtl ? 'يرجى اختيار جنسية المستفيد' : 'Please select nationality';
    }

    if (residencyType === 'other' && !customResidencyType.trim()) {
      newErrors.customResidencyType = isRtl ? 'يرجى توضيح نوع الإقامة بالتفصيل' : 'Please specify custom residency type';
    }

    if (!gender) {
      newErrors.gender = isRtl ? 'يرجى اختيار جنس الطالب / الطالبة' : 'Please select gender';
    }

    if (isTransferMode && !requestPath) {
      newErrors.requestPath = isRtl ? 'يرجى تحديد صفة ومسار الطلب' : 'Please select request path';
    }

    if (isTransferMode && requestPath === 'transfer') {
      // School Transfer branch
      if (!stage) {
        newErrors.stage = isRtl ? 'يرجى اختيار المرحلة الدراسية' : 'Please select educational stage';
      }
      if (!grade) {
        newErrors.grade = isRtl ? 'يرجى اختيار الصف الدراسي' : 'Please select classroom grade';
      }
      if (!sector) {
        newErrors.sector = isRtl ? 'يرجى اختيار القطاع الإداري' : 'Please select administrative sector';
      }
      if (!neighborhood.trim()) {
        newErrors.neighborhood = isRtl ? 'يرجى كتابة اسم الحي السكني' : 'Please enter neighborhood name';
      }
      if (!schoolName.trim()) {
        newErrors.schoolName = isRtl ? 'يرجى إدخال/اختيار المدرسة المطلوب النقل لها' : 'Please select target transfer school';
      }
      if (!transferReason) {
        newErrors.transferReason = isRtl ? 'يرجى اختيار سبب النقل' : 'Please select reason for transfer';
      }
      if (transferReason === 'other' && !transferReasonCustom.trim()) {
        newErrors.transferReasonCustom = isRtl ? 'يرجى تحديد سبب النقل بالتفصيل' : 'Please specify custom transfer reason';
      }
      if (!contactedSchool) {
        newErrors.contactedSchool = isRtl ? 'يرجى تحديد ما إذا تم التواصل مع المدرسة' : 'Please state if you contacted school';
      }
      if (contactedSchool === 'yes' && !schoolFeedback.trim()) {
        newErrors.schoolFeedback = isRtl ? 'يرجى كتابة إفادة المدرسة المستلمة بالتفصيل' : 'Please write school feedback';
      }
      if (!guardianTransferPledge) {
        newErrors.guardianTransferPledge = isRtl ? 'تأكيد الإقرار والتعهد شرط أساسي لإكمال الإجراء' : 'Confirmation of the pledge is a basic requirement to complete the procedure';
      }
      if (!agreedToAlternativeSchoolPlacement) {
        newErrors.agreedToAlternativeSchoolPlacement = isRtl ? 'تأكيد الإقرار والتعهد شرط أساسي لإكمال الإجراء' : 'Confirmation of the pledge is a basic requirement to complete the procedure';
      }
    } else if (isTransferMode && requestPath === 'equivalency') {
      // Equivalency branch
      if (!equalizationStage) {
        newErrors.equalizationStage = isRtl ? 'يرجى اختيار نوع المعادلة المطلوب' : 'Please select equalization stage';
      }
      if (equalizationStage === 'other_qualification' && !equalizationOtherQualification.trim()) {
        newErrors.equalizationOtherQualification = isRtl ? 'يرجى كتابة أخر مؤهل أو شهادة حاصل عليها الطالب' : 'Please write the last qualification or certificate obtained';
      }
      if (!agreedToAlternativeSchoolPlacement) {
        newErrors.agreedToAlternativeSchoolPlacement = isRtl ? 'تأكيد الإقرار والتعهد شرط أساسي لإكمال الإجراء' : 'Confirmation of the pledge is a basic requirement to complete the procedure';
      }
    } else if (!isTransferMode) {
      // Standard Request Validation
      if (studentCategoryType === 'non_fresh') {
        if (!equalizationStage) {
          newErrors.equalizationStage = isRtl ? 'يرجى اختيار نوع المعادلة المطلوب' : 'Please select equalization stage';
        }
        if (equalizationStage === 'other_qualification' && !equalizationOtherQualification.trim()) {
          newErrors.equalizationOtherQualification = isRtl ? 'يرجى كتابة أخر مؤهل أو شهادة حاصل عليها الطالب' : 'Please write the last qualification or certificate obtained';
        }
        if (!schoolName.trim()) {
          newErrors.schoolName = isRtl ? 'يرجى اختيار/إدخال المدرسة الأساسية المرغوبة للالتحاق بعد المعادلة' : 'Please select desired primary school for enrollment after equalization';
        }
      } else {
        // Fresh Student validation
        if (!stage) {
          newErrors.stage = isRtl ? 'يرجى اختيار المرحلة الدراسية' : 'Please select educational stage';
        }

        if (!grade) {
          newErrors.grade = isRtl ? 'يرجى اختيار الصف الدراسي' : 'Please select classroom grade';
        }

        if (!sector) {
          newErrors.sector = isRtl ? 'يرجى اختيار القطاع الإداري' : 'Please select administrative sector';
        }

        if (!neighborhood.trim()) {
          newErrors.neighborhood = isRtl ? 'يرجى كتابة اسم الحي السكني' : 'Please enter neighborhood name';
        }

        if (!schoolName.trim()) {
          newErrors.schoolName = isRtl ? 'يرجى إدخال اسم المدرسة المعنية' : 'Please enter school name';
        }
      }
      if (!agreedToAlternativeSchoolPlacement) {
        newErrors.agreedToAlternativeSchoolPlacement = isRtl ? 'تأكيد الإقرار والتعهد شرط أساسي لإكمال الإجراء' : 'Confirmation of the pledge is a basic requirement to complete the procedure';
      }
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  // Phase 1 Form Submission
  const handlePhase1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const { isValid, newErrors } = validatePhase1();

    if (!isValid) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const element = document.getElementById(`field-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      if (isTransferMode) {
        const transferReasonLabelMap: Record<string, string> = {
          'registered_unlisted_desire': 'مسجل في رغبة غير مدرجة من قبلي ( تتطلب الاثبات )',
          'registered_far_residence': 'مسجل في رغبة بعيدة عن السكن ( تتطلب الاثبات )',
          'school_in_same_neighborhood': 'المدرسة في نفس الحي الذي أسكن به ( تتطلب الاثبات )',
          'other': transferReasonCustom ? `أخرى: ${transferReasonCustom.trim()}` : 'سبب آخر'
        };

        const isEq = requestPath === 'equivalency';
        const eqStageMapped = equalizationStage === 'primary' ? 'Primary' : equalizationStage === 'intermediate' ? 'Intermediate' : equalizationStage === 'secondary' ? 'Secondary' : 'Other Qualification';
        const eqStageLabelAr = equalizationStage === 'primary' ? 'المرحلة الابتدائية' : equalizationStage === 'intermediate' ? 'المرحلة المتوسطة' : equalizationStage === 'secondary' ? 'المرحلة الثانوية' : (equalizationOtherQualification || 'مؤهل آخر');

        const response = onSubmit({
          beneficiaryName: beneficiaryName.trim(),
          parentName: parentName.trim() || undefined,
          phoneNumber: phoneNumber.trim(),
          nationality: nationality.trim(),
          residencyType: residencyType || undefined,
          customResidencyType: residencyType === 'other' ? customResidencyType.trim() : undefined,
          studentCategoryType: 'non_fresh',
          isNonFreshStudent: true,
          isEqualizationRequest: isEq,
          equalizationStage: isEq ? (equalizationStage === 'other_qualification' ? equalizationOtherQualification : equalizationStage) : undefined,

          serviceType: isEq ? 'registration' : 'transfer',
          transferReason: isEq ? undefined : (transferReasonLabelMap[transferReason] || transferReason),
          transferReasonCustom: isEq ? undefined : (transferReason === 'other' ? transferReasonCustom.trim() : undefined),
          transferAttachmentName: (transferAttachmentName || undefined),
          transferAttachmentData: (transferAttachmentData || undefined),
          transferAttachmentType: (transferAttachmentType || undefined),
          transferAttachmentSize: (transferAttachmentSize || undefined),
          guardianTransferPledge: isEq ? undefined : guardianTransferPledge,

          stage: isEq ? eqStageMapped : stage,
          sector: isEq ? 'منطقة المدينة المنورة (المقر الرئيسي)' : (sector || 'منطقة المدينة المنورة (المقر الرئيسي)'),
          schoolName: isEq ? `وحدة القبول والشهادات (${eqStageLabelAr})` : schoolName.trim(),
          firstSchoolName: schoolName.trim(),
          firstSchoolCode: schoolCode.trim() || undefined,
          schoolCode: (schoolCode.trim() || undefined),
          secondSchoolName: (secondSchoolName.trim() || undefined),
          thirdSchoolName: (thirdSchoolName.trim() || undefined),
          agreedToAlternativeSchoolPlacement: isEq ? true : agreedToAlternativeSchoolPlacement,
          problemType: isEq ? 'other' : 'unregistered_desire',
          requestType: isEq ? 'equivalency' : 'transfer',
          serviceEmployee: '',
          isResolved: false,
          staffSatisfaction: 0,
          receptionSatisfaction: 0,
          notes: isEq 
            ? `🎓 طلب معادلة شهادة ومؤهل لـ (${eqStageLabelAr}). ${equalizationNotes ? 'تفاصيل المؤهل: ' + equalizationNotes.trim() : ''}`
            : `🔄 طلب نقل طالب إلى مدرسة (${schoolName.trim()}). السبب: ${transferReasonLabelMap[transferReason] || transferReason}`,
          isOfflineCreated: !isOnline,

          gender: gender ? (gender as 'boys' | 'girls') : 'boys',
          grade: isEq ? `معادلة ${eqStageLabelAr}` : grade,
          neighborhood: neighborhood.trim() || undefined,
          contactedSchool: isEq ? 'no' : ((contactedSchool as 'yes' | 'no') || 'no'),
          schoolFeedback: (!isEq && contactedSchool === 'yes') ? schoolFeedback.trim() : undefined,
          isVacancyRequest: false,
          vacancyRequestStatus: undefined
        });

        setCreatedSurvey(response);
        setIsSubmitting(false);
        setIsSuccess(true);
        return;
      }

      // Standard Flow Submission
      const isEq = studentCategoryType === 'non_fresh' && Boolean(equalizationStage && (equalizationStage as string) !== '');
      const isVac = !isEq && problemType === 'vacancies_unavailable';

      const eqStageMapped = equalizationStage === 'primary' ? 'Primary' : equalizationStage === 'intermediate' ? 'Intermediate' : equalizationStage === 'secondary' ? 'Secondary' : 'Other Qualification';
      const eqStageLabelAr = equalizationStage === 'primary' ? 'المرحلة الابتدائية' : equalizationStage === 'intermediate' ? 'المرحلة المتوسطة' : equalizationStage === 'secondary' ? 'المرحلة الثانوية' : (equalizationOtherQualification || 'مؤهل آخر');

      const response = onSubmit({
        beneficiaryName: beneficiaryName.trim(),
        parentName: parentName.trim() || undefined,
        studentAge: studentAge.trim() || undefined,
        phoneNumber: phoneNumber.trim(),
        nationality: nationality.trim(),
        residencyType: residencyType || undefined,
        customResidencyType: residencyType === 'other' ? customResidencyType.trim() : undefined,
        studentCategoryType,
        isNonFreshStudent: false,
        isEqualizationRequest: isEq,
        equalizationStage: isEq ? (equalizationStage === 'other_qualification' ? equalizationOtherQualification : equalizationStage) : undefined,

        stage: isEq ? eqStageMapped : stage,
        sector: sector || 'منطقة المدينة المنورة (المقر الرئيسي)',
        schoolName: (schoolName.trim()) ? schoolName.trim() : (isEq ? `وحدة القبول والشهادات (${eqStageLabelAr})` : schoolName.trim()),
        firstSchoolName: schoolName.trim() || undefined,
        firstSchoolCode: schoolCode.trim() || undefined,
        schoolCode: (schoolCode.trim() || undefined),
        problemType: isEq ? 'other' : (problemType as ProblemType),
        serviceEmployee: '',
        isResolved: false,
        unresolvedReason: undefined,
        staffSatisfaction: 0,
        receptionSatisfaction: 0,
        notes: isEq 
          ? `🎓 طلب معادلة شهادة ومؤهل لـ (${eqStageLabelAr}). ${equalizationNotes ? 'تفاصيل المؤهل: ' + equalizationNotes.trim() : ''}`
          : notes,
        isOfflineCreated: !isOnline,

        gender: gender ? (gender as 'boys' | 'girls') : 'boys',
        grade: isEq ? `معادلة ${eqStageLabelAr}` : grade,
        neighborhood: neighborhood.trim() || undefined,
        contactedSchool: 'no',
        schoolFeedback: undefined,
        otherProblemDetails: isEq 
          ? `طلب معادلة شهادة دراسية للمرحلة (${eqStageLabelAr})` 
          : (problemType === 'other' ? otherProblemDetails.trim() : undefined),
        secondSchoolName: (secondSchoolName.trim() || undefined),
        thirdSchoolName: (thirdSchoolName.trim() || undefined),
        agreedToAlternativeSchoolPlacement: agreedToAlternativeSchoolPlacement,
        isVacancyRequest: false,
        vacancyRequestStatus: undefined,
        requestType: isEq ? 'equivalency' : 'registration'
      });

      setCreatedSurvey(response);
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  // Phase 2: Evaluation Validation
  const validateEvaluation = () => {
    const newErrors: Record<string, string> = {};

    if (isResolved === null) {
      newErrors.isResolved = isRtl ? 'يرجى الإجابة عما إذا تم معالجة طلبك' : 'Please answer if your request was resolved';
    }

    if (isResolved === false && !unresolvedReason.trim()) {
      newErrors.unresolvedReason = isRtl ? 'يرجى إدخال سبب عدم حل الشكوى' : 'Please write down unresolved explanation';
    }

    if (staffSatisfaction === 0) {
      newErrors.staffSatisfaction = isRtl ? 'يرجى تقييم رضاك عن الموظف' : 'Please rate staff satisfaction';
    }

    if (receptionSatisfaction === 0) {
      newErrors.receptionSatisfaction = isRtl ? 'يرجى تقييم رضاك عن جودة الاستقبال والتوجيه' : 'Please rate reception satisfaction';
    }

    setEvalErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  // Phase 2 Evaluation Submission
  const handleEvaluationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { isValid, newErrors } = validateEvaluation();

    if (!isValid) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const element = document.getElementById(`eval-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!createdSurvey) return;

    // Simulate final response update
    const updatedSurvey: SurveyResponse = {
      ...createdSurvey,
      isResolved: isResolved!,
      unresolvedReason: isResolved === false ? unresolvedReason.trim() : undefined,
      staffSatisfaction,
      receptionSatisfaction,
      notes: notes.trim()
    };

    onUpdateSurvey(updatedSurvey);
    setEvalSubmitted(true);

    const hasNegativeFeedback = staffSatisfaction < 3 || receptionSatisfaction < 3;
    if (hasNegativeFeedback) {
      setShowNegativeAlert(true);
    }
  };

  // Reset & start new application
  const handleResetAll = () => {
    setBeneficiaryName('');
    setPhoneNumber('');
    setGender('');
    setStage('');
    setGrade('');
    setSector('');
    setNeighborhood('');
    setSchoolName('');
    setProblemType('');
    setOtherProblemDetails('');
    setContactedSchool('');
    setSchoolFeedback('');

    // Phase 2 resetting
    setIsResolved(null);
    setUnresolvedReason('');
    setStaffSatisfaction(0);
    setReceptionSatisfaction(0);
    setNotes('');

    setErrors({});
    setEvalErrors({});
    setCreatedSurvey(null);
    setIsSuccess(false);
    setShowEvaluation(false);
    setEvalSubmitted(false);
    setShowNegativeAlert(false);
  };

  // -----------------------------------------------------------------
  // SUCCESS VIEW (Phase 1 Completed)
  // -----------------------------------------------------------------
  if (isSuccess) {
    return (
      <div className="max-w-3xl mx-auto my-6 sm:my-10 px-4 sm:px-0">
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          className={`border rounded-3xl shadow-xl overflow-hidden ${
            isDark ? 'bg-teal-950/60 border-teal-800/40 text-white' : 'bg-white border-slate-200/80'
          }`}
        >
          {/* Top visual confirmation band */}
          <div className="bg-gradient-to-r from-[#218caa] via-[#2883a4] to-[#3078a6] p-8 text-center text-white relative">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white mb-4 shadow-inner backdrop-blur-xs">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-sans mb-1">
              {isRtl ? 'تم ارسال الطلب بنجاح ويمكنك متابعة الطلب بالإسم المسجل كاملاً' : 'Request sent successfully! You can track your request using your full registered name.'}
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm">
              {isRtl
                ? 'تم تسجيل طلبك وتوليد رقم بلاغ فريد مشفر بالكامل في قاعدة البيانات.'
                : 'Your ticket has been recorded with a secure custom encrypted ID.'}
            </p>

            <div className="absolute top-4 left-4 font-mono text-[10px] bg-black/20 text-white/80 px-2 py-1 rounded-md">
              #{createdSurvey?.id}
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Summary of what they just submitted */}
            <div className={`p-5 rounded-2xl border text-sm space-y-4 ${
              isDark ? 'bg-[#032e2d]/60 border-teal-800/30' : 'bg-slate-50/75 border-slate-100'
            }`}>
              <h4 className={`font-bold flex items-center gap-2 border-b pb-2 ${isDark ? 'text-teal-300 border-teal-800/30' : 'text-slate-800 border-slate-200/60'}`}>
                <FileText className="w-4 h-4 text-teal-500" />
                {isRtl ? 'ملخص بيانات الطلب المسجل:' : 'Registered Request Summary:'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">{isRtl ? 'اسم المستفيد: ' : 'Beneficiary Name: '}</span>
                  <span className={`font-bold ${isDark ? 'text-teal-100' : 'text-slate-800'}`}>{createdSurvey?.beneficiaryName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{isRtl ? 'رقم الجوال: ' : 'Mobile Number: '}</span>
                  <span className="font-mono font-bold text-slate-500">{createdSurvey?.phoneNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{isRtl ? 'المرحلة / الصف: ' : 'Stage & Grade: '}</span>
                  <span className={`font-bold ${isDark ? 'text-teal-100' : 'text-slate-800'}`}>
                    {createdSurvey?.stage === 'Primary' ? t.stagePrimary : createdSurvey?.stage === 'Intermediate' ? t.stageIntermediate : createdSurvey?.stage === 'Secondary' ? t.stageSecondary : createdSurvey?.stage === 'EarlyChildhood' ? t.stageEarlyChildhood : t.stageKindergarten}
                    {createdSurvey?.grade ? ` - ${createdSurvey.grade}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{isRtl ? 'الجنس: ' : 'Gender: '}</span>
                  <span className={`font-bold ${isDark ? 'text-teal-100' : 'text-slate-800'}`}>
                    {createdSurvey?.gender === 'boys' ? (isRtl ? 'بنين' : 'Boys') : (isRtl ? 'بنات' : 'Girls')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{isRtl ? 'القطاع والحي: ' : 'Sector & Neighborhood: '}</span>
                  <span className={`font-bold ${isDark ? 'text-teal-100' : 'text-slate-800'}`}>{createdSurvey?.sector} - {createdSurvey?.neighborhood}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{isRtl ? 'المدرسة المعنية: ' : 'Target School: '}</span>
                  <span className={`font-bold ${isDark ? 'text-teal-100' : 'text-slate-800'}`}>{createdSurvey?.schoolName}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-slate-400 font-medium">{isRtl ? 'نوع الطلب الرئيسي: ' : 'Main Request Type: '}</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {createdSurvey?.problemType === 'distance_from_school' ? (isRtl ? 'نقل بسبب بعد السكن عن المدرسة' : 'Transfer due to school distance') : t[`prob${createdSurvey?.problemType?.charAt(0).toUpperCase()}${createdSurvey?.problemType?.slice(1)}` as keyof typeof t] || createdSurvey?.problemType}
                  </span>
                  {createdSurvey?.otherProblemDetails && (
                    <div className="mt-1.5 p-2 bg-slate-100 dark:bg-teal-900/40 rounded-lg text-slate-600 dark:text-teal-200 text-xs font-serif italic">
                      &ldquo;{createdSurvey.otherProblemDetails}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Split Page Feature: Track & Evaluate Action Box */}
            <div className="border-t pt-8">
              {!showEvaluation ? (
                // Interactive trigger to open tracking/eval stage
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className={`p-6 rounded-2xl border text-center cursor-pointer transition-all shadow-md hover:shadow-lg ${
                    isDark
                      ? 'bg-[#063d3b]/50 border-teal-700/40 hover:bg-[#0b4a48]/60 text-white'
                      : 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50 text-slate-900'
                  }`}
                  onClick={() => setShowEvaluation(true)}
                  id="btn-track-and-evaluate"
                >
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mb-3">
                    <ClipboardList className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg mb-1 flex items-center justify-center gap-1.5">
                    {isRtl ? 'متابعة الطلب والتقييم' : 'Track Request and Evaluate'}
                  </h3>
                  <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                    {isRtl
                      ? 'انقر هنا لفتح نافذة المتابعة الحية ومراجعة حالة الطلب الحالي، وتقديم تقييم مستويات الرضا المباشر عن الخدمة المقدمة.'
                      : 'Click here to access live request tracking and submit detailed service satisfaction evaluation.'}
                  </p>
                </motion.div>
              ) : (
                // Evaluation flow rendered inline upon clicking tracking
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`p-6 rounded-3xl border ${
                    isDark ? 'bg-teal-950/40 border-teal-800/40' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 border-b pb-4 mb-6">
                    <span className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-md">
                      <ClipboardList className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-slate-800 dark:text-teal-200 text-base sm:text-lg">
                        {isRtl ? 'بوابة متابعة وتحديث الطلب والتقييم' : 'Request Tracker & Evaluation Desk'}
                      </h3>
                      <p className="text-slate-400 text-xs">
                        {isRtl ? 'متابعة حالة المعاملة + تقديم استبانة قياس جودة الاستقبال وفاعلية المعالجة' : 'Track resolution, rate staff response and reception quality.'}
                      </p>
                    </div>
                  </div>

                  {/* Tracking Status indicator */}
                  <div className={`p-4 rounded-xl mb-6 flex items-center justify-between border ${
                    isDark ? 'bg-[#03302f] border-teal-800/30' : 'bg-white border-slate-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-300">{isRtl ? 'حالة الطلب الحالية:' : 'Live Status:'}</span>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full">
                      {isRtl ? 'قيد المراجعة والتدقيق' : 'Under Active Review'}
                    </span>
                  </div>

                  {/* Final Evaluation submitted state */}
                  {evalSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 bg-emerald-600 text-white rounded-2xl text-center space-y-3"
                    >
                      <ThumbsUp className="w-8 h-8 mx-auto text-emerald-100 animate-bounce" />
                      <h4 className="font-bold text-base">{isRtl ? 'شكراً جزيلاً لتقييمك!' : 'Thank you for your rating!'}</h4>
                      <p className="text-xs text-emerald-100 leading-relaxed max-w-md mx-auto">
                        {isRtl
                          ? 'تم حفظ تقييمك لمستوى الرضا وحالة المعالجة وتحديثها بنجاح في قاعدة البيانات ومزامنتها فورياً مع مسؤولي الجودة.'
                          : 'Your satisfaction score has been updated in our system and synced with quality management.'}
                      </p>

                      {showNegativeAlert && (
                        <div className="p-3 bg-teal-950/40 text-teal-200 text-xs rounded-xl border border-teal-800/40 text-right flex items-start gap-2.5 flex-row-reverse">
                          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">
                            {t.negativeAlertWarning}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    // The evaluation questions moved here
                    <form onSubmit={handleEvaluationSubmit} className="space-y-6">
                      
                      {/* Question 1: Is Resolved */}
                      <div id="eval-isResolved" className="space-y-3">
                        <label className="block text-sm font-bold text-slate-700 dark:text-teal-200">
                          {t.isResolved} <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3 max-w-md">
                          <button
                            type="button"
                            onClick={() => {
                              setIsResolved(true);
                              setUnresolvedReason('');
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-bold text-xs sm:text-sm rounded-xl border transition-all cursor-pointer ${
                              isResolved === true
                                ? 'bg-teal-600 border-teal-600 text-white shadow-md'
                                : 'bg-white dark:bg-teal-900/20 border-slate-200 dark:border-teal-800/40 text-slate-600 dark:text-teal-300 hover:bg-slate-50'
                            }`}
                          >
                            {t.yes}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsResolved(false)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-bold text-xs sm:text-sm rounded-xl border transition-all cursor-pointer ${
                              isResolved === false
                                ? 'bg-amber-600 border-amber-600 text-white shadow-md'
                                : 'bg-white dark:bg-teal-900/20 border-slate-200 dark:border-teal-800/40 text-slate-600 dark:text-teal-300 hover:bg-slate-50'
                            }`}
                          >
                            {t.no}
                          </button>
                        </div>
                        {evalErrors.isResolved && (
                          <p className="text-xs text-red-500 font-semibold">{evalErrors.isResolved}</p>
                        )}

                        {/* Unresolved Reason */}
                        <AnimatePresence>
                          {isResolved === false && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden space-y-2 mt-2"
                              id="eval-unresolvedReason"
                            >
                              <label className="block text-xs font-bold text-slate-700 dark:text-teal-200">
                                {t.unresolvedReasonLabel} <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={unresolvedReason}
                                onChange={(e) => setUnresolvedReason(e.target.value)}
                                placeholder={t.unresolvedReasonPlaceholder}
                                className={`w-full px-4 py-2.5 bg-white dark:bg-teal-950/60 text-slate-900 dark:text-white text-xs sm:text-sm font-medium rounded-xl border transition-all outline-none focus:ring-2 ${
                                  evalErrors.unresolvedReason
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                    : 'border-slate-200 dark:border-teal-800/40 focus:border-emerald-500 focus:ring-emerald-100'
                                }`}
                                rows={2}
                                dir={isRtl ? 'rtl' : 'ltr'}
                              />
                              {evalErrors.unresolvedReason && (
                                <p className="text-xs text-red-500 font-semibold">{evalErrors.unresolvedReason}</p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Question 2: Satisfaction Star Ratings */}
                      <div className="space-y-6 pt-2 border-t border-slate-200/50 dark:border-teal-800/20">
                        <h4 className="text-xs font-extrabold text-slate-500 dark:text-teal-300 tracking-wider">
                          {isRtl ? 'قياس مستويات الرضا والتقييم التفصيلي:' : 'Satisfactory Metrics & Scores:'}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Staff performance stars */}
                          <div id="eval-staffSatisfaction" className="space-y-2">
                            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-teal-200">
                              {t.staffSatisfaction} <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setStaffSatisfaction(star)}
                                  onMouseEnter={() => setStaffHover(star)}
                                  onMouseLeave={() => setStaffHover(0)}
                                  className="p-0.5 cursor-pointer transition-all hover:scale-120 focus:outline-none"
                                >
                                  <Star
                                    className={`w-7.5 h-7.5 ${
                                      star <= (staffHover || staffSatisfaction)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-300 dark:text-teal-900/60'
                                    }`}
                                  />
                                </button>
                              ))}
                              {staffSatisfaction > 0 && (
                                <span className="text-[10px] font-mono font-bold bg-slate-200/60 dark:bg-teal-950 text-slate-600 dark:text-teal-300 px-2 py-0.5 rounded-full">
                                  {staffSatisfaction} / 5
                                </span>
                              )}
                            </div>
                            {evalErrors.staffSatisfaction && (
                              <p className="text-xs text-red-500 font-semibold">{evalErrors.staffSatisfaction}</p>
                            )}
                          </div>

                          {/* Reception quality stars */}
                          <div id="eval-receptionSatisfaction" className="space-y-2">
                            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-teal-200">
                              {t.receptionSatisfaction} <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReceptionSatisfaction(star)}
                                  onMouseEnter={() => setReceptionHover(star)}
                                  onMouseLeave={() => setReceptionHover(0)}
                                  className="p-0.5 cursor-pointer transition-all hover:scale-120 focus:outline-none"
                                >
                                  <Star
                                    className={`w-7.5 h-7.5 ${
                                      star <= (receptionHover || receptionSatisfaction)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-300 dark:text-teal-900/60'
                                    }`}
                                  />
                                </button>
                              ))}
                              {receptionSatisfaction > 0 && (
                                <span className="text-[10px] font-mono font-bold bg-slate-200/60 dark:bg-teal-950 text-slate-600 dark:text-teal-300 px-2 py-0.5 rounded-full">
                                  {receptionSatisfaction} / 5
                                </span>
                              )}
                            </div>
                            {evalErrors.receptionSatisfaction && (
                              <p className="text-xs text-red-500 font-semibold">{evalErrors.receptionSatisfaction}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Question 3: Reviewer general comments */}
                      <div className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-teal-800/20">
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-teal-200">
                          {t.reviewerNotes}
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder={t.notesPlaceholder}
                          rows={3}
                          className="w-full p-3.5 bg-white dark:bg-teal-950/60 text-slate-900 dark:text-white text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-teal-800/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                          dir={isRtl ? 'rtl' : 'ltr'}
                        />
                      </div>

                      {/* Submit evaluation controls */}
                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          <CheckSquare className="w-4 h-4" />
                          <span>{isRtl ? 'إرسال التقييم النهائي والملاحظات' : 'Submit Final Assessment'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer of success card */}
          <div className={`p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isDark ? 'bg-teal-950/40 border-teal-800/40' : 'bg-slate-50 border-slate-100'
          }`}>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <ShieldCheck className="w-4.5 h-4.5 text-teal-600" />
              <span>{isRtl ? 'تشفير وحماية البيانات نشطة' : 'Advanced SHA-256 local lock active'}</span>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={handleResetAll}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-all"
              >
                {isRtl ? 'تقديم طلب جديد' : 'Submit Another Request'}
              </button>

              {onBackToPortal && (
                <button
                  onClick={onBackToPortal}
                  className={`flex-1 sm:flex-initial px-5 py-2.5 border font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    isDark
                      ? 'bg-teal-900/30 border-teal-800/50 text-teal-300 hover:bg-teal-900/50'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Home className="w-4 h-4 text-slate-400" />
                  <span>{t.goBackPortal}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // PRIMARY ENTRY VIEW: SUBMISSION FORM (Phase 1)
  // -----------------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto my-6 sm:my-10 px-4 sm:px-0">
      
      {/* Intro Header */}
      <div className="text-center mb-8">
        <h2 className={`text-xl sm:text-3xl font-black font-sans mb-2 ${isDark ? 'text-teal-200' : 'text-slate-900'}`}>
          {currentFormTitle}
        </h2>
        <p className={`text-xs sm:text-base max-w-xl mx-auto leading-relaxed ${isDark ? 'text-teal-300/80' : 'text-slate-500'}`}>
          {currentFormSubtitle}
        </p>
      </div>

      {/* Age Verification Notification / Action Banner (Hidden in Transfer Mode) */}
      {!isTransferMode && (
        <div className={`p-4 rounded-2xl border mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
          verifiedAgeInfo
            ? verifiedAgeInfo.status === 'direct'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200'
            : 'bg-teal-500/10 border-teal-500/30 text-teal-900 dark:text-teal-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              verifiedAgeInfo?.status === 'direct'
                ? 'bg-emerald-600 text-white'
                : verifiedAgeInfo?.status === 'exemption'
                  ? 'bg-amber-600 text-white'
                  : 'bg-teal-600 text-white'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black">
                {verifiedAgeInfo
                  ? isRtl
                    ? `🛡️ حالة التثبت النظامي من السن: ${verifiedAgeInfo.stageName}`
                    : `🛡️ Age Verification Status: ${verifiedAgeInfo.stageName}`
                  : isRtl
                    ? '🛡️ التثبت النظامي من السن للقبول والتسجيل (الصف الأول الابتدائي)'
                    : '🛡️ Primary Grade 1 Age Verification Checklist'}
              </div>
              <div className="text-[11px] font-semibold opacity-90 mt-0.5">
                {verifiedAgeInfo
                  ? verifiedAgeInfo.status === 'direct'
                    ? (isRtl ? `تاريخ الميلاد: ${verifiedAgeInfo.birthDate} - القبول المباشر (6 سنوات فأكثر) ✓` : `DOB: ${verifiedAgeInfo.birthDate} - Direct Admission ✓`)
                    : (isRtl ? `تاريخ الميلاد: ${verifiedAgeInfo.birthDate} - فترة التجاوز الـ 90 يوماً (مقر بشرط إتمام الروضة) ✓` : `DOB: ${verifiedAgeInfo.birthDate} - Exemption with KG declaration ✓`)
                  : (isRtl ? 'انقر هنا للتحقق التلقائي والدقيق من السن النظامي للقبول والتأكد من استيفاء الشروط.' : 'Click to verify student age according to Ministry guidelines.')}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAgeModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-black bg-teal-600 hover:bg-teal-700 text-white cursor-pointer transition-all shrink-0 hover:scale-105 shadow-xs"
          >
            {verifiedAgeInfo ? (isRtl ? 'إعادة التثبت من السن 🔄' : 'Re-verify Age 🔄') : (isRtl ? 'التحقق من السن النظامي 🛡️' : 'Verify Age 🛡️')}
          </button>
        </div>
      )}

      {/* Form Content */}
      <form
        onSubmit={handlePhase1Submit}
        className={`border shadow-lg rounded-3xl p-6 sm:p-10 space-y-8 ${
          isDark ? 'bg-teal-950/60 border-teal-800/40 text-white' : 'bg-white border-slate-200/80'
        }`}
        id="survey-form"
      >
        
        {/* Section 1: Beneficiary Info */}
        <div>
          <div className={`flex items-center gap-2 mb-6 border-b pb-3 ${isDark ? 'border-teal-800/40' : 'border-slate-100'}`}>
            <span className="p-2 bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <User className="w-4.5 h-4.5" />
            </span>
            <h3 className="font-extrabold text-base sm:text-lg">
              {isRtl ? 'بيانات الطالب وولي الأمر' : 'Student & Parent Information'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Name */}
            <div id="field-beneficiaryName">
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-teal-200 mb-2">
                {isRtl ? 'اسم المستفيد / الطالب كاملاً' : 'Full Beneficiary / Student Name'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  placeholder={isRtl ? 'أدخل اسم الطالب / المستفيد كاملاً' : 'Enter student full name'}
                  className={`w-full pl-10 pr-4 py-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all outline-none focus:ring-2 ${
                    isDark ? 'bg-teal-950/60 text-white focus:bg-teal-950' : 'bg-slate-50 focus:bg-white text-slate-900'
                  } ${
                    errors.beneficiaryName
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-200 dark:border-teal-800/40 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
              </div>
              {errors.beneficiaryName && (
                <p className="mt-1.5 text-xs text-red-500 font-bold">{errors.beneficiaryName}</p>
              )}
            </div>

            {/* Parent Name */}
            <div id="field-parentName">
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-teal-200 mb-2">
                {isRtl ? 'اسم ولي الأمر كاملاً' : 'Full Parent Name'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder={isRtl ? 'أدخل اسم ولي الأمر كاملاً' : 'Enter parent full name'}
                  className={`w-full pl-10 pr-4 py-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all outline-none focus:ring-2 ${
                    isDark ? 'bg-teal-950/60 text-white focus:bg-teal-950' : 'bg-slate-50 focus:bg-white text-slate-900'
                  } ${
                    errors.parentName
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-200 dark:border-teal-800/40 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
              </div>
              {errors.parentName && (
                <p className="mt-1.5 text-xs text-red-500 font-bold">{errors.parentName}</p>
              )}
            </div>

            {/* Phone Number */}
            <div id="field-phoneNumber">
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-teal-200 mb-2">
                {isRtl ? 'رقم الهاتف المحمول' : 'Mobile Phone Number'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  className={`w-full pl-10 pr-4 py-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all outline-none focus:ring-2 ${
                    isDark ? 'bg-teal-950/60 text-white' : 'bg-slate-50 text-slate-900'
                  } ${
                    errors.phoneNumber
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-200 dark:border-teal-800/40 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                  dir="ltr"
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1.5 text-xs text-red-500 font-bold">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Student Age (Hidden in Transfer Mode) */}
            {/* Nationality (الجنسية مع قائمة منسدلة قابلة للبحث) */}
            <div id="field-nationality" className="relative">
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-teal-200 mb-2">
                {isRtl ? 'الجنسية' : 'Nationality'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Bookmark className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  readOnly
                  onClick={() => setShowNationalityDropdown(!showNationalityDropdown)}
                  value={nationality}
                  placeholder={isRtl ? 'اختر الجنسية...' : 'Select nationality...'}
                  className={`w-full pl-10 pr-4 py-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all outline-none cursor-pointer focus:ring-2 ${
                    isDark ? 'bg-teal-950/60 text-white' : 'bg-slate-50 text-slate-900'
                  } ${
                    errors.nationality
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-200 dark:border-teal-800/40 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Searchable dropdown menu */}
              {showNationalityDropdown && (
                <div className={`absolute z-30 mt-1 w-full rounded-2xl border shadow-xl p-2.5 max-h-60 overflow-y-auto ${
                  isDark ? 'bg-[#002828] border-teal-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <input
                    type="text"
                    value={nationalitySearch}
                    onChange={(e) => setNationalitySearch(e.target.value)}
                    placeholder={isRtl ? '🔍 بحث في قائمة الجنسيات...' : 'Search nationality...'}
                    className={`w-full p-2 mb-2 text-xs font-bold rounded-xl border outline-none ${
                      isDark ? 'bg-[#001c1c] border-teal-800 text-teal-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                    dir={isRtl ? 'rtl' : 'ltr'}
                    autoFocus
                  />
                  <div className="space-y-1">
                    {ALL_NATIONALITIES.filter(n => n.toLowerCase().includes(nationalitySearch.toLowerCase())).map((nat) => (
                      <button
                        key={nat}
                        type="button"
                        onClick={() => {
                          setNationality(nat);
                          setShowNationalityDropdown(false);
                          setNationalitySearch('');
                        }}
                        className={`w-full text-start px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                          nationality === nat
                            ? 'bg-emerald-600 text-white'
                            : isDark ? 'hover:bg-teal-900/60 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        {nat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {errors.nationality && (
                <p className="mt-1.5 text-xs text-red-500 font-bold">{errors.nationality}</p>
              )}
            </div>

            {/* Residency Type (الهوية / الإقامة) */}
            <div id="field-residencyType">
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-teal-200 mb-2">
                {isRtl ? 'الهوية / الإقامة' : 'ID / Residency Type'} <span className="text-red-500">*</span>
              </label>
              <select
                value={residencyType}
                onChange={(e) => setResidencyType(e.target.value as any)}
                className={`w-full px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all outline-none focus:ring-2 ${
                  isDark ? 'bg-teal-950/60 text-white' : 'bg-slate-50 text-slate-900'
                } border-slate-200 dark:border-teal-800/40 focus:border-emerald-500 focus:ring-emerald-100`}
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                <option value="national_id">{isRtl ? 'الهوية الوطنية' : 'National ID'}</option>
                <option value="residency">{isRtl ? 'إقامة' : 'Residency'}</option>
                <option value="visit">{isRtl ? 'زيارة' : 'Visit Visa'}</option>
                <option value="other">{isRtl ? 'أخرى' : 'Other'}</option>
              </select>
            </div>

            {/* Custom Residency Type text input if 'other' */}
            {residencyType === 'other' && (
              <div id="field-customResidencyType" className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-teal-200 mb-2">
                  {isRtl ? 'اكتب نوع الإقامة المخصصة:' : 'Specify Custom Residency Type:'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customResidencyType}
                  onChange={(e) => setCustomResidencyType(e.target.value)}
                  placeholder={isRtl ? 'أدخل نوع الإقامة بالتفصيل...' : 'Enter custom residency type...'}
                  className={`w-full px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all outline-none ${
                    isDark ? 'bg-teal-950/60 text-white' : 'bg-slate-50 text-slate-900'
                  } ${errors.customResidencyType ? 'border-red-500' : 'border-slate-200 dark:border-teal-800/40'}`}
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
                {errors.customResidencyType && (
                  <p className="mt-1.5 text-xs text-red-500 font-bold">{errors.customResidencyType}</p>
                )}
              </div>
            )}

            {/* Student Gender (الجنس: بنين - بنات) */}
            <div id="field-gender" className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-teal-200 mb-2">
                {isRtl ? 'الجنس (للطالب / الطالبة)' : 'Gender (Student)'} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4 max-w-sm">
                <button
                  type="button"
                  onClick={() => setGender('boys')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-extrabold text-xs sm:text-sm rounded-xl border transition-all cursor-pointer ${
                    gender === 'boys'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                      : isDark
                      ? 'bg-teal-900/20 border-teal-800/40 text-teal-300 hover:bg-teal-900/35'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{isRtl ? 'بنين' : 'Boys'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGender('girls')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-extrabold text-xs sm:text-sm rounded-xl border transition-all cursor-pointer ${
                    gender === 'girls'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                      : isDark
                      ? 'bg-teal-900/20 border-teal-800/40 text-teal-300 hover:bg-teal-900/35'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{isRtl ? 'بنات' : 'Girls'}</span>
                </button>
              </div>
              {errors.gender && (
                <p className="mt-1.5 text-xs text-red-500 font-bold">{errors.gender}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section: Student Category Selection (تحديد صفة الطالب المتقدم: مستجد / غير مستجد) */}
        <div className={`p-6 rounded-3xl border ${isDark ? 'bg-teal-950/40 border-teal-800/40' : 'bg-slate-50/80 border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className={`w-5 h-5 ${isDark ? 'text-teal-300' : 'text-emerald-600'}`} />
            <h3 className="font-extrabold text-base sm:text-lg">
              {isRtl ? 'تحديد صفة ومسار الطلب المقدم' : 'Request Status & Category'}
            </h3>
          </div>

          <div className={`grid grid-cols-1 ${isTransferMode ? 'md:grid-cols-2' : ''} gap-4`}>
            {/* Card 1 */}
            <button
              type="button"
              onClick={() => {
                setStudentCategoryType(isTransferMode ? 'non_fresh' : 'fresh');
                setEqualizationStage('');
                if (isTransferMode) setRequestPath('transfer');
              }}
              className={`p-5 rounded-2xl border-2 text-start transition-all cursor-pointer flex flex-col justify-between ${
                (isTransferMode ? (studentCategoryType === 'non_fresh' && equalizationStage === '' && (requestPath === 'transfer' || !requestPath)) : studentCategoryType === 'fresh')
                  ? 'bg-emerald-500/10 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                  : isDark ? 'bg-[#002424] border-teal-800/60 hover:border-teal-700' : 'bg-white border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-black ${(isTransferMode ? (studentCategoryType === 'non_fresh' && equalizationStage === '' && (requestPath === 'transfer' || !requestPath)) : studentCategoryType === 'fresh') ? 'text-emerald-700 dark:text-emerald-400' : isDark ? 'text-white' : 'text-slate-800'}`}>
                  {isTransferMode
                    ? (isRtl ? 'طلب نقل الى مدرسة أخرى - طالب غير مستجد' : 'Transfer to Another School - Non-Fresh Student')
                    : (isRtl ? '🟢 طالب مستجد (تسجيل جديد)' : 'Fresh Student (New Registration)')}
                </span>
                {(isTransferMode ? (studentCategoryType === 'non_fresh' && equalizationStage === '' && (requestPath === 'transfer' || !requestPath)) : studentCategoryType === 'fresh') && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              </div>
              <p className={`text-xs font-semibold leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isTransferMode
                  ? (isRtl ? 'تقديم طلب نقل طالب مقيد سابقاً إلى مدرسة أخرى وتحديد رغبات المدارس وإرفاق الإثباتات اللازمة.' : 'Request school transfer for registered student.')
                  : (isRtl ? 'تسجيل طالب جديد لأول مرة في مراحل التعليم العام وتحديد رغبات المدارس ومتابعة الشواغر.' : 'New student registration for general education stages.')}
              </p>
            </button>

            {/* Card 2 (Only for Transfer Mode) */}
            {isTransferMode && (
              <button
                type="button"
                onClick={() => {
                  if (!hasAcceptedEqGuidelines) {
                    setShowEqGuidelinesModal(true);
                  } else {
                    setStudentCategoryType('non_fresh');
                    setEqualizationStage('primary');
                    setRequestPath('equivalency');
                  }
                }}
                className={`p-5 rounded-2xl border-2 text-start transition-all cursor-pointer flex flex-col justify-between ${
                  studentCategoryType === 'non_fresh' && equalizationStage !== '' && requestPath === 'equivalency'
                    ? 'bg-emerald-500/10 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                    : isDark ? 'bg-[#002424] border-teal-800/60 hover:border-teal-700' : 'bg-white border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-black ${studentCategoryType === 'non_fresh' && equalizationStage !== '' && requestPath === 'equivalency' ? 'text-emerald-700 dark:text-emerald-400' : isDark ? 'text-white' : 'text-slate-800'}`}>
                    {isRtl ? 'طلب معادلة المؤهلات' : 'Qualification Equivalency Request'}
                  </span>
                  {studentCategoryType === 'non_fresh' && equalizationStage !== '' && requestPath === 'equivalency' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                </div>
                <p className={`text-xs font-semibold leading-relaxed ${isDark ? 'text-emerald-200' : 'text-emerald-900'}`}>
                  {isRtl ? 'تقديم طلب معادلة مؤهل دراسي صادر من خارج المملكة أو من نظام تعليمي آخر.' : 'Request certificate equivalency for foreign qualifications.'}
                </p>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic View based on Category Selection */}
        {(studentCategoryType === 'non_fresh' && (!isTransferMode || requestPath === 'equivalency')) ? (
          /* SECTION: EQUALIZATION REQUEST FORM FOR NON-FRESH STUDENTS */
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            className={`p-6 rounded-3xl border space-y-6 ${
              isDark ? 'bg-[#002b2b] border-emerald-800/40 text-white' : 'bg-emerald-50/60 border-emerald-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5 border-b pb-4 dark:border-emerald-800/40">
              <span className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md">
                <GraduationCap className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-black text-base sm:text-lg text-emerald-900 dark:text-emerald-200">
                  {isRtl ? '🎓 قسم تقديم طلبات معادلة الشهادات والمؤهلات' : 'Certificate Equalization Submission'}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5">
                  {isRtl ? 'يحال هذا الطلب مباشرة إلى الموظف المختص والمعتمد لمعادلة الشهادات.' : 'Routed directly to the assigned equalization officer.'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Equalization Stage Dropdown */}
              <div id="field-equalizationStage">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-emerald-200 mb-2">
                  {isRtl ? 'نوع المعادلة للمرحلة المطلوبة' : 'Equalization Stage'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={equalizationStage}
                  onChange={(e) => setEqualizationStage(e.target.value as any)}
                  className={`w-full p-3.5 text-xs sm:text-sm font-bold rounded-xl border outline-none ${
                    isDark ? 'bg-[#001c1c] border-emerald-800 text-white' : 'bg-white border-emerald-300 text-slate-900'
                  } ${errors.equalizationStage ? 'border-red-500' : ''}`}
                  dir={isRtl ? 'rtl' : 'ltr'}
                >
                  <option value="">{isRtl ? '-- اختر نوع المعادلة المطلوب --' : '-- Select Equalization --'}</option>
                  <option value="primary">{isRtl ? 'المعادلة للمرحلة الابتدائية' : 'Primary School Equalization'}</option>
                  <option value="intermediate">{isRtl ? 'المعادلة للمرحلة المتوسطة' : 'Intermediate School Equalization'}</option>
                  <option value="secondary">{isRtl ? 'المعادلة للمرحلة الثانوية' : 'Secondary School Equalization'}</option>
                  <option value="other_qualification">{isRtl ? 'آخر مؤهل أو شهادة حاصل عليها الطالب يكتب من قبل المستفيد' : 'Last qualification or certificate obtained by the student (To be written by beneficiary)'}</option>
                </select>
                {errors.equalizationStage && (
                  <p className="mt-1.5 text-xs text-red-500 font-bold">{errors.equalizationStage}</p>
                )}
              </div>

              {equalizationStage === 'other_qualification' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-emerald-200">
                    {isRtl ? 'اكتب أخر مؤهل أو شهادة حاصل عليها الطالب' : 'Specify Last Qualification/Certificate'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={equalizationOtherQualification}
                    onChange={(e) => setEqualizationOtherQualification(e.target.value)}
                    placeholder={isRtl ? 'مثال: شهادة دبلوم مهني، شهادة إتمام مرحلة من خارج المملكة...' : 'e.g. Vocational Diploma, Certificate from abroad...'}
                    className={`w-full p-3.5 text-xs sm:text-sm font-bold rounded-xl border outline-none ${
                      isDark ? 'bg-[#001c1c] border-emerald-800 text-white' : 'bg-white border-emerald-300 text-slate-900'
                    } ${errors.equalizationOtherQualification ? 'border-red-500' : ''}`}
                    dir={isRtl ? 'rtl' : 'ltr'}
                  />
                  {errors.equalizationOtherQualification && (
                    <p className="text-xs text-red-500 font-bold">{errors.equalizationOtherQualification}</p>
                  )}
                </motion.div>
              )}

              {/* Certificate & Equalization Details Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-emerald-200">
                  {isRtl ? 'تفاصيل ومعلومات المؤهل والشهادة المراد معادلتها (اختياري):' : 'Qualification & Certificate Details (Optional):'}
                </label>
                <textarea
                  rows={3}
                  value={equalizationNotes}
                  onChange={(e) => setEqualizationNotes(e.target.value)}
                  placeholder={isRtl ? 'اكتب الدولة الصادر منها المؤهل، والصف الدراسي السابق لطلب المعادلة...' : 'Enter country of issuance, last completed grade...'}
                  className={`w-full p-3.5 text-xs sm:text-sm font-semibold rounded-xl border outline-none ${
                    isDark ? 'bg-[#0b2336] border-[#218caa]/40 text-white' : 'bg-white border-[#218caa]/30 text-slate-900'
                  }`}
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Preferred School Selection after Equivalency */}
              <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 space-y-4">
                <div id="field-schoolName">
                  <SchoolSelectDropdown
                    schools={activeSchools}
                    value={schoolName}
                    onChange={(name, code) => {
                      setSchoolName(name);
                      if (code) setSchoolCode(code);
                    }}
                    label={isRtl ? 'المدرسة الأساسية المرغوبة للالتحاق بعد المعادلة (الرغبة الأولى)' : 'Desired Primary School After Equalization (1st Choice)'}
                    required
                    isDark={isDark}
                    isRtl={isRtl}
                    error={errors.schoolName}
                    placeholder={isRtl ? '🔍 اختر المدرسة المرغوبة في الالتحاق (الاسم / الرقم الوزاري)...' : 'Search desired school...'}
                    helperText={isRtl ? '💡 حدد المدرسة الأساسية المراد توجيه الطالب لها بعد إنهاء معادلة الشهادة.' : 'Select main target school.'}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SchoolSelectDropdown
                    schools={activeSchools}
                    value={secondSchoolName}
                    onChange={(name) => setSecondSchoolName(name)}
                    label={isRtl ? 'الرغبة الثانية (اختياري)' : '2nd Choice School (Optional)'}
                    isDark={isDark}
                    isRtl={isRtl}
                    placeholder={isRtl ? '🔍 اختر مدرسة الرغبة الثانية...' : 'Search 2nd choice school...'}
                  />

                  <SchoolSelectDropdown
                    schools={activeSchools}
                    value={thirdSchoolName}
                    onChange={(name) => setThirdSchoolName(name)}
                    label={isRtl ? 'الرغبة الثالثة (اختياري)' : '3rd Choice School (Optional)'}
                    isDark={isDark}
                    isRtl={isRtl}
                    placeholder={isRtl ? '🔍 اختر مدرسة الرغبة الثالثة...' : 'Search 3rd choice school...'}
                  />
                </div>

                <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                  isDark ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-200' : 'bg-white border-emerald-200 text-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    id="agreedToAlternativeSchoolPlacementEq"
                    checked={agreedToAlternativeSchoolPlacement}
                    onChange={(e) => setAgreedToAlternativeSchoolPlacement(e.target.checked)}
                    className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="agreedToAlternativeSchoolPlacementEq" className="text-xs font-semibold cursor-pointer leading-relaxed">
                    {isRtl
                      ? 'أتعهد وأوافق كولي أمر على تسكين ابني/ابنتي في أقرب مدرسة متاحة في حال تعذر توفر الشواغر بالرغبات المحددة.'
                      : 'I agree to place my student in the nearest available school if choices are unavailable.'}
                  </label>
                </div>
                {errors.agreedToAlternativeSchoolPlacement && (
                  <p className="text-xs text-red-500 font-bold mt-1 px-1">{errors.agreedToAlternativeSchoolPlacement}</p>
                )}
              </div>

              {/* Submit Equalization Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 text-white text-sm font-black rounded-2xl bg-gradient-to-r from-[#218caa] via-[#2883a4] to-[#3078a6] hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isRtl ? 'جاري تشفير وإرسال طلب المعادلة...' : 'Submitting Equalization...'}</span>
                    </span>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>{isRtl ? 'إرسال طلب المعادلة لموظف القبول المختص 🚀' : 'Submit Equalization Request 🚀'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Section 2: Educational Details */}
            <div>
              <div className={`flex items-center gap-2 mb-6 border-b pb-3 ${isDark ? 'border-teal-800/40' : 'border-slate-100'}`}>
                <span className="p-2 bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <School className="w-4.5 h-4.5" />
                </span>
                <h3 className="font-extrabold text-base sm:text-lg">
                  {isRtl ? 'المدرسة والبيانات التعليمية والقطاع' : 'School Stage, Sector & Location'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Educational Stage Dropdown */}
                <div id="field-stage">
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-teal-200 mb-2">
                    {t.stage} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <GraduationCap className="w-4 h-4" />
                    </span>
                    <select
                      value={stage}
                      onChange={(e) => {
                        setStage(e.target.value);
                        setGrade(''); // reset grade on stage update
                      }}
                      className={`w-full pl-10 pr-4 py-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all outline-none focus:ring-2 ${
                        isDark ? 'bg-teal-950/60 text-white focus:bg-teal-950' : 'bg-slate-50 focus:bg-white text-slate-900'
                      } ${
                        errors.stage
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                          : 'border-slate-200 dark:border-teal-800/40 focus:border-emerald-500 focus:ring-emerald-100'
                      }`}
                      dir={isRtl ? 'rtl' : 'ltr'}
                    >
                      <option value="">{t.stageSelect}</option>
                      <option value="EarlyChildhood">{t.stageEarlyChildhood}</option>
                      <option value="Kindergarten">{t.stageKindergarten}</option>
                      <option value="Primary">{t.stagePrimary}</option>
                      <option value="Intermediate">{t.stageIntermediate}</option>
                      <option value="Secondary">{t.stageSecondary}</option>
                    </select>
                  </div>
                  {errors.stage && (
                    <p className="mt-1.5 text-xs text-red-500 font-bold">{errors.stage}</p>
                  )}
                </div>

                {/* Dynamic Grade selection */}
                <div id="field-grade">
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-teal-200 mb-2">
                    {isRtl ? 'الصف الدراسي' : 'Student Grade'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Bookmark className="w-4 h-4" />
                    </span>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      disabled={!stage}
                      className={`w-full pl-10 pr-4 py-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all outline-none focus:ring-2 ${
                        isDark ? 'bg-teal-950/60 text-white focus:bg-teal-950' : 'bg-slate-50 focus:bg-white text-slate-900'
                      } ${
                        errors.grade
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                          : 'border-slate-200 dark:border-teal-800/40 focus:border-emerald-500 focus:ring-emerald-100'
                      } disabled:opacity-50`}
                      dir={isRtl ? 'rtl' : 'ltr'}
                    >
                      <option value="">
                        {stage
                          ? (isRtl ? 'اختر الصف الدراسي المخصص' : 'Select classroom grade')
                          : (isRtl ? 'الرجاء اختيار المرحلة التعليمية أولاً' : 'Please select stage first')}
                      </option>
                      {getGradesForStage(stage).map((gradeOption) => (
                        <option key={gradeOption} value={gradeOption}>
                          {gradeOption}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.grade && (
                    <p className="mt-1.5 text-xs text-red-500 font-bold">{errors.grade}</p>
                  )}
                </div>

                {/* Administrative Sector Dropdown */}
                <div id="field-sector">
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-teal-200 mb-2">
                    {isRtl ? 'القطاع الإداري' : 'Administrative Sector'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Building className="w-4 h-4" />
                    </span>
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all outline-none focus:ring-2 ${
                        isDark ? 'bg-teal-950/60 text-white focus:bg-teal-950' : 'bg-slate-50 focus:bg-white text-slate-900'
                      } ${
                        errors.sector
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                          : 'border-slate-200 dark:border-teal-800/40 focus:border-emerald-500 focus:ring-emerald-100'
                      }`}
                      dir={isRtl ? 'rtl' : 'ltr'}
                    >
                      <option value="">{isRtl ? 'اختر القطاع الإداري التابع له' : 'Select Administrative Sector'}</option>
                      {SECTORS.map((sec) => (
                        <option key={sec} value={sec}>
                          {sec}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.sector && (
                    <p className="mt-1.5 text-xs text-red-500 font-bold">{errors.sector}</p>
                  )}
                </div>

                {/* Neighborhood Option (الحي) */}
                <div id="field-neighborhood">
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-teal-200 mb-2">
                    {isRtl ? 'الحي' : 'Neighborhood'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder={isRtl ? 'مثال: حي الملك فهد، حي الربوة، إلخ' : 'Example: Al-Malek Fahd, etc.'}
                      className={`w-full pl-10 pr-4 py-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all outline-none focus:ring-2 ${
                        isDark ? 'bg-teal-950/60 text-white focus:bg-teal-950' : 'bg-slate-50 focus:bg-white text-slate-900'
                      } ${
                        errors.neighborhood
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                          : 'border-slate-200 dark:border-teal-800/40 focus:border-emerald-500 focus:ring-emerald-100'
                      }`}
                      dir={isRtl ? 'rtl' : 'ltr'}
                    />
                  </div>
                  {errors.neighborhood && (
                    <p className="mt-1.5 text-xs text-red-500 font-bold">{errors.neighborhood}</p>
                  )}
                </div>

                {/* Primary School Choice (الرغبة الأولى) */}
                <div id="field-schoolName" className="md:col-span-2">
                  <SchoolSelectDropdown
                    schools={activeSchools}
                    value={schoolName}
                    onChange={(name, code) => {
                      setSchoolName(name);
                      if (code) setSchoolCode(code);
                    }}
                    label={isTransferMode ? (isRtl ? 'المدرسة المطلوب النقل لها ( الرغبة الأولى )' : 'Target School (First Choice)') : (isRtl ? 'المدرسة المطلوبة (الرغبة الأولى)' : 'Primary Preferred School')}
                    required
                    isDark={isDark}
                    isRtl={isRtl}
                    error={errors.schoolName}
                    placeholder={isRtl ? '🔍 اختر الرغبة الأولى (الاسم / الرقم الوزاري)...' : 'Search 1st choice school...'}
                    helperText={isRtl ? '💡 اكتب اسم المدرسة المطلوبة أو الرقم الوزاري للفرز والفلترة الذكية.' : 'Type school name or ministerial code.'}
                  />
                </div>

                {/* Second Choice School (الرغبة الثانية) */}
                <div className="md:col-span-1">
                  <SchoolSelectDropdown
                    schools={activeSchools}
                    value={secondSchoolName}
                    onChange={(name) => setSecondSchoolName(name)}
                    label={isRtl ? 'مدرسة خيار ثانٍ (الرغبة الثانية - اختيارية)' : '2nd Choice School (Optional)'}
                    isDark={isDark}
                    isRtl={isRtl}
                    placeholder={isRtl ? '🔍 اختر مدرسة الرغبة الثانية...' : 'Search 2nd choice school...'}
                  />
                </div>

                {/* Third Choice School (الرغبة الثالثة) */}
                <div className="md:col-span-1">
                  <SchoolSelectDropdown
                    schools={activeSchools}
                    value={thirdSchoolName}
                    onChange={(name) => setThirdSchoolName(name)}
                    label={isRtl ? 'مدرسة خيار ثالث (الرغبة الثالثة - اختيارية)' : '3rd Choice School (Optional)'}
                    isDark={isDark}
                    isRtl={isRtl}
                    placeholder={isRtl ? '🔍 اختر مدرسة الرغبة الثالثة...' : 'Search 3rd choice school...'}
                  />
                </div>

                {/* Transfer Specific Fields: Reason for Transfer, Attachments & Updated Pledge */}
                {isTransferMode ? (
                  <>
                    {/* Reason for Transfer Dropdown */}
                    <div id="field-transferReason" className="md:col-span-2 space-y-2 pt-2">
                      <label className="block text-xs sm:text-sm font-extrabold text-slate-800 dark:text-teal-200">
                        {isRtl ? 'سبب النقل' : 'Reason for Transfer'} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={transferReason}
                        onChange={(e) => setTransferReason(e.target.value)}
                        className={`w-full p-3.5 text-xs sm:text-sm font-bold rounded-xl border outline-none transition-all ${
                          isDark ? 'bg-teal-950/80 text-white border-teal-800/60' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                        } ${errors.transferReason ? 'border-red-500' : ''}`}
                        dir={isRtl ? 'rtl' : 'ltr'}
                      >
                        <option value="registered_unlisted_desire">{isRtl ? 'مسجل في رغبة غير مدرجة من قبلي ( تتطلب الاثبات )' : 'Registered in unlisted desire (requires proof)'}</option>
                        <option value="registered_far_residence">{isRtl ? 'مسجل في رغبة بعيدة عن السكن ( تتطلب الاثبات )' : 'Registered in desire far from residence (requires proof)'}</option>
                        <option value="school_in_same_neighborhood">{isRtl ? 'المدرسة في نفس الحي الذي أسكن به ( تتطلب الاثبات )' : 'School is in the same neighborhood (requires proof)'}</option>
                        <option value="other">{isRtl ? 'أخرى' : 'Other'}</option>
                      </select>
                      {errors.transferReason && (
                        <p className="text-xs text-red-500 font-bold">{errors.transferReason}</p>
                      )}
                    </div>

                    {/* Custom Transfer Reason if Other selected */}
                    {transferReason === 'other' && (
                      <div id="field-transferReasonCustom" className="md:col-span-2 space-y-2">
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-teal-200">
                          {isRtl ? 'تحديد سبب النقل بالتفصيل:' : 'Specify Transfer Reason:'} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={transferReasonCustom}
                          onChange={(e) => setTransferReasonCustom(e.target.value)}
                          placeholder={isRtl ? 'اكتب سبب طلب النقل بالتفصيل هنا...' : 'Write custom transfer reason details...'}
                          className={`w-full p-3 text-xs sm:text-sm font-semibold rounded-xl border outline-none ${
                            isDark ? 'bg-teal-950/80 text-white border-teal-800' : 'bg-white border-slate-200 text-slate-900'
                          } ${errors.transferReasonCustom ? 'border-red-500' : ''}`}
                          dir={isRtl ? 'rtl' : 'ltr'}
                        />
                        {errors.transferReasonCustom && (
                          <p className="text-xs text-red-500 font-bold">{errors.transferReasonCustom}</p>
                        )}
                      </div>
                    )}

                    {/* Attachment Upload Box */}
                    <div className="md:col-span-2 space-y-2 p-4 rounded-2xl bg-teal-500/5 dark:bg-teal-950/40 border border-teal-500/20">
                      <label className="block text-xs sm:text-sm font-extrabold text-teal-900 dark:text-teal-200">
                        {isRtl ? '📎 مرفقات إثبات سبب النقل (صورة أو ملف PDF أقل من 3 ميجابايت)' : 'Attach Transfer Proof Documents (Image/PDF < 3MB)'}
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs shrink-0">
                          <Upload className="w-4 h-4" />
                          <span>{isRtl ? 'اختيار ملف الإثبات' : 'Select Proof File'}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleAttachmentChange}
                            className="hidden"
                          />
                        </label>
                        <div className="text-xs font-semibold truncate text-slate-600 dark:text-teal-300">
                          {transferAttachmentName ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              ✓ {transferAttachmentName} ({(transferAttachmentSize / 1024).toFixed(1)} KB)
                            </span>
                          ) : (
                            <span className="opacity-70">{isRtl ? 'لم يتم اختيار ملف إثبات حتى الآن' : 'No document selected'}</span>
                          )}
                        </div>
                      </div>
                      {transferAttachmentError && (
                        <p className="text-xs text-red-500 font-bold mt-1">{transferAttachmentError}</p>
                      )}
                    </div>

                    {/* Prior Communication with School (Transfer Mode) */}
                    <div className="md:col-span-2 space-y-3 pt-2">
                      <label className="block text-xs sm:text-sm font-extrabold text-slate-800 dark:text-teal-200">
                        {isRtl ? 'هل تم التواصل مع المدرسة المطلوب النقل لها مسبقاً؟' : 'Have you contacted the target transfer school in advance?'} <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-4 max-w-sm" id="field-contactedSchool">
                        <button
                          type="button"
                          onClick={() => setContactedSchool('yes')}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-extrabold text-xs sm:text-sm rounded-xl border transition-all cursor-pointer ${
                            contactedSchool === 'yes'
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                              : isDark
                              ? 'bg-teal-900/20 border-teal-800/40 text-teal-300 hover:bg-teal-900/35'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>{isRtl ? 'نعم' : 'Yes'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setContactedSchool('no');
                            setSchoolFeedback('');
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-extrabold text-xs sm:text-sm rounded-xl border transition-all cursor-pointer ${
                            contactedSchool === 'no'
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                              : isDark
                              ? 'bg-teal-900/20 border-teal-800/40 text-teal-300 hover:bg-teal-900/35'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>{isRtl ? 'لا' : 'No'}</span>
                        </button>
                      </div>
                      {errors.contactedSchool && (
                        <p className="text-xs text-red-500 font-bold">{errors.contactedSchool}</p>
                      )}

                      <AnimatePresence>
                        {contactedSchool === 'yes' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2 overflow-hidden pt-2"
                            id="field-schoolFeedback"
                          >
                            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-teal-200">
                              {isRtl ? 'إفادة المدرسة التي تم استلامها:' : 'What feedback response was given by the school?'} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={schoolFeedback}
                              onChange={(e) => setSchoolFeedback(e.target.value)}
                              placeholder={isRtl ? 'يرجى كتابة الرد أو التبرير الذي أفادتكم به إدارة المدرسة بالتفصيل...' : 'Please input school feedback detail...'}
                              rows={3}
                              className={`w-full p-4 text-xs sm:text-sm font-semibold rounded-xl border transition-all outline-none focus:ring-2 ${
                                isDark ? 'bg-teal-950/60 text-white focus:bg-teal-950' : 'bg-slate-50 focus:bg-white text-slate-900'
                              } ${
                                errors.schoolFeedback
                                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                  : 'border-slate-200 dark:border-teal-800/40 focus:border-emerald-500 focus:ring-emerald-100'
                              }`}
                              dir={isRtl ? 'rtl' : 'ltr'}
                            />
                            {errors.schoolFeedback && (
                              <p className="text-xs text-red-500 font-bold">{errors.schoolFeedback}</p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Transfer Guardian Pledge Checkbox */}
                    <div id="field-guardianTransferPledge" className="md:col-span-2 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-start space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={guardianTransferPledge}
                          onChange={(e) => setGuardianTransferPledge(e.target.checked)}
                          className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200 leading-relaxed">
                          {isRtl
                            ? '☑️ تعهد وإقرار ولي الأمر: أقر وأتعهد بأن جميع الاثباتات المرفقة صحيحة وفي حال عدم صحتها أتحمل كافة الاجراءات النظامية حيال ذلك'
                            : '☑️ Guardian Undertaking: I pledge that all attached proofs are authentic, otherwise I bear full legal responsibility.'}
                        </span>
                      </label>
                      {errors.guardianTransferPledge && (
                        <p className="text-xs text-red-500 font-bold mt-1">{errors.guardianTransferPledge}</p>
                      )}
                    </div>
                  </>
                ) : (
                  /* Standard Guardian Pledge / Undertaking Checkbox */
                  <div className="md:col-span-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-start space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToAlternativeSchoolPlacement}
                        onChange={(e) => setAgreedToAlternativeSchoolPlacement(e.target.checked)}
                        className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200 leading-relaxed">
                        {isRtl
                          ? '☑️ تعهد وإقرار ولي الأمر: أقر وأتعهد بأنه في حال عدم إمكانية تسجيل الطالب/ة في الرغبات المحددة أعلاه، فإنني أوافق على تسكينه/ا في أقرب مدرسة متاحة لضمان التحاقه بالتعليم.'
                          : '☑️ Guardian Pledge: In case of impossibility to register in the above choices, I agree to place the student in the nearest available school to ensure education enrollment.'}
                      </span>
                    </label>
                    {errors.agreedToAlternativeSchoolPlacement && (
                      <p className="text-xs text-red-500 font-bold mt-1 px-1">{errors.agreedToAlternativeSchoolPlacement}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Bar with encryption details */}
            <div className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark ? 'border-teal-800/40' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
                <span>{isRtl ? 'تشفير عالي لحماية خصوصية المستندات والبيانات (AES-256)' : 'High-level encryption for document and data privacy (AES-256)'}</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                id="survey-submit-button"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{isRtl ? 'جاري التحقق والتشفير والتقديم...' : 'Securing and submitting...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4.5 h-4.5" />
                    <span>{isRtl ? 'تقديم الطلب للجنة المختصة' : 'Submit Educational Request'}</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

      </form>

      {/* Age Verification Modal */}
      <AgeVerificationModal
        isOpen={showAgeModal}
        onClose={() => setShowAgeModal(false)}
        onProceed={(details) => {
          setShowAgeModal(false);
          setVerifiedAgeInfo(details);
          if (details.stageName && details.stageName.includes('الابتدائي')) {
            setStage('Primary');
          }
          try {
            localStorage.setItem('student_age_verification', JSON.stringify(details));
          } catch (e) { /* ignore */ }
        }}
        isDark={isDark}
        isRtl={isRtl}
      />

      {/* Equivalency Guidelines Modal */}
      <AnimatePresence>
        {showEqGuidelinesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col ${
                isDark ? 'bg-[#002424] text-white border border-teal-800' : 'bg-white text-slate-900 border border-slate-200'
              }`}
            >
              {/* Header */}
              <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-teal-800 bg-teal-900/20' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md">
                    <GraduationCap className="w-6 h-6" />
                  </span>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black">
                      {isRtl ? 'ضوابط وإجراءات معادلة الشهادات' : 'Equivalency Guidelines & Procedures'}
                    </h2>
                    <p className="text-xs font-bold text-slate-500 dark:text-teal-300">
                      {isRtl ? 'إدارة التعليم بمنطقة المدينة المنورة' : 'Education Department - Madinah Region'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEqGuidelinesModal(false)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-teal-800/60 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 scrollbar-thin scrollbar-thumb-emerald-500">
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 border-r-4 border-emerald-600 pr-3">
                    {isRtl ? 'أولاً: الضوابط العامة' : 'I. General Regulations'}
                  </h3>
                  <div className={`p-5 rounded-2xl space-y-4 text-xs sm:text-sm leading-relaxed font-bold ${isDark ? 'bg-teal-900/30' : 'bg-slate-50'}`}>
                    <p>{isRtl ? 'تتم معادلة وثائق الطلبة القادمين من الخارج وفق الضوابط التالية:' : 'International student documents are equivalated based on:'}</p>
                    <ul className="list-decimal list-inside space-y-3">
                      <li>{isRtl ? 'أن تكون المدرسة معتمدة من قبل الجهة المسؤولة عن التعليم في ذلك البلد.' : 'School must be accredited by educational authorities in the origin country.'}</li>
                      <li>{isRtl ? 'أن تكون شهادة إتمام الدراسة الثانوية مقبولة في الجامعات ومؤسسات التعليم العالي في البلد الصادرة منه.' : 'High school certificates must be accepted by HE institutions in the origin country.'}</li>
                      <li>{isRtl ? 'أن تكون الدراسة بالانتظام وفق تسلسل دراسي واضح مع ضرورة إرفاق وثائق النجاح للصفوف السابقة.' : 'Regular attendance with clear progression; past success records must be attached.'}</li>
                      <li>
                        {isRtl ? 'أن تكون الوثائق الدراسية المقدمة أصول ومستكملة التصديق والتوثيق من الجهات التالية:' : 'Documents must be original and fully authenticated by:'}
                        <ul className="list-disc list-inside mr-6 mt-2 space-y-1 text-slate-600 dark:text-teal-400">
                          <li>{isRtl ? 'وزارة التعليم في بلد التخرج أو الجهة المشرفة.' : 'Ministry of Education in graduation country.'}</li>
                          <li>{isRtl ? 'وزارة الخارجية في البلد الذي صدرت منه.' : 'Ministry of Foreign Affairs in origin country.'}</li>
                          <li>{isRtl ? 'الملحقية الثقافية أو السفارة السعودية في بلد التخرج.' : 'Saudi Cultural Mission or Saudi Embassy abroad.'}</li>
                        </ul>
                      </li>
                      <li>{isRtl ? 'إرفاق صورة من بطاقة الهوية الوطنية أو الإقامة أو جواز السفر.' : 'Attach copy of National ID, Residency, or Passport.'}</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 border-r-4 border-emerald-600 pr-3">
                    {isRtl ? 'ثانياً: الإجراءات' : 'II. Procedures'}
                  </h3>
                  <div className={`p-5 rounded-2xl space-y-4 text-xs sm:text-sm leading-relaxed font-bold ${isDark ? 'bg-teal-900/30' : 'bg-slate-50'}`}>
                    <p className="text-emerald-800 dark:text-emerald-200">
                      {isRtl ? '1. شهادات الثانوية العامة:' : '1. High School Certificates:'}
                    </p>
                    <ul className="list-disc list-inside space-y-2 mr-4">
                      <li>{isRtl ? 'تتم المعادلة من خلال إدارات التعليم وتحال للوزارة إلكترونياً عبر نظام أعمالي.' : 'Processed through education depts and routed via Aamali system.'}</li>
                      <li>{isRtl ? 'يتم إصدار الوثيقة فور استيفاء الشروط وإحالتها للمستفيد.' : 'Certificate issued once conditions met and delivered to beneficiary.'}</li>
                    </ul>
                    
                    <p className="text-emerald-800 dark:text-emerald-200 mt-4">
                      {isRtl ? '2. مراحل النقل (ما دون الصف الثالث الثانوي):' : '2. Transfer Stages (Below 12th Grade):'}
                    </p>
                    <ul className="list-disc list-inside space-y-2 mr-4">
                      <li>{isRtl ? 'تتم المعادلة مباشرة من قبل إدارات التعليم ويسكن الطالب في صفه المستحق.' : 'Processed directly by education depts; student placed in the eligible grade.'}</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Footer with Acknowledgment */}
              <div className={`p-6 border-t ${isDark ? 'border-teal-800 bg-teal-900/10' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex flex-col gap-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-1">
                      <input
                        type="checkbox"
                        checked={tempAcceptGuideline}
                        onChange={(e) => setTempAcceptGuideline(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 transition-all ${
                        tempAcceptGuideline 
                          ? 'bg-emerald-600 border-emerald-600' 
                          : 'bg-white dark:bg-teal-900 border-slate-300 dark:border-teal-700 group-hover:border-emerald-400'
                      }`}>
                        {tempAcceptGuideline && <CheckSquare className="w-4 h-4 text-white m-auto" />}
                      </div>
                    </div>
                    <span className={`text-xs sm:text-sm font-black leading-relaxed ${isDark ? 'text-teal-100' : 'text-slate-800'}`}>
                      {isRtl 
                        ? 'أقر أنا ولي الأمر بأنني اطلعت على ضوابط وإجراءات معادلة الشهادات الموضحة أعلاه وأتعهد بالالتزام بها وتوفير كافة الوثائق المطلوبة.'
                        : 'I hereby acknowledge that I have read and agree to the equivalency guidelines and procedures stated above.'}
                    </span>
                  </label>

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => setShowEqGuidelinesModal(false)}
                      className={`flex-1 py-3.5 rounded-2xl font-black text-sm transition-all ${
                        isDark ? 'bg-teal-800/40 text-teal-300 hover:bg-teal-800/60' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      disabled={!tempAcceptGuideline}
                      onClick={() => {
                        setHasAcceptedEqGuidelines(true);
                        setShowEqGuidelinesModal(false);
                        setStudentCategoryType('non_fresh');
                        setEqualizationStage('primary');
                        setRequestPath('equivalency');
                      }}
                      className={`flex-[2] py-3.5 rounded-2xl font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                        tempAcceptGuideline
                          ? 'bg-gradient-to-r from-[#218caa] to-[#3078a6] text-white hover:brightness-110 cursor-pointer'
                          : 'bg-slate-300 dark:bg-teal-900/40 text-slate-500 dark:text-teal-700 cursor-not-allowed'
                      }`}
                    >
                      <span>{isRtl ? 'المتابعة لإكمال النموذج' : 'Proceed to Form'}</span>
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
