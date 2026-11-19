'use strict';
// Run only within experiments/bootstrap5-fa7 after "npm install".
// Builds isolated artifacts; does NOT rewrite active CodeCart templates.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const local=path.resolve(__dirname,'..');
const req=(p)=>{const v=path.join(local,'node_modules',p);if(!fs.existsSync(v))throw Error('Missing npm vendor '+p);return v;};
function copy(s,d){fs.mkdirSync(path.dirname(d),{recursive:true});fs.copyFileSync(s,d);console.log(d);}
const esbuild=require(path.join(local,'node_modules','esbuild'));
for(const place of ['admin','catalog']){
  const dst=path.join(root,'upload',place,'view','javascript','codecart-datepicker-next');
  const dayjsEntry=[
    "import dayjs from 'dayjs';",
    "import customParseFormat from 'dayjs/plugin/customParseFormat';",
    "dayjs.extend(customParseFormat);",
    "window.CodeCartDayjs = dayjs;"
  ].join('\n');
  esbuild.buildSync({
    stdin:{contents:dayjsEntry,resolveDir:local,sourcefile:'ccp-dayjs.js',loader:'js'},
    bundle:true,format:'iife',minify:true,target:'es2020',
    outfile:path.join(dst,'dayjs-with-parse.min.js')
  });
}
const summernoteRoot=path.join(root,'upload','admin','view','javascript','codecart-bs5-preview');
for(const name of ['summernote-bs5.min.js','summernote-bs5.min.css']){
  copy(req('summernote/dist/'+name),path.join(summernoteRoot,name));
}
for (const name of ['summernote.eot','summernote.ttf','summernote.woff','summernote.woff2']) {
  const font=path.join(root,'upload/admin/view/javascript/summernote/font',name);
  if(fs.existsSync(font))copy(font,path.join(summernoteRoot,'font',name));
}
const isolated=path.join(local,'generated');
for(const name of ['jquery.min.js']){
  copy(req('jquery/dist/'+name),path.join(isolated,'jquery-4.1.0.min.js'));
}
copy(req('jquery-migrate/dist/jquery-migrate.min.js'),path.join(isolated,'jquery-migrate-4.0.2.min.js'));

const source=[
'import {EditorState} from "@codemirror/state";',
'import {EditorView,lineNumbers,highlightActiveLine,highlightActiveLineGutter,keymap,drawSelection} from "@codemirror/view";',
'import {xml} from "@codemirror/lang-xml";',
'(function(){',
'function mount(textarea,options){',
' if(!textarea||textarea.tagName!=="TEXTAREA")throw Error("CodeCartCM6: textarea required");',
' if(textarea._codecartCM6)return textarea._codecartCM6;',
' options=options||{};',
' var wrapper=document.createElement("div");wrapper.className="CodeMirror ccp-cm6-wrapper";',
' textarea.parentNode.insertBefore(wrapper,textarea.nextSibling);',
' var initial=textarea.value;textarea.style.display="none";',
' var state=EditorState.create({doc:initial,extensions:[lineNumbers(),highlightActiveLineGutter(),highlightActiveLine(),drawSelection(),xml(),',
' EditorView.updateListener.of(function(u){if(u.docChanged){textarea.value=u.state.doc.toString();textarea.dispatchEvent(new Event("input",{bubbles:true}));}})]});',
' var view=new EditorView({state:state,parent:wrapper});',
' if(options.height){wrapper.style.height=options.height;}',
' function emitValue(value){view.dispatch({changes:{from:0,to:view.state.doc.length,insert:String(value)}});}',
' var api={',
' getValue:function(){return view.state.doc.toString();},',
' setValue:function(v){emitValue(v);return api;},',
' getWrapperElement:function(){return wrapper;},',
' getTextArea:function(){return textarea;},',
' save:function(){textarea.value=api.getValue();return api;},',
' setSize:function(width,height){if(width!=null)wrapper.style.width=typeof width==="number"?width+"px":String(width);if(height!=null)wrapper.style.height=typeof height==="number"?height+"px":String(height);return api;},',
' refresh:function(){view.requestMeasure();return api;},',
' focus:function(){view.focus();return api;},',
' on:function(type,fn){if(type!=="change")return api;textarea.addEventListener("input",function(){fn(api);});return api;},',
' toTextArea:function(){api.save();view.destroy();wrapper.remove();textarea.style.display="";delete textarea._codecartCM6;},',
' view:view',
' };',
' wrapper.CodeMirror=api;textarea._codecartCM6=api;',
' if(options.autofocus)view.focus();',
' return api;',
'}',
'window.CodeCartCM6={version:"6",create:mount,fromTextArea:mount};',
'})();'
].join('\n');
esbuild.buildSync({stdin:{contents:source,resolveDir:local,sourcefile:'codecart-cm6-editor.js',loader:'js'},bundle:true,format:'iife',minify:true,target:'es2020',outfile:path.join(isolated,'codemirror6-pilot.min.js')});
copy(path.join(isolated,'codemirror6-pilot.min.js'),path.join(root,'upload/admin/view/javascript/codecart-modern/codemirror6-editor.min.js'));
const flotRoot=req('flot/dist/es5');
const flotTarget=path.join(root,'upload/admin/view/javascript/codecart-modern/flot-4.2.6');
let copied=0;
for(const file of fs.readdirSync(flotRoot)){if(file.endsWith('.js')){copy(path.join(flotRoot,file),path.join(flotTarget,file));copied++;}}
if(copied<1)throw Error('Flot 4.2.6 distribution missing');
const flotBundle=path.join(flotTarget,'jquery.flot.js');
const legacyFlot=path.join(root,'upload/admin/view/javascript/jquery/flot');
copy(flotBundle,path.join(legacyFlot,'jquery.flot.js'));
esbuild.buildSync({entryPoints:[flotBundle],outfile:path.join(legacyFlot,'jquery.flot.min.js'),bundle:false,minify:true,target:'es2018'});
for(const place of ['admin','catalog']) {
 const base=path.join(root,'upload',place,'view','javascript','jquery');
 copy(req('jquery/dist/jquery.min.js'),path.join(base,'jquery-4.1.0.min.js'));
 copy(req('jquery-migrate/dist/jquery-migrate.min.js'),path.join(base,'jquery-migrate-4.0.2.min.js'));
}
console.log('Generated modern UI pilot bundles; original compatibility versions retained.');
