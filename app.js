var express = require('express'),
    base = require('./lib/base'),
    SMTP = require('./lib/smtp'),
    API = require('./lib/api/internal'),
    fs = require('fs'),
    sys = require("util"),
    RedisStore = require('connect-redis')(express),
    trustReverseProxy = require('./lib/trustReverseProxy'),
    config = require('./config.live');

var server = express.createServer();

base.configureServer(server);

var secure_session = true;

server.configure('development', function (){
    sys.puts("Starting in Development");

    //this.use(express.profiler());
    //this.use(express.logger());

    secure_session = false;
});

server.configure(function (){
    sys.puts(secure_session ? "Using secure cookies" : "Using insecure cookies");

    this.use(express.responseTime());
    this.use(trustReverseProxy({
        proxyID: 'x-evogames-proxy',
        trust: function (req){
            return req.headers["x-evogames-proxy"];
        },
        isSecure: function(req) {
            return req.headers['x-forwarded-secure'] === "1";
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
    this.use(express["static"](__dirname + "/media"));
});

server.configure(function (){
    this.use(this.router);

    this.use('/', require('./lib/default'));
    this.use('/player', require('./lib/player'));
    this.use('/group', require('./lib/group'));
    this.use('/news', require('./lib/news'));
    this.use('/api', require('./lib/api'));
    this.use('/game', require('./lib/game'));
    this.use("/help", require('./lib/help'));
    this.use("/messages", require('./lib/messages'));

    this.use(base.middleware.nice404());

});

server.configure('development', function (){
    /*var ioserver = express.createServer();
    ioserver.listen(7081);
    require('./socketapp')(ioserver);*/

    require('./socketapp')(this);
});

module.exports = server;