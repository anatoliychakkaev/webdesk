(function($){if(typeof cm_img!=='function'){cm_img=function(a,b,c){if(b){b=b.replace(/"/,'\"')}return'<img src="images/'+a+(a.search(/\.(gif|jpg|jpeg)$/i)===-1?'.png':'')+'" width="16" height="16" alt="'+(b?b:'img')+'" '+(b?'title="'+b+'"':'')+(c?' style="'+c+'"':'')+' />'}}if(typeof globals==='undefined'){globals={activeModule:window}}MenuItem=function(a,b,c,d){if(a.search(/^!/)!==-1){this.disabled=true;a=a.substr(1)}this.caption=a;this.icon=b;this.execute=c;this.submenu=d};$.cmenu={c:[],init:function(a,b){var x={cn:'cmenu',id:a,jq:$('<div iuid="'+a+'" class="cmenu"></div>'),r:false};x[typeof b==='function'?'f':'a']=b;$('body').append(x.jq);return x},render:function(x){if(typeof x.f==='function'){if(typeof x.caller!=='object'){return false}x.r=x.f(x);if(typeof x.r==='object'){x.a=x.r;x.r=false}else{x.r=!x.r}}if(x.async){if(!x.a){x.done=function(){x.v=false;$.cmenu.show(x,x.caller)};return false}x.r=false}if(x.r){return false}x.r=true;var h='';if(x.type==='radio'){var b=x.get()}else{b=false}var c=' onmouseover="$.cmenu.to=setTimeout(function(){var m = $.cmenu.getMenu('+x.id+');m && m.sub && $.cmenu.hideMenu(m.sub);},300);" onmouseout="clearTimeout($.cmenu.to);" ';for(var i in x.a){var a=x.a[i];if(a==='-'){h+='<hr'+($.browser.msie?' style="width:50px;align:center;"':'')+'/>';continue}if(a.constructor===Array){a=(function(x){return new MenuItem(x[0],x[1],x[2],x[3])})(a);x.a[i]=a}x.a[i].parent=x.parent_item;if(typeof a.visible!=='undefined'&&!a.visible||(typeof a.acid!=='undefined'&&$.inArray(a.acid,globals.accessedActions||[]))){continue}if(a.submenu&&(!a.submenu.cn||a.submenu.cn!=='cmenu')){a.submenu=this.getMenu(a.submenu)}var d=a.caption;if(b&&d===b){d='<strong><u>'+a.caption+'</u></strong>'}else{}h+='<div class="cmenuItem" item_id="'+i+'" '+(a.disabled?'style="color:#808080;" ':'onclick="$.cmenu.exec(this);" '+(a.submenu?this.getCaller(a.submenu,'hovertimeout'):c))+'>'+cm_img(a.icon?a.icon:'undefined',' ')+' '+d+(a.submenu?cm_img('page-next.gif',' ','position:absolute;right:0px;vertical-align:middle;'):'')+'</div>'}x.jq.html(h)},exec:function(a){a=$(a);var b=a.attr('item_id');var c=a.parent().attr('iuid');var m=$.cmenu.c[c];if(!m){alert('Menu not found');return false}if(!m.a||!m.a[b]){alert('Action not found');return false}if(m.type==='radio'){m.set(m.a[b].caption);this.render(m);return false}if(typeof m.a[b].execute==='function'&&!m.a[b].disabled){m.a[b].execute.apply(globals.activeModule,[m.a[b],m,m.p])}},getMenu:function(a){var t=typeof a;if(t.search(/function|object|undefined/)!==-1){var b=this.c.length;this.c.push({id:b});this.c[b]=this.init(b,a);return this.c[b]}else{return this.c[a]}},show:function(m,p){if(typeof m!=='object'){m=this.getMenu(m)}if(m.v&&m.caller===p){return false}if(!this.hideBinded){this.hideBinded=true;$().bind('click',this.hideAll)}var a=m.caller;m.caller=p;if(m.sub){this.hideMenu(m.sub)}var b=$(p);if(b.hasClass('cmenuItem')&&!b.hasClass('cmenuItemWithSub')){b.addClass('cmenuItemWithSub');var c=$.cmenu.getMenu(parseInt($(p.parentNode).attr('iuid'),10));if(c){if(c.sub){if(c.sub===m){$(a).removeClass('cmenuItemWithSub')}else{$.cmenu.hideMenu(c.sub);if($.cmenu.to&&clearTimeout($.cmenu.to)){delete $.cmenu.to}}}c.sub=m;m.parentMenu=c}}m.p=this.getPath(p);m.parent_item=m.p[m.p.length-1].cmenu_item;this.render(m);if(m.jq[0].offsetParent!==m.p[0].offsetParent){m.jq.appendTo(m.p[0].offsetParent)}if(m.jq.css('display')==='none'){m.jq.show()}var d=m.jq[0].offsetParent;var e=m.jq[0].offsetWidth;var f=m.jq[0].offsetHeight;var w=0,h=0;if(typeof(window.innerWidth)==='number'){w=window.innerWidth;h=window.innerHeight}else if(document.documentElement&&(document.documentElement.clientWidth||document.documentElement.clientHeight)){w=document.documentElement.clientWidth;h=document.documentElement.clientHeight}var g=0,sy=0;if(typeof window.pageYOffset==='number'){g=window.pageXOffset;sy=window.pageYOffset}else if(document.body&&(document.body.scrollLeft||document.body.scrollTop)){g=document.body.scrollLeft;sy=document.body.scrollTop}else if(document.documentElement&&(document.documentElement.scrollLeft||document.documentElement.scrollTop)){g=document.documentElement.scrollLeft;sy=document.documentElement.scrollTop}var i=h+sy;var j=w+g;var k=this.getOffset(p,d);m.jq.css('left',d.offsetLeft+k.x+p.offsetWidth+e>j?k.x-e:k.x+p.offsetWidth);m.jq.css('top',d.offsetTop+k.y+f>i?k.y-f+p.offsetHeight+4:k.y-2);m.v=true},getPath:function(a){var p=[],jel;while(a){jel=$(a);if(!jel.hasClass('cmenuItem')){p.push(a);break}a.cmenu=$.cmenu.getMenu(parseInt(jel.parent().attr('iuid'),10));a.cmenu_item=a.cmenu.a[jel.attr('item_id')];p.push(a);a=a.cmenu.caller}return p.reverse()},hideAll:function(){if($.cmenu.lockHiding){return false}$().unbind('click',$.cmenu.hideAll);$.cmenu.hideBinded=false;var a=$.cmenu.c.length;for(var i=0;i<a;i++){$.cmenu.hideMenu($.cmenu.c[i])}},hideMenu:function(m){if(!m||!m.v){return}m.v=false;this.hideMenu(m.sub);if(m.caller){$(m.caller).removeClass('cmenuItemWithSub')}m.jq.hide()},getCaller:function(a,b){var m=false;if(typeof a==='object'){m=true;a=a.id}if(typeof a!=='number'){return''}switch(b){case'click':default:return'onclick="$.cmenu.show('+a+',this);$.cmenu.lockHiding=true;" onmouseout="$.cmenu.lockHiding=false;"';case'hovertimeout':return'onmouseover="var t=this;$.cmenu.to=setTimeout(function(){$.cmenu.show('+a+',t);$.cmenu.lockHiding=true;},200);" onmouseout="clearTimeout($.cmenu.to);$.cmenu.lockHiding=false;"'}},getOffset:function(a,b){if(a.offsetParent&&a.offsetParent!==b){var c=this.getOffset(a.offsetParent,b);c.x+=a.offsetLeft;c.y+=a.offsetTop;return c}else{return{x:a.offsetLeft,y:a.offsetTop}}}};$.fn.bindMenu=function(a,b){if(arguments.length===1){b=a;a='click'}if(!b.jq){b=$.cmenu.getMenu(b)}return this.each(function(){$(this).bind(a,function(){$.cmenu.lockHiding=true;$.cmenu.show(b,this)}).bind('mouseout',function(){$.cmenu.lockHiding=false})})}})(jQuery);