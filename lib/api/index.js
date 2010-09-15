var internal = require('./internal'),
    base = require('../base'),
    us = require('underscore');
    
module.exports.internal = internal;

module.exports.urls = function (ssl, _base){
    return function (app){
        app.get(_base + "/users.:format", userList);
        app.get(_base + "/emails.:format", emailList);
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
