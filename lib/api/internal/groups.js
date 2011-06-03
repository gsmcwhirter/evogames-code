var util = require('../base/util');

var API = module.exports = function (couchdb){
    this.couchdb = couchdb;
};

API.prototype.names = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/group/_view/names/"+util.encodeOptions(options), callback);
};

API.prototype.codes = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/group/_view/codes/"+util.encodeOptions(options), callback);
};

API.prototype.owners = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/group/_view/owners/"+util.encodeOptions(options), callback);
};

API.prototype.recent = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/group/_view/recently_created/"+util.encodeOptions(options), callback);
};

API.prototype.memberships = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/group/_view/memberships/"+util.encodeOptions(options), callback);
};

API.prototype.invitations = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/group/_view/invitations/"+util.encodeOptions(options), callback);
};

API.prototype.admins = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/group/_view/admins/"+util.encodeOptions(options), callback);
};