var cluster = require('cluster'),
    config = require('./config.live'),
    numWorkers = require('os').cpus().length;

if (cluster.isMaster){
    for (var i = 0; i < numWorkers; i++){
        cluster.fork();
    }

    cluster.on('death', function (worker){
        console.log('worker ' + worker.pid + ' died');
	cluster.fork();
    });
}
else {
    var server = require('./app');

    server.listen(config.port);
}
