<style>
{literal}
#preview {
	border: 2px dotted #CCCCCC;
	padding: 10px;
	width: 300px;
	height: 150px;
}
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

.quick_post_box textarea {
	border: 1px solid #999999;
	width: 450px;
	height: 150px;
}
.quick_post_box label {
	font-weight: 700;
	color: #779;
}
.topic {
	background: #f8f8f8;
	border: 1px solid #aaa;
	margin: 10px;
	padding: 10px;
	-moz-border-radius: 10px;
}
{/literal}
</style>

<script language="javascript" src="/scripts/autocomplete.js"></script>
<script>
var tags = [{foreach from=$tags item=tag}'{$tag}',{/foreach}''];
{literal}
$(function () {
	$('#tags').autocomplete([
		{
			regex: /^([^,]+)$/,
			items: tags
		},
		{
			regex: /^.*,\s+([^,]+)$/,
			items: tags
		}
	]);
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

{if $user}

<a href="{$pp}">all notes</a> | 
<a href="{$pp}my">my notes</a>

<div class="quick_post_box">
	<form action="{$pp}create" method="POST" id="quick_post_form">
		<label for="note">Текст заметки:</label><br/>
		<textarea name="note" id="note"></textarea><br/>
		<label for="tags">Тэги:</label><br/>
		<input name="tags" id="tags" size="50" autocomplete="off" /><br/>
		<input type="submit" value="Добавить запись" />
	</form>
</div>

{/if}

<div id="notes_list">
{include file=in.notes_list.tpl notes=$index}
</div>
