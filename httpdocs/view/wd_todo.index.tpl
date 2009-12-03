<style>
{literal}
.todo_item {
	line-height: 30px;
}

.todo_item input {
	vertical-align: middle;
}

.todo_item a{
	color: #aaf;
}

.todo_item {
	padding-left: 30px;
}

.todo_item:hover {
	padding-left: 0;
}

.todo_item:hover .hidden_option {
	width: 30px;
	display: inline;
	float: left;
}
.hidden_option {
	display: none;
}
{/literal}
</style>

<script>
{literal}
$(document).ready(function () {
	$('.todo_item a.edit').click(function () {
			
		var $block = $(this).parent(),
			$label = $block.find('label'),
			$check = $block.find('input[type=checkbox]'),
			id = $check.attr('id');
			
		if (this.is_in_editing_mode) {
			$label.html($label.find('input').val());
			$check.attr('id', id.replace(/_$/,''));
		} else {
			$label.html('<input value="' + $label.html() + '" style="width: 300px">');
			$label.find('input')[0].select();
			$check.attr('id', id + '_');
		}
		this.is_in_editing_mode = !this.is_in_editing_mode;
		return false;
	});
});
{/literal}
</script>

<h2 class='page_section'>Список задач {$todo_list->name}</h2>

<div id="list_container">

{if $index}

	{foreach from=$index item=row}
	<div id="block_{$row->id}" class="todo_item">
		<a class="hidden_option edit" href="{$pp}{$row->id}/edit">Edit</a>
		<input type="checkbox" id="item_{$row->id}"  /> <label for="item_{$row->id}">{$row->name}</label>
	</div>
	{/foreach}
	
{else}
	
	Список пока пуст
	
{/if}

</div>

<h2 class="page_section">Новая задача</h2>
<form method="POST" action="{$pp}create" onsubmit="return ajax_submit(this);">
	<input type="hidden" name="security_token" value="{$security_token}" />
	<input name="task_name" value="" />
	<input type="submit" value="Create task" name="send_form" />
</form>

<script>
{literal}

function ajax_submit(form) {
	form.send_form.disabled = true;
	$.ajaxSetup({dataType:'json'});
	$.post(form.action + '.json', {
		security_token: form.security_token.value,
		name: form.task_name.value
	}, function(obj) {
		form.send_form.disabled = false;
		form.task_name.value = '';
		form.task_name.focus();
		$('#list_container').append('<div id="block_' + obj.todo.id +
			'" style="line-height:30px;"><input type="checkbox" id="item_' + obj.todo.id + '"  /> <label for="item_' + obj.todo.id + '">' + obj.todo.name + 
			'</label></div>');
		
	});
	return false;
}

{/literal}
</script>
