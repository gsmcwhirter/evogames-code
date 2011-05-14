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

function Menus(){
    this.get = function (menu_list){
        menu_list = menu_list || ["main"];
        
        var data = [];
        var mdata = this.mdata || {};
        
        menu_list.forEach(function (menu){
            if (mdata[menu])
            {
                mdata[menu].forEach(function (menu){
                    data.push(menu);
                });
            }
        });
        
        return data;
    };   
}
    
var prepareMenus = function (){
    return function (req, res, next){
        var config = req.app.set('sys config');
        var api = req.app.set('iapi');
        
        var getMenus = function (callback){
            if (typeof(callback) != 'function') callback = function (rows){};

            api.menus(function (response){
                if (response.error)
                {
                    callback(false);
                }
                else
                {
                    callback(response.rows);
                }
            });
        };

        var parseMenus = function (imenus){
            var menus = {};
            var group;
            var last;
            var last_doc;

            if (!(imenus instanceof Array))
            {
                return false;
            }

            imenus.forEach(function (item){
                if (item.key[0] != group)
                {
                    if (group && last_doc && last_doc.items.length != 0)
                    {
                        menus[group].push(last_doc);
                    }

                    group = item.key[0];
                    menus[group] = [];
                    last = null;
                    last_doc = null;
                }

                if (item.key[1] != last)
                {
                    if (last_doc && last_doc.items.length != 0)
                    {
                        menus[group].push(last_doc);
                    }

                    last = item.key[1];
                    last_doc = item.value;
                    last_doc.items = [];
                }
                else
                {
                    last_doc.items.push(item.value);
                }
            });

            if (group && last_doc && last_doc.items.length != 0)
            {
                menus[group].push(last_doc);
            }

            return menus;
        };

        getMenus(function (rows){
            if (rows)
            {
                Menus.prototype.mdata = parseMenus(rows);
            }
            else
            {
                Menus.prototype.mdata = {};
            }

            req.Menus = Menus;

            next();
        });
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

var loginCheck = function (req, res, next){
    if (!req.player)
    {
        next(new base.errors.NotLoggedIn());
    }
    else {
        next();
    }
};

var loginCheckAjax = function (req, res, next){
    if (!req.player){
        res.writeHead(200, {"Content-type": "application/json"});
        res.end(JSON.stringify({error: "not logged in"}));
    }
    else {
        next();
    }
}

var logoutCheck = function (req, res, next){
    if (req.player){
        next(new base.errors.LoggedIn());
    }
    else {
        next();
    }
};

module.exports = {
    determineLogin: determineLogin,
    prepareMenus: prepareMenus,
    nice404: nice404,
    csrf: csrf,
    loginCheck: loginCheck,
    loginCheckAjax: loginCheckAjax,
    logoutCheck: logoutCheck
}
