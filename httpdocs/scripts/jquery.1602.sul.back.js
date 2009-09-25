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
**	todo: решить проблему с цепочками загрузок при загрузке без подложки
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
		init:function(where,op){		/* Инициализация компонентов	{{{ */
			/*
				@param [Object Element] where - родитель группы контролов, к которому было применено sul
				@param [Object] op - опции
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
			// получить имя секции, из параметра id элемента where

			if(typeof globals.data[sect] == 'undefined')globals.data[sect]={};
			// установить данные
			$.sul.data[sect] = op.data;
			if(op.saveData){
				if(sect || op.sectionName!=''){
					sect = (op.sectionName=='')?sect:op.sectionName;
					$(where).attr('sulSection',sect);
				}else{
					console.log('Не задан id секции ',where,' автосохранение невозможно');
				}
			}

			/* Первый проход {{{
				построение иерархии в массиве $.sul.depends[имя_секции]
				на основе атрибутов master элементов
			*/
			var ss = $('select',where); // выбрали интересующие нас элементы в коллекцию
			var dep = {root:[]};
			ss.each(function(){
				var th = $(this);
				if(!th.attr('get'))return; // exit when get not specified (не наш клиент ;-))
				var id = th.attr('name');
				var m = th.attr('master');
				th.get(0).onchange = function(){
					console.log('SUL вызван обработчик события change элемента ',this);
					var sect = $(th.get(0).listener).attr('id');
					var val = th.val();
					if(sect){
						globals.data[sect][th.attr('name')] = val;
						$.sul.data[sect][id] = val;
					}
					$.sul.update_depends(sect,id);
				}

				this.listener = where; // добавили текущий селект к слушателю (общему родительскому элементу)
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

			$.sul.depends[sect] = dep; // сохранили зависимости

			/* }}} */
			/* Второй проход - загрузка данных {{{ */
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
				if(typeof m == 'undefined' || (typeof $.sul.data[sect][m]!='undefined' && $.sul.data[sect][m]!=0)){ // если элемент не зависит от других или известно значение элемента, от которого зависим и это значение не ноль
					url = $.sul.parse_url(sel);
					if(!url)return;
					nocache = false;
					opts = sel.attr('sul');
					if(!opts) opts = {};
					if(!$.sul.loaded_urls[url] || opts['nocache']) // необходимо загрузить
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
				/* arr - массив объектов, содержащих массивы пар id=>name {{{
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

					if(typeof m == 'undefined'){ // если элемент не зависит от других
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
		parse_url: function(sel){		/* Парсит урл						{{{ */
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
					// если есть кэш-данные
					if(data[m[j]])
						res+=data[m[j]]+''; // тогда берем из кэша
					else{
						var val = $('select[@name='+m[j]+']',ls).val();
						if(!val){
							console.log(res);
							return false;
						}
						res+=val; // если нет - из компонента
					}
					j++;
				}else{
					res+=url.charAt(i);
				}
			}
			return res;
			/* }}} */
		},
		print: function(url,where){		/* Генерация html кода				{{{ */
			// todo: для эксплорера нужен другой механизм выбора текущего
			// debug: ие говорит, что не может установить свойство selected
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
			if(typeof cu != 'undefined' && cu==url){// нет необходимости вывода
				var rrr = (data[name] == vvv);
				//alert(data[name]+' '+vvv+' '+rrr);
				try{
					if(!rrr)where.val(data[name]);
				}catch(e){
					alert(e.message);
				}
				return !rrr; // если новое значение совпадает с текущим - не надо обновлять дочерние
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
				console.log(section,name,'не имеет зависимых');
				return []; // если нет зависимых
			}
			var d = [];
			var depSelNames = sd[name]; // имена зависимых элементов
			for(var i in depSelNames){ // для каждого зависимого элемента
				var zz = $('#'+section+' select[@name='+depSelNames[i]+']'); // нашли его
				var u = this.parse_url(zz); // вычислили урл
				if(!u){
					console.log('Элемент не имеет определенного источника URL',zz);
					continue; // если не вычислилось
				}
				zz.url = u; // запомнили урл для текущего элемента
				zz.sulName = depSelNames[i]; // и имя тоже запомнили
				d.push(zz); // текущий элемент поместили в массив элементов
			}
			// на выходе из цикла имеем массив объектов, зависящих от текущего узла с вычисленными url
			var urls = [];
			for(var i in d){
				var s = d[i]; // берем очередной элемент
				var url = s.url; // берем url элемента
				// проверяем необходимость загрузки
				if(typeof $.sul.loaded_urls[url] == 'undefined'){ // необходимо загрузить
					urls.push('url[]='+escape(url)); // помещаем url в выходной массив
					// далее фокус: если в хранилице контейнера уже есть данные по текущему
					// элементу - получаем дочерние элементы этим же запросом
					urls = $.merge(urls,$.sul.printAndGetURLs(section,s.sulName));
					// idea: продумать момент когда дочерний эл. зависит не только от текущего эл, но и от другого какого-то
				}else{
					if(
						$.sul.print(url,s) // генерируем код и обновляем данные
					)// если произошла генерация кода
					$.sul.update_depends(section,s.sulName); // значит надо обновить зависимые элементы
				}
				// urls = $.merge(urls,$.sul.printAndGetURLs(section,s.sulName));
			}
			console.log(section,name,urls);
			return urls;
			/* }}} */
		},
		update_depends: function(section,name,mi){	/* Обновление зависимых		{{{ */
			if(typeof mi == 'undefined')mi=0; // счетчег рекурсии
			console.time('SUL.update_depends("'+section+'","'+name+'",'+mi+')'); // таймер
			var urls = $.sul.printAndGetURLs(section,name); // массив урлов

			if(urls.length>0)
			$.getJSON(globals.pathToOk+'sul.php?'+(urls.join('&')),function(arr){
				// шаг 1 - распаковка результатов
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
				// шаг 2 - обновление элементов в соответствии с полученными результатами
				// по факту просто рекурсивный вызов себя
				if(j>0) // если в ответ хоть что-то пришло
				$.sul.update_depends(section,name,mi+1);
			});
			console.time('SUL.update_depends("'+section+'","'+name+'",'+mi+')');
			/* }}} */
		}
		/* }}} */
	}
	/* }}} */
})(jQuery);
