<script>
{literal}
function category_changed(select_category) {
	if (select_category.options.length === select_category.selectedIndex + 1 &&
		!select_category.options[select_category.selectedIndex].value) {
		var category_name = prompt('Название новой категории расхода');
		if (category_name) {
			$.post('/outlay_category/create.json', {
				name: category_name
			}, function (response) {
				var last = select_category.options[select_category.options.length - 1];
				var c = response.data;
				last.value = c.id;
				last.innerHTML = c.name;
			}, 'json');
		}
	}
}
{/literal}
</script>
<div class="field">
	<label for="field_outlay_category_id">Категория расхода</label>
	<select id="field_outlay_category_id" name="outlay_category_id" tabindex="1" onchange="category_changed(this);">
	{foreach from=$outlay_categories item=category key=id}
		<option value="{$id}" {if $outlay->outlay_category_id == $id}selected{/if}>{$category}</option>
	{/foreach}
		<option value="">Новая категория расхода...</option>
	</select>
</div>
<div class="field">
	<label for="field_value">Сумма</label>
	<input id="field_value" name="value" value="{$outlay->value}" class="int" tabindex="2" />
</div>
<div class="field">
	<label for="field_note">Комментарий</label>
	<input name="note" tabindex="3" value="{$outlay->note}" />
</div>
