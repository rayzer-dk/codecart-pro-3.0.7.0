'use strict';
// Static browser component regression for CodeCart PRO Bootstrap 5 migration.
// This cannot certify third-party modules or an installed store.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'../../..');
const from=p=>{const full=path.join(root,p);assert.ok(fs.existsSync(full),'Missing '+p);return full;};
async function run(){
 const execPath=process.env.CCP_CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(execPath?{executablePath:execPath}:{})});
 try{
  for(const width of [375,650,900,1050,1400]){
   const page=await browser.newPage({viewport:{width,height:950},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.setContent("<!DOCTYPE html><html lang='uk'><head><meta charset='UTF-8'></head><body>"+
   "<div class='container'><div class='row'>"+
   "<div id='sm' class='col-sm-6'>SM</div><div id='md' class='col-md-4'>MD</div><div id='lg' class='col-lg-3'>LG</div><div id='xs' class='col-xs-6'>XS</div>"+
   "</div></div>"+
   "<div class='dropdown'><button type='button' id='dropdown' data-toggle='dropdown' aria-expanded='false'>Menu</button><ul class='dropdown-menu'><li><a href='#item1'>Item one</a></li></ul></div>"+
   "<ul class='nav nav-tabs'><li class='active'><a id='tabA' href='#paneA' data-toggle='tab'>A</a></li><li><a id='tabB' href='#paneB' data-toggle='tab'>B</a></li></ul>"+
   "<div class='tab-content'><div class='tab-pane fade in active' id='paneA'>A</div><div class='tab-pane fade' id='paneB'>B</div></div>"+
   "<button id='collapseButton' data-toggle='collapse' data-target='#fold'>Fold</button><div id='fold' class='collapse'>Hidden</div>"+
   "<button id='modalButton' data-toggle='modal' data-target='#dialog'>Open</button>"+
   "<div id='dialog' class='modal fade' tabindex='-1'><div class='modal-dialog'><div class='modal-content'><div class='modal-header'><h5>Dialog</h5><button type='button' data-dismiss='modal'>X</button></div><div class='modal-body'>Content</div></div></div></div>"+
   "<button id='loading' data-loading-text='Loading'>Submit</button>"+
   "<button id='popover' data-toggle='image' type='button'>Image</button>"+
   "<div class='carousel slide' id='gallery'><div class='carousel-inner'><div id='slide1' class='item active'>First</div><div id='slide2' class='item'>Second</div></div><a id='nextSlide' class='right carousel-control' href='#gallery' data-slide='next'>Next</a></div>"+
   "<div id='dynamicTarget'></div></body></html>");
   const scriptsBase='upload/admin/view/javascript/';
   await page.addStyleTag({path:from(scriptsBase+'codecart-bs5-preview/bootstrap-5.3.9.min.css')});
   await page.addStyleTag({path:from(scriptsBase+'codecart-bs5-preview/codecart-bs3-compat.css')});
   await page.addScriptTag({path:from(scriptsBase+(process.env.CCP_JQUERY_SERIES === '4' ? 'jquery/jquery-4.1.0.min.js' : 'jquery/jquery-3.8.0.min.js'))});
   await page.addScriptTag({path:from(scriptsBase+(process.env.CCP_JQUERY_SERIES === '4' ? 'jquery/jquery-migrate-4.0.2.min.js' : 'jquery/jquery-migrate-3.6.0.min.js'))});
   await page.addScriptTag({path:from(scriptsBase+'codecart-bs5-preview/bootstrap-5.3.9.bundle.min.js')});
   await page.addScriptTag({path:from(scriptsBase+'codecart-bs5-preview/codecart-bs3-compat.js')});
   const initial=await page.evaluate(()=>{
     const width=id=>Math.round(document.getElementById(id).getBoundingClientRect().width/document.getElementById(id).parentElement.getBoundingClientRect().width*100);
     return {active:window.CodeCartBootstrap5.active,report:window.CodeCartBootstrap5.report(),sm:width('sm'),md:width('md'),lg:width('lg'),xs:width('xs'),carouselItem:document.querySelector('#slide1').classList.contains('carousel-item')};
   });
   assert.equal(initial.active,true);
   assert.equal(initial.report.jqueryBridgeInstalled,true);
   assert.equal(initial.xs,50,'col-xs at '+width);
   assert.equal(initial.sm,width>=768?50:100,'col-sm at '+width);
   assert.equal(initial.md,width>=992?33:100,'col-md at '+width);
   assert.equal(initial.lg,width>=1200?25:100,'col-lg at '+width);
   assert.equal(initial.carouselItem,true);
   await page.locator('#dropdown').click();
   assert.equal(await page.locator('.dropdown-menu').evaluate(el=>el.classList.contains('show')),true,'Dropdown '+width);
   await page.locator('#dropdown').click();
   assert.equal(await page.locator('.dropdown-menu').evaluate(el=>el.classList.contains('show')),false,'Dropdown close '+width);
   await page.locator('#tabB').click();
   assert.equal(await page.locator('#paneB').evaluate(el=>el.classList.contains('active')),true,'Tab '+width);
   assert.equal(await page.locator('#tabB').evaluate(el=>el.parentElement.classList.contains('active')),true,'Legacy tab parent '+width);
   await page.locator('#collapseButton').click();
   await page.waitForFunction(()=>document.querySelector('#fold')?.classList.contains('show'),{timeout:4000});
   assert.equal(await page.locator('#fold').evaluate(el=>el.classList.contains('show')),true,'Collapse '+width);
   await page.locator('#modalButton').click();
   await page.waitForFunction(()=>document.querySelector('#dialog')?.classList.contains('show'),{timeout:4000});
   assert.equal(await page.locator('#dialog').evaluate(el=>el.classList.contains('show')),true,'Modal '+width);
   await page.locator('#dialog [data-dismiss]').click();
   await page.waitForFunction(()=>!document.querySelector('#dialog')?.classList.contains('show'),{timeout:4000});
   assert.equal(await page.locator('#dialog').evaluate(el=>el.classList.contains('show')),false,'Modal dismiss '+width);
   const legacy=await page.evaluate(()=>{
     const $=window.jQuery;
     $('#loading').button('loading');
     const text=$('#loading').text(),disabled=$('#loading').prop('disabled');
     $('#loading').button('reset');
     $('#popover').popover({html:true,content:'Image content',trigger:'manual',placement:'right'});
     const wasCreated=!!$('#popover').data('bs.popover');
     $('#popover').popover('show');
     const popoverShown=!!document.querySelector('.popover.show');
     $('#popover').popover('destroy');
     const destroyed=$('#popover').data('bs.popover')===undefined;
     $('#nextSlide').trigger('click');
     const carConverted=document.querySelector('#slide2').classList.contains('carousel-item');
     const dynamic=document.createElement('div');
     dynamic.innerHTML='<button id="dynToggle" data-toggle="collapse" data-target="#dynamicFold">Dynamic</button><div id="dynamicFold" class="collapse">Dynamic content</div>';
     document.querySelector('#dynamicTarget').append(dynamic);
     return {text,disabled,restored:$('#loading').text(),enabled:!$('#loading').prop('disabled'),wasCreated,popoverShown,destroyed,carConverted};
   });
   assert.equal(legacy.text,'Loading');assert.equal(legacy.disabled,true);
   assert.equal(legacy.restored,'Submit');assert.equal(legacy.enabled,true);
   assert.equal(legacy.wasCreated,true,'jQuery popover data '+width);
   assert.equal(legacy.popoverShown,true,'Popover show '+width);
   assert.equal(legacy.destroyed,true,'Popover destroy '+width);
   assert.equal(legacy.carConverted,true,'Carousel items '+width);
   await page.waitForTimeout(60);
   await page.locator('#dynToggle').click();
   await page.waitForFunction(()=>document.querySelector('#dynamicFold')?.classList.contains('show'),{timeout:4000});
   assert.equal(await page.locator('#dynamicFold').evaluate(el=>el.classList.contains('show')),true,'Dynamic collapse '+width);
   assert.deepEqual(errors,[],'Page JS exceptions '+width);
   console.log('Bootstrap 5 legacy browser smoke passed at '+width+'px: '+JSON.stringify({initial,legacy}));
   await page.close();
  }
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
