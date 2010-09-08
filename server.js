var express = require('express'),
    base = require('./lib/base');
var sys = require('sys');
    
var mw = base.middleware,
    config = base.config;    
    
var servers = {};

var config = function (ssl, env){
    return {
        is_ssl: ssl,
        server_port: ssl ? 7443 : 7080,
        couchdb: 'http://localhost:5984/node_playground',
        login_cookie: 'NPLogin',
        recaptcha_keys: {
            "djo-dev.org": {"public": "6LcNrroSAAAAAF3Q8ELHO2IiHDZy1IISNbOjP3ll", "private": "6LcNrroSAAAAAMuecSF1QKmoh5xFSR6_048kV8dG"},
            "evogames.org": {"public": "6Lc15bwSAAAAAFzr7cwwiY-RcqcybDdU9SArAXWa", "private": "6Lc15bwSAAAAAFCBNv4_mYhTj73DzaVwxgc1YqDW"}
        }
    };
};

var server = function (ssl){
	ssl = ssl || false;
	var app = express.createServer();
	
	app.configure(function (){
	    app.use(express.logger());
	    app.use(express.gzip());
	    app.use(express.conditionalGet());
	    app.use(express.cookieDecoder());
	    app.use(express.bodyDecoder());
	    app.use(mw.determineLogin());
	    app.use(mw.prepareMenus());
	    app.use(express.cache());
	    app.use(app.router);
	    
	    app.set('views', __dirname+"/views");
	    app.set('partials', __dirname+"/views");
	    app.set('view engine', 'jade');
	    app.set('view options', {layout: ssl ? 'layout_ssl' : 'layout'});
	    
	    app.error(base.handle404);
	    app.error(base.handle500);
	    
	    app.helpers({
            system: {
                title: 'EvoGames: Event Verification of Games',
                name: 'EvoGames',
                copyright: '&copy; Gregory McWhirter 2010',
                description: '',
                keywords: '',
                default_avatar: '/images/default_avatar.gif',
                analytics: 'UA-18420729-1',
                error_email: 'greg@evogames.org',
                is_ssl: ssl  
            },
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
            }
        });
	});
	
	app.configure('development', function (){
	    app.use(express.compiler({src: __dirname + "/media/css", enable: ["less"]}));
	    app.use(express.staticProvider(__dirname + "/media"));
	    app.use(ssl ? mw.forceNonSSL() : mw.nice404());
	    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	    
	    app.set('config', config(ssl, 'development'));
	});
	
	app.configure('production', function (){
	    app.use(ssl ? mw.forceNonSSL() : mw.nice404());
	    
	    app.set('config', config(ssl, 'production'));
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
servers.web.listen(servers.web.set('config').server_port);

servers.ssl = server(true);
servers.ssl.listen(servers.ssl.set('config').server_port);

