{include file=in.header.tpl}

<div>
	<a href="{$pp}">{$config->db_server}</a> /
	<a href="{$pp}{$database}">{$database}</a> /
	<a href="{$pp}{$database}/{$table}">{$table}</a> /
	<a href="data" style="font-size:150%">data</a>
</div>

<div style="margin-top:10px;margin-bottom:10px;">
{section name=page start=0 loop=$data->pages_count}
{if $smarty.section.page.index == $data->current_page}
<strong>{$smarty.section.page.index+1}</strong>
{else}
<a href="?page={$smarty.section.page.index}">{$smarty.section.page.index+1}</a>
{/if}
{/section}
</div>


<table>
	<thead>
		<tr>
		{foreach from=$data->columns item=col}
			<th>{$col}</th>
		{/foreach}
		</tr>
	</thead>
	<tbody>
		{foreach from=$data->rows item=row}
		<tr>
			{foreach from=$row item=col}
			<td>{$col}</td>
			{/foreach}
		</tr>
		{/foreach}
	</tbody>
</table>

{include file=in.footer.tpl}
