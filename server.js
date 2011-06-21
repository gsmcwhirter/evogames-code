var cluster = require('cluster'),
    http = require('http');

cluster('./app')
    .use(cluster.logger('/var/log/node/evogames'))
    .use(cluster.stats())
    .use(cluster.pidfiles('/var/run/node/evogames'))
    .use(cluster.cli())
    .use(cluster.repl(8888))
    .listen(7080);

var ioserver = http.createServer();
ioserver.listen(7081);
require('socketapp')(ioserver);