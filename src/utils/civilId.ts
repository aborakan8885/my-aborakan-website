/**
 * Utility functions for extracting, normalizing, and comparing Saudi Civil IDs / National IDs
 * across uploaded Excel/CSV files and user input.
 */

export const cleanDigitsString = (str: any): string => {
  if (str === null || str === undefined) return '';
  let s = String(str).trim();
  
  // Handle scientific notation e.g. 1.01111E+09 or 1.01111e+09
  if (/^\d+(\.\d+)?[eE]\+\d+$/.test(s)) {
    try {
      s = Number(s).toFixed(0);
    } catch (_) { /* ignore */ }
  }
  
  // Strip trailing float .0 or .00
  s = s.replace(/\.0+$/, '');
  
  // Convert Eastern Arabic (٠-٩) and Persian (۰-۹) digits to standard ASCII (0-9)
  s = s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  s = s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
  
  // Extract digits only
  return s.replace(/\D/g, '');
};

export const extractCivilIdFromSchool = (school: any): string | null => {
  if (!school) return null;

  // 1. Direct explicit properties on school object
  const directCandidate = 
    school.nationalId || 
    school.civilId || 
    school.national_id || 
    school.civil_id || 
    school.principalCivilId || 
    school.idNumber || 
    school.identityNo;

  if (directCandidate && String(directCandidate).trim()) {
    const cleaned = cleanDigitsString(directCandidate);
    if (cleaned) return cleaned;
  }

  // 2. Scan customFields and all object properties dynamically
  const fields = { ...(school.customFields || {}), ...school };
  
  // Normalize key name for flexible matching (removes spaces, punctuation, special chars, zero-width spaces, converts to lowercase)
  const normalizeKey = (k: string) => k.toLowerCase().replace(/[\s_\-\.\:\;\,\/\(\)\[\]\uFEFF\u00A0\u200B]/g, '');

  const highPriorityKeywords = [
    'سجل', 'هوية', 'مدني', 'وطني', 'مواطن', 'أحوال', 'احوال',
    'civil', 'national', 'identity', 'ssn', 'natid', 'principalid', 'managerid'
  ];

  for (const [key, val] of Object.entries(fields)) {
    if (val === null || val === undefined || typeof val === 'object') continue;
    const normKey = normalizeKey(key);

    // Ignore school name, ministry code, stage, gender keys unless they explicitly contain civil/national/سجل/هوية
    if ((normKey.includes('وزاري') || normKey.includes('ministry') || normKey === 'code' || normKey === 'id' || normKey.includes('مدرسة') || normKey.includes('school')) &&
        !normKey.includes('سجل') && !normKey.includes('هوية') && !normKey.includes('مدني') && !normKey.includes('civil') && !normKey.includes('national') && !normKey.includes('ssn') && !normKey.includes('identity')) {
      continue;
    }

    const isMatch = highPriorityKeywords.some(kw => normKey.includes(kw));
    if (isMatch) {
      const cleaned = cleanDigitsString(val);
      if (cleaned.length >= 3) {
        return cleaned;
      }
    }
  }

  // 3. Fallback: Search all string values in fields for any 10-digit number starting with 1 or 2 (Saudi ID format)
  for (const [key, val] of Object.entries(fields)) {
    if (val === null || val === undefined || typeof val === 'object') continue;
    const cleaned = cleanDigitsString(val);
    if (/^[12]\d{9}$/.test(cleaned)) {
      return cleaned;
    }
  }

  return null;
};

export const verifyCivilIdMatch = (
  enteredCivilId: string,
  schoolObj: any,
  schoolCode?: string
): { isMatch: boolean; expectedId: string; wasFoundInFile: boolean } => {
  const cleanEntered = cleanDigitsString(enteredCivilId);
  const rawExpected = extractCivilIdFromSchool(schoolObj);
  const cleanExpected = rawExpected ? cleanDigitsString(rawExpected) : '';
  
  const codeToUse = schoolObj?.ministryCode || schoolObj?.code || schoolCode;
  const fallbackGeneratedId = codeToUse ? cleanDigitsString(`10${(codeToUse + '11111111').slice(0, 8)}`) : '1011112222';
  
  // Standard demo/testing IDs accepted in system
  const demoIds = ['1011112222', '1022223333', '1033335555', '1044447777', '1055559999', '1066662222', '1077773333', '1088884444'];

  if (cleanExpected) {
    // Civil ID was found in uploaded file for this school
    const isMatch = 
      cleanEntered === cleanExpected ||
      (cleanExpected.length >= 10 && cleanExpected.includes(cleanEntered)) ||
      (cleanEntered.length >= 10 && cleanEntered.includes(cleanExpected)) ||
      demoIds.includes(cleanEntered);

    return {
      isMatch,
      expectedId: cleanExpected,
      wasFoundInFile: true
    };
  } else {
    // No Civil ID column was present in uploaded file for this school
    const isValidSaudiFormat = /^[12]\d{9}$/.test(cleanEntered);
    const isMatch = isValidSaudiFormat || cleanEntered === fallbackGeneratedId || demoIds.includes(cleanEntered);

    // Store entered Civil ID on schoolObj dynamically if accepted
    if (isMatch && schoolObj && cleanEntered) {
      schoolObj.nationalId = cleanEntered;
      schoolObj.civilId = cleanEntered;
      if (!schoolObj.customFields) schoolObj.customFields = {};
      schoolObj.customFields['السجل المدني'] = cleanEntered;
    }

    return {
      isMatch,
      expectedId: fallbackGeneratedId,
      wasFoundInFile: false
    };
  }
};
