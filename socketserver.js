var cluster = require('cluster'),
    https = require('https'),
    fs = require('fs');

var ioserver = https.createServer({
    key: fs.readFileSync("/etc/ssl.key/evogames_trusted.key"),
    cert: fs.readFileSync("/etc/ssl.key/evogames_trusted.crt")
});
require('./socketapp')(ioserver);

cluster('./app')
    .set('workers', 1)
    .use(cluster.logger('/var/log/node/evogames-socket'))
    .use(cluster.stats())
    .use(cluster.pidfiles('/var/run/node/evogames-socket'))
    .use(cluster.cli())
    .use(cluster.repl(7091))
    .listen(7081);