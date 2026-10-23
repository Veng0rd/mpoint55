import fs from 'node:fs/promises';

const SITE = 'https://mpoint55.ru';
const root = new URL('./', import.meta.url);
const manifestPath = new URL('pages/manifest.json', root);
const outputPath = new URL('live-data.json', root);

const decodeHtml = (value) => value
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&quot;/gi, '"')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/\s+/g, ' ')
  .trim();

const getSnapshotPages = async (manifest) => Object.fromEntries(await Promise.all(
  Object.entries(manifest.pages).map(async ([route, file]) => [
    route,
    await fs.readFile(new URL(file, root), 'utf8'),
  ]),
));

const catalogPaths = (pages) => Object.keys(pages).filter((path) =>
  path.startsWith('/c/') && !/_\d+(?:\?|$)/.test(path),
);

const decodeResponse = async (response) => {
  const bytes = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || '';
  const charset = contentType.match(/charset=([^;\s]+)/i)?.[1] || 'windows-1251';
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder('windows-1251').decode(bytes);
  }
};

const fetchCatalog = async (path) => {
  const response = await fetch(new URL(path, SITE), {
    headers: { 'user-agent': 'MPoint55-GitHub-Pages-Sync/1.0', accept: 'text/html' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${path}`);
  return decodeResponse(response);
};

const extractProducts = (html) => {
  const products = {};
  const links = html.matchAll(/<a\b(?=[^>]*\bclass=["'][^"']*\bitem_lnk\b)(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>([\s\S]*?)<\/a>/gi);
  for (const link of links) {
    const url = new URL(link[1], SITE);
    if (url.hostname !== 'mpoint55.ru' && url.hostname !== 'www.mpoint55.ru') continue;
    const path = `${url.pathname}${url.search}`;
    const nearby = html.slice(link.index, link.index + 6000);
    const rawPrice = nearby.match(/class=["'][^"']*\bitem_foot\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:td|div)>/i)?.[1] || '';
    const title = decodeHtml(link[2]);
    const price = decodeHtml(rawPrice).replace(/руб\.?/gi, '₽').replace(/\s*₽/, ' ₽');
    if (title || price) products[path] = { title, price };
  }
  return products;
};

const extractSnapshotProducts = (pages) => {
  const products = {};
  for (const html of Object.values(pages)) {
    for (const card of html.matchAll(/<article\b(?=[^>]*\bclass=["'][^"']*\bproduct-card\b)(?=[^>]*\bdata-path=["']([^"']+)["'])[^>]*>([\s\S]*?)<\/article>/gi)) {
      const title = decodeHtml(card[2].match(/class=["'][^"']*\bproduct-title\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/i)?.[1] || '');
      const price = decodeHtml(card[2].match(/class=["'][^"']*\bproduct-price\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] || '');
      if (title || price) products[card[1]] = { title, price };
    }
  }
  return products;
};

const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const paths = catalogPaths(manifest.pages);
const offline = process.argv.includes('--offline');
const pages = offline ? await getSnapshotPages(manifest) : {};
const products = offline ? extractSnapshotProducts(pages) : {};
let successfulPages = 0;

for (const path of offline ? [] : paths) {
  try {
    Object.assign(products, extractProducts(await fetchCatalog(path)));
    successfulPages += 1;
  } catch (error) {
    process.stderr.write(`Не удалось обновить ${path}: ${error.cause?.message || error.message}\n`);
  }
}

if (!successfulPages && !offline) {
  throw new Error('Источник mpoint55.ru не ответил; прежние данные сохранены');
}

const payload = {
  updatedAt: new Date().toISOString(),
  source: SITE,
  products,
};
await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
process.stdout.write(`${offline ? 'Подготовлен резервный снимок' : `Обновлено страниц: ${successfulPages} из ${paths.length}`}; товаров: ${Object.keys(products).length}\n`);
