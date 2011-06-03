var util = require('../../base/util'),
    players_api = require('./players'),
    news_api = require('./news'),
    groups_api = require('./groups'),
    games_api = require('./games'),
    events_api = require('./events');

var API = module.exports = function (couchdb){
    this.couchdb = couchdb;

    this.players = new players_api(couchdb);
    this.news = new news_api(couchdb);
    this.groups = new groups_api(couchdb);
    this.games = new games_api(couchdb);
    this.events = new events_api(couchdb);
};

API.prototype.uuids = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (options.number)
    {
        this.couchdb.getIDs(options.number, callback);
    }
    else
    {
        this.couchdb.getIDs(callback);
    }
};
    
API.prototype.getDoc = function (id, callback){
    if (!id) { throw "Must be given an ID"; }

    var creq = new this.couchdb.Request("GET", "/"+encodeURIComponent(id), callback);
};
    
API.prototype.putDoc = function (doc, callback){
    if (!doc || !doc._id) { throw "Document must have an _id"; }

    var url = "/"+doc._id;
    if (doc._rev) url += "?rev="+doc._rev;

    var creq = new this.couchdb.Request(callback);
    creq.go("PUT", url, {data: JSON.stringify(doc), headers: {"Content-type": "application/json"}});
};
    
API.prototype.delDoc = function (doc, callback){
    if (!doc || !doc._id || !doc._rev) { throw "Document must have an _id and a _rev"; }

    var creq = new this.couchdb.Request("DELETE", "/"+doc._id+"?rev="+doc._rev, callback);
};
