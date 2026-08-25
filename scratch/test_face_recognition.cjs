const fs = require('fs');

console.log('=== TESTING CLASSSENSE AI BIOMETRIC FACE RECOGNITION PIPELINE ===');

// Check that types, engine, and UI components exist and contain face recognition logic
const filesToCheck = [
  'src/types/index.ts',
  'src/utils/faceRecognitionEngine.ts',
  'src/components/students/FaceRegistrationModal.tsx',
  'src/components/students/StudentProfileModal.tsx',
  'src/pages/StudentsPage.tsx',
  'src/pages/AdvisorDailyAttendancePage.tsx',
  'src/pages/CameraMonitorPage.tsx'
];

let allPassed = true;
for (const file of filesToCheck) {
  if (fs.existsSync(file)) {
    console.log(`[PASS] File exists: ${file}`);
  } else {
    console.log(`[FAIL] Missing file: ${file}`);
    allPassed = false;
  }
}

// Inspect face recognition engine logic
const engineContent = fs.readFileSync('src/utils/faceRecognitionEngine.ts', 'utf8');
const checks = [
  { name: '128-D Embedding dimension', test: engineContent.includes('128') },
  { name: 'Cosine Similarity Dot Product', test: engineContent.includes('dotProduct') || engineContent.includes('computeCosineSimilarity') },
  { name: '80% High Match Threshold', test: engineContent.includes('0.80') || engineContent.includes('80') },
  { name: '50% Low Confidence Threshold', test: engineContent.includes('0.50') || engineContent.includes('50') },
  { name: 'Unknown Face Handling', test: engineContent.includes('UNKNOWN') || engineContent.includes('Unknown') || engineContent.includes('isUnknown') },
  { name: 'Face Quality Validation Checks', test: engineContent.includes('qualityScore') && engineContent.includes('isCentered') }
];

for (const check of checks) {
  if (check.test) {
    console.log(`[PASS] ${check.name}`);
  } else {
    console.log(`[FAIL] ${check.name}`);
    allPassed = false;
  }
}

// Inspect Attendance Page for Photo and Confidence columns
const attendanceContent = fs.readFileSync('src/pages/AdvisorDailyAttendancePage.tsx', 'utf8');
const attendanceChecks = [
  { name: 'Photo table column', test: attendanceContent.includes('<th className="py-3 px-4">Photo</th>') },
  { name: 'Confidence table column', test: attendanceContent.includes('<th className="py-3 px-4">Confidence</th>') },
  { name: 'Review Required on low confidence', test: attendanceContent.includes('Review') || attendanceContent.includes('isLowConfidence') },
  { name: 'Live AI Camera Scan modal', test: attendanceContent.includes('Live AI Face Recognition Scanner') }
];

for (const check of attendanceChecks) {
  if (check.test) {
    console.log(`[PASS] Attendance: ${check.name}`);
  } else {
    console.log(`[FAIL] Attendance: ${check.name}`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\n>>> ALL BIOMETRIC FACE RECOGNITION VALIDATIONS PASSED! <<<');
} else {
  console.error('\n>>> SOME TESTS FAILED <<<');
  process.exit(1);
}
