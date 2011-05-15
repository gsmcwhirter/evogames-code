var util = require('../base/util');

module.exports = function (couchdb){
    this.couchdb = couchdb;
    var self = this;

    this.uuids = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        if (options.number)
        { 
            self.couchdb.getIDs(options.number, callback);
        }
        else
        {
            self.couchdb.getIDs(callback);
        }
    };
    
    this.getDoc = function (id, callback){
        if (!id) { throw "Must be given an ID"; }
        
        var creq = new self.couchdb.Request("GET", "/"+encodeURIComponent(id), callback);
    };
    
    this.putDoc = function (doc, callback){
        if (!doc || !doc._id) { throw "Document must have an _id"; }
        
        var url = "/"+doc._id;
        if (doc._rev) url += "?rev="+doc._rev;
        
        var creq = new self.couchdb.Request(callback);
        creq.go("PUT", url, {data: JSON.stringify(doc), headers: {"Content-type": "application/json"}});
    };
    
    this.delDoc = function (doc, callback){
        if (!doc || !doc._id || !doc._rev) { throw "Document must have an _id and a _rev"; }
        
        var creq = new self.couchdb.Request("DELETE", "/"+doc._id+"?rev="+doc._rev, callback);
    };
    
    this.userList = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
    
        var creq = new self.couchdb.Request("GET", "/_design/player/_view/handles/"+util.encodeOptions(options), callback);
    };
    
    this.emailList = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/player/_view/emails/"+util.encodeOptions(options), callback);
    };
    
    this.pendingEmails = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/player/_view/pending_emails/"+util.encodeOptions(options), callback);
    };

    this.loginTokens = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/player/_view/login_tokens/"+util.encodeOptions(options), callback);
    };
    
    this.recentRegistrations = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/player/_view/recent_registrations/"+util.encodeOptions(options), callback);
    };
    
    this.menus = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/admin/_view/menus/"+util.encodeOptions(options), callback);
    };
    
    this.allArticles = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/news/_view/all_articles/"+util.encodeOptions(options), callback);
    };
    
    this.draftArticles = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/news/_view/draft_articles/"+util.encodeOptions(options), callback);
    };
    
    this.publishedArticles = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/news/_view/published_articles/"+util.encodeOptions(options), callback);
    };
    
    this.tagList = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        if (typeof options.group == "undefined") options.group = true;
        
        var creq = new self.couchdb.Request("GET", "/_design/news/_view/tags/"+util.encodeOptions(options), callback);
    };
    
    this.tagArticles = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        if (typeof options.reduce == "undefined") options.reduce = false;
        
        var creq = new self.couchdb.Request("GET", "/_design/news/_view/tags/"+util.encodeOptions(options), callback);
    };
    
    this.slugList = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/news/_view/slugs/"+util.encodeOptions(options), callback);
    };
    
    this.groupCodes = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/group/_view/codes/"+util.encodeOptions(options), callback);
    };
    
    this.groupsByOwner = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/group/_view/owners/"+util.encodeOptions(options), callback);
    };

    this.ownersByGroup = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }

        var creq = new self.couchdb.Request("GET", "/_design/group/_view/group_owners/"+util.encodeOptions(options), callback);
    }

    this.recentGroups = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }

        var creq = new self.couchdb.Request("GET", "/_design/group/_view/recently_created/"+util.encodeOptions(options), callback);
    };
    
    this.ticketList = function (options, callback, reduce){
        if (typeof(options) == "function") { reduce = callback, callback = options, options = {}; }
        options.reduce = options.reduce || reduce || false;
    
        var creq = new self.couchdb.Request("GET", "/_design/ticket/_view/list/"+util.encodeOptions(options), callback);
    };
    
    this.ticketTypes = function (options, callback, reduce){
        if (typeof(options) == "function") { reduce = callback, callback = options, options = {}; }
        options.reduce = options.reduce || reduce || false;
        
        var creq = new self.couchdb.Request("GET", "/_design/ticket/_view/by_type/"+util.encodeOptions(options), callback);
    };
    
    this.ticketTags = function (options, callback, reduce){
        if (typeof(options) == "function") { reduce = callback, callback = options, options = {}; }
        options.reduce = options.reduce || reduce || false;
        
        var creq = new self.couchdb.Request("GET", "/_design/ticket/_view/by_tag/"+util.encodeOptions(options), callback);
    };
    
    this.ticketStatus = function (options, callback, reduce){
        if (typeof(options) == "function") { reduce = callback, callback = options, options = {}; }
        options.reduce = options.reduce || reduce || false;
        
        var creq = new self.couchdb.Request("GET", "/_design/ticket/_view/by_status/"+util.encodeOptions(options), callback);
    };
    
    this.ticketMilestones = function (options, callback, reduce){
        if (typeof(options) == "function") { reduce = callback, callback = options, options = {}; }
        options.reduce = options.reduce || reduce || false;
        
        var creq = new self.couchdb.Request("GET", "/_design/ticket/_view/by_milestone/"+util.encodeOptions(options), callback);
    };
    
    this.ticketOwners = function (options, callback, reduce){
        if (typeof(options) == "function") { reduce = callback, callback = options, options = {}; }
        options.reduce = options.reduce || reduce || false;
        
        var creq = new self.couchdb.Request("GET", "/_design/ticket/_view/by_owner/"+util.encodeOptions(options), callback);
    };
    
    this.ticketAssignments = function (options, callback, reduce){
        if (typeof(options) == "function") { reduce = callback, callback = options, options = {}; }
        options.reduce = options.reduce || reduce || false;
        
        var creq = new self.couchdb.Request("GET", "/_design/ticket/_view/by_assigned/"+util.encodeOptions(options), callback);
    };
};
