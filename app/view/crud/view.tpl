<h2 class="page_section">Viewing record #{$table_info->columns->id.Value}</h2>

<a href="{$pp}..">Back to index</a>

<dl>
{foreach from=$table_info->columns item=column key=key}
	<dt><strong>{$key}</strong></dt>
	<dd style="padding: 10px;">{$column.Value}</dd>
{/foreach}
</dl>

<form action="{$pp}remove" method="POST" onsubmit="return confirm('Are you sure want to delete item?');">
	<input type="hidden" name="security_token" value="{$security_token}" />
	<input type="submit" value="Delete" /> or <a href="{$pp}edit">Edit</a>
</form>

{include file=crud/in.help.tpl}
