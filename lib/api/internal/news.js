var util = require('../../base/util');

var API = module.exports = function (couchdb, parent){
    this.couchdb = couchdb;
    this.parent = parent;
};

API.prototype.drafts = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    this.couchdb.Request("GET", "/_design/news/_view/draft_articles/"+util.encodeOptions(options), callback);
};

API.prototype.published = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    this.couchdb.Request("GET", "/_design/news/_view/published_articles/"+util.encodeOptions(options), callback);
};

API.prototype.tags = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.group == "undefined") options.group = true;

    this.couchdb.Request("GET", "/_design/news/_view/tags/"+util.encodeOptions(options), callback);
};

API.prototype.byTag = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.reduce == "undefined") options.reduce = false;

    this.couchdb.Request("GET", "/_design/news/_view/tags/"+util.encodeOptions(options), callback);
};

API.prototype.slugs = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    this.couchdb.Request("GET", "/_design/news/_view/slugs/"+util.encodeOptions(options), callback);
};