'use strict';
// Regression: beforeinstallprompt can fire while the footer is not parsed yet.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '../upload/catalog/view/javascript/codecart/workbox/register.js'),
  'utf8'
);
function fixture(enabled) {
  const docListeners = {};
  const windowListeners = {};
  const children = [];
  let footerExists = false;
  const footer = { appendChild(element) { children.push(element); } };
  const document = {
    readyState: 'loading',
    baseURI: 'https://shop.example/store/',
    documentElement: {
      dataset: { ccpPwaInstall: 'Install application' },
      getAttribute(name) {
        return name === 'data-ccp-pwa' ? (enabled ? '1' : '0') : '0';
      }
    },
    querySelector(selector) {
      if (selector === '.ccp-footer-bottom') return footerExists ? footer : null;
      return null;
    },
    createElement(name) {
      return {
        nodeName: name.toUpperCase(),
        hidden: false,
        disabled: false,
        attributes: {},
        events: {},
        setAttribute(key, value) { this.attributes[key] = value; },
        addEventListener(key, callback) { this.events[key] = callback; }
      };
    },
    addEventListener(type, callback) { docListeners[type] = callback; }
  };
  const navigator = {
    userAgent: 'Mozilla/5.0 Chrome/130.0 Safari/537.36',
    platform: 'Linux x86_64',
    maxTouchPoints: 0,
    serviceWorker: {
      getRegistration() { return Promise.resolve(null); },
      register() { return Promise.resolve(); }
    }
  };
  const window = {
    location: { href: document.baseURI, origin: 'https://shop.example' },
    isSecureContext: true,
    navigator,
    addEventListener(type, callback) { windowListeners[type] = callback; },
    matchMedia() { return { matches: false }; }
  };
  vm.runInNewContext(source, { window, document, navigator, URL, Promise }, { filename: 'register.js' });
  return {
    document, children, docListeners, windowListeners,
    showFooter() { footerExists = true; document.readyState = 'interactive'; }
  };
}

const active = fixture(true);
assert.equal(typeof active.windowListeners.beforeinstallprompt, 'function', 'PWA install event handler installed');
let prevented = false;
active.windowListeners.beforeinstallprompt({
  preventDefault() { prevented = true; },
  prompt() {},
  userChoice: Promise.resolve({ outcome: 'accepted' })
});
assert.equal(prevented, true, 'Chrome prompt retained by the app');
assert.equal(active.children.length, 0, 'Footer not created before DOM completion');
assert.equal(typeof active.docListeners.DOMContentLoaded, 'function', 'Early prompt scheduled until footer ready');
active.showFooter();
active.docListeners.DOMContentLoaded();
assert.equal(active.children.length, 2, 'Install controls added after footer is parsed');
const button = active.children[0];
assert.equal(button.hidden, false, 'Install button becomes visible');
assert.equal(button.attributes['aria-label'], 'Install application');
active.windowListeners.appinstalled();
assert.equal(button.hidden, true, 'App install hides button');
const inactive = fixture(false);
assert.equal(inactive.windowListeners.beforeinstallprompt, undefined, 'PWA disabled has no install UI');
console.log('PASS: early PWA install prompt survives pre-footer DOM, OFF remains inactive');
