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
        var bursts = getBursts(Session.get('attemptid'));
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
    
    
    var getBursts = function (attemptid, ord) {
        var order = ord || -1;
        if (attemptid) {
            var bursts = Statements.find(
                            {"context.contextActivities.grouping":
                                {$elemMatch: { "id":attemptid }},
                             "object.definition.type": "https://sandbox.adlnet.gov/activity/types/50CalBurst"
                            }, 
                            {sort: {_timestamp: order}});
        } else {
            var bursts = Statements.find({
                "object.definition.type":"https://sandbox.adlnet.gov/activity/types/50CalBurst"
            }, 
            {sort: {_timestamp: order}});
        }
        return bursts;
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
    
    
    // see: http://jsfiddle.net/gh/get/jquery/1.9.1/highslide-software/highcharts.com/tree/master/samples/highcharts/demo/combo-multi-axes/
    var buildHitShotChart = function () {
        var bursts = getBursts(Session.get('attemptid'), 1);
        $('#fiftycalHitShotChart').highcharts({
            chart: {
                zoomType: 'xy'
            },
            title: {
                text: ''
            },
            plotOptions: {
                series: {
                    animation: false
                }
            },
            credits: {
                enabled: false
            },
            xAxis: [{
                categories: bursts.map(function (cur, idx) {
                    try {
                        return cur.object.definition.name['en-US']
                    } catch (e) { return cur.object.id; }
                }),
                crosshair: true
            }],
            yAxis: [{ // Primary yAxis
                labels: {
                    format: '{value} hits',
                    style: {
                        color: Highcharts.getOptions().colors[1]
                    }
                },
                title: {
                    text: 'Hits',
                    style: {
                        color: Highcharts.getOptions().colors[1]
                    }
                },
                opposite: true

            }, { // Secondary yAxis
                gridLineWidth: 0,
                title: {
                    text: 'Shots Fired',
                    style: {
                        color: Highcharts.getOptions().colors[0]
                    }
                },
                labels: {
                    format: '{value} shots',
                    style: {
                        color: Highcharts.getOptions().colors[0]
                    }
                }

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
                name: 'Shots Fired',
                type: 'column',
                yAxis: 1,
                data: bursts.map(function(s) {return s.result.score.max;}),
                tooltip: {
                    valueSuffix: ' shots'
                }

            }, {
                name: 'Hits',
                type: 'spline',
                data: bursts.map(function(s) {return s.result.score.raw;}),
                tooltip: {
                    valueSuffix: ' hits'
                }
            }]
        });
    };
}