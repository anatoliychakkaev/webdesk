{include file=in.header.tpl}

<form action="{$pp}create" method="POST">
	<input type="hidden" name="security_token" value="{$security_token}" />
	{foreach from=$table_info->col_names item=col}
	<label for="{$col}">{$col}</label>
	<input name="{$col}" value="" /><br />
	{/foreach}
	<input type="submit" value="Create new item" />
</form>

{include file=crud/in.help.tpl}

{include file=in.footer.tpl}
