$.act1602 = {
	//_template_group: '<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td colspan="3"><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td><img src="/images/site/form/left-top-%%%ico.png" width="37" height="35"></td><td class="caption" style="width:100%;" onClick="$(\'#%%%id\').toggle();">%%%cap</td><td><img src="/images/site/right-top.png" width="15" height="35"></td></tr></table></td></tr><tr><td class="formleft"><img src="/images/site/left.png" width="15" height="35"></td><td class="formtext" width="100%"><div id="%%%id">%%%pref<br/> %%%items %%%suff</div></td><td class="formright"><img src="/images/site/right.png" width="15" height="35"></td></tr><tr><td><img src="/images/site/left-bottom.png" width="15" height="19"></td><td class="formbottom"><img src="/vk/images/site/bottom.png" width="15" height="19"></td><td><img src="/images/site/right-bottom.png" width="15" height="19"></td></tr></table>',
	_template_group: '<div class="actionGroup" onclick="$(\'#{id}\').toggle();$.act1602[\'{gid}\'].groups[\'{gname}\']._collapsed=!$.act1602[\'{gid}\'].groups[\'{gname}\']._collapsed;"><img src="{ico}" width="16" height="16" /><span style="position:relative;top:-3px;margin-left:6px;">{cap}</span></div><div style="display:{displ};border:1px solid #449;border-top:0px;margin:0px;padding:0px" id="{id}">{pref}<table cellspacing="5">{items}</table>{suff}</div>',
	_template_item: '<tr><td>{ico}</td><td><span class="likealink" onClick="{act}">{cap}</span></td></tr>',
	_disabled_item: '<tr><td>{ico}</td><td><span style="color:#888;">{cap}</span></td></tr>',
	_execAction: function(id,group,action){
		var a = $.act1602[id].groups[group].acts[action];
		if(!a || a.disabled) return false;
		if(typeof a.execute == 'function')a.execute.apply(globals.activeModule);
	}
};
/*
в группе:
%%%ico
%%%id
%%%pref
%%%items
%%%suff 
%%%displ
%%%gid
%%%gname

в элементе:
%%%act
%%%cap
*/
$.fn.renderActions = function(a,g){
	var id = this.attr('id');
	if(typeof $.act1602[id] == 'undefined')$.act1602[id] = {};
	if(typeof a=='undefined')a=$.act1602[id].actions;
	else $.act1602[id].actions = a;
	if(typeof g=='undefined')g=$.act1602[id].groups;
	else $.act1602[id].groups = g;
	if(typeof a=='undefined')return this;
	if(typeof g == 'undefined'){
		$.act1602[id].groups = {};
		for(var i in a){
			if(!a[i].group)a[i].group = 'noGroup';
			if(typeof $.act1602[id].groups[a[i].group] == 'undefined')
				$.act1602[id].groups[a[i].group] = {acts:[]};
		}
		g = $.act1602[id].groups;
	}
	for(var gid in g){
		if(typeof g[gid]=='string'){
			var tg = g[gid].split('|');
			g[gid] = {
				caption: $.trim(tg[0]),
				ico: $.trim(tg[1])
			}
		}
		if(g[gid].acts)delete g[gid].acts;
		g[gid].acts = [];
	}
	for(var i in a){
		if(typeof a[i]!='object'||typeof a[i].caption=='undefined')continue;
		if(!g[a[i].group])g[a[i].group] = {acts:[]};
		g[a[i].group].acts.push(a[i]);
	}
	// render
	var t = '';
	var aa = globals.accessedActions;
	for(var i in g){
		var items_html = '';
		for(var j in g[i].acts){
			var act = g[i].acts[j];
			if(typeof act.visible != 'undefined' && !act.visible)continue;
			if(aa && (typeof act.acid != 'undefined') && $.inArray(act.acid,aa)==-1)continue;
			items_html+= (act.disabled?$.act1602._disabled_item:$.act1602._template_item)
			.set('ico',act.icon?'<img src="'+globals.imageBase.set('img',act.icon)+'" width="16" height="16" style="position:relative;top:3px;" /> ':'')
			.set('act','$.act1602._execAction(\''+id+'\',\''+i+'\','+j+')')
			.set('cap',act.caption?act.caption:'');
		}
		if(items_html!='')
		t+=$.act1602._template_group
		//.replace(/\%\%\%ico/i,g[i].ico?g[i].ico:'teacher')
		.set('ico',globals.imageBase.set('img',g[i].ico||'wand'))
		.set('id',id+'_'+i)
		.set('gid',id)
		.set('gname',i)
		.set('pref',g[i].pref?g[i].pref:'')
		.set('items',items_html)
		.set('suff',g[i].suff?g[i].suff:'')
		.set('displ',g[i]._collapsed?'none':'block')
		.set('cap',g[i].caption?g[i].caption:'');
	}
	this.html(t);
	return this;
}
