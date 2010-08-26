var connect = require('connect');

var web_server = connect.createServer(
    connect.logger(), //log to terminal
    connect.responseTime(), //adds header w/ timing information
    connect.conditionalGet(), //adds not-modified support
    connect.cache(), //adds caching
    connect.gzip(), //compresses various content type responses
    connect.staticProvider(__dirname + "/media"),
    function (req, res, next){

    }
);

web_server.listen(3000);
