{include file=in.header.tpl}

<form action="{$pp}create" method="POST">
	<input type="hidden" name="security_token" value="{$security_token}" />
	<textarea name="pasta" style="width: 100%; height: 400px;"></textarea>
	<input type="submit" value="Add pasta" />
</form>

{include file=in.footer.tpl}
