var cluster = require('cluster'),
    http = require('http');

var ioserver = http.createServer();
require('./socketapp')(ioserver);

cluster('./app')
    .set('workers', 1)
    .use(cluster.logger('/var/log/node/evogames-socket'))
    .use(cluster.stats())
    .use(cluster.pidfiles('/var/run/node/evogames-socket'))
    .use(cluster.cli())
    .use(cluster.repl(7091))
    .listen(7081);