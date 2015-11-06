// database stuff
Statements = new Meteor.Collection('statements');
Hooks = new Meteor.Collection('hooks');

if (Meteor.isClient) {
    
    Session.set('attemptid', undefined);
    
    
    Template.main.events({
        'click a': function (event) {
            Session.set('attemptid', event.target.dataset.attemptid);
        }
    });
    

    // only way i could find to deal with the en-US property
    // this is also very similar to the one used in the stmt helper
    Template.attempts.helpers({
        attempt: function() {
            return Statements.find(
                    {"verb.id":"https://sandbox.adlnet.gov/verbs/started"}, 
                    {sort: {_timestamp: -1}}).fetch().map(function (c, i, a) {
                        return decodeKeys(c);
                    });
        },
        objectDisplay: function (object) {
            var disp = object.id;
            if (object.definition) {
                disp = (object.definition.description 
                        ? object.definition.description['en-US']+" "
                        : disp);
            }
            return disp;
        }
    });   

}// end isClient


if (Meteor.isServer) {

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
        }
    });

}// ending is server here 
