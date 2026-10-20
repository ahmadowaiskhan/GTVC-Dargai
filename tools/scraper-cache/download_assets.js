const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const data = JSON.parse(fs.readFileSync('extracted_info.json', 'utf8'));
const images = data.images;

const imgDir = path.join(__dirname, 'assets', 'images');
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

function downloadImage(url, filename) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(path.join(imgDir, filename));
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      rejectUnauthorized: false,
      timeout: 10000
    }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve({ success: true, filename, url });
        });
      } else {
        file.close();
        if (fs.existsSync(path.join(imgDir, filename))) fs.unlinkSync(path.join(imgDir, filename));
        resolve({ success: false, status: res.statusCode, url });
      }
    });

    req.on('error', (err) => {
      file.close();
      if (fs.existsSync(path.join(imgDir, filename))) fs.unlinkSync(path.join(imgDir, filename));
      resolve({ success: false, error: err.message, url });
    });

    req.on('timeout', () => {
      req.destroy();
      file.close();
      if (fs.existsSync(path.join(imgDir, filename))) fs.unlinkSync(path.join(imgDir, filename));
      resolve({ success: false, error: 'timeout', url });
    });
  });
}

async function run() {
  const mapping = {};
  console.log(`Starting download of ${images.length} images...`);
  
  for (let i = 0; i < images.length; i++) {
    const url = images[i];
    try {
      const u = new URL(url);
      const originalBasename = path.basename(u.pathname);
      const safeName = originalBasename.replace(/[^a-zA-Z0-9._-]/g, '_');
      console.log(`[${i+1}/${images.length}] Downloading ${safeName}...`);
      const res = await downloadImage(url, safeName);
      if (res.success) {
        mapping[url] = 'assets/images/' + safeName;
      }
    } catch (e) {
      console.error('Error on url:', url, e.message);
    }
  }

  fs.writeFileSync('image_mapping.json', JSON.stringify(mapping, null, 2));
  console.log('Finished downloading images! Saved mapping.');
}

run();
