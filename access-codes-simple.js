// Simple Access Code Generator - 500 codes
import fs from 'fs';

const suffixes = ["ALFA", "BETA", "CHAR", "DELT", "ECHO", "FXTX", "GOLF", "HOTL", "INDI", "JULI", "KILO", "LIMA", "MIKE", "NOVA", "OSCA", "PAPA", "QUBE", "ROME", "SIER", "TANG", "UNIC", "VICT", "WHIS", "XRAY", "YANK", "ZULU"];

// Generate 500 codes
const codes = [];
for (let i = 1; i <= 500; i++) {
  const sequence = i.toString().padStart(4, '0');
  const suffix = suffixes[(i - 1) % suffixes.length];
  codes.push(`INSP-${sequence}-${suffix}`);
}

// Save codes
fs.mkdirSync('./codes-500', { recursive: true });
fs.writeFileSync('./codes-500/all-codes.txt', codes.join('\n'));
fs.writeFileSync('./codes-500/codes.json', JSON.stringify(codes, null, 2));

// Create batches of 50
for (let i = 0; i < codes.length; i += 50) {
  const batch = codes.slice(i, i + 50);
  const batchNum = Math.floor(i / 50) + 1;
  fs.writeFileSync(`./codes-500/batch-${batchNum.toString().padStart(2, '0')}.txt`, batch.join('\n'));
}

console.log(`Generated 500 codes:`);
console.log(`First 10: ${codes.slice(0, 10).join(', ')}`);
console.log(`Last 10: ${codes.slice(-10).join(', ')}`);