var errors = require('../base/errors');
var crypto = require('crypto');

var determineLogin = function (){
    return function (req, res, next){
        var config = req.app.set('sys config');
        req.player = false;
        var lcookie = config.login_cookie.toLowerCase();
        
        if (req.cookies && req.cookies[lcookie])
        {
            var ltoken = req.cookies[lcookie];
            var api = req.app.set('iapi');
            api.loginTokens({include_docs: true, key: ltoken}, function (response){
                if(!response.error && response.rows.length == 1 && response.rows[0].doc)
                {
                    req.player = response.rows[0].doc;
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
        next(new errors.NotFound());
    };
};

var csrf = {
    token: function (req, res){
        if (!req.session.csrf){
            req.session.csrf = crypto.createHash('md5').update('' + new Date().getTime() + req.session.lastAccess).digest('hex');
        }

        return req.session.csrf;
    },
    check: function (req, res, next){
        if (req.body && req.method.toLowerCase() == 'post'){
            if (!('csrf' in req.body && req.body.csrf === req.session.csrf)){
                next(new errors.Forbidden("Cross-site request forgery attempt identified."));
            }
        }

        next();
    }
};

module.exports = {
    determineLogin: determineLogin,
    nice404: nice404,
    csrf: csrf
}
