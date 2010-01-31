<!--[if IE]><script language="javascript" type="text/javascript" src="/scripts/flot/excanvas.pack.js"></script><![endif]-->
<script language="javascript" type="text/javascript" src="/scripts/flot/jquery.flot.js"></script>

<script>
var reports = [
	{foreach from=$reports item=r name=reports}
	{ldelim}
		label: '{$r->label}',
		data: [
			{foreach from=$r->data item=point name=report}[{$point->time}000, {$point->sum}]{if !$smarty.foreach.report.last},{/if}{/foreach}
		]
	{rdelim}{if !$smarty.foreach.reports.last},{/if}
	{/foreach}
]
{literal}
$(function () {
	$.plot($("#placeholder"), reports,
		{
			xaxis: {
				mode: "time",
				timeformat: "%b %y"
			},
			yaxis: {
				min: 0
			},
			y2axis: {
				tickFormatter: function (v, axis) { return v.toFixed(axis.tickDecimals) +"р." }
			},
			legend: {
				position: 'nw'
			}
		}
	);
});
{/literal}
</script>

<div id="placeholder" style="width:800px;height:300px;"></div>

