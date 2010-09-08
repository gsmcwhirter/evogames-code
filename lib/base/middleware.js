var base = require('../base'), 
    util = base.util,
    couchdb = require('../couchdb');
//var sys = require('sys');

var determineLogin = function (){
    return function (req, res, next){
        var config = req.app.set('config');
        req.player = false;
        
        if (req.cookies && req.cookies[config.login_cookie])
        {
            var url = config.couchdb+"/_design/player/_view/login_tokens/"+util.encodeOptions({include_docs: true, key: req.cookies[config.login_cookie]});
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
        
        res.redirect(loc);
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
        var config = req.app.set('config');
        
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
                
                var url = config.couchdb+"/_design/admin/_view/menus/";
                var creq = new couchdb.Request(function(responseText){
                    var res = JSON.parse(responseText);
                    
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

module.exports.determineLogin = determineLogin;
module.exports.forceNonSSL = forceNonSSL;
module.exports.prepareMenus = prepareMenus;
module.exports.nice404 = nice404;
