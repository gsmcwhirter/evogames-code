var connect = require('connect'),
    fs = require('fs'),
    crypto = require('crypto');

var server = connect.createServer(connect.logger(),function(req, res){
    res.writeHead(200, {'Content-type': 'text/plain'});
    res.write(JSON.stringify(req.headers),'utf-8');
    //res.writeHead(200, {'Content-type': 'text/plain'});
    res.write('yay!','utf-8');
    res.end();
});

var pkey = fs.readFileSync('./certificates/privatekey.pem').toString();
var cert = fs.readFileSync('./certificates/certificate.pem').toString();
var ssl_creds = crypto.createCredentials({key: pkey, cert: cert});

server.setSecure(ssl_creds);

server.listen(443);
