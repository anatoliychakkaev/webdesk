<style>
{literal}
.field {
	clear:both;
	text-align:right;
	line-height:25px;
}
.field input, .field textarea{
	width: 300px;
}

input.datetime {
	width:170px;
	margin-right:130px;
}

input.tinyint {
	width: 40px;
	margin-right:260px;
}

input.int {
	width: 80px;
	margin-right:220px;
}

.submit_field {
	float:right;
	clear:both;
	text-align:left;
	width:300px;
	line-height:50px;
}
label {
	float:left;
	padding-right:10px;
}
{/literal}
</style>

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
