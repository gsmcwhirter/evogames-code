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
    
    var menu_data = [];
    for (var midx in context.menus)
    {
        var menu = getMenus(context.menus[midx]);
        var a;
        if (menu)
        {
            do
            {
                a = menu.pop();
                if (a) menu_data.push(a);
            } while (a);
        }
    }
    
    context.default = default_context();
    context.default.system.is_ssl = is_ssl;
    
    var mleft = fs.readFileSync(__dirname+"/../templates/base/menu_left.jade");
    var mright = fs.readFileSync(__dirname+"/../templates/base/menu_right.jade"); 
    
    context.default.menu_content.left = jade.render(mleft, {locals: {menus: menu_data}});
    context.default.menu_content.right = jade.render(mright, {locals: {}});
    
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
            dcontext.menu_content.right = jade.render('img(src="/images/ad_placeholder.jpg", alt="Advertisement")',{locals: dcontext});
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
            
            for (var idx in headers)
            {
                h2.push([idx, headers[idx]]);
            }
            
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

module.exports.determine_login = function (req){
    if (req.cookies && req.cookies[config.login_cookie])
    {
        var url = config.couchdb+"/_design/player/_view/login_tokens/"+util.encodeOptions({include_docs: true, key: req.cookies[config.login_cookie]});
        var creq = couchdb.request("GET", url);
        var resp = JSON.parse(creq.responseText);
        
        if (resp.error)
        {
            return false;
        }
        
        if (resp.rows.length != 1)
        {
            return false;
        }
        
        if (resp.rows[0].doc)
        {
            return resp.rows[0].doc;
        }
        else
        {
            return false;
        }
    }
};

module.exports.forceSSL = function (req, res){
    var spl = req.headers.host.split(':');
    var host = spl[0];
    var port = (spl.length > 0) ? spl[1] : false;
    var loc = "https://" + host + (port ? ':'+port : '') + req.url;
    
    permRedirect(res, loc); 
};

var getMenus = function (menu_group){
    
    menu_group = menu_group || "main";
    var url = config.couchdb+"/_design/admin/_view/menus/"+util.encodeOptions({include_docs: true, startkey: [menu_group]});
    sys.debug(url);
    var resp = new couchdb.Request(); 
    resp.go("GET", url);
    while(!resp.response.done)
    {
        sys.debug(sys.inspect(resp.response));
    }
    var responseText;
    if (typeof(responseText) == "string" || responseText instanceof String)
    {
        var resp = JSON.parse(responseText);
    }
    else
    {
        var resp = responseText;
    }
    
        
    if (resp.error)
    {
        return false;
    }
    else
    {   
        return resp.rows;
    }
}

var parseMenus = function (menus){
    var menus = [];
    var last;
    var last_doc;
    
    if (!(menus instanceof Array))
    {
        return false;
    }
    
    for (var midx in menus)
    {
        if (menus[midx].key[0] != last)
        {
            if (last_doc.items.length != 0)
            {
                menus.push(last_doc);
            }
            
            last = menus[midx].key[0];
            last_doc = menus[midx].doc;
            last_doc.items = [];
        }
        else
        {
            last_doc.items.push(menus[midx].doc);
        }
    }
    
    if (last_doc.items.length != 0)
    {
        menus.push(last_doc);
    }
    
    return menus;
}

module.exports.getMenus = getMenus;
module.exports.parseMenus = parseMenus;

module.exports.util = util;
