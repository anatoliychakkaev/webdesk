(function($){
$.fn.jqDrag=function(r){$.jqDnR.init(this,r,'d'); /* $('img.jqmClose',this).before('<img src="images/dialog/jRefresh.gif" class="jqmRefresh" />'); */ return this;};
$.fn.jqResize=function(r){
	this.bgiframe();
	/* $('img.jqmClose',this).before('<img src="images/silk/win-blank.png" class="jqmRefresh" />'); */
	var mn = $(this).parent().attr('id');
	$('.jqmRefresh',this).click(function(){
		if(typeof mn == 'undefined' || mn==''){
			//jEMS_Reload(GLOB_LastModule);
		}else{
			jEMS_Reload(mn);
		}
	});
	$.jqDnR.init(this,r,'r');
	$('.jqResize',this).css({display:'none'});
	return this;
};
$.jqDnR={
init:function(w,r,t){
	r=(r)?$(r,w):w;
	r.bind('mousedown',{w:w,t:t},function(e){
		var h=e.data;
		var w=h.w;
		hash=$.extend({
			oX:f(w,'left'),
			oY:f(w,'top'),
			oW:f(w,'width'),
			oH:f(w,'height'),
			pX:e.pageX,
			pY:e.pageY,
			rk:$(this).attr('resize')
		},h);
		$().mousemove($.jqDnR.drag).mouseup($.jqDnR.stop);
		return true;
	});
},
drag:function(e) {
	var h=hash;
	var w=h.w[0];
	if(h.t == 'd'){ // drag
		h.w.css({
			left:Math.max(h.oX + e.pageX - h.pX,0),
			top:Math.max(h.oY + e.pageY - h.pY,0)
		});
	}else{ // resize
		switch(h.rk){
			case 'br':
				h.w.css({
					width:Math.max(e.pageX - h.pX + h.oW,0),
					height:Math.max(e.pageY - h.pY + h.oH,0)
				});
			break;
			case 'b':
				h.w.css({
					height:Math.max(e.pageY - h.pY + h.oH,0)
				});
			break;
			case 'bl':
				h.w.css({
					left:Math.max(e.pageX - h.pX + h.oX,0),
					width:Math.max(-e.pageX + h.pX + h.oW,0),
					height:Math.max(e.pageY - h.pY + h.oH,0)
				});
			break;
			case 'l':
				h.w.css({
					left:Math.max(e.pageX - h.pX + h.oX,0),
					width:Math.max(-e.pageX + h.pX + h.oW,0)
				});
			break;
			case 'r':
				h.w.css({
					width:Math.max(e.pageX - h.pX + h.oW,0)
				});
			break;
			case 't':
				h.w.css({
					height:Math.max(-e.pageY + h.pY + h.oH,0),
					top:Math.max(e.pageY - h.pY + h.oY,0)
				});
			break;
			case 'tr':
				h.w.css({
					height:Math.max(-e.pageY + h.pY + h.oH,0),
					top:Math.max(e.pageY - h.pY + h.oY,0),
					width:Math.max(e.pageX - h.pX + h.oW,0)
				});
			break;
			case 'tl':
				h.w.css({
					height:Math.max(-e.pageY + h.pY + h.oH,0),
					top:Math.max(e.pageY - h.pY + h.oY,0),
					width:Math.max(-e.pageX + h.pX + h.oW,0),
					left:Math.max(e.pageX - h.pX + h.oX,0)
				});
			break;
		}
	}
	return false;
},
stop:function(){
	var j=$.jqDnR; 
	$().unbind('mousemove',j.drag).unbind('mouseup',j.stop);
	
},
h:false};
var hash=$.jqDnR.h;
var f=function(w,t){
	return parseInt(w.css(t)) || 0
};
})(jQuery);