/*
	Function: widgetShow
	Показывает виджеты, инициализирует компонент
*/
$.widgets = {
	panels: [],
	getPanel: function(jq){// Инициализация и получение объекта - панели
		var uid = jq.attr('uid');
		if(!uid){
			uid = $.widgets.panels.length;
			jq.attr('uid',String(uid));
			var pane = {
				active: null,
				widgets: {},
				mode: 'hideSingle',
				uid: uid,
				visibleWidgets: 0
			};
			$.widgets.panels.push(pane);
		}else{
			var pane = $.widgets.panels[uid];
		}
		return pane;
	}
}
$.fn.widgetShow = function(w){
	var pane = $.widgets.getPanel(this);
	var prevVisible = pane.visibleWidgets;
	// Определение чего от нас хотят
	if(typeof w == 'object' && typeof w.constructor != Array){ // Добавляем новый виджет
		var id = 'wp'+pane.uid+'_'+w.name;
		w.hidden = false;
		w.jqHeader = $('<div class="widgetHeader" onclick="$(this).parent().widgetActivate(\''+w.name+'\');">'+(w.title?w.title:'')+'</div>');
		w.jqContent = $('<div class="widgetContent"></div>');
		pane.widgets[w.name] = w;
		pane.visibleWidgets++;
		this.append(w.jqHeader).append(w.jqContent);
		if(pane.mode == 'showAll' || (pane.mode == 'hideSingle' && prevVisible>0))
			w.jqHeader.show();
	}else{ // Показать виджет(ы)
		if(typeof w == 'string')w = w.split(',');
		for(var i=1;i<arguments.length;i++)w.push(arguments[i]);
		for(var i in w){
			var wi = pane.widgets[w[i]];
			if(!wi)continue;
			if(wi.hidden){
				wi.hidden = false;
				pane.visibleWidgets++;
			}
			if(pane.mode == 'showAll' || (pane.mode == 'hideSingle' && prevVisible>0))
				wi.jqHeader.show();
		}
	}
	if(pane.mode=='hideSingle' && prevVisible<=1 && pane.visibleWidgets>1){
		for(var i in pane.widgets){
			var wi = pane.widgets[i];
			if(!wi.hidden)wi.jqHeader.show();
		}
	}
	if(!pane.active){
		var x = null;
		for(var i in pane.widgets){if(pane.widgets[i].hidden)continue;x = i;break;};
		if(x)this.widgetActivate(x);
	}
	return this;
}
$.fn.widgetHide = function(w){
	var ret;
	var pane = $.widgets.getPanel(this);
	var prevVisible = pane.visibleWidgets;
	if(typeof w == 'string'){
		ret = w;
		w = w.split(',');
	}else if(typeof w == 'undefined'){
		w = [];
		for(var i in pane.widgets)if(!pane.widgets[i].hidden)w.push(pane.widgets[i].name);
		ret = w.join(',');
	}
	for(var i=1;i<arguments.length;i++)w.push(arguments[i]);
	for(var i in w){
		var wi = pane.widgets[w[i]];
		if(!wi)continue;
		if(!wi.hidden){
			wi.hidden = true;
			pane.visibleWidgets--;
		}
		wi.jqHeader.hide();
		wi.jqContent.hide();
		if(pane.active==wi.name){
			pane.active = null;
		}
	}
	if(pane.mode=='hideSingle' && prevVisible>1 && pane.visibleWidgets == 1){
		for(var i in pane.widgets){
			var wi = pane.widgets[i];
			if(!wi.hidden)wi.jqHeader.hide();
		}
	}
	if(!pane.active){
		var x = null;
		for(var i in pane.widgets){if(pane.widgets[i].hidden)continue;x = i;break;};
		if(x)this.widgetActivate(x);
	}
	return ret;
}
$.fn.widgetActivate = function(what){
	var pane = $.widgets.getPanel(this);
	var a = pane.widgets[pane.active];
	//if(a)a.jqContent.hide();
	pane.active = what;
	a = pane.widgets[what];
	if(a)a.jqContent.show();
}
