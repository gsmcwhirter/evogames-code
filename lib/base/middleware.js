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
module.exports.forceNonSSL = forceNonSSL;
