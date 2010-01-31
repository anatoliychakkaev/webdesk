/*global $, globals */
/*todo required plugins, doc, dependencies */

$.fn.tabs = function (index, op) {
	if (typeof index === 'number') {
		index -= 1;
	} else {
		index = 0;
	}
	var classSelected = 'tabs-selected',
		classNav = 'tabs',
		con = $(this),
		nav = con.children('ul').addClass(classNav);
	
	con.children('div').hide();
	con.children('div:eq(' + index + ')').show();
	nav.children('li').each(function (i, a) {
		var t = $(this);
		t.attr('ind', i + 1);
		var icon = t.attr('icon');
		if (icon) {
			t
			.find('a')
			.css({
				'background-image': 'url(' + globals.imageBase.set('img', icon) + ')',
				'background-position': '2px 50%',
				'background-repeat': 'no-repeat'
			});
			t
			.find('span')
			.css('margin-left', '16px');
		}
	});
	$('a', nav).removeAttr('href');
	
	$('li:eq(' + index + ')', nav).addClass(classSelected);
	$('li', nav).click(function () {
		con.triggerTab($(this).attr('ind'));
	});
	return this;
};

$.fn.triggerTab = function (index) {
	index = parseInt(index, 10);
	if (!isNaN(index)) {
		index -= 1;
	} else {
		index = 0;
	}
	var
		classSelected = 'tabs-selected',
		classNav = 'tabs';
	var con = $(this);
	var nav = con.children('ul').addClass(classNav);
	con.children('div').hide();
	var div = con.children('div:eq(' + index + ')');
	div.show();
	$('li.' + classSelected, nav).removeClass(classSelected);
	$('li:eq(' + index + ')', nav).addClass(classSelected);
	$(this).trigger('tabTriggered', [index + 1, div]);
	return this;
};
