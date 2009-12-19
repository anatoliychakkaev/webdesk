<script language="javascript" src="/scripts/autocomplete.js"></script>
<script>
var categories = [{foreach from=$outlay_categories item=category}'{$category}',{/foreach}''].sort();
var notes = [{foreach from=$outlay_notes item=note}'{$note}',{/foreach}''].sort();
{literal}
$(function () {
	
	$input = $('#outlay_mix');
	$input.autocomplete([
		{
			regex: /^\d+[.,]?\d*\s+(.*)$/,
			items: categories,
			suffix: ': '
		}, {
			regex: /^\d+[.,]?\d*\s+.*?: (.+)$/,
			items: notes
		}
	]);
});

function validate_form(form) {
	return form.mixed_value.value !== '';
}

$(function () {
	$('#outlay_mix')[0].focus();
});
{/literal}
</script>

<form action="{$pp}create" onsubmit="return validate_form(this);" method="POST">
	<input type="hidden" name="security_token" value="{$security_token}" />
	
	<input type="text" id="outlay_mix" name="mixed_value" size="50" maxlength="100" tabindex="1" style="background: #fff; border: 1px solid #999; -moz-border-radius: 3px; -webkit-border-radius: 3px;" autocomplete="off" />
	<input type="submit" value="Добавить запись о расходе" tabindex="1" />
	<div style="display: none;">
		
		Ожидаются данные в следующем формате:
		<strong>
			<span style="color: blue">130</span>
			<span style="color: green">Питание</span>:
			<span style="color: gray">Обед</span>
		</strong>
		<br />
		где <span style="color: blue">130</span> &#151; сумма в рублях,
		<span style="color:green">Питание</span> &#151; название категории расхода,
		<span style="color: gray">Обед</span> &#151; комментарий. <br/>
		Обратите внимание, что категория расхода отделяется от комментария двоеточием
	</div>
	
</form>

<div style="clear: both;"></div>
