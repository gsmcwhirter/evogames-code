var jade = require('jade'),
    couchdb = require('../couchdb'),
    util = require('./util'),
    middleware = require('./middleware'),
    dt = require('../datetime'),
    fs = require('fs'),
    sys = require('sys');
    
var config = {
	use_ssl: true,
	fake_ssl: true,
	ssl_pkey: '/etc/ssl.key/server.key',
	ssl_cert: '/etc/ssl.key/server.crt',
	ssl_port: 7443,
	server_port: 7080,
	couchdb: 'http://localhost:5984/node_playground',
	login_cookie: 'NPLogin',
	recaptcha_keys: null
};

var renderPage = function(req, res, page, context, headers, is_ssl, omit_headers){
    if (!page)
    {
        throw new Error('you must specify a page to render.');
    }
    context = context || {};
    headers = headers || {};
    is_ssl = is_ssl || false;
    omit_headers = omit_headers || false;
    
    var system_context = {
        player: req.player,
        title: 'Demo System',
        name: 'Demo System',
        copyright: '&copy; Gregory McWhirter 2010',
        description: '',
        keywords: '',
        default_avatar: '/images/djo_avatar.jpg',
        is_ssl: is_ssl,
        analytics: '',
        error_email: 'system@djo-dev.org',
        menu_content: {
            left: '',
            right: ''
        },
        body_content: ''
    }; 
    
    context.system = system_context;
    
    if (context.system.is_ssl)
    {
        context.menus = [];
    }
    else
    {
        context.menus = context.menus || ["main"];
    }
    
    var menu_data = [];
    var compile_menus = function (menus, callback){
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
    };
    
    compile_menus(context.menus, function(mdata){
        mdata = parseMenus(mdata);
        
        jade.renderFile(__dirname+"/../templates/"+page, {cache: true, filename: page, locals: context}, function(err,html){
            if(err)
            {
                if (!omit_headers) res.writeHead(500, {'Content-type': 'text/plain'});
                res.end("Something broke rendering the page: "+err, "utf8");
            }
            else
            {
                system_context.body_content = html;
                
                var mleft = fs.readFileSync(__dirname+"/../templates/base/menu_left.jade");
                system_context.menu_content.left = jade.render(mleft, {locals: {menus: mdata}});
                //var mright = fs.readFileSync(__dirname+"/../templates/base/menu_right.jade");
                //dcontext.menu_content.right = jade.render(mright, {locals: {}});
                
                jade.renderFile(__dirname+"/../templates/layout.jade", {cache: true, filename: "layout.jade", locals: system_context}, 
                    function(err, html){
                        if(err)
                        {
                            if (!omit_headers) res.writeHead(500, {'Content-type': 'text/plain'});
                            res.end("Something broke rendering the full page: " + err, "utf8");
                        }
                        else
                        {
                            headers['Content-type'] = headers['Content-type'] || 'text/html';
                            if (!omit_headers) res.writeHead(200, headers);
                            res.end(html, 'utf8');
                        }
                });
            }
        });
    });
};

var renderHeaders = function (res, code, headers){
    res.writeHead(code,headers);
};

var renderText = function (res, text, done, encoding){
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

var tempRedirect = function (res, location){
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

var pageNotFound = function (req, res){
    res.writeHead(404, {"Content-type": "text/html"});
    renderPage(req, res, 
            "errors/page_not_found.jade",
            {}, {}, true, true);
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

var clearCookie = function (name, hdrs)
{
    return setCookie(name, '', hdrs, dt.date("r", dt.strtotime("-7 days")));
}

var forceSSL = function (req, res){
    var spl = req.headers.host.split(':');
    var host = spl[0];
    var port = spl[1] || false;
    if (port == "7080")
    {
        var loc = "http://" + host + (':7443') + req.url;
    }
    else
    {
        var loc = "https://" + host + (port ? ':'+port : '') + req.url;
    }
    
    
    permRedirect(res, loc); 
};

var getMenus = function (menu_group, callback){
    if (typeof(callback) != 'function') callback = function (rows){};
    
    menu_group = menu_group || "main";
    var url = config.couchdb+"/_design/admin/_view/menus/"+util.encodeOptions({startkey: [menu_group], endkey: [menu_group,2,2]});
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
            last_doc = item.value;
            last_doc.items = [];
        }
        else
        {
            last_doc.items.push(item.value);
        }
    });
    
    if (last_doc && last_doc.items.length != 0)
    {
        menus.push(last_doc);
    }
    
    return menus;
};

var loadRecaptchaKeys = function (){
    config.recaptcha_keys = config.recaptcha_keys || {};
    
    try{
        var kf = new String(fs.readFileSync(__dirname+"/recaptchakeys.csv"));
    } catch (error) {
        return;
    }
    
    var kf_lines = kf.split("\n");
    kf_lines.forEach(function (line){
        line = line.trim();
        if (!line || line[0] == "#") return;
        
        var parts = line.split(",");
        
        if(parts.length < 3) return;
        
        config.recaptcha_keys[parts[0]] = {"public": parts[1], "private": parts[2]};
    });
}

var verifyRecaptcha = function (req, rc_challenge, rc_response, callback){
    var http = require('http');
        
    var recaptcha = {};
    recaptcha.verify = false;
    recaptcha.error = 'not initialized';
    
    if (!config.recaptcha_keys)
    {
        loadRecaptchaKeys();
    }
    
    var host = req.headers.host.split(":")[0];
    if (host == "localhost") host = "djo-dev.org";
    var rc_keys = config.recaptcha_keys[host];
    
    var client = http.createClient(80,"google.com");
    
    client.on('error', function (err){
        throw err;
    });
    
    var remoteip = req.headers["X-Real-IP"] || req.connection.remoteAddress;
    
    var data = util.encodeOptions({
        "privatekey": rc_keys["private"],
        "remoteip": remoteip,
        "challenge": rc_challenge,
        "response": rc_response
    }).substring(1, data.length);
    
    var headers = {
        "Host": host,
        "Content-type": "text/plain;charset=UTF-8",
        "Content-length": data.length
    };
    
    sys.debug('got here');
    
    var respData = '';
    var request = client.request("POST", "/recaptcha/api/verify", headers);
    request.write(data);
    request.on('response', function(response){
        sys.debug('response from google');
        response.setEncoding('utf8');
        response.on('data', function (chunk){
            respData += chunk;
        });
        response.on('end', function (){
            sys.debug('response ended.');
            
            var respLines = respData.split("\n");
            if (respLines[0].trim() == "true")
            {
                recaptcha.verify = true;
                recaptcha.error = '';
            } 
            else
            {
                recaptcha.verify = false;
                recaptcha.error = respLines[1].trim();
            }
            
            callback(recaptcha);
        });
    });
};

module.exports.config = config;
module.exports.renderPage = renderPage;
module.exports.renderHeaders = renderHeaders;
module.exports.renderText = renderText;
module.exports.permRedirect = permRedirect;
module.exports.tempRedirect = tempRedirect;
module.exports.pageNotFound = pageNotFound;
module.exports.addHeader = addHeader;
module.exports.setCookie = setCookie;
module.exports.clearCookie = clearCookie;
module.exports.forceSSL = forceSSL;
module.exports.getMenus = getMenus;
module.exports.parseMenus = parseMenus;
module.exports.loadRecaptchaKeys = loadRecaptchaKeys;
module.exports.verifyRecaptcha = verifyRecaptcha;

module.exports.middleware = middleware;
module.exports.util = util;
