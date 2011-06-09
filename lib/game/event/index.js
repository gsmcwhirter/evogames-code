var base = require('../../base'),
    parsers = require("./parsers"),
    mw = require("./middleware"),
    json_schema = require('../../json-schema'),
    schemata = require('./schema'),
    event_schema = schemata.event,
    registration_schema = schemata.registration,
    match_schema = schemata.match,
    gametype_schema = require("../schema").gametype,
    markdown = require("discount"),
    TZDate = require("zoneinfo").TZDate,
    mlexer = require("math-lexer");

var app = module.exports = base.createServer();

var _base = "/:code/event";

app.get(_base, eventDirectory);

app.get(_base+"/history", eventHistory);
app.get(_base+"/matches", displayGameMatchList);

app.get(_base+"/create", createForm);
app.post(_base+"/create", createProcess);

app.get(_base+"/:slug", mw.checkParticipant, mw.checkRegisterable, displayEvent);

app.get(_base+"/:slug/register", base.auth.loginCheck, mw.forceRegisterable, mw.forceEventNotOver, registerForm);
app.post(_base+"/:slug/register", base.auth.loginCheck, mw.forceRegisterable, mw.forceEventNotOver, registerProcess);

app.del(_base+"/:slug/decline/:invite", base.auth.loginCheckAjax, mw.checkRegisterable, declineInvite);

app.get(_base+"/:slug/stats", mw.checkParticipant, displayStats);
app.get(_base+"/:slug/matches", mw.checkParticipant, displayMatchList);

app.get(_base+"/:slug/matches/submit", base.auth.loginCheck, mw.forceParticipant, mw.forceEventNotOver, submitMatchForm);
app.put(_base+"/:slug/matches/submit", base.auth.loginCheckAjax, mw.forceParticipantAjax, mw.forceEventNotOverAjax, submitMatchProcess);

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

    var now = (new Date()).toISOString();
    api.events.game_enddates({startkey: [req.game._id, now]}, function (response){
        if (response.rows && response.rows.length){
            response.rows.forEach(function (row){
                if (row.value.event.startdate < now){
                    locals.current_events.push(row.value.event);
                }
                else {
                    locals.future_events.push(row.value.event);
                }
            });
        }

        res.render("event/index", locals);
    });
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
        event.gamecode = req.game.code;
        event.creator = req.player.handle;
        event.name = fields.event_name;
        event.slug = fields.slug;
        event.event_type = fields.event_type;
        event.register_type = "request";
        event.minTeams = parseInt(fields.minTeams);

        if (fields.gametype_name == "custom"){
            var gtdata = JSON.parse(fields.marshal);
            var ratings = [];
            event.gametype = {};
            event.gametype.name = "custom";
            event.gametype.stats = [];

            var statnames = [];
            for (var k = 0, ct = gtdata.stats.length; k < ct; k++){
                var stat = gtdata.stats[k];
                stat.name = stat.name.trim();

                var lcstatname = stat.name.toLowerCase();
                if (statnames.indexOf(lcstatname) > -1){
                    locals.messages["marshal"].push("Duplicate stat names are not allowed.");
                    locals.errors = true;
                }
                else {
                    statnames.push(lcstatname);
                }

                if (["wins","losses","ties"].indexOf(lcstatname) > -1){
                    locals.messages["marshal"].push("Stat names may not be 'wins', 'losses', or 'ties'.");
                    locals.errors = true;
                }

                stat.ratingweight = parseFloat(stat.ratingweight || 0);
                if (stat.ratingweight != 0){
                    ratings.push(""+stat.ratingweight+" * "+stat.name);
                }
                if (stat.valtype == "formula"){
                    try {
                        stat.valformula = mlexer.parseString(stat.valdata, true).toLowerCase();
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

            if (ratings.length > 0){
                try {
                    event.gametype.ratingformula = mlexer.parseString(ratings.join(" + "), true).toLowerCase();
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
                event.gametype.ratingformula = "idem(0)";
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
                    event._id = "event-"+uuids[0];

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
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name}];

    locals.event.description = markdown.parse(locals.event.description || "(no description available)\n");
    locals.event.rules = markdown.parse(locals.event.rules || "(no description available)\n");

    var type_filter = locals.event.event_type.substring(0, locals.event.event_type.length - 9);
    locals.event.registrations = (locals.event.registrations || []).filter(function (regis){return regis.type == type_filter && regis.approved;});
    locals.event.registrations.sort(function (a, b){
        if (type_filter == "player"){
            if (a.code_or_handle.toLowerCase() == b.code_or_handle.toLowerCase()){
                return a.name_or_alias.toLowerCase() < b.name_or_alias.toLowerCase() ? -1 : 1;
            }

            return a.code_or_handle.toLowerCase() < b.code_or_handle.toLowerCase() ? -1 : 1;
        }
        else {
            return a.name_or_alias.toLowerCase() < b.name_or_alias.toLowerCase() ? -1 : 1;
        }
    });
    locals.registration_count = locals.event.registrations.length;

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
    locals.data.gametype_name = locals.data.gametype_name || req.event.gametype.name;
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
        var fnames = ["event_name","slug","event_type","register_type","minTeams",
            "gametype_name","marshal","description","rules","startdate_date",
            "startdate_time","enddate_date","enddate_time","allow_same_group_opponents"];
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

        event.gamecode = req.game.code;
        event.name = fields.event_name;
        event.slug = fields.slug;
        event.event_type = fields.event_type;
        event.register_type = fields.register_type;
        event.minTeams = parseInt(fields.minTeams);
        event.description = fields.description;
        event.rules = fields.rules;
        event.allow_same_group_opponents = (fields.allow_same_group_opponents == "yes");

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

        if (fields.gametype_name == "custom"){
            var gtdata = JSON.parse(fields.marshal);
            var ratings = [];
            event.gametype = {};
            event.gametype.name = "custom";
            event.gametype.wltweights = {
                wins: 0,
                losses: 0,
                ties: 0
            };
            event.gametype.stats = [];

            var statnames = [];
            for (var k = 0, ct = gtdata.stats.length; k < ct; k++){
                var stat = gtdata.stats[k];
                stat.name = stat.name.trim();

                var lcstatname = stat.name.toLowerCase();
                if (statnames.indexOf(lcstatname) > -1){
                    locals.messages["marshal"].push("Duplicate stat names are not allowed.");
                    locals.errors = true;
                }
                else {
                    statnames.push(lcstatname);
                }

                if (["wins","losses","ties"].indexOf(lcstatname) > -1){
                    locals.messages["marshal"].push("Stat names may not be 'wins', 'losses', or 'ties'.");
                    locals.errors = true;
                }
                
                stat.ratingweight = parseFloat(stat.ratingweight || 0);
                if (stat.ratingweight != 0){
                    ratings.push(""+stat.ratingweight+" * "+stat.name);
                }
                
                if (stat.valtype == "formula"){
                    try {
                        stat.valformula = mlexer.parseString(stat.valdata, true).toLowerCase();
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

            (["wins","losses","ties"]).forEach(function (wlt){
                if (gtdata.wltweights[wlt]){
                    var wltweight = parseFloat(gtdata.wltweights[wlt]);
                    event.gametype.wltweights[wlt] = wltweight;
                    if (wltweight != 0){
                        ratings.push(""+wltweight+" * "+wlt);
                    }
                }
            });

            if (ratings.length > 0){
                try {
                    event.gametype.ratingformula = mlexer.parseString(ratings.join(" + "), true).toLowerCase();
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
                event.gametype.ratingformula = "idem(0)";
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
                var slugs = response.rows.map(function (row){ return row.key.toLowerCase(); });

                var sindex = slugs.indexOf(event.slug.toLowerCase());

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

function declineInvite(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
    var api = req.app.set('iapi');

    if (req.invite_index > -1 && (req.event.invitations || [])[req.invite_index].id == req.invite_id){
        var errors = false;
        var event = base.util.clone(req.event);

        if (req.event.event_type == "player_register"){
            if ((req.event.invitations || [])[req.invite_index].type != "player" || req.invite_id != req.player._id){
                errors = true;
            }
        }
        else if (req.event.event_type == "group_register"){
            if ((req.event.invitations || [])[req.invite_index].type != "group"){
                errors = true;
            }
            else if (req.registerableGroups.map(function (group){return group._id}).indexOf(req.invite_id) == -1){
                errors = true;
            }
        }

        if (!errors){
            event.invitations.splice(req.invite_index, 1);
            api.putDoc(event, function (response){
                if (response.error){
                    res.end(JSON.stringify({ok: false, error: 'Unable to decline the invitation: '+response.error}));
                }
                else {
                    res.end(JSON.stringify({ok: true, info: "Successfully declined the invitation."}));
                }
            });
        }
        else {
            res.end(JSON.stringify({ok: false, error: 'Unable to find that event invitation.'}));
        }

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

function registerForm(req, res, next, locals){
    var api = req.app.set('iapi');
    locals = locals || {};
    locals.game = req.game;
    locals.event = req.event;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/register", text: "Registration"}];

    locals.register_options = [];
    if (req.event.event_type == "player_register"){
        if (req.event.register_type != "invite" || (req.event.invitations || []).filter(function (invite){return invite.type == "player" && invite.id == req.player._id}).length){
            req.player.aliases.sort().forEach(function (alias){
                locals.register_options.push({text: alias+"@"+req.player.handle, value: alias});
            });
        }
    }
    else if (req.event.event_type == "group_register"){
        if (req.event.register_type != "invite"){
            locals.register_options = req.registerableGroups.map(function (group){return {text: group.name, value: group._id};});
        }
        else {
            var invited_ids = (req.event.invitations || []).filter(function (invite){return invite.type == "group"}).map(function (invite){return invite.id});
            req.registerableGroups.forEach(function (group){
                if (invited_ids.indexOf(group._id) > -1){
                    locals.register_options.push({text: group.name, value: group._id});
                }
            });
        }
    }

    locals.register_options.sort(function (a, b){
        return a.text.toLowerCase() < b.text.toLowerCase() ? -1 : 1;
    });

    if (locals.register_options.length){
        res.render("event/register", locals);
    }
    else {
        req.flash('error', 'You are not eligible to register any participants.');
        res.redirect("game/"+req.game.code+"/event/"+req.event.slug);
    }
}

function registerProcess(req, res, next){
    var api = req.app.set('iapi');
    var locals = locals || {};

    if (req.body && req.body.registrant){
        var invitation_index = -1;
        var valid_type = false;
        if (req.event.event_type == "player_register"){
            var pinvites = (req.event.invitations || []).map(function (invite, index){return [invite, index]}).filter(function (invite){return invite[0].type == "player"});
            var pindex = pinvites.map(function (invite){return invite[0].id}).indexOf(req.player._id);

            if (pindex > -1){
                invitation_index = pinvites[pindex][1];
            }

            valid_type = "player";
        }
        else if (req.event.event_type == "group_register"){
            var ginvites = (req.event.invitations || []).map(function (invite, index){return [invite, index]}).filter(function (invite){return invite[0].type == "group"});
            var gindex = ginvites.map(function (invite){return invite[0].id}).indexOf(req.body.registrant);

            if (gindex > -1){
                invitation_index = ginvites[gindex][1];
            }

            valid_type = "group";
        }

        if (valid_type){
            if (req.event.register_type != "invite" || invitation_index > -1){
                var event = base.util.clone(req.event);

                if (invitation_index > -1){
                    event.invitations = event.invitations || [];
                    event.invitations.splice(invitation_index, 1);
                }

                event.registrations = event.registrations || [];

                var reg_ok = true;

                var registration = {};

                registration.type = valid_type;
                registration.approved = (invitation_index > -1 || req.event.register_type == "open") ? true : false;

                var exists;

                if (valid_type == "player"){
                    var alias_index = req.player.aliases.map(function (alias){return alias.toLowerCase()}).indexOf(req.body.registrant.toLowerCase());
                    exists = event.registrations.filter(function (regis){return regis.id == req.player._id && regis.name_or_alias.toLowerCase() == req.body.registrant.toLowerCase()}).length > 0;
                    if (alias_index > -1 && !exists){
                        registration.id = req.player._id;
                        registration.code_or_handle = req.player.handle;
                        registration.name_or_alias = req.player.aliases[alias_index];
                    }
                    else if (exists){
                        req.flash('error',"That alias is already registered.");
                        reg_ok = false;
                    }
                    else {
                        req.flash('error',"The alias requested was not found.");
                        reg_ok = false;
                    }
                }
                else if (valid_type == "group"){
                    var grp_index = req.registerableGroups.map(function (grp){return grp._id.toLowerCase()}).indexOf(req.body.registrant.toLowerCase());
                    exists = event.registrations.filter(function (regis){return regis.id.toLowerCase() == req.body.registrant.toLowerCase()}).length > 0;
                    if (grp_index > -1 && !exists){
                        registration.id = req.registerableGroups[grp_index]._id;
                        registration.code_or_handle = req.registerableGroups[grp_index].code;
                        registration.name_or_alias = req.registerableGroups[grp_index].name;
                    }
                    else if (exists){
                        req.flash("error","That group is already registered.");
                        reg_ok = false;
                    }
                    else {
                        req.flash("error","You do not have permission to register the requested group.");
                        reg_ok = false;
                    }
                }

                if (reg_ok){
                    var validation = json_schema.validate(registration, registration_schema);
                    if (validation.valid){
                        event.registrations.push(registration);

                        api.putDoc(event, function (response){
                            if (!response.error){
                                req.flash("info","Event registration was successful.");
                                res.redirect("game/"+req.game.code+"/event/"+req.event.slug);
                            }
                            else {
                                req.flash("error","Unable to save your registration: "+response.error);
                                registerForm(req, res, next, locals);
                            }
                        });
                    }
                    else {
                        req.flash("error","Registration has invalid format: "+JSON.stringify(validation.errors));
                        registerForm(req, res, next, locals);
                    }
                    
                }
                else {
                    registerForm(req, res, next, locals);
                }
            }
            else {
                req.flash("error", req.event.name+" is not accepting new registration requests.");
                registerForm(req, res, next, locals);
            }
        }
        else {
            req.flash("error", "Unknown registrant type found.");
            registerForm(req, res, next, locals);
        }
    }
    else {
        req.flash("error", "parse error");
        registerForm(req, res, next, locals);
    }
}

function submitMatchForm(req, res, next, locals){
    var api = req.app.set('iapi');
    locals = locals || {};
    locals.data = locals.data || {};
    locals.game = req.game;
    locals.event = req.event;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/matches", text: "Matches"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/matches/submit", text: "Submit"}];

    locals.registered_groups = [];
    locals.registered_players = [];
    locals.registered_handles = [];
    locals.registered_aliases = [];
    locals.autochange_data = {sel1: {}, sel2: {}};

    if (req.event.event_type == "player_register"){
        (req.event.registrations || []).forEach(function (regis){
            if (regis.type == "player" && regis.approved){
                locals.registered_handles.push(regis.code_or_handle);
                locals.registered_aliases.push(regis.name_or_alias);

                if (!locals.autochange_data.sel1[regis.code_or_handle.toLowerCase()]){
                    locals.autochange_data.sel1[regis.code_or_handle.toLowerCase()] = [];
                }

                locals.autochange_data.sel1[regis.code_or_handle.toLowerCase()].push(regis.name_or_alias);

                if (!locals.autochange_data.sel2[regis.name_or_alias.toLowerCase()]){
                    locals.autochange_data.sel2[regis.name_or_alias.toLowerCase()] = [];
                }

                locals.autochange_data.sel2[regis.name_or_alias.toLowerCase()].push(regis.code_or_handle);
            }
        });

        locals.registered_handles.sort(function (a, b){
            return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
        });
        locals.registered_handles = base.util.uniq(locals.registered_handles, true);

        locals.registered_aliases.sort(function (a, b){
            return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
        });
        locals.registered_aliases = base.util.uniq(locals.registered_aliases, true);

        showForm();
    }
    else if (req.event.event_type == "group_register"){
        api.events.registrations({startkey: [req.event._id, 0, 1], include_docs: true}, function (response){
            if (response.rows && response.rows.length){
                response.rows.forEach(function (row){
                    if (row.value.registration.type == "group" && row.value.registration.approved){
                        locals.registered_groups.push({code: row.value.registration.code_or_handle, name: row.value.registration.name_or_alias});

                        if (!locals.autochange_data.sel1[row.value.registration.code_or_handle.toLowerCase()]){
                            locals.autochange_data.sel1[row.value.registration.code_or_handle.toLowerCase()] = [];
                        }

                        (row.doc.members || []).forEach(function (member){
                            if (member.approved){
                                locals.registered_players.push(member.alias+"@"+member.handle);
                                locals.autochange_data.sel1[row.value.registration.code_or_handle.toLowerCase()].push(member.alias+"@"+member.handle);

                                if (!locals.autochange_data.sel2[(member.alias+"@"+member.handle).toLowerCase()]){
                                    locals.autochange_data.sel2[(member.alias+"@"+member.handle).toLowerCase()] = [];
                                }

                                locals.autochange_data.sel2[(member.alias+"@"+member.handle).toLowerCase()].push(row.value.registration.code_or_handle);
                            }
                        });
                    }
                });
            }

            locals.registered_groups.sort(function (a, b){
                if (a.name.toLowerCase() == b.name.toLowerCase()){
                    return a.code.toLowerCase() < b.code.toLowerCase() ? -1 : 1;
                }

                return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
            });

            locals.registered_players.sort(function (a, b){
                return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
            });
            locals.registered_players = base.util.uniq(locals.registered_players, true);

            showForm();
        });
    }

    function showForm(){

        res.render("event/match_submit", locals);
    }
}

function submitMatchProcess(req, res, next){
    var api = req.app.set('iapi');
    
    if (req.body && req.body.teams){
        var gametype = _gametypeHelper(req.event.gametype);

        var match = {};
        match.type = "event-match";
        match.created_at = (new Date()).toISOString();
        match.gameid = req.game._id;
        match.eventid = req.event._id;
        match.submitted_by = req.player.handle;
        match.gametype_name = req.event.gametype.name;
        match.uses_groups = req.event.event_type == "group_register";
        match.teams = [];

        for (var tkey in req.body.teams){
            var team = {};

            team.rank = parseInt(req.body.teams[tkey].rank);
            team.players = [];

            for (var pkey in req.body.teams[tkey].players){

                var player = {};
                player.handle = (req.body.teams[tkey].players[pkey].handle || "").trim();
                player.alias = (req.body.teams[tkey].players[pkey].alias || "").trim();

                if (req.event.event_type == "group_register"){
                    player.groupcode = (req.body.teams[tkey].players[pkey].groupcode || "").trim();
                }

                player.stats = {};

                for (var skey in req.body.teams[tkey].players[pkey].stats){
                    var lskey = skey.toLowerCase();

                    player.stats[lskey] = req.body.teams[tkey].players[pkey].stats[skey];

                    if (typeof gametype.statdefs[lskey] != "undefined"){
                        if (gametype.statdefs[lskey].valtype == "integer"){
                            player.stats[lskey] = parseInt(player.stats[lskey]);
                        }
                        else if (gametype.statdefs[lskey].valtype == "float"){
                            player.stats[lskey] = parseFloat(player.stats[lskey]);
                        }
                        else if (gametype.statdefs[lskey].valtype == "enum"){
                            if (gametype.statdefs[lskey].enum_list.indexOf(player.stats[lskey]) == -1){
                                player.stats[lskey] = false;
                            }
                        }
                        else {
                            player.stats[lskey] = (player.stats[lskey] || "").trim();
                        }
                    }
                }

                team.players.push(player);
            }

            match.teams.push(team);
        }
        
        var rankings = match.teams.map(function (team){return team.rank;});
        rankings.sort();

        var rank_wl = {};

        base.util.uniq(rankings, true).forEach(function (rank){
            rank_wl[rank] = {
                wins: rankings.filter(function (rank2){return rank2 > rank}).length,
                losses: rankings.filter(function (rank2){return rank2 < rank}).length
            }
        });

        var errors = [];
        var msg;
        
        //verify minimum number of teams
        if (match.teams.length < req.event.minTeams){
            errors.push("You must have at least "+req.event.minTeams+" teams.");
        }

        //load valid participant lists
        var valid_participants = {};

        if (req.event.event_type == "player_register"){
            valid_participants.players = [];
            (req.event.registrations || []).forEach(function (regis){
                if (regis.type == "player" && regis.approved){
                    valid_participants.players.push(regis.name_or_alias+"@"+regis.code_or_handle);
                }
            });

            valid_participants.players = valid_participants.players.map(function (player){return player.toLowerCase()});

            finishValidations();
        }
        else if (req.event.event_type == "group_register"){
            api.events.registrations({startkey: [req.event._id, 0, 1], include_docs: true}, function (response){
                if (response.rows && response.rows.length){
                    response.rows.forEach(function (row){
                        if (row.value.registration.type == "group" && row.value.registration.approved){

                            if (!valid_participants[row.doc.code.toLowerCase()]){
                                valid_participants[row.doc.code.toLowerCase()] = [];
                            }

                            (row.doc.members || []).forEach(function (member){
                                if (member.approved){
                                    valid_participants[row.doc.code.toLowerCase()].push((member.alias+"@"+member.handle).toLowerCase())
                                }
                            });

                        }
                    });
                }

                finishValidations();
            });
        }

        function finishValidations(){
            var handles_seen = [];
            var groups_seen = {};

            for (var i = 0, cti = match.teams.length; i < cti; i++){
                var team_wl = rank_wl[match.teams[i].rank];

                var sysutil = require('util');
                sysutil.puts(match.teams[i].rank, sysutil.inspect(rank_wl), sysutil.inspect(team_wl));

                match.teams[i].wins = team_wl.wins;
                match.teams[i].losses = team_wl.losses;
                match.teams[i].ties = match.teams.length - team_wl.wins - team_wl.losses - 1;

                for (var j = 0, ctj = match.teams[i].players.length; j < ctj; j++){
                    match.teams[i].players[j].stats.wins = match.teams[i].wins;
                    match.teams[i].players[j].stats.losses = match.teams[i].losses;
                    match.teams[i].players[j].stats.ties = match.teams[i].ties;

                    //verify handles and aliases all defined
                    if (!match.teams[i].players[j].handle){
                        msg = "All players must have a handle listed.";
                        if (errors.indexOf(msg) == -1) errors.push(msg);
                    }

                    if (!match.teams[i].players[j].alias){
                        msg = "All players must have an alias listed.";
                        if (errors.indexOf(msg) == -1) errors.push(msg);
                    }

                    //verify a handle can't appear twice
                    if (handles_seen.indexOf(match.teams[i].players[j].handle.toLowerCase()) != -1){
                        msg = "The same player cannot be listed more than once.";
                        if (errors.indexOf(msg) == -1) errors.push(msg);
                    }
                    else {
                        handles_seen.push(match.teams[i].players[j].handle.toLowerCase());
                    }

                    if (req.event.event_type == "group_register"){
                        //verify all players have a group
                        if (!match.teams[i].players[j].groupcode){
                            msg = "All players must have a group listed.";
                            if (errors.indexOf(msg) == -1) errors.push(msg);
                        }
                        else {
                            //verify that the players are all valid participants
                            if (valid_participants[match.teams[i].players[j].groupcode.toLowerCase()].indexOf((match.teams[i].players[j].alias+"@"+match.teams[i].players[j].handle).toLowerCase()) == -1){
                                msg = "One or more players are not valid participants from the selected groups.";
                                if (errors.indexOf(msg) == -1) errors.push(msg);
                            }

                            if (!req.event.allow_same_group_opponents){
                                //verify group codes can't appear on different teams
                                if (groups_seen[match.teams[i].players[j].groupcode.toLowerCase()]){
                                    if (groups_seen[match.teams[i].players[j].groupcode.toLowerCase()].filter(function (gpnum){return gpnum != i;}).length > 0){
                                        msg = "Players in the same group may not be on different teams.";
                                        if (errors.indexOf(msg) == -1) errors.push(msg);
                                    }
                                    else {
                                        groups_seen[match.teams[i].players[j].groupcode.toLowerCase()].push(i);
                                    }
                                }
                                else {
                                    groups_seen[match.teams[i].players[j].groupcode.toLowerCase()] = [i];
                                }
                            }
                        }
                    }
                    else {
                        //verify that the players are all valid participants
                        if (valid_participants.players.indexOf((match.teams[i].players[j].alias+"@"+match.teams[i].players[j].handle).toLowerCase()) == -1){
                            msg = "One or more players are not valid participants.";
                            if (errors.indexOf(msg) == -1) errors.push(msg);
                        }
                    }

                    gametype.stats.forEach(function (stat){
                        var lstatname = stat.name.toLowerCase();
                        //verify that all stats are present for all players
                        if (typeof match.teams[i].players[j].stats[lstatname] == "undefined"){
                            msg = "One or more players are missing stats values.";
                            if (errors.indexOf(msg) == -1) errors.push(msg);
                        }

                        //verify calculations of formulaic stats for all players
                        if (stat.valtype == "formula"){
                            match.teams[i].players[j].stats[lstatname] = gametype.statdefs[lstatname].statfunc(match.teams[i].players[j].stats);
                        }

                        //verify enums are from the list
                        if (stat.valtype == "enum"){
                            if (!match.teams[i].players[j].stats[lstatname]){
                                msg = "Choices must be made from the provided lists.";
                                if (errors.indexOf(msg) == -1) errors.push(msg);
                            }
                        }
                    });

                    match.teams[i].players[j].rating = gametype.ratingfunc(match.teams[i].players[j].stats);
                }

                //verify that the submitter played
                if (handles_seen.indexOf(req.player.handle.toLowerCase()) == -1 && !req.player.is_sysop){
                    errors.push("You cannot submit a game in which you did not participate.");
                }
            }

            var validation = json_schema.validate(match, match_schema);

            if (!validation.valid){
                errors.push("Match format validation failed.");
            }

            if (errors.length == 0){
                api.uuids(function (uuids){
                    match._id = "event-match-"+uuids[0];

                    api.putDoc(match, function (response){
                        if (!response.error){
                            req.flash("info", "The match was successfully submitted.");
                            res.writeHead(200, {"Content-type": "application/json"});
                            res.end(JSON.stringify({ok: true, info: "", redir_url: "/game/"+req.game.code+"/event/"+req.event.slug+"/matches/"+uuids[0]}));
                        }
                        else {
                            res.writeHead(200, {"Content-type": "application/json"});
                            res.end(JSON.stringify({ok: false, error: "There was an error submitting the match: "+response.error}));
                        }
                    });
                });
            }
            else {
                res.writeHead(200, {"Content-type": "application/json"});
                res.end(JSON.stringify({ok: false, error: errors}));
            }
        }
        
    }
    else {
        res.writeHead(200, {"Content-type": "application/json"});
        res.end(JSON.stringify({ok: false, error: "parse error"}));
    }
    
}

function displayMatch(req, res, next){
    var locals = {};
    locals.game = req.game;
    locals.event = req.event;
    locals.match = req.match;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/matches", text: "Matches"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/matches/"+req.match._id.substring(12), text: req.match._id.substring(12)}];

    
    res.render("event/match_view", locals);
}

function displayMatchList(req, res, next){
    var api = req.app.set('iapi');
    var locals = {};
    locals.game = req.game;
    locals.event = req.event;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/matches", text: "Matches"}];

    var opts = {include_docs: true, descending: true, limit: 11};
    opts.startkey = [req.event._id, 1];
    opts.endkey = [req.event._id, 0];
    if (req.param('nextpage')) opts.startkey = [req.event._id, 0].concat(decodeURI(req.param('nextpage')));
    opts.limit = parseInt(req.param('limit')) || 10;
    opts.limit += 1;

    api.events.event_matches(opts, function (response){
        var matches = response.rows || [];
        var nextpage;
        if (matches.length < opts.limit)
        {
            nextpage = false;
            matches.push(null);
        }
        else{
            nextpage = response.rows[opts.limit - 1].key.slice(2);
        }

        matches.pop();
        matches = matches.map(function (row){return row.doc;});

        locals.matches = matches;
        locals.nextpage = nextpage;
        locals.limit = opts.limit - 1;

        res.render("event/matches", locals);
    });
}

function displayGameMatchList(req, res, next){
    var api = req.app.set('iapi');
    var locals = {};
    locals.game = req.game;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/matches", text: "Matches"}];

    var opts = {include_docs: true, descending: true, limit: 11};
    opts.startkey = [req.game._id, 1];
    opts.endkey = [req.game._id, 0];
    if (req.param('nextpage')) opts.startkey = [req.game._id, 0].concat(decodeURI(req.param('nextpage')));
    opts.limit = parseInt(req.param('limit')) || 10;
    opts.limit += 1;

    api.events.game_matches(opts, function (response){
        var matches = response.rows || [];
        var nextpage;
        if (matches.length < opts.limit)
        {
            nextpage = false;
            matches.push(null);
        }
        else{
            nextpage = response.rows[opts.limit - 1].key.slice(2);
        }

        matches.pop();
        matches = matches.map(function (row){return {match: row.value.match, event: row.doc};});

        locals.matches = matches;
        locals.nextpage = nextpage;
        locals.limit = opts.limit - 1;

        res.render("event/game_matches", locals);
    });
}

function displayStats(req, res, next){
    next(new base.errors.NotFound());
}

function disputeMatch(req, res, next){
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

function deleteMatch(req, res, next){
    next(new base.errors.NotFound());
}

function _gametypeHelper(gametype){
    gametype.statdefs = {};
    (gametype.stats || []).forEach(function (stat){
        gametype.statdefs[stat.name.toLowerCase()] = stat;
        if (stat.valtype == "formula"){
            gametype.statdefs[stat.name.toLowerCase()].statfunc = mlexer.parseStringRep(stat.valformula);
        }
        else if (stat.valtype == "enum"){
            gametype.statdefs[stat.name.toLowerCase()].enum_list = stat.valdata.split(",").map(function (opt){return opt.trim()});
        }
    });

    gametype.ratingfunc = mlexer.parseStringRep(gametype.ratingformula);

    return gametype;
}