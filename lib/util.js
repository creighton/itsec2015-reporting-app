HOOKNAME = "xapiwebhook-itsec-vws-meteor-app-limited";

// mongo blows up with json keys that are uris (like in extensions)
// so we have to take extensions and turn the whole thing into strings
// to save them in the database
 encodeKeys = function (stmt) {
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
 decodeKeys = function (stmt) {
    for( var key in stmt ) {
        if (stmt.hasOwnProperty(key) && stmt[key].extensions) {
            stmt[key].extensions = JSON.parse(stmt[key].extensions);
        }
    }
    return stmt;
}
