if (Meteor.isClient) {
       
    Template.fiftycalhitmiss.helpers({
        info: function() {
            return get50CalInfo();
        }
    });
    
    
    Template.fiftycalhitpercentgauge.rendered = function() {
        this.autorun(function() {
            buildHitPercentGauge();
        });
    };
    
    
    Template.fiftycalhitshotchart.rendered = function() {
        this.autorun(function() {
            buildHitShotChart();
        });
    };
  
    
    var get50CalInfo = function () {
        var attemptid = Session.get('attemptid');
        if (attemptid) {
            var bursts = Statements.find(
                            {"context.contextActivities.grouping":
                                {$elemMatch: { "id":attemptid }},
                             "object.definition.type": "https://sandbox.adlnet.gov/activity/types/50CalBurst"
                            }, 
                            {sort: {_timestamp: -1}});
        } else {
            var bursts = Statements.find({
                "object.definition.type":"https://sandbox.adlnet.gov/activity/types/50CalBurst"
            });
        }
        var ct = bursts.count();
        var stats = bursts.map(function(s) {return [s.result.score.max, s.result.score.raw]});
        var shots = stats.reduce(function(a, b) { return a + b[0]; }, 0);
        var hits = stats.reduce(function(a, b) { return a + b[1]; }, 0);
        var ratio = +(hits/shots).toFixed(2);
        return {
            "count": ct, 
            "totalshots": shots, 
            "totalhits":hits, 
            "ratio":ratio
        };
    };
    
    
    var buildHitPercentGauge = function () {
        var data = [get50CalInfo().ratio * 100];

        chart = $('#fiftycalHitPercentGauge').highcharts({

            chart: {
                type: 'solidgauge'
            },

            title: null,

            pane: {
                center: ['50%', '85%'],
                size: '100%',
                startAngle: -90,
                endAngle: 90,
                background: {
                    backgroundColor: '#EEE',
                    innerRadius: '60%',
                    outerRadius: '100%',
                    shape: 'arc'
                }
            },

            tooltip: {
                enabled: false
            },

            yAxis: {
                stops: [
                    [0.1, '#FF0000'], // red
                    [0.5, '#DDDF0D'], // yellow
                    [0.9, '#55BF3B'] // green
                ],
                minorTickInterval: null,
                tickPixelInterval: null,
                tickWidth: 0,
                labels: {
                    y: 16
                },
                min: 0,
                max: 100,
                title: {
                    text: 'Hit %',
                    y: -65
                }
            },

            plotOptions: {
                solidgauge: {
                    dataLabels: {
                        y: 5,
                        borderWidth: 0,
                        useHTML: true
                    }
                },
                series: {
                    animation: false
                }
            },

            credits: {
                enabled: false
            },

            series: [{
                name: 'Hit %',
                data: data,
                dataLabels: {
                    format: '<div style="text-align:center"><span style="font-size:15px;color:black">'+ (get50CalInfo().ratio * 100) +'%</span><br/>'
                }
            }]
        });
        return chart;
    };
    
    
    var buildHitShotChart = function () {
        $('#fiftycalHitShotChart').highcharts({
            chart: {
                zoomType: 'xy'
            },
            title: {
                text: 'Average Monthly Weather Data for Tokyo'
            },
            subtitle: {
                text: 'Source: WorldClimate.com'
            },
            xAxis: [{
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                crosshair: true
            }],
            yAxis: [{ // Primary yAxis
                labels: {
                    format: '{value}°C',
                    style: {
                        color: Highcharts.getOptions().colors[2]
                    }
                },
                title: {
                    text: 'Temperature',
                    style: {
                        color: Highcharts.getOptions().colors[2]
                    }
                },
                opposite: true

            }, { // Secondary yAxis
                gridLineWidth: 0,
                title: {
                    text: 'Rainfall',
                    style: {
                        color: Highcharts.getOptions().colors[0]
                    }
                },
                labels: {
                    format: '{value} mm',
                    style: {
                        color: Highcharts.getOptions().colors[0]
                    }
                }

            }, { // Tertiary yAxis
                gridLineWidth: 0,
                title: {
                    text: 'Sea-Level Pressure',
                    style: {
                        color: Highcharts.getOptions().colors[1]
                    }
                },
                labels: {
                    format: '{value} mb',
                    style: {
                        color: Highcharts.getOptions().colors[1]
                    }
                },
                opposite: true
            }],
            tooltip: {
                shared: true
            },
            legend: {
                layout: 'vertical',
                align: 'left',
                x: 80,
                verticalAlign: 'top',
                y: 55,
                floating: true,
                backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
            },
            series: [{
                name: 'Rainfall',
                type: 'column',
                yAxis: 1,
                data: [49.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4],
                tooltip: {
                    valueSuffix: ' mm'
                }

            }, {
                name: 'Sea-Level Pressure',
                type: 'spline',
                yAxis: 2,
                data: [1016, 1016, 1015.9, 1015.5, 1012.3, 1009.5, 1009.6, 1010.2, 1013.1, 1016.9, 1018.2, 1016.7],
                marker: {
                    enabled: false
                },
                dashStyle: 'shortdot',
                tooltip: {
                    valueSuffix: ' mb'
                }

            }, {
                name: 'Temperature',
                type: 'spline',
                data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6],
                tooltip: {
                    valueSuffix: ' °C'
                }
            }]
        });
    };
}