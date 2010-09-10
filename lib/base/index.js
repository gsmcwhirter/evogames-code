var util = require('./util'),
    middleware = require('./middleware'),
    http = require('http'),
    sys = require('sys');

http.ServerResponse.prototype.setCookie = function (name, value, expires, path, domain, httponly)
{
    var cstr = name + "=" + value;
    
    if (expires)
    {
        cstr = cstr + "; expires="+expires;
    }
    
    if (path)
    {
        cstr = cstr + "; path="+path;
    }
    
    if (domain)
    {
        cstr = cstr + "; domain="+domain;
    }
    
    if (httponly)
    {
        cstr = cstr + "; HttpOnly";
    }
    
    this.header('Set-Cookie', cstr);
};

http.ServerResponse.prototype.clearCookie = function (name)
{
    var date = new Date();
    date.setDate(date.getDate() - 7);
    this.setCookie(res, name, '', date.toUTCString());
}

http.ServerResponse.prototype.redirectTo = function (loc, status)
{
    status = status || 301;
    
    this.header("Location", loc);
    var self = this;
    this.render('errors/redirect', {layout: false, locals: {loc: loc}}, function (err, str){
        self.send(str, status);
    });
}

var forceSSL = function (req, res, next){
    var spl = req.headers.host.split(':');
    var host = spl[0];
    var port = spl[1] || false;
    if (port == "7080")
    {
        var loc = "http://" + host + (':7443') + req.url;
    }
    else
    {
        var loc = "https://" + host + (port ? ':'+port : '') + req.url;
    }
    
    res.redirectTo(loc, 301);
};

var verifyRecaptcha = function (req, rc_challenge, rc_response, callback){
    var http = require('http');
    var config = req.app.set('config');
        
    var recaptcha = {
        verify: false,
        error: 'not initialized'
    };
    
    var host = req.headers.host.split(":")[0];
    if (host == "localhost") host = "evogames.org";
    if (host.substring(0,4) == "www.") host = host.substring(4, host.length);
    
    var rc_keys = config.recaptcha_keys[host];
    
    var client = http.createClient(80,"www.google.com");
    
    client.on('error', function (err){
        throw err;
    });
    
    var remoteip = req.headers["X-Real-IP"] || req.connection.remoteAddress;
    
    var data = util.encodeOptions({
        "privatekey": rc_keys["private"],
        "remoteip": remoteip,
        "challenge": rc_challenge,
        "response": rc_response
    });
    
    data = data.substring(1, data.length);
        
    var headers = {
        "Host": "www.google.com",
        "Content-type": "application/x-www-form-urlencoded;",
        "Content-length": data.length
    };
    
    var respData = '';
    var request = client.request("POST", "/recaptcha/api/verify", headers);
    request.write(data);
    request.on('response', function(response){
        response.setEncoding('utf8');
        response.on('data', function (chunk){
            respData += chunk;
        });
        response.on('end', function (){
            
            var respLines = respData.split("\n");
            if (respLines[0].trim() == "true")
            {
                recaptcha.verify = true;
                recaptcha.error = '';
            } 
            else
            {
                recaptcha.verify = false;
                recaptcha.error = respLines[1].trim();
            }
            
            callback(recaptcha);
        });
    });
};

function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

sys.inherits(NotFound, Error);

function handle404(err, req, res, next){
     if (err instanceof NotFound) {
        res.render('errors/page_not_found', {layout: 'layout_error'}, function (err, str){
            res.send(str, 404);
        });
    } else {
        next(err);
    }
}

function handle500(err, req, res, next){
    res.render('errors/app_error', {locals: {error: err}, layout: 'layout_error'}, function (err, str){
        res.send(str, 500);
    });
}

var connectionFingerprint = function (req){
    return req.headers['user-agent']+(req.headers["X-Real-IP"] || req.connection.remoteAddress) || '';
}

module.exports.forceSSL = forceSSL;
module.exports.verifyRecaptcha = verifyRecaptcha;
module.exports.NotFound = NotFound;
module.exports.handle404 = handle404;
module.exports.handle500 = handle500;
module.exports.connectionFingerprint = connectionFingerprint;

module.exports.middleware = middleware;
module.exports.util = util;
