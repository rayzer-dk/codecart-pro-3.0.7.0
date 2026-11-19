'use strict';
// Isolated browser smoke, not live-store E2E. Run after npm run build:vendor.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');
const root = path.resolve(__dirname, '../../..');
function fromRepo(p) {const full=path.join(root,p);assert.ok(fs.existsSync(full),'Missing '+full);return full;}
async function run() {
 const executable = process.env.CCP_CHROME_PATH || ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p => fs.existsSync(p));
 const browser = await chromium.launch({headless:true,args:['--no-sandbox'],...(executable ? {executablePath:executable} : {})});
 try {
  for(const width of [375,1280]) {
   const page = await browser.newPage({viewport:{width,height:820}});
   const errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.setContent("<!DOCTYPE html><html lang='uk'><head><meta charset='UTF-8'/></head><body><form id='test'>"+
   "<div class='input-group date' id='date1'><input type='text' data-date-format='YYYY-MM-DD' class='form-control' value='' /><span class='input-group-btn'><button type='button' class='datepickerbutton'>Date</button></span></div>"+
   "<div class='input-group date' id='date2'><input type='text' data-date-format='YYYY-MM-DD' class='form-control' value='2026-11-19'/></div>"+
   "<div class='input-group time' id='time'><input type='text' data-date-format='HH:mm' class='form-control' value='09:30'/></div>"+
   "<div class='input-group datetime' id='datetime'><input type='text' data-date-format='YYYY-MM-DD HH:mm:ss' class='form-control' value='2026-11-19 13:25:40'/></div>"+
   "</form></body></html>");
   const dir='upload/admin/view/javascript/';
   for(const item of [
    process.env.CCP_JQUERY_SERIES === '4' ? 'jquery/jquery-4.1.0.min.js' : 'jquery/jquery-3.8.0.min.js',
    process.env.CCP_JQUERY_SERIES === '4' ? 'jquery/jquery-migrate-4.0.2.min.js' : 'jquery/jquery-migrate-3.6.0.min.js',
    'codecart-datepicker-next/dayjs-with-parse.min.js',
    'codecart-datepicker-next/air-datepicker.js',
    'codecart-datepicker-next/codecart-date-bridge.js'
   ]) await page.addScriptTag({path:fromRepo(dir+item)});
   const result=await page.evaluate(async()=>{
     var $=window.jQuery;var pilot=window.CodeCartDatepickerNext;
     if(!pilot||!pilot.active)return {failure:'Adapter inactive'};
     if(!window.CodeCartDayjs)return {failure:'Day.js global missing'};
     var result={version:pilot.version,dayjs:pilot.dayjsVersion};
     result.initialEmpty=$('#date1 input').val();
     result.initialDate=$('#date2 input').val();
     result.initialTime=$('#time input').val();
     result.initialDateTime=$('#datetime input').val();
     var changes=0;$('#date1 input').on('change',function(){changes++});
     $('#date1').datetimepicker('setDate','2026-02-28');
     result.dateValue=$('#date1 input').val();
     result.dayjsFormatted=$('#date1').datetimepicker('getDate').format('YYYY/MM/DD');
     $('#date1').datetimepicker('setDate','2026-02-30');
     result.invalidRetained=$('#date1 input').val();
     $('#date1').datetimepicker('setDate','');
     result.cleared=$('#date1 input').val();
     result.changeCount=changes;
     $('#time').datetimepicker('setDate','17:45');
     result.timeValue=$('#time input').val();
     $('#datetime').datetimepicker('setDate','2026-11-21 14:17:40');
     result.dateTimeValue=$('#datetime input').val();
     $('#date2').datetimepicker({language:'ru',pickTime:false,minDate:'2026-11-01',maxDate:'2026-11-30'});
     $('#date2').datetimepicker('setDate','2026-12-01');
     result.maxConstraintRetained=$('#date2 input').val();
     $('#date2').datetimepicker('setDate','2026-11-24');
     result.dateInRange=$('#date2 input').val();
     result.russianToday=$('#date2').data('DateTimePicker').picker.locale.today;
     $('#date2').datetimepicker({language:'en'});
     result.englishToday=$('#date2').data('DateTimePicker').picker.locale.today;
     result.ukrainianToday=$('#date1').data('DateTimePicker').picker.locale.today;
     var dyn=document.createElement('div');dyn.id='dynamic';dyn.className='input-group date';dyn.innerHTML='<input type="text" data-date-format="YYYY-MM-DD" class="form-control"/>';
     document.querySelector('#test').appendChild(dyn);
     await new Promise(resolve=>setTimeout(resolve,30));
     $('#dynamic').datetimepicker('setDate','2026-11-25');
     result.dynamic=$('#dynamic input').val();
     $('#date2').datetimepicker('show');
     await new Promise(resolve=>setTimeout(resolve,60));
     result.popupVisible=document.querySelector('.air-datepicker.-active-')!==null;
     $('#date2').datetimepicker('hide');
     $('#date2').datetimepicker('destroy');
     result.destroyed=$('#date2').data('DateTimePicker')===undefined;
     result.report=pilot.report();
     return result;
   });
   assert.equal(result.failure,undefined,JSON.stringify(result));
   assert.equal(result.initialEmpty,'');
   assert.equal(result.initialDate,'2026-11-19');
   assert.equal(result.initialTime,'09:30');
   assert.equal(result.initialDateTime,'2026-11-19 13:25:40');
   assert.equal(result.dateValue,'2026-02-28');
   assert.equal(result.dayjsFormatted,'2026/02/28');
   assert.equal(result.invalidRetained,'2026-02-28');
   assert.equal(result.cleared,'');
   assert.equal(result.timeValue,'17:45');
   assert.equal(result.dateTimeValue,'2026-11-21 14:17:40');
   assert.equal(result.maxConstraintRetained,'2026-11-19');
   assert.equal(result.dateInRange,'2026-11-24');
   assert.equal(result.russianToday,'Сегодня');
   assert.equal(result.englishToday,'Today');
   assert.equal(result.ukrainianToday,'Сьогодні');
   assert.equal(result.dynamic,'2026-11-25');
   assert.ok(result.changeCount>=2,'Events not emitted');
   assert.ok(result.popupVisible,'Calendar popup did not open');
   assert.equal(result.destroyed,true);
   assert.deepEqual(errors,[],'JS errors: '+errors.join('; '));
   console.log('Browser smoke passed at '+width+'px: '+JSON.stringify(result));
   await page.close();
  }
 } finally {await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
