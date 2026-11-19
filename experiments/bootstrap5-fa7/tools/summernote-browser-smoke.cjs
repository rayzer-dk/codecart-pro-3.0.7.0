'use strict';
// Browser smoke for the real Summernote 0.9.1 Bootstrap 5 distribution.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'../../..');
function file(rel){const out=path.join(root,rel);assert.ok(fs.existsSync(out),'missing '+rel);return out;}
async function run(){
 const executable=process.env.CCP_CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(executable?{executablePath:executable}:{})});
 try{
  for(const width of [375,1280]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.setContent('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><textarea id="editor"></textarea></body></html>');
   const base='upload/admin/view/javascript/';
   for(const css of ['codecart-bs5-preview/bootstrap-5.3.9.min.css','codecart-bs5-preview/fontawesome/css/all.min.css','codecart-bs5-preview/codecart-bs3-compat.css','codecart-bs5-preview/summernote-bs5.min.css']) await page.addStyleTag({path:file(base+css)});
   for(const js of [process.env.CCP_JQUERY_SERIES === '4' ? 'jquery/jquery-4.1.0.min.js' : 'jquery/jquery-3.8.0.min.js',process.env.CCP_JQUERY_SERIES === '4' ? 'jquery/jquery-migrate-4.0.2.min.js' : 'jquery/jquery-migrate-3.6.0.min.js','codecart-bs5-preview/bootstrap-5.3.9.bundle.min.js','codecart-bs5-preview/codecart-bs3-compat.js','codecart-bs5-preview/summernote-bs5.min.js']) await page.addScriptTag({path:file(base+js)});
   const output=await page.evaluate(()=>{
    const $=window.jQuery;
    $('#editor').summernote({height:160,toolbar:[['font',['bold']]],disableResizeEditor:true});
    const initialized=!!$('#editor').data('summernote');
    $('#editor').summernote('code','<p><strong>CodeCart migration</strong></p>');
    const content=$('#editor').summernote('code');
    const hasToolbar=!!document.querySelector('.note-toolbar');
    const hasEditable=!!document.querySelector('.note-editable');
    $('#editor').summernote('destroy');
    const destroyed=!$('#editor').data('summernote');
    return {initialized,hasToolbar,hasEditable,content,destroyed,bs5:window.CodeCartBootstrap5?.active};
   });
   assert.equal(output.initialized,true);
   assert.equal(output.hasToolbar,true);
   assert.equal(output.hasEditable,true);
   assert.ok(output.content.includes('CodeCart migration'));
   assert.equal(output.destroyed,true);
   assert.equal(output.bs5,true);
   assert.deepEqual(errors,[],'JavaScript errors in Summernote');
   console.log('Summernote BS5 smoke passed '+width+'px '+JSON.stringify(output));
   await page.close();
  }
 }finally{await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
