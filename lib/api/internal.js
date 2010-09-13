var http = require('http');
var sys = require('sys');

module.exports.apiCall = function (method, uri, options, callback){
    if (typeof(options) == "function")
    {
        callback = options, options = false;
    }
    options = options || {};
    options.headers = options.headers || {};
    options.headers["Accept"] = options.headers["Accept"] || options.headers["accept"] || "application/json"; 
    
    options.headers["Host"] = 'localhost';
    options.headers["User-Agent"] = "InternalAPI";
    
    var client = http.createClient(7080, 'localhost');
    
    var responseText = '';
    
    /*client.on('error', function (error) {  //Error checking
        sys.debug(sys.inspect(error));
        sys.debug(responseText);
        throw error;
    });*/
    
    if (method == "GET" || method == "HEAD") {
        options.data = null;
    } else if (options.data) {
        options.headers["Content-Length"] = options.data.length;
        
        if (!options.headers["Content-Type"]) {
            options.headers["Content-Type"] = "text/plain;charset=UTF-8";
        }
    }
    
    sys.debug(sys.inspect(options.headers));
    
    var request = client.request(method, uri, options.headers);
    if (options.data) request.write(options.data);
    
    request.on('response', function (response){
        response.setEncoding('utf8');
        sys.debug(response);
        sys.debug(response.statusCode);
        sys.debug(JSON.stringify(response.headers));
        response.on("data", function(chunk){
            sys.debug(chunk);
            responseText += chunk;
        });
        response.on("end", function(){
            sys.debug(responseText);
            callback(JSON.parse(responseText));
        });
    });
            
    request.end();
}
