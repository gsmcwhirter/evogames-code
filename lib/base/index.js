var util = require('./util'),
    middleware = require('./middleware'),
    Recaptcha = require('recaptcha').Recaptcha,
    express = require('express');

var createServer = function (){
    var app = express.createServer();

    configureServer(app);

    return app;
}

var configureServer = function (app){
    app.redirect("login", "/login");
    app.locals({menu_list: []});
    app.helpers(serverHelpers);
    app.dynamicHelpers(dynamicHelpers);

    return app;
}

var serverHelpers = {

};

var dynamicHelpers = {
    csrf: middleware.csrf.token,
    system: function (req, res){
        return req.app.set('sys config');
    },
    avatar: function (req, res){
        var sysconf = req.app.set('sys config');
        return function (email, size){
            if (typeof email == "object" && email.email_history && email.email_history.length)
            {
                if (email.gravatar_url)
                {
                    return email.gravatar_url + "&d=" + encodeURI("http://www.evogames.org" + sysconf.default_avatar);
                }
                else
                {
                    email = email.email_history[email.email_history.length - 1].email;
                }
            }

            email = email + "";
            size = size || 64;
            return util.gravatar_url(email, size) + "&d=" + encodeURI("http://www.evogames.org" + sysconf.default_avatar);
        };
    },
    player: function (req, res){
        return req.player;
    },
    date: function (req, res){
        var sysconf = req.app.set('sys config');
        return function (string_or_int, format){
            format = format || req.player.date_format || sysconf.date_format || "Y-m-d";
            return util.date(string_or_int, req.player.timezone || sysconf.default_timezone || "Etc/UTC").format(format);
        };
    },
    time: function (req, res){
        var sysconf = req.app.set('sys config');
        return function (string_or_int, format){
            format = format || req.player.time_format || sysconf.time_format || "H:i:s";
            return util.date(string_or_int, req.player.timezone || sysconf.default_timezone || "Etc/UTC").format(format);
        };
    },
    datetime: function (req, res){
        var sysconf = req.app.set('sys config');
        return function (string_or_int, format){
            format = format || req.player.datetime_format || sysconf.datetime_format || "";
            return util.date(string_or_int, req.player.timezone || sysconf.default_timezone || "Etc/UTC").format(format);
        }
    },
    flash: function (req, res){
        return function (type){return req.flash(type)};
    }
};

var verifyRecaptcha = function (req, challenge, response, callback){
    var config = req.app.set('sys config');

    var host = req.headers.host.split(":")[0];
    var secure = true;
    if (host == "localhost") host = "evogames.org", secure = false;
    if (host.substring(0,4) == "www.") host = host.substring(4, host.length);
    
    var rc_keys = config.recaptcha_keys[host];
    
    var data = {
        remoteip: req.headers["X-Real-IP"] || req.connection.remoteAddress,
        challenge: challenge,
        response: response
    };
    
    var recaptcha = new Recaptcha(rc_keys["public"], rc_keys["private"], data, secure);
    
    recaptcha.verify(function (success, error_code){
        callback({verify: success, error: error_code});
    });
}

var generateRecaptcha = function (req){
    var config = req.app.set('sys config');

    var host = req.headers.host.split(":")[0];
    var secure = true;
    if (host == "localhost") host = "evogames.org", secure = false;
    if (host.substring(0,4) == "www.") host = host.substring(4, host.length);
    
    var rc_keys = config.recaptcha_keys[host];
    
    var recaptcha = new Recaptcha(rc_keys["public"], rc_keys["private"], secure);
    
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
            res.render('errors/access_denied', {crumbs: [], description: "An error has occurred..."});
            break;
        case 3: //LoggedIn
            res.render('errors/logged_in', {crumbs: [], redirect: {href: '/'}, description: "An error has occurred..."});
            break;
        case 4: //NotLoggedIn
            res.render('errors/not_logged_in', {crumbs: [], redirect: {href: '/login'}, description: "An error has occurred..."});
            break;
        case 5: //Forbidden
            res.render('errors/forbidden', {layout: 'layout/error', description: "An error has occurred..."}, function (err, str){
                if (err) str = err.toString();
                res.send(str, 403);
            });
            break;
        case 6: //Lockout
            res.render('errors/lockout', {layout: 'layout/error', description: "An error has occurred..."});
            break;
        case 7: //SysError
        default:
            res.render('errors/app_error', {layout: 'layout/error', description: "An error has occurred...", error: err}, function (err, str){
                if (err) str = err.toString();
                res.send(str, 500);
            });
            //next();
            //next(err);
    }
}

var connectionFingerprint = function (req){
    return req.headers['user-agent']+(req.headers["X-Real-IP"] || req.connection.remoteAddress) || '';
}

var page = function (template, crumbs){
    return function (req, res, next){res.render(template, {crumbs: crumbs || []});};
};

var redirect = function (location){
    return function (req, res, next){res.redirect(location);};
}

module.exports = {
    createServer: createServer,
    configureServer: configureServer,

    verifyRecaptcha: verifyRecaptcha,
    generateRecaptcha: generateRecaptcha,
    handleError: handleError,
    connectionFingerprint: connectionFingerprint,
    page: page,
    redirect: redirect,

    middleware: middleware,
    util: util,
    auth: require('./auth'),
    errors: require('./errors'),
    couchdb: require('./couchdb')
};