var base = require('../base'),
    ccodes = require('zoneinfo').countrycodes;

var app = module.exports = base.createServer();

app.get("/players/handles.:_format", playerHandles);
app.get("/players/emails.:_format", playerEmails);
app.get("/news/slugs.:_format", newsSlugs);
app.get("/help/slugs.:_format", helpSlugs);
app.get("/timezones.:_format", timezoneList);
app.get("/format_date.:_format", formatDate);
app.get("/groups/codes.:_format", groupCodes);
app.get("/games/codes.:_format", gameCodes);
app.get("/games/:game_code/gametypes.:_format", gameGametypes);
app.get("/events/slugs.:_format", eventSlugs);

app.param('_format', function(req, res, next, format){
    if (format != "json"){
        next(new base.errors.NotFound());
    }
    else {
        next();
    }
});

app.param('game_code', function (req, res, next, game_code){
    var internal = req.app.set('iapi');
    internal.games.codes({key: game_code.toLowerCase(), include_docs: true}, function (response){
        if (response.rows && response.rows.length){
            req.game = response.rows[0].doc;
            next();
        }
        else {
            next(new base.errors.NotFound());
        }
    });
});

function playerHandles(req, res, next){
    var internal = req.app.set('iapi');
    internal.players.handles(function (response){
        if(!response.error)
        {
            if (req.params._format == "json")
            {
                res.header("Content-type", "application/json");
                res.send(response.rows.map(function (item){return item.key.toLowerCase();}));
            }
        }
        else
        {
            next(new base.errors.NotFound());
        }
    });
}

function playerEmails(req, res, next){
    var internal = req.app.set('iapi');
    internal.players.emails(function (response){
        if (!response.error)
        {
            if (req.params._format == "json")
            {
                res.header("Content-type", "application/json");
                res.send(response.rows.map(function (item){return base.util.sha1_hex(item.key.toLowerCase());}));
            }
        }
        else
        {
            next(new base.errors.NotFound());
        }
    });
}

function newsSlugs(req, res, next){
    var internal = req.app.set('iapi');
    internal.news.slugs(function (response){
        if (!response.error)
        {
            if (req.params._format == "json")
            {
                res.header("Content-type", "application/json");
                res.send(response.rows.map(function (item){return item.key.toLowerCase();}));
            }
        }
        else
        {
            next(new base.errors.NotFound());
        }
    });
}

function helpSlugs(req, res, next){
    var internal = req.app.set('iapi');
    internal.help.slugs(function (response){
        if (!response.error)
        {
            if (req.params._format == "json")
            {
                res.header("Content-type", "application/json");
                res.send(response.rows.map(function (item){return item.key.toLowerCase();}));
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
        res.header("Content-type", "application/json");
        res.send({countries: ccodes, country_tzs: ccs, all_tzs: base.util.timezones()});
    }
}

function formatDate(req, res, next){
    var timezone = decodeURI(req.param('timezone') || "");
    var dstr = decodeURI(req.param('date') || "now");
    var format = decodeURI(req.param('format') || "");
    
    var date = base.util.date(dstr, timezone);
    
    if (req.params._format == "json")
    {
        res.header("Content-type", "application/json");
        res.send({timezone: timezone, date: dstr, format: format, formatted_date: date.format(format)});
    }
}

function groupCodes(req, res, next){
    var internal = req.app.set('iapi');
    internal.groups.codes(function (response){
        if (!response.error)
        {
            if (req.params._format == "json")
            {
                res.header("Content-type", "application/json");
                res.send(response.rows.map(function (item){return item.key;}));
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
    internal.games.codes(function (response){
        if (!response.error){
            if (req.params._format == "json"){
                res.header("Content-type", "application/json");
                res.send(response.rows.map(function (item){return item.value.code;}));
            }
        }
        else {
            next(new base.errors.NotFound());
        }
    });
}

function gameGametypes(req, res, next){
    res.header("Content-type", "application/json");
    res.send((req.game.gametypes || []).map(function (gametype){return gametype.name.toLowerCase();}));
}

function eventSlugs(req, res, next){
    var internal = req.app.set('iapi');
    internal.events.slugs(function (response){
        if (!response.error)
        {
            if (req.params._format == "json")
            {
                res.header("Content-type", "application/json");
                res.send(response.rows.map(function (item){return item.key.toLowerCase();}));
            }
        }
        else
        {
            next(new base.errors.NotFound());
        }
    });
}
