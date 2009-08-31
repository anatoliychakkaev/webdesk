{include file=in.header.tpl}

{if $index}

<h2>Список задач</h2>

<div id="list_container">
	{foreach from=$index item=row}
	<div id="block_{$row->id}" style="line-height:30px;">
		<input type="checkbox" id="item_{$row->id}"  /> <label for="item_{$row->id}">{$row->name}</label> 
	</div>
	{/foreach}
</div>

{/if}

<h2>Новая задача</h2>
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
		$('#list_container').append('<div id="block_' + obj.data.id +
			'" style="line-height:30px;"><input type="checkbox" id="item_' + obj.data.id + '"  /> <label for="item_' + obj.data.id + '">' + obj.data.name + 
			'</label></div>');
		
	});
	return false;
}

{/literal}
</script>

{include file=in.footer.tpl}
