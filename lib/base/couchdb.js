var http = require('http'),
    url = require('url');

function CouchDB(config){
    this.host = config.host;
    this.db = config.db;
    this.use_auth = config.use_authentication;
    if (this.use_auth){
        this.user = config.user;
        this.pass = config.pass;
    }
}

CouchDB.prototype.Request = function (method, uri, options, callback, sendchunks){
    var responseText = '';

    options = options || {};

    if (typeof(options) == "function")
    {
        sendchunks = callback, callback = options, options = {};
    }

    options.headers = options.headers || {};
    options.headers["Content-Type"] = options.headers["Content-Type"] || options.headers["content-type"] || "application/json";
    options.headers["Accept"] = options.headers["Accept"] || options.headers["accept"] || "application/json";

    var uuid_check = url.parse(uri);
    if (uuid_check.pathname != '/_uuids'){
        uri = this.db+uri;
    }
    else {
        uri = this.host+uri;
    }

    var myurl = url.parse(uri);
    var host;
    switch (myurl.protocol) {
        case 'http:':
            host = myurl.hostname;
            break;

        case undefined:
        case '':
            host = "localhost";
            break;

        case 'https:':
            throw "SSL is not implemented.";
            break;

        default:
            throw "Protocol not supported.";
    }

    var port = myurl.port || 80;
    if (myurl.search)
    {
        uri = myurl.pathname + myurl.search;
    }
    else
    {
        uri = myurl.pathname;
    }

    options.headers["Host"] = host;

    if (method == "GET" || method == "HEAD") {
        options.data = null;
    } else if (options.data) {
        options.headers["Content-Length"] = options.data.length;

        if (!options.headers["Content-Type"]) {
            options.headers["Content-Type"] = "application/json;charset=UTF-8";
        }
    }

    var req_options = {
        host: host,
        port: port,
        method: method,
        path: uri,
        headers: options.headers
    };

    if (this.use_auth){
        req_options.auth = this.user + ":" + this.pass;
    }

    var request = http.request(req_options, function (response){
        response.setEncoding('utf8');
        response.on("data", function(chunk){
            if (sendchunks){
                var resp;
                try {
                    resp = JSON.parse(chunk);
                }
                catch (err){
                    resp = false;
                }

                callback(resp);
            }
            else {
                responseText += chunk;
            }
        });
        response.on("end", function(){
            if (!sendchunks){
                var resp;
                try{
                    resp = JSON.parse(responseText);
                } catch (err){
                    resp = false;
                }

                callback(resp);
            }
        });
    });

    if (options.data) request.write(options.data);

    request.end();
};

CouchDB.prototype.getIDs = function (how_many, callback){
    if (typeof(how_many) == 'function')
    {
        callback = how_many, how_many = 1;
    }

    how_many = parseInt(how_many) || 1;

    this.Request("GET", "/_uuids?count="+how_many, function (resp){
        if (resp.uuids)
        {
            callback(resp.uuids);
        }
        else
        {
            callback(false);
        }
    });
}

CouchDB.prototype.changes = function (options, ondata){
    if (typeof options == "function") ondata = options, options = "";

    this.Request("GET", "/_changes"+(options || ""), {headers: {"Connection": "keep-alive"}}, ondata, true);
}

module.exports = CouchDB;
