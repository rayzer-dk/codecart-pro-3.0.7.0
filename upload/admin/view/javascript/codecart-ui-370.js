/* CodeCart PRO 3.7.0, Bootstrap 5 admin enhancements (native DOM only).
 * Do not replace OpenCart's tab events, form handlers or OCMOD hooks. */
(function (win, doc) {
  'use strict';
  if (!win || !doc) return;
  var selectors = [
    '#content.ccp-ui-product-form .nav-tabs',
    '#content.ccp-ui-settings .nav-tabs',
    '#content.ccp-ui-category-form .nav-tabs',
    '#content.ccp-ui-manufacturer-form .nav-tabs'
  ];
  var key = 'data-ccp-ui-scroll';
  function reveal(tab) {
    if (!tab || !tab.closest) return;
    var nav = tab.closest('.nav-tabs');
    if (!nav || nav.scrollWidth <= nav.clientWidth + 1) return;
    // Do not call scrollIntoView: it can unexpectedly scroll the whole admin page.
    var tabRect = tab.getBoundingClientRect();
    var navRect = nav.getBoundingClientRect();
    var inset = 8;
    if (tabRect.left < navRect.left + inset) {
      nav.scrollLeft -= (navRect.left + inset - tabRect.left);
    } else if (tabRect.right > navRect.right - inset) {
      nav.scrollLeft += (tabRect.right - navRect.right + inset);
    }
  }
  function isScoped(nav) {
    return nav && selectors.some(function(selector) { return nav.matches(selector); });
  }
  function init() {
    if (!doc.documentElement.classList.contains('ccp-bs5-preview')) return;
    selectors.forEach(function (selector) {
      doc.querySelectorAll(selector).forEach(function(nav) {
        if (nav.hasAttribute(key)) return;
        nav.setAttribute(key,'1');
        // Preserve legacy Bootstrap 3 plugin contracts and let its BS5 bridge activate tabs.
        nav.addEventListener('click', function(event) {
          var tab = event.target.closest('a[href^="#"]');
          if (!tab || !nav.contains(tab)) return;
          win.requestAnimationFrame(function(){ reveal(tab); });
        });
        var selected = nav.querySelector('li.active>a, a.active, [aria-selected="true"]');
        if (selected) win.requestAnimationFrame(function(){ reveal(selected); });
      });
    });
  }
  doc.addEventListener('shown.bs.tab',function(event) {
    var nav=event.target && event.target.closest ? event.target.closest('.nav-tabs') : null;
    if (isScoped(nav)) reveal(event.target);
  });
  function start() {
    init();
    // OCMOD/extension panels may insert tabs after initial render.
    var root=doc.getElementById('content');
    if (!root || !win.MutationObserver) return;
    var scheduled=false;
    new win.MutationObserver(function(){
      if(scheduled)return;
      scheduled=true;
      win.requestAnimationFrame(function(){scheduled=false;init();});
    }).observe(root,{childList:true,subtree:true});
  }
  if (doc.readyState==='loading') doc.addEventListener('DOMContentLoaded',start);
  else start();
})(window,document);
