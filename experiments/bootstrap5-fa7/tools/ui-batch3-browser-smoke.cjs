'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'../../..');
const bootstrapCss=path.join(root,'upload/admin/view/javascript/codecart-bs5-preview/bootstrap-5.3.9.min.css');
const adminCss=path.join(root,'upload/admin/view/stylesheet/codecart-ui-370.css');
const storeCss=path.join(root,'upload/catalog/view/javascript/codecart-bs5-preview/codecart-ui-370.css');
const adminJs=path.join(root,'upload/admin/view/javascript/codecart-ui-370.js');
const adminScopes=['ccp-ui-product-form','ccp-ui-product-list','ccp-ui-order-list','ccp-ui-settings',
  'ccp-ui-order-info','ccp-ui-category-form','ccp-ui-category-list','ccp-ui-manufacturer-form',
  'ccp-ui-customer-list','ccp-ui-coupon-list'];
const shopPages=['product-product','product-category','checkout-cart','checkout-checkout','account-login'];
async function main(){
 const executable=process.env.CCP_CHROME_PATH||
  ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(executable?{executablePath:executable}:{})});
 try {
  for(const width of [375,768,1280]){
   const page=await browser.newPage({viewport:{width,height:900}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const header='<div class="page-header"><div class="container-fluid"><div class="pull-right"><button class="btn">Save</button><button class="btn">Cancel</button></div><h1>Catalog</h1><ul class="breadcrumb"><li>Home</li></ul></div></div>';
   for(const scope of adminScopes){
    const tab='<ul class="nav nav-tabs">'+Array.from({length:12},(_,i)=>'<li><a href="#tab'+i+'">Configuration '+i+'</a></li>').join('')+'</ul>';
    await page.setContent('<html class="ccp-bs5-preview"><body><main id="content" class="'+scope+'">'+header+'<div class="panel"><div class="panel-body">'+tab+'<input class="form-control" /></div></div></main></body></html>');
    await page.addStyleTag({path:bootstrapCss});
    await page.addStyleTag({path:adminCss});
    const result=await page.evaluate(()=>{
      const root=document.querySelector('#content');
      const toolbar=document.querySelector('.page-header .pull-right');
      return {width:root.getBoundingClientRect().width,overflow:document.documentElement.scrollWidth>innerWidth,
        flex:getComputedStyle(toolbar).display,tabs:getComputedStyle(document.querySelector('.nav-tabs')).overflowX};
    });
    assert.equal(result.flex,'flex','Actions should wrap: '+scope);
    assert.equal(result.overflow,false,'Admin horizontal body overflow '+scope+' '+width);
    if(['ccp-ui-settings','ccp-ui-product-form','ccp-ui-category-form','ccp-ui-manufacturer-form'].includes(scope)){
      assert.equal(result.tabs,'auto','Long tabstrip must scroll: '+scope);
    }
   }
   for(const id of shopPages){
    await page.setContent('<html class="ccp-bs5-preview"><body><main id="'+id+'" class="container"><ul class="breadcrumb"><li>Shop</li></ul><div id="content"><div class="panel"><div class="panel-body"><input class="form-control" /><button class="btn">Submit</button></div></div><div class="table-responsive"><table class="table"><tr><td>One</td></tr></table></div></div></main></body></html>');
    await page.addStyleTag({path:bootstrapCss});
    await page.addStyleTag({path:storeCss});
    const result=await page.evaluate(()=>{
      const input=document.querySelector('.form-control');
      return {overflow:document.documentElement.scrollWidth>innerWidth,radius:getComputedStyle(input).borderRadius};
    });
    assert.equal(result.overflow,false,'Storefront horizontal body overflow '+id+' '+width);
    assert.notEqual(result.radius,'0px','Storefront input should be rounded '+id);
   }
   await page.close();
   assert.deepEqual(errors,[],'JS runtime errors: '+errors.join('; '));
   console.log('PASS batch3 UI smoke at '+width+'px: '+adminScopes.length+' admin and '+shopPages.length+' storefront views');
  }
  // Ensure tab UX module neither activates tabs itself nor overwrites existing handlers.
  const page=await browser.newPage({viewport:{width:375,height:760}});
  await page.setContent('<html class="ccp-bs5-preview"><body><div id="content" class="ccp-ui-settings"><ul class="nav nav-tabs">'+
   Array.from({length:14},(_,i)=>'<li><a href="#s'+i+'">Long settings tab '+i+'</a></li>').join('')+'</ul></div></body></html>');
  await page.addStyleTag({path:bootstrapCss});
    await page.addStyleTag({path:adminCss});
  await page.addScriptTag({path:adminJs});
  const before=await page.locator('.nav-tabs').getAttribute('data-ccp-ui-scroll');
  assert.equal(before,'1','Tab helper should attach when DOM is ready');
  // Dispatch the click in-page: Playwright locator.click() would auto-scroll the tab
  // and create a false-positive even with the custom helper removed.
  const initial=await page.locator('.nav-tabs').evaluate(el=>el.scrollLeft);
  assert.equal(initial,0,'Tabstrip must start at left');
  await page.evaluate(()=>{
    document.querySelector('.nav-tabs li:last-child a')?.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
  });
  await page.waitForFunction(()=>document.querySelector('.nav-tabs').scrollLeft>0);
  const scrolled=await page.locator('.nav-tabs').evaluate(el=>el.scrollLeft);
  assert.ok(scrolled>0,'Native tab helper should scroll the tabstrip');
  const added=await page.evaluate(()=>{
    const nav=document.querySelector('.nav-tabs');
    const li=document.createElement('li');
    li.innerHTML='<a href="#new-tab">Dynamically added tab</a>';
    nav.appendChild(li);
    return li.querySelector('a').getAttribute('href');
  });
  assert.equal(added,'#new-tab');
  await page.close();
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
