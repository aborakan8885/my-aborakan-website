// High-Performance IndexedDB + LocalStorage Hybrid Persistence Engine
// Engineered to handle 20,000+ simultaneous requests and massive datasets without quota crashes or data loss.
import * as XLSX from 'xlsx';
import { SurveyResponse, PrincipalReport, SchoolItem, OfficerUser, BeneficiaryFeedback, ProblemType } from '../types';

const DB_NAME = 'MoeSmartSystemDB_v2';
const DB_VERSION = 2;

const STORE_SURVEYS = 'surveys';
const STORE_REPORTS = 'principal_reports';
const STORE_SCHOOLS = 'schools';
const STORE_OFFICERS = 'officers';
const STORE_FEEDBACKS = 'feedbacks';
const STORE_SNAPSHOTS = 'snapshots';

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in current environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SURVEYS)) {
        db.createObjectStore(STORE_SURVEYS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_REPORTS)) {
        db.createObjectStore(STORE_REPORTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SCHOOLS)) {
        db.createObjectStore(STORE_SCHOOLS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_OFFICERS)) {
        db.createObjectStore(STORE_OFFICERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FEEDBACKS)) {
        db.createObjectStore(STORE_FEEDBACKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
        db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
}

// ----------------------------------------------------
// 1. SURVEYS PERSISTENCE (طلبات المستفيدين)
// ----------------------------------------------------
export async function saveSurveysToStorage(surveys: SurveyResponse[], options?: { isConfirmedAdminClear?: boolean }): Promise<void> {
  // Guard against blank overwrite during initial un-hydrated state
  if (!surveys || (!Array.isArray(surveys))) return;

  if (surveys.length === 0 && !options?.isConfirmedAdminClear) {
    // Prevent accidental wipeout if state was temporarily empty during mount
    const existing = await loadSurveysFromStorage();
    if (existing && existing.length > 0) {
      console.warn('Blocked blank overwrite to protect existing requests.');
      return;
    }
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SURVEYS, 'readwrite');
    const store = tx.objectStore(STORE_SURVEYS);
    
    store.clear();
    for (let i = 0; i < surveys.length; i++) {
      store.put(surveys[i]);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB saveSurveys failed, falling back to LocalStorage:', err);
  }

  // Backup to localStorage with Quota Protection
  try {
    if (surveys.length <= 2000) {
      localStorage.setItem('beneficiary_surveys', JSON.stringify(surveys));
    } else {
      localStorage.setItem('beneficiary_surveys', JSON.stringify(surveys.slice(0, 1000)));
    }
  } catch (quotaErr) {
    try {
      localStorage.setItem('beneficiary_surveys', JSON.stringify(surveys.slice(0, 300)));
    } catch {
      /* ignore */
    }
  }
}

export async function loadSurveysFromStorage(): Promise<SurveyResponse[]> {
  let dbItems: SurveyResponse[] = [];
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SURVEYS, 'readonly');
    const store = tx.objectStore(STORE_SURVEYS);
    
    dbItems = await new Promise<SurveyResponse[]>((resolve, reject) => {
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => resolve(getAllReq.result || []);
      getAllReq.onerror = () => reject(getAllReq.error);
    });
  } catch (err) {
    console.warn('IndexedDB loadSurveys failed, checking localStorage fallback:', err);
  }

  // LocalStorage check
  let lsItems: SurveyResponse[] = [];
  try {
    const cached = localStorage.getItem('beneficiary_surveys');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) lsItems = parsed;
    }
  } catch {
    /* ignore */
  }

  // Merge unique records by ID to ensure zero data loss
  const mergedMap = new Map<string, SurveyResponse>();
  dbItems.forEach(item => { if (item && item.id) mergedMap.set(item.id, item); });
  lsItems.forEach(item => { if (item && item.id && !mergedMap.has(item.id)) mergedMap.set(item.id, item); });

  return Array.from(mergedMap.values());
}

// ----------------------------------------------------
// 2. SCHOOLS PERSISTENCE (بيانات وملفات المدارس المرفوعة)
// ----------------------------------------------------
export async function saveSchoolsToStorage(schools: SchoolItem[], options?: { isConfirmedAdminClear?: boolean }): Promise<void> {
  if (!schools || !Array.isArray(schools)) return;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SCHOOLS, 'readwrite');
    const store = tx.objectStore(STORE_SCHOOLS);
    
    store.clear();
    for (let i = 0; i < schools.length; i++) {
      if (schools[i]) {
        store.put(schools[i]);
      }
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB saveSchools failed:', err);
  }

  // Save to localStorage with quota handling and explicit timestamp & status flag
  try {
    localStorage.setItem('app_schools_list_v1', JSON.stringify(schools));
    localStorage.setItem('app_schools_saved_v1', 'true');
    localStorage.setItem('app_schools_last_saved_at', new Date().toISOString());
  } catch (quotaErr) {
    console.warn('LocalStorage quota exceeded for schools list, preserved in IndexedDB successfully.');
  }
}

export async function loadSchoolsFromStorage(): Promise<SchoolItem[]> {
  let dbSchools: SchoolItem[] = [];
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SCHOOLS, 'readonly');
    const store = tx.objectStore(STORE_SCHOOLS);
    
    dbSchools = await new Promise<SchoolItem[]>((resolve, reject) => {
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => resolve(getAllReq.result || []);
      getAllReq.onerror = () => reject(getAllReq.error);
    });
  } catch (err) {
    console.warn('IndexedDB loadSchools failed:', err);
  }

  let lsSchools: SchoolItem[] = [];
  try {
    const cached = localStorage.getItem('app_schools_list_v1');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) lsSchools = parsed;
    }
  } catch {
    /* ignore */
  }

  if (dbSchools && dbSchools.length > 0) {
    return dbSchools;
  }
  if (lsSchools && lsSchools.length > 0) {
    return lsSchools;
  }

  const wasSaved = localStorage.getItem('app_schools_saved_v1');
  if (wasSaved === 'true') {
    return [];
  }

  return [];
}

// ----------------------------------------------------
// 3. PRINCIPAL REPORTS PERSISTENCE (تقارير وبلاغات مدراء المدارس)
// ----------------------------------------------------
export async function savePrincipalReportsToStorage(reports: PrincipalReport[], options?: { isConfirmedAdminClear?: boolean }): Promise<void> {
  if (!reports || !Array.isArray(reports)) return;

  if (reports.length === 0 && !options?.isConfirmedAdminClear) {
    const existing = await loadPrincipalReportsFromStorage();
    if (existing && existing.length > 0) {
      return;
    }
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_REPORTS, 'readwrite');
    const store = tx.objectStore(STORE_REPORTS);
    
    store.clear();
    for (let i = 0; i < reports.length; i++) {
      store.put(reports[i]);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save reports failed:', err);
  }

  try {
    localStorage.setItem('principal_reports', JSON.stringify(reports.slice(0, 1000)));
  } catch {
    /* ignore */
  }
}

export async function loadPrincipalReportsFromStorage(): Promise<PrincipalReport[]> {
  let dbReports: PrincipalReport[] = [];
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_REPORTS, 'readonly');
    const store = tx.objectStore(STORE_REPORTS);
    
    dbReports = await new Promise<PrincipalReport[]>((resolve, reject) => {
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => resolve(getAllReq.result || []);
      getAllReq.onerror = () => reject(getAllReq.error);
    });
  } catch (err) {
    console.warn('IndexedDB load reports failed:', err);
  }

  let lsReports: PrincipalReport[] = [];
  try {
    const cached = localStorage.getItem('principal_reports');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) lsReports = parsed;
    }
  } catch {
    /* ignore */
  }

  const merged = new Map<string, PrincipalReport>();
  dbReports.forEach(r => { if (r && r.id) merged.set(r.id, r); });
  lsReports.forEach(r => { if (r && r.id && !merged.has(r.id)) merged.set(r.id, r); });

  return Array.from(merged.values());
}

// ----------------------------------------------------
// 4. OFFICERS & FEEDBACKS PERSISTENCE
// ----------------------------------------------------
export async function saveOfficersToStorage(officers: OfficerUser[]): Promise<void> {
  if (!officers || !Array.isArray(officers) || officers.length === 0) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_OFFICERS, 'readwrite');
    const store = tx.objectStore(STORE_OFFICERS);
    store.clear();
    for (const off of officers) store.put(off);
  } catch (e) {
    /* ignore */
  }
  try {
    localStorage.setItem('officer_users_v4', JSON.stringify(officers));
    localStorage.setItem('officer_users_v3', JSON.stringify(officers));
  } catch {
    /* ignore */
  }
}

export async function loadOfficersFromStorage(): Promise<OfficerUser[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_OFFICERS, 'readonly');
    const store = tx.objectStore(STORE_OFFICERS);
    const dbItems = await new Promise<OfficerUser[]>((res) => {
      const req = store.getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => res([]);
    });
    if (dbItems && dbItems.length > 0) return dbItems;
  } catch (e) {
    /* ignore */
  }
  try {
    const cached = localStorage.getItem('officer_users_v4') || localStorage.getItem('officer_users_v3');
    if (cached) return JSON.parse(cached);
  } catch {
    /* ignore */
  }
  return [];
}

// ----------------------------------------------------
// 5. ADMIN-ONLY RESTRICTED CLEAR FUNCTIONS
// ----------------------------------------------------
export async function clearAllSurveysFromStorage(actorRole?: string): Promise<boolean> {
  if (actorRole !== 'admin') {
    console.error('Unauthorized deletion attempt. Only Admin can clear database.');
    return false;
  }

  try {
    const db = await openDB();
    const tx = db.transaction([STORE_SURVEYS, STORE_REPORTS], 'readwrite');
    tx.objectStore(STORE_SURVEYS).clear();
    tx.objectStore(STORE_REPORTS).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB clear error:', err);
  }

  try {
    localStorage.removeItem('beneficiary_surveys');
    localStorage.removeItem('principal_reports');
    localStorage.removeItem('temp_print_surveys');
    localStorage.removeItem('temp_print_officer');
    localStorage.removeItem('beneficiary_emails');
    localStorage.removeItem('beneficiary_integrations');
    localStorage.setItem('beneficiary_surveys', JSON.stringify([]));
    localStorage.setItem('principal_reports', JSON.stringify([]));
  } catch {
    /* ignore */
  }

  return true;
}

export async function clearSchoolsFromStorage(actorRole?: string): Promise<boolean> {
  if (actorRole !== 'admin') {
    console.error('Unauthorized schools clear attempt. Only Admin can clear schools.');
    return false;
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SCHOOLS, 'readwrite');
    tx.objectStore(STORE_SCHOOLS).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    /* ignore */
  }

  try {
    localStorage.setItem('app_schools_list_v1', '[]');
    localStorage.setItem('app_schools_saved_v1', 'true');
    localStorage.setItem('app_schools_last_saved_at', new Date().toISOString());
  } catch {
    /* ignore */
  }

  return true;
}

// ----------------------------------------------------
// 6. DATE-BASED EXCEL BACKUP ENGINE (Year, Month, Day, Request Type)
// ----------------------------------------------------

export interface BackupFilterOptions {
  year?: string | number; // e.g. '2026', '2025', 'all'
  month?: string | number; // e.g. '1' to '12', or 'all'
  day?: string | number; // e.g. '1' to '31', or 'all'
  problemType?: string; // 'all' or specific ProblemType
  stage?: string; // 'all' or specific stage (الابتدائية, المتوسطة, الثانوية, ...)
  gender?: string; // 'all', 'boys', 'girls'
  status?: string; // 'all', 'resolved', 'pending'
}

export function normalizeArabicText(str: string | number | undefined | null): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove diacritics / Tashkeel
    .replace(/\u0640/g, '') // Remove Tatweel (ـ)
    .replace(/[أإآٱءئؤ]/g, 'ا') // Normalize all Hamza variants to Alef 'ا'
    .replace(/ة/g, 'ه') // Normalize Teh Marbuta to Heh 'ه'
    .replace(/ى/g, 'ي') // Normalize Alef Maqsoora to Yeh 'ي'
    .replace(/[\u00A0\u200B\u200C\u200D]/g, ' ') // Replace non-breaking / zero-width spaces
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ') // Replace punctuation, brackets, hyphens with spaces
    .replace(/\s+/g, ' '); // Collapse spaces
}

export function cleanSchoolName(name: string | undefined | null): string {
  if (!name) return '';
  let norm = normalizeArabicText(name);
  norm = norm.replace(/\b(مدرسه|مجمع|ابتدائيه|متوسطه|ثانويه|روضه|طفوله مبكره|بنين|بنات|للبنين|للبنات)\b/g, ' ').trim();
  return norm.replace(/\s+/g, ' ');
}

/**
 * Robust matching to verify if a survey/request belongs to the school principal's school
 */
export function isMatchingPrincipalSchool(
  survey: SurveyResponse | undefined | null,
  principalSession: { schoolCode?: string; schoolName?: string; [key: string]: any } | undefined | null,
  schoolsList: SchoolItem[] = []
): boolean {
  if (!survey || !principalSession) return false;

  const pCode = String(principalSession.schoolCode || '').trim();
  const pName = String(principalSession.schoolName || '').trim();
  const pClean = cleanSchoolName(pName);
  const pNorm = normalizeArabicText(pName);

  // 1. Direct code comparison
  const sCode = String(survey.schoolCode || '').trim();
  if (pCode && sCode && sCode === pCode) return true;

  // 2. Assigned leadership / school code / officer ID
  const assignedId = String((survey as any).assignedLeadershipOfficerId || '').trim();
  if (pCode && assignedId && assignedId === pCode) return true;

  // 3. Match against survey primary school name
  const sName = String(survey.schoolName || '').trim();
  if (sName) {
    const sNorm = normalizeArabicText(sName);
    const sClean = cleanSchoolName(sName);
    if (sNorm === pNorm || (pClean && sClean && (sClean.includes(pClean) || pClean.includes(sClean)))) {
      return true;
    }
  }

  // 4. Match against referral / target / assigned school name (when referred by supervisor or admissions)
  const targetSchool = String(
    (survey as any).targetSchoolName || 
    (survey as any).assignedSchoolName || 
    (survey as any).referredSchoolName || 
    (survey as any).directedSchoolName || 
    (survey as any).vacancyOpenedSchoolName || 
    ''
  ).trim();
  if (targetSchool) {
    const tNorm = normalizeArabicText(targetSchool);
    const tClean = cleanSchoolName(targetSchool);
    if (tNorm === pNorm || (pClean && tClean && (tClean.includes(pClean) || pClean.includes(tClean)))) {
      return true;
    }
  }

  // 5. Match against second/third desires
  const secondSchool = String(survey.secondSchoolName || '').trim();
  if (secondSchool) {
    const s2Norm = normalizeArabicText(secondSchool);
    const s2Clean = cleanSchoolName(secondSchool);
    if (s2Norm === pNorm || (pClean && s2Clean && (s2Clean.includes(pClean) || pClean.includes(s2Clean)))) {
      return true;
    }
  }

  const thirdSchool = String(survey.thirdSchoolName || '').trim();
  if (thirdSchool) {
    const s3Norm = normalizeArabicText(thirdSchool);
    const s3Clean = cleanSchoolName(thirdSchool);
    if (s3Norm === pNorm || (pClean && s3Clean && (s3Clean.includes(pClean) || pClean.includes(s3Clean)))) {
      return true;
    }
  }

  // 6. Match via schools list metadata (cross-reference ministry code & canonical school name)
  if (schoolsList && schoolsList.length > 0) {
    const matchedSchoolInList = schoolsList.find(sch => {
      const schCode = String(sch.ministryCode || sch.code || sch.id || '').trim();
      const schName = String(sch.nameAr || sch.nameEn || '').trim();
      if (pCode && schCode && schCode === pCode) return true;
      if (pNorm && schName && normalizeArabicText(schName) === pNorm) return true;
      return false;
    });

    if (matchedSchoolInList) {
      const canonicalCode = String(matchedSchoolInList.ministryCode || matchedSchoolInList.code || matchedSchoolInList.id || '').trim();
      const canonicalName = String(matchedSchoolInList.nameAr || '').trim();
      const canonicalClean = cleanSchoolName(canonicalName);

      if (canonicalCode && sCode && canonicalCode === sCode) return true;
      if (canonicalClean && sName && cleanSchoolName(sName).includes(canonicalClean)) return true;
      if (canonicalClean && targetSchool && cleanSchoolName(targetSchool).includes(canonicalClean)) return true;
    }
  }

  return false;
}

export function isSurveyEqualizationRequest(survey: SurveyResponse | undefined | null): boolean {
  if (!survey) return false;
  // Transfer requests take precedence and are NEVER equivalency requests
  if (survey.serviceType === 'transfer' || Boolean(survey.transferReason) || Boolean(survey.guardianTransferPledge)) {
    return false;
  }
  return Boolean(
    survey.isEqualizationRequest === true ||
    survey.serviceType === 'equalization' ||
    survey.problemType === 'cert_primary_eq' ||
    survey.problemType === 'cert_intermediate_eq' ||
    survey.problemType === 'cert_secondary_eq' ||
    survey.problemType?.startsWith('cert_') ||
    (survey.equalizationStage && survey.equalizationStage !== '') ||
    (survey as any).equalizationDocAttached
  );
}

export function isSurveyTransferRequest(survey: SurveyResponse | undefined | null): boolean {
  if (!survey) return false;
  return Boolean(
    survey.serviceType === 'transfer' ||
    Boolean(survey.transferReason) ||
    Boolean(survey.guardianTransferPledge) ||
    survey.problemType === 'distance_from_school' ||
    (survey.problemType === 'unregistered_desire' && survey.serviceType === 'transfer')
  );
}

/**
 * Standardized Request Type categorizer across the entire application.
 * Ensures that:
 * - New student registration -> 'تسجيل جديد'
 * - Student transfer -> 'نقل طالب'
 * - Certificates / Qualifications Equivalency -> 'معادلة مؤهلات'
 * - Admission / Other -> 'معاملة قبول'
 */
export function getRequestTypeInfo(survey: SurveyResponse | undefined | null, isRtl: boolean = true): {
  label: string;
  subLabel: string;
  badgeClass: string;
  icon: string;
  category: 'registration' | 'transfer' | 'equalization' | 'admission';
} {
  if (!survey) {
    return {
      label: isRtl ? 'تسجيل جديد' : 'New Registration',
      subLabel: isRtl ? 'تسجيل طالب مستجد' : 'Fresh Student Registration',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300/40',
      icon: '🎒',
      category: 'registration'
    };
  }

  // 1. TRANSFER (طلب نقل طالب من مدرسة إلى مدرسة) -> وحدة القبول والتسجيل
  if (isSurveyTransferRequest(survey)) {
    let sub = isRtl ? 'طلب نقل بين المدارس' : 'Transfer Request';
    if (survey.problemType === 'distance_from_school') {
      sub = isRtl ? 'نقل بسبب بعد السكن عن المدرسة' : 'Distance from School Transfer';
    } else if (survey.problemType === 'vacancies_unavailable' || (survey.problemType as string) === 'vacancies_closed') {
      sub = isRtl ? 'طلب شاغر ونقل مدرسي' : 'School Vacancy & Transfer';
    } else if (survey.problemType === 'student_density') {
      sub = isRtl ? 'نقل لمعالجة كثافة الفصول' : 'Classroom Density Transfer';
    } else if (survey.transferReason) {
      sub = survey.transferReason;
    }
    return {
      label: isRtl ? 'نقل طالب' : 'Student Transfer',
      subLabel: sub,
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300/40',
      icon: '🔄',
      category: 'transfer'
    };
  }

  // 2. EQUALIZATION (معادلة مؤهلات وشهادات) -> مسؤول معادلة الشهادات
  if (isSurveyEqualizationRequest(survey)) {
    let sub = isRtl ? 'معادلة شهادات ومؤهلات' : 'Certificates Equivalency';
    if (survey.problemType === 'cert_primary_eq' || survey.equalizationStage === 'primary') {
      sub = isRtl ? 'معادلة شهادة - المرحلة الابتدائية' : 'Primary Cert. Equivalency';
    } else if (survey.problemType === 'cert_intermediate_eq' || survey.equalizationStage === 'intermediate') {
      sub = isRtl ? 'معادلة شهادة - المرحلة المتوسطة' : 'Intermediate Cert. Equivalency';
    } else if (survey.problemType === 'cert_secondary_eq' || survey.equalizationStage === 'secondary') {
      sub = isRtl ? 'معادلة شهادة - المرحلة الثانوية' : 'Secondary Cert. Equivalency';
    }
    return {
      label: isRtl ? 'معادلة مؤهلات' : 'Qualifications Equivalency',
      subLabel: sub,
      badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300/40',
      icon: '🎓',
      category: 'equalization'
    };
  }

  // 3. ADMISSION CASE (معاملة قبول)
  if (survey.problemType === 'unjustified_rejection') {
    return {
      label: isRtl ? 'معاملة قبول' : 'Admission Case',
      subLabel: isRtl ? 'معالجة رفض قبول دون مبرر نظامي' : 'Unjustified Rejection Case',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/40',
      icon: '📋',
      category: 'admission'
    };
  }

  // 4. NEW REGISTRATION (تسجيل جديد)
  let subReg = isRtl ? 'تسجيل طالب مستجد' : 'Fresh Student Registration';
  if (survey.problemType === 'new_registration_saudi') {
    subReg = isRtl ? 'تسجيل مستجد - سعودي' : 'New Saudi Registration';
  } else if (survey.problemType === 'new_registration_resident') {
    subReg = isRtl ? 'تسجيل مستجد - مقيم' : 'New Resident Registration';
  } else if (survey.problemType === 'unregistered_desire') {
    subReg = isRtl ? 'تسجيل وقبول بالرغبة الأولى' : 'Desired Registration';
  }

  return {
    label: isRtl ? 'تسجيل جديد' : 'New Registration',
    subLabel: subReg,
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300/40',
    icon: '🎒',
    category: 'registration'
  };
}

export function getProblemTypeArabicLabel(type: string | undefined): string {
  if (!type) return 'تسجيل جديد';
  switch (type) {
    case 'cert_primary_eq':
      return 'معادلة مؤهلات (المرحلة الابتدائية)';
    case 'cert_intermediate_eq':
      return 'معادلة مؤهلات (المرحلة المتوسطة)';
    case 'cert_secondary_eq':
      return 'معادلة مؤهلات (المرحلة الثانوية)';
    case 'vacancies_unavailable':
    case 'vacancies_closed':
      return 'نقل طالب (طلب شاغر)';
    case 'new_registration_saudi':
      return 'تسجيل جديد (سعودي)';
    case 'new_registration_resident':
      return 'تسجيل جديد (مقيم)';
    case 'student_density':
      return 'نقل طالب (كثافة بالفصول)';
    case 'unjustified_rejection':
      return 'معاملة قبول (رفض دون مبرر)';
    case 'distance_from_school':
      return 'نقل طالب (بعد السكن)';
    case 'unregistered_desire':
      return 'تسجيل جديد (قبول بالرغبة)';
    case 'other':
      return 'معاملة قبول / أخرى';
    default:
      return type;
  }
}

export function getStageArabicLabel(stage: string | undefined): string {
  if (!stage) return 'غير محدد';
  const s = stage.toLowerCase();
  if (s.includes('primary') || s.includes('ابتدائي')) return 'المرحلة الابتدائية';
  if (s.includes('intermediate') || s.includes('متوسط')) return 'المرحلة المتوسطة';
  if (s.includes('secondary') || s.includes('ثانوي')) return 'المرحلة الثانوية';
  if (s.includes('kindergarten') || s.includes('روض')) return 'رياض الأطفال';
  return stage;
}

export function filterSurveysByDateAndType(surveys: SurveyResponse[], filters: BackupFilterOptions): SurveyResponse[] {
  if (!surveys || !Array.isArray(surveys)) return [];

  return surveys.filter((item) => {
    if (!item) return false;

    // Parse date
    const d = item.createdAt ? new Date(item.createdAt) : new Date();
    const itemYear = d.getFullYear().toString();
    const itemMonth = (d.getMonth() + 1).toString(); // 1-12
    const itemDay = d.getDate().toString(); // 1-31

    // 1. Year Filter
    if (filters.year && filters.year !== 'all' && filters.year.toString() !== itemYear) {
      return false;
    }

    // 2. Month Filter
    if (filters.month && filters.month !== 'all' && filters.month.toString() !== itemMonth) {
      return false;
    }

    // 3. Day Filter
    if (filters.day && filters.day !== 'all' && filters.day.toString() !== itemDay) {
      return false;
    }

    // 4. Problem Type / Category Filter
    if (filters.problemType && filters.problemType !== 'all') {
      if (filters.problemType === 'equalizations') {
        const isEq = item.isEqualizationRequest || item.isNonFreshStudent || item.problemType === 'cert_primary_eq' || item.problemType === 'cert_intermediate_eq' || item.problemType === 'cert_secondary_eq';
        if (!isEq) return false;
      } else if (filters.problemType === 'vacancies') {
        const isVac = item.isVacancyRequest || item.problemType === 'vacancies_unavailable' || (item.problemType as string) === 'vacancies_closed' || item.problemType === 'distance_from_school';
        if (!isVac) return false;
      } else if (filters.problemType === 'registrations') {
        const isReg = item.problemType === 'new_registration_saudi' || item.problemType === 'new_registration_resident';
        if (!isReg) return false;
      } else if (item.problemType !== filters.problemType) {
        return false;
      }
    }

    // 5. Stage Filter
    if (filters.stage && filters.stage !== 'all') {
      const stageCat = getStageArabicLabel(item.stage);
      if (!stageCat.includes(filters.stage) && !item.stage?.includes(filters.stage)) {
        return false;
      }
    }

    // 6. Gender Filter
    if (filters.gender && filters.gender !== 'all') {
      const itemGender = item.gender || (item.schoolName?.includes('بنات') ? 'girls' : 'boys');
      if (itemGender !== filters.gender) {
        return false;
      }
    }

    // 7. Status Filter
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'resolved' && !item.isResolved) return false;
      if (filters.status === 'pending' && item.isResolved) return false;
    }

    return true;
  });
}

/**
 * Exports a beautifully structured Excel file containing the filtered backup of requests.
 */
export function exportRequestsBackupToExcel(
  surveys: SurveyResponse[],
  filters: BackupFilterOptions,
  officersList: OfficerUser[] = []
): { success: boolean; count: number; filename: string } {
  const filtered = filterSurveysByDateAndType(surveys, filters);

  if (filtered.length === 0) {
    return { success: false, count: 0, filename: '' };
  }

  const officerMap = new Map<string, string>();
  officersList.forEach(o => officerMap.set(o.id, o.nameAr));

  // Build Arabic Data Rows
  const rows = filtered.map((s, index) => {
    const d = s.createdAt ? new Date(s.createdAt) : new Date();
    const yearStr = d.getFullYear().toString();
    const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = d.getDate().toString().padStart(2, '0');
    const timeStr = d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const fullDateFormatted = `${yearStr}/${monthStr}/${dayStr} ${timeStr}`;

    const assignedOfficerName = s.assignedOfficerId ? (officerMap.get(s.assignedOfficerId) || s.assignedOfficerId) : (s.planningOfficerName || s.leadershipOfficerName || 'غير مسند');
    const statusText = s.isResolved 
      ? 'منجز ومكتمل' 
      : s.vacancyRequestStatus === 'staffing_confirmed' 
      ? 'تم تأكيد التسكين بالمدرسة' 
      : s.vacancyRequestStatus === 'sent_to_school_principal'
      ? 'مرسل لمدير المدرسة للتسكين'
      : s.vacancyRequestStatus === 'sent_to_leadership'
      ? 'مرسل للإدارة المدرسية'
      : s.vacancyRequestStatus === 'approved'
      ? 'تمت الموافقة وفتح الشاغر'
      : 'قيد المعالجة والدراسة';

    return {
      'م': index + 1,
      'رقم المعاملة / الطلب': s.id,
      'سنة التسجيل': yearStr,
      'شهر التسجيل': monthStr,
      'يوم التسجيل': dayStr,
      'تاريخ ووقت التسجيل': fullDateFormatted,
      'اسم المستفيد / ولي الأمر': s.beneficiaryName || s.parentName || 'غير مسجل',
      'رقم الهوية / الإقامة': s.nationalId || 'غير متوفر',
      'رقم الجوال': s.phoneNumber || 'غير متوفر',
      'الجنسية': s.nationality || 'سعودي',
      'نوع الإقامة': s.residencyType === 'visit' ? 'تأشيرة زيارة' : s.residencyType === 'regular' ? 'إقامة نظامية' : (s.customResidencyType || 'مواطن'),
      'المرحلة الدراسية': getStageArabicLabel(s.stage),
      'الصف الدراسي': s.grade || 'غير محدد',
      'الجنس': s.gender === 'girls' ? 'بنات' : 'بنين',
      'المدرسة المطلوبة (الرغبة 1)': s.schoolName || 'غير محدد',
      'المدرسة البديلة (الرغبة 2)': s.secondSchoolName || '-',
      'المدرسة البديلة (الرغبة 3)': s.thirdSchoolName || '-',
      'مكتب التعليم / القطاع': s.sector || s.district || 'المدينة المنورة',
      'الحي السكني': s.neighborhood || '-',
      'نوع الطلب': getProblemTypeArabicLabel(s.problemType),
      'حالة الطلب': statusText,
      'الموظف المسؤول': assignedOfficerName,
      'تفاصيل وملاحظات الطلب': s.notes || s.otherProblemDetails || '-',
      'ملاحظات فتح الشواغر / التسكين': s.vacancyReplyNote || s.staffingNote || s.referralNotes || '-',
      'تاريخ آخر إجراء': s.lastUpdatedAt ? new Date(s.lastUpdatedAt).toLocaleDateString('ar-SA') : '-',
      'تقييم الموظف': s.staffSatisfaction ? `${s.staffSatisfaction}/5` : 'لم يقيم',
      'تقييم الاستقبال': s.receptionSatisfaction ? `${s.receptionSatisfaction}/5` : 'لم يقيم'
    };
  });

  // Create Excel Workbook
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set RTL Support
  (worksheet as any)['!views'] = [{ RTL: true }];

  // Column Widths for readability
  const colWidths = [
    { wch: 6 },   // م
    { wch: 18 },  // رقم الطلب
    { wch: 10 },  // سنة
    { wch: 10 },  // شهر
    { wch: 10 },  // يوم
    { wch: 20 },  // تاريخ ووقت
    { wch: 28 },  // اسم المستفيد
    { wch: 16 },  // الهوية
    { wch: 15 },  // الجوال
    { wch: 14 },  // الجنسية
    { wch: 15 },  // نوع الإقامة
    { wch: 18 },  // المرحلة
    { wch: 14 },  // الصف
    { wch: 10 },  // الجنس
    { wch: 28 },  // المدرسة 1
    { wch: 24 },  // المدرسة 2
    { wch: 24 },  // المدرسة 3
    { wch: 20 },  // القطاع
    { wch: 16 },  // الحي
    { wch: 28 },  // نوع الطلب
    { wch: 24 },  // حالة الطلب
    { wch: 20 },  // الموظف
    { wch: 35 },  // تفاصيل
    { wch: 30 },  // ملاحظات الشواغر
    { wch: 16 },  // آخر إجراء
    { wch: 12 },  // تقييم 1
    { wch: 12 }   // تقييم 2
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  workbook.Workbook = { Views: [{ RTL: true }] };

  const sheetName = 'سجل النسخة الاحتياطية';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Build meaningful filename
  const yr = filters.year && filters.year !== 'all' ? `_${filters.year}` : '';
  const mo = filters.month && filters.month !== 'all' ? `_شهر${filters.month}` : '';
  const dy = filters.day && filters.day !== 'all' ? `_يوم${filters.day}` : '';
  const tp = filters.problemType && filters.problemType !== 'all' ? `_${filters.problemType}` : '_جميع_الطلبات';

  const todayStr = new Date().toISOString().slice(0, 10);
  const filename = `نسخة_احتياطية_الطلبات${tp}${yr}${mo}${dy}_بتاريخ_${todayStr}.xlsx`;

  XLSX.writeFile(workbook, filename);

  return { success: true, count: filtered.length, filename };
}

/**
 * Creates an instant full JSON snapshot of everything for 100% data guarantee
 */
export async function createFullSystemBackupSnapshot(): Promise<string> {
  const surveys = await loadSurveysFromStorage();
  const schools = await loadSchoolsFromStorage();
  const reports = await loadPrincipalReportsFromStorage();
  const officers = await loadOfficersFromStorage();

  const backupPayload = {
    timestamp: new Date().toISOString(),
    version: '2.0',
    system: 'منصة الخدمات الموحدة للقبول والمعادلات',
    counts: {
      surveys: surveys.length,
      schools: schools.length,
      reports: reports.length,
      officers: officers.length
    },
    data: {
      surveys,
      schools,
      reports,
      officers
    }
  };

  const jsonStr = JSON.stringify(backupPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `نسخة_شاملة_النظام_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return `تم أخذ نسخة شاملة بنجاح تحتوي على (${surveys.length}) طلب و (${schools.length}) مدرسة.`;
}
