const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
let missingCount = 0;

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const regex = /assets\/images\/[a-zA-Z0-9._-]+/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const imgPath = match[0];
    if (!fs.existsSync(imgPath)) {
      console.log(`[MISSING] in ${f}: ${imgPath}`);
      missingCount++;
    }
  }
});

if (missingCount === 0) {
  console.log('✅ ALL IMAGE REFERENCES ARE VALID AND PRESENT LOCALLY!');
} else {
  console.log(`⚠️ Found ${missingCount} missing image references.`);
}
