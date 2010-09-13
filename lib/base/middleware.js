var base = require('../base'),
    couchdb = require('../couchdb');

var determineLogin = function (){
    return function (req, res, next){
        var config = req.app.set('sys config');
        var util = require('./util');
        req.player = false;
        var lcookie = config.login_cookie.toLowerCase();
        
        if (req.cookies && req.cookies[lcookie])
        {
            var ltoken = req.cookies[lcookie];
            var url = config.couchdb_server+"/"+config.couchdb+"/_design/player/_view/login_tokens/"+util.encodeOptions({include_docs: true, key: ltoken});
            var creq = new couchdb.Request("GET", url, function(resp){
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
        
        res.redirectTo(loc, 301);
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
                
                var url = config.couchdb_server+"/"+config.couchdb+"/_design/admin/_view/menus/";
                var creq = new couchdb.Request(function(res){
                    if (res.error)
                    {
                        callback(false);
                    }
                    else
                    {   
                        callback(res.rows);
                    }    
                }); 
                creq.go("GET", url);
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
        throw new base.NotFound();
    };
};

var monkeyHeaders = function (type){
    if (type == "before")
    {
        return function (req, res, next){
            res._monkeyHeaders = false;
            var writeHead = res.writeHead;
            res.writeHead = function (status, headers){
                if (res._monkeyHeaders)
                {
                    var headers_bad = headers;
                    
                    if (res._monkeyHeaders instanceof Array)
                    {
                        headers = res._monkeyHeaders;
                    }
                    else
                    {
                        headers = [];
                        
                        Object.keys(res._monkeyHeaders).forEach(function (key){
                            headers.push([key, res._monkeyHeaders[key]]);
                        });
                    }
                    
                    if (headers_bad instanceof Array)
                    {
                        headers_bad.forEach(function (item){
                            headers.push(item);
                        });
                    }
                    else
                    {
                        Object.keys(headers_bad).forEach(function (key){
                            headers.push([key, headers_bad[key]]);
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
            var sys = require('sys');
            sys.debug(sys.inspect(headers));

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
