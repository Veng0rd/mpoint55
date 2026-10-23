import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(await fs.readFile(path.join(root, 'pages', 'manifest.json'), 'utf8'));
const shared = JSON.parse(await fs.readFile(path.join(root, manifest.shared), 'utf8'));
const failures = [];
let pageBytes = 0;

for (const [route, file] of Object.entries(manifest.pages)) {
  try {
    const html = await fs.readFile(path.join(root, file), 'utf8');
    pageBytes += Buffer.byteLength(html);
    let materialized = html;
    for (const [token, value] of Object.entries(shared)) materialized = materialized.split(token).join(value);
    for (const token of materialized.matchAll(/__[A-Z][A-Z0-9_]+__/g)) {
      if (!(token[0] in shared)) failures.push(`${route}: unknown shared token ${token[0]}`);
    }
  } catch (error) {
    failures.push(`${route}: ${file}: ${error.message}`);
  }
}

let imageBytes = 0;
for (const [url, file] of Object.entries(manifest.images)) {
  try {
    const data = await fs.readFile(path.join(root, file));
    imageBytes += data.byteLength;
    if (!data.byteLength) failures.push(`${url}: empty image ${file}`);
  } catch (error) {
    failures.push(`${url}: ${file}: ${error.message}`);
  }
}

if (!manifest.pages['/']) failures.push('Missing home route');
if (!manifest.pages['/popups.php?act=quick_order']) failures.push('Missing quick-order route');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    pages: Object.keys(manifest.pages).length,
    pageBytes,
    images: Object.keys(manifest.images).length,
    imageBytes,
    sharedFragments: Object.keys(shared).length,
  }, null, 2));
}
