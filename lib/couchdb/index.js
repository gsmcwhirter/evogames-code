var http = require('http'),
    Url = require('url'),
    sys = require('sys');


var Request = function (first, second, third, fourth){
    this.responseText = '';
    var self = this;

    this.go = function (method, uri, options){
        options = options || {};
        options.headers = options.headers || {};
        options.headers["Content-Type"] = options.headers["Content-Type"] || options.headers["content-type"] || "application/json";
        options.headers["Accept"] = options.headers["Accept"] || options.headers["accept"] || "application/json";
        
        var url = Url.parse(uri);
        switch (url.protocol) {
            case 'http:':
                var host = url.hostname;
                break;
            
            case undefined:
            case '':
                var host = "localhost";
                break;
            
            case 'https:':
                throw "SSL is not implemented.";
                break;
            
            default:
                throw "Protocol not supported.";
        }
        
        var port = url.port || 80;
        if (url.search)
        {
            uri = url.pathname + url.search;
        }
        else
        {
            uri = url.pathname;
        }
        
        options.headers["Host"] = host;
        
        var client = http.createClient(port, host);
        
        client.on('error', function (error) {  //Error checking
            throw error;
        });
        
        if (method == "GET" || method == "HEAD") {
            options.data = null;
        } else if (options.data) {
            options.headers["Content-Length"] = options.data.length;
            
            if (!options.headers["Content-Type"]) {
                options.headers["Content-Type"] = "text/plain;charset=UTF-8";
            }
        }
        
        var request = client.request(method, uri, options.headers);
        if (options.data) request.write(options.data);
        
        request.on('response', function(response){
            response.setEncoding('utf8');
            response.on("data", function(chunk){
                self.responseText += chunk;
            });
            response.on("end", function(){
                try{
                    var resp = JSON.parse(self.responseText);
                } catch (err){
                    var resp = false;
                }
                self.callback(resp);
            });
        });
                
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

var getIDs = function (server, how_many, callback){
    if (typeof(how_many) == 'function')
    {
        callback = how_many, how_many = callback || 1;
    }
    
    how_many = parseInt(how_many) || 1;
    
    var creq = new Request("GET", server+"/_uuids?count="+how_many, function (resp){
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

module.exports.Request = Request;
module.exports.getIDs = getIDs;
