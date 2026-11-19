'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'../../..');
async function run(){
 const exe=process.env.CCP_CHROME_PATH || ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(fs.existsSync);
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(exe?{executablePath:exe}:{})});
 try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<!doctype html><html class="ccp-bs5-preview"><body><div class="modal-content"><input class="form-control" /></div></body></html>');
  await page.addStyleTag({path:path.join(root,'upload/catalog/view/javascript/codecart-bs5-preview/bootstrap-5.3.9.min.css')});
  await page.addScriptTag({path:path.join(root,'upload/catalog/view/javascript/codecart-bs5-preview/codecart-theme-370.js')});
  for(const isDark of [false,true,false]){
   await page.evaluate(value=>document.documentElement.classList.toggle('ccp-theme-dark',value),isDark);
   await page.waitForFunction(value=>document.documentElement.getAttribute('data-bs-theme')===(value?'dark':'light'),isDark);
   const style=await page.evaluate(()=>{
    const r=getComputedStyle(document.documentElement);
    return {mode:document.documentElement.getAttribute('data-bs-theme'),bg:r.getPropertyValue('--bs-body-bg').trim()};
   });
   assert.equal(style.mode,isDark?'dark':'light');
   assert.ok(style.bg,'Bootstrap body background must resolve');
   console.log('PASS native BS5 storefront theme '+style.mode);
  }
  assert.deepEqual(errors,[]);
  await page.close();
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
