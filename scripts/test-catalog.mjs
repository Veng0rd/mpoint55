import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent = class CustomEvent {};
globalThis.location = { pathname: '/' };
vm.runInThisContext(fs.readFileSync(new URL('../catalog-behavior.js', import.meta.url), 'utf8'));

const catalog = window.MPOINT_CATALOG;
const parent = { order: [], append(card) { this.order.push(card); } };
const card = (title, price, id) => ({
  dataset: { itemId: id }, hidden: false, parentNode: parent,
  querySelector(selector) {
    if (selector === '.product-title') return { textContent: title };
    if (selector.startsWith('.product-price')) return price ? { textContent: price } : null;
    return null;
  },
});
const vmc = card('Мотоцикл VMC Rally', 'Уточняйте цену', '1');
const ataki = card('Мотоцикл Ataki T1-L', '137 500 ₽', '2');
const manufacturer = {
  name: 'manuf', tagName: 'SELECT', options: [{ value: '-1', defaultSelected: true }],
  selectedOptions: [{ value: '398', textContent: 'VMC (Vento)' }],
};
const defaultRange = { name: 'val1_from', tagName: 'SELECT', options: [{ value: '125', defaultSelected: true }] };
const doc = {
  querySelectorAll(selector) { return selector === '.product-card' ? [vmc, ataki] : [manufacturer, defaultRange]; },
  dispatchEvent() {},
  getElementById() { return { getAttribute: () => '/c/mototehnika/motocikly' }; },
};

const data = new URLSearchParams({ manuf: '398', val1_from: '125', sortby: '1', fromform: '1' });
const filtered = catalog.filter(doc, data);
assert.equal(vmc.hidden, false, 'VMC (Vento) must match VMC as an exact manufacturer alias');
assert.equal(ataki.hidden, true, 'manufacturer filtering must exclude another manufacturer');
assert.deepEqual(filtered.unsupported, [], 'unchanged default range must not request a fallback');

data.set('manuf', '-1');
parent.order.length = 0;
catalog.filter(doc, data);
assert.deepEqual(parent.order, [ataki, vmc], 'a missing price must remain last for descending price sort');

data.set('val1_from', '300');
let fallback;
catalog.filter(doc, data, { sourceFallback: (...args) => { fallback = args; } });
assert.deepEqual(fallback[0].unsupported, ['val1_from'], 'a changed unsupported range must be reported');
assert.equal(fallback[1].url, 'https://mpoint55.ru/c/mototehnika/motocikly');
assert.equal(fallback[1].init.body.get('fromform'), '1', 'source POST must preserve hidden form fields');

const index = JSON.parse(fs.readFileSync(new URL('../pages/search-index.json', import.meta.url), 'utf8'));
assert.equal(new Set(index.map(({ path }) => path)).size, index.length, 'search index paths must be unique');
const [batteries, motorcycles] = await Promise.all([
  catalog.search('аккумулятор', { index }), catalog.search('мотоцикл', { index }),
]);
assert.ok(batteries.some(({ category }) => category === '/c/akkumulyatory'), 'search must include batteries');
assert.ok(motorcycles.some(({ category }) => category === '/c/mototehnika/motocikly'), 'search must include motorcycles');

console.log(`catalog scenarios passed: ${index.length} indexed products`);
