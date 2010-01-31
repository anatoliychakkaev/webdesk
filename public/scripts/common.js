/*
	Title: common
	Функции и структуры, используемые везде
*/

/*
	Structure: globals
	Описание глобальных переменных
*/
var _globals = {/* {{{ */
	/*
		Variable: pathToOk
		Путь к dataset-ресурсам
	*/
	pathToOk: '_datasources/',
	pathToCore: '_core/',
	pictScriptPath: 'http://isu.tisbi.ru/pict/?PID=',
	pathToTranslator: '_core/translate.php',
	imageBase: '_images/silk/{img}.png',
	imageBaseCommon: '_images/{img}',
	caption: 'ИСУ ВУЗ',
	/*
		Variable: modules
		Классы модулей
	*/
	modules: {},
	/*
		Variable: instances
		Экземпляры модулей
	*/
	instances: [],
	/* 
		Variable: accessedActions
		Права доступа
	*/
	accessedActions:[],
	/*
		Variable: data
		Сохраняемые данные роли
	*/
	data: {},
	ajaxCallbackAwaiting: [],
	useExtendedErrors: true // показывать расширенные сообщения об ошибках
	/* }}} */
}

var globals = $.extend({},_globals);

String.prototype.set = function(name,value,modifiers){
	var r = RegExp("\{"+name+"\}",modifiers || "ig");
	return this.replace(r,value);
}

String.prototype.toDate = function(){
    return new Date(this.replace(/-/g,'/'));
}

/*
	Structure: ajaxStat
	История ajax-запросов
*/
var ajaxStat = {/* {{{ */
	/*	Variable: len
		Длина принятого текста в символах	*/
	len: 0,
	/*	Variable: count
		Всего запросов	*/
	count: 0,
	/*	Variable: inWait
		Запросов в очереди	*/
	inWait: 0,
	/*	Variable: history
		История	*/
	history: []
	/* }}} */
}


/*
	Section: Functions
*/
	
/*
	Function: cm_on
	Вызывает навигатор по объектному пространству
	
	Parameters:
	p - Объект
	
	Returns:
	void
	
	See Also:
    <call_module>
*/
function cm_on(p){/* {{{ */
	cm('mod_object_navigator',p);
	/* }}} */
}

function cm_img(img,alt,style){/* {{{ */
	if(alt)alt=alt.replace(/"/,'\"');
	return '<img src="'+globals.imageBase.set('img',img)+
	'" width="16" height="16" alt="'+(alt?alt:'img')+'" '+
	(alt?'title="'+alt+'"':'')+
	(style?' style="'+style+'"':'')+' />';
	/* }}} */
}

function cm_help_caller(keyword,text){
	return '<span class="likealink" onclick="cm(\'help\',\''+keyword+'\');">'+(text||keyword)+'</span>';
}

/* 
	Function cm_calc
	Вычисляет второй параметр в контексте первого параметра,
	используя третий параметр в качестве списка аргументов 
	в случае если второй параметр будет функцией в контексте первого
	
	Parameters:
	context - Контекст выполнения
	name - Название члена контекста
	args - массив параметров для вычисления члена-функции
*/
function cm_calc(context,name,args){
    if(typeof context[name]=='function'){
		if(!args)args=[];
		try{
			return context[name].apply(context,args);
		}catch(e){
			alert('Error in calc '+name);
			console.log(context,e);
		}
	}else{
		return context[name];
	}
}
/*
	Function: cm_format_date
		Форматирует дату
		
	Parameters:
		str - дата в виде строки, формат: YYYY-MM-DD hh:mm:ss
		
	Returns:
		void
*/
function cm_format_date(str){/* {{{ */
	var y = parseInt(str.substr(0,4));
	var m = parseInt(str.substr(5,2))-1;
	var d = parseInt(str.substr(8,2));
	var time = str.substr(11,5);
	var mn = Date.abbrMonthNames;
	return d+' '+mn[m]+' '+y+' в '+time;
	/* }}} */
}

/*
	Function: cm_get
		Посылает get-запрос серверу
		
	Parameters:
		url - *обязательный параметр*, 
		params - список параметров запроса
		callback - функция обратного вызова
		
	Returns:
		void
		
	See Also:
	    <cm_get_json>
*/
function cm_get(url,params,callback){/* {{{ */
	if(url.search(/^[^\\\/]*(?=\.php)/)==0){
		url = globals.pathToOk+url;
	}
	var entry = {
		url: url,
		params: (typeof params == 'function'?null:params),
		id: ajaxStat.history.length
	};
	ajaxStat.history.push(entry);
	$.get(url,params,function(x){
		entry.response = x;
		if(typeof callback == 'function') callback(x);
		else if(typeof params == 'function') params(x);
	});
	/* }}} */
}

/*
	Function: cm_get_json
		Посылает get-запрос серверу, ожидая ответ в формате json.
		Одинаковые запросы группируются, реально запрос выполняется один раз 
		(в каждый момент времени).
		
	Parameters:
		url - *обязательный параметр*, 
		params - список параметров запроса
		callback - функция обратного вызова
		
	Returns:
		void
		
	Example:
	
	(code)
	cm_get_json(
		'virtualroom.php?q=GetTesting',
		{
			TestingID:id
		},
		function(test_object){
			
		}
	);
	(end)
	See Also:
	    <cm_get>
*/

function cm_get_json(url,params,callback){cm_ajax_json('get',url,params,callback);}

function cm_post_json(url,params,callback){cm_ajax_json('post',url,params,callback);}

function cm_ajax_json(type,url,params,callback){/* {{{ */
	if(typeof type=='undefined')type='post';
	/* var entry = {
		url: url,
		params: typeof params == 'function'?null:params,
		id: ajaxStat.history.length
	};
	if(typeof params == 'function'){
		callback=params;
		params = {};
	}
	ajaxStat.history.push(entry);
	$.get(url,params,function(x){
		entry.response = x;
		try{
			x = $.parseJSON(x);
		}catch(e){
			alert('JSON Parsing @ cm_get_js('+url+'): '+e.message);
			return false;
		}
		try{
			if(typeof callback == 'function'){
				callback(x);
			}
		}catch(e){
			alert(e);
		}
	});
	
	return; */
	
	if(url.search(/^[^\\\/]*(?=\.php)/)==0){
		url = globals.pathToOk+url;
	}
	
	var in_wait = false;
	var pp = typeof params == 'function'?'':$.param(params);
	for(var i in globals.ajaxCallbackAwaiting){
		if(globals.ajaxCallbackAwaiting[i].url==url && globals.ajaxCallbackAwaiting[i].pp==pp){
			in_wait = true;
			var waitor = globals.ajaxCallbackAwaiting[i];
			break;
		}
	}
	if(in_wait){
		waitor.cb.push(typeof params == 'function'?params:callback);
	}else{
		var waitor = {
			url: url,
			pp: pp,
			cb: [typeof params == 'function'?params:callback]
		}
		globals.ajaxCallbackAwaiting.push(waitor);
	}
	if(waitor.cb.length==1){
		var entry = {
			url: url,
			params: typeof params == 'function'?null:params,
			id: ajaxStat.history.length
		};
		if(typeof params == 'function'){
			callback=params;
			params = {};
		}
		ajaxStat.history.push(entry);
		var fff = function(x){
			entry.response = x;
			try{
				x = $.parseJSON(x);
			}catch(e){
				alert('JSON Parsing @ cm_get_js('+url+'): '+e.message);
				return false;
			}
			try{
				var c;
				while(waitor.cb.length>0){
					c = waitor.cb.pop();
					if(typeof c == 'function'){
						//c($.extend({},x));
						c(x);
					}
				}
				delete waitor;
			}catch(e){
				alert('Error in callback after requesting url '+url+'\nMessage: '+$.toJSON(e));
			}
		}
		if(type == 'post')
			$.post(url,params,fff);
		else
			$.get(url,params,fff);
	}
	/* }}} */
}

/*
	Function: ie_select_locate
		Выбирает в элементе select опцию, с совпадающим значением 
		(пока работает только для целого числа)
	
	Parameters:
		select	- *obj* HTMLSelectElement
		value	- *int* ключ поиска
*/
function ie_select_locate(select,value){/* {{{ */
	var options = select.options;
	for(var i=0;i<options.length;i++){
		if(parseInt(options[i].value)==value){
			select.selectedIndex = i;
			return true;
		}
	}
	return false;
	/* }}} */
}

/*
	Function: cm_in_array
		Функция поиска в массиве
		
	Parameters:
		arr	- *array* массив
		subj	- *any* ключ поиска
		
	Returns:
		false	- если ничего не найдено или первым параметром передан не массив
		true	- если элемент присутствует в массиве
*/
function cm_in_array(arr,subj){/* {{{ */
	if(typeof arr == 'array' || typeof arr == 'object'){
		for(var i in arr)if(arr[i]==subj)return true;
		return false;
	}else{
		throw 'Функция cm_in_array принимает первым параметром массив';
		return false;
	}
	/* }}} */
}

/*
	Function: cm_centrize
		Центровка блока на странице
		
	Parameters:
		element	- *obj* HTMLElement
		w		- *int* ширина блока
		h		- *int* высота блока
		
	Returns:
		void
*/
function cm_centrize(element,w,h){/* {{{ */
	var myWidth = 0;
	var myHeight = 0;
	if(typeof(window.innerWidth)=='number'){
		// для всего кроме MSIE
		myWidth = window.innerWidth;
		myHeight = window.innerHeight;
	}else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
		// IE6+
		myWidth = document.documentElement.clientWidth;
		myHeight = document.documentElement.clientHeight;
	}else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
		// IE4
		myWidth = document.body.clientWidth;
		myHeight = document.body.clientHeight;
	}
	if(h>myHeight)myHeight=h;
	// Теперь уточняем, насколько страница прокручена вниз и вбок
    var scrOfX = 0, scrOfY = 0;
	if(typeof(window.pageYOffset) == 'number') {
		// Netscape и его родственники
		scrOfY = window.pageYOffset;
		scrOfX = window.pageXOffset;
	} else if (document.body && (document.body.scrollLeft || document.body.scrollTop)) {
		// DOM
		scrOfY = document.body.scrollTop;
		scrOfX = document.body.scrollLeft;
	} else if (document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop)) {
		// IE6
		scrOfY = document.documentElement.scrollTop;
		scrOfX = document.documentElement.scrollLeft;
	}
	var top2 = Math.round((myHeight - h) / 2 + scrOfY);
	if(top2<10)
		top2=10;
	element.style.top = String(top2) + 'px';
    element.style.left = String(Math.round((myWidth - w) / 2) + scrOfX) + 'px';
	/* }}} */
}

/* function jEMS_Initialize(opts){
	$('body')
	.ajaxStart(function(){
		if(ajaxStat.inWait==0){
			// показать индикатор загрузки
			$('body').append('<div id="jems_load_indicator" class="load_indicator"><br /><br /><br /><br /><h1>Пожалуйста, подождите</h1><br /><br /><img src="'+globals.pathToOk+'css/tabs/loading.gif" /><br /><br /><h1>идет загрузка...</h1></div>');
			var div = $('#jems_load_indicator');
			cm_centrize(div.get(0),300,200);
			div.show();
		}
		ajaxStat.inWait++;
		window.status='Отправка запроса на сервер ('+ajaxStat.inWait+')';
	})
	.ajaxStop(function(){
		ajaxStat.inWait--;
		window.status='Готово ('+ajaxStat.inWait+')';
		if(ajaxStat.inWait==0){
			// скрыть индикатор загрузки
			try{
			$('#jems_load_indicator').remove();
			}catch(e){
				alert('Сокрытие. '+e.message);
			}
		}
	})
	.ajaxSuccess(function(a,b){
		ajaxStat.len+=b.responseText.length;
		ajaxStat.count++;
		ajaxStat.lastResponse = b.responseText;
		//ajaxStat.inWait--;
		window.status='Готово ('+ajaxStat.inWait+')';
		
	})
	.ajaxError(function(request, settings){
		console.error('Ajax error: ',settings,request);
		ajaxStat.inWait--;
		window.status='Готово ('+ajaxStat.inWait+')';
	});
} */


/*
** Очередь вызовов
**
*/
queue = function(){//{{{
	this.init();
}
queue.prototype = {
	// Указатель на текущий элемент
	c: 0,
	// Флаг занятости очереди
	b: false,
	// Конструктор
	init: function(fn){
		this.q = new Array();
	},
	// Добавление вызова в очередь
	add: function(fn,prev){
		var q=this.q,pos;
		// Вычисляем позицию если надо
		if(prev)for(var i=q.length-1;i>=this.c-1;i--)if(q[i]==prev){pos=i;break;}
		// Если позиция не известна, значит добавляем в конец
		if(!pos)pos=q.length-1;
		// Сдвигаем элементы после позиции на один элемент вправо
		for(var i=q.length-1;i>pos;i--){q[i+1]=q[i];}
		// Помещаем текущий элемент на свое место
		var x={f:fn};
		q[pos+1]=x;
		// Возвращаем текущую позицию или вызываем функцию если очередь не зянята
		return this.b?x:this.next();
	},
	// Вызов следующего элемента очереди
	next: function(){
		var q=this.q;
		// Получаем текущий объект в очереди
		var f = q[this.c];
		// Обозначаем флаг занятости
		this.b = f;
		if(f){
			// Указатель адресуем на следующий элемент очереди
			this.c++;
			// Обрабатываем текущий
			f.f();
			// Возвращаем текущий
			return f;
		}
	}
}

var GLOB_IncludedModules = [];
var GLOB_AjaxQueue = new queue();
function ajax_wait(fn,pos){return GLOB_AjaxQueue.add(fn,pos);}
function ajax_next(){return GLOB_AjaxQueue.next();}
//}}} */

/*
** @author	- ATChakkaev
** @date	- 02 aug 2007
** @desc	- простой отправитель аякс-запроса из формы
**
** @example - $('#formElementId').jEMS_FormSubmit(function(data){alert(unescape(data))});
** @desc	-
**
*/
(function($){//{{{
	/*
	** @param cl - class name of select's, which we get to work with
	*/
	$.fn.jEMS_FormSubmit=function(op){
		if(typeof op == 'function'){
			op = {success:op}
		}else if(typeof op == 'undefined'){
			op = {}
		}
		op = $.extend({
			success: false,
			failure: false,
			beforeSend: function(a){return a;},
			skipCheck: false
		},op);
		$.jems.init(this,op);
		return this;
	};
	if(!$.jems)$.jems = {}
	$.jems.init= function(jform,op){//{{{
		jform.submit(function(){
			$('input[@type=submit]',jform).attr('disabled',true);
			a = jform.formToArray();
			a = op.beforeSend(a);
			//for(var i in a)a[i].value = escape(a[i].value);
			if(!a){
				$('input[@type=submit]',jform).attr('disabled',false);
				return false;
			}
			var act = jform.attr('action') || '';
			if($.browser.opera){
				/* 
				Опера стала в один прекрасный день в экшн подставлять полный путь до документа
				Нам это не надо
				Пока лечим тупо
				Дальше будем думать как жить с этим новым свойством оперы
				*/
				act = act.split('/').pop();
			}
			var callback = function(data){
				$('input[@type=submit]',jform).attr('disabled',false);
				if(op.skipCheck){
					if(op.success)op.success(data);
				}else{
					if(data.charAt(0)=='{'){
						var d = $.parseJSON(data);
						if(d && (d.errcode==0 || d.nohandle)){
							var x = {};
							for(var i in a)x[a[i].name] = a[i].value;
							if(typeof op.success == 'function')op.success.apply(x,[data]);
						}else{
							if(globals.useExtendedErrors)
								cm('mod_error',d);
							else
								alert(unescape(d.caption+'\n'+d.message));
						}
					}else{
						alert(unescape(data));
					}
				}
			}
			var m = jform.attr('method') || '';
			if(m.toLowerCase()=='post'){
				$.post(globals.pathToOk+act,a,callback);
			}else{
				cm_get(globals.pathToOk+act,a,callback);
			}
			return false;
		});
		//}}}
	}
	//}}}
})(jQuery);

dump = function(v){
	cm('mod_dump',v);
}

$.fn.formToArray = function(semantic) {
    var a = [];
    if (this.length == 0) return a;

    var form = this[0];
    var els = semantic ? form.getElementsByTagName('*') : form.elements;
    if (!els) return a;
    for(var i=0, max=els.length; i < max; i++) {
        var el = els[i];
        var n = el.name;
        if (!n) continue;

        if (semantic && form.clk && el.type == "image") {
            // handle image inputs on the fly when semantic == true
            if(!el.disabled && form.clk == el)
                a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
            continue;
        }
        var v = $.fieldValue(el, true);
        if (v === null) continue;
        if (v.constructor == Array) {
            for(var j=0, jmax=v.length; j < jmax; j++)
                a.push({name: n, value: v[j]});
        }
        else
            a.push({name: n, value: v});
    }

    if (!semantic && form.clk) {
        // input type=='image' are not found in elements array! handle them here
        var inputs = form.getElementsByTagName("input");
        for(var i=0, max=inputs.length; i < max; i++) {
            var input = inputs[i];
            var n = input.name;
            if(n && !input.disabled && input.type == "image" && form.clk == input)
                a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
        }
    }
	// dateTimeComponent
	var dtc = $('[@itype=dateTimeComponent]',this);
	if(dtc.size()>0){
		dtc.each(function(){
			a.push({name: $(this).attr('iname'), value: $(this).attr('ivalue')});
		});
	}
    return a;
};

$.fn.formSerialize = function(semantic) {
    //hand off to jQuery.param for proper encoding
    return $.param(this.formToArray(semantic));
};

$.fn.fieldValue = function(successful) {
    for (var val=[], i=0, max=this.length; i < max; i++) {
        var el = this[i];
        var v = $.fieldValue(el, successful);
        if (v === null || typeof v == 'undefined' || (v.constructor == Array && !v.length))
            continue;
        v.constructor == Array ? $.merge(val, v) : val.push(v);
    }
    return val;
};

jQuery.fieldValue = function(el, successful) {
    var n = el.name, t = el.type, tag = el.tagName.toLowerCase();
    if (typeof successful == 'undefined') successful = true;

    if (successful && (!n || t == 'reset' || t == 'button' ||
        (t == 'checkbox' || t == 'radio') && !el.checked ||
        (t == 'submit' || t == 'image') && el.form && el.form.clk != el ||
        tag == 'select' && el.selectedIndex == -1))
            return null;

    if (tag == 'select') {
        var index = el.selectedIndex;
        if (index < 0) return null;
        var a = [], ops = el.options;
        var one = (t == 'select-one');
        var max = (one ? index+1 : ops.length);
        for(var i=(one ? index : 0); i < max; i++) {
            var op = ops[i];
            if (op.selected) {
                // extra pain for IE...
                var v = jQuery.browser.msie && !(op.attributes['value'].specified) ? op.text : op.value;
                if (one) return v;
                a.push(v);
            }
        }
        return a;
    }
    return el.value;
};

/*
** toJSON by Mark Gibson
** hacked the original json.js into a jQuery plugin.
** It adds the two functions:$.toJSON(value),$.parseJSON(json_str, [safe]).
*///{{{
(function ($) {
    var m = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        s = {
            'array': function (x) {
                var a = ['['], b, f, i, l = x.length, v;
                for (i = 0; i < l; i += 1) {
                    v = x[i];
                    f = s[typeof v];
                    if (f) {
                        v = f(v);
                        if (typeof v == 'string') {
                            if (b) {
                                a[a.length] = ',';
                            }
                            a[a.length] = v;
                            b = true;
                        }
                    }
                }
                a[a.length] = ']';
                return a.join('');
            },
            'boolean': function (x) {
                return String(x);
            },
            'null': function (x) {
                return "null";
            },
            'number': function (x) {
                return isFinite(x) ? String(x) : 'null';
            },
            'object': function (x) {
                if (x) {
                    if (x instanceof Array) {
                        return s.array(x);
                    }
                    var a = ['{'], b, f, i, v;
                    for (i in x) {
                        v = x[i];
                        f = s[typeof v];
                        if (f) {
                            v = f(v);
                            if (typeof v == 'string') {
                                if (b) {
                                    a[a.length] = ',';
                                }
                                a.push(s.string(i), ':', v);
                                b = true;
                            }
                        }
                    }
                    a[a.length] = '}';
                    return a.join('');
                }
                return 'null';
            },
            'string': function (x) {
                if (/["\\\x00-\x1f]/.test(x)) {
                    x = x.replace(/([\x00-\x1f\\"])/g, function(a, b) {
                        var c = m[b];
                        if (c) {
                            return c;
                        }
                        c = b.charCodeAt();
                        return '\\u00' +
                            Math.floor(c / 16).toString(16) +
                            (c % 16).toString(16);
                    });
                }
                return '"' + x + '"';
            }
        };
	$.toJSON = function(v) {
		var f = isNaN(v) ? s[typeof v] : s['number'];
		if (f) return f(v);
	};
	$.parseJSON = function(v, safe) {
		if (safe === undefined) safe = $.parseJSON.safe;
		if (safe && !/^("(\\.|[^"\\\n\r])*?"|[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t])+?$/.test(v))
			return undefined;
		return eval('('+v+')');
	};
	$.parseJSON.safe = false;
})(jQuery);
//}}}

function jEMS_StoreSettings(keep_silence,cb){
	if(typeof keep_silence == 'undefined')keep_silence = 'false';
	var str = $.toJSON(globals.data);
	$.get(globals.pathToOk+'ok_common.php?q=StoreSettings&RoleID='+globals.roleId+'&Data='+escape(str),function(data){
		if(data=='1'){
			if(!keep_silence)alert('Сохранение выполнено!');
			if(typeof cb == 'function')cb();
			return true;
		}else{
			alert('Ошибка сохранения настроек:\n'+data);
			return false;
		}
	});
	return true;
}

$.hotkeys.add('ctrl+f10', function(){
	cm('mod_object_navigator');
});

$.hotkeys.add('ctrl+f9', function(){
	var am = globals.activeModule;
	if(!am)return;
	var n = am._moduleName;
	var p = am._calledWith;
	var c = am._caller;
	am.jqObject.jqmClose();
	globals.modules[n] = null;
	cm(n,p,c);
});

$.hotkeys.add('ctrl+f8', function(){
	cm('mod_sessions');
});

$.hotkeys.add('esc', function(){
	if(!globals.windows || globals.windows.length==0)return false;
	var m = globals.windows[globals.windows.length-1];
	m.jqObject.jqmClose();
});
