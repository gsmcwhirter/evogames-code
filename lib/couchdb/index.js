var http = require('http'),
    Url = require('url'),
    sys = require('sys');


module.exports.Request = function (first, second, third, fourth){
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
            var uri = url.pathname + url.search;
        }
        else
        {
            var uri = url.pathname;
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
                self.callback(self.responseText);
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
        this.callback = typeof(fourth) == "function" ? fourth : third;
        options = typeof(fourth) == "function" ? third : {};
        this.go(first, second, options);
    }
};
