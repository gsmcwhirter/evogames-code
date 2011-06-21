var cluster = require('cluster');

var cserver = cluster('./app');

    cserver.use(cluster.logger('/var/log/node/evogames'))
           .use(cluster.stats())
           .use(cluster.pidfiles('/var/run/node/evogames'))
           .use(cluster.cli())
           .use(cluster.repl(7090));

//require('./socketapp')(cserver);
cserver.listen(7080);
