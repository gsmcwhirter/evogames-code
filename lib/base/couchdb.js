var http = require('http'),
    url = require('url');

function CouchDB(config){
    this.host = config.host;
    this.db = config.db;
    var couchdb = this;

    this.Request = function (first, second, third, fourth){
        this.responseText = '';
        var self = this;

        this.go = function (method, uri, options){
            options = options || {};
            options.headers = options.headers || {};
            options.headers["Content-Type"] = options.headers["Content-Type"] || options.headers["content-type"] || "application/json";
            options.headers["Accept"] = options.headers["Accept"] || options.headers["accept"] || "application/json";

            var myurl = url.parse(couchdb.db+uri);
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
                    options.headers["Content-Type"] = "text/plain;charset=UTF-8";
                }
            }

            var req_options = {
                host: host,
                port: port,
                method: method,
                path: uri,
                headers: options.headers
            };

            var request = http.request(req_options, function (response){
                response.setEncoding('utf8');
                response.on("data", function(chunk){
                    self.responseText += chunk;
                });
                response.on("end", function(){
                    var resp;
                    try{
                        resp = JSON.parse(self.responseText);
                    } catch (err){
                        resp = false;
                    }
                    self.callback(resp);
                });
            });

            if (options.data) request.write(options.data);

            request.end();
        };

        if (typeof(first) == 'function')
        {
            this.callback = first;
        }
        else
        {
            if (typeof(fourth) == "function")
            {
                this.callback = fourth, options = third;
            }
            else
            {
                this.callback = third, options = {};
            }

            this.go(first, second, options);
        }
    };

    this.getIDs = function (how_many, callback){
        if (typeof(how_many) == 'function')
        {
            callback = how_many, how_many = 1;
        }

        how_many = parseInt(how_many) || 1;

        var creq = new this.Request("GET", self.host+"/_uuids?count="+how_many, function (resp){
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
}

module.exports = CouchDB;
