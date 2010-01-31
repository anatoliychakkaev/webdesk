/**
 * @author Anatoliy Chakkaev
 * @version 0.1
 * @description Simple javascript highlighter
**/
(function ($) {
	$.fn.syntax = function () {
		return this.each(function () {
			var jqCode = $(this);
			var code = jqCode.text();
			code = code
				.replace(/(var|function|typeof|new|return|if|for|in|while|break|do|continue)([^a-z0-9\$_])/gi, '<span class="kwrd">$1<\/span>$2')
				.replace(/(\{|\}|\]|\[|\|)/gi, '<span class="kwrd">$1<\/span>')
				.replace(/(\/\/[^\n\r]*(\n|\r\n))/g, '<span class="comm">$1<\/span>')
				.replace(/('.*?')/g, '<span class="str">$1<\/span>')
				.replace(/([a-z\_\$][a-z0-9_]*)\(/gi, '<span class="func">$1<\/span>(')
				.replace(/\t/g, '    ');
			jqCode.html(code);
		});
	};
})(jQuery);
