'use strict';
// Browser fixture for Bootstrap 5 CodeCart storefront header (never UniShop2).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'../../..');
async function main(){
 const executable=process.env.CCP_CHROME_PATH||
  ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(executable?{executablePath:executable}:{})});
 try{
  for(const width of [360,375,768,1280]){
   for(const dark of [false,true]){
    const page=await browser.newPage({viewport:{width,height:820}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setContent('<!doctype html><html class="ccp-bs5-preview'+(dark?' ccp-theme-dark':'')+'"><head></head><body>'+
      '<nav id="top"><div class="container"><div id="top-links"><ul>'+
      '<li><a href="#account">Account</a></li><li><button>Theme</button></li>'+
      '</ul></div></div></nav>'+
      '<div class="ccp-head"><header><div class="container"><div class="row">'+
      '<div class="col-sm-4 ccp-header-brand-col"><div id="logo"><a href="/"><img alt="Store" width="180" height="70" /></a></div></div>'+
      '<div class="col-sm-5 ccp-header-search-col"><div id="search"><div class="input-group">'+
      '<input class="form-control" aria-label="Search" value="Hello" /><div class="input-group-btn"><button class="btn">Search</button></div>'+
      '</div></div></div><div class="col-sm-3 ccp-header-cart-col"><div id="cart"><button class="btn">Cart</button></div></div>'+
      '</div></div></header></div></body></html>');
    await page.addStyleTag({path:path.join(root,'upload/catalog/view/javascript/codecart-bs5-preview/bootstrap-5.3.9.min.css')});
    await page.addStyleTag({path:path.join(root,'upload/catalog/view/javascript/codecart-bs5-preview/codecart-ui-370.css')});
    const result=await page.evaluate(()=>{
      const search=document.querySelector('#search .form-control');
      const group=document.querySelector('#search .input-group');
      const root=document.documentElement;
      return {
       overflow:root.scrollWidth>innerWidth,
       width:search.getBoundingClientRect().width,
       group:group.getBoundingClientRect().width,
       display:getComputedStyle(group).display,
       focusToken:getComputedStyle(root).getPropertyValue('--ccp-ui-focus').trim()
      };
    });
    assert.equal(result.overflow,false,'Header overflow '+width+' '+dark);
    assert.ok(result.width>0,'Search hidden '+width);
    assert.ok(result.width<=result.group,'Search wider than group '+width);
    assert.equal(result.display,'flex','Search input-group layout '+width);
    assert.ok(result.focusToken,'Missing focus token');
    assert.deepEqual(errors,[],'Browser errors '+errors.join('; '));
    console.log('PASS header '+width+'px '+(dark?'dark':'light'));
    await page.close();
   }
  }
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
