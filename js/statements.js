if (Meteor.isClient) {
    // 'stmts' template functions
    Template.stmts.helpers({
        statement: function() {
            var attemptid = Session.get('attemptid');
            if (attemptid) {
                return Statements.find(
                            {"context.contextActivities.grouping":
                                {$elemMatch: { "id":attemptid }},
                             "context.contextActivities.category":
                                {$elemMatch: { "id":ROLES[Session.get('roleid')].objid}}
                            },
                            {limit: 15, sort: {_timestamp: -1}}).fetch().map(function (c, i, a) {
                                return decodeKeys(c);
                            });
            } else {
                return Statements.find(
                            {"context.contextActivities.category":
                                {$elemMatch: { "id":ROLES[Session.get('roleid')].objid}}
                            }, 
                            {limit: 15, sort: {_timestamp: -1}}).fetch().map(function (c, i, a) {
                    return decodeKeys(c);
                });
            }
        }
    });
    
    
    Template.stmt.helpers({
        verbDisplay: function (verb) {
            var disp = verb.id;
            if (verb.display)
                disp = verb.display['en-US'];
            return disp;
        },
        objectDisplay: function (object) {
            var disp = object.id;
            if (object.definition) {
                disp = (object.definition.description ? object.definition.description['en-US']+" ":"");
                disp += (object.definition.name ? object.definition.name['en-US']:"");
            }
            return disp;
        },
        ago: function (ts) {
            return moment(ts).fromNow();
        },
        humanDur: function (dur) {
            return moment.duration(dur).humanize(true);
        },
        durAsSeconds: function (dur) {
            return moment.duration(dur).asSeconds();
        },
        accuracyDisplay: function (scaled) {
            return +Number(Math.round(scaled * 100 + 'e2') + 'e-2').toFixed(2);
        }
    });
}