/*
 * CodeCart PRO Bootstrap 3 -> 5 compatibility v1.0.0.
 * Bootstrap 5.3.9 (vendor) / OpenCart 3.x legacy markup and jQuery API.
 * MIT, experimental branch. No Bootstrap 3 scripts loaded alongside this layer.
 */
(function (win, doc) {
    'use strict';
    var bootstrap = win.bootstrap, $ = win.jQuery;
    var warnings = [], conversions = 0;
    var api = {version: '1.0.0', active: false, warnings: warnings};
    win.CodeCartBootstrapPreview = api;
    win.CodeCartBootstrap5 = api;
    if (!bootstrap || !bootstrap.Modal || !$ || !$.fn) {
        if (win.console) win.console.error('[CodeCart BS5] Bootstrap 5 bundle and jQuery are required');
        return;
    }
    api.active = true;
    doc.documentElement.classList.add('ccp-bs5-preview');
    doc.documentElement.setAttribute('data-codecart-bootstrap', '5.3.9');
    var mapping = {
        'data-target': 'data-bs-target', 'data-dismiss': 'data-bs-dismiss',
        'data-parent': 'data-bs-parent', 'data-placement': 'data-bs-placement',
        'data-container': 'data-bs-container', 'data-trigger': 'data-bs-trigger',
        'data-html': 'data-bs-html', 'data-delay': 'data-bs-delay',
        'data-animation': 'data-bs-animation',
        'data-ride': 'data-bs-ride', 'data-slide': 'data-bs-slide',
        'data-slide-to': 'data-bs-slide-to',
        'data-interval': 'data-bs-interval', 'data-pause': 'data-bs-pause',
        'data-wrap': 'data-bs-wrap'
    };
    var names = {
        modal: bootstrap.Modal, collapse: bootstrap.Collapse,
        dropdown: bootstrap.Dropdown, tab: bootstrap.Tab,
        tooltip: bootstrap.Tooltip, popover: bootstrap.Popover,
        carousel: bootstrap.Carousel, alert: bootstrap.Alert
    };
    function warn(msg) {
        if (warnings.indexOf(msg) < 0) {
            warnings.push(msg);
            if (win.console && win.console.warn) win.console.warn('[CodeCart BS5] ' + msg);
        }
    }
    var selector = '[data-toggle],[data-dismiss],[data-target],[data-parent],[data-placement],[data-container],[data-trigger],[data-html],[data-delay],[data-animation],[data-ride],[data-slide],[data-slide-to],[data-interval],[data-original-title],[data-bs-toggle],.dropdown-menu>li>a,.pagination>li>a,.pagination>li>span,.nav-tabs>li>a,.nav-pills>li>a,.tab-pane.fade.in,.collapse.in,.modal.in,.carousel-inner>.item,.carousel-control,.carousel-indicators>li,.nav-tabs>li.active>a,.nav-pills>li.active>a';
    function convert(el) {
        if (!el || !el.getAttribute || !el.matches) return;
        var name = el.getAttribute('data-toggle');
        if (name === 'pill') name = 'tab';
        if (name && names[name] && !el.hasAttribute('data-bs-toggle')) {
            el.setAttribute('data-bs-toggle', name); conversions++;
        }
        Object.keys(mapping).forEach(function(k) {
            var value=el.getAttribute(k);
            if (value !== null && !el.hasAttribute(mapping[k])) {
                el.setAttribute(mapping[k],value); conversions++;
            }
        });
        if (el.hasAttribute('data-original-title') && !el.hasAttribute('title')) {
            el.setAttribute('title',el.getAttribute('data-original-title'));
        }
        // OpenCart already renders its own caret icon; BS5 otherwise adds a second arrow.
        if (el.matches('.dropdown-toggle') &&
            el.querySelector('.caret,.fa-caret-down,.fa-chevron-down,.fa-angle-down,.ccp-blog-menu-caret')) {
            el.classList.add('ccp-explicit-caret');
        }
        if (el.matches('.dropdown-menu>li>a')) el.classList.add('dropdown-item');
        if (el.matches('.pagination>li>a,.pagination>li>span')) el.classList.add('page-link');
        if (el.matches('.nav-tabs>li>a,.nav-pills>li>a')) {
            el.classList.add('nav-link');
            if (el.parentElement && el.parentElement.classList.contains('active')) el.classList.add('active');
        }
        if (el.matches('.tab-pane.fade.in.active')) el.classList.add('show');
        if (el.matches('.collapse.in')) {
            el.classList.add('show'); el.classList.remove('in');
        }
        if (el.matches('.modal.in')) {
            el.classList.add('show'); el.classList.remove('in');
        }
        if (el.matches('.carousel-inner>.item')) el.classList.add('carousel-item');
        if (el.matches('.carousel-control')) {
            var direction=el.classList.contains('right') ? 'next' : 'prev';
            el.classList.add('carousel-control-'+direction);
            if (!el.hasAttribute('data-bs-slide')) el.setAttribute('data-bs-slide',direction);
        }
        if (el.matches('.carousel-indicators>li')) {
            if (!el.hasAttribute('data-bs-target')) {
                var car=el.closest('.carousel');
                if (car && car.id) el.setAttribute('data-bs-target','#'+car.id);
            }
        }
        if (el.matches('[data-bs-toggle="modal"],[data-bs-toggle="collapse"],[data-bs-toggle="dropdown"],[data-bs-toggle="tab"]')) {
            var target=el.getAttribute('data-bs-target');
            if (!target) {
                var href=el.getAttribute('href');
                if (href && href.charAt(0)==='#' && href.length>1 && el.getAttribute('data-bs-toggle')!=='dropdown') {
                    el.setAttribute('data-bs-target',href);
                }
            }
        }
    }
    function scan(root) {
        if (!root) return;
        if (root.nodeType===1 && root.matches && root.matches(selector)) convert(root);
        if (root.querySelectorAll) root.querySelectorAll(selector).forEach(convert);
    }
    function current(C,el) { return C && C.getInstance ? C.getInstance(el) : null; }
    function jqueryInstance(name,el,inst) {
        if (name === 'popover' || name === 'tooltip' || name === 'modal') $(el).data('bs.'+name,inst);
    }
    function jqueryClear(name,el) {
        if (name === 'popover' || name === 'tooltip' || name === 'modal') $(el).removeData('bs.'+name);
    }
    function operate(name,el,arg) {
        var C=names[name]; if (!C) return;
        var method=typeof arg === 'string' ? arg : null;
        if (method==='destroy') method='dispose';
        var instance=current(C,el);
        if (method==='dispose') {
            if (instance) instance.dispose();
            jqueryClear(name,el);
            return;
        }
        var options=arg && typeof arg==='object' ? Object.assign({},arg) : {};
        if (name==='modal') delete options.show;
        if (name==='collapse') delete options.toggle;
        if (options.container && options.container.jquery) options.container=options.container[0];
        if (options.placement==='auto right' || options.placement==='auto left') options.placement='auto';
        if (!instance) instance=C.getOrCreateInstance(el,options);
        jqueryInstance(name,el,instance);
        if (method) {
            if (typeof instance[method] === 'function') instance[method]();
            else warn('Unsupported Bootstrap 3 '+name+'.'+method+'()');
        } else if (name==='carousel' && typeof arg==='number') {
            instance.to(arg);
        } else if (name==='modal' && (!arg || typeof arg!=='object' || arg.show!==false)) {
            instance.show();
        } else if (name==='collapse' && (!arg || typeof arg!=='object' || arg.toggle!==false)) {
            instance.toggle();
        } else if (name==='tab' && !arg) {
            // Bootstrap 3's $(link).tab() initializes the plugin without activating.
            // Activation must only occur on an explicit "show" or a native data-bs click.
        }
    }
    function installJqueryBridge() {
        Object.keys(names).forEach(function(name) {
            var C=names[name]; if (!C) return;
            var previous=$.fn[name];
            var fn=function(arg) {
                return this.each(function(){operate(name,this,arg);});
            };
            fn.Constructor=C;
            fn.noConflict=function(){$.fn[name]=previous;return fn;};
            fn.ccpBootstrap3Compat='1.0.0';
            $.fn[name]=fn;
        });
        var previousButton=$.fn.button;
        var button=function(command) {
            return this.each(function(){
                var el=$(this);
                if (command === 'loading') {
                    if (el.data('ccpOriginalHtml')===undefined) el.data('ccpOriginalHtml',el.html());
                    var loading=el.attr('data-loading-text') || el.data('loadingText') || 'Loading...';
                    el.text(loading).prop('disabled',true).addClass('disabled');
                } else if (command === 'reset') {
                    if (el.data('ccpOriginalHtml')!==undefined) el.html(el.data('ccpOriginalHtml'));
                    el.removeData('ccpOriginalHtml').prop('disabled',false).removeClass('disabled');
                } else if (command === 'toggle') {
                    var active=this.classList.toggle('active');
                    this.setAttribute('aria-pressed',active?'true':'false');
                    if (el.is('input[type="checkbox"]')) el.prop('checked',active);
                } else if (command && command !== 'init') warn('Unsupported Bootstrap 3 button method '+command);
            });
        };
        button.ccpBootstrap3Compat='1.0.0';
        button.noConflict=function(){$.fn.button=previousButton;return button;};
        $.fn.button=button;
    }
    api.installJqueryBridge=installJqueryBridge;
    api.scan=scan;
    api.getInstance=function(name,el){return names[name] && current(names[name],el);};
    api.report=function(){
        return {version:api.version,active:api.active,convertedAttributes:conversions,warnings:warnings.slice(),
            jqueryBridgeInstalled:!!($.fn.modal && $.fn.modal.ccpBootstrap3Compat),
            bootstrapVersion:'5.3.9'};
    };
    installJqueryBridge();
    doc.addEventListener('shown.bs.tab',function(event){
        var link=event.target;
        if (!link || !link.closest) return;
        var nav=link.closest('.nav-tabs,.nav-pills');
        if (!nav) return;
        nav.querySelectorAll('li.active').forEach(function(el){el.classList.remove('active');});
        nav.querySelectorAll('li>a.active').forEach(function(el){if(el!==link)el.classList.remove('active');});
        if (link.parentElement && link.parentElement.tagName==='LI') link.parentElement.classList.add('active');
    });
    doc.addEventListener('hide.bs.collapse',function(event){
        if(event.target && event.target.classList)event.target.classList.remove('in');
    });
    doc.addEventListener('hidden.bs.modal',function(event){
        if(event.target && event.target.classList)event.target.classList.remove('in');
    });
    doc.addEventListener('change',function(event){
        var input=event.target;
        if (!input || !input.matches || !input.matches('input[type="radio"],input[type="checkbox"]')) return;
        var parent=input.closest('[data-toggle="buttons"]'); if(!parent)return;
        parent.querySelectorAll('label.btn').forEach(function(label){
            var target=label.querySelector('input[type="radio"],input[type="checkbox"]');
            if(target)label.classList.toggle('active',target.checked);
        });
    });
    var observer;
    function start() {
        scan(doc);
        // Bootstrap 5 itself registers optional jQuery plugins on DOMContentLoaded;
        // install after its own hook to retain the legacy aliases.
        installJqueryBridge();
        if (win.MutationObserver && !observer) {
            observer=new MutationObserver(function(changes){
                changes.forEach(function(change){
                    change.addedNodes.forEach(function(node){if(node.nodeType===1)scan(node);});
                });
            });
            observer.observe(doc.documentElement,{childList:true,subtree:true});
        }
    }
    if (doc.readyState==='loading') doc.addEventListener('DOMContentLoaded',start);
    else start();
    api.stop=function(){if(observer)observer.disconnect();};
})(window,document);
