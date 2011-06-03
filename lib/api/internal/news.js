var util = require('../base/util');

var API = module.exports = function (couchdb){
    this.couchdb = couchdb;
};

API.prototype.drafts = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/news/_view/draft_articles/"+util.encodeOptions(options), callback);
};

API.prototype.published = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/news/_view/published_articles/"+util.encodeOptions(options), callback);
};

API.prototype.tags = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.group == "undefined") options.group = true;

    var creq = new this.couchdb.Request("GET", "/_design/news/_view/tags/"+util.encodeOptions(options), callback);
};

API.prototype.byTag = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.reduce == "undefined") options.reduce = false;

    var creq = new this.couchdb.Request("GET", "/_design/news/_view/tags/"+util.encodeOptions(options), callback);
};

API.prototype.slugs = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/news/_view/slugs/"+util.encodeOptions(options), callback);
};