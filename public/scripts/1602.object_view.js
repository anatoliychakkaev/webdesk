/*
	Structure: objectView
	
*/
$.ov = {
	views:[],
	objectMemberValue: function(x){/* {{{ */
		var val;
		switch(typeof x){
			case 'boolean':
				val = '<input type="checkbox" '+(x?'checked ':'')+'/>';
			break;
			case 'number':
				val = '<pre style="color:blue">'+x+'</pre>';
			break;
			case 'string':
				val = '<pre style="color:red;max-height:300px;overflow:auto;">"'+String(x).substr(0,50).replace(/</g,'&lt;')+'"</pre>';
			break;
			case 'function':
				val = 'function';
			break;
			default:
			case 'object':
				val = x;
			break;
		}
		return val;
		/* }}} */
	},
	objectToRows: function(ovid,path,className){/* {{{ */
		var level = path.length;
		var pathStr = path.join('.');
		var view = this.views[ovid];
		var obj = view.object;
		var exp = view.expanded;
		
		for(var i in path)obj = obj[path[i]];
		var r = '';
		if(typeof className == 'undefined')className = obj.className;
		var cl = this.classes[className];
		var isCollection = 
			(obj.constructor==Array)
			|| 
			(typeof obj == 'object' && cl && cl.collection && cl.collection.exceptedIndex && !obj[cl.collection.exceptedIndex]);
		if(cl && !isCollection){ // в объектной модели нашлось описание класса объекта и объект не коллекция
			for(var i in cl.members){
				var x = obj[i];
				var mem = cl.members[i];
				if(typeof x == 'undefined' && !mem.calculated){
					if(mem.notNull || typeof mem.editing == 'undefined'){
						if(/^_{2}[a-z]$/.test(i)){
							r+='<tr><th colspan="2">'+mem+'</th></tr>';
						}
						continue;
					}
					x = mem.editing.defaultValue;
				}
				var newPathStr = pathStr+(level>0?'.':'')+i;
				var label = i;
				var value = x;
				// Редактируем в случае если для класса обозначена редактируемость
				// и для члена она не запрещена
				// или для члена разрешена редактируемость и для класса она не запрещена
				// и при этом если член - объект и для него задан объект редактирования
				if(
					(
						(cl.editing && !(mem.editing===false))
							||
						(!cl.editing && mem.editing)
					)&&(
						!(typeof x == 'object' && typeof mem.editing != 'object')
					)
				){ // Edit
					var type = (mem.editing&&mem.editing.type)?mem.editing.type:mem.editing;
					switch(type){
						case 'textarea':
							value = '<textarea path="'+newPathStr+'" rows="'+(mem.editing&&mem.editing.rows?mem.editing.rows:3)+'" onblur="$.ov.saveValue(this);">'+String(x).replace(/</g,'&lt;')+'</textarea>';
						break;
						case 'password':
						case 'text':
						default:
							value = '<input type="'+(type=='password'?type:'text')+'" path="'+newPathStr+'" value="'+String(x).replace(/\"/g,'&quot;').replace(/[\n\r]/,"")+'" onblur="$.ov.saveValue(this);" />';
						break;
						case 'select':
							var opts = '';
							for(var i in mem.editing.opts){
								opts+='<option '+(x==mem.editing.opts[i]?'selected':'')+'>'+mem.editing.opts[i]+'</option>';
							}
							value = '<select path="'+newPathStr+'" onchange="$.ov.saveValue(this);">'+opts+'</select>';
						break;
					}
				}else{ // Readonly
					var c = $.ov.classes[mem.className];
					if(typeof mem.asString == 'function'){
						value = mem.asString.apply(obj,[x]);
					}else if(c){
						if(c.collection && typeof c.collection.value == 'function')
							value = $.ov.classes[mem.className].collection.value.apply(x);
					}
				}
				if(typeof mem == 'string'){
					label = mem;
				}else if(typeof mem == 'object' && mem.label){
					label = mem.label;
				}
				
				var levelup = 'class="likealink" onclick="$(this.parentNode).objectView(\''+newPathStr+'\''+(mem.className?',\''+mem.className+'\'':'')+')"';
				var is_levelup = false;
				if(typeof x == 'object')for(var xxx in x){is_levelup = true; break;}
				var expanded = is_levelup && (cm_in_array(exp,newPathStr) || x.__ov_expanded || mem.defaultExpanded);
				r+='<tr level="'+level+'" expanded="'+(expanded?1:0)+'" '+(mem.className?'iclass="'+mem.className+'"':'')+'><td class="'+(is_levelup?'likealink ':'')+'ovColMain" style="padding-left:'+(15*level+3)+'px" '+(is_levelup?levelup:'')+'>'+label+'</td><td class="ovColumn">'+value+'</td></tr>';
				// Рекурсивно вычисляем развернутых потомков
				if(expanded)r+=$.ov.objectToRows(ovid,newPathStr.split('.'),mem.className);
			}
		}else{ // не удалось найти описание объекта, либо объект - коллекция
			for(var i in obj){
				try{
					var x = obj[i];
				}catch(e){
					continue;
				}
				var defExp = false;
				if(cl && isCollection){
					var vis = cl.collection.visible;
					if(typeof vis == 'function' && !vis(i,obj[i]))continue;
					var label = typeof cl.collection.index == 'function'?cl.collection.index.apply(obj[i],[i,obj[i]]):i;
					var val = typeof cl.collection.value == 'function'?cl.collection.value.apply(obj[i]):obj[i];
					var is_levelup = (typeof cl.collection.expandable == 'undefined' && typeof x == 'object')?true:!!cl.collection.expandable;
					defExp = !!cl.collection.defaultExpanded;
				}else{
					var label = i;
					var val = this.objectMemberValue(x);
					var is_levelup = false;
					if(typeof x != 'string')for(var xxx in x){is_levelup = true; break;}
				}
				var newPathStr = pathStr+(level>0?'.':'')+i;
				var levelup = ' onclick="$(this.parentNode).objectView(\''+newPathStr+'\''+(cl?',\''+className+'\'':'')+')"';
				var expanded = is_levelup && (cm_in_array(exp,newPathStr) || x.__ov_expanded || defExp);
				r+='<tr level="'+level+'" expanded="'+(expanded?1:0)+'" '+(cl?'iclass="'+className+'"':'')+'><td class="'+(is_levelup?'likealink ':'')+'ovColMain" style="padding-left:'+(15*level+3)+'px" '+(is_levelup?levelup:'')+'>'+label+'</td><td class="ovColumn">'+val+'</td></tr>';
				// Рекурсивно вычисляем развернутых потомков
				if(expanded)r+=$.ov.objectToRows(ovid,newPathStr.split('.'),(cl?className:void(0)));
			}
		}
		if(r=='')r='<tr level="'+level+'"><td class="ovColMain" style="padding-left:'+(15*level)+'px">empty</td><td class="ovColumn">empty</td></tr>';
		
		// Отметить вершину как "expanded"
		if(level>0)exp.push(pathStr);
		return r;
		/* }}} */
	},
	saveValue: function(el){/* {{{ */
		var tag = el.tagName.toLowerCase();
		switch(tag){
			case 'select':
			case 'textarea':
			case 'input':
				// Прекращаем работу функции, если ничего не изменилось
				if(tag !='select' && el.defaultValue==el.value)return;
				// Выходим на объект и его значение
				var ovid = el.parentNode.parentNode.parentNode.parentNode.parentNode.attributes.ovid.nodeValue;
				var obj = $.ov.views[ovid].object;
				var path = el.attributes.path.nodeValue.split('.');
				var last = path.pop();
				for(var i in path)obj = obj[path[i]];
				// Сохраняем значение в объекте
				el.defaultValue = el.value;
				obj[last] = el.value;
				// Обновляем родителя (если есть)
				var tr = el.parentNode.parentNode;
				var curLevel = Number(tr.attributes.level.nodeValue);
				var sibling = tr.previousSibling;
				if(curLevel>0){
					while(sibling && Number(sibling.attributes.level.nodeValue)==curLevel)
						sibling=sibling.previousSibling;
				}
				if(sibling){ // Нашли строку таблицы, содержащую родителя
					var cl = $.ov.classes[sibling.attributes.iclass.nodeValue];
					sibling.childNodes[1].innerHTML = typeof cl.collection.value == 'function'?cl.collection.value(obj):obj;
				}
			break;
				
			break;
		}
		/* }}} */
	},
	handleAction: function(ovid,path,index,field,className){
		$.ov.classes[className].members[field].action.apply($.ov.views[ovid].object[path][index]);
	},
	classes:{}
};

/* {{{ */

$.ov.classes.userTesting = {
	members:{
		subject: 'Предмет',
		script: 'Сценарий',
		userName: 'Тестируемый',
		result: {
			label: 'Результат',
			asString: function(){return '<b>'+String(Math.round(Number(this.result)*10)/10)+'%</b>';}
		},
		attempts: {
			label: 'Попытки',
			asString: function(x){
				var n = x.length;
				if(n%10>4 || n%10==0 || (n>10 && n<20)) return n+' попыток';
				if(n%10==1) return n+' попытка';
				return n+' попытки';
			},
			className: 'testAttempt',
			defaultExpanded: true
		}
	}
};
$.ov.classes.testAttempt= {
	members:{
		timeBegin: {
			label:'Открыта',
			asString:function(x){
				return x?x.toDate().asFormat():'';
			}
		},
		timeEnd: {
			label:'Закрыта',
			asString:function(x){
				return x?x.toDate().asFormat():'';
			}
		},
		result: {
			label: 'Результат',
			asString: function(){return '<b>'+String(Math.round(Number(this.result)*10)/10)+'%</b>';}
		},
		themes: {
			label: 'Заданные вопросы',
			className: 'testTheme',
			defaultExpanded: true,
			asString: function(){
				return '';
			}
		}
	},
	collection: {
		index: function(i,val){
			return 'Попытка №'+(Number(i)+1);
		},
		value: function(){
			return (Math.round(Number(this.result)*10)/10)+'%';
		},
		defaultExpanded: true,
		expandable: true
	}
};
$.ov.classes.testTheme = {
	members:{
		themeName: 'Название',
		questCount: 'Кол-во вопросов',
		correctAns: 'Отвечено верно',
		result: {
			calculated: true,
			label: 'Результат по теме',
			asString: function(){return Math.round((this.correctAns/this.questCount)*1000)/10+'%';}
		},
		questions: {
			label: 'Вопросы темы',
			className: 'testQuestion',
			defaultExpanded: true,
			asString: function(){
				return '';
			}
		}
	},
	collection:{
		index: function(i,val){
			return 'Тема №'+(Number(i)+1);
		},
		value: function(val){
			return '<b>'+this.themeName+'</b> (отвечено верно <b style="color:blue">'+this.correctAns+'</b> из '+this.questCount+')';
		},
		defaultExpanded: false,
		expandable: true
	}
};
$.ov.classes.testQuestion = {
	members:{
		answers:{
			label: 'Ответы',
			className: 'testAnswer',
			defaultExpanded: true,
			asString: function(){
				return '';
			}
		}
	},
	collection: {
		index: function(i,val){
			return 'Вопрос '+(Number(i)+1);
		},
		value: function(val){
			if(globals.godMode){
				var correct = true;
				for(var j in this.answers)if(this.answers[j].isCorrect!=this.answers[j].userAnswer)correct = false;
				return '<span style="font-weight:700;color:'+(correct?'green':'red')+'">'+this.content+'</span>';
			}else{
				return this.content;
			}
		},
		defaultExpanded: false,
		expandable: true
	}
};
$.ov.classes.testAnswer = {
	members:{},
	collection:{
		index: function(i,val){
			console.log(this);
			return '<input type="'+(this.t==1?'radio':'checkbox')+'" disabled '+(this.userAnswer===1?'checked':'')+' />';
		},
		value: function(val){
			return this.content+(globals.godMode && this.isCorrect===1?' <b style="color:green;">(правильный ответ)</b>':'');
		},
		defaultExpanded: false,
		expandable: false
	}
}
/* }}} */

/*
	Function: objectView
		*jQuery-plugin* отображения объекта
		
	Parameters:
		obj - Объект
		className	- *string* Имя класса
*/
$.fn.objectView = function(obj,className){/* {{{ */
	var path;
	if(typeof obj == 'string')
		path = obj.split('.'); // полагаем что в ключе не может быть точки
	else
		path = [];
	var level = path.length;
	if(level==0){
		var ovid = this.attr('ovid');
		if(!ovid){
			ovid = $.ov.views.length;
			this.attr('ovid',ovid);
			$.ov.views.push({
				object:obj,
				expanded:[]
			});
		}else{
			$.ov.views[ovid].object = obj;
			$.ov.views[ovid].expanded = [];
		}
	}else{
		var tmp = this;
		var tmp2;
		ovid = this[0].parentNode.parentNode.parentNode.attributes.ovid.nodeValue;
		if(this.attr('expanded')==1){
			var curlevel = this.attr('level');
			tmp = tmp.next('tr');
			while(true){
				if(tmp.attr('level')<=curlevel || tmp.size()==0)break;
				tmp2 = tmp.next('tr');
				tmp.remove();
				tmp = tmp2;
			}
			this.attr('expanded',0);
			var pathStr = path.join('.');
			var exp = $.ov.views[ovid].expanded;
			for(var i in exp)if(exp[i]==pathStr)delete exp[i];
			return this;
		}
		this.attr('expanded',1);
		obj = $.ov.views[ovid];
	}
	var r = $.ov.objectToRows(ovid,path,className);
	if(level == 0){
		if(this.children('table.objectView').size()==0)
			this.html('<table class="objectView" cellspacing="0"><thead><tr><th colspan="Object View"></th></tr></thead><tbody></tbody></table>');
		var tbody = this.children('table.objectView tbody');
		tbody.html(r);
	}else{
		this.after(r);
	}
	/* }}} */
}
$.fn.objectXView = function(obj,className){
	if(!$.ov.classes[className])return false;
	var cs = $.ov.classes[className].collections;
	var objectPlace = $('div#ov',this);
	if(objectPlace.size()==0){
		var initHtml = '<div id="ov" style="margin-bottom:10px;"></div>';
		var t = '';
		var c = '';
		for(var i in cs){
			var cc = $.ov.classes[cs[i]];
			if(!cc)continue;
			t+='<li><a href="#"><span>'+(cc.collectionTitle || i)+'</span></a></li>';
			c+='<div id="'+i+'" class="tabPageUnbounded"></div>';
		}
		if(c!=''){
			initHtml += '<div id="tabs"><ul>'+t+'</ul>'+c+'</div>';
		}
		this.html(initHtml).find('div#tabs').tabs();
		objectPlace = $('div#ov',this);
	}
	objectPlace.objectView(obj,className);
	var ovid = parseInt(objectPlace.attr('ovid'));
	for(var i in cs){
		var cn = cs[i];
		if(!$.ov.classes[cn])continue;
		var m = $.ov.classes[cn].members;
		var t = '<table class="tab3d" cellspacing="0" cellpadding="3"><thead><tr>';
		var colcount = 0;
		for(var j in m){
			t+='<th>'+(typeof m[j]=='object'?m[j].label:m[j])+'</th>';
			colcount++;
		}
		t+='</tr></thead><tbody>';
		var rowcount = 0;
		for(var j in obj[i]){
			t+='<tr>';
			for(var k in m){
				var v = obj[i][j][k];
				if(m[k].action)
					t+='<td><span class="likealink" onclick="$.ov.handleAction('+ovid+',\''+i+'\','+j+',\''+k+'\',\''+cn+'\')">'+v+'</span></td>';
				else
					t+='<td>'+v+'</td>';
			}
			t+='</tr>';
			rowcount++;
		}
		if(rowcount==0)t+='<tr><td colspan="'+colcount+'" style="padding:50px;"><center>нет данных</center></td></tr>';
		t+='</tbody></table>';
		this.find('#tabs #'+i).html(t);
	}
};
