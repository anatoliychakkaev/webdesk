{include file=outlay.create.tpl}

<h2>Расходы</h2>

<table>
	<thead>
		<tr>
			<th>Дата</th>
			<th>Сумма</th>
			<th>Категория</th>
			<th>Комментарий</th>
		</tr>
	</thead>
	<tbody>
	{if $index}
		{foreach from=$index item=outlay}
		<tr>
			<td>{$outlay->created_at|date_format:'%A, %e %b'}</td>
			<td><a href="{$pp}{$outlay->id}/edit">{$outlay->value}</a></td>
			<td>{$outlay->name}</td>
			<td>{$outlay->note}</td>
		</tr>
		{/foreach}
	{else}
		<tr>
			<td colspan="3" style="text-align:center; padding: 20px; font-weight: 700;">
				No data
			</td>
		</tr>
	{/if}
	</tbody>
</table>

<a href="{$pp}create">Create new item</a>
