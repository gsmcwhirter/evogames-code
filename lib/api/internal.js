var base = require('../base'),
    couchdb = require('../base/couchdb');

var couchdb_server = "http://localhost:5984";
var couchdb_db = "http://localhost:5984/evogames";

module.exports = {
    uuids: function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        couchdb.getIDs(couchdb_server, callback);
    },
    
    getDoc: function (id, callback){
        if (!id) { throw "Must be given an ID"; }
        
        var creq = new couchdb.Request("GET", couchdb_db+"/"+encodeURIComponent(id), callback);
    },
    
    putDoc: function (doc, callback){
        if (!doc || !doc._id) { throw "Document must have an _id"; }
        
        var url = couchdb_db+"/"+doc._id;
        if (doc._rev) url += "?rev="+doc._rev;
        
        var creq = new couchdb.Request(callback);
        creq.go("PUT", url, {data: JSON.stringify(doc), headers: {"Content-type": "application/json"}});
    },
    
    delDoc: function (doc, callback){
        if (!doc || !doc._id || !doc._rev) { throw "Document must have an _id and a _rev"; }
        
        var creq = new couchdb.Request("DELETE", couchdb_db+"/"+doc._id+"?rev="+doc._rev, callback);
    },
    
    userList: function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
    
        var creq = new couchdb.Request("GET", couchdb_db+"/_design/player/_view/handles/"+base.util.encodeOptions(options), callback);
    },
    
    emailList: function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new couchdb.Request("GET", couchdb_db+"/_design/player/_view/emails/"+base.util.encodeOptions(options), callback);
    },
    
    pendingEmails: function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new couchdb.Request("GET", couchdb_db+"/_design/player/_view/pending_emails/"+base.util.encodeOptions(options), callback);
    },

    loginTokens: function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new couchdb.Request("GET", couchdb_db+"/_design/player/_view/login_tokens/"+base.util.encodeOptions(options), callback);
    },
    
    recentRegistrations: function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new couchdb.Request("GET", couchdb_db+"/_design/player/_view/recent_registrations/"+base.util.encodeOptions(options), callback);
    },
    
    menus: function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new couchdb.Request("GET", couchdb_db+"/_design/admin/_view/menus/"+base.util.encodeOptions(options), callback);
    },
    
    allArticles: function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new couchdb.Request("GET", couchdb_db+"/_design/news/_view/all_articles/"+base.util.encodeOptions(options), callback);
    },
    
    draftArticles: function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new couchdb.Request("GET", couchdb_db+"/_design/news/_view/draft_articles/"+base.util.encodeOptions(options), callback);
    },
    
    publishedArticles: function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new couchdb.Request("GET", couchdb_db+"/_design/news/_view/published_articles/"+base.util.encodeOptions(options), callback);
    },
    
    tagList: function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        if (typeof options.group == "undefined") options.group = true;
        
        var creq = new couchdb.Request("GET", couchdb_db+"/_design/news/_view/tags/"+base.util.encodeOptions(options), callback);
    },
    
    tagArticles: function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        if (typeof options.reduce == "undefined") options.reduce = false;
        
        var creq = new couchdb.Request("GET", couchdb_db+"/_design/news/_view/tags/"+base.util.encodeOptions(options), callback);
    },
    
    slugList: function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new couchdb.Request("GET", couchdb_db+"/_design/news/_view/slugs/"+base.util.encodeOptions(options), callback);
    }
};
