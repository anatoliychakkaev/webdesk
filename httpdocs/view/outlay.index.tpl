{include file=outlay.create.tpl}

<style>
{literal}
.outlay_record {
	padding-left: 20px;
	width: 250px;
	clear: both;
}

.outlay_description {
	float: left;
	max-width: 180px;
	padding-bottom: 7px;
}

.outlay_value {
	float: right;
	max-width: 50px;
	clear: right;
}
{/literal}
</style>

<h2>Расходы за текущую неделю</h2>

<div id="outlay_index">
{if $index}
	{foreach name=weekday from=$index item=outlay}
		
		{assign var=day value=$outlay->created_at|date_format:'%A, %e %b'}
		
		{if $smarty.foreach.weekday.first}
			{assign var=total value=0}
		{/if}
		
		{if !$prev_day || $prev_day == $day}
			{assign var=total value=$total+$outlay->value}
		{/if}
		
		
		{capture name=outlay_record assign=outlay_record}
		<div class="outlay_record">
			<div class="outlay_description">
				{$outlay->name}{if $outlay->note}: {$outlay->note}{/if}
			</div>
			<div class="outlay_value">
				<a href="{$pp}{$outlay->id}/edit">{$outlay->value}</a>
			</div>
		</div>
		{/capture}
		
		{if !$prev_day || $prev_day != $day || $smarty.foreach.weekday.last}
		
			{if $prev_day}
				{if $smarty.foreach.weekday.last && $prev_day == $day}
					{$outlay_record}
				{/if}
				<div class="outlay_record">
					<div class="outlay_description">
						<strong>Итого:</strong>
					</div>
					
					<div class="outlay_value">
						<u>{$total}</u>
					</div>
				</div>
			</div>
			{assign var=total value=$outlay->value}
			{/if}
			{if !$smarty.foreach.weekday.last || $prev_day != $day}
			<div style="float: left; padding: 10px;">
			
			<div style="font-weight: 700; text-decoration: underline; padding-bottom: 14px;">
				{$day}
			</div>
			{/if}
			
			
		{/if}
		
		{if !$smarty.foreach.weekday.last || $prev_day != $day}
			{$outlay_record}
		{/if}
		
		{assign var=prev_day value=$day}
		
	{/foreach}
	</div>
{else}
	Нет информации о расходах
{/if}
</div>
