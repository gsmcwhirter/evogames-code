var base = require('../base'),
    us = require('underscore'),
    json_schema = require('../json-schema');

var app = module.exports = base.createServer();
var events = require("./event");
var ladders = require("./ladder");
var tournaments = require("./tournament");

app.param('code', parseCode);
events.param('code', parseCode);
ladders.param('code', parseCode);
tournaments.param('code', parseCode);


app.get("/", gameIndex);

app.get("/:code", function (req, res, next){
    res.writeHead(200, {"Content-type": "text/plain"});
    res.end("game "+req.code);
});

app.use("/", events);
app.use("/", tournaments);
app.use("/", ladders);

function parseCode(req, res, next, code){
    req.code = code;
    next();
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