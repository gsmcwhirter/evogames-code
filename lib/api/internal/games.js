var util = require('../base/util');

var API = module.exports = function (couchdb){
    this.couchdb = couchdb;
};

API.prototype.codes = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/game/_view/codes/"+util.encodeOptions(options), callback);
};

API.prototype.names = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq = new this.couchdb.Request("GET", "/_design/game/_view/names/"+util.encodeOptions(options), callback);
};

API.prototype.genres = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.reduce == "undefined") options.reduce = false;

    var creq = new this.couchdb.Request("GET", "/_design/game/_view/genres/"+util.encodeOptions(options), callback);
};

API.prototype.genreCount = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.group == "undefined") options.group = true;

    var creq = new this.couchdb.Request("GET", "/_design/game/_view/genres/"+util.encodeOptions(options), callback);
};