// database stuff
Statements = new Meteor.Collection('statements');
Hooks = new Meteor.Collection('hooks');

if (Meteor.isClient) {
    // functions available in the body of a page
    Template.body.helpers({
        hasHook: function() {
            return Hooks.findOne() != undefined;
        }
    });
    
    // only way i could find to deal with the en-US property
    // this is also very similar to the one used in the stmt helper
    Template.attempts.helpers({
        attempt: function() {
            return Statements.find({"verb.id":"https://sandbox.adlnet.gov/verbs/started"}, {sort: {_timestamp: -1}}).fetch().map(function (c, i, a) {
                return decodeKeys(c);
            });
        },
        objectDisplay: function (object) {
            var disp = object.id;
            if (object.definition) {
                disp = (object.definition.description ? object.definition.description['en-US']+" ":disp);
            }
            return disp;
        }
    });
    
    Template.fiftycalhitmiss.helpers({
        info: function(attemptid) {
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
            var ratio = hits/shots;
            return {
                "count": ct, 
                "totalshots": shots, 
                "totalhits":hits, 
                "ratio":ratio
            };
        }
    });
    
    // 'stmts' template functions
    Template.stmts.helpers({
        statement: function(attemptid) {
            if (attemptid) {
                return Statements.find(
                            {"context.contextActivities.grouping":
                                {$elemMatch: { "id":attemptid }}
                            }, 
                            {sort: {_timestamp: -1}}).fetch().map(function (c, i, a) {
                                return decodeKeys(c);
                            });
            } else {
                return Statements.find({}, {sort: {_timestamp: -1}}).fetch().map(function (c, i, a) {
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
                console.log (disp);
                disp += (object.definition.name ? object.definition.name['en-US']:"");
                console.log(disp);
            }
            return disp;
        }
    });
    
    // events happening in the body of a page
    Template.body.events({
        'click #hook': function (event) {
            var hook = Hooks.findOne();
            if (hook) {
                Meteor.call('unregisterHook', hook.id, function (err, res) {
                    if (!err) {
                        Hooks.remove({_id:hook._id});
                    }
                    else console.log(err);
                });
            } else {
                Meteor.call('registerHook', function (err, res) {
                    if (!err) {
                        Hooks.insert(res);
                    }
                    else console.log(err);
                });
            }
        }
    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
    // code to run on server at startup
    });

    var syncRegHook = Meteor.wrapAsync(function (callback) {
        HTTP.post('https://lrs.adlnet.gov/xapi/me/statements/hooks',
          {
              data: {
                  "name": "xapiwebhook-itsec-vws-meteor-app",
                  "config": {
                      "endpoint": "http://40.129.74.207/xapi/webhook",
                      "content-type": "application/json"
                  },
                  "filters": {
                      "related": [{"id":"https://sandbox.adlnet.gov/event/2015/iitsecdemo"}]
                  }
              },
              auth: "tom:1234",
              headers: {
                  "Content-Type": "application/json"
              }
          },
          function (error, result) {
              if (error) { 
                  callback(error);
              } else {
                  callback(null, result.data);
              }  
          }
        );
    });
    
    var syncUnregHook = Meteor.wrapAsync(function (id, callback) {
        HTTP.del('https://lrs.adlnet.gov/xapi/me/statements/hooks/'+id,
          {
              auth: "tom:1234",
              headers: {
                  "Content-Type": "application/json"
              }
          },
          function (error, result) {
              if (error) { 
                  callback(error);
              } else {
                  callback(null, result.data);
              }  
          }
        );
    });

    Meteor.methods({
        registerHook: function () {
            var result;
            try {
                result = syncRegHook();
            } catch (e) {
                console.log('fail reg hook');
                console.log(e);
            } finally {
                return result;
            }
        },
        unregisterHook: function (id) {
            try {
                syncUnregHook(id);
            } catch (e) {
                console.log('fail reg hook');
                console.log(e);
            } finally {
                return undefined;
            }
        },
        getStatements: function () {

        }
    });

}// ending is server here 
 
Router.configure({
    layoutTemplate: 'main'
});

Router.route('/', {
    template: 'home',
    name: 'home'
});

Router.route('/attempt/:_id', {
    template: 'stmts',
    data: function () {
        var attstmt = Statements.findOne({_id: this.params._id});
        return { attemptid: attstmt.object.id };
    }
});

Router.route('/xapi/webhook', {where: 'server'})
    .post(function() {
        try {
            this.request.body.statements.forEach(function (cur, idx, arr){
                if ( !cur.timestamp ) cur.timestamp = (new Date()).toISOString();
                cur._timestamp = new Date(cur.timestamp);
                Statements.insert(encodeKeys(cur));
            });
            this.response.writeHead(200, {"Content-Type":"text/plain"});
            this.response.write("200 OK");
            this.response.end();
        } catch (e) {
            this.response.writeHead(500, {"Content-Type":"text/plain"});
            this.response.write(e.message);
            this.response.end();
        }
        
    });

// mongo blows up with json keys that are uris (like in extensions)
// so we have to take extensions and turn the whole thing into strings
// to save them in the database
var encodeKeys = function (stmt) {
    for( var key in stmt ) {
        if (stmt.hasOwnProperty(key) && stmt[key].extensions) {
            stmt[key].extensions = JSON.stringify(stmt[key].extensions);
        }
    }
    return stmt;
}

// when we pull the statements back out of mongo, this call will
// walk through a statement and turn the extensions back into 
// objects
var decodeKeys = function (stmt) {
    for( var key in stmt ) {
        if (stmt.hasOwnProperty(key) && stmt[key].extensions) {
            stmt[key].extensions = JSON.parse(stmt[key].extensions);
        }
    }
    return stmt;
}
