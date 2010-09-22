var base = require('../base'),
    api = require('../api/internal');

var determineLogin = function (){
    return function (req, res, next){
        var config = req.app.set('sys config');
        var util = require('./util');
        req.player = false;
        var lcookie = config.login_cookie.toLowerCase();
        
        if (req.cookies && req.cookies[lcookie])
        {
            var ltoken = req.cookies[lcookie];
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
        
        res.redirectMeTo(loc, 301);
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
        
        if (config.is_ssl)
        {
            Menus.prototype.get = function (menu_list){ return []; };
            req.Menus = Menus;
            next();
        }
        else
        {
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
        }
    };
};

var nice404 = function (){
    return function (req, res, next){
        next(new base.errors.NotFound());
    };
};

var monkeyHeaders = function (type){
    if (type == "before")
    {
        return function (req, res, next){
            res._monkeyHeaders = false;
            var writeHead = res.writeHead;
            res.writeHead = function (status, headers){
                if (headers instanceof Array)
                {
                    var headers_arr = headers;
                    headers = {};
                    
                    headers_arr.forEach(function (item){
                        if (headers[item[0]]) headers[item[0]] += "\r\n"+item[0]+": "+item[1];
                        else headers[item[0]] = item[1];
                    });
                }
            
                if (res._monkeyHeaders)
                {
                    if (res._monkeyHeaders instanceof Array)
                    {
                        res._monkeyHeaders.forEach(function (item){
                            if (headers[item[0]]) headers[item[0]] += "\r\n"+item[0]+": "+item[1];
                            else headers[item[0]] = item[1];
                        });
                    }
                    else
                    {
                        Object.keys(res._monkeyHeaders).forEach(function (key){
                            if (headers[key]) headers[key] += "\r\n"+key+": "+res._monkeyHeaders[key];
                            else headers[key] = res._monkeyHeaders[key];
                        });
                    }
                }
                
                res.writeHead = writeHead;
                return res.writeHead(status, headers);
            };
            
            next();
        };
    }
    else if (type == "after")
    {
        return function (req, res, next){
            var writeHead = res.writeHead;
            res.writeHead = function (status, headers){
                res._monkeyHeaders = headers;
                headers = {};
                
                res.writeHead = writeHead;
                return res.writeHead(status, headers);
            };
            
            next();
        };
    }
};

var inspectHeaders = function (){
    return function (req, res, next){
        var writeHead = res.writeHead;
        res.writeHead = function(status, headers){
            //if (req.headers["user-agent"] == "InternalAPI")
            //{
                var sys = require('sys');
                sys.debug(JSON.stringify(headers));
            //}

            // Pass through the writeHead call
            res.writeHead = writeHead;
            return res.writeHead(status, headers);
        };
        
        next();
    };
};

module.exports.determineLogin = determineLogin;
module.exports.forceNonSSL = forceNonSSL;
module.exports.prepareMenus = prepareMenus;
module.exports.nice404 = nice404;
module.exports.inspectHeaders = inspectHeaders;
module.exports.monkeyHeaders = monkeyHeaders;
