var couchdb = require('../couchdb'),
    base = require('../base'),
    us = require('underscore');
//var sys = require('sys');

module.exports.urls = function (ssl, _base){
    return function (app){
        app.get(_base + "/users.:format", userList);
        app.get(_base + "/emails.:format", emailList);
    };
}

function userList(req, res, next){
    var config = req.app.set('config');
    var url = config.couchdb+"/_design/player/_view/usernames/";
    var creq = new couchdb.Request("GET", url, function (responseText){
        var response = JSON.parse(responseText);
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
    var config = req.app.set('config');
    var url = config.couchdb+"/_design/player/_view/emails/";
    var creq = new couchdb.Request("GET", url, function (responseText){
        var response = JSON.parse(responseText);
        if (!response.error)
        {
            if (req.params.format == "json")
            {
                res.writeHead(200, {"Content-type": "application/json"});
                res.end(JSON.stringify(us._.map(response.rows, function (item){return base.util.sha1_hex(item.key[1].toLowerCase());})), 'utf8');
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
