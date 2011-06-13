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