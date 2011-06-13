var base = require('../../base'),
    json_schema = require('../../json-schema');

var app = module.exports = base.createServer();

var _base = "/:code/tournament";

app.get(_base + "", function (req, res, next){
    res.header("Content-type", "text/plain");
    res.send(req.game.code + " tournament");
});