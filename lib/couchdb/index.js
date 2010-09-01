var http = require('http'),
    Url = require('url'),
    sys = require('sys');


module.exports.Request = function (){
    self = this;
    this.response = {done: false, responseText: ''};
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
        var uri = url.pathname + url.search;
        
        
        options.headers["Host"] = host;
        
        var client = http.createClient(port, host);
        
        client.on('error', function (error) {  //Error checking
            throw error;
        });
        
        var data;
        if (method == "GET" || method == "HEAD") {
            data = null;
        } else if (options.data) {
            options.headers["Content-Length"] = options.data.length;
            
            if (!options.headers["Content-Type"]) {
                options.headers["Content-Type"] = "text/plain;charset=UTF-8";
            }
        }
        
        var request = client.request(method, uri, options.headers);
        if (data) request.write(data);
        
        request.on('response', function(response){
            sys.debug("Response!");
            response.setEncoding('utf8');
            response.on("data", function(chunk){
                sys.debug("Data!");
                self.response.responseText += chunk;
            });
            response.on("end", function(){
                self.response.done = true;
            });
        });
                
        request.end();  
    };
};
