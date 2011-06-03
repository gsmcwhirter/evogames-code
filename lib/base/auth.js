var errors = require('./errors');

var _checkLogin = function (req, res, next){
    if (!req.player){
        return false;
    }
    else {
        return true;
    }
}

var loginCheck = function (req, res, next){
    if (!_checkLogin(req, res, next)){
        next(new errors.NotLoggedIn());
    }
    else {
        next();
    }
};

var loginCheckAjax = function (req, res, next){
    if (!_checkLogin(req, res, next)){
        res.writeHead(200, {"Content-type": "application/json"});
        res.end(JSON.stringify({error: "not logged in"}));
    }
    else {
        next();
    }
}

var logoutCheck = function (req, res, next){
    if (_checkLogin(req, res, next)){
        next(new errors.LoggedIn());
    }
    else {
        next();
    }
};

var _permissionCheck = function (perm, req, res, next){
    if (req.player.is_sysop || (req.player.permissions || []).indexOf(perm) > -1){
        return true;
    }
    else {
        return false;
    }
}

var permissionCheck = function (perm, noforce){
    return function (req, res, next){
        req.perms = req.perms || {};
        if (_permissionCheck(perm, req, res, next)){
            req.perms[perm] = true;
            next();
        }
        else {
            if (noforce){
                req.perms[perm] = false;
                next();
            }
            else {
                next(new base.errors.AccessDenied());
            }
        }
    }
};

var permissionCheckAjax = function (perm, noforce){
    return function (req, res, next){
        req.perms = req.perms || {};
        if (_permissionCheck(perm, req, res, next)){
            req.perms[perm] = true;
            next();
        }
        else {
            if (noforce){
                req.perms[perm] = false;
                next();
            }
            else {
                res.writeHead(200, {"Content-type": "application/json"});
                res.end(JSON.stringify({error: "access denied"}));
            }
        }
    }
}

module.exports = {
    loginCheck: loginCheck,
    loginCheckAjax: loginCheckAjax,
    logoutCheck: logoutCheck,
    permissionCheck: permissionCheck,
    permissionCheckAjax: permissionCheckAjax
}