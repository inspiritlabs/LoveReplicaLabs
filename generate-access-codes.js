// Access Code Generator for Inspirt Labs
// Generates 1000+ unique access codes following INSP-XXXX-YYYY pattern

const fs = require('fs');
const path = require('path');

// Extended suffix list for maximum uniqueness
const suffixes = [
  // NATO Phonetic Alphabet
  "ALFA", "BETA", "GAMA", "DELT", "ECHO", "FXTX", "GOLF", "HOTL", "INDI", "JULI",
  "KILO", "LIMA", "MIKE", "NOVA", "OSCA", "PAPA", "QUBE", "ROME", "SIER", "TANG",
  "UNIC", "VICT", "WHIS", "XRAY", "YANK", "ZULU",
  
  // Tech/Space Terms
  "APEX", "CORE", "FLUX", "HAWK", "IRON", "JADE", "KING", "LYNX", "MARS", "NEON",
  "OPUS", "PEAK", "QUAD", "RUSH", "SYNC", "TIDE", "UNIX", "VOLT", "WAVE", "XENO",
  "YAML", "ZERO", "ATOM", "BYTE", "CODE", "DATA", "EDGE", "FIRE", "GRID", "HASH",
  
  // Space/Cosmic Terms
  "STAR", "VOID", "BEAM", "COIL", "DAWN", "EONS", "FLUX", "GLOW", "HALO", "IONS",
  "JETS", "KNOT", "LENS", "MOON", "NODE", "ORBS", "POLE", "QARK", "RAYS", "SPIN",
  "TWIN", "UNIT", "VIBE", "WARP", "ZONE", "ARCH", "BIND", "CELL", "DECK", "EMIT",
  
  // Premium Tech
  "FLOW", "GEAR", "HOPE", "IDEA", "JACK", "KEEP", "LEAP", "MIND", "NEXT", "OPEN",
  "PATH", "QUIT", "RISE", "SOUL", "TIME", "UBER", "VIEW", "WILD", "ZOOM", "ABLE",
  "BOLD", "COOL", "DEEP", "EPIC", "FAST", "GOOD", "HIGH", "LIVE", "MOVE", "NICE",
  
  // Abstract Concepts
  "PURE", "REAL", "SAFE", "TRUE", "WISE", "CALM", "DARK", "EASY", "FREE", "HUGE",
  "KIND", "LAST", "MEGA", "NEAR", "ONLY", "PLUS", "RICH", "SLIM", "TALL", "VAST"
];

function generateAccessCodes(count = 1000) {
  const codes = [];
  
  for (let i = 1; i <= count; i++) {
    const sequence = i.toString().padStart(4, '0');
    const suffix = suffixes[(i - 1) % suffixes.length];
    const code = `INSP-${sequence}-${suffix}`;
    
    codes.push({
      code: code,
      sequence: i,
      suffix: suffix,
      email: `user${sequence}@inspirt.ai`,
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
  
  const userCodes = generateAccessCodes(1000);
  const adminCodes = generateAdminCodes();
  saveToFiles(userCodes, adminCodes);

  console.log(`Generated ${userCodes.length} user codes + ${adminCodes.length} admin codes`);
  console.log('Files saved to: ./generated-codes/');
  
  console.log('\nSample Access Codes:');
  userCodes.slice(0, 10).forEach(code => {
    console.log(`  ${code.code}`);
  });
  
  console.log('\nAdmin Access Code:');
  console.log(`  ${adminCodes[0].code}`);
}

if (require.main === module) {
  main();
}

module.exports = { generateAccessCodes, generateAdminCodes, suffixes };