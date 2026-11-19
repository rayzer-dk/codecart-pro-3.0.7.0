'use strict';
/* Regression for reported live failure: Bootstrap 5 column menu, double carets
 * and header dropdowns stretching the entire storefront instead of overlaying.
 * Uses real current CodeCart theme, compatibility CSS, jQuery and BS5 bundle. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'../../..');
const shop='upload/catalog/view/javascript/';
const asset=p=>path.join(root,p);
const vendor=p=>asset(shop+p);
async function run(){
 const binary=process.env.CCP_CHROME_PATH||
  ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(binary?{executablePath:binary}:{})});
 try {
  for(const width of [375,768,1280,1594]){
   const page=await browser.newPage({viewport:{width,height:920}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const links=['Комп’ютери','Ноутбуки','Компоненти','Планшети','Програмне забезпечення','Телефони та PDA','Камери','MP3-плеєри'];
   const menuItems=links.map((t,i)=>'<li class="ccp-menu-parent" data-ccp-menu-panel="panel-'+i+'"><a class="ccp-menu-parent-link" href="#category-'+i+'">'+t+'</a></li>').join('');
   const sections=links.map((t,i)=>'<section id="panel-'+i+'" class="ccp-horizontal-panel" aria-hidden="true"><a href="#category-'+i+'">'+t+'</a></section>').join('');
   await page.setContent('<!doctype html><html class="ccp-bs5-preview"><head></head><body>'+
    '<nav id="top"><div class="container">'+
    '<div class="pull-left"><form><div class="btn-group"><button type="button" id="currency" class="btn btn-link dropdown-toggle" data-toggle="dropdown">Валюта <i class="fa fa-caret-down"></i></button><ul class="dropdown-menu"><li><a href="#eur">EUR</a></li><li><a href="#uah">UAH</a></li></ul></div></form></div>'+
    '<div id="top-links"><ul class="list-inline"><li class="dropdown"><a id="account" href="#account" class="dropdown-toggle" data-toggle="dropdown">Кабінет <span class="caret"></span></a><ul class="dropdown-menu"><li><a href="#login">Вхід</a></li></ul></li></ul></div></div></nav>'+
    '<div class="ccp-head"><header><div class="container"><div class="row"><div class="col-sm-4 ccp-header-brand-col"><div id="logo">CodeCart PRO</div></div><div class="col-sm-5 ccp-header-search-col"><div id="search" class="input-group"><input class="form-control" aria-label="Search" /><span class="input-group-btn"><button class="btn">Search</button></span></div></div><div class="col-sm-3 ccp-header-cart-col"><div id="cart" class="btn-group btn-block"><button type="button" data-toggle="dropdown" class="btn btn-inverse dropdown-toggle ccp-cart-trigger">Кошик <i class="fa fa-caret-down"></i></button><ul class="dropdown-menu"><li><p>Empty cart</p></li></ul></div></div></div></div></header>'+
    '<div class="container"><nav id="menu" class="navbar ccp-menu-horizontal-mode"><div class="ccp-horizontal-desktop"><div class="navbar-collapse"><ul class="nav navbar-nav ccp-horizontal-tabs">'+menuItems+'</ul></div><div class="ccp-horizontal-panels">'+sections+'</div></div></nav></div></div>'+
    '<main id="main-content" style="height:480px"><div id="common-home" class="container">Content beneath menu</div></main></body></html>');
   await page.addStyleTag({path:vendor('codecart-bs5-preview/bootstrap-5.3.9.min.css')});
   await page.addStyleTag({path:vendor('codecart-bs5-preview/codecart-bs3-compat.css')});
   await page.addStyleTag({path:asset('upload/catalog/view/theme/codecart/stylesheet/stylesheet.css')});
   await page.addStyleTag({path:vendor('codecart-bs5-preview/codecart-ui-370.css')});
   await page.addScriptTag({path:vendor('jquery/jquery-4.1.0.min.js')});
   await page.addScriptTag({path:vendor('codecart-bs5-preview/bootstrap-5.3.9.bundle.min.js')});
   await page.addScriptTag({path:vendor('codecart-bs5-preview/codecart-bs3-compat.js')});
   const before=await page.evaluate(()=>{
    const navbar=document.querySelector('#menu');
    const list=document.querySelector('.ccp-horizontal-tabs');
    const panel=document.querySelector('.ccp-horizontal-panel');
    return {row:getComputedStyle(list).flexDirection,navHeight:navbar.getBoundingClientRect().height,
      panelDisplay:getComputedStyle(panel).display,
      contentTop:document.querySelector('#main-content').getBoundingClientRect().top,
      noOverflow:document.documentElement.scrollWidth<=innerWidth+1};
   });
   assert.equal(before.noOverflow,true,'Header overflow at '+width);
   assert.equal(before.panelDisplay,'none','Mega menu must initially be hidden at '+width);
   if(width>=992){
    assert.equal(before.row,'row','Desktop category links must form a horizontal row at '+width);
    assert.ok(before.navHeight<110,'Blue navigation expanded vertically at '+width+' height '+before.navHeight);
    await page.locator('.ccp-horizontal-panel').first().evaluate(el=>el.classList.add('is-open'));
    const open=await page.evaluate(()=>({
      display:getComputedStyle(document.querySelector('.ccp-horizontal-panel')).display,
      contentTop:document.querySelector('#main-content').getBoundingClientRect().top,
      position:getComputedStyle(document.querySelector('.ccp-horizontal-panels')).position
    }));
    assert.equal(open.display,'block');
    assert.equal(open.position,'absolute');
    assert.equal(open.contentTop,before.contentTop,'Mega menu must overlay content, not push it down');
   }
   for(const id of ['currency','account']){
    const toggle=page.locator('#'+id);
    const parent=toggle.locator('xpath=..');
    const menu=parent.locator('.dropdown-menu');
    await toggle.click();
    await page.waitForFunction(id=>document.querySelector('#'+id).parentElement.querySelector('.dropdown-menu').classList.contains('show'),id);
    const details=await menu.evaluate(el=>({
      position:getComputedStyle(el).position,
      display:getComputedStyle(el).display
    }));
    assert.equal(details.position,'absolute','Dropdown '+id+' must float over content');
    assert.equal(details.display,'block');
    const caret=await toggle.evaluate(el=>getComputedStyle(el,'::after').display);
    assert.equal(caret,'none','Duplicated dropdown arrow on '+id);
    await toggle.click();
   }
   assert.deepEqual(errors,[],'Runtime errors: '+errors.join('; '));
   console.log('PASS storefront navbar/dropdown BS5 '+width+'px');
   await page.close();
  }
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
