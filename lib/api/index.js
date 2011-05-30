var base = require('../base'),
    us = require('underscore'),
    ccodes = require('zoneinfo/lib/countrycodes');

var app = module.exports = base.createServer();

app.get("/users.:_format", userList);
app.get("/emails.:_format", emailList);
app.get("/slugs.:_format", slugList);
app.get("/timezones.:_format", timezoneList);
app.get("/format_date.:_format", formatDate);
app.get("/group_codes.:_format", groupCodes);
app.get("/game_codes.:_format", gameCodes);

app.param('_format', function(req, res, next, format){
    if (req.params._format != "json"){
        next(new base.errors.NotFound());
    }
    else {
        next();
    }
});

function userList(req, res, next){
    var internal = req.app.set('iapi');
    internal.userList(function (response){
        if(!response.error)
        {
            if (req.params._format == "json")
            {
                res.writeHead(200, {"Content-type": "application/json"});
                res.end(JSON.stringify(us._(response.rows).map(function (item){return item.key.toLowerCase();})), 'utf8');
            }
        }
        else
        {
            next(new base.errors.NotFound());
        }
    });
}

function emailList(req, res, next){
    var internal = req.app.set('iapi');
    internal.emailList(function (response){
        if (!response.error)
        {
            if (req.params._format == "json")
            {
                res.writeHead(200, {"Content-type": "application/json"});
                res.end(JSON.stringify(us._(response.rows).map(function (item){return base.util.sha1_hex(item.key.toLowerCase());})), 'utf8');
            }
        }
        else
        {
            next(new base.errors.NotFound());
        }
    });
}

function slugList(req, res, next){
    var internal = req.app.set('iapi');
    internal.slugList(function (response){
        if (!response.error)
        {
            if (req.params._format == "json")
            {
                res.writeHead(200, {"Content-type": "application/json"});
                res.end(JSON.stringify(us._.map(response.rows, function (item){return item.key.toLowerCase();})), 'utf8');
            }
        }
        else
        {
            next(new base.errors.NotFound());
        }
    });
}

function timezoneList(req, res, next){
    var ccs = {};
    Object.keys(ccodes).forEach(function (country){
        var tzs = base.util.timezones(ccodes[country]);
        if (tzs)
        {
            ccs[ccodes[country]] = tzs.sort();    
        }
    });
    
    if (req.params._format == "json")
    {
        res.writeHead(200, {"Content-type": "application/json"});
        res.end(JSON.stringify({countries: ccodes, country_tzs: ccs, all_tzs: base.util.timezones()}), 'utf8');
    }
}

function formatDate(req, res, next){
    var timezone = decodeURI(req.param('timezone') || "");
    var dstr = decodeURI(req.param('date') || "now");
    var format = decodeURI(req.param('format') || "");
    
    var date = base.util.date(dstr, timezone);
    
    if (req.params._format == "json")
    {
        res.writeHead(200, {"Content-type": "application/json"});
        res.end(JSON.stringify({timezone: timezone, date: dstr, format: format, formatted_date: date.format(format)}), 'utf8');
    }
}

function groupCodes(req, res, next){
    var internal = req.app.set('iapi');
    internal.groupCodes(function (response){
        if (!response.error)
        {
            if (req.params._format == "json")
            {
                res.writeHead(200, {"Content-type": "application/json"});
                res.end(JSON.stringify(us._.map(response.rows, function (item){return item.key;})), 'utf8');
            }
        }
        else
        {
            next(new base.errors.NotFound());
        }
    });
}

function gameCodes(req, res, next){
    var internal = req.app.set("iapi");
    internal.gameCodes(function (response){
        if (!response.error){
            if (req.params._format == "json"){
                res.writeHead(200, {"Content-type": "application/json"});
                res.end(JSON.stringify(us._.map(response.rows, function (item){return item.value.code;})), 'utf8');
            }
        }
        else {
            next(new base.errors.NotFound());
        }
    });
}
