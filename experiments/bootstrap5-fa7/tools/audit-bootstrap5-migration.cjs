'use strict';
// Inventory of remaining legacy Bootstrap dependencies. No files are edited.
// Counts are NOT treated as failures: Bootstrap 3 markup is intentionally supported
// by the project compatibility layer. Direct old script imports need manual review.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const results=[],stats={twig:0,php:0,js:0,css:0,xml:0,legacyDataAttributes:0,bootstrapImports:0};
const allow=new Set([
'upload/admin/view/template/common/header.twig',
'upload/catalog/view/theme/default/template/common/header.twig',
'upload/catalog/view/theme/codecart/template/common/header.twig',
'upload/admin/view/javascript/datetimepicker/codecart-native-datetimepicker.js',
'upload/catalog/view/javascript/datetimepicker/codecart-native-datetimepicker.js',
'upload/catalog/controller/product/product.php'
]);
const skip=/\/(vendor|node_modules|codemirror|summernote|jquery|bootstrap|codecart-bs5-preview|codecart-datepicker-next|font-awesome)\//i;
function walk(dirname){
 for(const ent of fs.readdirSync(dirname,{withFileTypes:true})){
  const abs=path.join(dirname,ent.name),rel=path.relative(root,abs).split(path.sep).join('/');
  if(ent.isDirectory()){if(!skip.test('/'+rel+'/'))walk(abs);continue;}
  if(!ent.isFile())continue;
  const ext=path.extname(ent.name).toLowerCase();
  if(!['.twig','.php','.js','.css','.xml'].includes(ext))continue;
  if(fs.statSync(abs).size>1000000)continue;
  const source=fs.readFileSync(abs,'utf8');
  stats[ext.slice(1)]++;
  const bootstrap=(source.match(/(?:view\/javascript\/bootstrap\/(?:css|js)\/bootstrap(?:\.min)?\.(?:js|css)|view\/stylesheet\/bootstrap\.css|bootstrap(?:-3(?:\.4\.1)?)?\.(?:min\.)?(?:js|css))/gi)||[]).length;
  const dataAttrs=(source.match(/\bdata-(?:toggle|target|dismiss|ride|slide|parent)\s*=/gi)||[]).length;
  if(bootstrap||dataAttrs){
   stats.legacyDataAttributes+=dataAttrs;stats.bootstrapImports+=bootstrap;
   if(bootstrap && !allow.has(rel))results.push({path:rel,hardcodedBootstrap3References:bootstrap,legacyAttrs:dataAttrs});
  }
 }
}
walk(path.join(root,'upload/admin'));
walk(path.join(root,'upload/catalog'));
results.sort((a,b)=>b.hardcodedBootstrap3References-a.hardcodedBootstrap3References||a.path.localeCompare(b.path));
console.log('Legacy Bootstrap inventory: '+JSON.stringify(stats));
console.log('Unapproved literal references (review before merging): '+JSON.stringify(results.slice(0,60)));
if(results.length){process.exitCode=1;}
if(process.env.GITHUB_STEP_SUMMARY){
 fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
  '### Bootstrap 5 legacy compatibility audit\n\n'+
  'Scanned '+Object.entries(stats).filter(([k])=>!k.toLowerCase().includes('attr')&&!k.toLowerCase().includes('import')).map(([k,v])=>k+': '+v).join(', ')+
  '\n\nLegacy data attributes: '+stats.legacyDataAttributes+
  '; literal Bootstrap paths: '+stats.bootstrapImports+
  '\n\nUnapproved source-file references: '+results.length+'\n\n');
}
