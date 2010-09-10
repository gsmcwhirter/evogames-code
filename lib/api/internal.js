var http = require('http');

module.exports.apiCall = function (method, uri, options, callback){
    if (typeof(options) == "function")
    {
        callback = options, options = false;
    }
    options = options || {};
    options.headers = options.headers || {};
    options.headers["Accept"] = options.headers["Accept"] || options.headers["accept"] || "application/json"; 
    
    options.headers["Host"] = 'localhost';
    
    var client = http.createClient(7080, 'localhost');
    
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
    
    var responseText = '';
    request.on('response', function(response){
        response.setEncoding('utf8');
        response.on("data", function(chunk){
            responseText += chunk;
        });
        response.on("end", function(){
            callback(JSON.parse(responseText));
        });
    });
            
    request.end();
}
