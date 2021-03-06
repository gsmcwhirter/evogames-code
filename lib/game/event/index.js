var base = require('../../base'),
    parsers = require("./parsers"),
    mw = require("./middleware"),
    json_schema = require('../../json-schema'),
    schemata = require('./schema'),
    event_schema = schemata.event,
    registration_schema = schemata.registration,
    match_schema = schemata.match,
    dispute_schema = schemata.dispute,
    gametype_schema = require("../schema").gametype,
    markdown = require("discount"),
    TZDate = require("zoneinfo").TZDate,
    mlexer = require("math-lexer");

var app = module.exports = base.createServer();

var _base = "/:code/event";

app.get(_base, eventDirectory);

app.get(_base+"/history", eventHistory);
app.get(_base+"/stats", displayGameStats);
app.get(_base+"/matches", displayGameMatchList);

app.get(_base+"/create", createForm);
app.post(_base+"/create", createProcess);

app.get(_base+"/:slug", mw.checkParticipant, mw.checkRegisterable, displayEvent);
app.get(_base+"/:slug/gametype", mw.checkParticipant, mw.checkRegisterable, displayGametype);

app.get(_base+"/:slug/register", base.auth.loginCheck, mw.forceRegisterable, mw.forceEventNotOver, mw.checkParticipant, registerForm);
app.post(_base+"/:slug/register", base.auth.loginCheck, mw.forceRegisterable, mw.forceEventNotOver, mw.checkParticipant, registerProcess);

app.del(_base+"/:slug/decline/:invite", base.auth.loginCheckAjax, mw.checkRegisterable, mw.forceEventNotOver, declineInvite);

app.get(_base+"/:slug/stats", mw.checkParticipant, mw.checkRegisterable, displayStats);
app.get(_base+"/:slug/matches", mw.checkParticipant, mw.checkRegisterable, displayMatchList);

app.get(_base+"/:slug/matches/submit", base.auth.loginCheck, mw.forceParticipant, mw.forceEventNotOver, mw.checkRegisterable, submitMatchForm);
app.put(_base+"/:slug/matches/submit", base.auth.loginCheckAjax, mw.forceParticipantAjax, mw.forceEventNotOverAjax, submitMatchProcess);

app.get(_base+"/:slug/matches/:matchid", mw.checkParticipant, mw.checkRegisterable, mw.checkDisputable, displayMatch);
app.get(_base+"/:slug/matches/:matchid/dispute", base.auth.loginCheck, mw.forceDisputable, mw.checkParticipant, mw.checkRegisterable, disputeForm);
app.post(_base+"/:slug/matches/:matchid/dispute", base.auth.loginCheck, mw.forceDisputable, mw.checkParticipant, mw.checkRegisterable, disputeProcess);

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

app.get(_base+"/:slug/controls/registrations", base.auth.loginCheck, mw.forceEventAdmin, mw.forceEventNotOver, registrationAdminForm);
app.del(_base+"/:slug/controls/registrations/remove/:registration", base.auth.loginCheckAjax, mw.forceEventAdminAjax, mw.forceEventNotOverAjax, cancelRegistration);

app.get(_base+"/:slug/controls/admins", base.auth.loginCheck, mw.forceEventCreator, adminForm);
app.put(_base+"/:slug/controls/admins/add", base.auth.loginCheckAjax, mw.forceEventCreatorAjax, addAdmin);
app.del(_base+"/:slug/controls/admins/@:admin", base.auth.loginCheckAjax, mw.forceEventCreatorAjax, removeAdmin);

app.get(_base+"/:slug/controls/disputes", base.auth.loginCheck, mw.forceEventAdmin, disputeList);
app.del(_base+"/:slug/controls/disputes/allow", base.auth.loginCheckAjax, mw.forceEventAdminAjax, _toggleDisputes(true));
app.del(_base+"/:slug/controls/disputes/disallow", base.auth.loginCheckAjax, mw.forceEventAdminAjax, _toggleDisputes(false));

app.get(_base+"/:slug/controls/disputes/:matchid", base.auth.loginCheck, mw.forceEventAdmin, mw.forceMatchDisputed, displayDispute);
app.get(_base+"/:slug/controls/disputes/:matchid/edit", base.auth.loginCheck, mw.forceEventAdmin, mw.forceMatchDisputed, editMatchForm);
app.put(_base+"/:slug/controls/disputes/:matchid/edit", base.auth.loginCheckAjax, mw.forceEventAdminAjax, mw.forceMatchDisputedAjax, editMatchProcess);
app.del(_base+"/:slug/controls/disputes/:matchid/delete", base.auth.loginCheckAjax, mw.forceEventAdminAjax, mw.forceMatchDisputedAjax, deleteMatch);
app.put(_base+"/:slug/controls/disputes/:matchid/resolve", base.auth.loginCheckAjax, mw.forceEventAdminAjax, mw.forceMatchDisputedAjax, resolveDispute);

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
    api.events.game_enddates({startkey: [req.game._id, 0, now], endkey: [req.game._id, 1]}, function (response){
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

    api.events.game_enddates({startkey: [req.game._id, 0], endkey: [req.game._id, 0, (new Date()).toISOString(), 1]}, function (response){
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
                            req.flash("error", "Unable to save your event: "+(response.reason || response.error));
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
    var now = (new Date()).toISOString();
    locals.game = req.game;
    locals.event = req.event;
    locals.is_admin = req.isEventAdmin;
    locals.is_participant = req.isEventParticipant;
    locals.event_is_current = req.event.startdate && req.event.startdate <= now && (!req.event.enddate || req.event.enddate > now);
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

function displayGametype(req, res, next){
    var locals = {};
    var now = (new Date()).toISOString();

    req.event.gametype.ratingformula_latex = mlexer.parseStringRepLatex(req.event.gametype.ratingformula);

    for (var j = 0, ctj = (req.event.gametype.stats || []).length; j < ctj; j++){
        if (req.event.gametype.stats[j].valtype == "formula"){
            req.event.gametype.stats[j].latex = mlexer.parseStringRepLatex(req.event.gametype.stats[j].valformula);
        }
    }

    locals.game = req.game;
    locals.event = req.event;
    locals.is_admin = req.isEventAdmin;
    locals.is_participant = req.isEventParticipant;
    locals.event_is_current = req.event.startdate && req.event.startdate <= now && (!req.event.enddate || req.event.enddate > now);
    locals.is_registerable = req.isEventRegisterable;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name}];



    res.render("event/gametype", locals);
}

function eventControls(req, res, next){
    var locals = {};
    var now = (new Date()).toISOString();
    locals.game = req.game;
    locals.event = req.event;
    locals.is_creator = req.isEventCreator;
    locals.is_ended = req.event.enddate && req.event.enddate <= now;
    locals.is_started = req.event.startdate && req.event.startdate <= now;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls", text: "Controls"}];

    res.render("event/controls", locals);
}

function editForm(req, res, next, locals){
    var now = (new Date()).toISOString();
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
    locals.is_started = req.event.startdate && req.event.startdate <= now;
    locals.is_ended = req.event.enddate && req.event.enddate <= now;
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
            "startdate_time","enddate_date","enddate_time","allow_same_group_opponents","ranking_order"];
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
        event.ranking_order = fields.ranking_order;

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
                        req.flash("error", "Unable to save your event: "+(response.reason || response.error));
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

    res.header("Content-type", "application/json");
    if (!req.body || typeof req.body.code_or_handle == "undefined")
    {
        res.send({ok: false, error: "parse error"});
    }
    else
    {
        if (req.event.event_type == "player_register"){
            api.players.handles({key: req.body.code_or_handle.toLowerCase()}, function (response){
                if (response.error || !response.rows || !response.rows.length){
                    res.send({ok: false, error: "Unable to find a player with that handle."});
                }
                else {
                    var invite_exists = false;
                    (req.event.invitations || []).forEach(function (invite){
                        if (invite.type == "player" && invite.id == response.rows[0].id){
                            invite_exists = true;
                        }
                    });

                    if (invite_exists){
                        res.send({ok: false, error: 'That player already has an invite.'});
                    }
                    else {
                        var event = base.util.clone(req.event);

                        event.invitations = event.invitations || [];
                        event.invitations.push({type: "player", name_or_handle: response.rows[0].value.handle, id: response.rows[0].id});
                        var handle = response.rows[0].value.handle;
                        api.putDoc(event, function (response2){
                            if (response2.error){
                                res.send({ok: false, error: "Unable to save the invitation: "+response2.error});
                            }
                            else {
                                var msg = {
                                    from: "",
                                    subject: "Invitation to Event: "+event.name+" ("+event.gamecode.toUpperCase()+" "+event.gametype.name.toUpperCase()+")",
                                    to: [{handle: handle, is_read: false, is_deleted: false}],
                                    bcc: [{handle: req.player.handle, is_read: false, is_deleted: false}]
                                };

                                base.util.render_pm(res, "mail/event_invite_player.ejs", {event: event, handle: handle}, msg, function (err, message){
                                    if (!err){
                                        api.messages.sendMessage(message);
                                    }
                                });

                                res.send({ok: true, info: "Invitation successfully saved.", type: "player", id: response.rows[0].id, name_or_handle: req.body.code_or_handle});
                            }
                        });
                    }
                }
            });
        }
        else if (req.event.event_type == "group_register"){
            api.groups.codes({key: req.body.code_or_handle.toLowerCase(), include_docs: true}, function (response){
                if (response.error || !response.rows || !response.rows.length){
                    res.send({ok: false, error: "Unable to find a group with that code."});
                }
                else {
                    var invite_exists = false;
                    (req.event.invitations || []).forEach(function (invite){
                        if (invite.type == "group" && invite.id == response.rows[0].id){
                            invite_exists = true;
                        }
                    });

                    if (invite_exists){
                        res.send({ok: false, error: 'That group already has an invite.'});
                    }
                    else {
                        var event = base.util.clone(req.event);

                        event.invitations = event.invitations || [];
                        event.invitations.push({type: "group", name_or_handle: response.rows[0].value.name, id: response.rows[0].id});

                        var group = response.rows[0].doc;

                        api.putDoc(event, function (response2){
                            if (response2.error){
                                res.send({ok: false, error: "Unable to save the invitation: "+response2.error});
                            }
                            else {
                                var msg = {
                                    from: "",
                                    subject: "Invitation to Event: "+event.name+" ("+event.gamecode.toUpperCase()+" "+event.gametype.name.toUpperCase()+")",
                                    to: [],
                                    cc: [],
                                    bcc: [{handle: req.player.handle, is_read: false, is_deleted: false}]
                                };

                                group.owners.forEach(function (owner){
                                    msg.to.push({handle: owner, is_read: false, is_deleted: false});
                                });

                                (group.members || []).filter(function (member){return member.approved && (member.admin || []).indexOf("events") > -1}).forEach(function (admin){
                                    msg.cc.push({handle: admin.handle, is_read: false, is_deleted: false});
                                });

                                base.util.render_pm(res, "mail/event_invite_group.ejs", {event: event, group: group}, msg, function (err, message){
                                    if (!err){
                                        api.messages.sendMessage(message);
                                    }
                                });

                                res.send({ok: true, info: "Invitation successfully saved.", type: "group", id: response.rows[0].id, name_or_handle: response.rows[0].value.name});
                            }
                        });
                    }
                }
            });
        }
        else {
            res.send({ok: false, error: "event type error"});
        }
    }
}

function withdrawInvite(req, res, next){
    res.header("Content-type", "application/json");
    var api = req.app.set('iapi');

    if (req.invite_index > -1 && (req.event.invitations || [])[req.invite_index].id == req.invite_id){
        var event = base.util.clone(req.event);

        event.invitations.splice(req.invite_index, 1);

        api.putDoc(event, function (response){
            if (response.error){
                res.send({ok: false, error: 'Unable to withdraw the invitation: '+(response.reason || response.error)});
            }
            else {
                res.send({ok: true, info: "Successfully withdrew the invitation."});
            }
        });
    }
    else {
        res.send({ok: false, error: 'Unable to find that event invitation.'});
    }
}

function declineInvite(req, res, next){
    res.header("Content-type", "application/json");
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
                    res.send({ok: false, error: 'Unable to decline the invitation: '+(response.reason || response.error)});
                }
                else {
                    res.send({ok: true, info: "Successfully declined the invitation."});
                }
            });
        }
        else {
            res.send({ok: false, error: 'Unable to find that event invitation.'});
        }

    }
    else {
        res.send({ok: false, error: 'Unable to find that event invitation.'});
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
    res.header("Content-type", "application/json");
    var api = req.app.set('iapi');

    if (req.request_index > -1){
        var event = base.util.clone(req.event);

        if (!event.registrations[req.request_index].approved && event.registrations[req.request_index].type == req.request_data.type && event.registrations[req.request_index].id == req.request_data.id){
            event.registrations[req.request_index].approved = true;
            var reg = event.registrations[req.request_index];

            api.putDoc(event, function (response){
                if (response.error){
                    res.send({ok: false, error: 'Unable to approve the request: '+(response.reason || response.error)});
                }
                else {
                    var msg = {
                        from: "",
                        subject: "Request to Participate in "+event.name+" ("+event.gamecode.toUpperCase()+" "+event.gametype.name.toUpperCase()+")",
                        bcc: [{handle: req.player.handle, is_read: false, is_deleted: false}]
                    };

                    if (reg.type == "player"){
                        msg.to = [{handle: reg.code_or_handle, is_read: false, is_deleted: false}];

                        base.util.render_pm(res, "mail/event_registration_approve_player.ejs", {event: event, registration: reg}, msg, function (err, message){
                            if (!err){
                                api.messages.sendMessage(message);
                            }
                        });
                    }
                    else if (reg.type == "group"){
                        msg.to = [];
                        msg.cc = [];

                        api.getDoc(reg.id, function (group){
                            if (group && group.type == "group"){
                                group.owners.forEach(function (owner){
                                    msg.to.push({handle: owner, is_read: false, is_deleted: false});
                                });

                                (group.members || []).filter(function (member){return member.approved && (member.admin || []).indexOf("events") > -1}).forEach(function (admin){
                                    msg.cc.push({handle: admin.handle, is_read: false, is_deleted: false});
                                });
                            }

                            base.util.render_pm(res, "mail/event_registration_approve_group.ejs", {event: event, registration: reg}, msg, function (err, message){
                                if (!err){
                                    api.messages.sendMessage(message);
                                }
                            });
                        });
                    }

                    res.send({ok: true, info: "Successfully approved the registration request."});
                }
            });
        }
        else {
            res.send({ok: false, error: 'Unable to find that registration request.'});
        }
    }
    else {
        res.send({ok: false, error: 'Unable to find that registration request.'});
    }
}

function denyRequest(req, res, next){
    res.header("Content-type", "application/json");
    var api = req.app.set('iapi');

    if (req.request_index > -1){
        var event = base.util.clone(req.event);

        if (!event.registrations[req.request_index].approved && event.registrations[req.request_index].type == req.request_data.type && event.registrations[req.request_index].id == req.request_data.id){
            var reg = event.registrations[req.request_index];
            event.registrations.splice(req.request_index, 1);

            api.putDoc(event, function (response){
                if (response.error){
                    res.send({ok: false, error: 'Unable to deny the request: '+(response.reason || response.error)});
                }
                else {
                    var msg = {
                        from: "",
                        subject: "Request to Participate in "+event.name+" ("+event.gamecode.toUpperCase()+" "+event.gametype.name.toUpperCase()+")",
                        bcc: [{handle: req.player.handle, is_read: false, is_deleted: false}]
                    };

                    if (reg.type == "player"){
                        msg.to = [{handle: reg.code_or_handle, is_read: false, is_deleted: false}];

                        base.util.render_pm(res, "mail/event_registration_deny_player.ejs", {event: event, registration: reg}, msg, function (err, message){
                            if (!err){
                                api.messages.sendMessage(message);
                            }
                        });
                    }
                    else if (reg.type == "group"){
                        msg.to = [];
                        msg.cc = [];

                        api.getDoc(reg.id, function (group){
                            if (group && group.type == "group"){
                                group.owners.forEach(function (owner){
                                    msg.to.push({handle: owner, is_read: false, is_deleted: false});
                                });

                                (group.members || []).filter(function (member){return member.approved && (member.admin || []).indexOf("events") > -1}).forEach(function (admin){
                                    msg.cc.push({handle: admin.handle, is_read: false, is_deleted: false});
                                });
                            }

                            base.util.render_pm(res, "mail/event_registration_deny_group.ejs", {event: event, registration: reg}, msg, function (err, message){
                                if (!err){
                                    api.messages.sendMessage(message);
                                }
                            });
                        });
                    }

                    res.send({ok: true, info: "Successfully denied the registration request."});
                }
            });
        }
        else {
            res.send({ok: false, error: 'Unable to find that registration request.'});
        }
    }
    else {
        res.send({ok: false, error: 'Unable to find that registration request.'});
    }
}

function registrationAdminForm(req, res, next){
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
    res.header("Content-type", "application/json");
    var api = req.app.set('iapi');

    if (req.regis_index > -1){
        var event = base.util.clone(req.event);

        if (event.registrations[req.regis_index].approved && event.registrations[req.regis_index].type == req.regis_data.type && event.registrations[req.regis_index].id == req.regis_data.id){
            event.registrations.splice(req.regis_index, 1);

            api.putDoc(event, function (response){
                if (response.error){
                    res.send({ok: false, error: 'Unable to cancel the registration: '+(response.reason || response.error)});
                }
                else {
                    res.send({ok: true, info: "Successfully cancelled the registration."});
                }
            });
        }
        else {
            res.send({ok: false, error: 'Unable to find that registration.'});
        }
    }
    else {
        res.send({ok: false, error: 'Unable to find that registration.'});
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

    res.header("Content-type", "application/json");
    if (!req.body || typeof req.body.handle == "undefined")
    {
        res.send({ok: false, error: "parse error"});
    }
    else
    {
        api.players.handles({key: req.body.handle.toLowerCase()}, function (response){
            if (response.error || !response.rows || !response.rows.length){
                res.send({ok: false, error: "Unable to find a player with that handle."});
            }
            else {
                var admin_exists = false;
                (req.event.admins || []).forEach(function (admin){
                    if (admin.toLowerCase() == response.rows[0].key){
                        admin_exists = true;
                    }
                });

                if (admin_exists){
                    res.send({ok: false, error: 'That player already is an event admin.'});
                }
                else {
                    var handle = response.rows[0].value.handle;
                    var event = base.util.clone(req.event);

                    event.admins = event.admins || [];
                    event.admins.push(handle);
                    api.putDoc(event, function (response2){
                        if (response2.error){
                            res.send({ok: false, error: "Unable to add the event admin: "+response2.error});
                        }
                        else {
                            var msg = {
                                from: "",
                                subject: "Event Admin for "+event.name+" ("+event.gamecode.toUpperCase()+" "+event.gametype.name.toUpperCase()+")",
                                to: [{handle: handle, is_read: false, is_deleted: false}],
                                bcc: [{handle: req.player.handle, is_read: false, is_deleted: false}]
                            };

                            base.util.render_pm(res, "mail/event_admin_added.ejs", {event: event, handle: handle}, msg, function (err, message){
                                if (!err){
                                    api.messages.sendMessage(message);
                                }
                            });

                            res.send({ok: true, info: "Event admin successfully added."});
                        }
                    });
                }
            }
        });
    }
}

function removeAdmin(req, res, next){
    res.header("Content-type", "application/json");
    var api = req.app.set('iapi');

    if (req.admin_index > -1 && (req.event.admins || [])[req.admin_index].toLowerCase() == req.admin_handle.toLowerCase()){
        var event = base.util.clone(req.event);

        event.admins.splice(req.admin_index, 1);

        api.putDoc(event, function (response){
            if (response.error){
                res.send({ok: false, error: 'Unable to remove the admin: '+(response.reason || response.error)});
            }
            else {
                res.send({ok: true, info: "Successfully removed the admin."});
            }
        });
    }
    else {
        res.send({ok: false, error: 'Unable to find that event admin.'});
    }
}

function deleteEvent(req, res, next){
    var api = req.app.set("iapi");

    res.header("Content-type", "application/json");
    if (req.event.startdate && req.event.startdate <= (new Date()).toISOString()){
        res.send({ok: false, error: "event has already started"});
    }
    else {
        api.delDoc(req.event, function (response){
            if (response.error){
                res.send({ok: false, error: "cancellation failed: "+(response.reason || response.error)});
            }
            else {
                req.flash('info', 'Event successfully cancelled.');
                res.send({ok: true});
            }
        });
    }
}

function registerForm(req, res, next, locals){
    var api = req.app.set('iapi');
    locals = locals || {};
    var now = (new Date()).toISOString();
    locals.game = req.game;
    locals.event = req.event;
    locals.is_admin = req.isEventAdmin;
    locals.is_participant = req.isEventParticipant;
    locals.event_is_current = req.event.startdate && req.event.startdate <= now && (!req.event.enddate || req.event.enddate > now);
    locals.is_registerable = req.isEventRegisterable;
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

    if (req.body && typeof req.body.registrant != "undefined"){
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
                                var msg = {
                                    from: "",
                                    subject: event.name+" ("+event.gamecode.toUpperCase()+" "+event.gametype.name.toUpperCase()+")",
                                    to: [{handle: event.creator, is_read: false, is_deleted: false}],
                                    cc: []
                                };

                                (event.admins || []).forEach(function (admin){
                                    msg.cc.push({handle: admin, is_read: false, is_deleted: false});
                                });

                                var pm_template;

                                if (event.register_type == "open" || invitation_index > -1){
                                    req.flash('info', 'You have successfully registered for '+event.name+". The registration is approved.");

                                    msg.subject = "New Registration: "+msg.subject;

                                    pm_template = "mail/event_registration_done_"+valid_type+".ejs";
                                }
                                else {
                                    req.flash('info', 'You have successfully registered for '+event.name+". The registration is pending.");

                                    msg.subject = "New Registration Request: "+msg.subject;

                                    pm_template = "mail/event_registration_request_"+valid_type+".ejs";
                                }

                                base.util.render_pm(res, pm_template, {event: event, registration: registration}, msg, function (err, message){
                                    if (!err){
                                        api.messages.sendMessage(message);
                                    }
                                });

                                res.redirect("game/"+req.game.code+"/event/"+req.event.slug);
                            }
                            else {
                                req.flash("error","Unable to save your registration: "+(response.reason || response.error));
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
    var now = (new Date()).toISOString();
    locals.game = req.game;
    locals.event = req.event;
    locals.is_admin = req.isEventAdmin;
    locals.is_participant = req.isEventParticipant;
    locals.event_is_current = req.event.startdate && req.event.startdate <= now && (!req.event.enddate || req.event.enddate > now);
    locals.is_registerable = req.isEventRegisterable;
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

function _reconstructTeams(req, submitter, callback){
    if (typeof submitter == "function"){
        callback = submitter, submitter = null;
    }
    
    var api = req.app.set('iapi');
    var gametype = _gametypeHelper(req.event.gametype);

    var teams = [];

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

        teams.push(team);
    }

    var rankings = teams.map(function (team){return team.rank;});
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
    if (teams.length < req.event.minTeams){
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

        for (var i = 0, cti = teams.length; i < cti; i++){
            var team_wl = rank_wl[teams[i].rank];

            var sysutil = require('util');
            sysutil.puts(teams[i].rank, sysutil.inspect(rank_wl), sysutil.inspect(team_wl));

            teams[i].wins = team_wl.wins;
            teams[i].losses = team_wl.losses;
            teams[i].ties = teams.length - team_wl.wins - team_wl.losses - 1;

            for (var j = 0, ctj = teams[i].players.length; j < ctj; j++){
                teams[i].players[j].stats.wins = teams[i].wins;
                teams[i].players[j].stats.losses = teams[i].losses;
                teams[i].players[j].stats.ties = teams[i].ties;
                teams[i].players[j].stats.games = 1;

                //verify handles and aliases all defined
                if (!teams[i].players[j].handle){
                    msg = "All players must have a handle listed.";
                    if (errors.indexOf(msg) == -1) errors.push(msg);
                }

                if (!teams[i].players[j].alias){
                    msg = "All players must have an alias listed.";
                    if (errors.indexOf(msg) == -1) errors.push(msg);
                }

                //verify a handle can't appear twice
                if (handles_seen.indexOf(teams[i].players[j].handle.toLowerCase()) != -1){
                    msg = "The same player cannot be listed more than once.";
                    if (errors.indexOf(msg) == -1) errors.push(msg);
                }
                else {
                    handles_seen.push(teams[i].players[j].handle.toLowerCase());
                }

                if (req.event.event_type == "group_register"){
                    //verify all players have a group
                    if (!teams[i].players[j].groupcode){
                        msg = "All players must have a group listed.";
                        if (errors.indexOf(msg) == -1) errors.push(msg);
                    }
                    else {
                        //verify that the players are all valid participants
                        if (valid_participants[teams[i].players[j].groupcode.toLowerCase()].indexOf((teams[i].players[j].alias+"@"+teams[i].players[j].handle).toLowerCase()) == -1){
                            msg = "One or more players are not valid participants from the selected groups.";
                            if (errors.indexOf(msg) == -1) errors.push(msg);
                        }

                        if (!req.event.allow_same_group_opponents){
                            //verify group codes can't appear on different teams
                            if (groups_seen[teams[i].players[j].groupcode.toLowerCase()]){
                                if (groups_seen[teams[i].players[j].groupcode.toLowerCase()].filter(function (gpnum){return gpnum != i;}).length > 0){
                                    msg = "Players in the same group may not be on different teams.";
                                    if (errors.indexOf(msg) == -1) errors.push(msg);
                                }
                                else {
                                    groups_seen[teams[i].players[j].groupcode.toLowerCase()].push(i);
                                }
                            }
                            else {
                                groups_seen[teams[i].players[j].groupcode.toLowerCase()] = [i];
                            }
                        }
                    }
                }
                else {
                    //verify that the players are all valid participants
                    if (valid_participants.players.indexOf((teams[i].players[j].alias+"@"+teams[i].players[j].handle).toLowerCase()) == -1){
                        msg = "One or more players are not valid participants.";
                        if (errors.indexOf(msg) == -1) errors.push(msg);
                    }
                }

                gametype.stats.forEach(function (stat){
                    var lstatname = stat.name.toLowerCase();
                    //verify that all stats are present for all players
                    if (typeof teams[i].players[j].stats[lstatname] == "undefined"){
                        msg = "One or more players are missing stats values.";
                        if (errors.indexOf(msg) == -1) errors.push(msg);
                    }

                    //verify calculations of formulaic stats for all players
                    if (stat.valtype == "formula"){
                        teams[i].players[j].stats[lstatname] = gametype.statdefs[lstatname].statfunc(teams[i].players[j].stats);
                    }

                    //verify enums are from the list
                    if (stat.valtype == "enum"){
                        if (!teams[i].players[j].stats[lstatname]){
                            msg = "Choices must be made from the provided lists.";
                            if (errors.indexOf(msg) == -1) errors.push(msg);
                        }
                    }
                });

                teams[i].players[j].rating = gametype.ratingfunc(teams[i].players[j].stats);
            }

            //verify that the submitter played
            submitter = submitter || req.player.handle;
            if (handles_seen.indexOf(submitter.toLowerCase()) == -1 && !req.player.is_sysop){
                errors.push("You cannot submit a game in which you did not participate.");
            }
        }

        callback(teams, errors);
    }
}

function submitMatchProcess(req, res, next){
    var api = req.app.set('iapi');
    if (req.body && typeof req.body.teams != "undefined"){

        var match = {};
        match.type = "event-match";
        match.created_at = (new Date()).toISOString();
        match.gameid = req.game._id;
        match.eventid = req.event._id;
        match.submitted_by = req.player.handle;
        match.gametype_name = req.event.gametype.name;
        match.uses_groups = req.event.event_type == "group_register";

        _reconstructTeams(req, function (teams, errors){
            match.teams = teams;

            var validation = json_schema.validate(match, match_schema);

            if (!validation.valid){
                errors.push("Match format validation failed.");
            }

            if (errors.length == 0){
                api.uuids(function (uuids){
                    match._id = "event-match-"+uuids[0];

                    api.putDoc(match, function (response){
                        if (!response.error){
                            var msg = {
                                from: "",
                                subject: "Match Submitted for "+req.event.name+" ("+req.event.gamecode.toUpperCase()+" "+req.event.gametype.name.toUpperCase()+")",
                                to: [],
                                cc: []
                            };

                            match.teams.forEach(function (team){
                                team.players.forEach(function (player){
                                    msg.to.push({handle: player.handle, is_read: false, is_deleted: false});
                                });
                            });

                            base.util.render_pm(res, "mail/event_match_submitted.ejs", {event: req.event, match: match}, msg, function (err, message){
                                if (!err){
                                    api.messages.sendMessage(message);
                                }
                            });

                            req.flash("info", "The match was successfully submitted.");
                            res.header("Content-type", "application/json");
                            res.send({ok: true, info: "", redir_url: "/game/"+req.game.code+"/event/"+req.event.slug+"/matches/"+uuids[0]});
                        }
                        else {
                            res.header("Content-type", "application/json");
                            res.send({ok: false, error: "There was an error submitting the match: "+(response.reason || response.error)});
                        }
                    });
                });
            }
            else {
                res.header("Content-type", "application/json");
                res.send({ok: false, error: errors});
            }
        });
        
    }
    else {
        res.header("Content-type", "application/json");
        res.send({ok: false, error: "parse error"});
    }
    
}

function displayMatch(req, res, next){
    var now = (new Date()).toISOString();
    var locals = {};
    locals.game = req.game;
    locals.event = req.event;
    locals.is_admin = req.isEventAdmin;
    locals.is_participant = req.isEventParticipant;
    locals.event_is_current = req.event.startdate && req.event.startdate <= now && (!req.event.enddate || req.event.enddate > now);
    locals.is_registerable = req.isEventRegisterable;
    locals.match = req.match;
    locals.match.is_disputable = req.isMatchDisputable;
    locals.event_is_current = req.event.startdate && req.event.startdate <= now && (!req.event.enddate || req.event.enddate > now);
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/matches", text: "Matches"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/matches/"+req.match._id.substring(12), text: req.match._id.substring(12)}];

    locals.avatars = {};

    var handles = [];
    req.match.teams.forEach(function (team){
        handles = handles.concat(team.players.map(function (player){return player.handle.toLowerCase()}));
    });

    _getPlayerAvatars(req, handles, function (avatars){
        locals.avatars = avatars;

        res.render("event/match_view", locals);
    });
}

function displayMatchList(req, res, next){
    var now = (new Date()).toISOString();
    var api = req.app.set('iapi');
    var locals = {};
    locals.game = req.game;
    locals.event = req.event;
    locals.is_admin = req.isEventAdmin;
    locals.is_participant = req.isEventParticipant;
    locals.event_is_current = req.event.startdate && req.event.startdate <= now && (!req.event.enddate || req.event.enddate > now);
    locals.is_registerable = req.isEventRegisterable;
    locals.event_is_current = req.event.startdate && req.event.startdate <= now && (!req.event.enddate || req.event.enddate > now);
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

        for (var i = 0, ct = matches.length; i < ct; i++){
            matches[i].is_disputable = mw._isDisputable(req, matches[i]);
        }

        locals.matches = matches;
        locals.nextpage = nextpage;
        locals.limit = opts.limit - 1;

        locals.avatars = {};

        var handles = [];
        matches.forEach(function (match){
            match.teams.forEach(function (team){
                handles = handles.concat(team.players.map(function (player){return player.handle.toLowerCase()}));
            });
        });
        base.util.uniq(handles);

        _getPlayerAvatars(req, handles, function (avatars){
            locals.avatars = avatars;

            res.render("event/matches", locals);
        });
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

        locals.avatars = {};

        var handles = [];
        matches.forEach(function (match){
            match.match.teams.forEach(function (team){
                handles = handles.concat(team.players.map(function (player){return player.handle.toLowerCase()}));
            });
        });
        base.util.uniq(handles);

        _getPlayerAvatars(req, handles, function (avatars){
            locals.avatars = avatars;

            res.render("event/game_matches", locals);
        });
    });
}

function disputeForm(req, res, next, locals){
    locals = locals || {messages: {}, errors: false};
    locals.data = locals.data || {};
    var now = (new Date()).toISOString();
    locals.game = req.game;
    locals.event = req.event;
    locals.is_admin = req.isEventAdmin;
    locals.is_participant = req.isEventParticipant;
    locals.event_is_current = req.event.startdate && req.event.startdate <= now && (!req.event.enddate || req.event.enddate > now);
    locals.is_registerable = req.isEventRegisterable;
    locals.match = req.match;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/matches", text: "Matches"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/matches/"+req.match._id.substring(12), text: req.match._id.substring(12)},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/matches/"+req.match._id.substring(12)+"/dispute", text: "Dispute"}];
    
    if (req.match.pending_disputes){
        for (var i = 0, cti = req.match.pending_disputes.length; i < cti; i++){
            req.match.pending_disputes[i].is_pending = true;
            req.match.pending_disputes[i].creation_note = markdown.parse(req.match.pending_disputes[i].creation_note || "(parse error)\n");
        }
    }
    
    if (req.match.resolved_disputes){
        for (var j = 0, ctj = req.match.resolved_disputes.length; j < ctj; j++){
            req.match.resolved_disputes[j].is_pending = false;
            req.match.resolved_disputes[j].creation_note = markdown.parse(req.match.resolved_disputes[j].creation_note || "(parse error)\n");
            req.match.resolved_disputes[j].resolution_note = markdown.parse(req.match.resolved_disputes[j].resolution_note || "(parse error)\n");
        }
    }

    locals.avatars = {};

    var handles = [];
    req.match.teams.forEach(function (team){
        handles = handles.concat(team.players.map(function (player){return player.handle.toLowerCase()}));
    });

    _getPlayerAvatars(req, handles, function (avatars){
        locals.avatars = avatars;

        res.render("event/dispute_form", locals);
    });
}

function disputeProcess(req, res, next){
    var api = req.app.set('iapi');
    var locals = {messages: {}, errors: false};

    if (req.body && typeof req.body.creation_note != "undefined"){
        locals.data = {};
        locals.data.creation_note = (req.body.creation_note || "").trim();

        var dispute = {};
        dispute.created_at = (new Date()).toISOString();
        dispute.created_by = req.player.handle;
        dispute.creation_note = locals.data.creation_note;

        api.uuids(function (uuids){
            dispute.id = uuids[0];

            var validation = json_schema.validate(dispute, dispute_schema);

            if (validation.valid){
                var match = base.util.clone(req.match);
                match.pending_disputes = match.pending_disputes || [];
                match.pending_disputes.push(dispute);

                api.putDoc(match, function (response){
                    if (!response.error){
                        var msg = {
                            from: "",
                            subject: "Match Disputed for "+req.event.name+" ("+req.event.gamecode.toUpperCase()+" "+req.event.gametype.name.toUpperCase()+")",
                            to: [],
                            cc: []
                        };

                        match.teams.forEach(function (team){
                            team.players.forEach(function (player){
                                msg.to.push({handle: player.handle, is_read: false, is_deleted: false});
                            });
                        });

                        msg.cc.push({handle: req.event.creator, is_read: false, is_deleted: false});
                        (req.event.admins || []).forEach(function (admin){
                            msg.cc.push({handle: admin, is_read: false, is_deleted: false});
                        });

                        base.util.render_pm(res, "mail/event_match_disputed.ejs", {event: req.event, match: match, dispute: dispute}, msg, function (err, message){
                            if (!err){
                                api.messages.sendMessage(message);
                            }
                        });

                        req.flash("info", "Your dispute was successfully recorded.");
                        res.redirect("game/"+req.game.code+"/event/"+req.event.slug+"/matches/"+req.match._id.substring(12));
                    }
                    else {
                        req.flash("error", "There were errors recording your dispute: "+(response.reason || response.error));
                        disputeForm(req, res, next, locals);
                    }
                });
            }
            else {
                req.flash("error", "There were errors recording your dispute.");
                disputeForm(req, res, next, locals);
            }
        });
    }
    else {
        req.flash("error", "parse error");
        disputeForm(req, res, next, locals);
    }
}

function disputeList(req, res, next){
    var api = req.app.set('iapi');
    var locals = {};
    locals.game = req.game;
    locals.event = req.event;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls", text: "Controls"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls/disputes", text: "Disputes"}];

    locals.disputes = [];
    api.events.event_disputes({startkey: [req.event._id, 0], endkey: [req.event._id, 1], include_docs: true}, function (response){
        if (response.rows && response.rows.length){
            locals.disputes = response.rows.map(function (row){return row.doc;});

            for (var i = 0, cti = locals.disputes.length; i < cti; i++){
                locals.disputes[i].is_disputed = true;

                for (var j = 0, ctj = locals.disputes[i].pending_disputes.length; j < ctj; j++){
                    locals.disputes[i].pending_disputes[j].creation_note = markdown.parse(locals.disputes[i].pending_disputes[j].creation_note || "(parse error)\n");
                    locals.disputes[i].pending_disputes[j].is_pending = true;
                }

                for (var k = 0, ctk = (locals.disputes[i].resolved_disputes || []).length; k < ctk; k++){
                    locals.disputes[i].resolved_disputes[k].creation_note = markdown.parse(locals.disputes[i].resolved_disputes[k].creation_note || "(parse error)\n");
                    locals.disputes[i].resolved_disputes[k].resolution_note = markdown.parse(locals.disputes[i].resolved_disputes[k].resolution_note || "(parse error)\n");
                }
            }
        }

        locals.avatars = {};

        var handles = [];
        locals.disputes.forEach(function (match){
            match.teams.forEach(function (team){
                handles = handles.concat(team.players.map(function (player){return player.handle.toLowerCase()}));
            });
        });

        _getPlayerAvatars(req, handles, function (avatars){
            locals.avatars = avatars;

            res.render("event/disputes", locals);
        });
    });
}

function displayDispute(req, res, next){
    var api = req.app.set('iapi');
    var locals = {};
    locals.game = req.game;
    locals.event = req.event;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls", text: "Controls"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls/disputes", text: "Disputes"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls/disputes/"+req.match._id.substring(12), text: req.match._id.substring(12)},];

    locals.dispute = req.match;

    if (locals.dispute.pending_disputes){
        for (var i = 0, cti = locals.dispute.pending_disputes.length; i < cti; i++){
            locals.dispute.pending_disputes[i].is_pending = true;
            locals.dispute.pending_disputes[i].creation_note = markdown.parse(locals.dispute.pending_disputes[i].creation_note || "(parse error)\n");
        }
    }

    if (locals.dispute.resolved_disputes){
        for (var j = 0, ctj = locals.dispute.resolved_disputes.length; j < ctj; j++){
            locals.dispute.resolved_disputes[j].is_pending = false;
            locals.dispute.resolved_disputes[j].creation_note = markdown.parse(locals.dispute.resolved_disputes[j].creation_note || "(parse error)\n");
            locals.dispute.resolved_disputes[j].resolution_note = markdown.parse(locals.dispute.resolved_disputes[j].resolution_note || "(parse error)\n");
        }
    }

    locals.avatars = {};

    var handles = [];
    req.match.teams.forEach(function (team){
        handles = handles.concat(team.players.map(function (player){return player.handle.toLowerCase()}));
    });

    _getPlayerAvatars(req, handles, function (avatars){
        locals.avatars = avatars;

        res.render("event/dispute_view", locals);
    });
}

function editMatchForm(req, res, next){
    var api = req.app.set('iapi');
    var locals = {};
    locals.data = {};
    locals.data.marshal = req.match;
    locals.game = req.game;
    locals.event = req.event;
    locals.match = req.match;
    locals.dispute_id = req.param("dispute_id","");
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

    if (locals.match.pending_disputes){
        for (var i = 0, cti = locals.match.pending_disputes.length; i < cti; i++){
            locals.match.pending_disputes[i].is_pending = true;
            locals.match.pending_disputes[i].creation_note = markdown.parse(locals.match.pending_disputes[i].creation_note || "(parse error)\n");
        }
    }

    if (locals.match.resolved_disputes){
        for (var j = 0, ctj = locals.match.resolved_disputes.length; j < ctj; j++){
            locals.match.resolved_disputes[j].is_pending = false;
            locals.match.resolved_disputes[j].creation_note = markdown.parse(locals.match.resolved_disputes[j].creation_note || "(parse error)\n");
            locals.match.resolved_disputes[j].resolution_note = markdown.parse(locals.match.resolved_disputes[j].resolution_note || "(parse error)\n");
        }
    }

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

        res.render("event/match_edit", locals);
    }
}

function editMatchProcess(req, res, next){
    var api = req.app.set('iapi');
    if (req.body && typeof req.body.teams != "undefined" && typeof req.body.disputeid != "undefined" && typeof req.body.resolution_note != "undefined"){

        var match = base.util.clone(req.match);

        var dispute_index = -1;
        dispute_index = (match.pending_disputes || []).map(function (dispute){return dispute.id;}).indexOf(req.body.disputeid);

        if (dispute_index > -1){
            var dispute = base.util.clone(req.match.pending_disputes[dispute_index]);

            dispute.resolved_at = (new Date()).toISOString();
            dispute.resolved_by = req.player.handle;
            dispute.resolution_note = req.body.resolution_note;

            _reconstructTeams(req, req.match.submitted_by, function (teams, errors){
                match.teams = teams;

                var validation = json_schema.validate(dispute, dispute_schema);

                if (!validation.valid){
                    errors.push("Dispute format validation failed.");
                }

                var validation2 = json_schema.validate(match, match_schema);

                if (!validation2.valid){
                    errors.push("Match format validation failed.");
                }

                if (errors.length == 0){
                    match.pending_disputes.splice(dispute_index, 1);
                    match.resolved_disputes = match.resolved_disputes || [];
                    match.resolved_disputes.push(dispute);
                    
                    api.putDoc(match, function (response){
                        if (!response.error){
                            req.flash("info", "The dispute was successfully resolved.");
                            res.header("Content-type", "application/json");
                            res.send({ok: true, info: "", redir_url: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls/disputes"});
                        }
                        else {
                            res.header("Content-type", "application/json");
                            res.send({ok: false, error: "There was an error resolving the dispute: "+(response.reason || response.error)});
                        }
                    });
                }
                else {
                    res.header("Content-type", "application/json");
                    res.send({ok: false, error: errors});
                }
            });
        }
        else {
            res.header("Content-type", "application/json");
            res.send({ok: false, error: "The pending dispute you tried to edit was not found or was already resolved."});
        }
    }
    else {
        res.header("Content-type", "application/json");
        res.send({ok: false, error: "parse error"});
    }
}

function _toggleDisputes(allow){
    return function (req, res, next){
        var api = req.app.set("iapi");

        var event = base.util.clone(req.event);
        event.disputes_closed = allow ? true : false;

        res.header("Content-type", "application/json");
        api.putDoc(event, function (response){
            if (!response.error){
                res.send({ok: true, info: "The event dispute policy was successfully changed."});
            }
            else {
                res.send({ok: false, error: "The event dispute policy was unable to be changed: "+(response.reason || response.error)});
            }
        });
    }
}

function deleteMatch(req, res, next){
    var api = req.app.set('iapi');

    api.delDoc(req.match, function (response){
        if (!response.error){
            req.flash("info", "The disputed match was successfully deleted.");
            res.header("Content-type", "application/json");
            res.send({ok: true, info: "", redir_url: "/game/"+req.game.code+"/event/"+req.event.slug+"/controls/disputes"});
        }
        else {
            res.header("Content-type", "application/json");
            res.send({ok: false, error: "There was an error deleting the disputed match: "+(response.reason || response.error)});
        }
    });
}

function resolveDispute(req, res, next){
    var api = req.app.set('iapi');
    if (req.body && typeof req.body.disputeid != "undefined" && typeof req.body.resolution_note != "undefined"){

        var match = base.util.clone(req.match);

        var dispute_index = -1;
        dispute_index = (match.pending_disputes || []).map(function (dispute){return dispute.id;}).indexOf(req.body.disputeid);

        if (dispute_index > -1){
            var dispute = base.util.clone(req.match.pending_disputes[dispute_index]);

            dispute.resolved_at = (new Date()).toISOString();
            dispute.resolved_by = req.player.handle;
            dispute.resolution_note = req.body.resolution_note;

            var validation = json_schema.validate(dispute, dispute_schema);

            if (validation.valid){

                match.pending_disputes.splice(dispute_index, 1);
                match.resolved_disputes = match.resolved_disputes || [];
                match.resolved_disputes.push(dispute);

                api.putDoc(match, function (response){
                    if (!response.error){
                        res.header("Content-type", "application/json");
                        res.send({ok: true,
                                                info: "The dispute was successfully resolved.",
                                                handle: req.player.handle,
                                                datetime: base.datetimeHelpers.datetime(req, res)(dispute.resolved_at),
                                                note: markdown.parse(dispute.resolution_note || "(parse error)\n")});
                    }
                    else {
                        res.header("Content-type", "application/json");
                        res.send({ok: false, error: "There was an error resolving the dispute: "+(response.reason || response.error)});
                    }
                });
            }
            else {
                res.header("Content-type", "application/json");
                res.send({ok: false, error: "Dispute format validation failed."});
            }
        }
        else {
            res.header("Content-type", "application/json");
            res.send({ok: false, error: "The pending dispute you tried to edit was not found or was already resolved."});
        }
    }
    else {
        res.header("Content-type", "application/json");
        res.send({ok: false, error: "parse error"});
    }
}

function _sortFuncGen(sortstring){
    var sortarray  =  sortstring.split(",")
                                .map(function (s){return s.trim().toLowerCase()})
                                .filter(function (s){return s})
                                .map(function (s){
                                    var colindex = s.indexOf(":");
                                    if (colindex > -1){
                                        var order = s.substring(colindex+1);
                                        if (order == "asc"){
                                            return [s.substring(0, colindex).trim(), -1];
                                        }
                                        else {
                                            return [s.substring(0, colindex).trim(), 1];
                                        }
                                    }
                                    else {
                                         return [s, 1];
                                    }
                                });

    if (sortarray.length){
        return function (a, b){
            for (var i = 0, cti = sortarray.length; i < cti; i++){
                if (a[sortarray[i][0]] != b[sortarray[i][0]]){
                    return sortarray[i][1] * (a[sortarray[i][0]] > b[sortarray[i][0]] ? -1 : 1);
                }
            }

            return 0;
        }
    }
    else {
        return function (a, b){
            return 0;
        }
    }
}

function displayStats(req, res, next){
    var api = req.app.set('iapi');
    var locals = {};
    var now = (new Date()).toISOString();
    locals.game = req.game;
    locals.event = req.event;
    locals.is_admin = req.isEventAdmin;
    locals.is_participant = req.isEventParticipant;
    locals.event_is_current = req.event.startdate && req.event.startdate <= now && (!req.event.enddate || req.event.enddate > now);
    locals.is_registerable = req.isEventRegisterable;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug, text: req.event.name},
                        {href: "/game/"+req.game.code+"/event/"+req.event.slug+"/stats", text: "Statistics"}];

    locals.players = [];
    locals.avatars = [];
    locals.relevant_stats = [];
    locals.total_matches = 0;
    locals.show_ties = false;

    locals.event.gametype = _gametypeHelper(locals.event.gametype);

    locals.event.gametype.stats.forEach(function (stat){
        if (stat.valtype == "integer" || stat.valtype == "float" || stat.valtype == "formula"){
            locals.relevant_stats.push(locals.event.gametype.statdefs[stat.name.toLowerCase()]);
        }
    });

    var _sortfunc = _sortFuncGen(req.event.ranking_order || "rating, winpct");

    base.util.inParallel(
        function (callback){
            api.events.event_stats({startkey: [req.event._id, 0], endkey: [req.event._id, 1]}, function (response){
                if (response.rows && response.rows.length){
                    locals.players = response.rows.map(function (row){
                        locals.relevant_stats.forEach(function (stat){
                            if (stat.valtype == "function"){
                                row.value[stat.name.toLowerCase()] = stat.statfunc(row.value);
                            }
                        });

                        row.value.rating = locals.event.gametype.ratingfunc(row.value);
                        row.value.winpct = row.value.wins / (row.value.wins + row.value.losses + row.value.ties);

                        return row.value;
                    });
                }

                locals.players.sort(_sortfunc);

                if (locals.players.length){
                    if (locals.players[0].ties > 0) locals.show_ties = true;

                    var rank = 1;
                    locals.players[0]["0rank"] = rank + 0;
                    for (var i = 1, cti = locals.players.length; i < cti; i++){
                        if (locals.players[i].ties > 0) locals.show_ties = true;

                        if (_sortfunc(locals.players[i], locals.players[i-1]) == 0){
                            locals.players[i]["0rank"] = locals.players[i-1]["0rank"];
                        }
                        else {
                            locals.players[i]["0rank"] = rank + 1;
                        }

                        rank++;
                    }
                }

                callback();
            });
        },
        function (callback){
            api.events.event_match_count({startkey: [req.event._id,0], endkey: [req.event._id, 1]}, function (response){
                if (response.rows && response.rows.length){
                    locals.total_matches = response.rows[0].value;
                }

                callback();
            });
        },
        function (){
            _getPlayerAvatars(req, locals.players.map(function (player){return player.handle.toLowerCase()}), function (avatars){
                locals.avatars = avatars;

                res.render("event/stats", locals);
            });
        }
    );
}

function displayGameStats(req, res, next){
    var api = req.app.set('iapi');
    var locals = {};
    locals.game = req.game;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/game", text: "Games"},
                        {href: "/game/"+req.game.code, text: req.game.name},
                        {href: "/game/"+req.game.code+"/event", text: "Events"},
                        {href: "/game/"+req.game.code+"/event/stats", text: "Statistics"}];

    locals.gametypes = {};
    locals.avatars = [];

    for (var i = 0, cti = locals.game.gametypes.length; i < cti; i++){
        var gtname = locals.game.gametypes[i].name.toLowerCase();
        locals.gametypes[gtname] = (_gametypeHelper(locals.game.gametypes[i]));

        locals.gametypes[gtname].players = [];
        locals.gametypes[gtname].relevant_stats = [];
        locals.gametypes[gtname].total_matches = 0;
        locals.gametypes[gtname].show_ties = false;

        locals.gametypes[gtname].stats.forEach(function (stat){
            if (stat.valtype == "integer" || stat.valtype == "float" || stat.valtype == "formula"){
                locals.gametypes[gtname].relevant_stats.push(locals.gametypes[gtname].statdefs[stat.name.toLowerCase()]);
            }
        });
    }

    var _sortfunc = _sortFuncGen("rating, winpct");

    base.util.inParallel(
        function (callback){
            api.events.gametype_stats({startkey: [req.game._id, 0], endkey: [req.game._id, 1]}, function (response){
                if (response.rows && response.rows.length){
                    response.rows.forEach(function (row){
                        var gtname = row.key[2];
                        if (gtname != "custom"){
                            ((locals.gametypes[gtname] || {}).relevant_stats || []).forEach(function (stat){
                                if (stat.valtype == "function"){
                                    row.value[stat.name.toLowerCase()] = stat.statfunc(row.value);
                                }
                            });

                            row.value.rating = ((locals.gametypes[gtname] || {}).ratingfunc || function (){return NaN;})(row.value);
                            row.value.winpct = row.value.wins / (row.value.wins + row.value.losses + row.value.ties);
                        }

                        ((locals.gametypes[gtname] || {}).players || []).push(row.value);
                    });
                }

                for (var key in locals.gametypes){
                    locals.gametypes[key].players.sort(_sortfunc);

                    if (locals.gametypes[key].players.length){
                        if (locals.gametypes[key].players[0].ties > 0) locals.gametypes[key].show_ties = true;

                        var rank = 1;
                        locals.gametypes[key].players[0]["0rank"] = rank + 0;
                        for (var i = 1, cti = locals.gametypes[key].players.length; i < cti; i++){
                            if (locals.gametypes[key].players[i].ties > 0) locals.gametypes[key].show_ties = true;

                            if (_sortfunc(locals.gametypes[key].players[i], locals.gametypes[key].players[i-1]) == 0){
                                locals.gametypes[key].players[i]["0rank"] = locals.gametypes[key].players[i-1]["0rank"];
                            }
                            else {
                                locals.gametypes[key].players[i]["0rank"] = rank + 1;
                            }

                            rank++;
                        }
                    }
                }

                callback();
            });
        },
        function (callback){
            api.events.gametype_match_count({startkey: [req.game._id, 0], endkey: [req.game._id, 1]}, function (response){
                if (response.rows && response.rows.length){
                    response.rows.forEach(function (row){
                        var gtname = row.key[2].toLowerCase();
                        if (gtname != "custom"){
                            locals.gametypes[gtname].total_matches = row.value;
                        }
                    });
                }

                callback();
            });
        },
        function (){
            var handles = [];

            for (var key in locals.gametypes){
                var gametype = locals.gametypes[key];

                if (gametype.players.length == 0){
                    delete locals.gametypes[key];
                }
                else {
                    handles = handles.concat(gametype.players.map(function (player){return player.handle.toLowerCase()}));
                }
            }

            _getPlayerAvatars(req, handles, function (avatars){
                locals.avatars = avatars;

                res.render("event/gametype_stats", locals);
            });
        }
    );
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

function _getPlayerAvatars(req, handles, callback){
    var api = req.app.set('iapi');
    var sysconf = req.app.set("sys config");

    api.players.avatars({keys: handles}, function (response){
        var result = {};
        if (response.rows && response.rows.length){
            response.rows.forEach(function (row){
                result[row.key] = base.util.gravatar_url(row.value, 20) + "&d=" + encodeURI("https://www.evogames.org" + sysconf.default_avatar);
            });
        }

        callback(result);
    });
}