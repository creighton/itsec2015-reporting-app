Router.configure({
    layoutTemplate: 'main'
});

Router.route('/', {
    template: 'home',
    name: 'home',
    onBeforeAction: function () {
        Session.set('attemptid', undefined);
        this.next();
    }
});

Router.route('/attempt/:_id', {
    template: 'infopane',
    onBeforeAction: function () {
        try {
            var attstmt = Statements.findOne({_id: this.params._id});
            Session.set('attemptid', attstmt.object.id);
        } catch (e) { 
            console.log('exception getting statement with id: ' + this.params._id);
            console.log(e);
            Session.set('attemptid', undefined);
        }
        this.next();
    }
});

Router.route('/xapi/webhook', {where: 'server'})
    .post(function() {
        try {
            var stmts = this.request.body.statements;
            setTimeout(Meteor.bindEnvironment(function () {
                if (! stmts) return;
                stmts.forEach(function (cur, idx, arr){
                    if ( !cur.timestamp ) cur.timestamp = (new Date()).toISOString();
                    cur._timestamp = new Date(cur.timestamp);
                    Statements.insert(encodeKeys(cur));
                });
            }), 1);
            this.response.writeHead(200, {"Content-Type":"text/plain"});
            this.response.write("200 OK");
            this.response.end();
        } catch (e) {
            this.response.writeHead(500, {"Content-Type":"text/plain"});
            this.response.write(e.message);
            this.response.end();
        }
        
    });