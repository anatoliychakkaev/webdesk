
{include file=in.header.tpl}

<style>
{literal}
.preview {
	padding: 10px;
}
.options {
	font-size: 11px;
	color: #888;
}
.options a, .options a:visited {
	color: #66c;
}
.options a:hover {
	color: #22d;
}

.quick_post_box {
	background: #fff;
	border: 1px solid #669;
	margin: 10px;
	padding: 10px;
}

.quick_post_box textarea, .quick_post_box #preview {
	width: 400px;
	height: 150px;
	float: left;
}
.topic {
	background: #ddd;
	border: 1px solid #aaa;
	margin: 10px;
	padding: 10px;
}
{/literal}
</style>

<script>
{literal}
$().ready(function () {
	$('#quick_post_form').submit(function () {
		var form_data = {};
		var ta = this.elements.note;
		for (var i = 0; i < this.elements.length; i++) {
			var el = this.elements[i];
			if (el.name) {
				form_data[el.name] = el.value;
			}
		}
		$.post(this.action + '.json', form_data, function (response) {
			if (!response.error) {
				$('#notes_list').html(response.html);
				ta.value = '';
			}
		}, 'json');
		return false;
	});
});
{/literal}
</script>

<div class="quick_post_box">
	<form action="{$pp}create" method="POST" id="quick_post_form">
		<textarea name="note"></textarea>
		<div id="preview"></div>
		<div class="clear"></div>
		<input type="submit" value="Добавить запись" />
	</form>
</div>

<div id="notes_list">
{include file=in.notes_list.tpl notes=$index}
</div>

{include file=in.footer.tpl}
