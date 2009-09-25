/*
	Function: datetime
	Parameters:
		datetime
*/
$.fn.dateTime = function(datetime){
	switch(typeof datetime){
		case 'undefined':
			return this.attr('ivalue');
		break;
		case 'string':
			var x = datetime.toDate();
			var hh,mm,YYYY,MM,DD;
			this.attr('ivalue',datetime);
			//if(len>=16){
				hh = parseInt(x.getHours());
				mm = parseInt(x.getMinutes());
			//}
			YYYY = parseInt(x.getFullYear());
			MM = parseInt(x.getMonth()+1);
			DD = parseInt(x.getDate());
			if($('select',this).size()>0){
				$('select[@itype=MM]',this).val(MM);
				$('input[@itype=YYYY]',this).val(YYYY);
				$('input[@itype=DD]',this).val(DD);
				$('input[@itype=m]',this).val(mm);
				$('input[@itype=hh]',this).val(hh);
			}else{
				var opts = '';
				var mths = ['€нвар€', 'феврал€', 'марта', 'апрел€', 'ма€', 'июн€', 'июл€', 'августа', 'сент€бр€', 'окт€бр€', 'но€бр€', 'декабр€'];;
				for(var i in mths){
					opts+='<option '+((Number(i)+1)==MM?'selected':'')+' value="'+(Number(i)+1)+'">'+mths[i]+'</option>';
				}
				this.html(
					'<input itype="DD" value="'+DD+'" size="2" maxlength="2"  onchange="$(this.parentNode).dateTime(this)" /> '+
					'<select itype="MM" style="width:100px" onchange="$(this.parentNode).dateTime(this)" >'+opts+'</select>'+
					'<input itype="YYYY" value="'+YYYY+'" size="4" maxlength="4" onchange="$(this.parentNode).dateTime(this)" /> года, в '+
					'<input itype="hh" value="'+hh+'" size="2" maxlength="2" onchange="$(this.parentNode).dateTime(this)" />:'+
					'<input itype="m" value="'+mm+'" size="2" maxlength="2" onchange="$(this.parentNode).dateTime(this)"  /> '
				).attr('itype','dateTimeComponent');
			}
		break;
		case 'object':
			var inp = $(datetime),newVal = false;
			var val = parseInt(inp.val());
			if(val<10)val = '0'+String(val);
			var oldVal = this.attr('ivalue');
			var f = function(s,ss,b){
				ss = String(ss);
				return s.substr(0,b)+ss+s.substr(b+ss.length,s.length);
			}
			switch(inp.attr('itype')){
				case 'MM':
					newVal = f(oldVal,val,5);
				break;
				case 'YYYY':
					if(val.length<4){
						alert('√од должен содержать 4 цифры');
						return;
					}
					newVal = f(oldVal,val,0);
				break;
				case 'DD':
					newVal = f(oldVal,val,8);
				break;
				case 'hh':
					newVal = f(oldVal,val,11);
				break;
				case 'm':
					newVal = f(oldVal,val,14);
				break;
			}
			if(newVal)this.attr('ivalue',newVal);
		break;
	}
	
	return this;
};
