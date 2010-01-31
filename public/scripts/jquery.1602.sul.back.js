/*
** @author	- ATChakkaev
** @date	- 26 jul 2007
** @desc	- my first jQuery plugin
** 				select universal loader
**
** @example - $('body').sulApply();
** @desc	- apply collections to all selects into body
**
** @example - $('body').sulApply('custom');
** @desc	- apply collections to selects with class 'custom'
**	todo: ������ �������� � ��������� �������� ��� �������� ��� ��������
*/
(function($){/* {{{ */
	$.fn.sulApply=function(cl){/* {{{ */
		/*
		** @param cl - class name of select's, which we get to work with
		*/
		if(typeof cl == 'undefined')cl = {};
		if(typeof cl == 'function')cl = {onComplete:cl};
		$.sul.init(this,cl);
		return this;
		/* }}} */
	};
	$.fn.sulDeserialize=function(data){
		var section = this.attr('id');
		if(!section){console.error(section);console.trace();}
		$.sul.data[section] = $.extend($.sul.data[section],data);
		$.sul.update_depends(section,'root');
		return this;
	};
	$.sul={/* {{{ */
		depends: {},
		loaded_urls: [],
		data: {},
		init:function(where,op){		/* ������������� �����������	{{{ */
			/*
				@param [Object Element] where - �������� ������ ���������, � �������� ���� ��������� sul
				@param [Object] op - �����
			*/
			console.time('SUL init');
			var sect = $(where).attr('id');
			op.sectionName = sect;
			op = $.extend({
				onComplete: function(){},
				saveData: false,
				sectionName: '',
				data: ((op.saveData && op.sectionName && globals.data[op.sectionName])?(globals.data[op.sectionName]):({})),
				loadDataOnInit: true
			},op);
			// �������� ��� ������, �� ��������� id �������� where

			if(typeof globals.data[sect] == 'undefined')globals.data[sect]={};
			// ���������� ������
			$.sul.data[sect] = op.data;
			if(op.saveData){
				if(sect || op.sectionName!=''){
					sect = (op.sectionName=='')?sect:op.sectionName;
					$(where).attr('sulSection',sect);
				}else{
					console.log('�� ����� id ������ ',where,' �������������� ����������');
				}
			}

			/* ������ ������ {{{
				���������� �������� � ������� $.sul.depends[���_������]
				�� ������ ��������� master ���������
			*/
			var ss = $('select',where); // ������� ������������ ��� �������� � ���������
			var dep = {root:[]};
			ss.each(function(){
				var th = $(this);
				if(!th.attr('get'))return; // exit when get not specified (�� ��� ������ ;-))
				var id = th.attr('name');
				var m = th.attr('master');
				th.get(0).onchange = function(){
					console.log('SUL ������ ���������� ������� change �������� ',this);
					var sect = $(th.get(0).listener).attr('id');
					var val = th.val();
					if(sect){
						globals.data[sect][th.attr('name')] = val;
						$.sul.data[sect][id] = val;
					}
					$.sul.update_depends(sect,id);
				}

				this.listener = where; // �������� ������� ������ � ��������� (������ ������������� ��������)
				if(m && m!=''){
					m = m.split(' ');
					for(var i in m){
						if(!dep[m[i]])dep[m[i]] = [];//m[i] - id of each master (push if not exists)
						dep[m[i]].push(id);// push current id into master's array of details
					}
				}else{
					if(!dep.root[id])dep.root.push(id);
				}
			});

			$.sul.depends[sect] = dep; // ��������� �����������

			/* }}} */
			/* ������ ������ - �������� ������ {{{ */
			if(!op.loadDataOnInit) return;
			this.update_depends(sect,'root');
			return;
			var sel;
			var url;
			var nocache;
			var opts;
			var urls = [];
			ss.each(function(){
				sel = $(this);
				var m = sel.attr('master');
				if(typeof m == 'undefined' || (typeof $.sul.data[sect][m]!='undefined' && $.sul.data[sect][m]!=0)){ // ���� ������� �� ������� �� ������ ��� �������� �������� ��������, �� �������� ������� � ��� �������� �� ����
					url = $.sul.parse_url(sel);
					if(!url)return;
					nocache = false;
					opts = sel.attr('sul');
					if(!opts) opts = {};
					if(!$.sul.loaded_urls[url] || opts['nocache']) // ���������� ���������
						urls.push('url[]='+escape(url));
					else
						$.sul.print(url,sel);
				}
			});
			if(urls.length==0){
				if(typeof op.onComplete == 'function')op.onComplete();
				return false;
			}
			$.getJSON(globals.pathToOk+'sul.php?'+(urls.join('&')),function(arr){
				/* arr - ������ ��������, ���������� ������� ��� id=>name {{{
					[
						{
							url: '',
							data: [
								{
									id: 0,
									name: ''
								}
							]
						}
					]
					}}}
				*/
				for(var i in arr){
					if(arr.url=='')continue;
					var coll = arr[i];
					var res = [];
					for(var j in coll.data){
						coll.data[j].name = coll.data[j].name;
						res.push(coll.data[j]);
					}
					$.sul.loaded_urls[coll.url] = res;
				}
				$.sul.update_depends(sect,'root');
				/* ss.each(function(){
					sel = $(this);
					var m = sel.attr('master');

					if(typeof m == 'undefined'){ // ���� ������� �� ������� �� ������
						url = $.sul.parse_url(sel);
						if(url && $.sul.loaded_urls[url])$.sul.print(url,sel);
					}
				}); */
				if(typeof op.onComplete == 'function')op.onComplete();
			});
			/* }}} */
			console.timeEnd('SUL init');
			return false;
			/* }}} */
		},
		parse_url: function(sel){		/* ������ ���						{{{ */
			if(!sel){console.trace();return false;}

			var url = sel.attr('get');
			if(!url)return false;
			var m = sel.attr('master');
			var ls = sel.get(0).listener;
			var data = $.sul.data[$(ls).attr('id')];
			if(!m)return url;
			m = m.split(' ');
			var res = '';
			var j = 0;
			for(var i=0;i<url.length;i++){
				if(url.charAt(i)=='*'){
					// ���� ���� ���-������
					if(data[m[j]])
						res+=data[m[j]]+''; // ����� ����� �� ����
					else{
						var val = $('select[@name='+m[j]+']',ls).val();
						if(!val){
							console.log(res);
							return false;
						}
						res+=val; // ���� ��� - �� ����������
					}
					j++;
				}else{
					res+=url.charAt(i);
				}
			}
			return res;
			/* }}} */
		},
		print: function(url,where){		/* ��������� html ����				{{{ */
			// todo: ��� ���������� ����� ������ �������� ������ ��������
			// debug: �� �������, ��� �� ����� ���������� �������� selected
			var res, f = false; // first element's id
			var t = ''; // inner text
			var opts = where.attr('sul');
			if(!where.get(0)){
				console.error(where);
				return;
			}
			var lr = where.get(0).listener;
			var sect = $(lr).attr('id');
			var data = $.sul.data[sect];
			var name = where.attr('name');
			var what_server = $.sul.loaded_urls[url];
			var cu = where.attr('currentUrl');
			var vvv = where.val();
			if(typeof cu != 'undefined' && cu==url){// ��� ������������� ������
				var rrr = (data[name] == vvv);
				//alert(data[name]+' '+vvv+' '+rrr);
				try{
					if(!rrr)where.val(data[name]);
				}catch(e){
					alert(e.message);
				}
				return !rrr; // ���� ����� �������� ��������� � ������� - �� ���� ��������� ��������
			}
			where.attr('currentUrl',url);
			opts = opts? '{'+opts+'}':'{}';
			opts = $.extend({
				nocache: false,
				addempty: false,
				emptyid: 0,
				emptyname: '----',
				cookie: false
			},$.parseJSON(opts)); // options in "sul" attribute
			var coo_id = sect? data[name]:false;
			f = isNaN(parseInt(coo_id));

			what = [];
			if(opts.addempty){
				what.push({id:opts.emptyid,name:opts.emptyname});
			}
			for(var i in what_server) what.push(what_server[i]);
			var firstId = 0;
			if(what[0])firstId= what[0].id;

			for(var i in what){
				if(f){
					res = what[i].id;
					f = false;
				}else{
					if(what[i].id==coo_id){
						res = what[i].id;
					}
				}
				t+='<option value="'+what[i].id+'">'+what[i].name+'</option>';
			}
			where.html(t);
			if(!res)res = firstId;

			data[name] = res;
			if($.browser.msie){
				try{
					ie_select_locate(where.get(0),res);
				}catch(e){
					console.error('Bottom: '+e.message);
					alert('Bottom: '+e.message);
				}
			}else{
				where.val(res).attr('qwe',res);
			}

			return true;
			/* }}} */
		},
		printAndGetURLs: function(section,name){/* {{{ */
			var sd = $.sul.depends[section];
			if(!sd || !sd[name]){
				console.log(section,name,'�� ����� ���������');
				return []; // ���� ��� ���������
			}
			var d = [];
			var depSelNames = sd[name]; // ����� ��������� ���������
			for(var i in depSelNames){ // ��� ������� ���������� ��������
				var zz = $('#'+section+' select[@name='+depSelNames[i]+']'); // ����� ���
				var u = this.parse_url(zz); // ��������� ���
				if(!u){
					console.log('������� �� ����� ������������� ��������� URL',zz);
					continue; // ���� �� �����������
				}
				zz.url = u; // ��������� ��� ��� �������� ��������
				zz.sulName = depSelNames[i]; // � ��� ���� ���������
				d.push(zz); // ������� ������� ��������� � ������ ���������
			}
			// �� ������ �� ����� ����� ������ ��������, ��������� �� �������� ���� � ������������ url
			var urls = [];
			for(var i in d){
				var s = d[i]; // ����� ��������� �������
				var url = s.url; // ����� url ��������
				// ��������� ������������� ��������
				if(typeof $.sul.loaded_urls[url] == 'undefined'){ // ���������� ���������
					urls.push('url[]='+escape(url)); // �������� url � �������� ������
					// ����� �����: ���� � ��������� ���������� ��� ���� ������ �� ��������
					// �������� - �������� �������� �������� ���� �� ��������
					urls = $.merge(urls,$.sul.printAndGetURLs(section,s.sulName));
					// idea: ��������� ������ ����� �������� ��. ������� �� ������ �� �������� ��, �� � �� ������� ������-��
				}else{
					if(
						$.sul.print(url,s) // ���������� ��� � ��������� ������
					)// ���� ��������� ��������� ����
					$.sul.update_depends(section,s.sulName); // ������ ���� �������� ��������� ��������
				}
				// urls = $.merge(urls,$.sul.printAndGetURLs(section,s.sulName));
			}
			console.log(section,name,urls);
			return urls;
			/* }}} */
		},
		update_depends: function(section,name,mi){	/* ���������� ���������		{{{ */
			if(typeof mi == 'undefined')mi=0; // ������� ��������
			console.time('SUL.update_depends("'+section+'","'+name+'",'+mi+')'); // ������
			var urls = $.sul.printAndGetURLs(section,name); // ������ �����

			if(urls.length>0)
			$.getJSON(globals.pathToOk+'sul.php?'+(urls.join('&')),function(arr){
				// ��� 1 - ���������� �����������
				var j = 0;
				for(var i in arr){
					if(arr.url=='') continue;
					var coll = arr[i];
					var res = [];
					for(var j in coll.data){
						coll.data[j].name = coll.data[j].name;
						res.push(coll.data[j]);
					}
					$.sul.loaded_urls[coll.url] = res;
					j++;
				}
				// ��� 2 - ���������� ��������� � ������������ � ����������� ������������
				// �� ����� ������ ����������� ����� ����
				if(j>0) // ���� � ����� ���� ���-�� ������
				$.sul.update_depends(section,name,mi+1);
			});
			console.time('SUL.update_depends("'+section+'","'+name+'",'+mi+')');
			/* }}} */
		}
		/* }}} */
	}
	/* }}} */
})(jQuery);
