(() => {
  'use strict';

  const frame = document.getElementById('preview');
  const status = document.getElementById('preview-status');
  const rootUrl = new URL('./', location.href);
  const absolute = (value) => new URL(value, rootUrl).href;
  const pageCache = new Map();
  let currentPath = '/';
  let requestId = 0;
  let searchRequestId = 0;

  const loadJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.json();
  };

  const manifestPromise = loadJson(absolute('pages/manifest.json'));
  const sharedPromise = manifestPromise.then((manifest) => loadJson(absolute(manifest.shared)));

  const normalizePath = (value) => {
    try {
      const url = new URL(value || '/', 'https://mpoint55.ru/');
      return `${url.pathname}${url.search}`;
    } catch {
      return value || '/';
    }
  };

  const setStatus = (message = '') => {
    if (!status) return;
    status.textContent = message;
    status.hidden = !message;
  };

  const setError = (message, retry) => {
    if (!status) return;
    status.replaceChildren(document.createTextNode(message));
    if (retry) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Повторить';
      button.addEventListener('click', retry, { once: true });
      status.append(document.createElement('br'), button);
    }
    status.hidden = false;
  };

  const waitFrameReady = (id) => new Promise((resolve) => {
    const listener = (event) => {
      if (event.detail?.id !== id) return;
      window.removeEventListener('mpoint:frame-ready', listener);
      resolve();
    };
    window.addEventListener('mpoint:frame-ready', listener);
  });

  const loadPage = async (path) => {
    const key = normalizePath(path);
    if (pageCache.has(key)) return pageCache.get(key);
    const promise = Promise.all([manifestPromise, sharedPromise]).then(async ([manifest, shared]) => {
      const file = manifest.pages[key] || manifest.pages[key.split('?')[0]];
      if (!file) return null;
      const response = await fetch(absolute(file));
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      let content = await response.text();
      for (const [token, value] of Object.entries(shared)) {
        const placeholder = token.match(/^__[A-Z_]+__/)?.[0] || token;
        content = content.split(placeholder).join(value);
      }
      for (const [url, fileName] of Object.entries(manifest.images)) {
        content = content.split(url).join(absolute(fileName));
      }
      const uiStyles = `<link rel="stylesheet" href="${absolute('assets/ui.css')}" data-mpoint-ui>`;
      content = content.replace(/<\/head>/i, `${uiStyles}</head>`);
      const readyBridge = '<script>document.addEventListener("DOMContentLoaded",function(){parent.dispatchEvent(new CustomEvent("mpoint:frame-ready",{detail:{id:Number("__MPOINT_FRAME_ID__")}}))},{once:true})<\/script>';
      content = content.replace(/<\/body>/i, `${readyBridge}</body>`);
      let imageIndex = 0;
      content = content.replace(/<img\b[^>]*>/gi, (tag) => {
        const source = Object.entries(manifest.images).find(([, fileName]) => tag.includes(absolute(fileName)));
        if (!source) return tag;
        const size = manifest.imageSizes?.[source[0]];
        let updated = tag;
        if (size && !/\bwidth\s*=/i.test(updated)) updated = updated.replace(/<img\b/i, `<img width="${size[0]}"`);
        if (size && !/\bheight\s*=/i.test(updated)) updated = updated.replace(/<img\b/i, `<img height="${size[1]}"`);
        if (!/\bloading\s*=/i.test(updated)) updated = updated.replace(/<img\b/i, `<img loading="${imageIndex < 2 ? 'eager' : 'lazy'}"`);
        if (!/\bdecoding\s*=/i.test(updated)) updated = updated.replace(/<img\b/i, '<img decoding="async"');
        imageIndex += 1;
        return updated;
      });
      return content;
    }).catch((error) => {
      pageCache.delete(key);
      throw error;
    });
    pageCache.set(key, promise);
    return promise;
  };

  const show = async (path, replace = false) => {
    const key = normalizePath(String(path).split('#')[0] || '/');
    if (key.split('?')[0] === '/search') {
      return search(new URLSearchParams(key.split('?')[1] || '').get('q') || '', replace);
    }
    const activeRequest = ++requestId;
    setStatus('Загрузка страницы…');
    try {
      const content = await loadPage(key);
      if (activeRequest !== requestId) return false;
      if (content == null) {
        setStatus('');
        location.assign(`https://mpoint55.ru${key}`);
        return false;
      }
      currentPath = key;
      const ready = key.includes('?') ? waitFrameReady(activeRequest) : null;
      frame.srcdoc = content.split('__MPOINT_FRAME_ID__').join(String(activeRequest));
      setStatus('');
      if (!replace) history.pushState({ path: key }, '', `#${encodeURIComponent(key)}`);
      if (ready && key.startsWith('/c/')) {
        ready.then(() => {
          const data = new URLSearchParams(key.slice(key.indexOf('?') + 1));
          const doc = frame.contentDocument;
          if (!doc) return;
          for (const [name, value] of data) {
            const control = [...doc.querySelectorAll('[name]')].find((item) => item.name === name);
            if (!control) continue;
            if (/^(checkbox|radio)$/i.test(control.type)) control.checked = control.value === value;
            else control.value = value;
            control.dispatchEvent(new doc.defaultView.Event('change', { bubbles: true }));
          }
          window.MPOINT_CATALOG?.filter?.(doc, data);
        });
      }
      return true;
    } catch (error) {
      if (activeRequest !== requestId) return false;
      setStatus('Не удалось загрузить страницу. Обновите вкладку и попробуйте снова.');
      console.error('Static page load failed:', error);
      return false;
    }
  };

  const popup = async () => {
    const html = await loadPage('/popups.php?act=quick_order');
    const doc = frame.contentDocument;
    const modal = doc?.getElementById('window_div');
    if (!html || !doc || !modal) return;
    const source = new DOMParser().parseFromString(html, 'text/html');
    const content = source.getElementById('perron') || source.getElementById('window_content') || source.body;
    modal.innerHTML = content.innerHTML;
    modal.style.display = 'block';
    for (const script of modal.querySelectorAll('script')) script.remove();
  };

  const filter = (data) => {
    const doc = frame.contentDocument;
    if (!doc) return;
    const query = data.toString();
    const route = `${currentPath.split('?')[0]}${query ? `?${query}` : ''}`;
    currentPath = route;
    history.pushState({ path: route }, '', `#${encodeURIComponent(route)}`);
    if (window.MPOINT_CATALOG?.filter) return window.MPOINT_CATALOG.filter(doc, data, {
      // GitHub Pages cannot submit the original PHP filter form. Keep the
      // current snapshot in place and report unsupported fields locally.
      sourceFallback: (result) => {
        const note = doc.querySelector('.catalog-filter-note') || doc.createElement('p');
        note.className = 'catalog-filter-note';
        note.textContent = result.unsupported.length
          ? 'Для этого фильтра в сохранённом каталоге нет дополнительных данных.'
          : '';
        if (!note.parentNode) doc.querySelector('#filter_form')?.append(note);
      },
    });
    const cards = [...doc.querySelectorAll('.product-card')];
    const sort = data.get('sortby');
    const manufacturer = doc.getElementById('manuf');
    const brand = manufacturer?.selectedOptions[0]?.textContent?.trim();
    cards.forEach((card) => {
      card.hidden = Boolean(brand && brand !== 'любой' && data.get('manuf') && data.get('manuf') !== '-1'
        && !card.textContent.toLowerCase().includes(brand.toLowerCase()));
    });
    const price = (card) => Number((card.querySelector('.product-price')?.textContent || '').replace(/\D/g, ''))
      || Number.MAX_SAFE_INTEGER;
    cards.sort((a, b) => sort === '1' ? price(b) - price(a)
      : sort === '4' ? price(a) - price(b)
        : sort === '2' ? a.querySelector('.product-title').textContent
          .localeCompare(b.querySelector('.product-title').textContent, 'ru') : 0);
    cards.forEach((card) => card.parentNode.append(card));
  };

  const search = async (query, replace = false) => {
    const activeSearch = ++searchRequestId;
    setStatus('Ищем товары…');
    if (window.MPOINT_CATALOG?.search && window.MPOINT_CATALOG?.renderSearch) {
      try {
        const resultsPromise = Promise.all([
          window.MPOINT_CATALOG.search(query, { indexUrl: absolute('pages/search-index.json') }),
          manifestPromise,
        ]).then(([results, manifest]) => results.map((item) => ({
          ...item,
          photo: manifest.images[item.photo] ? absolute(manifest.images[item.photo]) : item.photo,
        })));
        const expectedRender = requestId + 1;
        const ready = waitFrameReady(expectedRender);
        if (!await show('/c/mototehnika/motocikly', true)) return false;
        const expectedDocument = frame.contentDocument;
        if (activeSearch === searchRequestId) setStatus('Ищем товары…');
        const [results] = await Promise.all([resultsPromise, ready]);
        if (activeSearch !== searchRequestId || expectedRender !== requestId || frame.contentDocument !== expectedDocument) return false;
        window.MPOINT_CATALOG.renderSearch(expectedDocument, results, query);
        const route = `/search?q=${encodeURIComponent(query)}`;
        currentPath = route;
        setStatus('');
        if (!replace) history.pushState({ path: route }, '', `#${encodeURIComponent(route)}`);
        return true;
      } catch (error) {
        if (activeSearch !== searchRequestId) return false;
        console.error('Catalog search failed:', error);
        setError('Не удалось выполнить поиск.', () => search(query, replace));
        return false;
      }
    }
    const expectedRender = requestId + 1;
    const ready = waitFrameReady(expectedRender);
    if (!await show('/c/mototehnika/motocikly', true)) return false;
    const expectedDocument = frame.contentDocument;
    await ready;
    if (activeSearch !== searchRequestId || expectedRender !== requestId || frame.contentDocument !== expectedDocument) return false;
    expectedDocument?.querySelectorAll('.product-card').forEach((card) => {
      card.hidden = !card.textContent.toLowerCase().includes(String(query).toLowerCase());
    });
    const route = `/search?q=${encodeURIComponent(query)}`;
    currentPath = route;
    setStatus('');
    if (!replace) history.pushState({ path: route }, '', `#${encodeURIComponent(route)}`);
    return true;
  };

  window.MPOINT_PREVIEW = { navigate: show, popup, filter, search, loadPage };
  addEventListener('popstate', () => show(decodeURIComponent(location.hash.slice(1)) || '/', true));
  const initialPath = decodeURIComponent(location.hash.slice(1)) || '/';
  show(initialPath, true);
})();
