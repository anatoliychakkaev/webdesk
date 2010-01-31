<h2 class="page_section">
	Data in `{$database}`.`{$table}` table
	<div class="note">
		Back to >
		<a href="{$pp}{$database}/{$table}">
			table info
		</a>
		>
		<a href="{$pp}{$database}">
			list tables
		</a>
		>
		<a href="{$pp}">
			list databases
		</a>
	</div>
</h2>


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
