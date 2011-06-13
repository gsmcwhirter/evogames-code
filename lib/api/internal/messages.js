var util = require('../../base/util');

var API = module.exports = function (couchdb){
    this.couchdb = couchdb;
};

API.prototype.inbox = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/messages/_view/inbox/"+util.encodeOptions(options), callback);
};

API.prototype.outbox = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/messages/_view/outbox/"+util.encodeOptions(options), callback);
};

API.prototype.drafts = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/messages/_view/drafts/"+util.encodeOptions(options), callback);
};

API.prototype.newcount = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.reduce == "undefined") options.reduce = true;
    if (typeof options.group == "undefined") options.group = true;
    if (typeof options.group_level == "undefined") options.group_level = 1;

    var creq = new this.couchdb.Request("GET", "/_design/messages/_view/unread/"+util.encodeOptions(options), callback);
};