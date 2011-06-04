var base = require('../base');

module.exports = {
    parseCode: parseCode,
    parseGametype: parseGametype
}

function parseCode(req, res, next, code){
    var api = req.app.set("iapi");

    api.games.codes({key: req.params.code.toLowerCase(), include_docs: true}, function (response){
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