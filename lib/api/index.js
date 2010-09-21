var internal = require('./internal'),
    base = require('../base'),
    us = require('underscore'),
    ccodes = require('../node-zoneinfo/lib/countrycodes');
    
module.exports.internal = internal;

module.exports.urls = function (ssl, _base){
    return function (app){
        app.get(_base + "/users.:format", userList);
        app.get(_base + "/emails.:format", emailList);
        app.get(_base + "/slugs.:format", slugList);
        app.get(_base + "/timezones.:format", timezoneList);
    };
}

function userList(req, res, next){
    internal.userList(function (response){
        if(!response.error)
        {
            if (req.params.format == "json")
            {
                res.writeHead(200, {"Content-type": "application/json"});
                res.end(JSON.stringify(us._.map(response.rows, function (item){return item.key[1].toLowerCase();})), 'utf8');
            }
            else
            {
                next();
            }
        }
        else
        {
            next();
        }
    });
}

function emailList(req, res, next){
    internal.emailList(function (response){
        if (!response.error)
        {
            if (req.params.format == "json")
            {
                res.writeHead(200, {"Content-type": "application/json"});
                res.end(JSON.stringify(us._.map(response.rows, function (item){return base.util.sha1_hex(item.key.toLowerCase());})), 'utf8');
            }
            else
            {
                next();
            }
        }
        else
        {
            next();
        }
    });
}

function slugList(req, res, next){
    internal.slugList(function (response){
        if (!response.error)
        {
            if (req.params.format == "json")
            {
                res.writeHead(200, {"Content-type": "application/json"});
                res.end(JSON.stringify(us._.map(response.rows, function (item){return item.key.toLowerCase();})), 'utf8');
            }
            else
            {
                next();
            }
        }
        else
        {
            next();
        }
    });
}

function timezoneList(req, res, next){
    var ccs = {};
    Object.keys(ccodes).forEach(function (country){
        ccs[ccodes[country]] = base.util.timezones(ccodes[country]).map(function (timezone){ return timezone.substring(timezone.indexOf("/") + 1); }).sort();
    });
    
    res.writeHead(200, {"Content-type": "application/json"});
    res.end(JSON.stringify({countries: ccodes, timezones: ccs}), 'utf8');
}
