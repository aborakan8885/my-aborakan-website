/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProblemType = 'new_registration_saudi' | 'new_registration_resident' | 'vacancies_unavailable' | 'student_density' | 'unjustified_rejection' | 'distance_from_school' | 'unregistered_desire' | 'other' | 'cert_primary_eq' | 'cert_intermediate_eq' | 'cert_secondary_eq';

export interface SurveyResponse {
  id: string;
  beneficiaryName: string;
  nationalId?: string;
  phoneNumber: string;
  stage: string; // e.g. "Primary", "Intermediate", "Secondary"
  sector: string; // e.g. "North", "South", "East", "West"
  schoolName: string;
  schoolCode?: string; // الرقم الوزاري للمدرسة
  problemType: ProblemType;
  serviceEmployee?: string;
  isResolved: boolean;
  unresolvedReason?: string;
  staffSatisfaction: number; // 1-5
  receptionSatisfaction: number; // 1-5
  notes: string;
  createdAt: string;
  isSynced: boolean;
  isOfflineCreated?: boolean;
  assignedOfficerId?: string;
  referredBy?: 'admin' | 'director';
  referralNotes?: string;
  
  // New fields requested by user
  district?: string;
  gender?: 'boys' | 'girls';
  grade?: string;
  neighborhood?: string;
  contactedSchool?: 'yes' | 'no';
  schoolFeedback?: string;
  otherProblemDetails?: string;
  parentName?: string;
  studentAge?: string;

  // Nationality & Residency fields
  nationality?: string;
  residencyType?: 'regular' | 'visit' | 'other' | string;
  customResidencyType?: string;

  // Student Freshness / Equalization fields
  studentCategoryType?: 'fresh' | 'non_fresh';
  isNonFreshStudent?: boolean;
  isEqualizationRequest?: boolean;
  equalizationStage?: 'primary' | 'intermediate' | 'secondary' | string;

  // Student Transfer fields
  serviceType?: 'new' | 'transfer' | string;
  transferReason?: string;
  transferReasonCustom?: string;
  transferAttachmentName?: string;
  transferAttachmentData?: string;
  transferAttachmentType?: string;
  transferAttachmentSize?: number;
  guardianTransferPledge?: boolean;
  attachmentsPurgedByPrincipal?: boolean;

  // Multiple school choices & parent pledge
  secondSchoolName?: string;
  thirdSchoolName?: string;
  agreedToAlternativeSchoolPlacement?: boolean;

  // Vacancy request pipeline fields
  isVacancyRequest?: boolean;
  vacancyRequestStatus?: 'pending' | 'pending_vacancy' | 'approved' | 'sent_to_leadership' | 'sent_to_school_principal' | 'returned_no_vacancy' | 'staffing_confirmed' | 'executed' | 'archived';
  sentToSchoolPrincipal?: boolean;
  sentToLeadership?: boolean;
  sentToLeadershipAt?: string;
  isReceived?: boolean;
  receivedAt?: string;
  leadershipCategory?: string;
  sentToPrincipalAt?: string;
  principalConfirmedStaffing?: boolean;
  returnedByPrincipal?: boolean;
  principalReturnReason?: string;
  returnedAt?: string;
  principalReturnCount?: number;
  isSecondReturnByPrincipal?: boolean;

  // Appointment Scheduling fields for Equivalency Review
  hasReviewAppointment?: boolean;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentNote?: string;
  appointmentLocationLink?: string;
  appointmentSetAt?: string;
  appointmentSetBy?: string;
  appointmentConfirmedByBeneficiary?: boolean;
  appointmentConfirmedAt?: string;
  appointmentCancelledDueToNoShow?: boolean;
  appointmentCancelledAt?: string;
  appointmentCancelledReason?: string;
  isReceivedByEqOfficer?: boolean;
  receivedByEqOfficerName?: string;
  eqReceivedAt?: string;

  // Equivalency doc attachment and notes
  equalizationDocAttached?: boolean;
  equalizationDocName?: string;
  equalizationDocData?: string;
  equalizationNotes?: string;
  equalizationCompleted?: boolean;

  // Planning officer vacancy details & return handling
  vacancyOpenedChoice?: '1st' | '2nd' | '3rd' | 'alternative' | string;
  vacancyOpenReason?: string;
  vacancyOpenedSchoolName?: string;
  planningNearestTrackSchool?: string;
  planningVacancyReconfirmed?: boolean;

  // Beneficiary Evaluation & Rating submission fields
  beneficiaryEvaluationSubmitted?: boolean;
  evaluationSubmittedAt?: string;

  referringOfficerId?: string;
  referringOfficerName?: string;
  assignedPlanningOfficerId?: string;
  planningOfficerName?: string;
  assignedLeadershipOfficerId?: string;
  leadershipOfficerName?: string;
  staffingNote?: string;
  staffingConfirmedAt?: string;
  staffingConfirmedBy?: string;
  archivedAt?: string;
  archivedBy?: string;
  vacancyReplyNote?: string;
  lastUpdatedAt?: string;
}

export interface AppConfig {
  adminEmails: string;
  autoBackupEnabled: boolean;
  backupInterval: number; // in minutes
  encryptionEnabled: boolean;
  thirdPartyIntegrationEnabled: boolean;
  customLogoUrl?: string;
  institutionNameAr: string;
  institutionNameEn: string;
}

export interface EmailLog {
  id: string;
  surveyId: string;
  beneficiaryName: string;
  recipientEmail: string;
  subject: string;
  sentAt: string;
  status: 'sent' | 'pending' | 'failed';
  triggerReason: string; // "Negative Feedback Alert"
}

export interface SystemIntegrationLog {
  id: string;
  systemName: string;
  payloadSent: string;
  status: 'success' | 'warning' | 'error';
  timestamp: string;
}

export type Language = 'ar' | 'en';

export interface PrincipalReport {
  id: string;
  reportType?: string;
  schoolName: string;
  schoolCode: string;
  stage: string; // e.g. "Primary", "Intermediate", etc.
  gender?: 'boys' | 'girls' | string;
  district?: string;
  sector?: string;
  principalName: string;
  mobile: string;
  problemType: 'vacancies_closed' | 'class_density';
  closedVacanciesOption?: 'specific' | 'all';
  specificClosedClassesText?: string;
  proposedSolution?: 'open_class' | 'modify_budget';
  openClassSubOption?: 'no_teachers' | 'needs_teachers';
  budgetProposalText?: string;
  requiredSpecialtiesText?: string;
  createdAt: string;
  isResolved: boolean;
  isReceived?: boolean;
  isCommunicating?: boolean;
  assignedOfficerId?: string;
  referredBy?: 'admin' | 'director';
  referralNotes?: string;

  // Vacancy request pipeline fields
  vacancyRequestStatus?: 'pending' | 'pending_vacancy' | 'approved' | 'sent_to_leadership' | 'staffing_confirmed' | 'executed' | 'archived';
  assignedPlanningOfficerId?: string;
  planningOfficerName?: string;
  assignedLeadershipOfficerId?: string;
  leadershipOfficerName?: string;
  staffingNote?: string;
  staffingConfirmedAt?: string;
  staffingConfirmedBy?: string;
  archivedAt?: string;
  archivedBy?: string;
}

export type OfficerRole = 'admin' | 'director' | 'supervisor' | 'school_planning' | 'school_leadership' | 'stage_supervisor' | 'returned_followup' | 'leadership_director' | 'equivalency_supervisor';

export interface OfficerUser {
  id: string;
  nameAr: string;
  nameEn: string;
  role: OfficerRole;
  mobile: string;
  isActive: boolean;
  password?: string;
  canGrantRoles?: boolean;
  canDeleteUsers?: boolean;
  canAddUsers?: boolean;
  canHandleEqualizations?: boolean;
  schoolNames?: string[];
  workField?: string; // جهة ومجال العمل (مثل: إدارة التخطيط المدرسي - قسم فتح الشواغر)
  roleDescription?: string; // الدور الوظيفي المسند والمسؤوليات
  assignedStage?: string; // المرحلة المسؤول عنها (مثل: الابتدائي, المتوسط, الثانوي, رياض الأطفال, الكل)
  assignedGender?: 'boys' | 'girls' | 'both' | string; // الجنس المسؤول عنه (بنين, بنات, الكل)
  assignedSector?: string; // القطاع المسؤول عنه (الشمال, الجنوب, الشرق, الغرب, الوسط, الكل)
  nationalId?: string; // رقم السجل المدني (المفتاح الرئيسي للتسجيل والدخول)
  personalEmail?: string; // البريد الإلكتروني الشخصي (وليس الرسمي)
  mustChangePassword?: boolean; // هل يجب تعيين كلمة مرور جديدة وتأكيدها عند أول دخول
  fullNameQuad?: string; // الاسم الرباعي للمستخدم
}

export interface SchoolItem {
  id: string;
  nameAr: string;
  nameEn?: string;
  ministryCode: string; // الرقم الوزاري للمدرسة
  code?: string; // الرقم الوزاري المرادف
  stage?: 'Elementary' | 'Intermediate' | 'Secondary' | 'Kindergarten' | 'All' | string;
  gender?: 'boys' | 'girls' | 'both' | string;
  district?: string;
  customFields?: Record<string, any>; // الأعمدة والمتغيرات الديناميكية المستوردة من ملف إكسل أو كيس
  [key: string]: any; // تسمح بقراءة أي حقل متغير ديناميكياً
}

export interface BeneficiaryFeedback {
  id: string;
  senderName?: string;
  senderPhone?: string;
  message: string;
  createdAt: string;
  status: 'new' | 'read' | 'replied';
  notes?: string;
}



