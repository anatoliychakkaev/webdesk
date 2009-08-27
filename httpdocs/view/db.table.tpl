{include file=in.header.tpl}

<div>
	<a href="{$pp}">{$config->db_server}</a> /
	<a href="{$pp}{$database}">{$database}</a> /
	<a href="{$pp}{$database}/{$table}" style="font-size:150%">{$table}</a>
</div>

<div style="margin-top:10px;margin-bottom:10px;">
<a href="{$table}/data">data</a>
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

{include file=in.footer.tpl}
