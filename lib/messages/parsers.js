var base = require("../base");

module.exports = {
    messageId: messageId
}

function messageId(req, res, next, message_id){
    var api = req.app.set('iapi');

    api.getDoc(message_id, function (response){
        if (response && response.type == "message"){
            if (response.from.toLowerCase() == req.player.handle.toLowerCase()){
                req.message = response;
                next();
            }
            else {
                var tos = (response.to || []).filter(function (rec){return !rec.is_deleted;}).map(function (rec){return rec.handle});
                var ccs = (response.cc || []).filter(function (rec){return !rec.is_deleted;}).map(function (rec){return rec.handle});
                var bccs = (response.bcc || []).filter(function (rec){return !rec.is_deleted;}).map(function (rec){return rec.handle});

                if (tos.indexOf(req.player.handle.toLowerCase()) > -1 || ccs.indexOf(req.player.handle.toLowerCase()) > -1 || bccs.indexOf(req.player.handle.toLowerCase()) > -1){
                    req.message = response;
                    next();
                }
                else {
                    next(new base.errors.NotFound());
                }
            }
        }
        else {
            next(new base.errors.NotFound());
        }
    });
}