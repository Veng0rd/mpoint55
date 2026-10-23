import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('pages/manifest.json', 'utf8'));
const shared = JSON.parse(fs.readFileSync(manifest.shared, 'utf8'));
const homeFile = manifest.pages['/'];
let home = fs.readFileSync(homeFile, 'utf8');
const localImages = [];
for (const [url, file] of Object.entries(manifest.images)) {
  if (home.includes(url) || Object.values(shared).some((value) => value.includes(url))) {
    localImages.push({ url, file, bytes: fs.statSync(file).size });
  }
}
for (const [token, value] of Object.entries(shared)) home = home.split(token).join(value);
for (const [url, file] of Object.entries(manifest.images)) home = home.split(url).join(file);
const remainingRemote = [...new Set([...home.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)/gi)].map((match) => match[1]))];
const files = ['index.html', 'catalog-behavior.js', 'preview-loader.js', 'app.js', 'assets/ui.css', 'pages/manifest.json', manifest.shared, homeFile];
const bytes = Object.fromEntries(files.filter(fs.existsSync).map((file) => [file, fs.statSync(file).size]));
console.log(JSON.stringify({ bytes, bootstrapDataBytes: bytes['index.html'] + bytes['pages/manifest.json'] + bytes[manifest.shared] + bytes[homeFile], materializedHomeBytes: Buffer.byteLength(home), localImages, remainingRemote }, null, 2));
