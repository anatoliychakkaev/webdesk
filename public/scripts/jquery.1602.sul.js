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
 */
(function($){/* {{{ */
    $.fn.sulApply = function(cl){/* {{{ */
        /*
         ** @param cl - class name of select's, which we get to work with
         */
        if (typeof cl == 'undefined') 
            cl = {};
        if (typeof cl == 'function') 
            cl = {
                onComplete: cl
            };
        $.sul.init(this, cl);
        return this;
        /* }}} */
    };
    $.fn.sulDeserialize = function(data){
        var section = this.attr('id');
        $.sul.data[section] = data;//$.extend($.sul.data[section],data);
        $.sul.update_depends(section, 'root');
        return this;
    };
    $.sul = {/* {{{ */
		blocks:[],
        depends: {},
        loaded_urls: [],
        data: {},
        init: function(where, op){
			/*
			 @param [Object Element] where
			 @param [Object] op
			 */
			var wh = $(where);
			var sect = wh.attr('id');
			var iuid = wh.attr('iuid');
			if(!iuid){
				iuid = $.sul.blocks.length;
				wh.attr('iuid',iuid);
			}
			op.sectionName = sect;
			op = $.extend({
				onComplete: null,
				saveData: false,
				sectionName: '',
				data: ((op.saveData && op.sectionName && globals.data[op.sectionName]) ? (globals.data[op.sectionName]) : ({})),
				loadDataOnInit: true
			}, op);
			$.sul.blocks[iuid] = op;
			if (typeof globals.data[sect] == 'undefined') 
				globals.data[sect] = {};
			$.sul.data[sect] = op.data;
			if (typeof $.sul.elements == 'undefined') 
				$.sul.elements = {};
			if (typeof $.sul.elements[sect] != 'undefined') 
				delete $.sul.elements[sect];
			$.sul.elements[sect] = {};
			var ss = $('select[@get]', where);
			var dep = {
				root: []
			};
			ss.each(function(){
				var select = this;
				var th = $(this);
				if (!th.attr('get')) {
					return; // exit when get not specified
				}
				var id = th.attr('name');
				var m = th.attr('master');
				var onchange = select.onchange;
				select.onchange = function(){
					var val = th.val();
					if (op.saveData) {
						globals.data[sect][th.attr('name')] = val;
					}
					$.sul.data[sect][id] = val;
					$.sul.update_depends(sect, id);
					if (typeof onchange == 'function') {
						onchange();
					}
				}
				select.saveData = op.saveData;
				select.listener = where;
				// ?????????????? ????? ???????????? ?????? ??????????? (?????? ????????????)
				if (m && m != '') {
					m = m.split(' ');
					for (var i in m) {
						if (!dep[m[i]]) 
							dep[m[i]] = [];//m[i] - id of each master (push if not exists)
						dep[m[i]].push(id);// push current id into master's array of details
					}
				}
				else {
					if (!dep.root[id]) 
						dep.root.push(id);
				}
				// ?????????????? ??????????? ?? ?????
				$.sul.elements[sect][id] = select;
			});
			
			$.sul.depends[sect] = dep; // ?????????????? ?????????????????
			/* }}} */
			/* ????????? ????????? - ???????????? ????????? {{{ */
			if (!op.loadDataOnInit) 
				return;
			this.update_depends(sect, 'root');
			/* }}} */
        },
        parse_url: function(sel){ /* ????????? ?????						{{{ */
            if (!sel) {
                return false;
            }
            sel = $(sel);
            var url = sel.attr('get');
            if (!url) 
                return false;
            var m = sel.attr('master');
            var ls = sel.get(0).listener;
            var sect = $(ls).attr('id');
            var data = $.sul.data[$(ls).attr('id')];
            if (!m) 
                return url;
            m = m.split(' ');
            var res = '';
            var j = 0;
            for (var i = 0; i < url.length; i++) {
                if (url.charAt(i) == '*') {
                    // ?????? ?????? ?????-?????????
                    if (data[m[j]]) 
                        res += data[m[j]] + ''; // ???????? ???????? ??? ??????
                    else {
                        var val = $.sul.elements[sect][m[j]];
                        if (!val || !val.value) {
                            return false;
                        }
                        res += val; // ?????? ????? - ??? ???????????????
                    }
                    j++;
                }
                else {
                    res += url.charAt(i);
                }
            }
            return res;
            /* }}} */
        },
        print: function(url, where){ /* ?????????????? html ??????				{{{ */
            var res, f = false; // first element's id
            var t = ''; // inner text
            where = $(where);
            var opts = where.attr('sul');
            if (!where.get(0)) {
                return;
            }
            var lr = where.get(0).listener;
            var sect = $(lr).attr('id');
            var data = $.sul.data[sect];
            var name = where.attr('name');
            var what_server = $.sul.loaded_urls[url];
            var cu = where.attr('currentUrl');
            var vvv = where.val();
            if (typeof cu != 'undefined' && cu == url) {// ????? ???????????????????? ?????????
                var rrr = (data[name] == vvv);
                try {
                    if (!rrr) 
                        where.val(data[name]);
                } 
                catch (e) {
                    alert(e.message);
                }
                return !rrr; // ?????? ???????? ???????????? ?????????????? ?? ??????????? - ??? ?????? ?????????????? ????????????
            }
            where.attr('currentUrl', url);
            opts = opts ? '{' + opts + '}' : '{}';
            opts = $.extend({
                nocache: false,
                addempty: false,
                emptyid: 0,
                emptyname: '----',
                cookie: false
            }, $.parseJSON(opts)); // options in "sul" attribute
            var coo_id = sect ? data[name] : false;
            f = isNaN(parseInt(coo_id));
            
            what = [];
            if (opts.addempty) {
                what.push({
                    id: opts.emptyid,
                    name: opts.emptyname
                });
            }
            for (var i in what_server) 
                what.push(what_server[i]);
            var firstId = 0;
            if (what[0]) 
                firstId = what[0].id;
            
            for (var i in what) {
                if (f) {
                    res = what[i].id;
                    f = false;
                }
                else {
                    if (what[i].id == coo_id) {
                        res = what[i].id;
                    }
                }
                t += '<option value="' + what[i].id + '">' + what[i].name + '</option>';
            }
            where.html(t);
            if (!res) 
                res = firstId;
            
            data[name] = res;
            if ($.browser.msie) {
                try {
                    ie_select_locate(where.get(0), res);
                } 
                catch (e) {
                    //alert('Bottom: '+e.message);
                }
            }
            else {
                where.val(res).attr('qwe', res);
            }
            if (where.get(0).saveData) {
                globals.data[sect][name] = res;
            }
            
            return true;
            /* }}} */
        },
        printAndGetURLs: function(section, name){/* {{{ */
            var sd = $.sul.depends[section];
            if (!sd || !sd[name]) {
                return []; // ?????? ????? ??????????????
            }
            var d = [];
            var depSelNames = sd[name]; // ???????? ?????????????? ??????????????
            for (var i in depSelNames) { // ????? ??????????? ??????????????? ????????????
                var zz = $.sul.elements[section][depSelNames[i]]; // ???????? ?????
                var u = this.parse_url(zz); // ?????????????? ?????
                if (!u) {
                    continue; // ?????? ??? ?????????????????
                }
                zz.url = u; // ?????????????? ????? ????? ???????????? ????????????
                zz.sulName = depSelNames[i]; // ?? ????? ?????? ??????????????
                d.push(zz); // ??????????? ??????????? ?????????????? ?? ????????? ??????????????
            }
            var urls = [];
            for (var i in d) {
                var s = d[i];
                var url = s.url;
                if (typeof $.sul.loaded_urls[url] == 'undefined') {
                    urls.push('url[]=' + escape(url));
                    urls = $.merge(urls, $.sul.printAndGetURLs(section, s.sulName));
                }
                else {
                    if ($.sul.print(url, s))
                        $.sul.update_depends(section, s.sulName);
                }
            }
            return urls;
            /* }}} */
        },
        update_depends: function(section, name, mi){ /* ??????????????? ??????????????		{{{ */
            if (typeof mi == 'undefined') 
                mi = 0;
            var urls = $.sul.printAndGetURLs(section, name);
            if(urls.length>0){
				$.sul.q = ajax_wait(function(){
					cm_get_json(globals.pathToCore + 'sul.php?' + (urls.join('&')),function(arr){
						var j = 0;
						for (var i in arr) {
							var coll = arr[i];
							if(coll.url == '') continue;
							var res = [];
							for (var j in coll.data) {
								coll.data[j].name = coll.data[j].name;
								res.push(coll.data[j]);
							}
							$.sul.loaded_urls[coll.url] = res;
							j++;
						}
						if(j>0)$.sul.update_depends(section, name, mi + 1);
						ajax_next();
						delete $.sul.q;
					});
				},$.sul.q);
			}
            /* }}} */
        }
        /* }}} */
    }
    /* }}} */
})(jQuery);
