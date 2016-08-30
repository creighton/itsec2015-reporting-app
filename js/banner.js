if (Meteor.isClient) {

    // functions available in the body of a page
    Template.banner.helpers({
        hasHook: function() {
            return Hooks.findOne() != undefined;
        },
        getHookName: function() {
            var hook = Hooks.findOne();
            return hook && hook.name || '';
        }
    });


    Template.banner.events({
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
                    else {
                        // got an error, see if the hook already exists
                        // if so, add to the db
                        Meteor.call('getRegisteredHook', function (err, res) {
                            if (!err) {
                                for (var idx in res) {
                                    if (res[idx].name === HOOKNAME) {
                                        // should only ever get here if hook was
                                        // registered outside of this app
                                        Hooks.insert(res[idx]);
                                        break;
                                    }
                                }
                            }
                            else console.log(err);
                        });
                    }
                });
            }
        },
        'click #purge': function (event) {
            Meteor.call('purgeDB');
        }
    });

}
