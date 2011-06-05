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
    checkDisputable: checkDisputable,
    forceDisputable: forceDisputable,
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
        next(new base.errors.AccessDenied());
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
        next(new base.errors.AccessDenied());
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

    else if (req.event.eventtype == "player_register"){
        callback((req.event.registrations || [])
                    .filter(function (regis){return regis.type == "player" && regis.approved})
                    .map(function (regis){return regis.id.toLowerCase()})
                    .indexOf(req.player._id.toLowerCase()) > -1);
    }

    else if (req.event.eventtype == "group_register"){
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
            next(new base.errors.AccessDenied());
        }
    });
}

function _isDisputable(req){
    if (!req.event || !req.player || !req.match){
        return false;
    }

    //TODO
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
            next(new base.errors.AccessDenied());
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
                api.groups.admins({key: req.player._id}, function (response){
                    if (response.rows && response.rows.length){
                        response.rows.forEach(function (row){
                            if (row.value.indexOf("events") > -1){
                                grps.push(1);
                            }
                        });
                    }

                    cb();
                });
            },
            function (cb){
                api.groups.owners({startkey: [req.player.handle.toLowerCase()], endkey: [req.player.handle.toLowerCase(), 1]}, function (response){
                    if (response.rows && response.rows.length){
                        response.rows.forEach(function (row){
                            grps.push(1);
                        });
                    }

                    cb();
                });
            },
            function (){
                if (grps.length > 0){
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
            next(new base.errors.AccessDenied());
        }
    });
}

function forceEventNotOver(req, res, next){
    if (req.event.enddate && req.event.enddate <= (new Date()).toISOString()){
        next(new base.errors.AccessDenied());
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