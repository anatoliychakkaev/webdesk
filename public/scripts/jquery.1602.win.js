(function($){
/*
	Function: call_module
		Запускает модуль, если он загружен
		если не загружен - загружает и запускает
	
	Parameters:
		module_name	- *string* название модуля
		param		- *any* параметр вызова
	
*/
call_module = function(module_name,param,caller){//{{{
	var winClass = globals.modules[module_name];
	if(winClass){/* {{{ */
		if(!winClass._moduleName)winClass._moduleName = module_name;
		if(typeof winClass.className == 'undefined'){ // Умолчания для "старых модулей"
			winClass.className = 'winForm';
			winClass.params = $.extend({single: true,oldModule: true},winClass.params);
		}
		
		if(winClass.params && winClass.params.single){// Single-представление (может быть только один экземляр)
			var newInst = winClass;
			//console.log(winClass);
		}else{// Multi-представления (может быть сколько угодно экземпляров)
			// надо определить, создавать ли новое представление или использовать старое
			// для этого проверяем наличие функции winClass.getName(params)
			// и сравниваем результат выполнения с полем _uniqueName окон этого класса
			var cn = true; // CreateNew
			if(typeof winClass.getName == 'function'){
				var uName = winClass.getName(param);
				for(var i in globals.instances){
					var x = globals.instances[i];
					if(x._uniqueName == uName && x._moduleName == winClass._moduleName){
						cn = false;
						var newInst = globals.instances[i];
						break;
					}
				}
			}
			if(cn){
				var newInst = $.extend({},winClass);
				newInst._uniqueName = uName;
			}
		}
		newInst._caller = caller || globals.activeModule || {jqObject:$()};
		if(typeof newInst._uid == 'undefined'){
			//alert(newInst._uid);
			var addToPage = function(x){
				var dsk = $('#desktop');
				if(dsk.size()>0){
					dsk.append(x);
				}else{
					$('#global_wrapper').append(x);
				}
			}
			// Глобальный идентификатор представления
			var instUID = globals.instances.length;
			newInst._uid = 'wf'+instUID;
			// Добавляем в массив экземпляров
			globals.instances.push(newInst);
			newInst.selfPath = 'globals.instances['+instUID+']';
			// Параметры по умолчанию
			newInst.params = $.extend({
				width: 400,
				height: 400,
				caption: newInst._uid,
				icon: 'win-blank'
			},newInst.params);
			// Далее в зависимости от класса представления
			switch(globals.modules[module_name].className){
				default:case'winForm':case'Di':/* {{{ Di */
					// HTML-код окна
					var resizer = 
						'<div class="jqBord resizeB" resize="b"></div>'+
						'<div class="jqBord resizeR" resize="r"></div>'+
						'<div class="jqBord resizeL" resize="l"></div>'+
						'<div class="jqBord resizeT" resize="t"></div>'+
						'<div class="jqCorn resizeTL" resize="tl"></div>'+
						'<div class="jqCorn resizeTR" resize="tr"></div>'+
						'<div class="jqCorn resizeBL" resize="bl"></div>'+
						'<div class="jqCorn resizeBR" resize="br"></div>';
					var wrapper = 
						'<div id="{id}" class="jqmWindow" iuid="{iuid}">'+
							'<div class="jqmWinContent">{content}</div><div class="jqCorn resizeTL" resize="tl"></div>'+
							resizer+
							'<div class="jqDrag jqWinHeader">'+
								'<span style="position:absolute;left:0;top:0;padding:3px">'+
								'<img src="'+globals.imageBase+'" width="16" height="16" id="winIco" onclick="globals.instances['+instUID+'].jqObject.jqmSwitch();" />'+
								'</span><span id="{id}_cap">{cap}</span>'+
								'<img src="'+globals.imageBaseCommon.set('img','dialog/jClose.gif')+'" width="25" height="22" class="jqmClose" />'+
							'</div>'+
						'</div>';
					
					// оЙгукн-объект окошка
					if(newInst.params.oldModule){
						var jq = $('<div id="'+module_name+'" class="module" iuid="'+instUID+'">'+newInst.html+'</div>');
						newInst.jqObject = jq.find('.jqmWindow');
						newInst.jqObject.prepend(resizer).mousedown(function(){newInst.jqObject.jqmShow();});
						// Добавляем на страницу
						$('#global_wrapper').append(newInst.jqObject);
						newInst.params.caption = newInst.jqObject.find('.jqWinHeader span').text();
					}else{
						newInst.jqObject = $(
							wrapper
							.replace(/\{id\}/g,newInst._uid)
							.replace(/\{iuid\}/g,instUID)
							.replace(/\{img\}/g,newInst.params.icon)
							.replace(/\{cap\}/g,newInst.params.caption)
							.replace(/\{content\}/g,newInst.html)
						)
						// Регистрируем как окно
						.jqm({width:newInst.params.width,height:newInst.params.height})
						// Обучаем активизироваться по нажатию кнопки мыши
						//.mousedown(function(){newInst.jqObject.jqmShow();});
						// Добавляем на страницу
						$('#global_wrapper').append(newInst.jqObject);
					}
					
					// Инициализируем функции
					newInst.show = function(){this.jqObject.jqmShow();}
					newInst.hide = function(){this.jqObject.jqmHide();}
					newInst.setCaption = function(caption){
						this.params.caption = caption;
						this.jqObject.find('#'+this._uid+'_cap').html(caption);
					}
					newInst.getCaption = function(){
						return this.params.caption?this.params.caption:newInst._uid;
					}
					newInst.setIcon = function(ico_name){
						var img = this.jqObject.find('img#winIco');
						img.attr('src',globals.imageBase.set('img',ico_name));
						this.params.icon = ico_name;
					}
					newInst.getIcon = function(){
						return this.params.icon;
					}
				break;
				/* }}} */
				case 'Bg':/* {{{ Bg */
					newInst.jqObject = $('<div iuid="'+instUID+'" style="display:none;">'+newInst.html+'</div>');
					// Добавляем на страницу
					addToPage(newInst.jqObject);
					// Инициализируем функции
					newInst.show = function(){this.jqObject.jqmShow();}
					newInst.hide = function(){this.jqObject.jqmHide();}
					newInst.setCaption = function(caption){
						this.params.caption = caption;
						//document.title = (globals&&globals.caption?globals.caption+' - ':'')+caption;
					}
					newInst.getCaption = function(){
						return this.params.caption?this.params.caption:newInst._uid;
					}
					newInst.setIcon = function(ico_name){
						return false;
					}
					newInst.getIcon = function(){
						return this.params.icon;
					}
				break;
				/* }}} */
			}
			try{
				if(typeof newInst.init == 'function')newInst.init();
				//if(newInst.params.single)delete newInst.init;
			}catch(e){
				alert('Ошибка инициализации модуля '+module_name+':\n'+$.toJSON(e));
			}
		}
		
		try{
			ajax_wait(function(){
				newInst._calledWith = param;
				newInst.main(param);
				ajax_next();
			});
		}catch(e){
			alert('Ошибка запуска модуля '+module_name+':\n'+$.toJSON(e));
		}
		/* }}} */
	}else{
		ajax_wait(function(){
			cm_get_json(globals.pathToCore+'module_loader.php?module='+module_name,function(moduleObject){
				//if(!globals.modules[module_name]){
				if(moduleObject.html)moduleObject.script.html = moduleObject.html;
				globals.modules[module_name] = moduleObject.script;
				//}
				call_module(module_name,param,caller);
				ajax_next();
			});
		});
	}
	//}}}
}
// alias
cm = call_module;
function cm_activate_module_on_click(){$(this).jqmShow();}

$.fn.jqm = function(op){
	var t = this;
	this.find('.jqmClose').click(function(){
		t.jqmClose();
	});
	this.jqDrag('.jqDrag').jqResize('div[@resize]').bgiframe();
	op = $.extend({
		width:500,
		height:300
	},op);
	cm_centrize(this.get(0),op.width,op.height);
	this.css({
		'z-index': op.zIndex,
		'width': op.width,
		'height':op.height
	});
	return this;
}
$.fn.jqmShow = function(){
	if(globals.env.lockTabs)return this;
	if(!globals.curZindex)globals.curZindex=6;
	if(!globals.windows)globals.windows=[];
	var instUID = parseInt(this.attr('iuid'));
	var inst = globals.instances[instUID];
	// Для single-модулей выставить флаг закрытия окна
	if(inst._closed)inst._closed = false;
	// Если модуль уже активен - выйти
	if(globals.activeModule==inst){
		console.log('Module has already activated');
		return this;
	}
	// Сохранить предыдущий активный модуль
	var am = globals.activeModule;
	globals.prevActiveModule = am;
	if(am){
		// deactivate
		cm_calc(am,'onDeactivate');
		am.jqObject.bind('mousedown',cm_activate_module_on_click);
		if(am.className!='Bg')am.jqObject.removeClass('jqActive');
	}
	// Выставить текущий активный модуль
	globals.activeModule = inst;
	globals.activeModule.jqObject.unbind('mousedown',cm_activate_module_on_click);

	var id = inst._uid;
	// Поиск активизируемого окна в стеке
	var found = false;
	for(var i=0;i<globals.windows.length;i++){
		if(globals.windows[i] == inst){
			found = true;
			break;
		}
	}
	
	if(found){
		// Исправляем порядок окон
		var tmp;
		while(i<globals.windows.length-1){
			tmp = globals.windows[i];
			globals.windows[i] = globals.windows[i+1];
			globals.windows[i+1] = tmp;
			i++;
		}
		if(inst.className!='Bg' && this.css('z-index')<globals.curZindex-1)this.css('z-index',globals.curZindex++);
	}else{
		// Добавляем окно
		globals.windows.push(inst);
		if(inst.className!='Bg')this.css('z-index',globals.curZindex++);
	}
	if(inst.className=='Bg'){
		if(globals.env.visibleBg && globals.env.visibleBg.className == 'Bg')globals.env.visibleBg.jqObject.hide();
		inst.jqObject.show();
		inst.visible = true;
		globals.env.visibleBg = inst;
	}else{
		this.addClass('jqActive').show();
	}
	
	try{
		// Фокус на первом инпуте (если есть, если не ИЕ)
		//*
		if(!$.browser.msie){
			var input = this.find('input:first')[0];
			//if(input)input.focus();
		}
		//*/
	}catch(e){};
	
	// activate
	cm_calc(inst,'onActivate');
	$().trigger('windowsChanged');
	return this;
};
$.fn.jqmSwitch = function(){
	var instUID = parseInt(this.attr('iuid'));
	var inst = globals.instances[instUID];
	if(globals.activeModule == inst)globals.activeModule = null;
	if(inst.className == 'Di' || inst.className == 'winForm'){
		inst.className = 'Bg';
		var newParent = $('<div iuid="'+instUID+'" style="display:none;"></div>');
		inst.jqObject.find('div.jqmWinContent').children().appendTo(newParent);
		inst.jqObject.remove();
		inst.jqObject = newParent;
		inst.jqObject.appendTo('#desktop');
		inst.jqObject.jqmShow();
	}else{
		inst.className = 'Di';
		var content = inst.jqObject.children();
		var resizer = 
			'<div class="jqBord resizeB" resize="b"></div>'+
			'<div class="jqBord resizeR" resize="r"></div>'+
			'<div class="jqBord resizeL" resize="l"></div>'+
			'<div class="jqBord resizeT" resize="t"></div>'+
			'<div class="jqCorn resizeTL" resize="tl"></div>'+
			'<div class="jqCorn resizeTR" resize="tr"></div>'+
			'<div class="jqCorn resizeBL" resize="bl"></div>'+
			'<div class="jqCorn resizeBR" resize="br"></div>';
		var wrapper = 
			'<div id="{id}" class="jqmWindow" iuid="{iuid}">'+
				'<div class="jqmWinContent">{content}</div><div class="jqCorn resizeTL" resize="tl"></div>'+
				resizer+
				'<div class="jqDrag jqWinHeader">'+
					'<span style="position:absolute;left:0;top:0;padding:3px">'+
					'<img src="'+globals.imageBase+'" width="16" height="16" id="winIco" onclick="globals.instances['+instUID+'].jqObject.jqmSwitch();" />'+
					'</span><span id="{id}_cap">{cap}</span>'+
					'<img src="'+globals.imageBaseCommon.set('img','dialog/jClose.gif')+'" alt="Закрыть окно" width="25" height="22" class="jqmClose" />'+
				'</div>'+
			'</div>';
		var newParent = $(
			wrapper
			.replace(/\{id\}/g,inst._uid)
			.replace(/\{iuid\}/g,instUID)
			.replace(/\{img\}/g,inst.params.icon)
			.replace(/\{cap\}/g,inst.params.caption)
			.replace(/\{content\}/g,'')
		)
		.jqm({width:inst.params.width,height:inst.params.height,zIndex:globals.curZindex++});
		content.appendTo(newParent.find('div.jqmWinContent'));
		inst.jqObject.remove();
		inst.jqObject = newParent;
		inst.jqObject.appendTo('#global_wrapper');
		inst.jqObject.jqmShow();
	}
	//$().trigger('windowsChanged');
};

$.fn.jqmHide = function(){//todo: переписать как jqmClose
	var win = globals.windows.pop();
	globals.activeModule = null;
	if(globals.windows.length==0){
		globals.activeModule = null;
		$().trigger('windowsChanged');
	}
	var instUID = win.jqObject.attr('iuid');
	switch(win.className){
		default:case'winForm':case'Di':/* {{{ Di */
			this.removeClass('jqActive').hide();
			for(var i=globals.windows.length-1;i>=0;i--){
				var cl = globals.windows[i].className;
				if(cl=='winForm' || cl=='Di'){
					globals.windows[i].jqObject.jqmShow();
				}
			}
			/* }}} */
		break;
		case 'Bg':/* {{{ */
			var success = false;
			for(var i=globals.windows.length-1;i>=0;i--){
				var w = globals.windows[i];
				if(w.className == 'Bg'){
					w.jqObject.jqmShow();
					success = true;
					break;
				}
			}
			//if(success)
				this.hide();
			/* }}} */
		break;
	}
	this.trigger('hide');
	return this;
}

$.fn.jqmClose = function(){
	var instUID = this.attr('iuid');
	var win = globals.instances[instUID];
	// locked?
	if(win.params && win.params.locked){
		console.log('locked',win);
		return false;
	}
	// can close?
	if(typeof win.onCloseQuery =='function' && !win.onCloseQuery.apply(win))return false;
	// deactivate
	cm_calc(win,'onDeactivate');
	// close
	cm_calc(win,'onClose');
	// delete from globals.windows
	for(var i=0;i<globals.windows.length-1;i++){
		if(globals.windows[i] == win){
			globals.windows[i] = globals.windows[i+1];
			globals.windows[i+1] = win;
		}
	}
	globals.windows.pop();
	// hide
	this.hide().trigger('hide');
	
	if(win.params && !win.params.single){
		win.jqObject.remove();
		delete globals.instances[instUID];
	}else{
		globals.instances[instUID]._closed = true;
	}
	
	if(globals.windows.length>0){
		globals.windows[globals.windows.length-1].show();
	}else{
		globals.activeModule = null;
		$().trigger('windowsChanged');
	}
	cm_calc(win,'onAfterClose');
	return true;
}

})(jQuery);
