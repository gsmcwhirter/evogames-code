var jade = require('jade'),
    couchdb = require('../couchdb'),
    util = require('./util'),
    dt = require('../datetime'),
    fs = require('fs'),
    sys = require('sys');
    
var config = {
	use_vhosts: false,
	use_ssl: true,
	fake_ssl: true,
	ssl_pkey: '/etc/ssl.key/server.key',
	ssl_cert: '/etc/ssl.key/server.crt',
	ssl_port: 7443,
	server_port: 7080,
	couchdb: 'http://localhost:5984/node_playground',
	login_cookie: 'NPLogin'
};

module.exports.config = config;  

module.exports.renderPage = function(res, page, context, headers, is_ssl){
    //TODO: add menu stuff
    if (!page)
    {
        throw new Error('you must specify a page to render.');
    }
    context = context || {};
    headers = headers || {};
    is_ssl = is_ssl || false;
    
    var default_context = function (){
        return {
            player: false,
            system: {
                title: 'Demo System',
                name: 'Demo System',
                copyright: '&copy; Gregory McWhirter 2010',
                description: '',
                keywords: '',
                default_avatar: '/images/djo_avatar.jpg',
                is_ssl: false,
                analytics: ''
            },
            menu_content: {
                left: '',
                right: ''
            },
            body_content: ''
        };
    };
    
    context.menus = context.menus || ["main"];
    context.default = default_context();
    context.default.system.is_ssl = is_ssl;
    
    var menu_data = [];
    var compile_menus = function (tmenus, callback){
        var menus = tmenus;
        var first = menus.shift();
        if (!first)
        {
            callback(menu_data);
        }
        else
        {
            getMenus(first, function(menu){
                var item;
                do {
                    item = menu.shift();
                    if (item) menu_data.push(item);
                } while (item);
                
                compile_menus(menus, callback);
            });
        }
    }
    
    compile_menus(context.menus, function(mdata){
        mdata = parseMenus(mdata); 
        
        jade.renderFile(__dirname+"/../templates/"+page, {cache: true, filename: page, locals: context}, function(err,html){
            if(err)
            {
                res.writeHead(500, {'Content-type': 'text/plain'});
                res.end("Something broke rendering the page: "+err, "utf8");
            }
            else
            {
                var dcontext = default_context();
                if (context.player)
                {
                    dcontext.player = context.player;
                }
                dcontext.system.is_ssl = is_ssl;
                dcontext.body_content = html;
                
                var mleft = fs.readFileSync(__dirname+"/../templates/base/menu_left.jade");
                var mright = fs.readFileSync(__dirname+"/../templates/base/menu_right.jade");
                dcontext.menu_content.left = jade.render(mleft, {locals: {menus: mdata}});
                dcontext.menu_content.right = jade.render(mright, {locals: {}});
                
                jade.renderFile(__dirname+"/../templates/layout.jade", {cache: true, filename: "layout.jade", locals: dcontext}, 
                    function(err, html){
                        if(err)
                        {
                            res.writeHead(500, {'Content-type': 'text/plain'});
                            res.end("Something broke rendering the full page: " + err, "utf8");
                        }
                        else
                        {
                            headers['Content-type'] = headers['Content-type'] || 'text/html';
                            res.writeHead(200, headers);
                            res.end(html, 'utf8');
                        }
                });
            }
        });
    });
};

module.exports.renderHeaders = function (res, code, headers){
    res.writeHead(code,headers);
};

module.exports.renderText = function (res, text, done, encoding){
    encoding = encoding || 'utf8';
    done = done || false;
    res.write(text, encoding);
    if (done)
    {
        res.end();
    }
};

var permRedirect = function (res, location){
    var body, headers;
    headers = {
        'Location': location
    }
    res.writeHead(301, headers);
    body = '<html><head><title>Page Moved</title></head><body><p>';
    body = body + 'The page you requested has permanently moved: <a href="'+location+'">'+location+'</a>.';
    body = body + '</p></body></html>';
    res.end(body, 'utf8');
};

module.exports.permRedirect = permRedirect;

module.exports.tempRedirect = function (res, location){
    var body, headers;
    headers = {
        'Location': location
    }
    res.writeHead(302, headers);
    body = '<html><head><title>Page Moved</title></head><body><p>';
    body = body + 'The page you requested has temporarily moved: <a href="'+location+'">'+location+'</a>.';
    body = body + '</p></body></html>';
    res.end(body, 'utf8');
};

module.exports.pageNotFound = function (res){
    res.writeHead(404);
    res.end('');
};

var addHeader = function (type, value, hdrs)
{
    var headers = hdrs || {};
    
    if (headers instanceof Array)
    {
        headers.push([type, value]);
    }
    else
    {
        if (headers[type])
        {
            var h2 = [];
            
            headers.forEach(function (val, key){
                h2.push([key, val]);
            });
            
            h2.push([type, value]);
            headers = h2;
        }
        else
        {
            headers[type] = value;
        }
    }
    
    return headers;
};

module.exports.addHeader = addHeader;

var setCookie = function (name, value, hdrs, expires, path, domain, httponly)
{
    var cstr = name + "=" + value;
    
    if (expires)
    {
        expires = dt.date("r",dt.strtotime(expires));
        cstr = cstr + "; expires="+expires;
    }
    
    if (path)
    {
        cstr = cstr + "; path="+path;
    }
    
    if (domain)
    {
        cstr = cstr + "; domain="+domain;
    }
    
    if (httponly)
    {
        cstr = cstr + "; HttpOnly";
    }
    
    return addHeader('Set-Cookie',cstr, hdrs);
};

module.exports.setCookie = setCookie;

module.exports.clearCookie = function (name, hdrs)
{
    return setCookie(name, '', hdrs, dt.date("r", dt.strtotime("-7 days")));
}

module.exports.forceSSL = function (req, res){
    var spl = req.headers.host.split(':');
    var host = spl[0];
    var port = (spl.length > 0) ? spl[1] : false;
    var loc = "https://" + host + (port ? ':'+port : '') + req.url;
    
    permRedirect(res, loc); 
};

module.exports.determine_login = function (){
    return function (req, res, next){
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

var getMenus = function (menu_group, callback){
    if (typeof(callback) != 'function') callback = function (rows){};
    
    menu_group = menu_group || "main";
    var url = config.couchdb+"/_design/admin/_view/menus/"+util.encodeOptions({include_docs: true, startkey: [menu_group], endkey: [menu_group,2,2]});
    var creq = new couchdb.Request(function(responseText){
        if (typeof(responseText) == "string" || responseText instanceof String)
        {
            var res = JSON.parse(responseText);
        }
        else
        {
            var res = responseText;
        }
        
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
    
}

var parseMenus = function (imenus){
    var menus = [];
    var last;
    var last_doc;
    
    if (!(imenus instanceof Array))
    {
        return false;
    }
    
    imenus.forEach(function (item){
        if (item.key[1] != last)
        {
            if (last_doc && last_doc.items.length != 0)
            {
                menus.push(last_doc);
            }
            
            last = item.key[1];
            last_doc = item.doc;
            last_doc.items = [];
        }
        else
        {
            last_doc.items.push(item.value);
        }
    });
    
    if (last_doc.items.length != 0)
    {
        menus.push(last_doc);
    }
    
    return menus;
}

module.exports.getMenus = getMenus;
module.exports.parseMenus = parseMenus;

module.exports.util = util;
