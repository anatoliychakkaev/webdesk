/*
	pagingSupportEnabled
*/
// jquery plugin grid
(function($){
	$.fn.gridInit=function(constructor,op){/* {{{ */
		var home = parseInt(this.attr('iuid'));
		if(!home){
			home = $.grid1602.hash.length;
			this.attr('iuid',home);
		}
		if(typeof globals.data[home] == 'undefined') globals.data[home] = {};
		var ini = globals.data[home];
		var sb = ini.sortby; sb = sb?sb:'id';
		var sd = ini.sortdir; sd = sd?sd:0;
		var h = {
			jqObject: this,
			items: [],
			itemConst: function(d){this.shortdata=d},
			gridSettings: {
				itemsOnPage: 15,
				quickSearchField: false,
				columns: {},
				page: 0,
				sortBy: sb,
				sortDir: sd,
				/* сколько страниц до и после текущей показывать в пейджере */
				pagesDeltaCount: 3,
				datasource: null,
				loadOnInit: true,
				on_load_complete: null,
				on_footer_calc: null,
				checkSupportEnabled: ini.cse?true:false,
				pagingSupportEnabled: true,
				sortSupportEnabled: true,
				remotePaging: false,
				cookieEnabled: false,
				localScroll: ini.ls?true:false,
				hidePager: false,
				hideFooter: false,
				showEmptyCells: true,
				emptyMessage: 'Нет элементов для представления в данном виде',
				showRefreshButton: false
			},
			countChecked: 0,
			totalCount: 0,
			home: home
		};
		
		if(typeof constructor == 'function')h.itemConst = constructor;
		if(typeof constructor == 'object')op = constructor;
		h.gridSettings = $.extend(h.gridSettings,op);
		
		for(var i in h.gridSettings.columns){
			if(typeof h.gridSettings.columns[i] == 'string')
				h.gridSettings.columns[i] = {
					visible: true,
					caption: h.gridSettings.columns[i]
				}
		}
		
		var cook = ini.visible; // названия видимых столбцов через запятую
		if(cook && cook!=''){
			cook = cook.split(',');
			for(var i in h.gridSettings.columns)h.gridSettings.columns[i].visible = false;
			for(var i in cook){
				if(h.gridSettings.columns[cook[i]])
					h.gridSettings.columns[cook[i]].visible = true;
			}
		}
		
		if(!$.grid1602.hash[home]){
			$.grid1602.hash[home] = h;
			if(h.gridSettings.datasource && h.gridSettings.loadOnInit){
				this.gridLoad();
			}else{
				//$.grid1602.render(this);
			}
		}else{
			this.gridLocate(h.itemId);
		}
		return this;
		/* }}} */
	};
	$.fn.gridPage=function(k){/* {{{ */
		var h = this.getHash();
		if(!h){
			alert('ads');
			return this;
		}
		if(k!=0 && (k<0 || (k)*h.gridSettings.itemsOnPage>=h.totalCount)){
			return this;
		}
		h.gridSettings.page = k;
		$.grid1602.render(h.jqObject);
		return this;
		/* }}} */
	};
	$.fn.gridLoad=function(ds,clear,callback){/* {{{ */
		var h = this.getHash();
		var ath = this;
		
		if(typeof ds == 'function'){
			callback = ds;
			clear = true;
			ds = h.gridSettings.datasource;
		}else if(typeof ds == 'boolean'){
			callback = clear;
			clear = ds;
			ds = h.gridSettings.datasource;
		}else if(typeof ds == 'undefined'){
			ds = h.gridSettings.datasource;
			clear = true;
		}
		
		//if(!h.gridSettings.datasource)
			h.gridSettings.datasource = ds;
		
		if(typeof clear=='undefined')	clear = false;
		
		$.getJSON(ds+'&time='+escape(Date()),function(data){
			if(data.errcode && data.errcode!=0)return false;
			ath.gridAdd(data,clear);
			if(typeof h.gridSettings.on_load_complete == 'function')
				h.gridSettings.on_load_complete(h);
			if(typeof callback == 'function')callback(h);
		});
		return this;
		/* }}} */
	};
	$.fn.gridLoadCurrent=function(id){/* {{{ */
		var h = this.getHash();
		var ath = this;
		if(typeof id == 'undefined')id = h.itemId;
		t = '<td colspan="'+($('tr:eq(0) th',this).size())+'" style="background:eee;color:#555;font-weight:700;text-align:center;"><table><tr><td><img src="/vk/ok/css/tabs/loading.gif" /></td><td>пожалуйста, подождите, идет загрузка обновленных данных</td></tr></table></td>';
		$('tr[@itemId='+id+']',this).html(t);
		$.getJSON(h.gridSettings.datasource+'&id='+id,function(data){
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
		var h = this.getHash();
		var home = h.home;
		var ini = globals.data[home];
		if(h.gridSettings.cookieEnabled){
			ini.sortby = sb;;
			ini.sortdir = (h.gridSettings.sortDir==0)?128:0;
		}
		if(h.gridSettings.remotePaging){
			//h.msg('Запуск удаленной сортировки по столбцу '+sb);
			if(h.gridSettings.sortBy==sb){
				h.gridSettings.sortDir = (h.gridSettings.sortDir==0)?128:0;
			}else{
				h.gridSettings.sortBy=sb;
				h.gridSettings.sortDir = 0;
			}
			var col = h.gridSettings.columns[sb];
			if(!col || !col.sortIndex || col.sortIndex==0){
				alert('Невозможно отсортировать по выбранному столбцу');
				return this;
			}
			var sortIndex = col.sortIndex + h.gridSettings.sortDir;
			h.jqObject.gridLoad(h.gridSettings.datasource+'&locateid='+h.itemId+'&sort='+sortIndex+'&iop='+h.gridSettings.itemsOnPage,true);
		}else{
			//h.msg('Запуск локальной сортировки по  столбцу '+sb);
			if(h.gridSettings.sortBy==sb){
				h.order.reverse();
				$.grid1602.render(h.jqObject);
				h.jqObject.gridLocate();
			}else{
				h.gridSettings.sortBy=sb;
				h.jqObject.gridRefresh();
			}
		}
		return h.jqObject;
		/* }}} */
	};
	$.fn.gridFilter=function(fn,p){/* {{{ */
		if(typeof fn != 'function') return this;
		var h = this.getHash();
		h.f = {
			f:fn,
			p:p
		}
		this.gridRefresh();
		return this;
		/* }}} */
	};
	$.fn.gridManager=function(where){/* {{{ */
		$.grid1602.renderColumnManager(this,where);
		return this;
		/* }}} */
	};
	$.fn.gridRefresh=function(sort){/* {{{ */
		var h = this.getHash();
		if(h && h.f){
			for(var i in h.items){
				h.items[i].shortdata.hide1602 = !h.f.f(h.items[i],h.f.p);
			}
		}
		if(typeof sort == 'undefined')sort = true;
		if(sort) $.grid1602.sort(this);
		this.gridLocate();
		return this;
		/* }}} */
	};
	$.fn.gridLocate=function(itemId,ignore_remote_paging){/* {{{ */
		// debug: разобраться с локейтом по строке, чтобы число не воспринималось как строка
		// умолчания и инициализация
		var mode = 'int';
		var res = false;
		var h = this.getHash();
		var qsf = h.gridSettings.quickSearchField;
		var qst = h.gridSettings.quickSearchType;
		if(typeof ignore_remote_paging == 'undefined') ignore_remote_paging = false;
		if(typeof itemId == 'undefined')itemId = h.itemId;
		if(!isNaN(parseInt(itemId)))itemId = parseInt(itemId);
		
		// удаленный пейджинг
		if(h.gridSettings.remotePaging && !ignore_remote_paging){
			if(typeof itemId == 'string'){
				var ath = this; // keep this
				$.getJSON(h.gridSettings.datasource+'&locatestr='+itemId+'&time='+escape(Date()),function(data){
					/**
					*	@bug
					*		скорость выполнения
					*	@descrition
					*		далее порнография из-за того, 
					*		что неправильно написана функция грид адд, 
					*		вопиюще алогична функция гридлокейт 
					*		и вообще сегодня понедельник!
					*	@todo
					*		свести к одному вызову ath.gridAdd(data,true);
					*	@date
					*		Mon Oct 08 12:47:58 MSD 2007 @408 /Internet Time/
					*/
					ath.gridAdd(data,true);
					ath.gridLocate(itemId,true);
					ath.gridPage(data.page);
				});
			}else{
				this.gridPage(h.gridSettings.page);
			}
			return this;
		}
		// просто локейт
		if(typeof itemId == 'number'){
			for(var i in h.order)if(h.order[i]==itemId){
				res = i;
				break;
			}
		}else if(qsf){
			mode = 'str';
			var query = itemId;
			for(var i in h.order){
				var str = h.items[h.order[i]].shortdata[qsf];
				if(str && itemId){
					if(!qst){
						var fff = str.toLowerCase().match(itemId.toLowerCase());
					}else{
						if(str.toLowerCase().search(RegExp(itemId.toLowerCase(),'i')) == 0) var fff = '111';
						//console.log(str.toLowerCase().search(RegExp(itemId.toLowerCase(),'i')))
					}
					if(fff){
						res = i;
						itemId = h.order[i];
						break;
					}
				}
			}
		}
		
		if(res){
			h.itemId = itemId;
			this.trigger('scrollcursor',[h.items[itemId]]);
			var p = res/h.gridSettings.itemsOnPage;
			p = ((Math.ceil(p)-p)==0)?p:Math.ceil(p)-1;
			this.gridPage(p);
		}else{
			if(mode=='str' && typeof query == 'string' && query!= '')alert('Ничего не найдено!');
			this.gridPage(0);
		}
		return this;
		/* }}} */
	};
	$.fn.gridAddObject=function(x,clear){/* {{{ */
		if(typeof x !='object')return this;
		if(typeof clear =='undefined')clear = false;
		
		var exist = true;
		var h = 	this.getHash();
		var rp = 	h.gridSettings.remotePaging;
		
		if(h && clear){
			delete h.items;
			h.items = [];
			delete h.order;
			h.order = [];
			h.gridSettings.page=0;
			h.totalCount = 0;
		}
		
		if(typeof x.id=='undefined'){
			for(var i=0;i<x.length;i++){
				var id = parseInt(x[i].id);
				if(isNaN(id)){
					id = h.items.length;
					x[i].id = id;
				}
				if(typeof h.items[id] !='undefined')h.totalCount++;
				h.items[id] = new h.itemConst(x[i]);
			}
		}else{
			if(typeof h.items[id] !='undefined')h.totalCount++;
			var id = parseInt(x.id);
			if(isNaN(id)){
				id = h.items.length;
				x[i].id = id;
			}
			h.items[id] = new h.itemConst(x);
		}
		
		if(typeof x.id=='undefined' && x.length>1){
			this.gridRefresh();
		}else{
			this.gridRefresh(true);
		}
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
		**		'columns':	[],
		**		'data':		[],
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
		if(x.type=='undefined' || x.type !='grid1602'){
			alert('Нераспознанный ответ сервера (type "grid1602" expected, but type "'+x.type+'" found)');
			return this;
		}
		
		var exist = true;
		var h = 	this.getHash();
		var rp = 	h.gridSettings.remotePaging;
		/* }}} */
		/* Очистка грида, если clear {{{ */
		if(h && clear){
			delete h.items;
			h.items = [];
			delete h.order;
			h.order = [];
			h.gridSettings.page=0;
			h.totalCount = 0;
		}
		/* }}} */
		if(rp){
			if(!h.oneRecord){ // fix pager bug if one record has reported
				h.totalCount=x.totalCount;
				h.gridSettings.page = x.page;
			}
		}else{
			h.totalCount+=x.data.length;
		}
		for(var i=0;i<x.data.length;i++){
			var item = {};
			for(var index in x.columns)item[x.columns[index]] = x.data[i][index];
			var id = parseInt(item.id);
			for(var j in item)if(typeof item[j] == 'string')item[j] = unescape(item[j]);
			if(id==NaN) return this;
			if(exist)delete h.items[id]; // overwriting
			//$.dump(item);break;
			//$('#oksf_page_list').gridLoad(); alert($('#oksf_page_list').getHash().log.join('\n'));
			h.items[id] = new h.itemConst(item);
		}
		if(!h.gridSettings.pagingSupportEnabled){
			h.gridSettings.page = 0;
			h.gridSettings.__itemsOnPage = h.gridSettings.itemsOnPage;
			h.gridSettings.itemsOnPage = h.totalCount;
		}else{
			if(h.gridSettings.__itemsOnPage)
				h.gridSettings.itemsOnPage = h.gridSettings.__itemsOnPage;
		}
		//$.dump(h.items);
		if(x.data.length>1){
			this.gridRefresh();
		}else{
			/* if(!exist){
				if(!h.order)h.order = [];
				h.order.push(item.id);
			} */
			//this.gridRefresh(false);// обновление без сортировки
			this.gridRefresh(true);// обновление с сортировкой
		}
		return this;
		/* }}} */
	};
	$.fn.gridFocused=function(){/* {{{ */
		var h = this.getHash();
		return (h&&h.itemId)?h.items[h.itemId]:false;
		/* }}} */
	};
	$.fn.gridSelected=function(){/* {{{ */
		var h = this.getHash();
		var x = [];
		for(var i in h.items){
			if(h.items[i].shortdata.checked)x.push(h.items[i]);
		}
		return x;
		/* }}} */
	};
	$.fn.getHash=function(){/* {{{ */
		var id = parseInt(this.attr('iuid'));
		if(!id && this.parent().size()==0)return false;
		if($.grid1602.hash[id])return $.grid1602.hash[id];
		return this.parent().getHash();
		/* }}} */
	};
	$.grid1602={
		hash:[
		],
		handleClick: function(td){/* {{{ */
			var el = $(td);
			var row = el.parent();
			var tbody = row.parent();
			var grid = tbody.parent().parent().parent();
			var h = grid.getHash();
			if(!h){
				alert('No hash!');
				return;
			}
			$('.focused',tbody).removeClass('focused');
			row.addClass('focused');
			var id = row.attr('itemId');
			h.itemId=id;
			st = h.items[id];
			if(st)
				grid.trigger('scrollcursor',[st]);
			else
				alert(id);
			/* }}} */
		},
		handleAction: function(span,column){/* {{{ */
			span = $(span);
			var el = span.parent();
			var row = el.parent();
			var grid = row.parent().parent().parent().parent();
			var h = grid.getHash();
			if(!h){alert('No hash!');return;};
			var id = row.attr('itemId');
			var act = h.gridSettings.columns[column].action;
			if(h.items[id] && typeof act == 'function')act.apply(h.items[id].shortdata);
			/* }}} */
		},
		render: function(th,init){/* {{{ */
			if(typeof init == 'undefined') init = false;
			var h = 	th.getHash();
			var num = 	h.totalCount;
			var gs =	h.gridSettings;
			var page = 	gs.page;
			var sse = 	gs.sortSupportEnabled;
			var cols = 	gs.columns;
			var cord =	gs.colOrder;
			var rp = 	gs.remotePaging;
			var ds = 	gs.datasource;
			var showAll=gs.showAllColumns;
			var home =	th.attr('id');
			var buf2 =	'';
			var item =	null;
			var st =	'';
			var iop =	gs.itemsOnPage;
			var pdc =	gs.pagesDeltaCount;
			var check = gs.checkSupportEnabled;
			var ini = globals.data[home];
			/* Инициализация {{{ */
			if($('.grid',th).size()==0 || init){
				// первоначальная инициализация по умолчанию, если не было
				if(showAll && h.items[h.order[0]]){
					item = h.items[h.order[0]].shortdata;
					cols = {};
					for(var i in item){
						cols[i] = {caption:i,visible:true}
					}
					h.gridSettings.columns = cols;
				}
				if(!cord || cord.length==0){
					cord = [];
					for(var i in cols){
						if(typeof cols[i].visible == 'undefined' && !cols[i].system)cols[i].visible = true;
						if(cols[i].visible) cord.push(i);
					}
					h.gridSettings.colOrder = cord;
				}
				
				var tab = '';
				if(!h.gridSettings.hidePager)tab+='<div class="pager"></div>';
				
				var st = '';
				/* if(h.gridSettings.localScroll){
					var height = h.gridSettings.height?h.gridSettings.height:($('body').height()-300);
					st = 'style="height:'+height+';overflow:auto;"';
				} */
				tab+='<div '+st+'><table class="grid tab3d" cellspacing="0"><thead><tr>';
				if(check)tab+='<th width="20"><input type="checkbox" id="'+home+'_check_all" /></th>';
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
				if(!h.gridSettings.hideFooter)tab+='<div class="footer"></div>';
				th.html(tab);
			}
			/* }}} */
			/* Вывод списка страниц в формате: 1 ... i-pdc | i | i+pdc ... n	{{{ */
			if(!h.gridSettings.hidePager){
				var buf = []; // обнулить буфер
				var col = h.gridSettings.columns[h.gridSettings.sortBy];
				var sortIndex = 0;
				if(col)sortIndex = col.sortIndex + h.gridSettings.sortDir;
				for(var i=Math.max(0,page-pdc);i*iop<Math.min(num,page*iop+(pdc+1)*iop);i++){
					if(i==page)
						buf.push('<span style="color:red;border:1px solid #F00">&nbsp;'+(i+1)+'&nbsp;</span>');
					else{
						if(rp){
							buf.push('<span class="likealink" onclick="$(this).gridLoad(\''+ds+'&page='+i+'&sort='+sortIndex+'&iop='+iop+'&time='+escape(Date())+'\',true);">'+(i+1)+'</span>');
						}else{
							buf.push('<span class="likealink" onclick="$(this).gridPage('+i+');">'+(i+1)+'</span>');
						}
					}
				}
				buf = buf.join(' | ');
				// последняя страница
				if((page+pdc+1)*iop<num){
					if(rp){
						// buf='<span class="likealink" onclick="$(\'#'+home+'\').gridLoad(\''+ds+'&page='+i+'&iop='+iop+'&time='+escape(Date())+'\',true);">1</span>'+(((page-pdc)>1)?' ... ':' | ')+buf;
						buf+=(((page+pdc+2)*iop<num)?' ... ':' | ')+'<span class="likealink" onclick="$(this.parentNode.parentNode.parentNode).gridLoad(\''+ds+'&page='+(Math.ceil(num/iop)-1)+'&iop='+iop+'&sort='+sortIndex+'&time='+escape(Date())+'\',true);">'+(Math.ceil(num/iop))+'</span>';
					}else{
						buf+=(((page+pdc+2)*iop<num)?' ... ':' | ')+'<span class="likealink" onclick="$(this.parentNode.parentNode.parentNode).gridPage('+(Math.ceil(num/iop)-1)+');">'+(Math.ceil(num/iop))+'</span>';
					}
				}
				// первая страница
				if((page-pdc)>0){
					if(rp){
						buf='<span class="likealink" onclick="$(this.parentNode.parentNode.parentNode).gridLoad(\''+ds+'&page=0&iop='+iop+'&sort='+sortIndex+'&time='+escape(Date())+'\',true);">1</span>'+(((page-pdc)>1)?' ... ':' | ')+buf;
					}else{
						buf='<span class="likealink" onclick="$(this.parentNode.parentNode.parentNode).gridPage(0);">1</span>'+(((page-pdc)>1)?' ... ':' | ')+buf;
					}
				}
				if(rp){
					var legend = 'Показаны записи с '+(page*iop+1)+' по '+(Math.min((page+1)*iop,num))+' из '+num+
					' <span class="likealink" onclick="$(this.parentNode.parentNode.parentNode).gridLoad(\''+ds+'&page='+(page-1)+'&iop='+iop+'&sort='+sortIndex+'&time='+escape(Date())+'\',true);">'+
					'&lt;&lt; пред.'+'</span> ||| '+
					'<span class="likealink" onclick="$(this.parentNode.parentNode.parentNode).gridLoad(\''+ds+'&page='+(page+1)+'&iop='+iop+'&sort='+sortIndex+'&time='+escape(Date())+'\',true);">'+
					'след. &gt;&gt;'+
					'</span><br />Страницы: ';
				}else{
					var legend = 'Показаны записи с '+(page*iop+1)+' по '+(Math.min((page+1)*iop,num))+' из '+num+
					' <span class="likealink" onclick="$(this.parentNode.parentNode.parentNode).gridPage('+(page-1)+');">'+
					'&lt;&lt; пред.'+'</span> ||| '+
					'<span class="likealink" onclick="$(this.parentNode.parentNode.parentNode).gridPage('+(page+1)+');">'+
					'след. &gt;&gt;'+
					'</span><br />Страницы: ';
				}
				var result = i>1? legend+buf : '';
				if(h.gridSettings.showRefreshButton){
					if(h.gridSettings.datasource){
						result = '<table><tr><td><span class="likealink" onclick="$(this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).gridLoad();">Обновить</span></td><td>'+result+'</td></tr></table>';
					}else{
						result = '<table><tr><td><span class="likealink" onclick="$(this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).gridRefresh();">Обновить</span></td><td>'+result+'</td></tr></table>';
					}
				}
				
				$('.pager',th).html(result);
			}
			/* }}}  вывод страниц */
			/* Вывод таблицы {{{ */
			if(rp)
				var i=0;
			else
				var i=page*iop;
			var m = '';
			for(var j=0;j<iop;j++){
				if(typeof h.order == 'undefined' || !h.order[i+j])break; // прервать
				if(!h.items[h.order[i+j]])continue; // пропустить
				item = h.items[h.order[i+j]].shortdata;
				if(check){
					buf2 = '<td nofocus="true" width="20" align="center"><input type="checkbox" class="grid1602_checkbox" '+(item.checked?'checked':'')+' /></td>';
				}else
					buf2 = '';
				for(var k in cord){
					var clm = cols[cord[k]];
					if(clm && clm.visible){
						var cv = clm.calc?clm.calc(item[cord[k]],item):item[cord[k]];
						if(h.gridSettings.showEmptyCells && (typeof cv == 'undefined' || (typeof cv == 'string' && cv.replace(/ /,'') == '')))cv='&nbsp;';
						if(
								clm.action
								&& 
								(
									typeof clm.action_allowed !='function' || 
									clm.action_allowed.apply(item)
								)
						){
							var do_action = 
							'&nbsp;<span style="color:blue;cursor:pointer;font-size:14px;" \
							onclick="$.grid1602.handleAction(this,\''+cord[k]+'\');">'+
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
						if(cm_calc(gs,'nofocusable',[item])){
							buf2+='<td>'+cv+'</td>';
						}else{
							buf2+='<td onclick="$.grid1602.handleClick(this);">'+cv+'</td>';
						}
					}
				}
				var st='';
				if(typeof h.gridSettings.calculateRowStyle=='function'){
					try{
						st = h.gridSettings.calculateRowStyle(item);
					}catch(e){
						alert('Error in calc style: '+e);
					}
					if(st) st = ' style="'+st+'"';
				}
				
				if(item.id==h.itemId)
					m+='<tr itemId="'+item.id+'" class="focused"'+st+'>'+buf2+'</tr>';
				else
					m+='<tr itemId="'+item.id+'"'+st+'>'+buf2+'</tr>';
			}
			if(m==''){
				m = '<tr><td nofocus="true" align="center" colspan="'+(h.gridSettings.checkSupportEnabled?cord.length+1:cord.length)+'" style="padding:50px;color:#aaa;cursor:default;">'+h.gridSettings.emptyMessage+'</td></tr>';
			}
			//$('.grid tbody tr',th).remove();
			$('.grid tbody',th).html(m);
			/* }}} */
			/* Футер {{{ */
			if(typeof h.gridSettings.on_footer_calc == 'function' && !h.gridSettings.hideFooter){
				$('.footer',th).html(h.gridSettings.on_footer_calc(h));
			}
			/* }}} */
			/* События {{{ */
			if(check){
				$('.grid1602_checkbox',th).click(function(){
					$(this).attr('disabled',true);
					var ch = $(this).attr('checked')?true:false;
					var id = parseInt($(this).parent().parent().attr('itemId'));
					if(isNaN(id))$(this).attr('checked',false);
					h.items[id].shortdata.checked = ch;
					if(ch)h.countChecked++; else h.countChecked--;
					$('#'+home+'_check_all',th).attr('checked',h.countChecked==h.totalCount);
					$(this).attr('disabled',false);
				});
				$('#'+home+'_check_all',th).click(function(){
					$(this).attr('disabled',true);
					var checkedAll = $(this).attr('checked')?true:false;
					if(checkedAll){
						h.countChecked = h.totalCount;
					}else{
						h.countChecked = 0;
					}
					$('.grid1602_checkbox',th).attr('checked',checkedAll);
					for(var i in h.items)h.items[i].shortdata.checked = checkedAll;
					$(this).attr('disabled',false)
				});
			}
			/* }}} */
			/* }}} */
		},
		renderColumnManager: function(th,where){/* {{{ */
			//where
			var h = th.getHash();
			var cols = h.gridSettings.columns;
			var home = th.attr('iuid');
			var t = '';
			for(var i in cols){
				if(cols[i].system) continue;
				t+='<input type="checkbox" name="'+i+'" id="'+home+'_'+i+'" '+(cols[i].visible?'checked':'')+' />'+
				'<label for="'+home+'_'+i+'">'+((cols[i].caption&&cols[i].caption!='')?cols[i].caption:i)+'</label><br />';
			}
			t+='Количество записей на страницу <input value="'+(h.gridSettings.itemsOnPage)+'" id="'+home+'_iop"  /><br />';
			t+='<input type="checkbox" id="'+home+'_localScroll" '+(h.gridSettings.localScroll?'checked':'')+' />'+
				'<label for="'+home+'_localScroll">Внутренний скроллинг таблицы</label><br />';
			t+='<input type="checkbox" id="'+home+'_checkSupportEnabled" '+(h.gridSettings.checkSupportEnabled?'checked':'')+' />'+
				'<label for="'+home+'_checkSupportEnabled">Показывать чекбоксы</label><br />';
			
			t+='<input type="button" value="Применить" onclick="$.grid1602.saveColumnsVisibility(\''+home+'\',\''+where+'\');" />';				
			$('#'+where).html(t);
			/* }}} */
		},
		saveColumnsVisibility: function(what,where){/* {{{ */
			var h = $('#'+what).getHash();
			var ini = globals.data[h.home];
			var t = [];
			
			$('#'+where+' input').each(function(i,elem){
				var n = $(elem).attr('name');
				var v = $(elem).attr('checked');
				if(h.gridSettings.columns[n])h.gridSettings.columns[n].visible = !!v;
				if(v)t.push(n);
			});
			//delete 
			h.gridSettings.colOrder = [];
			ini.visible = (t.length==0)?'':t.join(',');
			h.gridSettings.itemsOnPage = $('#'+what+'_iop').val();
			if(h.gridSettings.itemsOnPage>50)h.gridSettings.itemsOnPage = 50;
			ini.iop = h.gridSettings.itemsOnPage;
			h.gridSettings.localScroll = $('#'+what+'_localScroll').attr('checked');
			ini.ls = h.gridSettings.localScroll;
			h.gridSettings.checkSupportEnabled = $('#'+what+'_checkSupportEnabled').attr('checked');
			ini.cse = h.gridSettings.checkSupportEnabled;
			if(t.length>0){
				for(var i in h.gridSettings.columns)h.gridSettings.columns[i].visible = false;
				for(var i in t){
					if(h.gridSettings.columns[t[i]])
						h.gridSettings.columns[t[i]].visible = true;
				}
			}
			$.grid1602.render($('#'+what),true); // вторым параметром передаем true чтобы пересоздать заголовки грида
			/* }}} */
		},
		sort: function(th){/* {{{ */
			h = $.grid1602.hash[th.attr('iuid')];
			
			var sb = h.gridSettings.sortBy;
			var sd = h.gridSettings.sortDir;
			h.order = [];
			for(var i in h.items)
				if(!h.items[i].shortdata['hide1602'])
					h.order.push({id:i,s:h.items[i].shortdata[sb]});
			//if(!h.gridSettings.remotePaging)
			h.order.sort(function(x,y){
				if(x.s>y.s)return 1;
				if(x.s==y.s && h.items[x.id] && h.items[x.id].fio){ // если равны, сравнить по фамилии (надо выйти на объект)
					var f1 = h.items[x.id].fio;
					var f2 = h.items[y.id].fio;
					if(f1>f2)return 1;
					if(f1==f2)return 0;
				}
				return -1;
			});
			for(var i in h.order)h.order[i] = h.order[i].id;
			if(sd>127)h.order.reverse();
			if(!h.gridSettings.remotePaging)h.totalCount = h.order.length;
			/* }}} */
		}
	}
})(jQuery);
