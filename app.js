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
  };

  const improveControls = (doc) => {
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
        .gallery-nav{position:absolute!important;inset:50% 10px auto!important;transform:translateY(-50%)!important;display:flex!important;justify-content:space-between!important;pointer-events:none!important}.gallery-nav button{display:grid!important;place-items:center!important;width:40px!important;height:40px!important;min-height:40px!important;padding:0!important;border:0!important;border-radius:50%!important;background:#242424d9!important;color:#fff!important;font-size:25px!important;line-height:1!important;pointer-events:auto!important}.gallery-nav button:disabled{opacity:.35!important;cursor:default!important}
        @media(max-width:767px){
          html,body{overflow-x:hidden!important}.header-inner{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:10px!important;padding:12px 16px!important}.brand{flex:1 1 auto!important}.brand img{width:min(52vw,190px)!important;height:auto!important}.header-contact{margin-left:auto!important;text-align:right!important}.header-phone{font-size:16px!important}.header-widgets{order:3!important;width:100%!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;margin:0!important}.header-widget{width:100%!important}.header-widget iframe{width:100%!important}
          .site-nav{padding:0 16px!important;gap:19px!important;min-height:48px!important}.site-nav a,.catalog-toggle{flex:0 0 auto!important;font-size:13px!important}.page-layout{display:block!important;padding:20px 16px 38px!important}.content{min-width:0!important}.content>p:has(img){display:flex!important;justify-content:center!important;max-width:none!important}.content>p>img{width:100%!important;height:auto!important;max-width:100%!important}
          .filter_fon_table{display:block!important;overflow:hidden!important;padding:14px!important}.filter_fon_table tbody,.filter_fon_table tr,.filter_fon_table td{display:block!important;width:auto!important;height:auto!important;padding:0!important}.filter_fon_table td{margin:9px 0!important;line-height:1.5!important}.filter_fon_table input,.filter_fon_table select{width:100%!important;max-width:none!important}.filter_fon_table .filter_fon table,.filter_fon_table .filter_fon tbody,.filter_fon_table .filter_fon tr{display:block!important;width:100%!important}.filter_fon_table .filter_fon td{display:inline-block!important;width:calc(50% - 8px)!important;vertical-align:top!important;margin:4px!important}
          .product-grid,.variant-2 .product-grid{grid-template-columns:1fr!important}
          .product-photo,.variant-2 .product-photo{aspect-ratio:16/10!important;padding:10px!important}
          .product-title{min-height:0!important;font-size:16px!important}
          .detail-page .it_inn_table>tbody{display:flex!important;flex-direction:column!important;gap:20px!important}.detail-page .it_bigpic img{height:min(76vw,360px)!important}.gallery-nav{inset:50% 4px auto!important}.gallery-nav button{width:36px!important;height:36px!important;min-height:36px!important}.window_div .quick-order-card{padding:22px 18px!important}.window_div .quick-order-submit{width:100%!important}
        }`;
      doc.head.append(style);
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
    const strip = doc.createElement('div');
    strip.className = 'product-gallery-thumbs';
    strip.setAttribute('aria-label', 'Фотографии товара');
    const images = thumbs.map((thumb) => thumb.href);
    let current = Math.max(0, images.findIndex((source) => source === image.src));
    if (current < 0) current = 0;

    const activate = (index, shouldFocus = false) => {
      current = (index + images.length) % images.length;
      image.src = images[current];
      thumbs.forEach((thumb, position) => {
        const selected = position === current;
        thumb.setAttribute('aria-current', String(selected));
        if (selected) thumb.querySelector('.it_ppic, .it_ppic_a')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
      previous.disabled = images.length < 2;
      next.disabled = images.length < 2;
      if (shouldFocus) thumbs[current].focus();
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
    previous.addEventListener('click', () => activate(current - 1, true));
    next.addEventListener('click', () => activate(current + 1, true));
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
    viewer.append(nav, strip);
    let startX = 0;
    viewer.addEventListener('pointerdown', (event) => { startX = event.clientX; });
    viewer.addEventListener('pointerup', (event) => {
      const distance = event.clientX - startX;
      if (Math.abs(distance) > 36) activate(current + (distance < 0 ? 1 : -1));
    });
    activate(current);
  };

  const keepNavigationLocal = (doc) => {
    doc.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      const url = new URL(link.href, doc.baseURI);
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
    improveControls(doc);
    moveRatingWidgets(doc);
    placeCatalog(doc);
    buildProductGallery(doc);
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
    const close = () => {
      modal.style.display = 'none';
      backdrop.style.display = 'none';
      doc.body.style.overflow = '';
    };

    closeButton.addEventListener('click', close);
    backdrop.onclick = close;
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
      const itemId = Number(win.cur_itm) || 0;
      const endpoint = new URL('https://mpoint55.ru/cart_actions.php');
      endpoint.searchParams.set('act', 'send_quick_order');
      endpoint.searchParams.set('phone', phone.value.trim());
      if (itemId) endpoint.searchParams.set('iid', String(itemId));
      try {
        await fetch(endpoint, { mode: 'no-cors', credentials: 'omit', cache: 'no-store' });
        status.textContent = 'Заявка отправлена. Сотрудник магазина свяжется с вами.';
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
    if (window.__mpointStaticOpenPatched) return;
    window.__mpointStaticOpenPatched = true;
    const nativeOpen = window.open.bind(window);
    window.open = (url, target, features) => {
      const destination = new URL(String(url), location.href);
      if (/^(?:www\.)?mpoint55\.ru$/i.test(destination.hostname)) {
        frame.srcdoc = `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Мототочка</title><style>body{margin:0;background:#f0f0ed;color:#242424;font:16px/1.6 Arial,sans-serif}.notice{max-width:680px;margin:12vh auto;padding:32px;background:#fff;border:1px solid #dededb;border-radius:8px}.notice h1{margin:0 0 12px;font-size:28px}.notice a{display:inline-flex;margin-top:12px;padding:10px 16px;background:#30302e;color:#fff;border-radius:5px;text-decoration:none;font-weight:700}</style><main class="notice"><h1>Страница не включена в макет</h1><p>Эта ссылка не ведёт на исходный сайт. Вернитесь в каталог или откройте доступную страницу из меню.</p><a href="#" onclick="history.back();return false">Назад</a></main></html>`;
        return null;
      }
      return nativeOpen(url, target, features);
    };
  };

  fetch('./live-data.json', { cache: 'no-store' })
    .then((response) => response.ok ? response.json() : {})
    .then((data) => {
      liveData = data.products || {};
      updateCatalogData(frame.contentDocument);
    })
    .catch(() => {});

  frame.addEventListener('load', enhancePage);
  installPreviewHooks();
  if (frame.contentDocument?.readyState === 'complete') enhancePage();
})();
