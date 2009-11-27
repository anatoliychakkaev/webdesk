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
	max-width: 65px;
	clear: right;
}

.daily_total {
	border-top: 1px solid #000;
	height: 20px;
}

.active {
	color: blue;
}

h2 a {
	text-decoration: none;
}

.inline_block {
	display: -moz-inline-box; display: inline-block; *zoom: 1; *display: inline; /* фаза 1 — добавляем inline-block */
	word-spacing: normal; /* фаза два — восстанавливаем убранный пробел в блоках */
	vertical-align: top; /* IE6 некорректно позиционирует без этого */
	padding: 5px;
	margin: 3px;
	background: #fff;
	-moz-border-radius: 10px;
	-webkit-border-radius: 10px;
	border: 1px solid #bbb;
}

.block_header {
	font-weight: 700;
	border-bottom: 1px solid #000;
	margin-bottom: 7px;
	padding-bottom: 7px;
	padding-top: 7px;
}

.block_footer {
	font-weight: 700;
	border-top: 1px solid #000;
	margin-top: 7px;
	padding-bottom: 7px;
	padding-top: 7px;
	float: left;
	width: 270px;
}

.block_footer div {
	padding-bottom: 0;
}

{/literal}
</style>

<h2>
	<a href="?year_week={$year_week}&go=prev">&larr;</a>
	Расходы за {$week}-ю неделю
	<a href="?year_week={$year_week}&go=next">&rarr;</a>
</h2>

<div id="outlay_index">
{if $index}
	{foreach name=weekday from=$index item=outlay}
		
		{assign var=day value=$outlay->created_at|date_format:'%A, %e %b'}
		
		{if $smarty.foreach.weekday.first}
			{assign var=total value=0}
		{/if}
		
		{* accumulat value if the same day as previous or first record in day *}
		{if !$prev_day || $prev_day == $day}
			{assign var=total value=$total+$outlay->value}
		{/if}
		
		{capture assign=outlay_record}
		<div class="outlay_record">
			<div class="outlay_description">
				{$outlay->name}{if $outlay->note}: {$outlay->note}{/if}
			</div>
			<div class="outlay_value">
				<!--a href="{$pp}{$outlay->id}/edit"-->
				{'%01.2f'|sprintf:$outlay->value}
				<!--/a-->
			</div>
		</div>
		{/capture}
		
		{if !$prev_day || $prev_day != $day || $smarty.foreach.weekday.last}
		
			{if $prev_day}
				{if $smarty.foreach.weekday.last && $prev_day == $day}
					{$outlay_record}
				{/if}
				<div class="block_footer">
					<div class="outlay_description">
						<strong>Всего</strong>
					</div>
					
					<div class="outlay_value">
						<u>{'%01.2f'|sprintf:$total}</u>
					</div>
				</div>
			</div>
			{assign var=total value=$outlay->value}
			{/if}
			{if !$smarty.foreach.weekday.last || $prev_day != $day}
			<div class="inline_block">
			
			<div class="block_header{if $smarty.now|date_format == $outlay->created_at|date_format} active{/if}">
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

<div class="clear"></div>

{assign var=total value=0}

<div id="outlay_breakdown" style="padding:10px;">

	<h2>Итоги {$week}-й недели</h2>
	{foreach from=$breakdown item=category}
	{assign var=total value=$total+$category->sum}
	<div class="outlay_record">
		<div class="outlay_description">{$category->name}</div>
		<div class="outlay_value">{$category->sum}</div>
	</div>
	{/foreach}
	<div class="outlay_record daily_total">
		<div class="outlay_description"><b>Всего</b></div>
		<div class="outlay_value"><u>{$total}</u></div>
	</div>
</div>
