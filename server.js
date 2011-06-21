var cluster = require('cluster');

cluster('./app')
    .use(cluster.logger('/var/log/node/evogames'))
    .use(cluster.stats())
    .use(cluster.pidfiles('/var/run/node/evogames'))
    .use(cluster.cli())
    .use(cluster.repl(7090))
    .listen(7080);