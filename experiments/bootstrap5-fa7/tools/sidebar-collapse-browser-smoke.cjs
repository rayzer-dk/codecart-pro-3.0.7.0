'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'../../..');
const assets='upload/admin/view/javascript/';
const src=s=>path.join(root,assets+s);
async function run(){
  const exe=process.env.CCP_CHROME_PATH||
    ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
  const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(exe?{executablePath:exe}:{})});
  try{
    for(const width of [375,768,1280]){
      const page=await browser.newPage({viewport:{width,height:850},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.setContent('<!doctype html><html lang="uk"><head></head><body>'+
        '<nav id="column-left"><div id="navigation">Navigation</div><ul id="menu">'+
        '<li><a href="#collapse0" data-toggle="collapse" aria-controls="collapse0" aria-expanded="false" class="parent collapsed">Products</a>'+
        '<ul id="collapse0" class="collapse"><li><a href="#collapse0-0" data-toggle="collapse" aria-controls="collapse0-0" aria-expanded="false" class="parent collapsed">Subgroup</a>'+
        '<ul id="collapse0-0" class="collapse"><li><a href="#collapse-0-0-0" data-toggle="collapse" aria-controls="collapse-0-0-0" aria-expanded="false" class="parent collapsed">Third group</a>'+
        '<ul id="collapse-0-0-0" class="collapse"><li><a href="#product">Product</a></li></ul>'+
        '</li></ul></li></ul></li></ul></nav></body></html>');
      await page.addStyleTag({path:src('codecart-bs5-preview/bootstrap-5.3.9.min.css')});
      await page.addStyleTag({path:src('codecart-bs5-preview/codecart-bs3-compat.css')});
      await page.addStyleTag({path:path.join(root,'upload/admin/view/stylesheet/codecart-ui-370.css')});
      await page.addScriptTag({path:src('jquery/jquery-3.8.0.min.js')});
      await page.addScriptTag({path:src('codecart-bs5-preview/bootstrap-5.3.9.bundle.min.js')});
      await page.addScriptTag({path:src('codecart-bs5-preview/codecart-bs3-compat.js')});
      for(const id of ['collapse0','collapse0-0','collapse-0-0-0']){
        const link=page.locator('[aria-controls="'+id+'"]');
        await link.click();
        await page.waitForFunction(id=>document.getElementById(id).classList.contains('show'),id);
        assert.equal(await link.getAttribute('aria-expanded'),'true','Collapse expanded '+id);
      }
      await page.locator('[aria-controls="collapse-0-0-0"]').click();
      await page.waitForFunction(()=>!document.getElementById('collapse-0-0-0').classList.contains('show'));
      assert.equal(await page.locator('[aria-controls="collapse-0-0-0"]').getAttribute('aria-expanded'),'false');
      assert.deepEqual(errors,[],'Sidebar page errors '+width);
      console.log('PASS three-level sidebar collapse '+width+'px');
      await page.close();
    }
  }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
