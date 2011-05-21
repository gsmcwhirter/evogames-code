var base = require('../base'),
    json_schema = require('../json-schema');

var app = module.exports = base.createServer();
var events = require("./event");
var ladders = require("./ladder");
var tournaments = require("./tournament");

app.param('code', parseCode);
events.param('code', parseCode);
ladders.param('code', parseCode);
tournaments.param('code', parseCode);

app.get("/", function (req, res, next){
    res.writeHead(200, {"Content-type": "text/plain"});
    res.end("game main");
});

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