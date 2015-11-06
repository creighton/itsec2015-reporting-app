if (Meteor.isClient) {
    
        
    Template.fiftycalhitmiss.helpers({
        info: function() {
            return get50CalInfo();
        }
    });
    
    Template.fiftycalshotgauge.rendered = function() {
        this.autorun(function() {
            buildShotGauge();
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
    
    var buildShotGauge = function () {
        var data = [get50CalInfo().ratio * 100];

        chart = $('#fiftycalChart').highcharts({

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
}