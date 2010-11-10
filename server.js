var express = require('express'),
    base = require('./lib/base'),
    fs = require('fs');

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
	    express.logger(),
	    express.conditionalGet(),
	    express.cookieDecoder(),
	    express.session({fingerprint: base.connectionFingerprint, secret: base_config().session_secret}),
	    express.bodyDecoder(),
	    express.cache()
	);
	
	app.configure(function (){
	    app.use(base.middleware.determineLogin());
	    app.use(base.middleware.prepareMenus());
	    app.use(app.router);
	    
	    app.set('views', __dirname+"/views");
	    app.set('view engine', 'jade');
	    app.set('view options', {layout: ssl ? 'layout/ssl' : 'layout/main'});
	    
	    app.set('smtp config', base_config().smtp);
	    
	    app.error(base.handleError);
	    
	    var sysconf = base_config().system;
	    sysconf.is_ssl = ssl;
	    
	    app.helpers({
            system: sysconf,
            menu_list: false,
            avatar: function (email, size){
                if (typeof email == "object" && email.email_history && email.email_history.length)
                {
                    if (email.gravatar_url)
                    {
                        return email.gravatar_url + "&d=" + encodeURI("http://www.evogames.org" + sysconf.default_avatar);
                    }
                    else
                    {
                        var us = require('underscore');
                        email = us._.last(email.email_history).email;
                    }
                }
                
                email = email + "";
                size = size || 64;
                return base.util.gravatar_url(email, size) + "&d=" + encodeURI("http://www.evogames.org" + sysconf.default_avatar);
            }
        });
        
        app.dynamicHelpers({
            player: function (req, res){
                return req.player;
            },
            date: function (req, res){
                return function (string_or_int, format){
                    format = format || req.player.date_format || sysconf.date_format || "Y-m-d";
                    return base.util.date(string_or_int, req.player.timezone || sysconf.default_timezone || "Etc/UTC").format(format);
                };
            },
            time: function (req, res){
                return function (string_or_int, format){
                    format = format || req.player.time_format || sysconf.time_format || "H:i:s";
                    return base.util.date(string_or_int, req.player.timezone || sysconf.default_timezone || "Etc/UTC").format(format);
                };
            },
            datetime: function (req, res){
                return function (string_or_int, format){
                    format = format || req.player.datetime_format || sysconf.datetime_format || "";
                    return base.util.date(string_or_int, req.player.timezone || sysconf.default_timezone || "Etc/UTC").format(format);
                }
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
	    app.use(ssl ? base.middleware.forceNonSSL() : base.middleware.nice404());
	    
	    app.set('sys config', config(ssl, 'development'));
	});
	
	app.configure('production', function (){
	    app.use(ssl ? base.middleware.forceNonSSL() : base.middleware.nice404());
	    
	    app.set('sys config', config(ssl, 'production'));
	});
		
	require('./lib/default').urls(ssl, '')(app);
	require('./lib/group').urls(ssl, '/group')(app);
	require('./lib/game').urls(ssl, '/game')(app);
	require('./lib/news').urls(ssl, '/news')(app);
	require('./lib/player').urls(ssl, '/player')(app);
	//require('./lib/issues').urls(ssl, '/issues')(app);
	require('./lib/api').urls(ssl, '/api')(app);
	
	return app;
}

servers.web = server(false);
servers.web.listen(servers.web.set('sys config').server_port);

servers.ssl = server(true);
servers.ssl.listen(servers.ssl.set('sys config').server_port);
