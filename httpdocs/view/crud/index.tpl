{include file=in.header.tpl}

<h2>Index</h2>

<table>
	<thead>
		<tr>
		{foreach from=$table_info->col_names item=col}
			<th>{$col}</th>
		{/foreach}
		</tr>
	</thead>
	<tbody>
	{if $index}
		{foreach from=$index item=row}
		<tr>
			{foreach from=$row item=col key=key}
			<td>
			{if $key==$table_info->pk}
				<a href="{$pp}{$col}">{$col}</a>
			{else}
				{$col}
			{/if}
			</td>
			{/foreach}
		</tr>
		{/foreach}
	{else}
		<tr>
			<td colspan="{$table_info->col_names|@count}" style="text-align:center; padding: 20px; font-weight: 700;">
				No data
			</td>
		</tr>
	{/if}
	</tbody>
</table>

<a href="{$pp}create">Create new item</a>

{include file=crud/in.help.tpl}

{include file=in.footer.tpl}
