var util = require('../../base/util');

var API = module.exports = function (couchdb){
    this.couchdb = couchdb;
};

API.prototype.admins = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/admins/"+util.encodeOptions(options), callback);
};

API.prototype.creators = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/creators/"+util.encodeOptions(options), callback);
};

API.prototype.enddates = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/enddates/"+util.encodeOptions(options), callback);
};

API.prototype.invitations = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/invitations/"+util.encodeOptions(options), callback);
};

API.prototype.registrations = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/registrations/"+util.encodeOptions(options), callback);
};

API.prototype.requests = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/requests/"+util.encodeOptions(options), callback);
};

API.prototype.slugs = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/slugs/"+util.encodeOptions(options), callback);
};

API.prototype.game_enddates = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/game_enddates/"+util.encodeOptions(options), callback);
};

API.prototype.admin_enddates = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/admin_enddates/"+util.encodeOptions(options), callback);
};

API.prototype.registration_enddates = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/registration_enddates/"+util.encodeOptions(options), callback);
};

API.prototype.byGame = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/games/"+util.encodeOptions(options), callback);
};

API.prototype.matches = function (options, callback){

};

API.prototype.stats = function (options, callback){

};