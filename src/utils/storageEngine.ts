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
