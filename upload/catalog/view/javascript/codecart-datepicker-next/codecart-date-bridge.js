/*
 * CodeCart PRO Air Datepicker 3.6.0 + Day.js 1.11.23
 * Bootstrap 3 DateTimePicker jQuery API bridge, experimental v0.3.0.
 * Isolated opt-in only (?ccp_date=air). MIT.
 */
(function (window, document) {
    'use strict';
    var $ = window.jQuery;
    var Air = window.AirDatepicker;
    var dayjs = window.CodeCartDayjs;
    var log = [];
    var pilot = {version: '0.3.0', active: false, warnings: log, instances: new WeakMap()};
    window.CodeCartDatepickerNext = pilot;
    function warn(message) {
        if (log.indexOf(message) === -1) {
            log.push(message);
            if (window.console && window.console.warn) {
                window.console.warn('[CodeCart DatePicker preview] ' + message);
            }
        }
    }
    if (!$ || !$.fn || !Air || typeof dayjs !== 'function') {
        warn('jQuery, Air Datepicker 3.6.0 and the Day.js parsing bundle are required');
        return;
    }
    pilot.active = true;
    pilot.dayjsVersion = '1.11.23';
    var formatDate = 'YYYY-MM-DD';
    var formatDateTime = 'YYYY-MM-DD HH:mm';
    var formatDateSeconds = 'YYYY-MM-DD HH:mm:ss';
    var formatTime = 'HH:mm';
    var formatTimeSeconds = 'HH:mm:ss';
    var localeData = {
        uk: {days: ['Неділя','Понеділок','Вівторок','Середа','Четвер','П’ятниця','Субота'],daysShort: ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'],daysMin: ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'],months: ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'],monthsShort: ['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру'],today: 'Сьогодні',clear: 'Очистити',firstDay: 1},
        ru: {days: ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'],daysShort: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],daysMin: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],months: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],monthsShort: ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'],today: 'Сегодня',clear: 'Очистить',firstDay: 1},
        en: {days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],daysShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],daysMin: ['Su','Mo','Tu','We','Th','Fr','Sa'],months: ['January','February','March','April','May','June','July','August','September','October','November','December'],monthsShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],today: 'Today',clear: 'Clear',firstDay: 1}
    };
    function language(opts) {
        var value = String((opts && opts.language) || document.documentElement.lang || 'uk').toLowerCase();
        if (value === 'ua' || value.indexOf('uk') === 0) return 'uk';
        if (value.indexOf('ru') === 0) return 'ru';
        return 'en';
    }
    function getInput(node) {
        if (!node) return null;
        if (node.tagName && node.tagName.toLowerCase() === 'input') return node;
        return node.querySelector('input:not([type="hidden"])') || node.querySelector('input');
    }
    function getMode(node, input, opts) {
        if (opts && opts.pickDate === false) return 'time';
        if (opts && opts.pickTime === false) return 'date';
        if (node.classList.contains('datetime')) return 'datetime';
        if (node.classList.contains('time')) return 'time';
        if (node.classList.contains('date')) return 'date';
        var f = String((opts && opts.format) || input.getAttribute('data-date-format') || '');
        var hasTime = /HH|hh|mm|ss/.test(f), hasDate = /YYYY|MM|DD/.test(f);
        return hasDate ? (hasTime ? 'datetime' : 'date') : (hasTime ? 'time' : 'date');
    }
    function parse(raw, mode) {
        if (raw == null || raw === false || raw === '') return null;
        if (raw instanceof Date) {
            var fromDate = dayjs(raw);
            return fromDate.isValid() ? fromDate : null;
        }
        if (raw && typeof raw.toDate === 'function') {
            var fromObject = dayjs(raw.toDate());
            return fromObject.isValid() ? fromObject : null;
        }
        var value = String(raw).trim();
        if (!value || value === '0000-00-00' || value === '0000-00-00 00:00:00') return null;
        var formats = [formatDateSeconds, formatDateTime, formatDate, 'YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DDTHH:mm'];
        if (mode === 'time' || /^\d{1,2}:\d{2}(?::\d{2})?$/.test(value)) {
            if (!/^\d{1,2}:\d{2}(?::\d{2})?$/.test(value)) return null;
            value = '2000-01-01 ' + value;
            formats = [formatDateSeconds, formatDateTime];
        }
        for (var i = 0; i < formats.length; i++) {
            var d = dayjs(value, formats[i], true);
            if (d.isValid()) return d;
        }
        return null;
    }
    function format(value, mode, withSeconds) {
        if (!value || !value.isValid()) return '';
        return value.format(mode === 'date' ? formatDate : (mode === 'time' ? (withSeconds ? formatTimeSeconds : formatTime) : (withSeconds ? formatDateSeconds : formatDateTime)));
    }
    function hasSeconds(input, options) {
        return /ss/.test(String((options && options.format) || input.getAttribute('data-date-format') || '')) || /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(input.value);
    }
    function optionsFor(node, input, opts) {
        var mode = getMode(node, input, opts);
        var seconds = hasSeconds(input, opts);
        var lang = language(opts);
        var minValue = parse(opts.minDate, mode);
        var maxValue = parse(opts.maxDate, mode);
        return {mode:mode, seconds:seconds, language:lang, min:minValue, max:maxValue,
            stepping:Math.max(1, Number(opts.minuteStepping) || 1)};
    }
    var registry = pilot.instances;
    function initialize(node, opts) {
        if (!node) return null;
        opts = opts && typeof opts === 'object' ? opts : {};
        var already = registry.get(node);
        if (already) {
            if (Object.keys(opts).length) already.configure(opts);
            return already.api;
        }
        var input = getInput(node);
        if (!input) return null;
        var settings = optionsFor(node, input, opts), mode = settings.mode;
        var initial = input.value;
        var selected = parse(initial, mode);
        var silent = false;
        var airConfig = {
            locale: Object.assign({}, localeData[settings.language], {dateFormat:'yyyy-MM-dd', timeFormat:'HH:mm'}),
            timepicker: mode !== 'date',
            onlyTimepicker: mode === 'time',
            // Air Datepicker writes to the original input directly. Use canonical
            // CodeCart formatting rather than its default minute-only representation.
            dateFormat: function(date) {return format(dayjs(date), settings.mode, settings.seconds);},
            timeFormat: 'HH:mm',
            dateTimeSeparator: ' ',
            minutesStep: settings.stepping,
            autoClose: mode === 'date',
            firstDay: 1,
            buttons: mode === 'time' ? ['clear'] : ['today','clear'],
            onSelect: function(payload) {
                if (silent) return;
                var nativeDate = payload && payload.date instanceof Date ? payload.date : null;
                var parsed = nativeDate ? dayjs(nativeDate) : null;
                var value = format(parsed, settings.mode, settings.seconds);
                var old = input.value;
                input.value = value;
                if (old !== value) fireChange(parsed);
            }
        };
        if (settings.min) airConfig.minDate = settings.min.toDate();
        if (settings.max) airConfig.maxDate = settings.max.toDate();
        if (selected) airConfig.selectedDates = [selected.toDate()];
        var picker = new Air(input, airConfig);
        // The library must not convert a blank optional form input into a value at init.
        input.value = initial;
        function fireChange(parsed) {
            $(input).trigger('change');
            $(node).trigger({type:'dp.change', date:parsed || null});
        }
        function setDate(value) {
            var parsed = parse(value, settings.mode);
            if (value != null && value !== '' && !parsed) {
                warn('Rejected invalid date/time: ' + String(value));
                return api;
            }
            if (parsed && ((settings.min && parsed.isBefore(settings.min)) || (settings.max && parsed.isAfter(settings.max)))) {
                warn('Date outside allowed min/max range');
                return api;
            }
            var previous = input.value;
            silent = true;
            try {
                if (parsed) picker.selectDate(parsed.toDate(), {silent:true});
                else picker.clear({silent:true});
            } finally {
                silent = false;
            }
            input.value = format(parsed, settings.mode, settings.seconds);
            if (input.value !== previous) fireChange(parsed);
            return api;
        }
        function getDate() { return parse(input.value, settings.mode); }
        function setLimit(which, value) {
            var parsed = parse(value, settings.mode);
            settings[which] = parsed;
            var patch = {};
            patch[which === 'min' ? 'minDate' : 'maxDate'] = parsed ? parsed.toDate() : '';
            picker.update(patch);
            return api;
        }
        function configure(options) {
            if (!options || typeof options !== 'object') return api;
            var newMode = getMode(node, input, options);
            if (newMode !== settings.mode) warn('Cannot change calendar mode after initialization');
            settings.seconds = hasSeconds(input, options);
            var lang = language(options);
            if (lang !== settings.language) {
                settings.language = lang;
                picker.update({locale:Object.assign({}, localeData[lang], {dateFormat:'yyyy-MM-dd', timeFormat:'HH:mm'})});
            }
            if (options.minuteStepping) {
                settings.stepping = Math.max(1, Number(options.minuteStepping) || 1);
                picker.update({minutesStep:settings.stepping});
            }
            if (Object.prototype.hasOwnProperty.call(options,'minDate')) setLimit('min', options.minDate);
            if (Object.prototype.hasOwnProperty.call(options,'maxDate')) setLimit('max', options.maxDate);
            if (Object.prototype.hasOwnProperty.call(options,'defaultDate') && !input.value) setDate(options.defaultDate);
            var supported = {language:1,format:1,pickDate:1,pickTime:1,minuteStepping:1,minDate:1,maxDate:1,defaultDate:1,useMinutes:1,useSeconds:1};
            Object.keys(options).forEach(function(k){if (!supported[k]) warn('Unsupported legacy option: ' + k);});
            return api;
        }
        var api = {
            show: function(){if (!input.disabled) picker.show(); return api;},
            hide: function(){picker.hide(); return api;},
            enable: function(){input.disabled=false; return api;},
            disable: function(){input.disabled=true; picker.hide(); return api;},
            clear: function(){return setDate(null);},
            destroy: function(){picker.destroy();$(node).removeData('DateTimePicker');registry.delete(node);return api;},
            date: function(value){return arguments.length ? setDate(value) : getDate();},
            getDate: getDate,
            setDate: setDate,
            minDate: function(value){return arguments.length ? setLimit('min',value) : settings.min;},
            maxDate: function(value){return arguments.length ? setLimit('max',value) : settings.max;},
            setMinDate: function(value){return setLimit('min',value);},
            setMaxDate: function(value){return setLimit('max',value);},
            options: function(){return {format:settings.mode, language:settings.language, minuteStepping:settings.stepping};},
            input: input,
            picker: picker
        };
        registry.set(node,{api:api, configure:configure});
        $(node).data('DateTimePicker',api);
        var button = node.querySelector && node.querySelector('.datepickerbutton, .input-group-btn button');
        if (button) {
            button.addEventListener('click',function(e){e.preventDefault();api.show();});
        }
        return api;
    }
    pilot.init = initialize;
    pilot.parse = parse;
    pilot.format = format;
    pilot.report = function(){return {active:pilot.active,version:pilot.version,dayjs:pilot.dayjsVersion,warnings:log.slice()};};
    pilot.initAll = function(root){
        root = root || document;
        if (root.nodeType === 1 && root.matches && root.matches('.input-group.date,.input-group.time,.input-group.datetime')) initialize(root,{});
        if (root.querySelectorAll) root.querySelectorAll('.input-group.date,.input-group.time,.input-group.datetime').forEach(function(node){initialize(node,{});});
    };
    var previousPlugin = $.fn.datetimepicker;
    $.fn.datetimepicker = function(option){
        var args = Array.prototype.slice.call(arguments,1), result=this;
        this.each(function(){
            var api = initialize(this,typeof option === 'object' ? option : {});
            if (!api || typeof option !== 'string') return;
            var name = option === 'setMinDate' ? 'minDate' : (option === 'setMaxDate' ? 'maxDate' : option);
            if (typeof api[name] !== 'function') {warn('Unsupported legacy method: ' + option);return;}
            var response = api[name].apply(api,args);
            if (option === 'getDate' || (option === 'date' && args.length === 0)) result = response;
        });
        return result;
    };
    $.fn.datetimepicker.defaults={pickDate:true,pickTime:true,minuteStepping:1,language:'uk',format:'YYYY-MM-DD'};
    $.fn.datetimepicker.noConflict=function(){$.fn.datetimepicker=previousPlugin;return this;};
    function start(){
        pilot.initAll(document);
        if (window.MutationObserver) {
            var observer = new MutationObserver(function(records){
                records.forEach(function(record){
                    record.addedNodes.forEach(function(node){if(node.nodeType===1)pilot.initAll(node);});
                });
            });
            observer.observe(document.documentElement,{childList:true,subtree:true});
            pilot.stop=function(){observer.disconnect();};
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start);
    else start();
})(window,document);
