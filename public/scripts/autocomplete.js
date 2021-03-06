(function ($) {
	var VK_ESC = 27,
		VK_DOWN = 40,
		VK_UP = 38,
		VK_RETURN = 13,
		VK_LEFT = 37,
		VK_RIGHT = 39,
		VK_HOME = 36,
		VK_END = 35;
	
	function is_special_char(char) {
		return $.inArray(char, [VK_RETURN, VK_ESC, VK_UP, VK_DOWN,
			VK_LEFT, VK_RIGHT, VK_HOME, VK_END]) !== -1;
	}
	
	/**
	 * returns count of items populated
	 */
	function populate_menu_with_items($menu, items, value) {
		var options = [], item, len = items.length, i;
		if (typeof value === 'undefined') {
			value = '';
		} else {
			value = value.toLowerCase();
		}
		var first = true;
		for (i = 0; i < len; i++) {
			item = items[i];
			if (!item) {
				continue;
			}
			if (!value || item.toLowerCase().indexOf(value) === 0) {
				options.push('<li' + (first ? ' class="selected"' : '') +
					' onmouseover="$(this).addClass(\'selected\').siblings(\'.selected\').removeClass(\'selected\')">' +
					'<strong>' + item.substr(0, value.length) + '</strong>' +
					item.substr(value.length) + '<\/li>');
				first = false;
			}
		}
		$menu.html('<ul>' + options.join('') + '<\/ul>');
		return options.length;
	}
	
	function ie_selection(element) {
		if ($.browser.msie) {
			var yourrange = element.createTextRange();
			try {
				yourrange.setEndPoint('EndToStart', document.selection.createRange());
			} catch (e) {
				
			}
			element.selectionStart = yourrange.text.length;
			element.selectionEnd = element.selectionStart + yourrange.text.length;
		}
	}
	
	function prepare_items(array_of_items) {
		for (var i = 0, len = array_of_items.length; i < len; i++ ) {
			array_of_items[i] = array_of_items[i].toString();
		}
		return array_of_items;
	}
	
	function prepare_input_parameters(items) {
		var options = [];
		if ($.isArray(items)) {
			if (typeof items[0] === 'string') {
				options.push({
					regex: /^(.*)$/,
					items: prepare_items(items)
				});
			} else if (items[0].regex && items[0].items) {
				// TODO: make input parameters more configurable
				for (i in items) {
					if (typeof i === 'integer') {
						items[i].items = prepare_items(items[i].items);
					}
				}
				return items;
			}
		} else if (typeof items === 'object') {
			for (var i in items) {
				if (items.hasOwnProperty(i) && typeof i === 'string') {
					options.push({
						regex: new RegExp(i.length === 1 ? '\\' + i + '([^\\' + i + ']*)$' : i),
						items: prepare_items(items[i])
					});
				}
			}
		}
		return options;
	}
	
	/*
	 * @param options should be Object with members - characters
	 * example:
	 * var options = {
	 *     '#': ['tag1', 'tag2', 'tag3'],
	 *     '@': ['place1', 'place2']
	 * }
	 */
	$.fn.autocomplete = function (items) {
		
		if (!items) {
			return this;
		}
		var options = prepare_input_parameters(items);
		
		return this.each(function () {
			var $fake_input = $('<div style="float: left;display: none;"><\/div>');
			var $input = $(this);
			var input = this;
			var $autocomplete_menu = $('<div class="autocomplete_menu"><\/div>');
			var menu_displayed = false;
			
			var css = {};
			$(['font-size', 'font-family', 'font-weight', 'border']).each(function (i, rule) {
				css[rule] = $input.css(rule);
			});
			$fake_input.css(css);
			$('body').append($fake_input).append($autocomplete_menu);
			
			if ($input.attr('autocomplete') !== 'off') {
				$input.attr('autocomplete', 'off');
			}
			
			function show_menu() {
				$autocomplete_menu.show();
				menu_displayed = true;
			}
			
			function hide_menu() {
				$autocomplete_menu.hide();
				menu_displayed = false;
			}
			
			function apply_selected() {
				if (!menu_displayed) {
					return true;
				}
				ie_selection($input[0]);
				var $li = $autocomplete_menu.find('li.selected');
				var inp = $input[0];
				var after_cursor = inp.value.substr(inp.selectionEnd);
				var before_cursor = inp.value.substr(0, inp.selectionStart);
				var matched_part = $li.html().match(/\<strong\>(.*?)\<\/strong\>/i)[1] || '';
					
				before_cursor = before_cursor.substr(0, before_cursor.length -
					matched_part.length) + matched_part;
				
				inp.value = before_cursor +
					$li.html().replace(/\<strong\>.*?\<\/strong\>/i, '') +
					$autocomplete_menu.suffix + after_cursor;
					
				hide_menu();
				inp.focus();
			}
			
			function update_menu_position(matched_part) {
				var absolute_offset = {left: $input[0].offsetLeft, top: $input[0].offsetTop};
				var op = $input[0];
				while ((op = op.offsetParent)) {
					absolute_offset.left += op.offsetLeft;
					absolute_offset.top += op.offsetTop;
				}
				ie_selection($input[0]);
				$fake_input.html($input.val()
					.substr(0, $input[0].selectionStart - matched_part.length)
					.replace(/ /g, '&nbsp;')
				);
				var cursor_offset = $fake_input.width();
				
				absolute_offset.left += cursor_offset;
				absolute_offset.top += $input.height();
				
				$autocomplete_menu.css(absolute_offset);
			}
			
			function handle_special_char(char) {
				if (char === VK_RETURN) {
					apply_selected();
					return false;
				}
				if (char === VK_ESC) {
					hide_menu();
					return false;
				}
				if ($.inArray(char, [VK_DOWN, VK_UP]) === -1) {
					return true;
				}
				var is_down_arrow = (char === VK_DOWN);
				var siblingNode = is_down_arrow ? 'nextSibling' : 'previousSibling';
				var limitNode = is_down_arrow ? 'first' : 'last';
				var $li = $autocomplete_menu.find('li.selected');
				if ($li.size() === 1) {
					if ($li[0][siblingNode]) {
						$($li[0][siblingNode]).addClass('selected');
						$li.removeClass('selected');
					}
				} else {
					$autocomplete_menu.find('li:' + limitNode).addClass('selected');
				}
			}
			
			var do_not_handle_twice;
			function handle_literal_char(char, options) {
				if (do_not_handle_twice === input.value) {
					return;
				} else {
					do_not_handle_twice = input.value;
				}
				var val = input.value.substr(0, input.selectionStart),
					items = false, value_for_match;
				for (var i = 0, len = options.length; i < len; i++) {
					var res;
					if ((res = val.match(options[i].regex)) && res.length > 1) {
						items = options[i].items;
						value_for_match = res[1].toLowerCase();
						var found = false;
						for (var j in items) {
							if (items[j].toLowerCase().indexOf(value_for_match) !== -1) {
								found = true;
								break;
							}
						}
						if (found) {
							$autocomplete_menu.suffix = options[i].suffix || '';
							break;
						} else {
							items = false;
						}
					}
				}
				if (!items) {
					hide_menu();
					return true;
				}
				var len = populate_menu_with_items($autocomplete_menu, items, value_for_match);
				if (len > 0 && !menu_displayed) {
					update_menu_position(value_for_match);
					show_menu();
				} else if (len === 0 && menu_displayed) {
					hide_menu();
				}
			}
			
			function handle_change(e) {
				e = e || window.event;
				var char_code = e.keyCode || e.charCode;
				if (!char_code) {
					return true;
				}
				if (is_special_char(char_code)) {
					if (menu_displayed && !handle_special_char(char_code)) {
						return false;
					}
				} else {
					setTimeout(function () {
						ie_selection(input);
						handle_literal_char(char_code, options);
					}, 100);
				}
			}
			
			$autocomplete_menu.click(apply_selected);
			
			var old_onkeypress = input.onkeypress;
			input.onkeypress = function (e) {
				var handled = handle_change(e);
				if (typeof handled === 'boolean') {
					return handled;
				} else {
					return $.isFunction(old_onkeypress) ? old_onkeypress(e) : true;
				}
			};
			if (!$.browser.mozilla && !$.browser.opera) {
				var old_onkeydown = input.onkeydown;
				input.onkeydown = function (e) {
					var handled = handle_change(e);
					if (typeof handled === 'boolean') {
						return handled;
					} else {
						return $.isFunction(old_onkeydown) ? old_onkeydown(e) : true;
					}
				}
			}
			
			$input.blur(function () {
				setTimeout(function () {
					hide_menu();
				}, 200);
			});
		});
	};
})(jQuery);
