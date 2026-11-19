/* Synchronize CodeCart theme classes with Bootstrap 5.3 color-mode variables.
 * Scoped to CodeCart's Bootstrap 5 preview; never runs for UniShop2/BS3. */
(function (doc, win) {
  'use strict';
  function sync() {
    var root=doc.documentElement;
    if (!root || !root.classList.contains('ccp-bs5-preview')) return;
    var mode=root.classList.contains('ccp-theme-dark') ? 'dark' : 'light';
    if (root.getAttribute('data-bs-theme')!==mode) root.setAttribute('data-bs-theme',mode);
  }
  function start() {
    sync();
    if (!win.MutationObserver) return;
    new win.MutationObserver(sync).observe(doc.documentElement,{attributes:true,attributeFilter:['class']});
  }
  if (doc.readyState==='loading') doc.addEventListener('DOMContentLoaded',start);
  else start();
})(document, window);
