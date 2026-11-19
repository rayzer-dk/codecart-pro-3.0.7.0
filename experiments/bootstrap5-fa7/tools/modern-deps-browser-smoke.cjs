'use strict';
// Isolated compatibility checks for jQuery4, Migrate4, CodeMirror6, Flot4, jQVMap1.5.1.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('@playwright/test');const root=path.resolve(__dirname,'../../..');
function file(relative){const value=path.join(root,relative);assert.ok(fs.existsSync(value),'Missing '+relative);return value;}
async function main(){
 const executable=process.env.CCP_CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(executable?{executablePath:executable}:{})});
 try{
  for(const width of [375,1280]){
   const page=await browser.newPage({viewport:{width,height:800},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.setContent('<html lang="uk"><head></head><body>'+
     '<button id="trigger" data-toggle="modal" data-target="#modal">Open</button>'+
     '<div id="modal" class="modal fade" tabindex="-1"><div class="modal-dialog"><div class="modal-content"><div class="modal-body">Content</div></div></div></div>'+
     '<textarea id="xml" name="xml">&lt;root&gt;hello&lt;/root&gt;</textarea>'+
     '<div id="plot" style="width:420px;height:200px"></div><div id="map" style="width:420px;height:200px"></div>'+
     '</body></html>');
   const admin='upload/admin/view/javascript/';
   const scripts=[
    'jquery/jquery-4.1.0.min.js','jquery/jquery-migrate-4.0.2.min.js',
    'codecart-bs5-preview/bootstrap-5.3.9.bundle.min.js',
    'codecart-bs5-preview/codecart-bs3-compat.js',
    'codecart-modern/codemirror6-editor.min.js',
    'codecart-modern/flot-4.2.6/jquery.flot.js',
    'jquery/jqvmap/jquery.vmap.min.js'
   ];
   for(const part of scripts)await page.addScriptTag({path:file(admin+part)});
   await page.addScriptTag({path:file(admin+'jquery/jqvmap/maps/continents/jquery.vmap.europe.js')});
   const result=await page.evaluate(async()=>{
     const $=window.jQuery;const result={jquery:$.fn.jquery,migrate:$.migrateVersion||null,cm6:!!window.CodeCartCM6,flot:typeof $.plot,vectorMap:typeof $.fn.vectorMap};
     const textarea=document.querySelector('#xml');
     const cm=window.CodeCartCM6.fromTextArea(textarea,{height:'220px'});
     result.cmBefore=cm.getValue();cm.setValue('<root>updated</root>');result.cmAfter=textarea.value;
     result.cmWrapper=!!cm.getWrapperElement().CodeMirror;
     cm.save();cm.toTextArea();result.cmDestroyed=!textarea._codecartCM6;
     $('#trigger').trigger('click');await new Promise(r=>setTimeout(r,50));
     result.modalShown=document.querySelector('#modal').classList.contains('show');
     if(result.modalShown)$('#modal').modal('hide');
     try{$.plot($('#plot'),[[[0,1],[1,2],[2,3]]],{series:{lines:{show:true}}});result.flotRendered=!!document.querySelector('#plot canvas');}
     catch(e){result.flotError=String(e);}
     try{$('#map').vectorMap({map:'europe_en',backgroundColor:'transparent',showTooltip:false});
         result.mapRendered=!!document.querySelector('#map svg');}
     catch(e){result.mapError=String(e);}
     return result;
   });
   assert.equal(result.jquery,'4.1.0');
   assert.equal(result.migrate,'4.0.2','jQuery Migrate 4 must load after jQuery 4');
   assert.equal(result.cm6,true);
   assert.equal(result.cmBefore,'<root>hello</root>');
   assert.equal(result.cmAfter,'<root>updated</root>');
   assert.equal(result.cmWrapper,true);
   assert.equal(result.cmDestroyed,true);
   assert.equal(result.modalShown,true);
   assert.equal(result.flot,'function');
   assert.equal(result.vectorMap,'function');
   assert.equal(result.flotRendered,true,'Flot did not draw: '+result.flotError);
   assert.equal(result.mapRendered,true,'jQVMap did not draw: '+result.mapError);
   assert.deepEqual(errors,[],'Runtime JS errors: '+errors.join('; '));
   console.log('Modern deps browser smoke '+width+'px '+JSON.stringify(result));
   await page.close();
  }
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
