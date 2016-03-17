/* eslint-disable */

var config = {
	entityId: 'lab',
	attributeName: 'brightness',
	chart: {
		title: 'Light Intensity',
		subtitle: 'Live room brightness reported by an Arduino YUN',
		axis: {
			title: 'Light intensity percentage',
			unit: '%'
		},
		seriesTitle: 'Arduni YUN'
	}
};

var previousItemCount = 0;

// draw the chart
$('#chart-container').highcharts({
	chart: {
		type: 'spline',
		zoomType: 'x',
		events: {
			load: function() {
				var series = this.series[0];

				setInterval(function() {
					$.get('/info/' + config.entityId, function(response) {
						var attributes = response.contextResponses[0].contextElement.attributes;
						var currentDate = new Date();
						var timezoneOffsetMs =  currentDate.getTimezoneOffset() * 60 * 1000;
						var data = attributes[config.attributeName + '-history'].value.map(function(item) {
							return [(new Date(item[0])).getTime() - timezoneOffsetMs, Number.parseInt(item[1], 10)]
						});
						var currentItemCount = Number.parseInt(attributes[config.attributeName + '-count'].value, 10);
						var newItemCount = currentItemCount - previousItemCount;
						var newItems = data.slice(data.length - newItemCount);
						var currentValue = Number.parseFloat(attributes[config.attributeName].value);

						var valueChart = Highcharts.charts[$("#value-container").data('highchartsChart')];

						valueChart.series[0].points[0].update(currentValue);

						if (previousItemCount === 0) {
							series.setData(data.slice(1));
						} else {
							newItems.forEach((newItem) => {
								series.addPoint(newItem);
							});
						}

						previousItemCount = currentItemCount;
					});
				}, 1000);
			}
		}
	},
	title: {
		text: config.chart.title
	},
	subtitle: {
		text: config.chart.subtitle
	},
	xAxis: {
		type: 'datetime'
	},
	yAxis: {
		title: {
			text: config.chart.axis.title
		},
		labels: {
			formatter: function() {
				return this.value + config.chart.axis.unit;
			}
		},
		floor: 0,
		ceiling: 100
	},
	plotOptions: {
		area: {
			fillColor: {
				linearGradient: {
					x1: 0,
					y1: 0,
					x2: 0,
					y2: 1
				},
				stops: [
					[0, Highcharts.getOptions().colors[0]],
					[1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
				]
			},
			marker: {
				radius: 2
			},
			lineWidth: 1,
			states: {
				hover: {
					lineWidth: 1
				}
			},
			threshold: null
		}
	},
	tooltip: {
		formatter: function () {
			var date = new Date(this.x);
			var formattedDate = Highcharts.dateFormat('%d.%m.%Y %H:%M', date);

			return '<small>' + formattedDate + '</small><br/><b>Intensity: ' + Highcharts.numberFormat(this.y, 1) + '%</b>'
		}
	},
	series: [{
		type: 'area',
		name: config.chart.seriesTitle,
		data: []
	}],
	legend: {
		enabled: false
	},
	credits: {
		enabled: false
	}
});

$('#value-container').highcharts({

	chart: {
		type: 'gauge',
		plotBackgroundColor: null,
		plotBackgroundImage: null,
		plotBorderWidth: 0,
		plotShadow: false,
		backgroundColor: 'rgba(255, 255, 255, 0)'
	},

	title: {
		text: null
	},

	pane: {
		startAngle: -150,
		endAngle: 150,
		background: [{
			backgroundColor: {
				linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
				stops: [
					[0, '#FFF'],
					[1, '#333']
				]
			},
			borderWidth: 0,
			outerRadius: '109%'
		}, {
			backgroundColor: {
				linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
				stops: [
					[0, '#333'],
					[1, '#FFF']
				]
			},
			borderWidth: 1,
			outerRadius: '107%'
		}, {
			// default background
		}, {
			backgroundColor: '#DDD',
			borderWidth: 0,
			outerRadius: '105%',
			innerRadius: '103%'
		}]
	},

	// the value axis
	yAxis: {
		min: 0,
		max: 100,

		minorTickInterval: 'auto',
		minorTickWidth: 1,
		minorTickLength: 10,
		minorTickPosition: 'inside',
		minorTickColor: '#666',

		tickPixelInterval: 30,
		tickWidth: 2,
		tickPosition: 'inside',
		tickLength: 10,
		tickColor: '#666',
		labels: {
			step: 2,
			rotation: 'auto'
		},
		title: {
			text: 'intensity'
		},
		plotBands: [{
			from: 0,
			to: 70,
			color: '#333' // green
		}, {
			from: 70,
			to: 85,
			color: '#CCC' // yellow
		}, {
			from: 85,
			to: 100,
			color: '#FFF' // red
		}]
	},

	series: [{
		name: 'Light intensity',
		data: [0],
		tooltip: {
			valueSuffix: ' %'
		}
	}],

	credits: {
		enabled: false
	}
});