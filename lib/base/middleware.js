var base = require('../base');

var determineLogin = function (){
    var couchdb = require('../couchdb');
    return function (req, res, next){
        req.player = false;
        
        if (req.cookies && req.cookies[base.config.login_cookie])
        {
            var url = base.config.couchdb+"/_design/player/_view/login_tokens/"+base.util.encodeOptions({include_docs: true, key: req.cookies[base.config.login_cookie]});
            var creq = new couchdb.Request("GET", url, function(responseText){
               var resp = JSON.parse(responseText);
                
                if(!resp.error && resp.rows.length == 1 && resp.rows[0].doc)
                {
                    req.player = resp.rows[0].doc;
                }
                
                next(); 
            });
        }
        else
        {
            next();
        }
    };
};

var verifyRecaptcha = function(){
    var http = require('http'),
        fs = require('fs');
    
    try{
        var kf = new String(fs.readFileSync(__dirname+"/recaptchakeys.csv"));
    } catch (error) {
        return function (req, res, next){
            req.recaptcha = {}
            req.recaptcha.verify = false;
            req.recaptcha.error = 'not initialized';
            
            next();
        }
    }
    var kf_lines = kf.split("\n");
    kf_lines.forEach(function (line){
        line = line.trim();
        if (!line || line[0] == "#") return;
        
        var parts = line.split(",");
        
        if(parts.length < 3) return;
        
        base.config.recaptcha_keys[parts[0]] = {"public": parts[1], "private": parts[2]};
    });
    
    return function (req, res, next){
        var host = req.headers.host.split(':')[0];
        
        req.recaptcha = {}
        req.recaptcha.verify = false;
        req.recaptcha.error = 'not initialized';
        
        rc_keys = base.config.recaptcha_keys[host];
        if (rc_keys &&
            req.form && 
            req.form["recaptcha_challenge_field"] && 
            req.form["recaptcha_response_field"])
        {
            var client = http.createClient(80,"http://www.google.com");
            
            client.on('error', function (err){
                throw err;
            });
            
            var remoteip = req.headers["X-Real-IP"] || req.connection.remoteAddress;
            
            var data = base.util.encodeOptions({
                "privatekey": rc_keys["private"],
                "remoteip": remoteip,
                "challenge": req.form["recaptcha_challenge_field"],
                "response": req.form["recaptcha_response_field"]
            });
            
            var headers = {
                "Host": host,
                "Content-type": "text/plain;charset=UTF-8",
                "Content-length": data.length
            };
            
            var respData = '';
            var request = client.request("POST", "/recaptcha/api/verify", headers);
            request.on('response', function(response){
                response.setEncoding('utf8');
                response.on('data', function (chunk){
                    respData += chunk;
                });
                response.on('end', function (){
                    var respLines = respData.split("\n");
                    if (respLines[0].trim() == "true")
                    {
                        req.recaptcha.verify = true;
                        req.recaptcha.error = '';
                    } 
                    else
                    {
                        req.recaptcha.verify = false;
                        req.recaptcha.error = respLines[1].trim();
                    }
                    
                    next();
                });
            });
        }
        else
        {
            next();
        }
    };
};

var nice404 = function (){
    return function (req, res, next){
        base.pageNotFound(req, res);
    };
};

var forceNonSSL = function (){
    return function (req, res, next){
        var spl = req.headers.host.split(':');
        var host = spl[0];
        var port = spl[1] || false;
        if (port == "7443")
        {
            var loc = "http://" + host + (':7080') + req.url;
        }
        else
        {
            var loc = "http://" + host + (port ? ':'+port : '') + req.url;
        }
        
        base.permRedirect(res, loc);
    }
};

module.exports.determineLogin = determineLogin;
module.exports.nice404 = nice404;
module.exports.verifyRecaptcha = verifyRecaptcha;
module.exports.forceNonSSL = forceNonSSL;
