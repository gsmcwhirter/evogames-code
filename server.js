var express = require('express'),
    base = require('./lib/base'),
    fs = require('fs');

require('./lib/base/mixins');
    
var config = JSON.parse(fs.readFileSync(__dirname + '/config.live.json', 'utf8'));

var server = express.createServer(
    express.profiler(),
    express.logger(),
    express.responseTime(),
    express.cookieParser(),
    express.session({fingerprint: base.connectionFingerprint, secret: config.session_secret}),
    express.bodyParser(),
    base.middleware.csrf.check(),
    base.middleware.determineLogin(),
    base.middleware.prepareMenus()
);

server.configure(function (){
    var sysconf = config.system;
    var iapi = require('./lib/api/internal');
    var couchdb = new base.couchdb(config.couchdb);
    iapi = new iapi(couchdb);

    server.set('sys config', config.server);
    server.set('iapi', iapi);
    server.set('views', __dirname+"/views");
    server.set('view engine', 'jade');
    server.set('view options', {layout: 'layout/main'});
    server.set('smtp config', config.smtp);

    server.error(base.handleError);

    server.locals({
        system: sysconf,
        menu_list: false
    })

    server.helpers({
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

    server.dynamicHelpers({
        csrf: base.middleware.csrf.token,
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

server.configure('development', function (){
    server.use(express.static(__dirname + "/media"));
    server.use(server.router);
    server.use(base.middleware.nice404());
});

server.configure('production', function (){
    server.use(server.router);
    server.use(base.middleware.nice404());
});


require('./lib/default').urls('')(server);
require('./lib/group').urls('/group')(server);
require('./lib/game').urls('/game')(server);
require('./lib/news').urls('/news')(server);
require('./lib/player').urls('/player')(server);
//require('./lib/issues').urls('/issues')(app);
require('./lib/api').urls('/api')(server);


module.exports = server;