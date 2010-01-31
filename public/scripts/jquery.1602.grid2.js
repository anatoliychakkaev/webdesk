/*global $, cm_img*/
/* 
todo documentation needed!

1. Кнопки рисуются один раз
2. Меню базируется на actions с возможностью вычисления disabled
3. Добавление в меню стандартных действий следующими способами:
	- перечисление (features)
	- специальные объекты-строки в наборе actions

*/

(function ($) {
	var _showLabels = false;
	function tool_btn(icon, caption, condition, action, noinactive) {
		if (!condition && noinactive) {
			return '';
		}
		return (condition?'<span class="likeatoolbutton" onclick="' + action + '">' : '<span class="likeatoolbutton">') +
		cm_img(icon + (condition && !noinactive ? '_blue' : ''), caption, 'vertical-align:middle;') +
		(_showLabels ? ' ' + caption : '') +
		'</span> ';
	}
	
	var _features = '';
	function cf(name) {
		return _features.search(name) !== -1;
	}
	
	$.fn.gridInit = function (op) {/* {{{ */
		// Проверяем контейнер на существование
		if (this.length === 0) {
			console.error('Container not found');
			return false;
		}
		// Идентифицируем контейнер
		var id = $.grid.grids.length;
		this.attr('iuid', id);
		// Где храним пользовательские настройки
		var iniSect = this.attr('name');
		var ini = false;
		if(iniSect){
			if(!globals.data.grids) globals.data.grids = {};
			if(!globals.data.grids[iniSect])globals.data.grids[iniSect] = {};
			ini = globals.data.grids[iniSect];
		}
		
		// Разворачиваем фичи
		_features = op && op.features || this.attr('features') || '';
		
		// Объект-грид
		var grid = {/* {{{ */
			jqObject: this,
			settings: {
				columns: false, 			// формат шортката: 'Заголовок|выравнивание<=>|вычислятор|невидимость'
				
				quickSearchField: false,	// поле для быстрого поиска
				sortBy: 'id',				// поле для сортировки
				key: false,					// ключевое поле
											// если false, тогда используем обычный массив для хранения инфы
				checkField:	false,			// поле для проверки, отмечен ли элемент, 
											// если false, тогда не храним инфу о выделении отдельно от элемента
				filterField: false,			// поле для проверки, отфильтрован ли элемент
											// если false, тогда не храним инфу о фильтрации отдельно от элемента
				
				itemsOnPage: 15,			// строк на странице
				page: 0,					// текущая страница
				sortDir: 0,					// порядок сортировки
				pagesDeltaCount: 3,			// сколько страниц до и после текущей показывать в списке страниц
				
				datasource: null,			// источник д-х (URL || array)
				loadOnInit: true,			// загрузить данные из URL при инициализации
				
				checkSupportEnabled: cf('check'),	// поддержка чекбоксов
				pagingSupportEnabled: cf('paging'),// поддержка постраничного вывода
				sortSupportEnabled: cf('sort'),	// поддержка сортировки
				quickSearchMode: 'locate',	// 'locate' || 'filter'
				remotePaging: cf('remote'),		// включает режим постраничной работы с сервером
				
				showHeader: cf('header'),			// скрыть заголовок
				showFooter: cf('footer'),			// скрыть футер
				
				emptyMessage: 'Нет элементов для представления',
				caption: false,				// заголовок таблицы (bool || string)
				showLabels: cf('labels'),			// Рядом с кнопками - подписи
				
				// Устаревшие настройки
				showRefreshButton: true,
				hidePager: false,			// скрыть заголовок
				showEmptyCells: true,
				localScroll: false,
				
				on_load_complete: null,
				on_footer_calc: null,
				colOrder: []
			},
			jqContainer:	this,
			countChecked:	0,
			totalCount:		0
			/* }}} */
		};
		
		// Наследуем настройки
		grid.settings = $.extend(grid.settings,op);
		
		var gs = grid.settings;
		
		// Исправляем противоречия (хэдер скрыт, а постраничность включена)
		if(gs.pagingSupportEnabled)gs.showHeader = true;
		
		// Наполняем контейнер
		this.html(
			(!gs.showHeader?'':'<div id="gridHeader" style="display:screen;border-top:1px solid #808080;border-left:1px solid #808080;border-right:1px solid #808080;padding:5px;background:#eee;">'+
				(gs.caption || gs.pagingSupportEnabled?'<div style="color:#00A;background:#bbb;margin:-5px;padding:5px;margin-bottom:5px;border-bottom:1px solid #808080;">'+
				(gs.caption?'<span id="caption" style="font-size:100%;font-weight:700;">'+gs.caption+'</span>':'')+
				(gs.pagingSupportEnabled?'<span id="pager"></span>':'')+
				'</div>':'')+
				'<span id="menu"></span>'+
				(gs.quickSearchField?'<form onsubmit="$.grid.handleSearch(this);return false;" style="display:inline;"><input name="qSearchSubject" value="Быстрый поиск" style="color:#808080;font-family:courier new;"'+
				'onfocus="if(this.value==\'Быстрый поиск\'){this.value=\'\';this.style.color=\'#000000\';}" '+
				'onblur="if(this.value==\'\'){this.value=\'Быстрый поиск\';this.style.color=\'#808080\';}" /></form>':'')+
			'</div>')+
			'<table class="grid tab3d"><thead></thead><tbody></tbody></table>'+
			(!gs.showFooter?'':'<div id="gridFooter"></div>'));
		
		// Запоминаем элементы интерфейса
		if(gs.showHeader){
			grid.jqHeader =	this.find('#gridHeader');
			grid.jqCaption = gs.caption?this.find('#caption'):false;
			grid.jqMenu = this.find('#menu');
			grid.jqPager = this.find('#pager');
		}else{
			grid.jqHeader =	false;
			grid.jqCaption = false;
			grid.jqMenu = false;
			grid.jqPager = false;
		}
		if(gs.showFooter){
			grid.jqFooter =	this.find('#gridFooter');
		}else{
			grid.jqFooter =	false;
		}
		grid.jqThead =	this.find('thead');
		grid.jqTbody =	this.find('tbody');
		
		// Короткие датасорцы
		if(typeof gs.datasource == 'string' && gs.datasource.search('/')==-1)
			gs.datasource = globals.pathToOk+gs.datasource;
		
		$.grid.initColumns(gs);
		
		// Разворачиваем пользовательские настройки
		if(ini){
			// Сортировка
			gs.sortBy = ini.sb || gs.sortBy;
			gs.sortDir = ini.sd || gs.sortBy;
			// Видимость столбцов
			var cls = h.settings.columns;
			if(ini.vc){
				var cook = ini.vc.split(',');
				for(var i in cls)
					cls[i].visible = false;
				for(var i in cook){
					if(cls[cook[i]])
						cls[cook[i]].visible = true;
				}
			}
			// Порядок столбцов - (пока в проекте)
			if(ini.cord){
				gs.colOrder = ini.cord.split(',');
			}
		}
		
		// Инициализация коллекций:
		// для checking
		if(!gs.checkField)grid.checked = {};
		// и filtering 
		if(!gs.filterField)grid.filtered = {};
		// и для хранения данных
		grid.items = gs.key?{}:[];
		
		$.grid.grids[id] = grid;
		if(typeof gs.datasource == 'string' && gs.loadOnInit){
			$.grid.renderHeading(this);
			this.gridLoad();
		}else{
			$.grid.render(this,true);
		}
		return this;
		/* }}} */
	};
	$.fn.gridLoad=function(ds,clear,callback){/* {{{ */
		var h = this.gridHash();
		var gs = h.settings;
		var ath = this;
		
		if(typeof ds == 'function'){
			callback = ds;
			clear = true;
			ds = gs.datasource;
		}else if(typeof ds == 'boolean'){
			callback = clear;
			clear = ds;
			ds = gs.datasource;
		}else if(typeof ds == 'undefined'){
			ds = gs.datasource;
			clear = true;
		}
		
		gs.datasource = ds;
		
		// Красивость для загрузки
		var cols = Math.max(1,h.settings.colOrder.length)+(gs.checkSupportEnabled?1:0);
		h.jqTbody.html('<tr><td style="height:'+Math.max(h.jqTbody.height(),50)+'px;" colspan="'+cols+
		'" align="center">Пожалуйста подождите, идет загрузка</td></tr>');
		
		// Загрузка
		cm_get_json(ds,function(data){
			if(data.errcode && data.errcode!=0)return false;
			ath.gridAdd(data,clear);
			if(typeof h.settings.on_load_complete == 'function')
				h.settings.on_load_complete(h);
			if(typeof callback == 'function')callback(h);
		});
		return this;
		/* }}} */
	};
	$.fn.gridLoadCurrent=function(id){/* {{{ */
		var h = this.gridHash();
		var ath = this;
		if(typeof id == 'undefined')id = h.itemId;
		t = '<td colspan="'+($('tr:eq(0) th',this).size())+'" style="background:eee;color:#555;font-weight:700;text-align:center;"><table><tr><td><img src="/vk/ok/css/tabs/loading.gif" /></td><td>пожалуйста, подождите, идет загрузка обновленных данных</td></tr></table></td>';
		$('tr[@itemId='+id+']',this).html(t);
		$.getJSON(h.settings.datasource+'&id='+id,function(data){
			delete h.items[id];
			h.oneRecord = true;
			ath.gridAdd(data);
			h.oneRecord = false;
			ath.gridLocate(id);
		});
		return this;
		/* }}} */
	};
	$.fn.gridSort=function(sb){/* {{{ */
		var h = this.gridHash();
		var home = h.home;
		var ini = globals.data[home];
		if(h.settings.cookieEnabled){
			ini.sortby = sb;;
			ini.sortdir = (h.settings.sortDir==0)?128:0;
		}
		if(h.settings.remotePaging){
			//h.msg('Запуск удаленной сортировки по столбцу '+sb);
			if(h.settings.sortBy==sb){
				h.settings.sortDir = (h.settings.sortDir==0)?128:0;
			}else{
				h.settings.sortBy=sb;
				h.settings.sortDir = 0;
			}
			var col = h.settings.columns[sb];
			if(!col || !col.sortIndex || col.sortIndex==0){
				alert('Невозможно отсортировать по выбранному столбцу');
				return this;
			}
			var sortIndex = col.sortIndex + h.settings.sortDir;
			h.jqObject.gridLoad(h.settings.datasource+'&locateid='+h.itemId+'&sort='+sortIndex+'&iop='+h.settings.itemsOnPage,true);
		}else{
			//h.msg('Запуск локальной сортировки по  столбцу '+sb);
			if(h.settings.sortBy==sb){
				h.order.reverse();
				$.grid.render(h.jqObject);
				h.jqObject.gridLocate();
			}else{
				h.settings.sortBy=sb;
				h.jqObject.gridRefresh();
			}
		}
		return h.jqObject;
		/* }}} */
	};
	$.fn.gridFilter=function(fn,p){/* {{{ */
		if(typeof fn != 'function') return this;
		var h = this.gridHash();
		h.f = {
			f:fn,
			p:p
		}
		this.gridRefresh();
		return this;
		/* }}} */
	};
	$.fn.gridRefresh=function(sort){/* {{{ */
		var h = this.gridHash();
		if(typeof sort == 'undefined')sort = true;
		if(sort) $.grid.sort(this);
		this.gridLocate();
		return this;
		/* }}} */
	};
	$.fn.gridAdd=function(x,clear){/* {{{ */
		/* 
		**	@description	Добавляет данные в таблицу
		**	@param 			x: object - данные, полученные от сервера
		**	Структура данных:
		**	x = {
		**		'type': 	'grid1602',
		**		'columns':	[''],
		**		'data':		[[]],
		**		'page':		0,
		**		'totalCount': 0,
		**	}
		**
		**	@param 			clear: boolean - флаг необходимости очистки кэша данных
		**	@return 		jquery
		*/
		
		/* Проверка параметров  {{{ */
		if(typeof x !='object')return this;
		if(typeof clear =='undefined')clear = false;
		/* if(x.type=='undefined' || x.type !='grid1602'){
			alert('Нераспознанный ответ сервера (type "grid1602" expected, but type "'+x.type+'" found)');
			return this;
		} */
		
		var exist = true;
		var h = this.gridHash();
		var gs = h.settings;
		var rp = gs.remotePaging;
		var key = gs.key;
		/* }}} */
		/* Очистка грида, если clear {{{ */
		if(h && clear){
			delete h.items;
			h.items = [];
			delete h.order;
			h.order = [];
			h.settings.page=0;
			h.totalCount = 0;
			h.countChecked = 0;
		}
		/* }}} */
		if(rp){
			if(!h.oneRecord){ // fix pager bug if one record has reported
				h.totalCount=x.totalCount;
				gs.page = x.page;
			}
		}else{
			h.totalCount+=x.data.length;
		}
		for(var i=0;i<x.data.length;i++){
			var item = {};
			for(var index in x.columns)item[x.columns[index]] = x.data[i][index];
			var id = key?item[key]:h.items.length;
			//for(var j in item)if(typeof item[j] == 'string')item[j] = unescape(item[j]);
			h.items[id] = item;
		}
		if(gs.checkSupportEnabled){
			var allchecked = false;
			if(gs.checkField){
				var chc = 0;
				for(var index in x.columns)if(x.columns[index]==gs.checkField){
					for(var i in x.data)if(x.data[i][index])chc++;
					break;
				}
				h.countChecked+=chc;
				allchecked = h.countChecked==h.totalCount;
			}
			$('#check_all',h.jqContainer).attr('checked',allchecked);
		}
		if(!gs.pagingSupportEnabled){
			gs.page = 0;
			gs.__itemsOnPage = gs.itemsOnPage;
			gs.itemsOnPage = h.totalCount;
		}else{
			if(gs.__itemsOnPage)
				gs.itemsOnPage = gs.__itemsOnPage;
		}
		$.grid.sort(this);
		$.grid.render(this);
		return this;
		/* }}} */
	};
	$.fn.gridFocused=function(){/* {{{ */
		var h = this.gridHash();
		return (h&&h.itemId)?h.items[h.itemId]:false;
		/* }}} */
	};
	$.fn.gridSelected=function(){/* {{{ */
		var h = this.gridHash();
		var cf = h.settings.checkField;
		var x = [];
		for(var i in h.items){
			if(cf && h.items[i][cf] || !cf && h.checked[i])x.push(h.items[i]);
		}
		return x;
		/* }}} */
	};
	$.fn.gridHash=function(){/* {{{ */
		var id = parseInt(this.attr('iuid'));
		if($.grid.grids[id])return $.grid.grids[id];
		if(!id && this.parent().size()==0)return false;
		return this.parent().gridHash();
		/* }}} */
	};
	$.grid={
		grids:[],
		handleClick: function(td_or_tr){/* {{{ */
			var row = td_or_tr.tagName.toLowerCase()=='tr'?$(td_or_tr):$(td_or_tr).parent();
			var g = row.gridHash();
			if(!g){
				alert('No hash!');
				return;
			}
			$.grid.activeGrid = g;
			if(g.focusedRow && g.focusedRow.size()>0)
				g.focusedRow.removeClass('focused');
			else
				g.jqTbody.find('tr.focused').removeClass('focused');
			g.focusedRow = row;
			row.addClass('focused');
			var id = row.attr('itemid');
			g.itemId=id;
			g.focusedPageIndex = g.settings.page;
			g.focusedRowIndex = parseInt(row.attr('itempos'));
			if(g.items[id])
				g.jqObject.trigger('scrollcursor',[g.items[id]]);
			else
				alert(id);
			/* }}} */
		},
		handleAction: function(span,column){/* {{{ */
			span = $(span);
			var el = span.parent();
			var row = el.parent();
			var grid = row.parent().parent().parent().parent();
			var h = grid.gridHash();
			if(!h){alert('No hash!');return;};
			var id = row.attr('itemId');
			var act = h.settings.columns[column].action;
			if(h.items[id] && typeof act == 'function')act.apply(h.items[id]);
			/* }}} */
		},
		handleCheckAll: function(chbx){/* {{{ */
			var c = $(chbx);
			var h = c.gridHash();
			var gs = h.settings;
			c.attr('disabled',true);
			var checkedAll = c.attr('checked')?true:false;
			h.countChecked = checkedAll?h.totalCount:0;
			$('.grid1602checkbox',h.jqContainer).attr('checked',checkedAll);
			if(gs.checkField)
				for(var i in h.items)h.items[i][gs.checkField] = checkedAll;
			else
				for(var i in h.items)h.checked[i] = checkedAll;
			c.attr('disabled',false);
			/* }}} */
		},
		handleCheckOne: function(chbx){/* {{{ */
			var c = $(chbx);
			var h = c.gridHash();
			var gs = h.settings;
			c.attr('disabled',true);
			var checked = c.attr('checked')?true:false;
			var id = c.parent().parent().attr('itemId');
			if(gs.checkField)
				h.items[id][gs.checkField] = checked;
			else
				h.checked[id] = checked;
			h.countChecked+=checked?1:-1;
			if(
				checked && h.countChecked==h.totalCount
				||
				!checked && h.countChecked==h.totalCount-1
			)$('#check_all',h.jqContainer).attr('checked',h.countChecked==h.totalCount);
			c.attr('disabled',false);
			/* }}} */
		},
		handleSearch:function(domForm){/* {{{ */
			//try{
			var h = $(domForm).gridHash();
			var gs = h.settings;
			var isLocate = gs.quickSearchMode=='locate';
			var searchIn = gs.quickSearchField;
			var searchBy = domForm.qSearchSubject.value
			// Locate mode
			if(isLocate){
				h.jqContainer.gridLocate(searchBy);
				return;
			}
			var matches = searchBy.match(/^\/(.*)\/([ig]{0,2})$/);
			if(matches){
				searchBy = new RegExp(matches[1],matches[2]);
			}
			// Filter mode
			var ff = gs.filterField;
			for(var i in h.items){
				var x = h.items[i][searchIn];
				var res = typeof x != 'undefined' && x.search?x.search(searchBy)!=-1:x==searchBy;
				if(!ff){
					h.filtered[i] = res;
				}else{
					h.items[i][ff] = res;
				}
				//h.jqObject.gridRefresh();
			}
			$.grid.buildIndex(h.jqObject);
			$.grid.locate(h,0,0);
			//}catch(e){console.log(e);}
			//$.grid.renderPager(h.jqObject);
			/* }}} */
		},
		align:{
			'<':'left',
			'>':'right',
			'=':'center',
			left:'left',
			right:'right',
			center:'center'
		},
		render: function(th,init){/* {{{ */
			if(typeof init == 'undefined') init = false;
			var h = th.gridHash();
			var num = h.totalCount;
			var gs = h.settings;
			
			var rp = gs.remotePaging;
			var ds = gs.datasource;
			var page = gs.page;
			var showAll = gs.showAllColumns;
			var item =	null;
			var st = '';
			var cse = gs.checkSupportEnabled;
			var iop = gs.itemsOnPage;
			
			h.focusedRow = false;
			
			if(!gs.columns){
				gs.columns = {};
				for(var i in h.items)break;
				for(var j in h.items[i])gs.columns[j] = j;
				$.grid.initColumns(gs);
				this.renderHeading(th);
			}
			if(gs.colOrder.length==0)for(var i in gs.columns)gs.colOrder.push(i);
			var cord =	gs.colOrder;
			var cols = gs.columns;
			
			this.renderPager(th);
			//this.renderHeading(th);
			var ini = globals.data[1];
			/* Инициализация {{{ */
			if($('.grid',th).size()==0 || init){
				// первоначальная инициализация по умолчанию, если не было
				if(showAll && h.items[h.order[0]]){
					item = h.items[h.order[0]];
					cols = {};
					for(var i in item){
						cols[i] = {caption:i,visible:true}
					}
					h.settings.columns = cols;
				}
				if(!cord || cord.length==0){
					cord = [];
					for(var i in cols){
						if(typeof cols[i].visible == 'undefined' && !cols[i].system)cols[i].visible = true;
						if(cols[i].visible) cord.push(i);
					}
					h.settings.colOrder = cord;
				}
				
				var tab = '';
				if(!h.settings.hidePager)tab+='<div class="pager"></div>';
				
				var st = '';
				/* if(h.settings.localScroll){
					var height = h.settings.height?h.settings.height:($('body').height()-300);
					st = 'style="height:'+height+';overflow:auto;"';
				} */
				tab+='<div '+st+'><table class="grid tab3d" cellspacing="0"><thead><tr>';
				if(cse)tab+='<th width="20"><input type="checkbox" id="'+home+'_check_all" /></th>';
				var under = '';
				var group = false;
				var glen = 0;
				for(var i in cord){
					if(cols[cord[i]] && cols[cord[i]].visible){
						if(cols[cord[i]].caption && cols[cord[i]].caption!=''){
							cap = cols[cord[i]].caption;
						}else{
							cap = cord[i];
						}
						var cg = cols[cord[i]].group;
						if(cg){
							under+='<th name="'+cord[i]+'" '+(sse?'onclick="$(this).gridSort(\''+cord[i]+'\')"':'')+'>'+cap+'</th>';
							if(group && cg!=group){
								tab+='<th colspan="'+glen+'">'+group+'</th>';
								group = cg;
							}else if(group && cg == group){
								glen++;
							}else if(!group){
								group = cg;
								glen = 1;
							}
						}else{
							if(group){
								tab+='<th colspan="'+glen+'">'+group+'</th>';
							}
							glen=0;
							group = false;
							tab+='<th name="'+cord[i]+'" rowspan="'+(cols[cord[i]].group?1:2)+'" '+(sse?'onclick="$(this).gridSort(\''+cord[i]+'\')"':'')+'>'+cap+'</th>';
						}
					}
				}
				if(under!='')under = '<tr>'+under+'</tr>';
				tab+='</tr>'+under+'</thead><tbody></tbody></table></div>';
				if(!h.settings.hideFooter)tab+='<div class="footer"></div>';
				th.html(tab);
			}
			/* }}} */
			
			/* Вывод таблицы {{{ */
			/* var ff = gs.filterField;
			var fst = 0; */
			/* for(var i=0;i<h.order.length;i++){
				var iid = h.order[i];
				if(ff && h.items[iid] && h.items[iid][ff] || !ff && h.filtered[iid])fst++;
			} */
			
			var m = '';
			for(var j=0;j<iop;j++){
				if (!h.pages) continue;
				var id = h.pages[page][j];
				if(!id || !h.items[id])continue; // пропустить
				item = h.items[id];
				var buf2 = cse?'<td nofocus="true" width="20" align="center"><input type="checkbox" class="grid1602checkbox" '+(gs.checkField&&item[gs.checkField]||!gs.checkField&&h.checked[id]?'checked':'')+' onclick="$.grid.handleCheckOne(this);" /></td>'
					:'';
				
				for(var k in cord){
					var clm = cols[cord[k]];
					if(clm && clm.visible){
						var cv = typeof clm.calc=='function'?clm.calc(item[cord[k]],item):item[cord[k]];
						if(h.settings.showEmptyCells && (typeof cv == 'undefined' || (typeof cv == 'string' && cv.replace(/ /,'') == '')))cv='&nbsp;';
						if(
								clm.action
								&& 
								(
									typeof clm.action_allowed !='function' || 
									clm.action_allowed.apply(item)
								)
						){
							var do_action = 
							'&nbsp;<span style="color:blue;cursor:pointer;font-size:14px;" onclick="$.grid.handleAction(this,\''+cord[k]+'\');">'+
							(clm.action_icon?cm_img($.trim(clm.action_icon)):'&rarr;')+
							'</span>';
							if((/^ .* $/).test(clm.action_icon)){
								cv = '<center>'+do_action+'</center>';
							}else if((/^.* $/).test(clm.action_icon)){
								cv = do_action+' '+cv;
							}else{
								cv+= do_action;
							}
						}
						buf2+='<td '+
							(cm_calc(gs,'nofocusable',[item])?'':'onclick="$.grid.handleClick(this);"')+
							(clm.align?' align="'+this.align[clm.align]+'"':'')+
							'>'+cv+'</td>';
					}
				}
				var st='';
				if(typeof h.settings.calculateRowStyle=='function'){
					try{
						st = h.settings.calculateRowStyle(item);
					}catch(e){
						alert('Error in calc style: '+e);
					}
					if(st) st = ' style="'+st+'"';
				}
				m+='<tr itemId="'+id+'" itemPos="'+j+'" '+(id==h.itemId?'class="focused"':'')+st+'>'+buf2+'</tr>';
			}
			if(m==''){
				m = '<tr><td nofocus="true" align="center" colspan="'+
				(cse?cord.length+1:cord.length)+
				'" style="padding:50px;color:#aaa;cursor:default;">'+h.settings.emptyMessage+'</td></tr>';
			}
			//$('.grid tbody tr',th).remove();
			$('.grid tbody',th).html(m);
			/* }}} */
			/* Футер {{{ */
			if(typeof h.settings.on_footer_calc == 'function' && !h.settings.hideFooter){
				$('.footer',th).html(h.settings.on_footer_calc(h));
			}
			/* }}} */
			/* }}} */
		},
		renderPager:function(grid){/* {{{ */
			var h = grid.gridHash();
			var gs = h.settings;
			var num = h.totalCount;
			var page = gs.page;
			var pdc =	gs.pagesDeltaCount;
			var iop =	gs.itemsOnPage;
			var buf = [];
			var col = h.settings.columns[h.settings.sortBy];
			var sortIndex = 0;
			var maxpage = Math.ceil(num/iop)-1;
			var legend = 'Показаны записи с '+(page*iop+1)+' по '+(Math.min((page+1)*iop,num))+' из '+num;
			if(col)sortIndex = col.sortIndex + h.settings.sortDir;
			for(var i=Math.max(0,page-pdc);i*iop<Math.min(num,page*iop+(pdc+1)*iop);i++){
				if(i==page)
					buf.push('<span style="color:red;border:1px solid #F00" title="'+legend+'">&nbsp;'+(i+1)+'&nbsp;</span>');
				else{
						//buf.push('<span class="likealink" onclick="$(this).gridLoad(\''+ds+'&page='+i+'&sort='+sortIndex+'&iop='+iop+'&time='+escape(Date())+'\',true);">'+(i+1)+'</span>');
					buf.push('<span class="likealink" onclick="$.grid.setPage($(this).gridHash(),'+i+');">'+(i+1)+'</span>');
				}
			}
			buf = buf.join(' | ');
			// последняя страница
			if((page+pdc+1)*iop<num){
					//buf+=(((page+pdc+2)*iop<num)?' ... ':' | ')+'<span class="likealink" onclick="$(this.parentNode.parentNode.parentNode).gridLoad(\''+ds+'&page='+(Math.ceil(num/iop)-1)+'&iop='+iop+'&sort='+sortIndex+'&time='+escape(Date())+'\',true);">'+(Math.ceil(num/iop))+'</span>';
				buf+=(((page+pdc+2)*iop<num)?' ... ':' | ')+'<span class="likealink" onclick="$.grid.setPage($(this).gridHash(),'+maxpage+');">'+(maxpage+1)+'</span>';
			}
			// первая страница
			if((page-pdc)>0){
				//if(rp){
				//	buf='<span class="likealink" onclick="$(this.parentNode.parentNode.parentNode).gridLoad(\''+ds+'&page=0&iop='+iop+'&sort='+sortIndex+'&time='+escape(Date())+'\',true);">1</span>'+(((page-pdc)>1)?' ... ':' | ')+buf;
				//}else{
					buf='<span class="likealink" onclick="$.grid.setPage($(this).gridHash(),0);">1</span>'+(((page-pdc)>1)?' ... ':' | ')+buf;
				//}
			}
			
			if(h.jqPager)h.jqPager.html(i>1?(gs.caption?' | ':'')+'Страницы: '+buf:'');
			
			_showLabels = gs.showLabels;
			
			var menu = 
				tool_btn('arrow_refresh','Обновить',h.settings.showRefreshButton,'$(this).gridLoad(true)',true)+
				(gs.pagingSupportEnabled?
					' '+
					tool_btn('control_start','Первая страница',page!=0,'$.grid.setPage($(this).gridHash(),0);')+
					tool_btn('control_rewind','Предыдущая страница',page>0,'$.grid.setPage($(this).gridHash(),'+(page-1)+');')+
					tool_btn('control_fastforward','Следующая страница',page<maxpage,'$.grid.setPage($(this).gridHash(),'+(page+1)+');')+
					tool_btn('control_end','Последняя страница',page!=maxpage,'$.grid.setPage($(this).gridHash(),'+maxpage+');')
					:''
				);
			
			if(h.jqMenu)h.jqMenu.html(menu);
			//console.log(result,h.jqPager);
			/* }}} */
		},
		renderHeading:function(grid){/* {{{ */
			var h = grid.gridHash();
			var gs = h.settings;
			var cls = gs.columns;
			var sse = gs.sortSupportEnabled;
			var cse = gs.checkSupportEnabled;
			var cord =	gs.colOrder;
			var under = '';
			var tab = '<tr>';
			if(cse)tab+='<th width="20"><input style="position:relative;left:-1px;top:-1px;" type="checkbox" onclick="$.grid.handleCheckAll(this);" id="check_all" '+(h.totalCount==h.countChecked?'checked':'')+' /></th>';
			
			var group = false;
			var glen = 0;
			for(var i in cord){
				if(cls[cord[i]] && cls[cord[i]].visible){
					if(cls[cord[i]].caption && cls[cord[i]].caption!=''){
						cap = cls[cord[i]].caption;
					}else{
						cap = cord[i];
					}
					var cg = cls[cord[i]].group;
					if(cg){
						under+='<th name="'+cord[i]+'" '+(sse?'onclick="$(this).gridSort(\''+cord[i]+'\')"':'')+'>'+cap+'</th>';
						if(group && cg!=group){
							tab+='<th colspan="'+glen+'">'+group+'</th>';
							group = cg;
						}else if(group && cg == group){
							glen++;
						}else if(!group){
							group = cg;
							glen = 1;
						}
					}else{
						if(group){
							tab+='<th colspan="'+glen+'">'+group+'</th>';
						}
						glen=0;
						group = false;
						tab+='<th name="'+cord[i]+'" rowspan="'+(cls[cord[i]].group?1:2)+'" '+(sse?'onclick="$(this).gridSort(\''+cord[i]+'\')"':'')+'>'+cap+'</th>';
					}
				}
			}
			if(under!='')under = '<tr>'+under+'</tr>';
			tab+='</tr>'+under;
			h.jqThead.html(tab);
			/* }}} */
		},
		sort: function(jqGrid){/* {{{ */
			var h = jqGrid.gridHash();
			var sb = h.settings.sortBy;
			var sd = h.settings.sortDir;
			h.order = [];
			for(var i in h.items)h.order.push(i);
			h.order.sort(function(x,y){return h.items[x][sb]>h.items[y][sb]?1:-1;});
			if(sd>127)h.order.reverse();
			this.buildIndex(jqGrid);
			/* }}} */
		},
		buildIndex:function(jqGrid){/* {{{ */
			var h = jqGrid.gridHash();
			var gs = h.settings;
			var ff = gs.filterField;
			var iop = gs.itemsOnPage;
			var p = 0;
			var cc = 0;
			var tc = 0;
			var pages = [[]];
			
			for(var i in h.order){
				var iid = h.order[i];
				if(ff && h.items[iid] && h.items[iid][ff] || !ff && (typeof h.filtered[iid] == 'undefined' || h.filtered[iid])){
					pages[p].push(iid);
					cc++;
					tc++;
					if(cc==iop){
						pages.push([]);
						cc = 0;
						p++;
					}
				}
			}
			if(pages[pages.length-1].length==0)pages.pop();
			for(var i in h.pages)delete h.pages[i];
			h.pages = pages;
			h.totalCount = tc;
			/* }}} */
		},
		initColumns:function(gs){/* {{{ */
			// Разворачиваем шорткаты для столбцов
			for(var i in gs.columns){
				var clm = gs.columns[i];
				var ct = typeof clm;
				if(ct == 'string'){
					var cs = gs.columns[i].split('|');
					gs.columns[i] = {
						caption: cs[0] || i,
						align: cs[1] || '<',
						calc: cs[2] || false,
						visible: cs[3] || true
					};
					clm = gs.columns[i];
				}
				
				if(typeof clm.visible == 'undefined')clm.visible = true;
				
				if(typeof clm.calc == 'string'){
					switch(clm.calc){
						case 'string':
							clm.calc = function(x){
								return x || '';
							}
						break;
						case 'str2date':
							clm.calc = function(x){
								x = (x||'').toDate();
								return  x?x.asFormat():'';
							}
						break;
						case 'img':
							clm.calc = function(x){
								return cm_img(x);
							}
						break;
						default:
							delete clm.calc;
						break;
					}
				}
			}
			if(gs.colOrder.length==0)for(var i in gs.columns)gs.colOrder.push(i);
			/* }}} */
		},
		setPage:function(h,k){/* {{{ */
			if(!h){
				alert('no hash');
				return this;
			}
			if(k<0 || k>h.pages.length-1){
				return this;
			}
			h.settings.page = k;
			$.grid.render(h.jqObject);
			return this;
			/* }}} */
		},
		setItem:function(kind){/* {{{ */
			var g = $.grid.activeGrid;
			if(!g)return false;
			var i = 0;
			var p = 0;
			if(kind=='e'){
				p = g.pages.length-1;
				i = g.pages[p].length-1;
			}else if(kind=='h'){
				i = 0;
				p = 0;
			}else{
				var pos = g.focusedRowIndex;//parseInt(g.focusedRow.attr('itempos'));
				var page = g.focusedPageIndex;
				switch(kind){
					case 's':
						g.focusedRow.find('input[@type=checkbox]').click();
						return true;
					break;
					case 'l':// left
						p = Math.max(page-1,0);
						i = pos;
					break;
					case 'r':// right
						p = Math.min(page+1,g.pages.length-1);
						i = Math.min(g.pages[p].length-1,pos);
					break;
					case 'u':// up
						i = pos-1;
						if(i<0){
							p = page-1;
							if(p<0){
								p=0;
								i=0;
							}else{
								i = g.pages[p].length-1;
							}
						}else{
							p = page;
						}
					break;
					case 'd':// down
						p = page;
						i = pos+1;
						if(i>g.pages[p].length-1){
							if(g.pages.length>p){
								p++;
								i=0;
							}else{
								i--;
							}
						}
					break;
				}
			}
			this.locate(g,i,p);
			/* }}} */
		},
		locate:function(grid,itemIndex,pageIndex){/* {{{ */
			if(typeof pageIndex=='number'&&pageIndex!=grid.settings.page)
				this.setPage(grid,pageIndex);
			var x = grid.jqTbody.find('tr[@itempos='+itemIndex+']');
			if(x[0] && !x.hasClass('focused'))this.handleClick(x[0]);
			/* }}} */
		}
	}
	$.hotkeys.add('left',function(){	$.grid.setItem('l');})
	$.hotkeys.add('right',function(){	$.grid.setItem('r');});
	$.hotkeys.add('up',function(){		$.grid.setItem('u');});
	$.hotkeys.add('down',function(){	$.grid.setItem('d');});
	$.hotkeys.add('home',function(){	$.grid.setItem('h');});
	$.hotkeys.add('end',function(){		$.grid.setItem('e');});
	$.hotkeys.add('space',function(){	$.grid.setItem('s');});
})(jQuery);