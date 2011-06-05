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

app.get(_base+"/:slug/register", base.auth.loginCheck, mw.forceRegisterable, registerForm);
app.post(_base+"/:slug/register", base.auth.loginCheck, mw.forceRegisterable, registerProcess);

app.get(_base+"/:slug/stats", mw.checkParticipant, displayStats);
app.get(_base+"/:slug/matches", mw.checkParticipant, displayMatchList);

app.get(_base+"/:slug/matches/submit", base.auth.loginCheck, mw.forceParticipant, submitMatchForm);
app.post(_base+"/:slug/matches/submit", base.auth.loginCheck, mw.forceParticipant, submitMatchProcess);

app.get(_base+"/:slug/matches/:matchid", mw.checkDisputable, displayMatch);
app.del(_base+"/:slug/matches/:matchid/dispute", base.auth.loginCheckAjax, mw.forceDisputableAjax, disputeMatch);

app.get(_base+"/:slug/controls", base.auth.loginCheck, mw.forceEventAdmin, mw.checkEventCreator, eventControls);
app.get(_base+"/:slug/controls/edit", base.auth.loginCheck, mw.forceEventAdmin, editForm);
app.post(_base+"/:slug/controls/edit", base.auth.loginCheck, mw.forceEventAdmin, editProcess);

app.del(_base+"/:slug/controls/delete", base.auth.loginCheckAjax, mw.forceEventCreatorAjax, deleteEvent);

app.get(_base+"/:slug/controls/invites", base.auth.loginCheck, mw.forceEventAdmin, inviteForm);
app.put(_base+"/:slug/controls/invites/add", base.auth.loginCheckAjax, mw.forceEventAdminAjax, addInvite);
app.del(_base+"/:slug/controls/invites/withdraw/:invite", base.auth.loginCheckAjax, mw.forceEventAdminAjax, withdrawInvite);

app.get(_base+"/:slug/controls/requests", base.auth.loginCheck, mw.forceEventAdmin, requestForm);
app.del(_base+"/:slug/controls/requests/approve/:request", base.auth.loginCheckAjax, mw.forceEventAdminAjax, approveRequest);
app.del(_base+"/:slug/controls/requests/deny/:request", base.auth.loginCheckAjax, mw.forceEventAdminAjax, denyRequest);

app.get(_base+"/:slug/controls/registrations", base.auth.loginCheck, mw.forceEventAdmin, requestForm);
app.del(_base+"/:slug/controls/registrations/remove/:registration", base.auth.loginCheckAjax, mw.forceEventAdminAjax, denyRequest);

app.get(_base+"/:slug/controls/admins", base.auth.loginCheck, mw.forceEventCreator, adminForm);
app.put(_base+"/:slug/controls/admins/add", base.auth.loginCheckAjax, mw.forceEventCreatorAjax, addAdmin);
app.del(_base+"/:slug/controls/admins/remove/:admin", base.auth.loginCheckAjax, mw.forceEventCreatorAjax, removeAdmin);

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