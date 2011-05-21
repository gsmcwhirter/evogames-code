var base = require('../../base'),
    json_schema = require('../../json-schema');

var app = module.exports = base.createServer();

var _base = "/:code/tournament";

app.get(_base + "", function (req, res, next){
    res.writeHead(200, {"Content-type": "text/plain"});
    res.end(req.code + " tournament");
});