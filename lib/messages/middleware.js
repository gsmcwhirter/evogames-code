var base = require("../base");

module.exports = {
    forceViewable: forceViewable,
    forceEditable: forceEditable,
    forceDeleteable: forceDeleteable,
    _isDeleteable: _isDeleteable
};

function forceViewable(req, res, next){
    if (req.message.from.toLowerCase() == req.player.handle.toLowerCase() || (req.message.status.sent && (
        req.message.to.filter(function (rec){return !rec.is_deleted}).map(function (rec){return rec.handle.toLowerCase()}).indexOf(req.player.handle.toLowerCase()) > -1 ||
        req.message.cc.filter(function (rec){return !rec.is_deleted}).map(function (rec){return rec.handle.toLowerCase()}).indexOf(req.player.handle.toLowerCase()) > -1 ||
        req.message.bcc.filter(function (rec){return !rec.is_deleted}).map(function (rec){return rec.handle.toLowerCase()}).indexOf(req.player.handle.toLowerCase()) > -1))){


        if (_isDeleteable(req, req.message)){
            req.message.is_deleteable = true;
        }
        
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

function _isDeleteable(req, message){
    return (!message.status.sent && message.from.toLowerCase() == req.player.handle.toLowerCase()) ||
        (message.status.sent && (
        message.to.filter(function (rec){return !rec.is_deleted}).map(function (rec){return rec.handle.toLowerCase()}).indexOf(req.player.handle.toLowerCase()) > -1 ||
        message.cc.filter(function (rec){return !rec.is_deleted}).map(function (rec){return rec.handle.toLowerCase()}).indexOf(req.player.handle.toLowerCase()) > -1 ||
        message.bcc.filter(function (rec){return !rec.is_deleted}).map(function (rec){return rec.handle.toLowerCase()}).indexOf(req.player.handle.toLowerCase()) > -1));
}

function forceDeleteable(req, res, next){
    if (_isDeleteable(req, req.message)){
        next();
    }
    else {
        res.header("Content-type", "application/json");
        res.send({error: "access denied"});
    }
}