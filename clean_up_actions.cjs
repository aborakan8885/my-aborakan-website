const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Wrap the planning dropdown correctly
const brokenPlanningArea = `                                       <select

                                           value={selectedPlanningOfficerMap[survey.id] || survey.assignedOfficerId || ''}`;

const cleanPlanningBlock = `                                   {/* Planning Officer Assignment for Pending Surveys */}
                                   {isPlanningAuth && !isVacancyOpened && !isArchived && (
                                     <div className="p-2 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-1.5 text-start">
                                       <label className="block text-[10px] font-extrabold text-amber-900 dark:text-amber-200">
                                         👤 {isRtl ? 'تكليفات التخطيط / القبول:' : 'Assign Planning Officer:'}
                                       </label>
                                       <div className="flex items-center gap-1.5">
                                         <select
                                           value={selectedPlanningOfficerMap[survey.id] || survey.assignedOfficerId || ''}`;

// 2. Identify old equivalency block starting at `/* EQUIVALENCY OFFICER ACTION BLOCK */` (the second occurrence)
const oldBlockMarker = `{/* EQUIVALENCY OFFICER ACTION BLOCK */}`;
const firstIdx = content.indexOf(oldBlockMarker);
const secondIdx = content.indexOf(oldBlockMarker, firstIdx + 1);

console.log('firstIdx:', firstIdx, 'secondIdx:', secondIdx);

if (firstIdx !== -1 && secondIdx !== -1) {
  // Find where the old block ends (just before `{/* STEP 2: Open Vacancy`)
  const endOfOldBlockMarker = `{/* STEP 2: Open Vacancy (تم فتح الشاغر 🔓) */}`;
  const endIdx = content.indexOf(endOfOldBlockMarker, secondIdx);

  if (endIdx !== -1) {
    // Remove old block completely
    content = content.slice(0, secondIdx) + content.slice(endIdx);
    console.log('Successfully removed second old equivalency block!');
  }
}

// Replace broken planning area
content = content.replace(brokenPlanningArea, cleanPlanningBlock);

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log('Dashboard.tsx updated cleanly!');
