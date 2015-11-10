// database stuff
Statements = new Meteor.Collection('statements');
Hooks = new Meteor.Collection('hooks');

if (Meteor.isClient) {
    /*
        Officer Of The Deck
        Seahawk Pilot
        Small Craft Action Team
        Tactical Action Officer
        Fast Attack Craft
        Instructor
    */
    Meteor.startup(function(){
        ROLES = [
            {"_id": 0, name: "SCAT", objid: "https://sandbox.adlnet.gov/role/Small%20Craft%20Action%20Team"},
            {"_id": 1, name: "Seahawk", objid: "https://sandbox.adlnet.gov/role/Seahawk%20Pilot"},
            {"_id": 2, name: "FAC", objid: "https://sandbox.adlnet.gov/role/Fast%20Attack%20Craft"},
            {"_id": 3, name: "TAO", objid: "https://sandbox.adlnet.gov/role/Tactical%20Action%20Officer"},
            {"_id": 4, name: "OOD", objid: "https://sandbox.adlnet.gov/role/Officer%20Of%20The%20Deck"},
            {"_id": 5, name: "Instructor", objid: "https://sandbox.adlnet.gov/role/Instructor"}
        ];

        Session.set('attemptid', undefined);
        Session.set('roleid', 0);
    });
    
    
    Template.main.onRendered(function () {
        $('#rolemenutabs li').first().addClass('active');
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
    
    
    Template.rolemenu.helpers({
        role: function () { return ROLES; }
    });
    
    
    Template.rolemenu.events({
        'click a': function (event) {
            $('#rolemenutabs li').removeClass('active');
            $(event.toElement).parent().addClass('active');
            Session.set('roleid', event.target.dataset.roleid);
        }
    });

}// end isClient


if (Meteor.isServer) {

    var syncRegHook = Meteor.wrapAsync(function (callback) {
        HTTP.post('https://lrs.adlnet.gov/hooks',
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
        HTTP.del('https://lrs.adlnet.gov/hooks/'+id,
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
