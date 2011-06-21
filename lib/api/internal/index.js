var util = require('../../base/util'),
    players_api = require('./players'),
    news_api = require('./news'),
    groups_api = require('./groups'),
    games_api = require('./games'),
    events_api = require('./events'),
    help_api = require('./help'),
    message_api = require('./messages');

var API = module.exports = function (couchdb){
    this.couchdb = couchdb;

    this.players = new players_api(couchdb, this);
    this.news = new news_api(couchdb, this);
    this.groups = new groups_api(couchdb, this);
    this.games = new games_api(couchdb, this);
    this.events = new events_api(couchdb, this);
    this.help = new help_api(couchdb, this);
    this.messages = new message_api(couchdb, this);
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

    this.couchdb.Request("GET", "/"+encodeURIComponent(id), callback);
};
    
API.prototype.putDoc = function (doc, callback){
    if (!doc || !doc._id) { throw "Document must have an _id"; }

    var url = "/"+doc._id;
    if (doc._rev) url += "?rev="+doc._rev;

    this.couchdb.Request("PUT", url, {data: JSON.stringify(doc), headers: {"Content-type": "application/json"}}, callback);
};
    
API.prototype.delDoc = function (doc, callback){
    if (!doc || !doc._id || !doc._rev) { throw "Document must have an _id and a _rev"; }

    this.couchdb.Request("DELETE", "/"+doc._id+"?rev="+doc._rev, callback);
};
