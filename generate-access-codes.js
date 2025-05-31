// Access Code Generator for Inspirt Labs
// Generates access codes following INSP-XXXX-YYYY pattern

import fs from 'fs';
import path from 'path';

// Simple suffix list - exactly 26 NATO phonetic alphabet codes
const suffixes = [
  "ALFA", "BETA", "CHAR", "DELT", "ECHO", "FXTX", "GOLF", "HOTL", "INDI", "JULI",
  "KILO", "LIMA", "MIKE", "NOVA", "OSCA", "PAPA", "QUBE", "ROME", "SIER", "TANG",
  "UNIC", "VICT", "WHIS", "XRAY", "YANK", "ZULU"
];

function generateAccessCodes(count = 100) {
  const codes = [];
  
  for (let i = 1; i <= count; i++) {
    const sequence = i.toString().padStart(4, '0');
    const suffix = suffixes[(i - 1) % suffixes.length];
    const code = `INSP-${sequence}-${suffix}`;
    
    codes.push({
      code: code,
      sequence: i,
      suffix: suffix,
      active: true,
      createdAt: new Date().toISOString()
    });
  }
  
  return codes;
}

function generateAdminCodes() {
  return [
    {
      code: "INSP-ADMN-CTRL",
      sequence: 9999,
      suffix: "CTRL",
      email: "admin@inspirt.ai",
      active: true,
      isAdmin: true,
      createdAt: new Date().toISOString()
    }
  ];
}

function saveToFiles(codes, adminCodes) {
  const outputDir = './generated-codes';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save all codes as JSON
  fs.writeFileSync(
    path.join(outputDir, 'access-codes.json'),
    JSON.stringify({ codes: [...codes, ...adminCodes] }, null, 2)
  );

  // Save user codes as CSV
  const csvContent = [
    'Code,Sequence,Email,Active',
    ...codes.map(c => `${c.code},${c.sequence},${c.email},${c.active}`)
  ].join('\n');
  
  fs.writeFileSync(path.join(outputDir, 'user-codes.csv'), csvContent);

  // Generate batches of 50
  const batches = [];
  for (let i = 0; i < codes.length; i += 50) {
    const batch = codes.slice(i, i + 50);
    const batchNum = Math.floor(i / 50) + 1;
    
    fs.writeFileSync(
      path.join(outputDir, `batch-${batchNum.toString().padStart(2, '0')}.txt`),
      batch.map(c => c.code).join('\n')
    );
  }

  return { codes, adminCodes };
}

function main() {
  console.log('Generating Inspirt Labs Access Codes...');
  
  const userCodes = generateAccessCodes(100);
  const adminCodes = generateAdminCodes();
  saveToFiles(userCodes, adminCodes);

  console.log(`Generated ${userCodes.length} user codes + ${adminCodes.length} admin codes`);
  console.log('Files saved to: ./generated-codes/');
  
  console.log('\nFirst 10 Access Codes:');
  userCodes.slice(0, 10).forEach(code => {
    console.log(`  ${code.code}`);
  });
  
  console.log('\nAdmin Access Code:');
  console.log(`  ${adminCodes[0].code}`);
}

main();