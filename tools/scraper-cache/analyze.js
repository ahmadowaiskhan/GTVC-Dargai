const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('original_page.html', 'utf8');

// Find images
const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
const images = new Set();
let match;
while ((match = imgRegex.exec(html)) !== null) {
  images.add(match[1]);
}

// Find background images in inline styles
const bgRegex = /url\(["']?([^"')]+)["']?\)/gi;
while ((match = bgRegex.exec(html)) !== null) {
  if (match[1].includes('gtvcdargai.edu.pk') || match[1].includes('wp-content')) {
    images.add(match[1]);
  }
}

// Find links
const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
const links = [];
while ((match = linkRegex.exec(html)) !== null) {
  const text = match[2].replace(/<[^>]+>/g, '').trim();
  if (text) {
    links.push({ href: match[1], text });
  }
}

// Find headings
const hRegex = /<(h[1-6])[^>]*>(.*?)<\/\1>/gis;
const headings = [];
while ((match = hRegex.exec(html)) !== null) {
  const text = match[2].replace(/<[^>]+>/g, '').trim();
  if (text) {
    headings.push({ tag: match[1], text });
  }
}

console.log('--- FOUND IMAGES (' + images.size + ') ---');
console.log(Array.from(images).slice(0, 30));

console.log('\n--- FOUND HEADINGS (' + headings.length + ') ---');
console.log(headings);

console.log('\n--- NAVIGATION / LINKS SAMPLE ---');
console.log(links.slice(0, 25));

fs.writeFileSync('extracted_info.json', JSON.stringify({
  images: Array.from(images),
  headings,
  links
}, null, 2));
