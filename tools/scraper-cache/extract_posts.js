const fs = require('fs');
const html = fs.readFileSync('original_page.html', 'utf8');

// Find all article or post entries (News & Events)
const postRegex = /<article[^>]*>(.*?)<\/article>/gis;
const posts = [];
let m;
while ((m = postRegex.exec(html)) !== null) {
  const content = m[1];
  const titleM = /<h2[^>]*class="[^"]*entry-title[^"]*"[^>]*><a[^>]*>(.*?)<\/a><\/h2>/gis.exec(content);
  const dateM = /<span class="published">(.*?)<\/span>/gis.exec(content);
  const imgM = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi.exec(content);
  const descM = /<div class="post-content">(.*?)<\/div>/gis.exec(content);
  
  posts.push({
    title: titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '',
    date: dateM ? dateM[1].trim() : '',
    img: imgM ? imgM[1] : '',
    desc: descM ? descM[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''
  });
}

console.log('Found posts:', posts.length);
fs.writeFileSync('extracted_posts.json', JSON.stringify(posts, null, 2));
