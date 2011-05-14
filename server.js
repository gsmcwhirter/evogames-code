var express = require('express'),
    base = require('./lib/base'),
    SMTP = require('./lib/smtp'),
    API = require('./lib/api/internal'),
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
    base.middleware.csrf.check,
    base.middleware.determineLogin(),
    base.middleware.prepareMenus()
);

base.configureServer(server);

server.configure(function (){
    var couchdb = new base.couchdb(config.couchdb);
    var iapi = new API(couchdb);
    var smtp = new SMTP(config.smtp);

    this.set('sys config', config.system);
    this.set('iapi', iapi);
    this.set('smtp', smtp);
    this.set('views', __dirname+"/views");
    this.set('view engine', 'jade');
    this.set('view options', {layout: 'layout/main'});

    this.redirect("login", "/login");

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
    //this.use('/issues', require('./lib/issues'));

    this.use(base.middleware.nice404());
});

module.exports = server;