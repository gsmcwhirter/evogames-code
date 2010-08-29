var connect = require('connect'),
    crypto = require('crypto'),
    fs = require('fs'),
    pb = require('paperboy'),
    sys = require('sys');
    
var vhosts, web_server, ssl_server, pbhandler;
    
var config = {
	use_vhosts: false,
	use_ssl: true,
	ssl_pkey: './certificates/privatekey.pem',
	ssl_cert: './certificates/certificate.pem',
	ssl_port: 443,
	server_port: 80
};

pbhandler = function(req, res, next){
    pb  .deliver(__dirname + "/media", req, res)
		.addHeader('Expires', 300)
		.addHeader('X-PaperRoute','Node')
		.before(function (){
			sys.log('Received Request');
    	})
    	.after(function (statCode){
    		sys.log('Delivered: ' + req.url);
    	})
    	.error(function (statCode, msg){
    		res.writeHead(statCode, {'Content-type': 'text/plain'});
    		res.end("Error: "+msg);
    	})
    	.otherwise(function (err){
    		res.writeHead(404, {'Content-type': 'text/plain'});
    		res.end('');
    	});
};

web_server = connect.createServer(
    connect.logger(), //log to terminal
    connect.conditionalGet(), //adds not-modified support
    connect.cache(), //adds caching
    connect.gzip(), //compresses various content type responses
    //connect.compiler({src: __dirname + "/media/css", enable: ["less"]}), //compiles less files into css to serve statically
    //connect.staticProvider(__dirname + "/media"), //serve static files in the media directory
    connect.cookieDecoder(), //populates req.cookies
    connect.router(require('./lib/default').urls('')),
    connect.router(require('./lib/club').urls('/club')),
    connect.router(require('./lib/forum').urls('/forum')),
    connect.router(require('./lib/game').urls('/game')),
    connect.router(require('./lib/news').urls('/news')),
    connect.router(require('./lib/player').urls('/player')),
    pbhandler
);

if (config.use_ssl)
{
	var pkey = fs.readFileSync(config.ssl_pkey).toString();
	var cert = fs.readFileSync(config.ssl_cert).toString();
	config.ssl_creds = crypto.createCredentials({key: pkey, cert: cert});
	ssl_server = connect.createServer(
		connect.logger(),
		connect.conditionalGet(),
		connect.cache(),
		connect.gzip(),
		//connect.compiler({src: __dirname + "/media/css", enable: ["less"]}), //compiles less files into css to serve statically
		//connect.staticProvider(__dirname + "/media"), //serve static files in the media directory
		connect.cookieDecoder(),
		connect.router(require('./lib/default').sslurls('')),
		connect.router(require('./lib/club').sslurls('/club')),
		connect.router(require('./lib/forum').sslurls('/forum')),
		connect.router(require('./lib/game').sslurls('/game')),
		connect.router(require('./lib/news').sslurls('/news')),
		connect.router(require('./lib/player').sslurls('/player')),
		pbhandler
	);
	ssl_server.setSecure(config.ssl_creds);
}

if (config.use_vhosts)
{
	vhosts = connect.createServer(
		connect.vhost('djo-dev.org',web_server),
		connect.vhost('www.djo-dev.org',web_server)
	);
	
	vhosts.listen(config.server_port);
}
else
{
	web_server.listen(config.server_port);
	if (config.use_ssl)
	{
		ssl_server.listen(config.ssl_port);
	}
}
