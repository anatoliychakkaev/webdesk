<div class="field">
	<label for="field_outlay_category_id">Категория расхода</label>
	<select id="field_outlay_category_id" name="outlay_category_id" tabindex="1">
	{foreach from=$outlay_categories item=category key=id}
		<option value="{$id}" {if $outlay->outlay_category_id == $id}selected{/if}>{$category}</option>
	{/foreach}
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
