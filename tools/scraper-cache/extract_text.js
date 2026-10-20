const fs = require('fs');
const html = fs.readFileSync('original_page.html', 'utf8');

// Extract text modules or sections
const sections = [];
const pbTextRegex = /<div class="[^"]*et_pb_text_inner[^"]*">(.*?)<\/div>/gis;
let m;
while ((m = pbTextRegex.exec(html)) !== null) {
  const clean = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length > 10) {
    sections.push(clean);
  }
}

// Extract blurb modules (courses, features)
const blurbRegex = /<div class="[^"]*et_pb_blurb_content[^"]*">(.*?)<\/div>\s*<\/div>/gis;
const blurbs = [];
while ((m = blurbRegex.exec(html)) !== null) {
  const clean = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length > 5) {
    blurbs.push(clean);
  }
}

// Extract testimonials
const testRegex = /<div class="[^"]*et_pb_testimonial_description_inner[^"]*">(.*?)<\/div>/gis;
const testimonials = [];
while ((m = testRegex.exec(html)) !== null) {
  const clean = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length > 5) {
    testimonials.push(clean);
  }
}

fs.writeFileSync('site_content_parsed.json', JSON.stringify({
  sections: Array.from(new Set(sections)),
  blurbs: Array.from(new Set(blurbs)),
  testimonials
}, null, 2));

console.log('Extracted', sections.length, 'sections,', blurbs.length, 'blurbs,', testimonials.length, 'testimonials');
