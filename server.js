var express = require('express'),
    base = require('./lib/base'),
    fs = require('fs'),
    mw = base.middleware;
var sys = require('sys');
require('./lib/base/mixins');
    
var servers = {};
var base_config = function (){return JSON.parse(fs.readFileSync(__dirname + '/config.live.json'));};

var config = function (ssl, env){
    var conf = base_config().server;
    conf.is_ssl = ssl;
    conf.server_port = ssl ? 7443 : 7080;
    return conf;
};

var server = function (ssl){
	ssl = ssl || false;
	var app = express.createServer(
	    //mw.inspectHeaders(),
	    express.logger(),
	    //express.gzip(),
	    express.conditionalGet(),
	    express.cookieDecoder(),
	    mw.monkeyHeaders('before'),
	    express.session({fingerprint: base.connectionFingerprint, secret: base_config().session_secret}),
	    mw.monkeyHeaders('after'),
	    express.bodyDecoder(),
	    express.cache()
	);
	
	app.configure(function (){
	    app.use(mw.determineLogin());
	    app.use(mw.prepareMenus());
	    app.use(app.router);
	    
	    app.set('views', __dirname+"/views");
	    app.set('view engine', 'jade');
	    app.set('view options', {layout: ssl ? 'layout/ssl' : 'layout/main'});
	    
	    app.set('smtp config', base_config().smtp);
	    
	    app.error(base.handle404);
	    app.error(base.handle500);
	    
	    var sysconf = base_config().system;
	    sysconf.is_ssl = ssl;
	    
	    app.helpers({
            system: sysconf,
            menu_list: false
        });
        
        app.dynamicHelpers({
            player: function (req, res){
                return req.player;
            },
            menus: function (req, res){
                var menus = new req.Menus();
                return function (menu_list){
                    return menus.get(menu_list);
                };
            },
            flash: function (req, res){
                return function (type){return req.flash(type)};
            }
        });
	});
	
	app.configure('development', function (){
	    app.use(express.compiler({src: __dirname + "/media/css", enable: ["less"]}));
	    app.use(express.staticProvider(__dirname + "/media"));
	    app.use(ssl ? mw.forceNonSSL() : mw.nice404());
	    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	    
	    app.set('sys config', config(ssl, 'development'));
	});
	
	app.configure('production', function (){
	    sys.debug('configd');
	    app.use(ssl ? mw.forceNonSSL() : mw.nice404());
	    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	    
	    app.set('sys config', config(ssl, 'production'));
	});
		
	require('./lib/default').urls(ssl, '')(app);
	require('./lib/club').urls(ssl, '/club')(app);
	require('./lib/forum').urls(ssl, '/forum')(app);
	require('./lib/game').urls(ssl, '/game')(app);
	require('./lib/news').urls(ssl, '/news')(app);
	require('./lib/player').urls(ssl, '/player')(app);
	require('./lib/api').urls(ssl, '/api')(app);
	
	return app;
}

servers.web = server(false);
servers.web.listen(servers.web.set('sys config').server_port);

servers.ssl = server(true);
servers.ssl.listen(servers.ssl.set('sys config').server_port);
