module.exports = {
    forceViewable: forceViewable,
    forceEditable: forceEditable
};

function forceViewable(req, res, next){
    if (req.message.from.toLowerCase() == req.player.handle.toLowerCase() || (req.message.status.sent && (
        req.message.to.map(function (rec){return rec.handle.toLowerCase()}).indexOf(req.player.handle.toLowerCase()) > -1 ||
        req.message.cc.map(function (rec){return rec.handle.toLowerCase()}).indexOf(req.player.handle.toLowerCase()) > -1 ||
        req.message.bcc.map(function (rec){return rec.handle.toLowerCase()}).indexOf(req.player.handle.toLowerCase()) > -1))){

        next();
    }
    else {
        res.header("Content-type", "application/json");
        res.send({error: "access denied"});
    }
}

function forceEditable(req, res, next){
    if (!req.message.status.sent && req.message.from.toLowerCase() == req.player.handle.toLowerCase()){
        next();
    }
    else {
        res.header("Content-type", "application/json");
        res.send({error: "access denied"});
    }
}