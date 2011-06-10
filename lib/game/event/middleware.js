var base = require("../../base");

module.exports = {
    checkEventAdmin: checkEventAdmin,
    forceEventAdmin: forceEventAdmin,
    forceEventAdminAjax: forceEventAdminAjax,
    checkEventCreator: checkEventCreator,
    forceEventCreator: forceEventCreator,
    forceEventCreatorAjax: forceEventCreatorAjax,
    checkParticipant: checkParticipant,
    forceParticipant: forceParticipant,
    forceParticipantAjax: forceParticipantAjax,
    _isDisputable: _isDisputable,
    checkDisputable: checkDisputable,
    forceDisputable: forceDisputable,
    forceMatchDisputed: forceMatchDisputed,
    forceMatchDisputedAjax: forceMatchDisputedAjax,
    forceDisputableAjax: forceDisputableAjax,
    checkRegisterable: checkRegisterable,
    forceRegisterable: forceRegisterable,
    forceEventNotOver: forceEventNotOver,
    forceEventNotOverAjax: forceEventNotOverAjax
}

function _isEventAdmin(req){
    if (!req.event || !req.player){
        return false;
    }

    if (_isEventCreator(req)){
        return true;
    }

    return (req.event.admins || []).map(function (admin){return admin.toLowerCase();}).indexOf(req.player ? req.player.handle.toLowerCase() : "") > -1;
}

function checkEventAdmin(req, res, next){
    req.isEventAdmin = _isEventAdmin(req);
    next();
}

function forceEventAdmin(req, res, next){
    if (req.isEventAdmin){
        next();
    }
    else {
        next(new base.errors.AccessDenied("You do not have the necessary event administrative privileges."));
    }
}

function forceEventAdminAjax(req, res, next){
    if (req.isEventAdmin){
        next();
    }
    else {
        res.writeHead(200, {"Content-type": "application/json"});
        res.end(JSON.stringify({error: "access denied"}));
    }
}

function _isEventCreator(req){
    if (!req.event || !req.player){
        return false;
    }

    return req.event.creator.toLowerCase() == req.player.handle.toLowerCase() || req.player.is_sysop;
}

function checkEventCreator(req, res, next){
    req.isEventCreator = _isEventCreator(req);
    next();
}

function forceEventCreator(req, res, next){
    if (_isEventCreator(req)){
        next();
    }
    else {
        next(new base.errors.AccessDenied("You do not have the necessary event administrative privileges."));
    }
}

function forceEventCreatorAjax(req, res, next){
    if (_isEventCreator(req)){
        next();
    }
    else {
        res.writeHead(200, {"Content-type": "application/json"});
        res.end(JSON.stringify({error: "access denied"}));
    }
}

function _isParticipant(req, callback){
    if (!req.event || !req.player){
        callback(false);
    }

    else if (req.event.event_type == "player_register"){
        callback((req.event.registrations || [])
                    .filter(function (regis){return regis.type == "player" && regis.approved})
                    .map(function (regis){return regis.id.toLowerCase()})
                    .indexOf(req.player._id.toLowerCase()) > -1);
    }

    else if (req.event.event_type == "group_register"){
        var reggroups = (req.event.registrations || [])
                            .filter(function (regis){return regis.type == "group" && regis.approved})
                            .map(function (regis){return regis.id.toLowerCase()});
        if (reggroups.length){
            var api = req.app.set('iapi');

            api.groups.memberships({startkey: [req.player._id], endkey: [req.player._id, 1], include_docs: true}, function (response){
                if (response.rows && response.rows.length){
                    var plgroups = response.rows.map(function (row){return row.doc._id.toLowerCase()});
                    var _found = false;

                    for (var i = 0, ct = plgroups.length; i < ct; i++){
                        if (reggroups.indexOf(plgroups[i]) > -1){
                            _found = true;
                            callback(true);
                            break;
                        }
                    }

                    if (!_found){
                        callback(false);
                    }
                }
                else {
                    callback(false);
                }
            });
        }
        else {
            callback(false);
        }
    }

    else {
        callback(false);
    }
}

function checkParticipant(req, res, next){
    _isParticipant(req, function (result){
        req.isEventParticipant = result;
        next();
    });
}

function forceParticipant(req, res, next){
    checkParticipant(req, res, function (err){
        if (!err && req.isEventParticipant){
            next();
        }
        else if (err){
            next(err);
        }
        else {
            next(new base.errors.AccessDenied("You are not a participant of the requested event."));
        }
    });
}

function forceParticipantAjax(req, res, next){
    checkParticipant(req, res, function (err){
        if (!err && req.isEventParticipant){
            next();
        }
        else {
            res.writeHead(200, {"Content-type": "application/json"});
            res.end(JSON.stringify({error: "access denied"}));
        }
    });
}

function _isDisputable(req, match){
    if (!req.event || !req.player || (!req.match && !match)){
        return false;
    }
    else {
        match = match || req.match;
    }

    if (!req.event.disputes_closed){
        var player_handles = [];
        match.teams.forEach(function (team){
            player_handles = player_handles.concat(team.players.map(function (player){return player.handle.toLowerCase()}));
        });
        
        if (player_handles.indexOf(req.player.handle.toLowerCase()) > -1){
            return true;
        }
        else {
            return false;
        }
    }
    else {
        return false;
    }

    return false;
}

function checkDisputable(req, res, next){
    req.isMatchDisputable = _isDisputable(req);
    next();
}

function forceDisputable(req, res, next){
    checkDisputable(req, res, function (err){
        if (!err && req.isMatchDisputable){
            next();
        }
        else if (err) {
            next(err);
        }
        else {
            next(new base.errors.AccessDenied("Disputes are disabled or you do not have standing to dispute the requested match."));
        }
    });
}

function forceDisputableAjax(req, res, next){
    checkDisputable(req, res, function (err){
        if (!err && req.isMatchDisputable){
            next();
        }
        else {
            res.writeHead(200, {"Content-type": "application/json"});
            res.end(JSON.stringify({error: "access denied"}));
        }
    });
}

function forceMatchDisputed(req, res, next){
    if (req.match.pending_disputes && req.match.pending_disputes.length){
        next();
    }
    else {
        next(new base.errors.AccessDenied("The requested match is not in dispute."));
    }
}

function forceMatchDisputedAjax(req, res, next){
    if (req.match.pending_disputes && req.match.pending_disputes.length){
        next();
    }
    else {
        res.writeHead(200, {"Content-type": "application/json"});
        res.end(JSON.stringify({error: "access denied"}));
    }
}

function _isRegisterable(req, callback){

    if (!req.event || !req.player){
        callback(false);
    }

    else if (req.event.event_type == "player_register"){
        callback(true);
    }

    else if (req.event.event_type == "group_register"){
        var api = req.app.set('iapi');
        
        var grps = [];
        base.util.inParallel(
            function (cb){
                api.groups.admins({key: req.player._id, include_docs: true}, function (response){
                    if (response.rows && response.rows.length){
                        response.rows.forEach(function (row){
                            if (row.value.indexOf("events") > -1){
                                grps.push(row.doc);
                            }
                        });
                    }

                    cb();
                });
            },
            function (cb){
                api.groups.owners({startkey: [req.player.handle.toLowerCase()], endkey: [req.player.handle.toLowerCase(), 1], include_docs: true}, function (response){
                    if (response.rows && response.rows.length){
                        response.rows.forEach(function (row){
                            grps.push(row.doc);
                        });
                    }

                    cb();
                });
            },
            function (){
                if (grps.length > 0){
                    req.registerableGroups = grps;
                    callback(true);
                }
                else {
                    callback(false);
                }
            }
        );
    }

    else {
        callback(false);
    }
}

function checkRegisterable(req, res, next){
    _isRegisterable(req, function (result){
        req.isEventRegisterable = result;
        next();
    });
}

function forceRegisterable(req, res, next){
    checkRegisterable(req, res, function (err){
        if (!err && req.isEventRegisterable){
            next();
        }
        else if (err) {
            next(err);
        }
        else {
            next(new base.errors.AccessDenied("You do not have standing to register a participant for the requested event."));
        }
    });
}

function forceEventNotOver(req, res, next){
    if (req.event.enddate && req.event.enddate <= (new Date()).toISOString()){
        next(new base.errors.AccessDenied("The requested event has completed."));
    }
    else {
        next();
    }
}

function forceEventNotOverAjax(req, res, next){
    if (req.event.enddate && req.event.enddate <= (new Date()).toISOString()){
        res.writeHead(200, {"Content-type": "application/json"});
        res.end(JSON.stringify({error: "access denied"}));
    }
    else {
        next();
    }
}