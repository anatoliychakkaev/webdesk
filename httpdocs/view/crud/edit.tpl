{include file=in.header.tpl}

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
	clear:both;
	text-align:center;
	line-height:50px;
}
label {
	float:left;
	padding-right:10px;
}
{/literal}
</style>

<form action="{$pp}edit" method="POST" class="form" style="float:left">
	<input type="hidden" name="security_token" value="{$security_token}" />
	{
		foreach 
		from=$table_info->columns 
		item=item 
		key=key
	}<div class="field">
		<label for="field_{$key}">{$key}</label>
		{
			if $item.EffectiveType == 'text'
		}<textarea name="{$key}" rows="8">{$item.Value}</textarea>{
			else
		}<input id="field_{$key}" name="{$key}" value="{$item.Value}" class="{$item.EffectiveType}" /><br />{/if}
	
	</div>
	{/foreach}
	<div class="submit_field">
		<input type="submit" value="Save your changes" /> or 
		<a href="{$pp}..">Cancel editing</a>
	</div>
</form>

{include file=crud/in.help.tpl}

{include file=in.footer.tpl}
