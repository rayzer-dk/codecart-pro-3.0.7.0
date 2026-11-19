'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
function read(s){return fs.readFileSync(path.join(root,s),'utf8');}
function exists(s){assert.ok(fs.existsSync(path.join(root,s)),'Missing '+s);}
const admin='upload/admin/view/template/common/header.twig';
const stores=['upload/catalog/view/theme/default/template/common/header.twig','upload/catalog/view/theme/codecart/template/common/header.twig'];
function hasContentScope(template,cls){const match=template.match(/<div\s+id="content"\s+class="([^"]*)">/);return !!match&&match[1].split(/\s+/).includes(cls);}
for(const file of [admin,...stores]){const value=read(file);assert.match(value,/jquery-3\.8\.0\.min\.js/);assert.match(value,/jquery-migrate-3\.6\.0\.min\.js/);assert.match(value,/codecart_preview_bs5/);}
for(const file of stores) assert.match(read(file),/codecart_preview_date/);
assert.match(read(admin),/codecart-native-datetimepicker\.js/);
for(const area of ['admin','catalog']){
const p='upload/'+area+'/view/javascript/';
for(const s of ['jquery/jquery-3.8.0.min.js','jquery/jquery-migrate-3.6.0.min.js','codecart-datepicker-next/air-datepicker.js','codecart-datepicker-next/air-datepicker.css','codecart-bs5-preview/bootstrap-5.3.9.min.css','codecart-bs5-preview/bootstrap-5.3.9.bundle.min.js','codecart-bs5-preview/fontawesome/css/all.min.css','codecart-bs5-preview/fontawesome/css/v4-shims.min.css'])exists(p+s);
for(const file of ['codecart-datepicker-next/codecart-date-bridge.js','codecart-bs5-preview/codecart-bs3-compat.js'])new vm.Script(read(p+file),{filename:file});
const dateBundle=p+'codecart-datepicker-next/dayjs-with-parse.min.js';
exists(dateBundle);
assert.match(read(dateBundle),/CodeCartDayjs/);
assert.match(read(p+'jquery/jquery-3.8.0.min.js'),/jQuery v3\.8\.0/);
assert.match(read(p+'jquery/jquery-migrate-3.6.0.min.js'),/jQuery Migrate v3\.6\.0/);
}
assert.match(read('composer.json'),/">=8\.2 <8\.6"/);
for (const page of ['upload/index.php','upload/admin/index.php','upload/install/index.php']) {
 assert.match(read(page), /define\('VERSION', '3\.0\.7\.0'\)/);
 assert.match(read(page), /define\('CODECART_BUILD', '3\.0\.7\.0'\)/);
}
assert.match(read('upload/system/startup.php'), /PHP 8\.2\+ Required/);
for (const file of [admin,...stores]) {
 const source=read(file);
 assert.match(source, /jquery-4\.1\.0\.min\.js/);
 assert.match(source, /jquery-migrate-4\.0\.2\.min\.js/);
 assert.ok(source.indexOf('jquery-4.1.0.min.js') < source.indexOf('jquery-migrate-4.0.2.min.js'), 'Migrate must load after jQuery: '+file);
}
const uiFiles=[
 'upload/admin/view/stylesheet/codecart-ui-370.css',
 'upload/catalog/view/javascript/codecart-bs5-preview/codecart-ui-370.css'
];
for(const file of uiFiles) {
 exists(file);
 const css=read(file);
 assert.match(css,/html\.ccp-bs5-preview/);
 assert.match(css,/--ccp-ui-radius/);
 assert.match(css,/@media \(max-width: 767\.98px\)/);
 assert.ok(!/!important/g.test(css), 'UI foundation must not force overrides: '+file);
}
for(const file of [admin,...stores]){
 const header=read(file);
 const reference=file===admin?'view/stylesheet/codecart-ui-370.css':'catalog/view/javascript/codecart-bs5-preview/codecart-ui-370.css';
 assert.ok(header.includes('{% if codecart_preview_bs5 %}<link href="'+reference), 'Missing guarded UI stylesheet: '+file);
}
const adminViews = [
 ['upload/admin/view/template/catalog/product_form.twig','ccp-ui-product-form'],
 ['upload/admin/view/template/catalog/product_list.twig','ccp-ui-product-list'],
 ['upload/admin/view/template/sale/order_list.twig','ccp-ui-order-list']
];
for (const [file, scope] of adminViews) {
 assert.ok(hasContentScope(read(file),scope), 'Missing UI class on '+file);
}
const adminCSS=read('upload/admin/view/stylesheet/codecart-ui-370.css');
for(const className of ['ccp-ui-product-form','ccp-ui-product-list','ccp-ui-order-list']){
 assert.ok(adminCSS.includes(className),'Missing scoped CSS '+className);
}
for (const [file, scope] of [
 ['upload/admin/view/template/setting/setting.twig','ccp-ui-settings'],
 ['upload/admin/view/template/sale/order_info.twig','ccp-ui-order-info']
]) {
 assert.ok(hasContentScope(read(file),scope), 'Missing UI scope: '+file);
 assert.ok(adminCSS.includes(scope),'Missing UI rules for '+scope);
}
// Batch 3: assert all reviewed admin and CodeCart storefront templates have scoped, BS5-only UI hooks.
for (const [file, cls] of [
 ['catalog/category_form.twig','ccp-ui-category-form'],
 ['catalog/category_list.twig','ccp-ui-category-list'],
 ['catalog/manufacturer_form.twig','ccp-ui-manufacturer-form'],
 ['customer/customer_list.twig','ccp-ui-customer-list'],
 ['marketing/coupon_list.twig','ccp-ui-coupon-list']
]) {
 const path='upload/admin/view/template/'+file;
 assert.ok(hasContentScope(read(path),cls), 'Missing admin scope: '+path);
 assert.ok(adminCSS.includes('.'+cls), 'Missing admin styles: '+cls);
}
const storeCSS=read('upload/catalog/view/javascript/codecart-bs5-preview/codecart-ui-370.css');
for(const [file,cls] of [
 ['product/product.twig','ccp-ui-product'],
 ['product/category.twig','ccp-ui-category'],
 ['checkout/cart.twig','ccp-ui-cart'],
 ['checkout/checkout.twig','ccp-ui-checkout'],
 ['account/login.twig','ccp-ui-login']
]){
 const path='upload/catalog/view/theme/codecart/template/'+file;
 const template=read(path);
 assert.ok(template.includes(cls), 'Missing CodeCart storefront scope: '+path);
}
for (const id of ['#product-product','#product-category','#checkout-cart','#checkout-checkout','#account-login']){
 assert.ok(storeCSS.includes(id),'Missing storefront CSS target '+id);
}
exists('upload/admin/view/javascript/codecart-ui-370.js');
new vm.Script(read('upload/admin/view/javascript/codecart-ui-370.js'));
assert.ok(read(admin).includes('view/javascript/codecart-ui-370.js?v=3.0.7.0'), 'Admin UI script not loaded');
// Bootstrap 5 requires its own color-mode attribute, not just CodeCart dark classes.
exists('upload/catalog/view/javascript/codecart-bs5-preview/codecart-theme-370.js');
new vm.Script(read('upload/catalog/view/javascript/codecart-bs5-preview/codecart-theme-370.js'));
for (const file of stores) {
 const header=read(file);
 assert.ok(header.includes('codecart-theme-370.js?v=3.0.7.0'), 'Missing storefront theme bridge: '+file);
 assert.ok(header.includes("setAttribute('data-bs-theme'"), 'Missing early color-mode bootstrap: '+file);
}
assert.ok(read(admin).includes("setAttribute('data-bs-theme'"), 'Missing early admin BS5 color mode');
assert.ok(read('upload/admin/view/javascript/codecart-admin-ui.js').includes("setAttribute('data-bs-theme'"), 'Missing live admin BS5 color mode');
// Sidebar collapse labels must match targets at all three nested levels.
const sidebar=read('upload/admin/view/template/common/column_left.twig');
for(const id of ['collapse{{ i }}','collapse{{ i }}-{{ j }}','collapse-{{ i }}-{{ j }}-{{ k }}']){
 assert.ok(sidebar.includes('aria-controls="'+id+'" aria-expanded="false"'), 'Unlabeled nested sidebar collapse: '+id);
}
const compatAdmin=read('upload/admin/view/javascript/codecart-bs5-preview/codecart-bs3-compat.js');
const compatStore=read('upload/catalog/view/javascript/codecart-bs5-preview/codecart-bs3-compat.js');
assert.equal(compatAdmin,compatStore,'Bootstrap 5 legacy adapters diverged between admin and catalog');
assert.match(compatAdmin,/data-bs-toggle/);
assert.match(read('package.json'),/"@playwright\/test": "1\.65\.1"/);
assert.match(read('upload/catalog/controller/product/product.php'),/ccp_date/);
console.log('CodeCart modernization preview: static assets and JavaScript syntax OK');
