var util = require('../../base/util');

var API = module.exports = function (couchdb, parent){
    this.couchdb = couchdb;
    this.parent = parent;
};

API.prototype.unanswered = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    this.couchdb.Request("GET", "/_design/help/_view/unanswered_questions/"+util.encodeOptions(options), callback);
};

API.prototype.answered = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    this.couchdb.Request("GET", "/_design/help/_view/answered_questions/"+util.encodeOptions(options), callback);
};

API.prototype.tags = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    this.couchdb.Request("GET", "/_design/help/_view/tags/"+util.encodeOptions(options), callback);
};

API.prototype.slugs = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    this.couchdb.Request("GET", "/_design/help/_view/slugs/"+util.encodeOptions(options), callback);
};