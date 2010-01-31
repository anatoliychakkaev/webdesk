<h2 class="page_section">
	Table `{$table}`
	
	<div class="note">
		return to >
		<a href="{$pp}" class="backlink">tables in `{$database}`</a>
		>
		<a href="{$pp}" class="backlink">databases list</a>
	</div>
</h2>

<div style="margin-top:10px;margin-bottom:10px;">
	<a href="{$table}/data">View table data</a>
</div>

{*module name=db.table*}

<table cellspacing="0">
	<thead>
		<tr>
			<th>Field</th>
			<th>Type</th>
			<th>Null</th>
			<th>Key</th>
			<th>Default</th>
			<th>Extra</th>
		</tr>
	</thead>
	<tbody>
	{foreach from=$columns item=col}
		<tr>
			<td>{$col->Field}</td>
			<td>{$col->Type}</td>
			<td>{$col->Null}</td>
			<td>{$col->Key}</td>
			<td>{$col->Default}</td>
			<td>{$col->Extra}</td>
		</tr>
	{/foreach}
	</tbody>
</table>

<!--pre>
{$create}
</pre-->
