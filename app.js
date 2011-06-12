var express = require('express'),
    base = require('./lib/base'),
    SMTP = require('./lib/smtp'),
    API = require('./lib/api/internal'),
    fs = require('fs'),
    RedisStore = require('connect-redis')(express),
    trustReverseProxy = require('./lib/trustReverseProxy');

require('./lib/base/mixins');
    
var config = JSON.parse(fs.readFileSync(__dirname + '/config.live.json', 'utf8'));

var server = express.createServer();

base.configureServer(server);

var secure_session = true;

server.configure('development', function (){
    this.use(express.profiler());
    this.use(express.logger());

    secure_session = false;
});

server.configure(function (){
    this.use(express.responseTime());
    this.use(function (req, res, next){
        var sys = require("util");
        sys.puts(sys.inspect(req.headers));

        next();
    });
    this.use(trustReverseProxy({
        proxyID: 'X-EvoGames-Proxy',
        trust: function (req){
            return req.headers["X-EvoGames-Proxy"];
        },
        isSecure: function(req) {
            return req.headers['X-Forwarded-Secure'] == 1;
        }
    }));
    this.use(express.cookieParser());
    this.use(express.session({
        store: new RedisStore,
        fingerprint: base.connectionFingerprint,
        secret: config.session_secret,
        cookie: { path: '/', httpOnly: true, expires: false, secure: secure_session}
    }));
    this.use(express.bodyParser());
    this.use(base.middleware.csrf.check);
    this.use(base.middleware.determineLogin());

    var couchdb = new base.couchdb(config.couchdb);
    var iapi = new API(couchdb);
    var smtp = new SMTP(config.smtp);

    this.set('sys config', config.system);
    this.set('iapi', iapi);
    this.set('smtp', smtp);
    this.set('views', __dirname+"/views");
    this.set('view engine', 'jade');
    this.set('view options', {layout: 'layout/main'});

    this.error(base.handleError);

});

server.configure('development', function (){
    this.use(express.static(__dirname + "/media"));
});

server.configure('production', function (){});

server.configure(function (){
    this.use(this.router);

    this.use('/', require('./lib/default'));
    this.use('/player', require('./lib/player'));
    this.use('/group', require('./lib/group'));
    this.use('/news', require('./lib/news'));
    this.use('/api', require('./lib/api'));
    this.use('/game', require('./lib/game'));
    this.use("/help", require('./lib/help'));

    this.use(base.middleware.nice404());
});

module.exports = server;