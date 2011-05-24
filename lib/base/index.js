var util = require('./util'),
    middleware = require('./middleware'),
    errors = require('./errors'),
    Recaptcha = require('recaptcha').Recaptcha;

var verifyRecaptcha = function (req, challenge, response, callback){
    var config = req.app.set('sys config');

    var host = req.headers.host.split(":")[0];
    if (host == "localhost") host = "evogames.org";
    if (host.substring(0,4) == "www.") host = host.substring(4, host.length);
    
    var rc_keys = config.recaptcha_keys[host];
    
    var data = {
        remoteip: req.headers["X-Real-IP"] || req.connection.remoteAddress,
        challenge: challenge,
        response: response
    };
    
    var recaptcha = new Recaptcha(rc_keys["public"], rc_keys["private"], data);
    
    recaptcha.verify(function (success, error_code){
        callback({verify: success, error: error_code});
    });
}

var generateRecaptcha = function (req){
    var config = req.app.set('sys config');

    var host = req.headers.host.split(":")[0];
    if (host == "localhost") host = "evogames.org";
    if (host.substring(0,4) == "www.") host = host.substring(4, host.length);
    
    var rc_keys = config.recaptcha_keys[host];
    
    var recaptcha = new Recaptcha(rc_keys["public"], rc_keys["private"]);
    
    return recaptcha;
}

var handleError = function (err, req, res, next){
    switch (err.errcode){
        case 1: //NotFound
            res.render('errors/page_not_found', {layout: 'layout/error'}, function (err, str){
                if (err) str = err.toString();
                res.send(str, 404);
            });
            break;
        case 2: //AccessDenied
            res.render('errors/access_denied', {locals: {description: "An error has occurred..."}});
            break;
        case 3: //LoggedIn
            res.render('errors/logged_in', {locals: {redirect: {href: '/'}, description: "An error has occurred..."}});
            break;
        case 4: //NotLoggedIn
            res.render('errors/not_logged_in', {locals: {redirect: {href: '/player/login'}, description: "An error has occurred..."}});
            break;
        case 5: //Forbidden
            res.render('errors/forbidden', {layout: 'layout/error'}, function (err, str){
                if (err) str = err.toString();
                res.send(str, 403);
            });
        default:
            next(err);
            //express.errorHandler({ dumpExceptions: true, showStack: true })(err, req, res, next);
            /*res.render('errors/app_error', {locals: {error: err}, layout: 'layout/error'}, function (err, str){
                if (err) str = err.toString();
                res.send(str, 500);
            });*/
    }
}

var connectionFingerprint = function (req){
    return req.headers['user-agent']+(req.headers["X-Real-IP"] || req.connection.remoteAddress) || '';
}

var page = function (template, crumbs){
    return function (req, res, next){res.render(template, {locals: {crumbs: crumbs || []}});};
};

module.exports.verifyRecaptcha = verifyRecaptcha;
module.exports.generateRecaptcha = generateRecaptcha;
module.exports.handleError = handleError;
module.exports.connectionFingerprint = connectionFingerprint;
module.exports.page = page;

module.exports.errors = errors;
module.exports.middleware = middleware;
module.exports.util = util;

var couchdb = module.exports.couchdb = require('./couchdb');

