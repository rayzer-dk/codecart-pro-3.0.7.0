'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const root = path.resolve(__dirname, '../../..');
const bootstrapCss=path.join(root,'upload/admin/view/javascript/codecart-bs5-preview/bootstrap-5.3.9.min.css');
const files = {
  admin: 'upload/admin/view/stylesheet/codecart-ui-370.css',
  store: 'upload/catalog/view/javascript/codecart-bs5-preview/codecart-ui-370.css'
};
async function main() {
  const executable = process.env.CCP_CHROME_PATH ||
    ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium']
      .find(file => fs.existsSync(file));
  const browser = await chromium.launch({
    headless: true, args: ['--no-sandbox'],
    ...(executable ? { executablePath: executable } : {})
  });
  try {
    for (const kind of ['admin', 'store']) {
      for (const width of [375, 768, 1280]) {
        for (const dark of [false, true]) {
          const page = await browser.newPage({ viewport: { width, height: 800 } });
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          const className = 'ccp-bs5-preview' +
            (dark ? (kind === 'admin' ? ' ccp-admin-dark' : ' ccp-theme-dark') : '');
          await page.setContent('<!doctype html><html class="' + className + '"><head></head><body>' +
            '<main id="content"><div class="panel"><div class="panel-heading">Heading</div>' +
            '<div class="panel-body"><input class="form-control" aria-label="Test" />' +
            '<button class="btn">Save</button><div class="table-responsive">' +
            '<table class="table"><tr><td>Row</td></tr></table></div>' +
            '<ul class="nav nav-tabs"><li><a href="#example">Tab</a></li></ul>' +
            '</div></div><div class="product-thumb">Product</div></main>' +
            '<div class="modal-content">Modal</div></body></html>');
          await page.addStyleTag({ path: bootstrapCss });
          await page.addStyleTag({ path: path.join(root, files[kind]) });
          const panelSelector = kind === 'admin' ? '#content .panel' : '#content .product-thumb';
          const result = await page.evaluate(selector => {
            const style = query => getComputedStyle(document.querySelector(query));
            const rootStyle = getComputedStyle(document.documentElement);
            return {
              radius: style(selector).borderRadius,
              inputRadius: style('.form-control').borderRadius,
              modalRadius: style('.modal-content').borderRadius,
              token: rootStyle.getPropertyValue('--ccp-ui-radius').trim(),
              overflow: document.documentElement.scrollWidth > window.innerWidth
            };
          }, panelSelector);
          assert.ok(result.token, 'Missing design token: ' + kind);
          assert.notEqual(result.radius, '0px', 'Panel radius missing: ' + kind);
          assert.notEqual(result.inputRadius, '0px', 'Input radius missing: ' + kind);
          assert.notEqual(result.modalRadius, '0px', 'Modal radius missing: ' + kind);
          assert.equal(result.overflow, false, 'Horizontal overflow: ' + kind + ' ' + width);
          assert.deepEqual(errors, [], 'Browser errors: ' + errors.join('; '));
          console.log('PASS UI foundation ' + kind + ' ' + width + 'px ' + (dark ? 'dark' : 'light'));
          await page.close();
        }
      }
    }
    // Additional scoped regression: product editor tab-strip and action toolbar on phones.
    for (const width of [375, 768, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 850 } });
      await page.setContent('<!doctype html><html class="ccp-bs5-preview"><body>' +
        '<div id="content" class="ccp-ui-product-form">' +
        '<div class="page-header"><div class="container-fluid"><div class="pull-right"><button class="btn">Save</button><button class="btn">Cancel</button></div><h1>Product</h1><ul class="breadcrumb"><li>Catalog</li></ul></div></div>' +
        '<div class="panel"><div class="panel-body"><ul class="nav nav-tabs">' +
        Array.from({length:12}, (_,i) => '<li><a href="#tab'+i+'">Product settings '+i+'</a></li>').join('') +
        '</ul><div class="tab-content">Editor</div></div></div></div></body></html>');
      await page.addStyleTag({ path: bootstrapCss });
      await page.addStyleTag({ path: path.join(root, files.admin) });
      const metrics = await page.evaluate(() => {
        const tabs=document.querySelector('#content .nav-tabs');
        const toolbar=document.querySelector('.page-header .pull-right');
        return {
          tabsScrollable: tabs.scrollWidth > tabs.clientWidth,
          overflow: document.documentElement.scrollWidth > innerWidth,
          toolbarDisplay: getComputedStyle(toolbar).display
        };
      });
      assert.equal(metrics.tabsScrollable,true,'Product tabs should scroll at '+width);
      assert.equal(metrics.overflow,false,'Product page must not overflow at '+width);
      assert.equal(metrics.toolbarDisplay,'flex','Action toolbar must use flex');
      await page.close();
    }
    // Stage 2b: settings scroll without horizontal body overflow; order panels wrap.
    for (const scope of ['ccp-ui-settings', 'ccp-ui-order-info']) {
      for (const width of [375, 768, 1280]) {
        const page=await browser.newPage({viewport:{width,height:900}});
        const tabs=Array.from({length:12}, (_,i)=>'<li><a href="#tab'+i+'">Settings section '+i+'</a></li>').join('');
        await page.setContent('<!doctype html><html class="ccp-bs5-preview"><body>'+
          '<main id="content" class="'+scope+'"><div class="page-header"><div class="container-fluid">'+
          '<h1>Settings and order</h1><div class="pull-right"><button class="btn">Save</button></div>'+
          '<ul class="breadcrumb"><li>System</li></ul></div></div>'+
          '<div class="panel"><div class="panel-body">'+
          (scope==='ccp-ui-settings'?'<ul class="nav nav-tabs">'+tabs+'</ul>':
           '<div class="row"><div class="col-md-4"><table class="table"><tr><td>'+
           'verylongcustomeremailaddress_thatmustwrap@example.test</td></tr></table></div></div>')+
          '</div></div></main></body></html>');
        await page.addStyleTag({path:bootstrapCss});
        await page.addStyleTag({path:path.join(root,files.admin)});
        const result=await page.evaluate(()=>{
          const tabs=document.querySelector('.nav-tabs');
          const action=document.querySelector('.page-header .pull-right');
          return {overflow:document.documentElement.scrollWidth>innerWidth,
            toolbar:getComputedStyle(action).display,
            scrollable:tabs?tabs.scrollWidth>tabs.clientWidth:null};
        });
        assert.equal(result.toolbar,'flex','Action layout '+scope+' '+width);
        assert.equal(result.overflow,false,'Body overflow '+scope+' '+width);
        if(scope==='ccp-ui-settings')assert.equal(result.scrollable,true,'Scrollable settings tabs '+width);
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
