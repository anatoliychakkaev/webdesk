<!--[if IE]><script language="javascript" type="text/javascript" src="/scripts/flot/excanvas.pack.js"></script><![endif]-->
<script language="javascript" type="text/javascript" src="/scripts/flot/jquery.flot.js"></script>

<script>
var data = [
{foreach from=$data item=point name=report}
[{$point->time}000, {$point->sum}]{if !$smarty.foreach.report.last},{/if}
{/foreach}

];
{literal}
$(function () {
    $.plot($("#placeholder"), [ data]);
	$.plot($("#placeholder"), [
			{
				data: data,
				label: "Outlays"
			}
		],
		{
			xaxis: {
				mode: "time",
				timeformat: "%y %b"
			},
			yaxis: {
				min: 0
			},
			y2axis: {
				tickFormatter: function (v, axis) { return v.toFixed(axis.tickDecimals) +"р." }
			},
			legend: {
				position: 'sw'
			} 
		}
	);
});
{/literal}
</script>

<div id="placeholder" style="width:600px;height:300px;"></div>

