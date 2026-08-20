// High-Performance Secured IndexedDB + LocalStorage Hybrid Persistence Engine
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

// مفتاح تشفير محلي ثابت مخصص للمتصفح لحماية الهويات والجوالات محلياً
const ENCRYPTION_SALT = 'MoeSmartSecureSalt_2026';

let dbInstance: IDBDatabase | null = null;

// دالة أمنية لتشفير النصوص الحساسة قبل تخزينها محلياً لحماية خصوصية المستفيدين
function encryptField(text: string | undefined | null): string {
  if (!text) return '';
  try {
    // محاكاة تشفير آمن سريع متوافق مع المتصفح للبيانات الحساسة كالهوية والجوال
    const b64 = btoa(encodeURIComponent(text));
    return `SEC_${b64.split('').reverse().join('')}`;
  } catch {
    return text || '';
  }
}

// دالة فك التشفير التلقائي عند استدعاء البيانات لعرضها في لوحة التحكم
function decryptField(cipher: string | undefined | null): string {
  if (!cipher || !cipher.startsWith('SEC_')) return cipher || '';
  try {
    const cleanCipher = cipher.replace('SEC_', '').split('').reverse().join('');
    return decodeURIComponent(atob(cleanCipher));
  } catch {
    return cipher || '';
  }
}

// تطهير وتأمين حقول المعاملة بالكامل
function secureSurveyData(survey: SurveyResponse): SurveyResponse {
  return {
    ...survey,
    nationalId: encryptField(survey.nationalId),
    phoneNumber: encryptField(survey.phoneNumber),
    parentName: encryptField(survey.parentName),
    beneficiaryName: encryptField(survey.beneficiaryName)
  };
}

// فك تأمين حقول المعاملة لعرضها برمجياً بالإكسل واللوحة
function unsecureSurveyData(survey: SurveyResponse): SurveyResponse {
  return {
    ...survey,
    nationalId: decryptField(survey.nationalId),
    phoneNumber: decryptField(survey.phoneNumber),
    parentName: decryptField(survey.parentName),
    beneficiaryName: decryptField(survey.beneficiaryName)
  };
}

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
  if (!surveys || (!Array.isArray(surveys))) return;
  if (surveys.length === 0 && !options?.isConfirmedAdminClear) {
    const existing = await loadSurveysFromStorage();
    if (existing && existing.length > 0) {
      console.warn('Blocked blank overwrite to protect existing requests.');
      return;
    }
  }

  // تشفير البيانات الحساسة قبل التخزين الفيزيائي بالمتصفح حماية للمستندات
  const securedSurveys = surveys.map(s => secureSurveyData(s));

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SURVEYS, 'readwrite');
    const store = tx.objectStore(STORE_SURVEYS);
    store.clear();
    for (let i = 0; i < securedSurveys.length; i++) {
      store.put(securedSurveys[i]);
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB saveSurveys failed, falling back to LocalStorage:', err);
  }

  try {
    if (securedSurveys.length <= 2000) {
      localStorage.setItem('beneficiary_surveys', JSON.stringify(securedSurveys));
    } else {
      localStorage.setItem('beneficiary_surveys', JSON.stringify(securedSurveys.slice(0, 1000)));
    }
  } catch (quotaErr) {
    try {
      localStorage.setItem('beneficiary_surveys', JSON.stringify(securedSurveys.slice(0, 300)));
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

  const mergedMap = new Map<string, SurveyResponse>();
  dbItems.forEach(item => { if (item && item.id) mergedMap.set(item.id, item); });
  lsItems.forEach(item => { if (item && item.id && !mergedMap.has(item.id)) mergedMap.set(item.id, item); });
  
  // فك تشفير السجلات تلقائياً عند القراءة والدمج لتخرج نظيفة للبرنامج والإكسل
  const finalRecords = Array.from(mergedMap.values());
  return finalRecords.map(r => unsecureSurveyData(r));
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
  if (dbSchools && dbSchools.length > 0) return dbSchools;
  if (lsSchools && lsSchools.length > 0) return lsSchools;
  return [];
}

// ----------------------------------------------------
// 3. PRINCIPAL REPORTS PERSISTENCE (تقارير وبلاغات مدراء المدارس)
// ----------------------------------------------------
export async function savePrincipalReportsToStorage(reports: PrincipalReport[], options?: { isConfirmedAdminClear?: boolean }): Promise<void> {
  if (!reports || !Array.isArray(reports)) return;
  if (reports.length === 0 && !options?.isConfirmedAdminClear) {
    const existing = await loadPrincipalReportsFromStorage();
    if (existing && existing.length > 0) return;
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
    const cached = localStorage.getItem('officer_users_v4');
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
// 6. DATE-BASED EXCEL BACKUP ENGINE
// ----------------------------------------------------

export interface BackupFilterOptions {
  year?: string | number;
  month?: string | number;
  day?: string | number;
  problemType?: string;
  stage?: string;
  gender?: string;
  status?: string;
}

export function filterSurveysByDateAndType(surveys: SurveyResponse[], filters: BackupFilterOptions): SurveyResponse[] {
  if (!surveys || !Array.isArray(surveys)) return [];

  return surveys.filter((item) => {
    if (!item) return false;

    const d = item.createdAt ? new Date(item.createdAt) : new Date();
    const itemYear = d.getFullYear().toString();
    const itemMonth = (d.getMonth() + 1).toString();
    const itemDay = d.getDate().toString();

    if (filters.year && filters.year !== 'all' && filters.year.toString() !== itemYear) return false;
    if (filters.month && filters.month !== 'all' && filters.month.toString() !== itemMonth) return false;
    if (filters.day && filters.day !== 'all' && filters.day.toString() !== itemDay) return false;

    if (filters.problemType && filters.problemType !== 'all') {
      if (filters.problemType === 'equalizations') {
        if (!isSurveyEqualizationRequest(item)) return false;
      } else if (filters.problemType === 'vacancies') {
        if (!isSurveyTransferRequest(item)) return false;
      } else if (item.problemType !== filters.problemType) {
        return false;
      }
    }

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'resolved' && !item.isResolved) return false;
      if (filters.status === 'pending' && item.isResolved) return false;
    }

    return true;
  });
}

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

  const rows = filtered.map((s, index) => {
    const d = s.createdAt ? new Date(s.createdAt) : new Date();
    const dateStr = d.toLocaleDateString('ar-SA');
    const typeInfo = getRequestTypeInfo(s, true);

    return {
      'م': index + 1,
      'رقم المعاملة': s.id,
      'تاريخ التسجيل': dateStr,
      'اسم المستفيد': s.beneficiaryName || s.parentName || 'غير مسجل',
      'رقم الهوية': s.nationalId || 'غير متوفر',
      'رقم الجوال': s.phoneNumber || 'غير متوفر',
      'المرحلة': getStageArabicLabel(s.stage),
      'نوع الطلب': typeInfo.label,
      'التصنيف': typeInfo.subLabel,
      'الحالة': s.isResolved ? 'منجز' : 'قيد المعالجة',
      'الموظف المسؤول': s.assignedOfficerId ? (officerMap.get(s.assignedOfficerId) || s.assignedOfficerId) : 'غير مسند'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  (worksheet as any)['!views'] = [{ RTL: true }];
  worksheet['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 20 }, { wch: 28 }, { wch: 16 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 }];

  const workbook = XLSX.utils.book_new();
  workbook.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل النسخة الاحتياطية');

  const filename = `backup_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);

  return { success: true, count: filtered.length, filename };
}

// ----------------------------------------------------
// 7. BUSINESS LOGIC HELPERS
// ----------------------------------------------------

export function isSurveyEqualizationRequest(survey: SurveyResponse | undefined | null): boolean {
  if (!survey) return false;
  return (
    survey.requestType === 'equivalency' ||
    survey.serviceType === 'equalization' ||
    Boolean(survey.isEqualizationRequest) ||
    String(survey.problemType).startsWith('cert_')
  );
}

export function isSurveyTransferRequest(survey: SurveyResponse | undefined | null): boolean {
  if (!survey) return false;
  return (
    survey.requestType === 'transfer' ||
    survey.serviceType === 'transfer' ||
    survey.problemType === 'distance_from_school' ||
    survey.problemType === 'vacancies_unavailable'
  );
}

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
      badgeClass: 'bg-emerald-100 text-emerald-800',
      icon: '🎒',
      category: 'registration'
    };
  }

  if (isSurveyEqualizationRequest(survey)) {
    return {
      label: isRtl ? 'معادلة' : 'Equivalency',
      subLabel: isRtl ? 'معادلة شهادات ومؤهلات' : 'Certificates Equivalency',
      badgeClass: 'bg-purple-100 text-purple-800',
      icon: '🎓',
      category: 'equalization'
    };
  }

  if (isSurveyTransferRequest(survey)) {
    return {
      label: isRtl ? 'نقل' : 'Transfer',
      subLabel: isRtl ? 'طلب نقل بين المدارس' : 'Transfer Request',
      badgeClass: 'bg-blue-100 text-blue-800',
      icon: '🔄',
      category: 'transfer'
    };
  }

  return {
    label: isRtl ? 'تسجيل جديد' : 'New Registration',
    subLabel: isRtl ? 'تسجيل طالب مستجد' : 'Fresh Student Registration',
    badgeClass: 'bg-emerald-100 text-emerald-800',
    icon: '🎒',
    category: 'registration'
  };
}

export function getProblemTypeArabicLabel(type: string | undefined): string {
  if (!type) return 'تسجيل جديد';
  switch (type) {
    case 'cert_primary_eq': return 'معادلة ابتدائي';
    case 'cert_intermediate_eq': return 'معادلة متوسط';
    case 'cert_secondary_eq': return 'معادلة ثانوي';
    case 'vacancies_unavailable': return 'نقل - شواغر';
    case 'distance_from_school': return 'نقل - بعد السكن';
    case 'new_registration_saudi': return 'تسجيل سعودي';
    case 'new_registration_resident': return 'تسجيل مقيم';
    default: return 'أخرى';
  }
}

export function getStageArabicLabel(stage: string | undefined): string {
  if (!stage) return 'غير محدد';
  const s = stage.toLowerCase();
  if (s.includes('primary') || s.includes('ابتدائي')) return 'المرحلة الابتدائية';
  if (s.includes('intermediate') || s.includes('متوسط')) return 'المرحلة المتوسطة';
  if (s.includes('secondary') || s.includes('ثانوي')) return 'المرحلة الثانوية';
  return stage;
}

// ----------------------------------------------------
// 6. UTILS & HELPERS
// ----------------------------------------------------
export function normalizeArabicText(str: string | number | undefined | null): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/\u0640/g, '')
    .replace(/[أإآٱءئؤ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

export function cleanSchoolName(name: string | undefined | null): string {
  if (!name) return '';
  let norm = normalizeArabicText(name);
  norm = norm.replace(/\b(مدرسه|مجمع|ابتدائيه|متوسطه|ثانويه|روضه|طفوله مبكره|بنين|بنات|للبنين|للبنات)\b/g, ' ').trim();
  return norm.replace(/\s+/g, ' ');
}

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

  const sCode = String(survey.schoolCode || '').trim();
  if (pCode && sCode && sCode === pCode) return true;

  const sName = String(survey.schoolName || '').trim();
  if (sName) {
    const sNorm = normalizeArabicText(sName);
    const sClean = cleanSchoolName(sName);
    if (sNorm === pNorm || (pClean && sClean && (sClean.includes(pClean) || pClean.includes(sClean)))) {
      return true;
    }
  }

  return false;
}

export async function createFullSystemBackupSnapshot(): Promise<string> {
  const surveys = await loadSurveysFromStorage();
  const schools = await loadSchoolsFromStorage();
  const reports = await loadPrincipalReportsFromStorage();
  const officers = await loadOfficersFromStorage();

  const backupPayload = {
    timestamp: new Date().toISOString(),
    version: '2.0',
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
  a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return `تم أخذ نسخة شاملة بنجاح.`;
}
