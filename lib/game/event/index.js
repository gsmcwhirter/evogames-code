var base = require('../../base'),
    parsers = require("./parsers"),
    mw = require("./middleware"),
    json_schema = require('../../json-schema'),
    event_schema = require('./schema').event,
    gametype_schema = require("../schema").gametype,
    markdown = require("discount"),
    TZDate = require("zoneinfo").TZDate,
    mlexer = require("math-lexer");

var app = module.exports = base.createServer();

var _base = "/:code/event";

app.get(_base, eventDirectory);

app.get(_base+"/history", eventHistory);

app.get(_base+"/create", createForm);
app.post(_base+"/create", createProcess);

app.get(_base+"/:slug", mw.checkParticipant, mw.checkRegisterable, displayEvent);

app.get(_base+"/:slug/register", base.auth.loginCheck, mw.forceRegisterable, mw.forceEventNotOver, registerForm);
app.post(_base+"/:slug/register", base.auth.loginCheck, mw.forceRegisterable, mw.forceEventNotOver, registerProcess);

app.get(_base+"/:slug/stats", mw.checkParticipant, displayStats);
app.get(_base+"/:slug/matches", mw.checkParticipant, displayMatchList);

app.get(_base+"/:slug/matches/submit", base.auth.loginCheck, mw.forceParticipant, mw.forceEventNotOver, submitMatchForm);
app.post(_base+"/:slug/matches/submit", base.auth.loginCheck, mw.forceParticipant, mw.forceEventNotOver, submitMatchProcess);

app.get(_base+"/:slug/matches/:matchid", mw.checkDisputable, displayMatch);
app.del(_base+"/:slug/matches/:matchid/dispute", base.auth.loginCheckAjax, mw.forceDisputableAjax, disputeMatch);

app.get(_base+"/:slug/controls", base.auth.loginCheck, mw.forceEventAdmin, mw.checkEventCreator, eventControls);
app.get(_base+"/:slug/controls/edit", base.auth.loginCheck, mw.forceEventAdmin, mw.forceEventNotOver, editForm);
app.post(_base+"/:slug/controls/edit", base.auth.loginCheck, mw.forceEventAdmin, mw.forceEventNotOver, editProcess);

app.del(_base+"/:slug/controls/delete", base.auth.loginCheckAjax, mw.forceEventCreatorAjax, deleteEvent);

app.get(_base+"/:slug/controls/invites", base.auth.loginCheck, mw.forceEventAdmin, mw.forceEventNotOver, inviteForm);
app.put(_base+"/:slug/controls/invites/add", base.auth.loginCheckAjax, mw.forceEventAdminAjax, mw.forceEventNotOverAjax, addInvite);
app.del(_base+"/:slug/controls/invites/:invite", base.auth.loginCheckAjax, mw.forceEventAdminAjax, mw.forceEventNotOverAjax, withdrawInvite);

app.get(_base+"/:slug/controls/requests", base.auth.loginCheck, mw.forceEventAdmin, mw.forceEventNotOver, requestForm);
app.del(_base+"/:slug/controls/requests/approve/:request", base.auth.loginCheckAjax, mw.forceEventAdminAjax, mw.forceEventNotOverAjax, approveRequest);
app.del(_base+"/:slug/controls/requests/deny/:request", base.auth.loginCheckAjax, mw.forceEventAdminAjax, mw.forceEventNotOverAjax, denyRequest);

app.get(_base+"/:slug/controls/registrations", base.auth.loginCheck, mw.forceEventAdmin, mw.forceEventNotOver, registrationForm);
app.del(_base+"/:slug/controls/registrations/remove/:registration", base.auth.loginCheckAjax, mw.forceEventAdminAjax, mw.forceEventNotOverAjax, cancelRegistration);

app.get(_base+"/:slug/controls/admins", base.auth.loginCheck, mw.forceEventCreator, adminForm);
app.put(_base+"/:slug/controls/admins/add", base.auth.loginCheckAjax, mw.forceEventCreatorAjax, addAdmin);
app.del(_base+"/:slug/controls/admins/@:admin", base.auth.loginCheckAjax, mw.forceEventCreatorAjax, removeAdmin);

app.get(_base+"/:slug/controls/disputes", base.auth.loginCheckAjax, mw.forceEventAdmin, disputeList);
app.get(_base+"/:slug/controls/disputes/:matchid/edit", base.auth.loginCheck, mw.forceEventAdmin, editMatchForm);
app.post(_base+"/:slug/controls/disputes/:matchid/edit", base.auth.loginCheck, mw.forceEventAdmin, editMatchProcess);
app.del(_base+"/:slug/controls/disputes/:matchid/delete", base.auth.loginCheckAjax, mw.forceEventAdminAjax, deleteMatch);

app.param('slug', parsers.slugParser);
app.param('matchid', parsers.matchIdParser);
app.param('invite', parsers.inviteParser);
app.param('request', parsers.requestParser);
app.param('registration', parsers.registrationParser);
app.param('admin', parsers.adminParser);

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
            api.events.game_enddates({startkey: [req.game._id, -10000000000000], endkey: [req.game._id, -1 * (new Date()).getTime(), 0, (new Date()).toISOString()]}, function (response){
               if (response.rows && response.rows.length){
                   locals.current_events = response.rows.map(function (row){return row.value.event;});
               }

               callback();
            });
        },
        function (callback){
            api.events.game_startdates({endkey: [req.game._id, -1 * (new Date()).getTime()]}, function (response){
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

    api.events.game_enddates({startkey: [req.game._id, -1 * (new Date()).getTime(), 1]}, function (response){
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
    var api = req.app.set("iapi");
    var locals = {messages: {}, errors: false};

    if (!req.body){
        req.flash('error','parse error');
        createForm(req, res, next, locals);
    }
    else {
        var fields = {};
        ["event_name","slug","event_type","minTeams","gametype_name","marshal"].forEach(function (field){
            fields[field] = req.body[field].trim();
            locals.messages[field] = [];
        });

        locals.messages["name"] = [];

        locals.data = fields;
        locals.data.name = fields.event_name;

        var event = {};
        event.type = "event";
        event.created_at = (new Date()).toISOString();
        event.gameid = req.game._id;
        event.creator = req.player.handle;
        event.name = fields.event_name;
        event.slug = fields.slug;
        event.event_type = fields.event_type;
        event.register_type = "request";
        event.minTeams = parseInt(fields.minTeams);
        event.gametype_name = fields.gametype_name;

        if (event.gametype_name == "custom"){
            var gtdata = JSON.parse(fields.marshal);
            var ratings = [];
            event.gametype = {};
            event.gametype.name = "custom";
            event.gametype.stats = [];

            for (var k = 0, ct = gtdata.stats.length; k < ct; k++){
                var stat = gtdata.stats[k];
                stat.ratingweight = parseFloat(stat.ratingweight || 1);
                ratings.push(""+stat.ratingweight+" * "+stat.name);
                if (stat.valtype == "formula"){
                    try {
                        stat.valformula = mlexer.parseString(stat.valdata, true);
                    }
                    catch (err){
                        if (err instanceof mlexer.ParseError){
                            locals.messages["marshal"].push("The formula provided for "+stat.name+" was malformed.");
                            locals.errors = true;
                        }
                        else {
                            throw err;
                        }
                    }
                }
                event.gametype.stats.push(stat);
            }

            try {
                event.gametype.ratingformula = mlexer.parseString(ratings.join(" + "), true);
            }
            catch (err){
                if (err instanceof mlexer.ParseError){
                    locals.messages["marshal"].push("The rating formula was malformed: "+JSON.stringify(ratings.join(" + ")));
                    locals.errors = true;
                }
                else {
                    throw err;
                }
            }
        }
        else {
            event.gametype = (req.game.gametypes || []).filter(function (gametype){ return gametype.name.toLowerCase() == fields.gametype_name.toLowerCase()})[0];
        }

        var validation = json_schema.validate(event, event_schema);

        if (!validation.valid){
            validation.errors.forEach(function (error){
                if (locals.messages[error.property]){
                    locals.messages[error.property].push(error.message);
                }
            });

            locals.errors = true;
        }

        api.events.slugs(function (response){
            if (response.rows && response.rows.length){
                var slugs = response.rows.map(function (row){ return row.key.toLowerCase(); });
                if (slugs.indexOf(event.slug.toLowerCase()) > -1){
                    locals.errors = true;
                    locals.messages["slug"].push("must be unique");
                }
            }

            if (!locals.errors){
                api.uuids(function (uuids){
                    event._id = uuids[0];

                    api.putDoc(event, function (response){
                        if (!response.error){
                            req.flash("info", "Your event was created successfully.");
                            res.redirect("game/"+req.game.code+"/event/"+event.slug);
                        }
                        else {
                            req.flash("error", "Unable to save your event: "+response.error);
                            createForm(req, res, next, locals);
                        }
                    });
                });
            }
            else {
                req.flash('error', "There were problems saving your event.");
                createForm(req, res, next, locals);
            }
        });
    }
}

function displayEvent(req, res, next){
    var locals = {};
    locals.game = req.game;
    locals.event = req.event;
    locals.is_admin = req.isEventAdmin;
    locals.is_participant = req.isEventParticipant;
    locals.is_registerable = req.isEventRegisterable;
    locals.registration_count = (req.event.registrations || []).filter(function (reg){return reg.approved;}).length;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name}];

    locals.event.description = markdown.parse(locals.event.description || "(no description available)\n");
    locals.event.rules = markdown.parse(locals.event.rules || "(no description available)\n");

    res.render("event/view", locals);
}

function eventControls(req, res, next){
    var locals = {};
    locals.game = req.game;
    locals.event = req.event;
    locals.is_creator = req.isEventCreator;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls", text: "Controls"}];

    res.render("event/controls", locals);
}

function editForm(req, res, next, locals){
    locals = locals || {messages: {}, errors: false};
    locals.data = locals.data || req.event;
    if (typeof locals.data.startdate_date == "undefined" && req.event.startdate){
        locals.data.startdate_date = base.util.date(req.event.startdate, req.player.timezone).format("Y-m-d");
    }
    if (typeof locals.data.startdate_time == "undefined" && req.event.startdate){
        locals.data.startdate_time = base.util.date(req.event.startdate, req.player.timezone).format("H:i:s");
    }
    if (typeof locals.data.enddate_date == "undefined" && req.event.enddate){
        locals.data.enddate_date = base.util.date(req.event.enddate, req.player.timezone).format("Y-m-d");
    }
    if (typeof locals.data.enddate_time == "undefined" && req.event.enddate){
        locals.data.enddate_time = base.util.date(req.event.enddate, req.player.timezone).format("H:i:s");
    }
    locals.data.marshal = locals.data.marshal || JSON.stringify(req.event.gametype);
    locals.game = req.game;
    locals.event = req.event;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls", text: "Controls"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls/edit", text: "Edit"}];

    res.render("event/edit", locals);
}

function editProcess(req, res, next){
    var api = req.app.set("iapi");
    var locals = {messages: {}, errors: false};

    if (!req.body){
        req.flash('error','parse error');
        editForm(req, res, next, locals);
    }
    else {
        var fnames = ["event_name","slug","event_type","register_type","minTeams","gametype_name","marshal","description","rules","startdate_date","startdate_time","enddate_date","enddate_time"];
        var fields = {};
        fnames.forEach(function (field){
            fields[field] = (req.body[field] || "").trim();
            locals.messages[field] = [];
        });
        locals.messages["startdate"] = [];
        locals.messages["enddate"] = [];
        locals.messages["name"] = [];

        locals.data = fields;
        locals.data.name = fields.event_name;

        var event = base.util.clone(req.event);
        
        event.name = fields.event_name;
        event.slug = fields.slug;
        event.event_type = fields.event_type;
        event.register_type = fields.register_type;
        event.minTeams = parseInt(fields.minTeams);
        event.gametype_name = fields.gametype_name;
        event.description = fields.description;
        event.rules = fields.rules;

        if (!req.event.startdate || req.event.startdate >= (new Date()).toISOString()){
            if (fields.startdate_date || fields.startdate_time){
                event.startdate = base.util.date(fields.startdate_date + " " + fields.startdate_time, req.player.timezone);
                if (event.startdate){
                    event.startdate.setTimezone("Etc/UTC");
                    event.startdate = event.startdate._date.toISOString();
                }
                else {
                    event.startdate = "bad";
                }
            }
            else {
                delete event.startdate;
            }
        }

        if (fields.enddate_date || fields.enddate_time){
            event.enddate = base.util.date(fields.enddate_date + " " + fields.enddate_time, req.player.timezone);
            if (event.enddate){
                event.enddate.setTimezone("Etc/UTC");
                event.enddate = event.enddate._date.toISOString();
            }
            else {
                event.enddate = "bad";
            }
        }
        else {
            delete event.enddate;
        }

        if (typeof event.startdate != "undefined" && event.startdate != "bad" && typeof event.enddate != "undefined" && event.enddate != "bad"){
            if (event.startdate >= event.enddate){
                locals.errors = true;
                locals.messages["startdate"].push("must be before end date.");
                locals.messages["enddate"].push("must be after start date.");
            }
        }
        else if (typeof event.startdate == "undefined" && typeof event.enddate != "undefined" && event.enddate != "bad" && req.event.startdate >= (new Date()).toISOString()){
            locals.errors = true;
            locals.messages["enddate"].push("must be accompanied by a start date or left blank.");
        }

        if (event.gametype_name == "custom"){
            var gtdata = JSON.parse(fields.marshal);
            var ratings = [];
            event.gametype = {};
            event.gametype.name = "custom";
            event.gametype.stats = [];

            for (var k = 0, ct = gtdata.stats.length; k < ct; k++){
                var stat = gtdata.stats[k];
                stat.ratingweight = parseFloat(stat.ratingweight || 1);
                ratings.push(""+stat.ratingweight+" * "+stat.name);
                if (stat.valtype == "formula"){
                    try {
                        stat.valformula = mlexer.parseString(stat.valdata, true);
                    }
                    catch (err){
                        if (err instanceof mlexer.ParseError){
                            locals.messages["marshal"].push("The formula provided for "+stat.name+" was malformed.");
                            locals.errors = true;
                        }
                        else {
                            throw err;
                        }
                    }
                }
                event.gametype.stats.push(stat);
            }

            try {
                event.gametype.ratingformula = mlexer.parseString(ratings.join(" + "), true);
            }
            catch (err){
                if (err instanceof mlexer.ParseError){
                    locals.messages["marshal"].push("The rating formula was malformed: "+JSON.stringify(ratings.join(" + ")));
                    locals.errors = true;
                }
                else {
                    throw err;
                }
            }
        }
        else {
            event.gametype = (req.game.gametypes || []).filter(function (gametype){ return gametype.name.toLowerCase() == fields.gametype_name.toLowerCase()})[0];
        }

        var validation = json_schema.validate(event, event_schema);

        if (!validation.valid){
            validation.errors.forEach(function (error){
                if (locals.messages[error.property]){
                    locals.messages[error.property].push(error.message);
                }
            });

            locals.errors = true;
        }

        api.events.slugs({key: event.slug.toLowerCase()}, function (response){
            if (response.rows && response.rows.length){
                var sysutil = require("util");
                var slugs = response.rows.map(function (row){ return row.key.toLowerCase(); });
                sysutil.puts(slugs);
                var sindex = slugs.indexOf(event.slug.toLowerCase());
                sysutil.puts(sindex);
                sysutil.puts(response.rows[sindex].id, event._id);
                if (sindex > -1 && response.rows[sindex].id != event._id){
                    locals.errors = true;
                    locals.messages["slug"].push("must be unique");
                }
            }

            if (!locals.errors){
                api.putDoc(event, function (response){
                    if (!response.error){
                        req.flash("info", "Your event was saved successfully.");
                        res.redirect("game/"+req.game.code+"/event/"+event.slug+"/controls");
                    }
                    else {
                        req.flash("error", "Unable to save your event: "+response.error);
                        req.flash("error", JSON.stringify(event));
                        editForm(req, res, next, locals);
                    }
                });
            }
            else {
                req.flash('error', "There were problems saving your event.");
                editForm(req, res, next, locals);
            }
        });
    }
}

function registerForm(req, res, next){
    next(new base.errors.NotFound());
}

function registerProcess(req, res, next){
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
    var locals = {};
    locals.game = req.game;
    locals.event = req.event;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls", text: "Controls"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls/invites", text: "Invitations"}];
    var typefilter = req.event.event_type.substring(0, req.event.event_type.length - 9);
    locals.invites = (req.event.invitations || []).filter(function (regis){return regis.type == typefilter;});
    locals.invites.sort(function (a, b){
        return a.name_or_handle.toLowerCase() < b.name_or_handle.toLowerCase() ? -1 : 1;
    });

    res.render("event/invites", locals);
}

function addInvite(req, res, next){
    var api = req.app.set('iapi');

    res.writeHead(200, {"Content-type": "application/json"});
    if (!req.body || !req.body.code_or_handle)
    {
        res.end(JSON.stringify({ok: false, error: "parse error"}));
    }
    else
    {
        if (req.event.event_type == "player_register"){
            api.players.handles({key: req.body.code_or_handle.toLowerCase()}, function (response){
                if (response.error || !response.rows || !response.rows.length){
                    res.end(JSON.stringify({ok: false, error: "Unable to find a player with that handle."}));
                }
                else {
                    var invite_exists = false;
                    (req.event.invitations || []).forEach(function (invite){
                        if (invite.type == "player" && invite.id == response.rows[0].id){
                            invite_exists = true;
                        }
                    });

                    if (invite_exists){
                        res.end(JSON.stringify({ok: false, error: 'That player already has an invite.'}));
                    }
                    else {
                        var event = base.util.clone(req.event);

                        event.invitations = event.invitations || [];
                        event.invitations.push({type: "player", name_or_handle: response.rows[0].value.handle, id: response.rows[0].id});
                        api.putDoc(event, function (response2){
                            if (response2.error){
                                res.end(JSON.stringify({ok: false, error: "Unable to save the invitation: "+response2.error}));
                            }
                            else {
                                res.end(JSON.stringify({ok: true, info: "Invitation successfully saved.", type: "player", id: response.rows[0].id, name_or_handle: req.body.code_or_handle}));
                            }
                        });
                    }
                }
            });
        }
        else if (req.event.event_type == "group_register"){
            api.groups.codes({key: req.body.code_or_handle.toLowerCase()}, function (response){
                var sysutil = require("util");
                sysutil.puts(sysutil.inspect(response));
                if (response.error || !response.rows || !response.rows.length){
                    res.end(JSON.stringify({ok: false, error: "Unable to find a group with that code."}));
                }
                else {
                    var invite_exists = false;
                    (req.event.invitations || []).forEach(function (invite){
                        if (invite.type == "group" && invite.id == response.rows[0].id){
                            invite_exists = true;
                        }
                    });

                    if (invite_exists){
                        res.end(JSON.stringify({ok: false, error: 'That group already has an invite.'}));
                    }
                    else {
                        var event = base.util.clone(req.event);

                        event.invitations = event.invitations || [];
                        event.invitations.push({type: "group", name_or_handle: response.rows[0].value.name, id: response.rows[0].id});
                        api.putDoc(event, function (response2){
                            if (response2.error){
                                res.end(JSON.stringify({ok: false, error: "Unable to save the invitation: "+response2.error}));
                            }
                            else {
                                res.end(JSON.stringify({ok: true, info: "Invitation successfully saved.", type: "group", id: response.rows[0].id, name_or_handle: response.rows[0].value.name}));
                            }
                        });
                    }
                }
            });
        }
        else {
            res.end(JSON.stringify({ok: false, error: "event type error"}));
        }
    }
}

function withdrawInvite(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
    var api = req.app.set('iapi');

    if (req.invite_index > -1 && (req.event.invitations || [])[req.invite_index].id == req.invite_id){
        var event = base.util.clone(req.event);

        event.invitations.splice(req.invite_index, 1);

        api.putDoc(event, function (response){
            if (response.error){
                res.end(JSON.stringify({ok: false, error: 'Unable to withdraw the invitation: '+response.error}));
            }
            else {
                res.end(JSON.stringify({ok: true, info: "Successfully withdrew the invitation."}));
            }
        });
    }
    else {
        res.end(JSON.stringify({ok: false, error: 'Unable to find that event invitation.'}));
    }
}

function requestForm(req, res, next){
    var locals = {};
    locals.game = req.game;
    locals.event = req.event;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls", text: "Controls"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls/requests", text: "Requests"}];
    var typefilter = req.event.event_type.substring(0, req.event.event_type.length - 9);
    locals.requests = (req.event.registrations || []).filter(function (regis){return !regis.approved && regis.type == typefilter;});
    locals.requests.sort(function (a, b){
        if (typefilter == "player"){
            if (a.code_or_handle.toLowerCase() == b.code_or_handle.toLowerCase()){
                return a.name_or_alias.toLowerCase() < b.name_or_alias.toLowerCase() ? -1 : 1;
            }
            else {
                return a.code_or_handle.toLowerCase() < b.code_or_handle.toLowerCase() ? -1 : 1;
            }
        }
        else {
            return a.name_or_alias.toLowerCase() < b.name_or_alias.toLowerCase() ? -1 : 1;
        }
    });

    res.render("event/requests", locals);
}

function approveRequest(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
    var api = req.app.set('iapi');

    if (req.request_index > -1){
        var event = base.util.clone(req.event);

        if (!event.registrations[req.request_index].approved && event.registrations[req.request_index].type == req.request_data.type && event.registrations[req.request_index].id == req.request_data.id){
            event.registrations[req.request_index].approved = true;

            api.putDoc(event, function (response){
                if (response.error){
                    res.end(JSON.stringify({ok: false, error: 'Unable to approve the request: '+response.error}));
                }
                else {
                    res.end(JSON.stringify({ok: true, info: "Successfully approved the registration request."}));
                }
            });
        }
        else {
            res.end(JSON.stringify({ok: false, error: 'Unable to find that registration request.'}));
        }
    }
    else {
        res.end(JSON.stringify({ok: false, error: 'Unable to find that registration request.'}));
    }
}

function denyRequest(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
    var api = req.app.set('iapi');

    if (req.request_index > -1){
        var event = base.util.clone(req.event);

        if (!event.registrations[req.request_index].approved && event.registrations[req.request_index].type == req.request_data.type && event.registrations[req.request_index].id == req.request_data.id){
            event.registrations.splice(req.request_index, 1);

            api.putDoc(event, function (response){
                if (response.error){
                    res.end(JSON.stringify({ok: false, error: 'Unable to deny the request: '+response.error}));
                }
                else {
                    res.end(JSON.stringify({ok: true, info: "Successfully denied the registration request."}));
                }
            });
        }
        else {
            res.end(JSON.stringify({ok: false, error: 'Unable to find that registration request.'}));
        }
    }
    else {
        res.end(JSON.stringify({ok: false, error: 'Unable to find that registration request.'}));
    }
}

function registrationForm(req, res, next){
    var locals = {};
    locals.game = req.game;
    locals.event = req.event;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls", text: "Controls"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls/registrations", text: "Registrations"}];
    var typefilter = req.event.event_type.substring(0, req.event.event_type.length - 9);
    locals.registrations = (req.event.registrations || []).filter(function (regis){return regis.approved && regis.type == typefilter;});
    locals.registrations.sort(function (a, b){
        if (typefilter == "player"){
            if (a.code_or_handle.toLowerCase() == b.code_or_handle.toLowerCase()){
                return a.name_or_alias.toLowerCase() < b.name_or_alias.toLowerCase() ? -1 : 1;
            }
            else {
                return a.code_or_handle.toLowerCase() < b.code_or_handle.toLowerCase() ? -1 : 1;
            }
        }
        else {
            return a.name_or_alias.toLowerCase() < b.name_or_alias.toLowerCase() ? -1 : 1;
        }
    });

    res.render("event/registrations", locals);
}

function cancelRegistration(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
    var api = req.app.set('iapi');

    if (req.regis_index > -1){
        var event = base.util.clone(req.event);

        if (event.registrations[req.regis_index].approved && event.registrations[req.regis_index].type == req.regis_data.type && event.registrations[req.regis_index].id == req.regis_data.id){
            event.registrations.splice(req.regis_index, 1);

            api.putDoc(event, function (response){
                if (response.error){
                    res.end(JSON.stringify({ok: false, error: 'Unable to cancel the registration: '+response.error}));
                }
                else {
                    res.end(JSON.stringify({ok: true, info: "Successfully cancelled the registration."}));
                }
            });
        }
        else {
            res.end(JSON.stringify({ok: false, error: 'Unable to find that registration.'}));
        }
    }
    else {
        res.end(JSON.stringify({ok: false, error: 'Unable to find that registration.'}));
    }
}

function adminForm(req, res, next){
    var locals = {};
    locals.game = req.game;
    locals.event = req.event;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls", text: "Controls"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls/admins", text: "Admins"}];

    locals.admins = (req.event.admins || []);
    locals.admins.sort(function (a, b){
        return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    });

    res.render("event/admins", locals);
}

function addAdmin(req, res, next){
    var api = req.app.set('iapi');

    res.writeHead(200, {"Content-type": "application/json"});
    if (!req.body || !req.body.handle)
    {
        res.end(JSON.stringify({ok: false, error: "parse error"}));
    }
    else
    {
        api.players.handles({key: req.body.handle.toLowerCase()}, function (response){
            if (response.error || !response.rows || !response.rows.length){
                res.end(JSON.stringify({ok: false, error: "Unable to find a player with that handle."}));
            }
            else {
                var admin_exists = false;
                (req.event.admins || []).forEach(function (admin){
                    if (admin.toLowerCase() == response.rows[0].key){
                        admin_exists = true;
                    }
                });

                if (admin_exists){
                    res.end(JSON.stringify({ok: false, error: 'That player already is an event admin.'}));
                }
                else {
                    var event = base.util.clone(req.event);

                    event.admins = event.admins || [];
                    event.admins.push(response.rows[0].value.handle);
                    api.putDoc(event, function (response2){
                        if (response2.error){
                            res.end(JSON.stringify({ok: false, error: "Unable to add the event admin: "+response2.error}));
                        }
                        else {
                            res.end(JSON.stringify({ok: true, info: "Event admin successfully added."}));
                        }
                    });
                }
            }
        });
    }
}

function removeAdmin(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
    var api = req.app.set('iapi');

    if (req.admin_index > -1 && (req.event.admins || [])[req.admin_index].toLowerCase() == req.admin_handle.toLowerCase()){
        var event = base.util.clone(req.event);

        event.admins.splice(req.admin_index, 1);

        api.putDoc(event, function (response){
            if (response.error){
                res.end(JSON.stringify({ok: false, error: 'Unable to remove the admin: '+response.error}));
            }
            else {
                res.end(JSON.stringify({ok: true, info: "Successfully removed the admin."}));
            }
        });
    }
    else {
        res.end(JSON.stringify({ok: false, error: 'Unable to find that event admin.'}));
    }
}

function deleteMatch(req, res, next){
    next(new base.errors.NotFound());
}

function deleteEvent(req, res, next){
    var api = req.app.set("iapi");

    res.writeHead(200, {"Content-type": "application/json"});
    if (req.event.startdate && req.event.startdate <= (new Date()).toISOString()){
        res.end(JSON.stringify({ok: false, error: "event has already started"}));
    }
    else {
        api.delDoc(req.event, function (response){
            if (response.error){
                res.end(JSON.stringify({ok: false, error: "cancellation failed: "+response.error}));
            }
            else {
                req.flash('info', 'Event successfully cancelled.');
                res.end(JSON.stringify({ok: true}));
            }
        });
    }
}