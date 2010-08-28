var connect = require('connect'),
    //dispatch = require('dispatch'),
    quip = require('quip'),
    base = require('./lib/base');

//var urls = base.urls;
//
//urls['/club'] = require('./lib/club').urls;
//urls['/forum'] = require('./lib/forum').urls;
//urls['/game'] = require('./lib/game').urls;
//urls['/news'] = require('./lib/news').urls;
//urls['/player'] = require('./lib/player').urls;

var web_server = connect.createServer(
    //connect.responseTime(), //adds header w/ timing information
    connect.logger(), //log to terminal
    connect.conditionalGet(), //adds not-modified support
    connect.cache(), //adds caching
    connect.gzip(), //compresses various content type responses
    connect.compiler({src: __dirname + "/media/css", enable: ["less"]}), //compiles less files into css to serve statically
    connect.staticProvider(__dirname + "/media"), //serve static files in the media directory
    //connect.redirect(), //allow easy redirects
    connect.cookieDecoder(), //populates req.cookies
    quip(), //allow easy simple output
    connect.router(require('./lib/base').urls('')),
    connect.router(require('./lib/club').urls('/club')),
    connect.router(require('./lib/forum').urls('/forum')),
    connect.router(require('./lib/game').urls('/game')),
    connect.router(require('./lib/news').urls('/news')),
    connect.router(require('./lib/player').urls('/player'))
    //vhost
    //dispatch(urls) //pass along requests to various functions
);

web_server.listen(3000);
