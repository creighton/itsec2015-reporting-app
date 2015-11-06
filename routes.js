Router.configure({
    layoutTemplate: 'main'
});

Router.route('/', {
    template: 'home',
    name: 'home'
});

Router.route('/attempt/:_id', {
    template: 'infopane',
    onBeforeAction: function () {
        var attstmt = Statements.findOne({_id: this.params._id});
        Session.set('attemptid', attstmt.object.id);
        this.next();
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