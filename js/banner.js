if (Meteor.isClient) {
    
    // functions available in the body of a page
    Template.banner.helpers({
        hasHook: function() {
            return Hooks.findOne() != undefined;
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
                    else console.log(err);
                });
            }
        }
    });
    
}