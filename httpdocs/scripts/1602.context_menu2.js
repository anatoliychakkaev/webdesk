context_menu = function(items){/* {{{ */
	this.items = items;
	this.id = _all_menus.length;
	_all_menus.push(this);
	for(var i in this.items){
		var item = this.items[i];
		if(typeof item.submenu == 'object' && item.submenu.length>0){
			item.submenu = new context_menu(item.submenu);
		}
		if(typeof item.buildSubmenu == 'function'){
			item.submenu = new context_menu([]);
		}
	}
	/* }}} */
}

context_menu.prototype = {
	show: function(context,position){/* {{{ */
		if(typeof position == 'undefined')position = 'right-top'
		var div = $('#menu_'+this.id);
		if(div.size()==0){
			$('body').append('<div id="menu_'+this.id+'" class="menuBlock"></div>');
			div = $('#menu_'+this.id);
		}
		this.render(div);
		var d_w = div.width();
		var d_h = div.height();
		
		var b_w = 0, b_h = 0;
		if (typeof(window.innerWidth) == 'number') {
			// дл€ всего кроме MSIE
			b_w = window.innerWidth;
			b_h = window.innerHeight;
		} else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
			// IE6+
			b_w = document.documentElement.clientWidth;
			b_h = document.documentElement.clientHeight;
		} else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
			// IE4
			b_w = document.body.clientWidth;
			b_h = document.body.clientHeight;
		}
		
		var scrX = 0, scrY = 0;
		if(typeof window.pageYOffset == 'number') {
			// Netscape и его родственники
			scrY = window.pageYOffset;
			scrX = window.pageXOffset;
		} else if (document.body && (document.body.scrollLeft || document.body.scrollTop)) {
			// DOM
			scrY = document.body.scrollTop;
			scrX = document.body.scrollLeft;
		} else if (document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop)) {
			// IE6
			scrY = document.documentElement.scrollTop;
			scrX = document.documentElement.scrollLeft;
		}
		if(d_w<100){
			div.width(100);
			d_w = 100;
		}
		var off = get_offset(context);
		switch(position){
			case 'right-top':
				off.y-=2;
				off.x+=context.offsetWidth;
				if(off.y+d_h>b_h+scrY)off.y-=d_h;
			break;
			case 'drop-down':
				off.y+=context.offsetHeight;
				off.x+=0;
				if(off.y+d_h>b_h+scrY)off.y-=(d_h+context.offsetHeight+4);
			break;
			case 'right-down':
				off.y+=context.offsetHeight;
				off.x+=context.offsetWidth;
				if(off.y+d_h>b_h+scrY)off.y-=(d_h+context.offsetHeight+4);
			break;
		}
		
		div.css({
			'top':off.y,
			'left':off.x
		});
		div.show();
		this.showed = true;
		return true;
		/* }}} */
	},
	hide: function(){/* {{{ */
		this.hideSubmenus();
		var div = $('#menu_'+this.id);
		div.hide();
		this.showed = false;
		/* }}} */
	},
	itemByName:function(name){/* {{{ */
		var path = name.split('/');
		var res;
		if(path.length==1){
			for(var i in this.items)
				if(this.items[i].name==path[0])return this.items[i];
			return false;
		}else{
			var item = this.itemByName(path.shift());
			if(item.submenu && item.submenu.length>0)
				return item.submenu.itemByName(path.join('/'));
			else
				return false;
		}
		return false;
		/* }}} */
	},
	render: function(jDiv){/* {{{ */
		html = '';
		for(var i in this.items){
			var item = this.items[i];
			if(
					actions && 
					typeof actions.isHidden == 'function' && 
					actions.isHidden(item)
			)continue;
			var maybesub;
			if(typeof item.submenu == 'string' || item.submenu && item.submenu.items.length>0){
				maybesub = ' menuItemSub';
			}else{
				maybesub = '';
			}
			var txt;
			if(typeof item.checked == 'boolean'){
				txt = '<input type="checkbox" '+(item.checked?'checked':'')+' onchange="_all_menus['+this.id+'].handleClick(\''+item.name+'\',this)" id="menu_checkbox_'+item.name+'" /> <label for="menu_checkbox_'+item.name+'">'+item.text+'</label>';
			}else{
				txt = item.text;
			}
			if(
				(
					item.action && actions && 
					typeof actions.isDisabled == 'function' && 
					actions.isDisabled(item)
				)|| item.text=='-'
			)
				html+='<div class="menuItemDisabled'+maybesub+'" onmouseover="_all_menus['+this.id+'].handleOver(\''+item.name+'\',this,true)" onmouseout="_all_menus['+this.id+'].handleOut(\''+item.name+'\',this,true)">'+(item.text=='-'?'<hr style="margin:0 0 0 0;width:100px" align="center" />':txt)+'</div>';
			else
				html+='<div class="menuItem'+maybesub+'" '+((typeof item.checked != 'boolean')?'onclick="_all_menus['+this.id+'].handleClick(\''+item.name+'\',this)"':'')+' onmouseover="_all_menus['+this.id+'].handleOver(\''+item.name+'\',this)" onmouseout="_all_menus['+this.id+'].handleOut(\''+item.name+'\',this)">'+txt+'</div>';
		}
		jDiv.html(html);
		/* }}} */
	},
	handleOver: function(itemName,context,ignoreClass){/* {{{ */
		var t = this;
		globals.menuOverActual = false;
		clearTimeout(globals.menuOverTimeout);
		globals.menuOverActual = true;
		globals.menuOverTimeout = setTimeout(function(){
			if(!globals.menuOverActual)return;
			var item = t.itemByName(itemName);
			_all_menus[t.id].hideSubmenus(itemName);
			if(item.submenu && typeof item.submenu != 'string' && !item.submenu.showed){
				_all_menus[item.submenu.id].show(context);
			}
			if(typeof item.submenu == 'string'){
				var txt = context.innerHTML;
				context.innerHTML = '«агрузка...';
				$.getJSON(item.submenu,function(d){
					item.submenu = new context_menu(d);
					context.innerHTML = txt;
					item.submenu.applyContextParams(item.contextParam);
					t.handleOver(itemName,context);
				});
				item.submenu = null;
			}
			_can_hide_menus = false;
		},300);
		$(context).parent().find('.menuItemHover').removeClass('menuItemHover');
		if(!ignoreClass)$(context).addClass('menuItemHover');
		/* }}} */
	},
	handleOut: function(itemName,context,ignoreClass){/* {{{ */
		globals.menuOverActual = false;
		clearTimeout(globals.menuOverTimeout);
		var item = this.itemByName(itemName);
		if(!item.submenu || !item.submenu.showed || !ignoreClass){
			$(context).removeClass('menuItemHover');
		}
		_can_hide_menus = true;
		/* }}} */
	},
	handleClick: function(itemName,context){/* {{{ */
		var item = this.itemByName(itemName);
		if(item.action && actions[item.action] && (actions[item.action].enabled || typeof actions[item.action] == 'function')){
			if(typeof item.checked == 'boolean'){
				item.checked = $('#menu_checkbox_'+itemName).get(0).checked;
			}
			var call = false;
			if(typeof actions[item.action] == 'function'){
				call = actions[item.action];
			}else if(typeof actions[item.action].execute == 'function'){
				call = actions[item.action].execute;
			}
			if(!call)return;
			var result = call(item);
			if(typeof result == 'undefined' || result){
				_can_hide_menus = true;
				hideAllMenus();
			}
		}
		/* }}} */
	},
	hideSubmenus: function(exceptName){/* {{{ */
		for(var i in this.items){
			var item = this.items[i];
			if(item.name != exceptName && item.submenu && item.submenu.showed)item.submenu.hide();
		}
		/* }}} */
	},
	applyContextParams: function(param){/* {{{ */
		for(var i in this.items){
			var item = this.items[i];
			item.contextParam = param;
			//alert(item.name+': '+(typeof item.onParamApplied));
			if(typeof item.onParamApplied == 'string' && typeof actions[item.onParamApplied] == 'function')actions[item.onParamApplied](item,param);
			if(item.submenu && typeof item.submenu != 'string' && item.submenu.items.length>0)item.submenu.applyContextParams(param);
		}
		/* }}} */
	},
	buildSubmenus: function(){/* {{{ */
		for(var i in this.items){
			var item = this.items[i];
			if(item.submenu && typeof item.submenu != 'string'){
				if(typeof item.buildSubmenu == 'function'){
					item.submenu.items = item.buildSubmenu(item.contextParam);
				}
				item.submenu.buildSubmenus();
			}
		}
		/* }}} */
	}
}

_all_menus = [];
_can_hide_menus = true;

function get_offset(el){
    if(el.offsetParent){
        var of = get_offset(el.offsetParent);
        of.x+=el.offsetLeft;
        of.y+=el.offsetTop;
        return of;
    }else{
        return {
            x: el.offsetLeft,
            y: el.offsetTop
        }
    }
}

function hideAllMenus(){
	if(_can_hide_menus){
		for(var i in _all_menus)if(_all_menus[i].showed)_all_menus[i].hide();
	}
	if(typeof _wait_for_showing == 'function'){
		_wait_for_showing();
		_wait_for_showing = null;
	}
}

function showMenu(menu,context,param,style){
	if(typeof menu != 'object')return;
	_wait_for_showing = function(){
		if(context.className!='menuBlock' && typeof actions == 'object' &&
		typeof actions.update == 'function'){
			actions.update(param);
		}
		menu.applyContextParams(param);
		menu.show(context,style);
	}
}
