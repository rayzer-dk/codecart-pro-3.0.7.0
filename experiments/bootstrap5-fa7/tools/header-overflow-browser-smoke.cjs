'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('@playwright/test');
async function main(){
 const binary=process.env.CCP_CHROME_PATH ||
  ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(binary?{executablePath:binary}:{})});
 try{
  const page=await browser.newPage({viewport:{width:375,height:800}});
  const failures=[];page.on('pageerror',e=>failures.push(String(e)));
  const icons=Array.from({length:12},(_,i)=>'<li class="extension-action"><a href="#item'+i+'" title="Action '+i+'">Icon '+i+'</a></li>').join('');
  await page.setContent('<!doctype html><html><head><style>'+
   '#header>.container-fluid{display:flex;width:100%;padding:0}'+
   '#header .brand{flex:0 0 80px}'+
   '#header .navbar-right{display:flex;flex-wrap:nowrap;list-style:none;min-width:0;padding:0;margin:0}'+
   '#header .navbar-right>li{flex:0 0 52px;width:52px}'+
   '#header .ccp-header-overflow-panel[hidden],#header .ccp-header-more[hidden]{display:none}'+
   '</style></head><body><header id="header"><div class="container-fluid">'+
   '<div class="brand">CodeCart</div><ul class="navbar-right">'+icons+
   '<li class="ccp-header-more" hidden><button id="ccp-header-more-toggle" aria-expanded="false">More</button></li></ul>'+
   '<div id="ccp-header-overflow-panel" class="ccp-header-overflow-panel" hidden><ul class="ccp-header-overflow-items"></ul></div>'+
   '</div></header></body></html>');
  const script=path.resolve(__dirname,'../../../upload/admin/view/javascript/codecart-header-overflow.js');
  await page.addScriptTag({path:script});
  await page.waitForFunction(()=>document.querySelectorAll('.ccp-header-overflow-items>li').length>0);
  const count=await page.locator('.ccp-header-overflow-items>li').count();
  assert.ok(count>0,'Third-party toolbar actions must move into overflow on mobile');
  await page.locator('#ccp-header-more-toggle').click();
  assert.equal(await page.locator('#ccp-header-more-toggle').getAttribute('aria-expanded'),'true');
  const focused=await page.evaluate(()=>document.activeElement.closest('.ccp-header-overflow-items')!==null);
  assert.equal(focused,true,'Opening overflow must focus the first item');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#ccp-header-overflow-panel').getAttribute('hidden'),'');
  await page.setViewportSize({width:1280,height:800});
  await page.waitForFunction(()=>document.querySelectorAll('.navbar-right>.extension-action').length===12);
  assert.equal(await page.locator('.ccp-header-overflow-items>.extension-action').count(),0);
  assert.deepEqual(failures,[],'Unexpected header JS errors');
  console.log('PASS mobile overflow actions moved and restored, focus and Escape verified');
  await page.close();
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
