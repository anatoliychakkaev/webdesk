/*global cm_img, globals, MenuItem, jQuery, window, console, document, alert, clearTimeout*/

(function ($) {

	if (typeof cm_img !== 'function') {
		cm_img = function (img, alt, style) {/* {{{ */
			if (alt) {
				alt = alt.replace(/"/, '\"');
			}
			return '<img src="_images/silk/' + img + (img.search(/\.(gif|jpg|jpeg)$/i) === -1?'.png':'') +
			'" width="16" height="16" alt="' + (alt?alt:'img') + '" ' +
			(alt?'title="' + alt + '"':'') +
			(style?' style="' + style + '"':'') + ' />';
			/* }}} */
		};
	}

	if (typeof globals === 'undefined') {
		globals = {
			activeModule: window
		};
	}
	
	$.cmenu = {
		c: [],
		init: function (id, act) {		/* Создание объекта - меню	{{{ */
			var x = {
				cn: 'cmenu',
				id: id,
				jq: $('<div iuid="' + id + '" class="cmenu"></div>'),
				r: false
			};
			x[typeof act === 'function'?'f':'a'] = act;
			
			$('body').append(x.jq);
			return x;
			/* }}} */
		},
		render: function (x) {			/* Отрисовка пунктов меню	{{{ */
			var h = '', i, a, strAsd;
			if (typeof x.f === 'function') {
				if (typeof x.caller !== 'object') {
					return false;
				}
				x.r = x.f(x);
				if (typeof x.r === 'object') {
					x.a = x.r;
					x.r = false;
				} else {
					x.r = !x.r;
				}
			}
			if (x.r) {
				return false;
			}
			x.r = true;
			strAsd = ' onmouseover="$.cmenu.to=setTimeout(function(){var m = $.cmenu.getMenu(' + x.id + ');m && m.sub && $.cmenu.hideMenu(m.sub);},300);" onmouseout="clearTimeout($.cmenu.to);" ';
			for (i in x.a) { 
				if (x.a[i]) {
					a = x.a[i];
					if (a === '-') {                        
						h += '<hr' + ($.browser.msie?' style="width:50px;align:center;"':'') + '/>';
						continue;
					}
					if (a.constructor === Array) {
						/*
						a = (function (x) {
							return new MenuItem(x[0], x[1], x[2], x[3]);
						})(a);
						*/
						a = new MenuItem(a[0], a[1], a[2], a[3]);
						x.a[i] = a;
					}
					// Условие невидимости действия
					if (typeof a.visible !== 'undefined' && !a.visible ||
						(
							typeof a.acid !== 'undefined' &&
							$.inArray(a.acid, globals.accessedActions || [])
						)
					) {
						continue;
					}
					
					if (a.submenu && (!a.submenu.cn || a.submenu.cn !== 'cmenu')) {
						a.submenu = this.getMenu(a.submenu);
					}
					
					h += '<div class="cmenuItem" ' +
						(a.disabled?
							// Недоступный элемент
							'style="color:#808080;" ':
							// Доступный элемент
							'onclick="$.cmenu.exec(' + x.id + ',\'' + i + '\');" ' +
							(a.submenu?
								// Есть подменю
								this.getCaller(a.submenu, 'hovertimeout'):
								// Нет подменю
								strAsd)
						) +
					'>' +
					cm_img(a.icon?a.icon:'undefined') + ' ' + a.caption +
					(a.submenu?cm_img('page-next.gif', '', 'position:absolute;right:0px;vertical-align:middle;'):'') + '</div>';
				}
			}
			x.jq.html(h);
			/* }}} */
		},
		exec: function (id, act) {		/* Выполнение действия	{{{ */
			var m = $.cmenu.c[id];
			if (!m) {
				alert('Menu not found');
				return false;
			}
			if (!m.a || !m.a[act]) {
				alert('Action not found');
				return false;
			}
			if (typeof m.a[act].execute === 'function' && !m.a[act].disabled) {
				m.a[act].execute.apply(globals.activeModule, [m.a[act], m, m.p]);
				console.log(m);
			}
			/* }}} */
		},
		getMenu: function (acts) {	/* Получение меню из коллекции	{{{ */
			var t = typeof acts, id;
			//console.log('getMenu(',acts,':',t,')');
			if (t.search(/function|object|undefined/) !== -1) { // Инит менюшки по (не)известным действиям
				id = this.c.length;
				this.c.push({
					id: id
				});
				this.c[id] = this.init(id, acts);
				return this.c[id];
			} else { // Выбор из коллекции (acts - число или строка)
				return this.c[acts];
			}
			/* }}} */
		},
		show: function (m, p) {			/* Показ меню m около родительского объекта p	{{{ */
			var jqp = $(p), pm, cmenuOffParent, cmenuWidth, cmenuHeight,
			w = 0, h = 0, sx = 0, sy = 0, winHeight, winWidth, off;
			if (typeof m !== 'object') {
				m = this.getMenu(m);
			}
			if (m.v && m.caller === p) {
				return false;
			}
			if (!this.hideBinded) {
				this.hideBinded = true;
				$().bind('click', this.hideAll);
			}
			m.caller = p;
			if (m.sub) {
				this.hideMenu(m.sub);
			}
			
			// Если вызвавший меню элемент - элемент меню (то есть показываем подменю)
			// то надо оставить p подсвеченным (класс cmenuItemWithSub);
			// также надо установить родительскому меню ссылку на дочернее, а дочернему - на родителя
			// и еще - если у нашего меню уже есть подменю - скрыть его
			if (jqp.hasClass('cmenuItem') && !jqp.hasClass('cmenuItemWithSub')) {
				jqp.addClass('cmenuItemWithSub');
				
				pm = $.cmenu.getMenu($(p.parentNode).attr('iuid'));
				if (pm) {
					if (pm.sub && pm.sub !== m) {
						$.cmenu.hideMenu(pm.sub);
						if ($.cmenu.to) {
							clearTimeout($.cmenu.to);
							delete $.cmenu.to;
						}
					}
					pm.sub = m;
					m.parentMenu = pm;
				}
			}
			this.render(m);
			
			m.p = this.getPath(p);
			if (m.jq[0].offsetParent !== m.p[0].offsetParent) {
				m.jq.appendTo(m.p[0].offsetParent);
			}
			
			// Показ меню
			if (m.jq.css('display') === 'none') {
				m.jq.show();
			}
			
			// Вычисление параметров меню
			cmenuOffParent = m.jq[0].offsetParent;
			cmenuWidth = m.jq[0].offsetWidth;
			cmenuHeight = m.jq[0].offsetHeight;
			
			// Вычисляем размеры видимой части экрана (этот код можно сделать общим)
			if (typeof(window.innerWidth) === 'number') {// не msie
				w = window.innerWidth;
				h = window.innerHeight;
			} else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
				w = document.documentElement.clientWidth;
				h = document.documentElement.clientHeight;
			}
			if (typeof window.pageYOffset === 'number') {
				sx = window.pageXOffset;
				sy = window.pageYOffset;
			} else if (document.body && (document.body.scrollLeft || document.body.scrollTop)) {
				sx = document.body.scrollLeft;
				sy = document.body.scrollTop;
			} else if (document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop)) {
				sx = document.documentElement.scrollLeft;
				sy = document.documentElement.scrollTop;
			}
			winHeight = h + sy;
			winWidth = w + sx;
			
			// Получаем абсолютное смещение элемента, вызвавшего меню (p)
			// относительно cmenuOffParent
			off = this.getOffset(p, cmenuOffParent);
			
			// Очень важный момент - в какую сторону показывать меню (по горизонтали)
			// Задача - если есть место чтобы показать справа от объекта
			//	- показываем справа: left = off.x+p.offsetWidth
			// если места справа нет
			// - показываем слева: left = off.x-cmenuWidth
			// Наличие места вычисляем исходя из
			// - размеров блока меню (cmenuWidth)
			// - смещению (off.x) родительского элемента относительно общего offsetParent-а (cmenuOffParent)
			// - ширине экрана (winWidth)
			m.jq.css('left', cmenuOffParent.offsetLeft + off.x + p.offsetWidth + cmenuWidth > winWidth?off.x - cmenuWidth:off.x + p.offsetWidth);
			// Еще один очень важный момент - в какую сторону показывать меню (по вертикали)
			// Задача - если есть место чтобы показать снизу от объекта
			//	- показываем снизу: top = off.y-2
			// если места снизу нет 
			// - показываем сверху: top = off.y-cmenuHeight+p.offsetHeight+4
			// Наличие места вычисляем исходя из
			// - размеров блока меню (cmenuHeight)
			// - смещению (off.y) родительского элемента относительно общего offsetParent-а (cmenuOffParent)
			// - высоте экрана (winHeight)
			m.jq.css('top', cmenuOffParent.offsetTop + off.y + cmenuHeight > winHeight?off.y - cmenuHeight + p.offsetHeight + 4:off.y - 2);
			// Устанавливаем флаг видимости меню
			m.v = true;
			/* }}} */
		},
		getPath: function (el) {		/* Возвращаем цепочку элементов вызвавших меню	{{{ */
			var p = [];
			while (el) {
				p.push(el);
				if (!$(el).hasClass('cmenuItem')) {
					break;
				}
				console.log(el);
				el = $.cmenu.getMenu(parseInt($(el).parent().attr('iuid'), 0)).caller;
			}
			return p.reverse();
			/* }}} */
		},
		hideAll: function () {			/* Скрыть все отображённые меню		{{{ */
			var len, i;
			// Если блокировано сокрытие меню - выйти
			if ($.cmenu.lockHiding) {
				return false;
			}
			// Отбиндить сокрытие всех меню по клику
			$().unbind('click', $.cmenu.hideAll);
			$.cmenu.hideBinded = false;
			// Скрыть менюшки
			len = $.cmenu.c.length;
			for (i = 0; i < len; i += 1) {
				$.cmenu.hideMenu($.cmenu.c[i]);
			}
			/* }}} */
		},
		hideMenu: function (m) {		/* {{{ */
			if (!m || !m.v) {
				return;
			}
			m.v = false;
			this.hideMenu(m.sub);
			if (m.caller) {
				$(m.caller).removeClass('cmenuItemWithSub');
			}
			m.jq.hide();
			/* }}} */
		},
		getCaller: function (id, event) {/* Получить строку для вызова меню (атрибуты)	{{{ */
			var m = false;
			if (typeof id === 'object') {
				m = true;
				id = id.id;
			}
			if (typeof id !== 'number') {
				console.error('$.cmenu.getCaller - unexpected type of first parameter (' + (typeof id) + '), expecting number');
				return '';
			}
			if (event === 'click') {
				return 'onclick="$.cmenu.show(' + id + ',this);$.cmenu.lockHiding=true;" onmouseout="$.cmenu.lockHiding=false;"';
			} else if (event === 'hovertimeout') {
				return 'onmouseover="var t=this;$.cmenu.to=setTimeout(function(){$.cmenu.show(' + id + ',t);$.cmenu.lockHiding=true;},100);" onmouseout="clearTimeout($.cmenu.to);$.cmenu.lockHiding=false;"';
			}
			
			/* }}} */
		},
		getOffset: function (el, stop) {/* Смещение el относительно stop	{{{ */
			//console.log(el.tagName,el.offsetLeft,el.offsetTop);
			if (el.offsetParent && el.offsetParent !== stop) {
				var of = this.getOffset(el.offsetParent, stop);
				of.x += el.offsetLeft;
				of.y += el.offsetTop;
				return of;
			} else {
				return {
					x: el.offsetLeft,
					y: el.offsetTop
				};
			}
			/* }}} */
		}
	};
	
	$.fn.bindMenu = function (event, menu) {/* jQuery - плагин для бинда менюшек	{{{ */
		if (arguments.length === 1) {
			menu = event;
			event = 'click';
		}
		if (!menu.jq) {
			menu = $.cmenu.getMenu(menu);
		}
		return this.each(function () {
			$(this).bind(event, function () {
				$.cmenu.lockHiding = true;
				$.cmenu.show(menu, this);
			})
			.bind('mouseout', function () {
				$.cmenu.lockHiding = false;
			});
		});
		/* }}} */
	};
	
	MenuItem = function (caption, icon, execute, submenu) {
		if (caption.search(/^!/) !== -1) {
			this.disabled = true;
			caption = caption.substr(1);
		}
		this.caption = caption;
		this.icon = icon;
		this.execute = execute;
		this.submenu = submenu;
	};

})(jQuery);
