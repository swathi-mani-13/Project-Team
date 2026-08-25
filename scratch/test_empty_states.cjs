const fs = require('fs');
const path = require('path');

const mockDataPath = path.resolve(__dirname, '../src/data/mockData.ts');
const mockDataContent = fs.readFileSync(mockDataPath, 'utf-8');

console.log('=== VERIFYING MOCK DATA PURITY ===');

const checks = [
  { name: 'MOCK_STUDENTS is empty array', regex: /export const MOCK_STUDENTS:\s*Student\[\]\s*=\s*\[\];/ },
  { name: 'MOCK_ALERTS is empty array', regex: /export const MOCK_ALERTS:\s*AlertItem\[\]\s*=\s*\[\];/ },
  { name: 'MOCK_CORRECTIONS is empty array', regex: /export const MOCK_CORRECTIONS:\s*CorrectionRequest\[\]\s*=\s*\[\];/ },
  { name: 'MOCK_CAMERAS is empty array', regex: /export const MOCK_CAMERAS:\s*CameraDevice\[\]\s*=\s*\[\];/ },
  { name: 'MOCK_AUDIT_LOGS is empty array', regex: /export const MOCK_AUDIT_LOGS:\s*AuditLog\[\]\s*=\s*\[\];/ },
  { name: 'MOCK_LIVE_RECORDS is empty array', regex: /export const MOCK_LIVE_RECORDS:\s*LiveAttendanceRecord\[\]\s*=\s*\[\];/ },
  { name: 'MOCK_SUBMITTED_REPORTS is empty array', regex: /export const MOCK_SUBMITTED_REPORTS:\s*SubmittedReport\[\]\s*=\s*\[\];/ },
  { name: 'MOCK_FACULTY is empty array', regex: /export const MOCK_FACULTY:\s*SubjectFacultyAccount\[\]\s*=\s*\[\];/ },
  { name: 'MOCK_SUBJECTS is empty array', regex: /export const MOCK_SUBJECTS:\s*SubjectItem\[\]\s*=\s*\[\];/ },
  { name: 'MOCK_CLASSES is empty array', regex: /export const MOCK_CLASSES:\s*CollegeClass\[\]\s*=\s*\[\];/ },
  { name: 'MOCK_ANALYTICS weekly is empty array', regex: /weekly:\s*\[\]/ },
  { name: 'MOCK_ANALYTICS daily is empty array', regex: /daily:\s*\[\]/ },
  { name: 'MOCK_ANALYTICS monthly is empty array', regex: /monthly:\s*\[\]/ },
];

let failed = 0;
for (const check of checks) {
  if (check.regex.test(mockDataContent)) {
    console.log(`[PASS] ${check.name}`);
  } else {
    console.error(`[FAIL] ${check.name}`);
    failed++;
  }
}

if (failed === 0) {
  console.log('\n>>> ALL MOCK DATA PURITY TESTS PASSED SUCCESSFULLY! <<<');
} else {
  console.error(`\n>>> ${failed} TESTS FAILED! <<<`);
  process.exit(1);
}
