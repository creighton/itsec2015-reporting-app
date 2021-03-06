// database stuff
Statements = new Meteor.Collection('statements');
Hooks = new Meteor.Collection('hooks');

if (Meteor.isClient) {
    Meteor.subscribe('statements');
    Meteor.subscribe('hooks');
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
            {
                "_id": 0,
                name: "SCAT",
                objid: "https://sandbox.adlnet.gov/role/Small%20Craft%20Action%20Team",
                template: "scat"
            },
            {
                "_id": 1,
                name: "Seahawk",
                objid: "https://sandbox.adlnet.gov/role/Seahawk%20Pilot",
                template: "seahawk"
            },
            {
                "_id": 2,
                name: "FAC",
                objid: "https://sandbox.adlnet.gov/role/Fast%20Attack%20Craft",
                template: "fac"
            },
            {
                "_id": 3,
                name: "TAO",
                objid: "https://sandbox.adlnet.gov/role/Tactical%20Action%20Officer",
                template: "tao"
            },
            {
                "_id": 4,
                name: "OOD",
                objid: "https://sandbox.adlnet.gov/role/Officer%20Of%20The%20Deck",
                template: "ood"
            },
            {
                "_id": 5,
                name: "Instructor",
                objid: "https://sandbox.adlnet.gov/role/Instructor",
                template: "instructor"
            },
            {
                "_id": 6,
                name: "5\" Gun Base",
                objid: "https://sandbox.adlnet.gov/role/5%20inch%20gun%20base",
                template: "fivein"
            }
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
                    {limit: 10, sort: {_timestamp: -1}}).fetch().map(function (c, i, a) {
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
        role: function () { return ROLES; },
        enable: function (id) { return id == 0 || id == 6; }
    });


    Template.rolemenu.events({
        'click a': function (event) {
            $('#rolemenutabs li').removeClass('active');
            $(event.toElement).parent().addClass('active');
            Session.set('roleid', event.target.dataset.roleid);
        }
    });


    Template.infopane.helpers({
        roleIs: function (roleid) {
            return Session.get('roleid') == roleid;
        },
        chooseTemplate: function () {
            return {template: ROLES[Session.get('roleid')].template};
        }
    });

}// end isClient


if (Meteor.isServer) {

    Meteor.publish('statements', function () {
        return Statements.find({},{limit:1000, sort: {_timestamp: -1}});
    });

    Meteor.publish('hooks', function () {
        return Hooks.find();
    });

    var syncRegHook = Meteor.wrapAsync(function (callback) {
        HTTP.post('https://lrs.adlnet.gov/hooks',
          {
              data: {
                  "name": HOOKNAME,
                  "config": {
                      "endpoint": "http://40.129.74.207/xapi/webhook",
                      "content-type": "application/json"
                  },
                  "filters": {
                      "verb": [{"id":"https://sandbox.adlnet.gov/verbs/started"},{"id":"https://sandbox.adlnet.gov/verbs/fired"}],
                      "related": [
                          {"id":"https://sandbox.adlnet.gov/event/2015/iitsecdemo"}
                      ]
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

    var syncGetRegHook = Meteor.wrapAsync(function (callback) {
        HTTP.get('https://lrs.adlnet.gov/hooks/',
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
            try {
                return syncRegHook();
            } catch (e) {
                console.log('fail reg hook');
                console.log(e);
                throw new Meteor.Error(e);
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
        getRegisteredHook: function () {
            try {
                return syncGetRegHook();
            } catch (e) {
                console.log('failed to get registered hook');
                console.log(e);
                throw new Meteor.Error(e);
            }
        },
        purgeDB: function () {
            Statements.remove({});
        }
    });

}// ending is server here
