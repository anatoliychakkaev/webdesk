{include file=in.header.tpl}

<form action="{$pp}create" method="POST">
	<input type="hidden" name="security_token" value="{$security_token}" />
	{foreach from=$table_info->columns item=item key=key}
	{if $key != $table_info->pk}
	<label for="field_{$key}">{$key}</label>
	{
		if $item.EffectiveType == 'text'
	}<textarea name="{$key}" rows="10"></textarea>{
		else
	}<input id="field_{$key}" name="{$key}" value="" class="{$item.EffectiveType}" /><br />{/if}
	
	{/if}
	{/foreach}
	<input type="submit" value="Create new item" />
</form>

{include file=crud/in.help.tpl}

{include file=in.footer.tpl}
