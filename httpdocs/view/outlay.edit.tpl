{include file=common/form_style.tpl}

<h2>Изменение записи о расходе</h2>

<form action="{$pp}edit" method="POST" class="form" style="float:left;">
	<input type="hidden" name="security_token" value="{$security_token}" />
	{include file=outlay.form.tpl}
	<div class="submit_field">
		<input type="submit" value="Изменить запись о расходе" tabindex="4" /> или 
		<a href="{$pp}">Отменить</a>
	</div>
</form>

<div style="clear: both;"></div>
