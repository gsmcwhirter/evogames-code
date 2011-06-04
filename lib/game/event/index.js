var base = require('../../base'),
    json_schema = require('../../json-schema'),
    event_schema = require('./schema').event;

var app = module.exports = base.createServer();

var _base = "/:code/event";

app.get(_base, eventDirectory);

app.get(_base+"/history", eventHistory);

app.get(_base+"/create", createForm);
app.post(_base+"/create", createProcess);

app.get(_base+"/:slug", checkParticipant, checkRegisterable, displayEvent);

app.get(_base+"/:slug/register", base.auth.loginCheck, forceRegisterable, registerForm);
app.post(_base+"/:slug/register", base.auth.loginCheck, forceRegisterable, registerProcess);

app.get(_base+"/:slug/stats", checkParticipant, displayStats);
app.get(_base+"/:slug/matches", checkParticipant, displayMatchList);

app.get(_base+"/:slug/matches/submit", base.auth.loginCheck, forceParticipant, submitMatchForm);
app.post(_base+"/:slug/matches/submit", base.auth.loginCheck, forceParticipant, submitMatchProcess);

app.get(_base+"/:slug/matches/:matchid", checkDisputable, displayMatch);
app.del(_base+"/:slug/matches/:matchid/dispute", base.auth.loginCheckAjax, forceDisputableAjax, disputeMatch);

app.get(_base+"/:slug/controls", base.auth.loginCheck, forceEventAdmin, eventControls);
app.get(_base+"/:slug/controls/edit", base.auth.loginCheck, forceEventAdmin, editForm);
app.post(_base+"/:slug/controls/edit", base.auth.loginCheck, forceEventAdmin, editProcess);

app.del(_base+"/:slug/controls/delete", base.auth.loginCheckAjax, forceEventCreatorAjax, deleteEvent);

app.get(_base+"/:slug/controls/invite", base.auth.loginCheck, forceEventAdmin, inviteForm);
app.put(_base+"/:slug/controls/invite/add", base.auth.loginCheckAjax, forceEventAdminAjax, addInvite);
app.del(_base+"/:slug/controls/invite/withdraw/:invite", base.auth.loginCheckAjax, forceEventAdminAjax, withdrawInvite);

app.get(_base+"/:slug/controls/request", base.auth.loginCheck, forceEventAdmin, requestForm);
app.del(_base+"/:slug/controls/request/approve/:request", base.auth.loginCheckAjax, forceEventAdminAjax, approveRequest);
app.del(_base+"/:slug/controls/request/deny/:request", base.auth.loginCheckAjax, forceEventAdminAjax, denyRequest);

app.get(_base+"/:slug/controls/admin", base.auth.loginCheck, forceEventCreator, adminForm);
app.put(_base+"/:slug/controls/admin/add", base.auth.loginCheckAjax, forceEventCreatorAjax, addAdmin);
app.del(_base+"/:slug/controls/admin/remove/:admin", base.auth.loginCheckAjax, forceEventCreatorAjax, removeAdmin);

app.get(_base+"/:slug/controls/disputes", base.auth.loginCheckAjax, forceEventAdmin, disputeList);
app.get(_base+"/:slug/controls/disputes/:matchid/edit", base.auth.loginCheck, forceEventAdmin, editMatchForm);
app.post(_base+"/:slug/controls/disputes/:matchid/edit", base.auth.loginCheck, forceEventAdmin, editMatchProcess);
app.del(_base+"/:slug/controls/disputes/:matchid/delete", base.auth.loginCheckAjax, forceEventAdminAjax, deleteMatch);

app.param('slug', function (req, res, next, slug){
    var api = req.app.set('iapi');
    api.events.slugs({key: slug.toLowerCase(), include_docs: true}, function (response){
        if (response.rows && response.rows.length){
            req.event = response.rows[0];
            checkEventAdmin(req, res, function (err){
                if (err){
                    next(err);
                }
                else {
                    next();
                }
            });
        }
        else {
            next(new base.errors.NotFound());
        }
    });

});

app.param('matchid', function (req, res, next, matchid){
    var api = req.app.set('iapi');
    if (req.event){
        api.getDoc(matchid, function (response){
            if (!response.error && response.type == "match" && response.event == req.event._id){
                req.match = response;
                next();
            }
            else {
                next(new base.errors.NotFound());
            }
        });
    }
    else {
        next(new base.errors.NotFound());
    }
});

app.param('invite', function (req, res, next, _invite){
    if (req.event){
        var iindex = (req.event.invitations || []).map(function (invite){return invite.id.toLowerCase()}).indexOf(_invite.toLowerCase());
        if (iindex > -1){
            req.invite_index = iindex;
            next();
        }
        else {
            res.writeHead(404, {"Content-type": "application/json"});
            res.end(JSON.stringify({error: "not found"}));
        }
    }
    else {
        res.writeHead(404, {"Content-type": "application/json"});
        res.end(JSON.stringify({error: "not found"}));
    }
});

app.param('request', function (req, res, next, _request){
    if (req.event){
        var requests = (req.event.registrations || []).map(function (request, index){return [request, index]}).filter(function (request){return !request[0].approved;});
        var rindex = requests.map(function (request){return request[0].id.toLowerCase()}).indexOf(_request.toLowerCase());
        if (rindex > -1){
            req.request_index = requests[rindex][1];
            next();
        }
        else {
            res.writeHead(404, {"Content-type": "application/json"});
            res.end(JSON.stringify({error: "not found"}));
        }
    }
    else {
        res.writeHead(404, {"Content-type": "application/json"});
        res.end(JSON.stringify({error: "not found"}));
    }
});

app.param('admin', function (req, res, next, _admin){
    if (req.event){
        var aindex = (req.event.admins || []).map(function (admin){return admin.toLowerCase()}).indexOf(_admin.toLowerCase());
        if (aindex > -1){
            req.invite_index = aindex;
            next();
        }
        else {
            res.writeHead(404, {"Content-type": "application/json"});
            res.end(JSON.stringify({error: "not found"}));
        }
    }
    else {
        res.writeHead(404, {"Content-type": "application/json"});
        res.end(JSON.stringify({error: "not found"}));
    }
});

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

    return req.event.creator.toLowerCase() == req.player.handle.toLowerCase();
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

    else if (req.event.eventtype == "player_register"){
        callback(true);
    }

    else if (req.event.eventtype == "group_register"){
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
                api.groups.owners({key: req.player.handle.toLowerCase()}, function (response){
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


//Routes
function eventDirectory(req, res, next){
    var api = req.app.set('iapi');
    var locals = {};
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"}];
    locals.game = req.game;
    locals.current_events = [];
    locals.future_events = [];

    base.util.inParallel(
        function (callback){
            api.events.game_enddates({startkey: [req.game._id, (new Date()).toISOString(), 0, -1 * (new Date()).getTime()]}, function (response){
               if (response.rows && response.rows.length){
                   locals.current_events = response.rows.map(function (row){return row.value.event;});
               }

               callback();
            });
        },
        function (callback){
            api.events.game_startdates({startkey: [req.game._id, (new Date()).toISOString()]}, function (response){
                if (response.rows && response.rows.length){
                    locals.future_events = response.rows.map(function (row){return row.value.event;});
                }

                callback();
            });
        },
        function (){
            res.render("event/index", locals);
        }
    );
}

function eventHistory(req, res, next){
    var api = req.app.set('iapi');
    var locals = {};
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"}];
    locals.game = req.game;
    locals.past_events = [];

    api.events.game_enddates({endkey: [req.game._id, (new Date()).toISOString(), 1]}, function (response){
       if (response.rows && response.rows.length){
           locals.past_events = response.rows.map(function (row){return row.value.event;});
       }

       res.render("event/history", locals);
    });
}

function createForm(req, res, next, locals){
    locals = locals || {messages: {}, errors: false};
    locals.data = locals.data || {};
    locals.game = req.game;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/create", text: "Create"}];

    res.render("event/create", locals);
}

function createProcess(req, res, next){
    next(new base.errors.NotFound());
}

function displayEvent(req, res, next){
    next(new base.errors.NotFound());
}

function eventControls(req, res, next){
    next(new base.errors.NotFound());
}

function registerForm(req, res, next){
    next(new base.errors.NotFound());
}

function registerProcess(req, res, next){
    next(new base.errors.NotFound());
}

function editForm(req, res, next){
    next(new base.errors.NotFound());
}

function editProcess(req, res, next){
    next(new base.errors.NotFound());
}

function displayStats(req, res, next){
    next(new base.errors.NotFound());
}

function displayMatchList(req, res, next){
    next(new base.errors.NotFound());
}

function displayMatch(req, res, next){
    next(new base.errors.NotFound());
}

function submitMatchForm(req, res, next){
    next(new base.errors.NotFound());
}

function submitMatchProcess(req, res, next){
    next(new base.errors.NotFound());
}

function disputeList(req, res, next){
    next(new base.errors.NotFound());
}

function editMatchForm(req, res, next){
    next(new base.errors.NotFound());
}

function editMatchProcess(req, res, next){
    next(new base.errors.NotFound());
}

function disputeMatch(req, res, next){
    next(new base.errors.NotFound());
}

function inviteForm(req, res, next){
    next(new base.errors.NotFound());
}

function addInvite(req, res, next){
    next(new base.errors.NotFound());
}

function withdrawInvite(req, res, next){
    next(new base.errors.NotFound());
}

function requestForm(req, res, next){
    next(new base.errors.NotFound());
}

function approveRequest(req, res, next){
    next(new base.errors.NotFound());
}

function denyRequest(req, res, next){
    next(new base.errors.NotFound());
}

function adminForm(req, res, next){
    next(new base.errors.NotFound());
}

function addAdmin(req, res, next){
    next(new base.errors.NotFound());
}

function removeAdmin(req, res, next){
    next(new base.errors.NotFound());
}

function deleteMatch(req, res, next){
    next(new base.errors.NotFound());
}

function deleteEvent(req, res, next){
    next(new base.errors.NotFound());
}