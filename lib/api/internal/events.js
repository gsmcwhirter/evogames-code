var util = require('../../base/util');

var API = module.exports = function (couchdb, parent){
    this.couchdb = couchdb;
    this.parent = parent;
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

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/enddates_game/"+util.encodeOptions(options), callback);
};

API.prototype.admin_enddates = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/enddates_admin/"+util.encodeOptions(options), callback);
};

API.prototype.registration_enddates = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/enddates_registration/"+util.encodeOptions(options), callback);
};

API.prototype.byGame = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/games/"+util.encodeOptions(options), callback);
};

API.prototype.matches = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.reduce == "undefined") options.reduce = false;

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/matches/"+util.encodeOptions(options), callback);
};

API.prototype.event_matches = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.reduce == "undefined") options.reduce = false;

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/matches_event/"+util.encodeOptions(options), callback);
};

API.prototype.game_matches = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.reduce == "undefined") options.reduce = false;

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/matches_game/"+util.encodeOptions(options), callback);
};

API.prototype.player_matches = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.reduce == "undefined") options.reduce = false;

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/matches_player/"+util.encodeOptions(options), callback);
};

API.prototype.match_count = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.reduce == "undefined") options.reduce = true;
    if (typeof options.group == "undefined") options.group = false;

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/matches/"+util.encodeOptions(options), callback);
};

API.prototype.event_match_count = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.reduce == "undefined") options.reduce = true;
    if (typeof options.group == "undefined") options.group = true;
    if (typeof options.group_level == "undefined") options.group_level = 1;

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/matches_event/"+util.encodeOptions(options), callback);
};

API.prototype.game_match_count = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.reduce == "undefined") options.reduce = true;
    if (typeof options.group == "undefined") options.group = true;
    if (typeof options.group_level == "undefined") options.group_level = 1;

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/matches_game/"+util.encodeOptions(options), callback);
};

API.prototype.player_match_count = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.reduce == "undefined") options.reduce = true;
    if (typeof options.group == "undefined") options.group = true;
    if (typeof options.group_level == "undefined") options.group_level = 3;

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/matches_player/"+util.encodeOptions(options), callback);
};

API.prototype.player_disputes = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/disputes_player/"+util.encodeOptions(options), callback);
};

API.prototype.event_disputes = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/disputes_event/"+util.encodeOptions(options), callback);
};

API.prototype.event_stats = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.group == "undefined") options.group = true;

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/stats_event/"+util.encodeOptions(options), callback);
};

API.prototype.player_stats = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.group == "undefined") options.group = true;

    var creq = new this.couchdb.Request("GET", "/_design/event/_view/stats_player/"+util.encodeOptions(options), callback);
};