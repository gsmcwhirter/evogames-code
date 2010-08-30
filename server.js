var connect = require('connect'),
    crypto = require('crypto'),
    fs = require('fs');
    
var vhosts, web_server, ssl_server;
    
var config = {
	use_vhosts: false,
	use_ssl: true,
	//ssl_pkey: __dirname+'/certificates/privatekey.pem',
	//ssl_cert: __dirname+'/certificates/certificate.pem',
	ssl_pkey: '/etc/ssl.key/server.key',
	ssl_cert: '/etc/ssl.key/server.crt',
	ssl_port: 7443,
	server_port: 7080
};

connect.cache(100000);

var server = function (ssl){
	ssl = ssl | false;
	var s = connect.createServer(
		connect.logger(), //log to terminal
		connect.conditionalGet(), //adds not-modified support
		connect.cache(), //adds caching
		connect.gzip(), //compresses various content type responses
		connect.cookieDecoder(), //populates req.cookies
		connect.router(require('./lib/default').urls(ssl, '')),
		connect.router(require('./lib/club').urls(ssl, '/club')),
		connect.router(require('./lib/forum').urls(ssl, '/forum')),
		connect.router(require('./lib/game').urls(ssl, '/game')),
		connect.router(require('./lib/news').urls(ssl, '/news')),
		connect.router(require('./lib/player').urls(ssl, '/player')),
		connect.compiler({src: __dirname + "/media/css", enable: ["less"]}), //compiles less files into css to serve statically
		connect.staticProvider(__dirname + "/media") //serve static files in the media directory
	);
	
	if (ssl)
	{
		var pkey = fs.readFileSync(config.ssl_pkey).toString();
		var cert = fs.readFileSync(config.ssl_cert).toString();
		var ssl_creds = crypto.createCredentials({key: pkey, cert: cert});
		s.setSecure(ssl_creds);
	}
	
	return s;
}

web_server = server(false);

if (config.use_ssl)
{
	ssl_server = server(true);
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
