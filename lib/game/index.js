var base = require('../base'),
    us = require('underscore'),
    schemas = require("./schema"),
    json_schema = require('../json-schema'),
    game_schema = schemas.game,
    gametype_schema = schemas.gametype,
    markdown = require('discount');

var app = module.exports = base.createServer();
var events = require("./event");
var ladders = require("./ladder");
var tournaments = require("./tournament");

app.get("/", gameIndex);

app.get("/create", base.auth.loginCheck, base.auth.permissionCheck("game admin"), createForm);
app.post("/create", base.auth.loginCheck, base.auth.permissionCheck("game admin"), createProcess);

app.get("/:code", base.auth.permissionCheck("game admin", true), viewGame);

app.get("/:code/edit", base.auth.loginCheck, base.auth.permissionCheck("game admin"), editForm);
app.post("/:code/edit", base.auth.loginCheck, base.auth.permissionCheck("game admin"), editProcess);

app.get("/:code/gametypes", base.auth.loginCheck, base.auth.permissionCheck("game admin"), gametypeForm);
app.put("/:code/gametypes/save", base.auth.loginCheckAjax, base.auth.permissionCheckAjax("game admin"), saveGametype);
app.del("/:code/gametypes/:gtname", base.auth.loginCheckAjax, base.auth.permissionCheckAjax("game admin"), removeGametype);

app.param('code', parseCode);
app.param('gtname', parseGametype);
events.param('code', parseCode);
ladders.param('code', parseCode);
tournaments.param('code', parseCode);

app.use("/", events);
app.use("/", tournaments);
app.use("/", ladders);

function parseCode(req, res, next, code){
    var api = req.app.set("iapi");

    api.gameCodes({startkey: [req.params.code.toLowerCase()], endkey: [req.params.code.toLowerCase(), req.params.code.toUpperCase()], include_docs: true}, function (response){
        if (response.rows && response.rows.length){
            req.game = response.rows[0].doc;
            next();
        }
        else {
            next(new base.errors.NotFound());
        }
    });
}

function parseGametype(req, res, next, gtname){
    if (!req.game){
        res.writeHead(200, {"Content-type": "application/json"});
        res.end(JSON.stringify({error: "game not found"}));
    }
    else{
        var gtindex = req.gametype_index = -1;
        req.game.gametypes.forEach(function (gametype, index){
            if (gametype.name.toLowerCase() == gtname.toLowerCase()){
                gtindex = index;
                req.gametype = gametype;
                req.gametype_index = gtindex;
            }
        });

        if (gtindex == -1){
            res.writeHead(200, {"Content-type": "application/json"});
            res.end(JSON.stringify({ok: false, error: "game type not found"}));
        }
        else {
            next();
        }
    }
}

function gameIndex(req, res, next){
    var api = req.app.set('iapi');

    var locals = {
        crumbs: [{href: "/", text: "Home"}, {href: "/game", text: "Games"}],
        games_bygenre: [],
        games_byname: []
    };

    base.util.inParallel(
        function (callback){
            api.gameNames(function (response){
                if (response.rows){
                    locals.games_byname = us._(response.rows).pluck('value');
                }

                callback();
            });
        },
        function (callback){
            api.gameGenres(function (response){
                var lastgenre;
                var tmpentry = {genre: null, games: []};
                if (response.rows){
                    response.rows.forEach(function (row){
                        if (row.key[0] != lastgenre){
                            if (lastgenre){
                                locals.games_bygenre.push(tmpentry);
                            }

                            lastgenre = row.key[0];
                            tmpentry = {genre: row.value.genre, games: []};
                        }

                        tmpentry.games.push({name: row.value.name, code: row.value.code});
                    });
                }

                if (lastgenre){
                    locals.games_bygenre.push(tmpentry);
                }

                callback();
            });
        },
        function (){
            res.render("game/index", locals);
        }
    );
}

function viewGame(req, res, next){
    var api = req.app.set('iapi');
    var editable = req.perms && req.perms["game admin"];

    //TODO: Get event, tournament, and ladder data\
    var locals = {
        game: req.game,
        cevents: [],
        uevents: [],
        ctournaments: [],
        utournaments: [],
        cladders: [],
        uladders: [],
        editable: editable,
        crumbs: [
            {href: "/", text: "Home"},
            {href: "/game", text: "Games"},
            {href: "/game/"+req.game.code, text: req.game.name}
        ]
    };

    locals.game.description = locals.game.description || "(no description available)";
    locals.game.description = markdown.parse(locals.game.description);

    res.render("game/view", locals);
}

function createForm(req, res, next, locals){    
    locals = locals || {messages: {}, errors: false};
    locals.data = locals.data || {};
    locals.crumbs = [
            {href: "/", text: "Home"},
            {href: "/game", text: "Games"},
            {href: "/game/create", text: "Add Game"}];

    res.render("game/create", locals);
}

function createProcess(req, res, next){
    var locals = {data: {}, messages: {}, errors: false};
    var api = req.app.set('iapi');

    if (!req.body)
    {
        req.flash('error', 'Unable to process form.');
        createForm(req, res, next, locals);
    }
    else
    {
        var fields = req.body;
        ["name","code","description","genres"].forEach(function (field){
            fields[field] = (fields[field] || "").trim();
        });

        fields.genres = us._(fields.genres.split(",")).map(function (tag){ return tag.trim();});

        locals.data = fields;

        var game = {};
        game.type = "game";
        game.created_at = (new Date()).toISOString();
        game.name = fields.name;
        game.code = fields.code;
        game.description = fields.description;
        game.genres = fields.genres;
        game.gametypes = [];

        function afterUnique(){
            var validation = json_schema.validate(game, game_schema);
            if (!validation.valid)
            {
                validation.errors.forEach(function (error){
                    if (locals.messages[error.property]){
                        locals.messages[error.property].push(error.message);
                    }

                });

                locals.errors = true;
            }

            if (locals.errors){
                req.flash('error', 'There were problems saving the game.');
                createForm(req, res, next, locals);
            }
            else
            {
                api.uuids(function (uuids){
                    game._id = uuids[0];

                    api.putDoc(game, function (response){
                        if (response.error)
                        {
                            req.flash('error','Unable to save the game: '+response.error);
                            createForm(req, res, next, locals);
                        }
                        else
                        {
                            req.flash('info','Game created successfully.');
                            res.redirect(game.code+"/edit");
                        }
                    });
                });
            }
        }

        api.gameCodes(function (response){
            if (response.rows && response.rows.length){
                if (response.rows.map(function (item){return item[0];}).indexOf(game.code.toLowerCase()) > -1)
                {
                    locals.errors = true;
                    locals.messages.code.push("must be unique.");
                }

                afterUnique();
            }
            else
            {
                afterUnique();
            }
        });
    }
}

function editForm(req, res, next, locals){
    locals = locals || {messages: {}, errors: false};
    locals.data = locals.data || {
        name: req.game.name,
        genres: req.game.genres,
        description: req.game.description
    };
    locals.game = req.game;
    locals.crumbs = [
            {href: "/", text: "Home"},
            {href: "/game", text: "Games"},
            {href: "/game/"+req.game.code, text: req.game.name},
            {href: "/game/"+req.game.code+"/edit", text: "Edit"}];

    res.render("game/edit", locals);
}

function editProcess(req, res, next){
    var locals = {data: {}, messages: {}, errors: false};
    var api = req.app.set('iapi');

    if (!req.body)
    {
        req.flash('error', 'Unable to process form.');
        editForm(req, res, next, locals);
    }
    else
    {
        var fields = req.body;
        ["name","description","genres"].forEach(function (field){
            fields[field] = (fields[field] || "").trim();
        });

        fields.genres = us._(fields.genres.split(",")).map(function (tag){ return tag.trim();});

        locals.data = fields;

        var game = req.game;
        game.name = fields.name;
        game.description = fields.description;
        game.genres = fields.genres;

        var validation = json_schema.validate(game, game_schema);
        if (!validation.valid)
        {
            validation.errors.forEach(function (error){
                if (locals.messages[error.property]){
                    locals.messages[error.property].push(error.message);
                }

            });

            locals.errors = true;
        }

        if (locals.errors){
            req.flash('error', 'There were problems saving the game.');
            editForm(req, res, next, locals);
        }
        else
        {

            api.putDoc(game, function (response){
                if (response.error)
                {
                    req.flash('error','Unable to save the game: '+response.error);
                    editForm(req, res, next, locals);
                }
                else
                {
                    req.flash('info','Game saved successfully.');
                    res.redirect(game.code);
                }
            });
        }
    }
}

function gametypeForm(req, res, next){
    var locals = {
        game: req.game,
        crumbs: [
            {href: "/", text: "Home"},
            {href: "/game", text: "Games"},
            {href: "/game/"+req.game.code, text: req.game.name},
            {href: "/game/"+req.game.code+"/gametypes", text: "Game Types"}]
    };

    res.render("game/gametypes", locals);
}

function saveGametype(req, res, next){
    var api = req.app.set('iapi');
    res.writeHead(200, {"Content-type": "application/json"});

    if (!req.body){
        res.end(JSON.stringify({ok: false, error: "parse error"}));
    }
    else {
        var gametype = {};
        gametype.name = req.body.gtdata.name;
        gametype.stats = [];

        for (var k in req.body.gtdata.stats || {}){
            var stat = req.body.gtdata.stats[k];
            stat.ratingweight = parseFloat(stat.ratingweight || 1);
            gametype.stats.push(stat);
        }

        var validation = json_schema.validate(gametype, gametype_schema);

        if (!validation.valid){
            res.end(JSON.stringify({ok: false, error: "The gametype did not have a valid format: "+JSON.stringify(validation)}));
        }
        else {
            var gtindex = -1;
            (req.game.gametypes || []).forEach(function (gametype, index){
                if (gametype.name.toLowerCase() == (req.body.origname || "").toLowerCase()){
                    gtindex = index;
                }
            });

            if (gtindex > -1){
                req.game.gametypes[gtindex] = gametype;
            }
            else {
                req.game.gametypes.push(gametype);
            }

            api.putDoc(req.game, function (response){
                if (response.error){
                    res.end(JSON.stringify({ok: false, error: "Unable to save game type: "+response.error}));
                }
                else {
                    res.end(JSON.stringify({ok: true, info: "Game type saved successfully."}));
                }
            });
        }
    }
}

function removeGametype(req, res, next){
    var api = req.app.set('iapi');
    res.writeHead(200, {"Content-type": "application/json"});

    req.game.gametypes.splice(req.gametype_index, 1);

    api.putDoc(req.game, function (response){
        if (response.error){
            res.end(JSON.stringify({ok: false, error: "Unable to delete game type: "+response.error}));
        }
        else {
            res.end(JSON.stringify({ok: true, info: "Game type deleted successfully."}));
        }
    });
}