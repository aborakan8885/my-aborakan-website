const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const targetBefore = `                                        </div>
                                      </div>
                                    )}

                                  {(activeOfficer.role === 'admin' || activeOfficer.role === 'director') && !assigningSurveyId && (`;

const targetAfter = `                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {(activeOfficer.role === 'admin' || activeOfficer.role === 'director') && !assigningSurveyId && (`;

content = content.replace(targetBefore, targetAfter);
fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log('Added missing </div> for space-y-2 wrapper');
