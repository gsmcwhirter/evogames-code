var base = require('../base'),
    schemas = require("./schema"),
    json_schema = require('../json-schema'),
    game_schema = schemas.game,
    gametype_schema = schemas.gametype,
    markdown = require('discount'),
    mlexer = require("math-lexer"),
    parsers = require('./parsers');

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

app.param('code', parsers.parseCode);
app.param('gtname', parsers.parseGametype);
events.param('code', parsers.parseCode);
ladders.param('code', parsers.parseCode);
tournaments.param('code', parsers.parseCode);

app.use("/", events);
app.use("/", tournaments);
app.use("/", ladders);

//Routes
function gameIndex(req, res, next){
    var api = req.app.set('iapi');

    var locals = {
        crumbs: [{href: "/", text: "Home"}, {href: "/game", text: "Games"}],
        games_bygenre: [],
        games_byname: []
    };

    base.util.inParallel(
        function (callback){
            api.games.names(function (response){
                if (response.rows){
                    locals.games_byname = response.rows.map(function (row){return row.value;});
                }

                callback();
            });
        },
        function (callback){
            api.games.genres(function (response){
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
    var editable = req.perms && req.perms["game admin"];

    var locals = {
        game: req.game,
        editable: editable,
        crumbs: [
            {href: "/", text: "Home"},
            {href: "/game", text: "Games"},
            {href: "/game/"+req.game.code, text: req.game.name}
        ]
    };

    locals.game.description = markdown.parse(locals.game.description || "(no description available)\n");

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
            locals.messages[field] = [];
        });

        fields.genres = fields.genres.split(",").map(function (tag){ return tag.trim();});

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
                game._id = "game-"+base.util.slugify(game.code);
                
                api.putDoc(game, function (response){
                    if (response.error)
                    {
                        req.flash('error','Unable to save the game: '+(response.reason || response.error));
                        createForm(req, res, next, locals);
                    }
                    else
                    {
                        req.flash('info','Game created successfully.');
                        res.redirect("/");
                    }
                });
            }
        }

        api.games.codes(function (response){
            if (response.rows && response.rows.length){
                if (response.rows.map(function (item){return item.key;}).indexOf(game.code.toLowerCase()) > -1)
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
            locals.messages[field] = [];
        });

        fields.genres = fields.genres.split(",").map(function (tag){ return tag.trim();});

        locals.data = fields;

        var game = base.util.clone(req.game);
        
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
                    req.flash('error','Unable to save the game: '+(response.reason || response.error));
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
        var errors = [];
        var gametype = {};
        var ratings = [];
        gametype.name = req.body.gtdata.name.trim();
        gametype.wltweights = {
            wins: 0,
            losses: 0,
            ties: 0
        };
        gametype.stats = [];

        if (gametype.name.toLowerCase() == "custom"){
            errors.push("The gametype name may not be 'custom'.");
        }

        var statnames = [];
        for (var k in req.body.gtdata.stats || {}){
            var stat = req.body.gtdata.stats[k];
            stat.name = stat.name.trim();

            var lcstatname = stat.name.toLowerCase();
            if (statnames.indexOf(lcstatname) > -1){
                errors.push("Duplicate stat names are not allowed.");
            }
            else {
                statnames.push(lcstatname);
            }

            if (["wins","losses","ties"].indexOf(lcstatname) > -1){
                errors.push("Stat names may not be 'wins', 'losses', or 'ties'.")
            }

            stat.ratingweight = parseFloat(stat.ratingweight || 1);
            if (stat.ratingweight != 0){
                ratings.push(""+stat.ratingweight+" * "+stat.name);
            }
            if (stat.valtype == "formula"){
                try {
                    stat.valformula = mlexer.parseString(stat.valdata, true).toLowerCase();
                }
                catch (err){
                    if (err instanceof mlexer.ParseError){
                        errors.push("The formula provided for "+stat.name+" was malformed.");
                    }
                    else {
                        throw err;
                    }
                }
            }
            gametype.stats.push(stat);
        }

        (["wins","losses","ties"]).forEach(function (wlt){
            if (req.body.gtdata.wltweights[wlt]){
                var wltweight = parseFloat(req.body.gtdata.wltweights[wlt]);
                gametype.wltweights[wlt] = wltweight;
                if (wltweight != 0){
                    ratings.push(""+wltweight+" * "+wlt);
                }
            }
        });

        if (ratings.length > 0){
            try {
                gametype.ratingformula = mlexer.parseString(ratings.join(" + "), true).toLowerCase();
            }
            catch (err){
                if (err instanceof mlexer.ParseError){
                    errors.push("The rating formula was malformed: "+JSON.stringify(ratings));
                }
                else {
                    throw err;
                }
            }
        }
        else {
            gametype.ratingformula = "idem(0)";
        }

        var validation = json_schema.validate(gametype, gametype_schema);

        if (!validation.valid){
            errors.push("The gametype did not have a valid format.");
        }

        if (errors.length){
            res.end(JSON.stringify({ok: false, error: errors}));
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
                    res.end(JSON.stringify({ok: false, error: "Unable to save game type: "+(response.reason || response.error)}));
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

    var game = base.util.clone(req.game);
    
    game.gametypes.splice(req.gametype_index, 1);

    api.putDoc(game, function (response){
        if (response.error){
            res.end(JSON.stringify({ok: false, error: "Unable to delete game type: "+(response.reason || response.error)}));
        }
        else {
            res.end(JSON.stringify({ok: true, info: "Game type deleted successfully."}));
        }
    });
}
