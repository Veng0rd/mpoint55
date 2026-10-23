(() => {
  'use strict';

  const frame = document.getElementById('preview');
  let liveData = {};

  const normalizePath = (value) => {
    try {
      const url = new URL(value, 'https://mpoint55.ru/');
      return `${url.pathname}${url.search}`;
    } catch {
      return value || '/';
    }
  };

  const updateCatalogData = (doc) => {
    for (const card of doc.querySelectorAll('.product-card[data-path]')) {
      const data = liveData[normalizePath(card.dataset.path)];
      if (!data) continue;
      const price = card.querySelector('.product-price');
      if (price && data.price) price.textContent = data.price;
      const title = card.querySelector('.product-title');
      if (title && data.title) title.textContent = data.title;
      const specs = card.querySelector('.product-specs');
      if (specs && Array.isArray(data.specs) && data.specs.length) {
        specs.replaceChildren(...data.specs.map((value) => {
          const item = doc.createElement('span');
          item.textContent = value;
          return item;
        }));
      }
    }
    const itemId = Number(doc?.defaultView?.cur_itm) || 0;
    const detailEntry = itemId
      ? Object.entries(liveData).find(([path]) => path.endsWith(`_${itemId}`))?.[1]
      : null;
    const hiddenPrice = doc?.getElementById('cur_it_price');
    const unitValue = doc?.querySelector('.purchase-unit .purchase-value');
    if (detailEntry?.price && hiddenPrice && unitValue) {
      const numericPrice = Number(String(detailEntry.price).replace(/\D/g, ''));
      if (numericPrice) {
        hiddenPrice.value = String(numericPrice);
        unitValue.replaceChildren(`${numericPrice.toLocaleString('ru-RU')} руб.`, hiddenPrice);
        doc.defaultView.recalc_price?.();
        const quantity = Math.max(1, Number.parseInt(doc.getElementById('i_cnt')?.value, 10) || 1);
        const total = doc.getElementById('cur_it_itogo');
        if (total) total.textContent = (numericPrice * quantity).toLocaleString('ru-RU');
      }
    }
  };

  const moveRatingWidgets = (doc) => {
    const header = doc.querySelector('.header-inner');
    if (!header || header.querySelector('.header-widgets')) return;
    const widgets = [...doc.querySelectorAll('.catalog-aside iframe')].filter((item) =>
      /widget\.2gis|yandex\.ru\/sprav\/widget/.test(item.src),
    );
    if (!widgets.length) return;

    const group = doc.createElement('div');
    group.className = 'header-widgets';
    group.setAttribute('aria-label', 'Рейтинг магазина');
    for (const widget of widgets) {
      widget.removeAttribute('style');
      widget.width = '180';
      widget.height = '50';
      const holder = doc.createElement('div');
      holder.className = 'header-widget';
      holder.append(widget);
      group.append(holder);
    }
    const contact = header.querySelector('.header-contact');
    header.insertBefore(group, contact || null);
    if ('ResizeObserver' in doc.defaultView) {
      const observer = new doc.defaultView.ResizeObserver((entries) => {
        for (const entry of entries) {
          const scale = Math.min(1, Math.max(.5, entry.contentRect.width / 180));
          entry.target.style.setProperty('--rating-scale', String(scale));
        }
      });
      group.querySelectorAll('.header-widget').forEach((holder) => observer.observe(holder));
    }
  };

  const improveControls = (doc) => {
    if (!doc.getElementById('mpoint-ui-styles')) {
      const stylesheet = doc.createElement('link');
      stylesheet.id = 'mpoint-ui-styles';
      stylesheet.rel = 'stylesheet';
      stylesheet.href = new URL('./assets/ui.css', window.location.href).href;
      doc.head.append(stylesheet);
    }
    if (!doc.getElementById('mpoint-static-overrides')) {
      const style = doc.createElement('style');
      style.id = 'mpoint-static-overrides';
      style.textContent = `
        .header-inner{position:relative!important}
        .header-widgets{display:flex!important;align-items:center;gap:8px;margin-left:auto}
        .header-widget{display:flex;align-items:center;justify-content:center;width:180px;height:50px;overflow:hidden;border:0!important;background:transparent!important}
        .header-widget iframe{display:block!important;margin:0!important;border:0!important;width:180px!important;height:50px!important}
        .site-header{overflow:visible!important}.site-nav{overflow-x:auto!important;scrollbar-width:none}
        .catalog-aside>iframe,.catalog-aside>.yellow_line{display:none!important}
        .footer-links a[href="#top"]{display:none!important}
        .totop_dyn{align-items:center!important;gap:7px;font-weight:700;box-shadow:0 8px 24px #27272220}
        .totop_dyn span{font-size:0}.totop_dyn span:after{content:'Наверх';font-size:13px}.totop_dyn:before{content:'↑';font-size:18px;line-height:1}
        .window_div{width:min(440px,calc(100% - 32px))!important;padding:0!important;border:1px solid var(--line)!important;border-radius:10px!important;box-shadow:0 24px 80px #1116!important}
        .window_div .quick-order-card{padding:28px!important}
        .window_div .quick-order-card h2{margin:0 44px 8px 0!important;font-size:24px!important;line-height:1.2!important}
        .window_div .quick-order-card p{margin:0 0 22px!important;color:var(--muted)!important;line-height:1.6!important}
        .window_div .quick-order-field{display:grid!important;gap:8px;margin:0 0 18px!important}
        .window_div .quick-order-field label{font-weight:600}
        .window_div .quick-order-field input{width:100%!important;height:48px!important;margin:0!important;padding:11px 13px!important;background:#fff!important;border:1px solid #999!important;border-radius:5px!important;font-size:16px!important}
        .window_div .quick-order-actions{display:flex!important;align-items:center;gap:10px;flex-wrap:wrap}
        .window_div .quick-order-submit{min-height:46px!important;padding:11px 18px!important;border:0!important;border-radius:5px!important;background:#30302e!important;color:#fff!important;font-weight:700!important}
        .window_div .quick-order-status{margin:14px 0 0!important;color:var(--muted)!important;font-size:13px!important}
        .window_div .quick-order-close{position:absolute!important;right:14px!important;top:14px!important;display:grid!important;place-items:center!important;width:38px!important;height:38px!important;min-height:38px!important;padding:0!important;border:0!important;border-radius:50%!important;background:#efefeb!important;color:#333!important;font-size:22px!important;line-height:1!important}
        .catalog-note{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:3!important;overflow:hidden!important;max-width:76ch!important;margin:22px 0 12px!important;line-height:1.65!important;color:#565652!important}
        .spoil{margin:24px 0 32px!important;text-align:left!important}.spoil .smallfont{margin:0!important;text-align:left!important}
        .spoil .input-button{display:inline-flex!important;align-items:center!important;min-height:44px!important;padding:10px 16px!important;border:1px solid #aaa!important;border-radius:5px!important;background:#fff!important;color:#242424!important;cursor:pointer!important}
        .filter_fon_table select,.filter_fon select{appearance:none!important;-webkit-appearance:none!important;padding-right:40px!important;background-color:#fff!important;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23333' stroke-width='1.8'%3E%3Cpath d='m3 6 5 5 5-5'/%3E%3C/svg%3E")!important;background-repeat:no-repeat!important;background-position:right 13px center!important}
        .detail-page .it_inn_table>tbody{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)!important;gap:32px!important;align-items:start!important}
        .detail-page .it_bigpic,.detail-page .it_bigpic_holder{min-width:0!important}.detail-page .it_bigpic table{height:auto!important}.detail-page .it_bigpic img{display:block!important;width:100%!important;height:clamp(260px,32vw,420px)!important;max-height:420px!important;object-fit:contain!important}
        .product-gallery-thumbs{display:flex!important;gap:8px!important;overflow-x:auto!important;padding:14px 2px 2px!important;scrollbar-width:thin!important}.product-gallery-thumbs>a{display:block!important;flex:0 0 72px!important;width:72px!important;height:58px!important;border:1px solid #d6d6d2!important;border-radius:5px!important;overflow:hidden!important}.product-gallery-thumbs>a[aria-current='true']{border-color:#30302e!important;box-shadow:0 0 0 2px #30302e33!important}.product-gallery-thumbs .it_ppic,.product-gallery-thumbs .it_ppic_a{display:block!important;width:100%!important;height:100%!important;margin:0!important;border:0!important;border-radius:0!important;background-size:cover!important}
        .gallery-nav{position:absolute!important;top:50%!important;left:0!important;right:0!important;bottom:auto!important;transform:translateY(-50%)!important;display:flex!important;align-items:center!important;justify-content:space-between!important;padding:0 10px!important;z-index:50!important;pointer-events:none!important}.gallery-nav button{position:relative!important;z-index:51!important;display:grid!important;place-items:center!important;width:40px!important;height:40px!important;min-height:40px!important;padding:0!important;border:0!important;border-radius:50%!important;background:#242424d9!important;color:#fff!important;font-size:25px!important;line-height:1!important;pointer-events:auto!important}.gallery-nav button:disabled{opacity:.35!important;cursor:default!important}.product-gallery-stage>a.it_tag,.product-gallery-stage>#it_bigpic_a{pointer-events:none!important;z-index:0!important}
        @media(max-width:900px){.detail-page .it_inn_table>tbody{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:24px!important}.detail-page .it_inn_table>tbody>tr,.detail-page .it_inn_table>tbody>tr>td{display:block!important;width:100%!important}.detail-page .it_bigpic,.detail-page .it_bigpic_holder,.detail-page .product-gallery-stage{display:block!important;visibility:visible!important;opacity:1!important}.detail-page .product-gallery-stage{height:clamp(320px,46vw,430px)!important}}
        @media(max-width:767px){
          *,*:before,*:after{box-sizing:border-box!important}html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important}.site-header,.header-inner,.site-nav,.page-layout,.content{width:100%!important;max-width:100%!important;min-width:0!important}.header-inner{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:10px!important;padding:12px 16px!important}.brand{flex:1 1 auto!important}.brand img{width:min(52vw,190px)!important;height:auto!important}.header-contact{order:2!important;width:100%!important;margin:0!important;text-align:left!important}.header-phone{font-size:16px!important}.header-widgets{order:3!important;width:100%!important;display:flex!important;overflow-x:auto!important;gap:8px!important;margin:0!important;padding-bottom:2px!important}.header-widget{flex:0 0 170px!important;width:170px!important}.header-widget iframe{width:170px!important}
          .site-nav{padding:0 16px!important;gap:19px!important;min-height:48px!important}.site-nav a,.catalog-toggle{flex:0 0 auto!important;font-size:13px!important}.page-layout{display:block!important;padding:20px 16px 38px!important}.content{min-width:0!important}.content>p:has(img){display:flex!important;justify-content:center!important;max-width:none!important}.content>p>img{width:100%!important;height:auto!important;max-width:100%!important}
          .filter_fon_table,.filter_fon_table table,.filter_fon_table tbody,.filter_fon_table tr,.filter_fon_table td{width:100%!important;max-width:100%!important;min-width:0!important}.filter_fon_table{display:block!important;overflow:hidden!important;padding:14px!important}.filter_fon_table tbody,.filter_fon_table tr,.filter_fon_table td{display:block!important;height:auto!important;padding:0!important}.filter_fon_table td{margin:9px 0!important;line-height:1.5!important}.filter_fon_table input,.filter_fon_table select{width:100%!important;max-width:none!important}.filter_fon_table #manuf{display:block!important;width:calc(100vw - 60px)!important;max-width:calc(100vw - 60px)!important}.filter_fon_table .filter_fon table,.filter_fon_table .filter_fon tbody,.filter_fon_table .filter_fon tr{display:block!important;width:100%!important}.filter_fon_table .filter_fon td{display:block!important;width:100%!important;vertical-align:top!important;margin:0!important}
          .product-grid,.variant-2 .product-grid{grid-template-columns:1fr!important}
          .product-photo,.variant-2 .product-photo{aspect-ratio:16/10!important;padding:10px!important}
          .product-title{min-height:0!important;font-size:16px!important}
          .detail-page .it_inn_table>tbody{display:flex!important;flex-direction:column!important;gap:20px!important}.detail-page .it_bigpic img{height:min(76vw,360px)!important}.gallery-nav{inset:50% 4px auto!important}.gallery-nav button{width:36px!important;height:36px!important;min-height:36px!important}.window_div .quick-order-card{padding:22px 18px!important}.window_div .quick-order-submit{width:100%!important}
        }`;
      doc.head.append(style);
    }

    // Legacy filter markup relies on width attributes and inline widths. They
    // override a responsive table layout on narrow screens, so discard them
    // only when the page is actually rendered as a phone layout.
    if (doc.defaultView.matchMedia('(max-width: 767px)').matches) {
      for (const filter of doc.querySelectorAll('.filter_fon_table')) {
        for (const element of filter.querySelectorAll('[width], [height]')) {
          element.removeAttribute('width');
          element.removeAttribute('height');
        }
        for (const element of filter.querySelectorAll('[style]')) {
          element.style.removeProperty('width');
          element.style.removeProperty('height');
          element.style.removeProperty('float');
        }
        const manufacturer = filter.querySelector('#manuf');
        if (manufacturer) {
          manufacturer.style.setProperty('display', 'block', 'important');
          manufacturer.style.setProperty('width', 'min(330px, calc(100vw - 60px))', 'important');
          manufacturer.style.setProperty('max-width', 'calc(100vw - 60px)', 'important');
        }
      }
    }

    for (const element of doc.querySelectorAll('button, a, input[type="submit"], input[type="button"]')) {
      if (element instanceof doc.defaultView.HTMLInputElement) {
        if (/^обновить$/i.test(element.value.trim())) element.value = 'Применить';
      } else if (/^обновить$/i.test(element.textContent.trim())) {
        element.textContent = 'Применить';
      }
    }

    const hero = doc.querySelector('img[alt="Мототехника — Мототочка"]');
    if (hero) {
      const holder = hero.closest('p');
      if (holder) {
        holder.style.display = 'flex';
        holder.style.justifyContent = 'center';
      }
      hero.style.setProperty('width', 'min(100%, 830px)', 'important');
      hero.style.setProperty('margin-inline', 'auto', 'important');
    }
    // Keep the dedicated UI layer last so it can correct legacy inline and
    // preview overrides without mutating the captured source pages.
    doc.head.append(doc.getElementById('mpoint-ui-styles'));
  };

  const buildCustomSelects = (doc) => {
    for (const select of doc.querySelectorAll('select:not([data-custom-select])')) {
      select.dataset.customSelect = 'true';
      select.setAttribute('aria-hidden', 'true');
      select.tabIndex = -1;
      const wrapper = doc.createElement('div');
      wrapper.className = 'custom-select';
      const trigger = doc.createElement('button');
      trigger.type = 'button';
      trigger.className = 'custom-select-trigger';
      const explicitLabel = select.labels?.[0]?.textContent?.trim();
      const technicalLabel = select.getAttribute('aria-label');
      const filterRow = select.closest('.filter_div tr');
      const filterName = filterRow?.cells?.[0]?.textContent?.replace(/\s+/g, ' ').trim();
      const rangeSuffix = /_from$/.test(select.name) ? 'от' : /_to$/.test(select.name) ? 'до' : '';
      const fallbackLabel = select.id === 'manuf' ? 'Производитель' : 'Выберите значение';
      const contextualLabel = filterName ? `${filterName}${rangeSuffix ? ` ${rangeSuffix}` : ''}` : '';
      const usefulAriaLabel = technicalLabel && !/^(?:val\d*(?:_from|_to)?|manuf)$/i.test(technicalLabel) ? technicalLabel : '';
      trigger.setAttribute('aria-label', explicitLabel || contextualLabel || usefulAriaLabel || fallbackLabel);
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');
      const list = doc.createElement('div');
      list.className = 'custom-select-list';
      list.setAttribute('role', 'listbox');
      list.hidden = true;
      let active = Math.max(0, select.selectedIndex);
      let typeahead = '';
      let typeaheadTimer;

      const options = [...select.options].map((option, index) => {
        const item = doc.createElement('button');
        item.type = 'button';
        item.className = 'custom-select-option';
        item.setAttribute('role', 'option');
        item.textContent = option.textContent;
        item.disabled = option.disabled;
        item.addEventListener('click', () => choose(index));
        list.append(item);
        return item;
      });
      const sync = () => {
        active = Math.max(0, select.selectedIndex);
        trigger.textContent = select.options[active]?.textContent || fallbackLabel;
        options.forEach((item, index) => {
          const selected = index === active;
          item.setAttribute('aria-selected', String(selected));
          item.classList.toggle('is-selected', selected);
        });
      };
      const close = (restoreFocus = false) => {
        list.hidden = true;
        wrapper.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        if (restoreFocus) trigger.focus();
      };
      const open = () => {
        doc.querySelectorAll('.custom-select.is-open').forEach((other) => {
          if (other !== wrapper) other.querySelector('.custom-select-trigger')?.click();
        });
        list.hidden = false;
        wrapper.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        options[active]?.focus({ preventScroll: true });
      };
      const choose = (index) => {
        if (!select.options[index] || select.options[index].disabled) return;
        select.selectedIndex = index;
        select.dispatchEvent(new doc.defaultView.Event('change', { bubbles: true }));
        sync();
        close(true);
      };
      const move = (delta) => {
        let candidate = active;
        do candidate = (candidate + delta + options.length) % options.length;
        while (options[candidate]?.disabled && candidate !== active);
        active = candidate;
        options.forEach((item, index) => item.classList.toggle('is-active', index === active));
        options[active]?.focus({ preventScroll: true });
      };
      const onKeyDown = (event) => {
        if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
        if (event.key === 'Tab') { close(); return; }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          if (list.hidden) open(); else move(event.key === 'ArrowDown' ? 1 : -1);
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (list.hidden) open(); else choose(options.indexOf(doc.activeElement));
          return;
        }
        if (event.key.length === 1 && /\S/.test(event.key)) {
          typeahead += event.key.toLocaleLowerCase('ru');
          clearTimeout(typeaheadTimer);
          typeaheadTimer = setTimeout(() => { typeahead = ''; }, 650);
          const match = [...select.options].findIndex((option) => !option.disabled && option.textContent.trim().toLocaleLowerCase('ru').startsWith(typeahead));
          if (match >= 0) { active = match; if (list.hidden) choose(match); else options[match].focus({ preventScroll: true }); }
        }
      };
      trigger.addEventListener('click', () => list.hidden ? open() : close());
      trigger.addEventListener('keydown', onKeyDown);
      list.addEventListener('keydown', onKeyDown);
      select.addEventListener('change', sync);
      wrapper.addEventListener('focusout', (event) => {
        if (!wrapper.contains(event.relatedTarget)) close();
      });
      wrapper.append(trigger, list);
      select.before(wrapper);
      wrapper.append(select);
      sync();
    }
  };

  const normalizeFilterLayout = (doc) => {
    for (const image of doc.querySelectorAll('.filter_fon img[alt="Мототехника — Мототочка"]')) {
      image.closest('td')?.classList.add('filter-decoration');
    }
    for (const filter of doc.querySelectorAll('.filter_fon:has(.filter_div)')) {
      filter.classList.add('filter-controls-table');
      filter.querySelector('.filter_div')?.closest('td')?.classList.add('filter-controls-cell');
    }
    for (const row of doc.querySelectorAll('.filter_div tr')) {
      const selects = [...row.querySelectorAll('select')];
      if (!selects.length || row.dataset.filterLayout === 'true') continue;
      const labelCell = row.cells?.[0];
      const controlCell = row.cells?.[1];
      if (!labelCell || !controlCell) continue;
      row.dataset.filterLayout = 'true';
      labelCell.classList.add('filter-field-label');
      controlCell.classList.add('filter-field-control');
      const wrappers = selects.map((select) => select.closest('.custom-select')).filter(Boolean);
      if (wrappers.length > 1) {
        const range = doc.createElement('div');
        range.className = 'filter-range';
        wrappers.forEach((wrapper, index) => {
          const field = doc.createElement('label');
          field.className = 'filter-range-field';
          const caption = doc.createElement('span');
          caption.textContent = /_to$/.test(selects[index].name) ? 'до' : 'от';
          field.append(caption, wrapper);
          range.append(field);
        });
        controlCell.replaceChildren(range);
      } else if (wrappers[0]) {
        controlCell.replaceChildren(wrappers[0]);
      }
    }
  };

  const normalizePurchasePanel = (doc) => {
    const unitPrice = doc.getElementById('cur_it_price');
    const quantity = doc.getElementById('i_cnt');
    const total = doc.getElementById('cur_it_itogo');
    const table = unitPrice?.closest('table');
    if (!unitPrice || !quantity || !total || !table || table.dataset.purchaseReady === 'true') return;
    table.dataset.purchaseReady = 'true';
    const rows = [...table.rows];
    const headingCells = [...(rows[0]?.cells || [])];
    const valueCells = [...(rows[1]?.cells || [])];
    if (headingCells.length < 3 || valueCells.length < 3) return;

    const parsedPrice = Number(unitPrice.value) || Number(valueCells[0].textContent.replace(/\D/g, ''));
    if (parsedPrice) unitPrice.value = String(parsedPrice);
    quantity.setAttribute('aria-label', 'Количество для заказа');
    quantity.inputMode = 'numeric';
    const plus = doc.querySelector('.it_cnt_b_plus');
    const minus = doc.querySelector('.it_cnt_b_minus');
    if (plus) plus.setAttribute('aria-label', 'Увеличить количество');
    if (minus) minus.setAttribute('aria-label', 'Уменьшить количество');

    const formatTotal = () => {
      const count = Math.max(1, Number.parseInt(quantity.value, 10) || 1);
      quantity.value = String(count);
      const price = Number(unitPrice.value) || parsedPrice || 0;
      if (price) total.textContent = (price * count).toLocaleString('ru-RU');
    };
    const recalculate = () => {
      formatTotal();
      doc.defaultView.recalc_price?.();
      doc.defaultView.requestAnimationFrame(formatTotal);
    };
    quantity.addEventListener('input', recalculate);
    quantity.addEventListener('change', recalculate);
    plus?.addEventListener('click', () => doc.defaultView.requestAnimationFrame(formatTotal));
    minus?.addEventListener('click', () => doc.defaultView.requestAnimationFrame(formatTotal));

    const legacyQuantity = quantity.closest('.it_cnt_field');
    if (legacyQuantity && plus && minus) {
      const controls = doc.createElement('div');
      controls.className = 'purchase-quantity-control';
      controls.append(minus, quantity, plus);
      legacyQuantity.replaceWith(controls);
    }

    const panel = doc.createElement('section');
    panel.className = 'purchase-panel';
    panel.setAttribute('aria-label', 'Цена и заказ');
    const purchaseLabels = ['Цена за шт.', 'Количество', 'Итого'];
    ['unit', 'quantity', 'total'].forEach((name, index) => {
      const group = doc.createElement('div');
      group.className = `purchase-${name}`;
      const label = doc.createElement('span');
      label.className = 'purchase-label';
      label.textContent = purchaseLabels[index];
      const value = doc.createElement('div');
      value.className = 'purchase-value';
      while (valueCells[index].firstChild) value.append(valueCells[index].firstChild);
      group.append(label, value);
      panel.append(group);
    });
    const action = table.querySelector('.it_btn');
    if (action) {
      const actions = doc.createElement('div');
      actions.className = 'purchase-actions';
      actions.append(action);
      panel.append(actions);
    }
    table.replaceWith(panel);
    doc.defaultView.requestAnimationFrame(recalculate);
  };

  const placeCatalog = (doc) => {
    const toggle = doc.querySelector('.catalog-toggle');
    const catalog = doc.querySelector('.catalog-aside');
    if (!toggle || !catalog) return;

    const position = () => {
      if (doc.defaultView.innerWidth <= 767) {
        catalog.style.removeProperty('top');
        catalog.style.removeProperty('left');
        catalog.style.removeProperty('width');
        return;
      }
      const box = toggle.getBoundingClientRect();
      catalog.style.top = `${Math.round(box.bottom + 8)}px`;
      catalog.style.left = `${Math.round(box.left)}px`;
      catalog.style.width = '300px';
    };
    position();
    doc.defaultView.addEventListener('resize', position, { passive: true });
    doc.defaultView.addEventListener('scroll', position, { passive: true });
    toggle.addEventListener('click', () => requestAnimationFrame(position));
  };

  const buildProductGallery = (doc) => {
    const detail = doc.querySelector('.detail-page');
    const viewer = detail?.querySelector('.it_bigpic');
    const image = viewer?.querySelector('img');
    if (!detail || !viewer || !image || viewer.dataset.galleryReady === 'true') return;

    const thumbs = [...detail.querySelectorAll('a[onclick*="show_pic"]')]
      .filter((link) => link.querySelector('.it_ppic, .it_ppic_a') && link.href);
    if (!thumbs.length) return;

    viewer.dataset.galleryReady = 'true';
    const stage = doc.createElement('div');
    stage.className = 'product-gallery-stage';
    while (viewer.firstChild) stage.append(viewer.firstChild);
    stage.querySelectorAll('#it_bigpic_a, a.it_tag').forEach((overlay) => {
      overlay.removeAttribute('onclick');
      overlay.style.setProperty('pointer-events', 'none', 'important');
      overlay.style.setProperty('z-index', '0', 'important');
    });
    const strip = doc.createElement('div');
    strip.className = 'product-gallery-thumbs';
    strip.setAttribute('aria-label', 'Фотографии товара');
    const images = thumbs.map((thumb) => thumb.href);
    image.decoding = 'async';
    thumbs.forEach((thumb) => {
      const preview = thumb.querySelector('img');
      if (preview) {
        preview.loading = 'lazy';
        preview.decoding = 'async';
      }
    });
    let current = Math.max(0, images.findIndex((source) => source === image.src));
    if (current < 0) current = 0;

    const activate = (index, shouldFocus = false) => {
      current = (index + images.length) % images.length;
      image.src = images[current];
      thumbs.forEach((thumb, position) => {
        const selected = position === current;
        thumb.setAttribute('aria-current', String(selected));
        if (selected) {
          const left = thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2;
          strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
        }
      });
      previous.disabled = images.length < 2;
      next.disabled = images.length < 2;
      for (const adjacent of [images[(current + 1) % images.length], images[(current - 1 + images.length) % images.length]]) {
        if (adjacent && adjacent !== image.src) {
          const preload = new doc.defaultView.Image();
          preload.decoding = 'async';
          preload.src = adjacent;
        }
      }
      if (shouldFocus) doc.activeElement?.focus({ preventScroll: true });
    };

    const nav = doc.createElement('div');
    nav.className = 'gallery-nav';
    const previous = doc.createElement('button');
    previous.type = 'button';
    previous.textContent = '‹';
    previous.setAttribute('aria-label', 'Предыдущая фотография');
    const next = doc.createElement('button');
    next.type = 'button';
    next.textContent = '›';
    next.setAttribute('aria-label', 'Следующая фотография');
    previous.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); activate(current - 1); previous.focus({ preventScroll: true }); });
    next.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); activate(current + 1); next.focus({ preventScroll: true }); });
    nav.append(previous, next);

    thumbs.forEach((thumb, index) => {
      thumb.classList.add('product-gallery-thumb');
      thumb.removeAttribute('target');
      thumb.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        activate(index, true);
      }, true);
      strip.append(thumb);
    });
    stage.append(nav);
    viewer.append(stage, strip);
    let startX = 0;
    let startY = 0;
    stage.addEventListener('pointerdown', (event) => { startX = event.clientX; startY = event.clientY; });
    stage.addEventListener('pointerup', (event) => {
      const distance = event.clientX - startX;
      const vertical = event.clientY - startY;
      if (Math.abs(distance) > 36 && Math.abs(distance) > Math.abs(vertical) * 1.25) activate(current + (distance < 0 ? 1 : -1));
    });
    stage.tabIndex = 0;
    stage.setAttribute('aria-label', 'Галерея товара');
    stage.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        activate(current + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    activate(current);
  };

  const showPreviewNotice = (doc) => {
    if (doc.querySelector('.static-preview-modal') || doc.querySelector('.detail-page,.product-grid')) return;
    const backdrop = doc.createElement('div');
    backdrop.className = 'static-preview-modal';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.innerHTML = '<div class="static-preview-dialog"><button class="static-preview-close" type="button" aria-label="Закрыть уведомление">×</button><div class="static-preview-kicker">Демонстрационная версия</div><h2>Это макет сайта</h2><p>Перед вами макет оригинального сайта. Он не принимает заказы и не продаёт товары.</p><div class="static-preview-actions"><a class="preview-original-link" href="https://mpoint55.ru" target="_blank" rel="noopener noreferrer">Открыть оригинальный сайт</a><button class="static-preview-confirm" type="button">Понятно</button></div></div>';
    const close = () => { backdrop.remove(); doc.body.style.overflow = ''; };
    backdrop.addEventListener('click', (event) => { if (event.target === backdrop) close(); });
    backdrop.querySelectorAll('.static-preview-close,.static-preview-confirm').forEach((button) => button.addEventListener('click', close));
    doc.body.append(backdrop);
    doc.body.style.overflow = 'hidden';
    backdrop.querySelector('.static-preview-confirm')?.focus();
  };

  const keepNavigationLocal = (doc) => {
    doc.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      if (link.classList.contains('preview-original-link')) return;
      const rawHref = link.getAttribute('href')?.trim() || '';
      if (rawHref.startsWith('#')) return;
      const url = new URL(link.href, doc.baseURI);
      if (url.pathname === doc.location.pathname && url.search === doc.location.search && url.hash) return;
      if (!/^(?:www\.)?mpoint55\.ru$|^apex-shop\.ru$/i.test(url.hostname)) return;
      if (link.matches('a[onclick*="show_pic"]')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (/^(?:www\.)?mpoint55\.ru$/i.test(url.hostname)) {
        window.MPOINT_PREVIEW?.navigate(`${url.pathname}${url.search}`);
      }
    }, true);
  };

  const enhancePage = () => {
    const doc = frame.contentDocument;
    if (!doc || doc.documentElement.dataset.staticEnhanced === 'true') return;
    doc.documentElement.dataset.staticEnhanced = 'true';
    // Captured pages did not contain a viewport declaration. Without it, a phone
    // paints the desktop canvas first and only then crops it inside the iframe.
    if (!doc.querySelector('meta[name="viewport"]')) {
      const viewport = doc.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1';
      doc.head.prepend(viewport);
    }
    improveControls(doc);
    buildCustomSelects(doc);
    normalizeFilterLayout(doc);
    normalizePurchasePanel(doc);
    moveRatingWidgets(doc);
    placeCatalog(doc);
    buildProductGallery(doc);
    showPreviewNotice(doc);
    keepNavigationLocal(doc);
    updateCatalogData(doc);
    doc.defaultView.send_quick_order = showQuickOrder;
  };

  const showQuickOrder = () => {
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    const modal = doc?.getElementById('window_div');
    const backdrop = doc?.getElementById('window_bg');
    if (!doc || !win || !modal || !backdrop) return;

    modal._quickOrderCleanup?.();
    const previousFocus = doc.activeElement;
    modal.replaceChildren();
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'quick-order-title');
    modal.innerHTML = `
      <form class="quick-order-card" novalidate>
        <button class="quick-order-close" type="button" aria-label="Закрыть">×</button>
        <h2 id="quick-order-title">Быстрый заказ</h2>
        <p>Укажите номер телефона. Сотрудник магазина свяжется с вами и уточнит детали покупки.</p>
        <div class="quick-order-field">
          <label for="quick-order-phone">Телефон</label>
          <input id="quick-order-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 900 000-00-00" required>
        </div>
        <div class="quick-order-actions">
          <button class="quick-order-submit" type="submit">Отправить быстрый заказ</button>
        </div>
        <p class="quick-order-status" role="status" aria-live="polite"></p>
      </form>`;

    const form = modal.querySelector('form');
    const phone = modal.querySelector('input[name="phone"]');
    const status = modal.querySelector('[role="status"]');
    const submit = modal.querySelector('[type="submit"]');
    const closeButton = modal.querySelector('.quick-order-close');
    const setImportant = (element, properties) => {
      for (const [name, value] of Object.entries(properties)) element.style.setProperty(name, value, 'important');
    };
    setImportant(modal, {
      width: 'min(440px, calc(100% - 32px))', padding: '0', border: '1px solid #dededb',
      'border-radius': '10px', 'box-shadow': '0 24px 80px #1116', overflow: 'visible',
    });
    setImportant(form, { padding: '28px' });
    setImportant(closeButton, {
      position: 'absolute', right: '14px', top: '14px', display: 'grid', 'place-items': 'center',
      width: '38px', height: '38px', 'min-height': '38px', padding: '0', border: '0',
      'border-radius': '50%', background: '#efefeb', color: '#333', 'font-size': '22px',
    });
    setImportant(phone, {
      width: '100%', height: '48px', margin: '0', padding: '11px 13px', background: '#fff',
      border: '1px solid #999', 'border-radius': '5px', 'font-size': '16px',
    });
    setImportant(submit, {
      'min-height': '46px', padding: '11px 18px', border: '0', 'border-radius': '5px',
      background: '#30302e', color: '#fff', 'font-weight': '700',
    });
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]')]
        .filter((element) => element.getClientRects().length);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const cleanup = () => {
      doc.removeEventListener('keydown', onKeyDown);
      backdrop.removeEventListener('click', close);
      modal._quickOrderCleanup = null;
    };
    const close = () => {
      modal.style.display = 'none';
      backdrop.style.display = 'none';
      doc.body.style.overflow = '';
      cleanup();
      win.cur_iid = 0;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };

    closeButton.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    doc.addEventListener('keydown', onKeyDown);
    modal._quickOrderCleanup = cleanup;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const digits = phone.value.replace(/\D/g, '');
      if (digits.length < 10) {
        status.textContent = 'Введите номер телефона полностью.';
        phone.setAttribute('aria-invalid', 'true');
        phone.focus();
        return;
      }
      phone.removeAttribute('aria-invalid');
      submit.disabled = true;
      status.textContent = 'Отправляем заявку…';
      const itemId = Number(win.cur_iid) || Number(win.cur_itm) || 0;
      const endpoint = new URL('https://mpoint55.ru/cart_actions.php');
      endpoint.searchParams.set('act', 'send_quick_order');
      endpoint.searchParams.set('phone', phone.value.trim());
      if (itemId) endpoint.searchParams.set('iid', String(itemId));
      try {
        await fetch(endpoint, { mode: 'no-cors', credentials: 'omit', cache: 'no-store' });
        status.textContent = 'Запрос передан на сайт магазина, но подтверждение доставки не получено. Если вам не перезвонят, позвоните по номеру +7 (3812) 38-68-00.';
        form.reset();
      } catch {
        status.textContent = 'Не удалось отправить заявку. Позвоните по номеру +7 (3812) 38-68-00.';
      } finally {
        submit.disabled = false;
      }
    });

    backdrop.style.display = 'block';
    modal.style.display = 'block';
    doc.body.style.overflow = 'hidden';
    phone.focus();
  };

  const installPreviewHooks = () => {
    if (!window.MPOINT_PREVIEW) return requestAnimationFrame(installPreviewHooks);
    window.MPOINT_PREVIEW.popup = showQuickOrder;
  };

  fetch('./live-data.json', { cache: 'no-store' })
    .then((response) => response.ok ? response.json() : {})
    .then((data) => {
      liveData = data.products || {};
      updateCatalogData(frame.contentDocument);
    })
    .catch(() => {});

  frame.addEventListener('load', enhancePage);
  window.addEventListener('mpoint:frame-ready', enhancePage);
  installPreviewHooks();
  if (frame.contentDocument?.readyState === 'complete') enhancePage();
})();
