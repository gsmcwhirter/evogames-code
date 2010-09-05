var connect = require('connect'),
    form = require('connect-form'),
    mw = require('./lib/base').middleware;
    
var servers;
    
var config = require('./lib/base').config;

connect.cache(100000);

var server = function (ssl){
	ssl = ssl || false;
	var s = connect.createServer(
		connect.logger(), //log to terminal
		connect.conditionalGet(), //adds not-modified support
		connect.cache(), //adds caching
		connect.gzip(), //compresses various content type responses
		connect.cookieDecoder(), //populates req.cookies
		form({keepExtensions: true}),
		mw.determineLogin(),
		connect.compiler({src: __dirname + "/media/css", enable: ["less"]}), //compiles less files into css to serve statically
		connect.router(require('./lib/default').urls(ssl, '')),
		connect.router(require('./lib/club').urls(ssl, '/club')),
		connect.router(require('./lib/forum').urls(ssl, '/forum')),
		connect.router(require('./lib/game').urls(ssl, '/game')),
		connect.router(require('./lib/news').urls(ssl, '/news')),
		connect.router(require('./lib/player').urls(ssl, '/player')),
		connect.router(require('./lib/api').urls(ssl, '/api')),
		connect.staticProvider(__dirname + "/media"), //serve static files in the media directory
		ssl ? mw.forceNonSSL() : mw.nice404()
	);
	
	if (ssl && !config.fake_ssl)
	{
	    var fs = require('fs'),
	        crypto = require('crypto');
	    
		var pkey = fs.readFileSync(config.ssl_pkey).toString();
		var cert = fs.readFileSync(config.ssl_cert).toString();
		var ssl_creds = crypto.createCredentials({key: pkey, cert: cert});
		s.setSecure(ssl_creds);
	}
	
	return s;
}

servers.web = server(false);
servers.web.listen(config.server_port);

if (config.use_ssl)
{
    servers.ssl = server(true);
    servers.ssl.listen(config.ssl_port);
}

