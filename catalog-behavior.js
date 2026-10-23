(() => {
  'use strict';

  const collator = new Intl.Collator('ru', { sensitivity: 'base', numeric: true });
  const normalize = (value) => String(value ?? '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('ru');
  const selected = (data, name) => normalize(typeof data?.get === 'function' ? data.get(name) : data?.[name]);
  const active = (value) => value !== '' && value !== '-1';
  const itemId = (card) => String(card.dataset.itemId || '');
  const itemData = (card, items) => items?.[itemId(card)] || items?.get?.(itemId(card)) || {};
  const fieldValue = (card, field, items) => {
    const item = itemData(card, items);
    if (item.filters && Object.prototype.hasOwnProperty.call(item.filters, field)) return item.filters[field];
    if (Object.prototype.hasOwnProperty.call(item, field)) return item[field];
    const key = `filter${field[0].toUpperCase()}${field.slice(1)}`;
    return Object.prototype.hasOwnProperty.call(card.dataset, key) ? card.dataset[key] : undefined;
  };

  const manufacturer = (card, items, option) => {
    const stored = fieldValue(card, 'manuf', items) ?? fieldValue(card, 'manufacturer', items);
    if (stored != null && stored !== '') return normalize(stored);
    const title = normalize(card.querySelector('.product-title')?.textContent);
    const label = normalize(option?.textContent).replace(/\s*\([^)]*\)\s*/g, ' ');
    const aliases = [label, ...normalize(option?.textContent).matchAll(/\(([^)]+)\)/g)].map((value) =>
      normalize(Array.isArray(value) ? value[1] : value));
    return aliases.some((alias) => alias && new RegExp(`(^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\s)`, 'u').test(title))
      ? normalize(option?.value) : '';
  };

  const numeric = (value) => {
    const source = String(value ?? '');
    if (!/\d/.test(source)) return null;
    const number = Number(source.replace(',', '.').replace(/[^\d.-]/g, ''));
    return Number.isFinite(number) ? number : null;
  };

  const isChanged = (control, value) => {
    if (!active(value)) return false;
    if (control.tagName === 'SELECT') {
      const initial = [...control.options].find((option) => option.defaultSelected)?.value ?? '';
      return normalize(initial) !== value;
    }
    if (/^(checkbox|radio)$/i.test(control.type)) return control.checked !== control.defaultChecked;
    return normalize(control.defaultValue) !== value;
  };

  const sourceRequest = (doc, data, sourceBase = 'https://mpoint55.ru') => {
    const form = doc?.getElementById?.('filter_form');
    const body = new URLSearchParams();
    if (typeof data?.entries === 'function') for (const [name, value] of data.entries()) body.append(name, value);
    else if (form) for (const [name, value] of new FormData(form).entries()) body.append(name, value);
    return { url: new URL(form?.getAttribute('action') || location.pathname, sourceBase).href, init: { method: 'POST', body } };
  };

  const filter = (doc, data, options = {}) => {
    const cards = [...(doc?.querySelectorAll?.('.product-card') || [])];
    const items = options.items;
    const unsupported = new Set();
    const controls = [...(doc?.querySelectorAll?.('#filter_form [name]') || [])]
      .filter((control) => /^(manuf|para|val\d+(?:_(?:from|to))?)$/.test(control.name));
    const constraints = controls.map((control) => [control, selected(data, control.name)])
      .filter(([control, value]) => isChanged(control, value));

    cards.forEach((card, sourceIndex) => {
      if (!card.dataset.catalogSourceIndex) card.dataset.catalogSourceIndex = String(sourceIndex);
      let visible = true;
      for (const [control, expected] of constraints) {
        if (control.name === 'manuf') {
          if (manufacturer(card, items, control.selectedOptions?.[0]) !== expected) visible = false;
          continue;
        }
        const base = control.name.replace(/_(from|to)$/, '');
        const actual = fieldValue(card, base, items);
        if (actual == null || actual === '') {
          unsupported.add(control.name);
          continue;
        }
        const values = Array.isArray(actual) ? actual.map(normalize) : [normalize(actual)];
        if (control.name.endsWith('_from') || control.name.endsWith('_to')) {
          const actualNumber = numeric(actual);
          const expectedNumber = numeric(expected);
          if (actualNumber == null || expectedNumber == null) unsupported.add(control.name);
          else if (control.name.endsWith('_from') ? actualNumber < expectedNumber : actualNumber > expectedNumber) visible = false;
        } else if (!values.includes(expected)) visible = false;
      }
      card.hidden = !visible;
    });

    const sort = selected(data, 'sortby');
    const price = (card) => numeric(card.querySelector('.product-price:not(.no-stock)')?.textContent);
    const title = (card) => normalize(card.querySelector('.product-title')?.textContent);
    const sourceIndex = (card) => Number(card.dataset.catalogSourceIndex);
    const comparePrice = (a, b, direction) => {
      const left = price(a); const right = price(b);
      if (left == null && right == null) return sourceIndex(a) - sourceIndex(b);
      if (left == null) return 1;
      if (right == null) return -1;
      return direction * (left - right) || sourceIndex(a) - sourceIndex(b);
    };
    cards.sort((a, b) => sort === '1' ? comparePrice(a, b, -1)
      : sort === '4' ? comparePrice(a, b, 1)
        : sort === '2' ? collator.compare(title(a), title(b)) || sourceIndex(a) - sourceIndex(b)
          : sourceIndex(a) - sourceIndex(b));
    cards.forEach((card) => card.parentNode?.append(card));

    const result = { total: cards.length, visible: cards.filter((card) => !card.hidden).length, unsupported: [...unsupported] };
    if (unsupported.size && typeof options.sourceFallback === 'function') {
      options.sourceFallback(result, sourceRequest(doc, data, options.sourceBase));
    }
    doc?.dispatchEvent?.(new CustomEvent('mpoint:catalog-filtered', { detail: result }));
    return result;
  };

  const search = async (query, options = {}) => {
    const needle = normalize(query);
    if (!needle) return [];
    const source = await (options.index || fetch(options.indexUrl || 'pages/search-index.json').then((response) => {
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return response.json();
    }));
    return source.filter((item) => normalize(`${item.title} ${item.specs || ''} ${item.category || ''}`).includes(needle))
      .sort((a, b) => collator.compare(a.title, b.title));
  };

  const renderSearch = (doc, results, query) => {
    const grid = doc?.querySelector?.('.product-grid');
    if (!grid) return false;
    grid.replaceChildren();
    for (const item of results) {
      const card = doc.createElement('article');
      card.className = 'product-card';
      card.dataset.itemId = item.id;
      card.dataset.path = item.path;
      const link = doc.createElement('a'); link.className = 'product-title'; link.href = item.path; link.textContent = item.title;
      const photoLink = doc.createElement('a'); photoLink.className = 'product-photo'; photoLink.href = item.path;
      if (item.photo) { const image = doc.createElement('img'); image.src = item.photo; image.alt = item.title; image.loading = 'lazy'; photoLink.append(image); }
      const info = doc.createElement('div'); info.className = 'product-info'; info.append(link);
      const specs = doc.createElement('div'); specs.className = 'product-specs';
      for (const value of item.specs || []) { const span = doc.createElement('span'); span.textContent = value; specs.append(span); }
      const bottom = doc.createElement('div'); bottom.className = 'product-bottom';
      const price = doc.createElement('span'); price.className = `product-price${numeric(item.price) == null ? ' no-stock' : ''}`; price.textContent = item.price;
      bottom.append(price); info.append(specs, bottom); card.append(photoLink, info); grid.append(card);
    }
    const heading = doc.querySelector('main h1');
    if (heading) heading.textContent = `Поиск: ${query} — ${results.length}`;
    return true;
  };

  window.MPOINT_CATALOG = { filter, search, renderSearch, sourceRequest };
  window.dispatchEvent(new CustomEvent('mpoint:catalog-ready'));
})();
