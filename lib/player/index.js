var base = require('../base'),
    us = require('underscore'),
    json_schema = require('../json-schema'),
    player_schema = require('./schema').player;

module.exports.urls = function (_base){
    safeRedirect = safeRedirectGen(_base);
    return function (app){
        app.get(_base + "/login", loginForm);
        app.get(_base + "/register", registerForm);
        app.get(_base + "/lostpass", lostpassForm);
        app.get(_base + "/change_pass", changePassForm);
        app.get(_base + "/change_email", changeEmailForm);

        app.post(_base + "/login", loginProcess);
        app.post(_base + "/register", registerProcess);
        app.post(_base + "/lostpass", lostpassProcess);
        app.post(_base + "/change_pass", changePassProcess);
        app.post(_base + "/change_email", changeEmailProcess);

        app.get(_base + "/confirm_email", confirmEmail);
        app.post(_base + "/confirm_email", confirmEmail);

        app.get(_base + "/logout", logoutProcess);
        app.post(_base + "/logout", logoutProcess);

        app.get(_base + "/search", displaySearch);
        app.post(_base + "/search", processSearch);

        app.get(_base + "/profile", displayProfile);
        app.get(_base + "/profile/@:handle", displayProfile);
        app.get(_base + "/profile/:alias@:handle", displayProfile);

        app.get(_base + "/controls", controlPanel);
        app.get(_base + "/avatar", base.page("player/avatar", [{href: "/", text: "Home"},
                                                                {href: "/player/controls", text: "Player Controls"},
                                                                {href: "/player/avatar", text: "Player Avatar"}]));

        app.get(_base + "/datetime", datetimeForm);
        app.post(_base + "/datetime", datetimeProcess);

        app.get(_base + "/groups", groupControls);

        app.get(_base + "/aliases", aliasForm);
        app.get(_base + "/aliases/list", listAlias);
        app.put(_base + "/aliases/add", addAlias);
        app.del(_base + "/aliases/remove/:alias", removeAlias);
        app.put(_base + "/aliases/default", defaultAlias);
    };
};

function controlPanel(req, res, next){
    var api = req.app.set('iapi');

    if (!req.player)
    {
        next(new base.errors.NotLoggedIn());
    }
    else
    {
        var locals = {
            crumbs: [{href: "/", text: "Home"}, {href: "/player/controls", text: "Player Controls"}]
        };
        
        res.render("player/controls", locals);
    }
}

function aliasForm(req, res, next){
    var api = req.app.set('iapi');

    if (!req.player)
    {
        next(new base.errors.NotLoggedIn());
    }
    else
    {
        var locals = {
            crumbs: [{href: "/", text: "Home"}, 
                        {href: "/player/controls", text: "Player Controls"}, 
                        {href: "/player/aliases", text: "Player Aliases"}],
            aliases: req.player.aliases || []
        };
        
        res.render("player/aliases", locals);
    }
}

function listAlias(req, res, next){
    var api = req.app.set('iapi');

    res.writeHead(200, {"Content-type": "application/json"});
    if (!req.player)
    {        
        res.end(JSON.stringify({error: "not logged in"}));
    }
    else
    {
        res.end(JSON.stringify({ok: true, aliases: req.player.aliases}));
    }
}

function addAlias(req, res, next){
    var api = req.app.set('iapi');

    res.writeHead(200, {"Content-type": "application/json"});
    if (!req.player)
    {        
        res.end(JSON.stringify({error: "not logged in"}));
    }
    else if (!req.body || !req.body.alias)
    {
        res.end(JSON.stringify({error: "parse error"}));
    }
    else
    {
        api.getDoc(req.player._id, function (player){
            if (!player || player.type != "player")
            {
                res.end(JSON.stringify({error: "player not found"}));
            }
            else
            {
                if (player.aliases.indexOf(req.body.alias) != -1)
                {
                    res.end(JSON.stringify({message: 'alias exists', ok: true, alias: req.body.alias}));
                }
                else
                {
                    player.aliases.push(req.body.alias);
                    var validation = json_schema.validate(player, player_schema);
                    if (!validation.valid)
                    {   
                        res.end(JSON.stringify({error: "validation error", details: validation.errors}));
                    }
                    else
                    {
                        api.putDoc(player, function (response){
                            if (response.error)
                            {
                                res.end(JSON.stringify({error: "save error", details: response.error}));
                            }
                            else
                            {
                                res.end(JSON.stringify({message: "alias added", ok: true, alias: req.body.alias}));
                            }
                        });
                    }
                }
            }
        });
    }
}

function removeAlias(req, res, next){
    var api = req.app.set('iapi');

    res.writeHead(200, {"Content-type": "application/json"});
    if (!req.player)
    {
        res.end(JSON.stringify({error: "not logged in"}));
    }
    else
    {
        if (!req.params.alias)
        {
            res.end(JSON.stringify({error: "no alias given"}));
        }
        else
        {
            req.params.alias = decodeURI(req.params.alias);
            api.getDoc(req.player._id, function (player){
                if (!player || player.type != "player")
                {
                    res.end(JSON.stringify({error: "player not found"}));
                }
                else if (player.aliases.indexOf(req.params.alias) == -1)
                {
                    res.end(JSON.stringify({message: "alias not found", ok: true}));
                }
                else
                {
                    player.aliases = us._.without(player.aliases, req.params.alias);
                    if (!player.aliases.length)
                    {
                        res.end(JSON.stringify({error: "last alias"}));
                    }
                    else
                    {
                        var validation = json_schema.validate(player, player_schema);
                        if (!validation.valid)
                        {   
                            res.end(JSON.stringify({error: "validation error", details: validation.errors}));
                        }
                        else
                        {
                            api.putDoc(player, function (response){
                                if (response.error)
                                {
                                    res.end(JSON.stringify({error: "save error", details: response.error}));
                                }
                                else
                                {
                                    res.end(JSON.stringify({message: "alias removed", ok: true}));
                                }
                            });
                        }
                    }
                }
            });
        }
    }
}

function defaultAlias(req, res, next){
    var api = req.app.set('iapi');

    res.writeHead(200, {"Content-type": "application/json"});
    if (!req.player)
    {        
        res.end(JSON.stringify({error: "not logged in"}));
    }
    else if (!req.body || !req.body.alias)
    {
        res.end(JSON.stringify({error: "parse error"}));
    }
    else
    {
        api.getDoc(req.player._id, function (player){
            if (!player || player.type != "player")
            {
                res.end(JSON.stringify({error: "player not found"}));
            }
            else
            {
                if (player.aliases.indexOf(req.body.alias) == -1)
                {
                    res.end(JSON.stringify({error: 'alias not found'}));
                }
                else if (player.aliases[0] == req.body.alias)
                {
                    res.end(JSON.stringify({message: 'alias set to default', ok: true}));
                }
                else
                {
                    player.aliases = us._.uniq(us._.without(player.aliases, req.body.alias));
                    player.aliases.unshift(req.body.alias);
                    var validation = json_schema.validate(player, player_schema);
                    if (!validation.valid)
                    {   
                        res.end(JSON.stringify({error: "validation error", details: validation.errors}));
                    }
                    else
                    {
                        api.putDoc(player, function (response){
                            if (response.error)
                            {
                                res.end(JSON.stringify({error: "save error", details: response.error}));
                            }
                            else
                            {
                                res.end(JSON.stringify({message: "alias set to default", ok: true}));
                            }
                        });
                    }
                }
            }
        });
    }
}

function safeRedirectGen(_base){
    return function (to){
        var url = require('url');
        ref_parse = url.parse(to);
        switch (ref_parse.pathname){
            case _base + "/confirm_email":
            case _base + "/logout":
            case _base + "/login":
            case _base + "/register":
            case _base + "/lostpass":
                return "/";
                break;
            default:
                return to;
                break;
        }
    }
}

var safeRedirect = safeRedirectGen("");

function loginForm(req, res, next, locals){
    var api = req.app.set('iapi');

    if (req.player)
    {
        next(new base.errors.LoggedIn());
    }
    else
    {
        locals = locals || {messages: {}, data: {}, referrer: req.headers.referer || req.headers.referrer || "/", errors: false};
        locals.referrer = locals.referrer || "/";
    
        locals.description = "Please fill in the form to the left in order to log in.";
    
        res.render('player/login', locals);
    }
}



function loginProcess(req, res, next){
    var api = req.app.set('iapi');

    var locals = {messages: {}, data: {}, errors: false};
    
    if (req.player)
    {
        next(new base.errors.LoggedIn());
    }
    else if (!req.body)
    {
        locals.errors = true;
        req.flash('error', 'Unable to process form contents.');
        
        loginForm(req, res, next, locals);
    }
    else
    {
        var config = req.app.set('sys config');
        var json_schema = require('../json-schema');
        var login_schema = require('./schema').login_token;
        var fields = req.body || {};
            
        ['email','password','remember_me'].forEach(function (item){
            fields[item] = fields[item] ? fields[item].trim() : "";
            locals.messages[item] = [];
        });
        
        locals.data = fields;
        locals.referrer = fields.referrer || "/";
        
        api.emailList({include_docs: true, key: fields.email.toLowerCase()}, function (response){
            if (response.errors || !response.rows.length)
            {
                locals.errors = true;
                req.flash('error', 'E-mail and password combination were not valid.');
                
                loginForm(req, res, next, locals);
            }
            else
            {
                var record = response.rows.length ? response.rows[0] : null;

                var maxtries = (record &&
                                 record.doc.login_tries &&
                                 parseInt(record.doc.login_tries) >= 5);

                var lodate;
                if (record.doc.login_last_try){
                    lodate = new Date(record.doc.login_last_try);
                }
                else {
                    lodate = new Date();
                }

                var lockedout = (maxtries &&
                                 lodate.getTime() + 3600 >= (new Date()).getTime());
                
                var badpass = record.doc.password != base.util.sha1_hex(fields.password + record.doc.salt);

                if (!record || 
                        !record.doc.email_history ||
                        !record.doc.email_history.length ||
                        lockedout ||
                        badpass)
                {
                    function done(response){
                        if (response && response.errors){
                            req.flash('error', 'There was an unexpected problem.');
                        }

                        loginForm(req, res, next, locals);
                    }

                    locals.errors = true;
                    if (lockedout){
                        req.flash('error', 'That account is currently locked.');
                        done();
                    }
                    else if (badpass){
                        req.flash('error', 'E-mail and password combination were not valid.');

                        if (maxtries){
                            record.doc.login_tries = 0;
                        }
                        
                        record.doc.login_tries = (parseInt(record.doc.login_tries) || 0) + 1;
                        record.doc.login_last_try = (new Date()).toISOString();
                        api.putDoc(record.doc, done);
                    }
                    else {
                        req.flash('error', 'E-mail and password combination were not valid.');
                        done();
                    }
                }
                else
                {
                    //valid login -- try to save it
                    function savetoken(response){
                        if (response && response.errors){
                            req.flash('error','There was an unexpected problem.');
                        }

                        var login_token = {};
                        login_token.type = "login_token";
                        login_token.created_at = (new Date()).toISOString();
                        login_token.player = record.doc._id;

                        api.uuids(function (uuids){
                            login_token._id = uuids[0];
                            login_token.token = login_token._id;

                            var validation = json_schema.validate(login_token, login_schema);
                            if (!validation.valid)
                            {
                                locals.errors = true;
                                req.flash('error', 'Unable to validate login token format.');

                                loginForm(req, res,next, locals);
                            }
                            else
                            {
                                api.putDoc(login_token, function (response){
                                    if (response.error)
                                    {
                                        locals.errors = true;
                                        req.flash('error', 'Unable to save login token: '+response.error);

                                        loginForm(req, res, next, locals);
                                    }
                                    else
                                    {
                                        req.flash('info', 'You have successfully logged in.');
                                        var expires = false;
                                        if (fields.remember_me == "yes")
                                        {
                                            expires = new Date();
                                            expires.setDate(expires.getDate() + 30);
                                        }

                                        var host = req.headers.host.split(":")[0];
                                        var hparts = host.split(".");
                                        if (hparts.length > 2) hparts = hparts.slice(-2);
                                        host = "."+hparts.join(".");
                                        if (host == ".localhost") host = false;

                                        res.cookie(config.login_cookie, login_token.token, {expires: expires, path: "/", host: host, httponly: true, secure: true});
                                        res.redirectMeTo(safeRedirect(locals.referrer || "/"));
                                    }
                                });
                            }

                        });
                    }

                    if (record.doc.login_tries > 0){
                        record.doc.login_tries = 0;
                        record.doc.login_last_try = (new Date()).toISOString();
                        api.putDoc(record.doc, savetoken);
                    }
                    else {
                        savetoken();
                    }
                }
            }
        });        
    }
}

function logoutProcess(req, res, next, locals){
    var api = req.app.set('iapi');
    var config = req.app.set('sys config');
    
    var lcookie = false;
    if (req.cookies && req.cookies[config.login_cookie.toLowerCase()])
    {   
        lcookie = req.cookies[config.login_cookie.toLowerCase()];
        res.clearCookie(config.login_cookie);
    }
    
    if (lcookie)
    {
        api.getDoc(lcookie, function (response){
            if (response.type == "login_token")
            {
                api.delDoc(response, function (response){
                    if (response.error)
                    {
                        req.flash('error', response.error);
                    }
                    else
                    {
                        req.flash('info', 'You have been successfully logged out.');
                    }
                    
                    res.redirectMeTo(safeRedirect(req.headers.referer || req.headers.referrer || "/"));
                });
            }
        });
    }
    else
    {
        res.redirectMeTo(safeRedirect(req.headers.referer || req.headers.referrer || "/"));
    }
}

var register_fields = ['handle','name','email', 'email_confirm', 
        'password', 'password_confirm', 'captcha'];

function registerForm(req, res, next, locals){
    var api = req.app.set('iapi');
    if (req.player)
    {
        next(new base.errors.LoggedIn());
    }
    else
    {   
        locals = locals || {messages: {}, data: {}, errors: false};
        locals.description = "Please fill in the form to the left to register as a new user.";
        locals.description += "All fields are mandatory.";
        
        locals.recaptcha_form = base.generateRecaptcha(req).toHTML();
        locals.required_fields = JSON.stringify(register_fields);
        
        res.render('player/register', locals);
    }
}

function registerProcess(req, res, next)
{
    var api = req.app.set('iapi');
    var locals = {messages: {}, data: {}, errors: false};
    
    if (req.player)
    {
        next(new base.errors.LoggedIn());
    }
    else if (!req.body)
    {
        locals.errors = true;
        req.flash('error', "Unable to process form contents.");
        
        registerForm(req, res, next, locals);
    }
    else
    {
        var fields = req.body || {};
            
        register_fields.forEach(function (item){
            fields[item] = fields[item] ? fields[item].trim() : "";
            locals.messages[item] = [];
        });
        
        locals.data = fields;
        
        var player = {};
        var date = new Date();
        var salt = base.util.randomString(20,true);
        var email_token = base.util.randomString(20, true); 
        
        player.type = "player";
        player.handle = fields.handle;
        player.created_at = date.toISOString();
        player.salt = salt;
        player.password = fields.password;
        player.aliases = [fields.name];
        player.email_history = [];
        player.pending_email_change = {email: fields.email, token: base.util.sha1_hex(email_token + salt)};
        
        if (fields.email != fields.email_confirm)
        {
            locals.errors = true;
            locals.messages.email_confirm.push("must match e-mail.");
        }
        
        if (fields.password != fields.password_confirm)
        {
            locals.errors = true;
            locals.messages.password_confirm.push("must match password.");
        }
        
        var validation = json_schema.validate(player, player_schema);
        if (!validation.valid)
        {
            locals.errors = true;
            
            validation.errors.forEach(function (error){
                var parts = error.property.split(".");
                if (parts.length > 1)
                {
                    error.property = parts.pop();
                }
                locals.messages[error.property] = locals.messages[error.property] || []; 
                locals.messages[error.property].push(error.message);
            });
        }
        
        player.password = base.util.sha1_hex(player.password + player.salt);
        
        function afterRecaptcha(recaptcha){
            if (!recaptcha.verify)
            {
                locals.errors = true;
                locals.messages.captcha.push("could not be verified.");
            }
            
            if (locals.errors)
            {
                req.flash('error', "There were problems with your request.");
                
                registerForm(req, res, next, locals);
            }
            else
            {   
                api.uuids(function (uuids){
                    player._id = uuids[0];
                    if (player._id)
                    {
                        api.putDoc(player, function (response){
                            if (response.error)
                            {
                                locals.errors = true;
                                req.flash('error', "Unable to save player record: "+response.error);
                                
                                registerForm(req, res, next, locals);
                            }
                            else
                            {
                                var mail_data = {
                                    layout: false,
                                    alias: player.aliases[0],
                                    handle: player.handle,
                                    email: player.pending_email_change.email,
                                    token: player.pending_email_change.token
                                };

                                var the_mail = {
                                    //from: "EvoGames System",
                                    to: player.pending_email_change.email,
                                    subject: "EvoGames Registration Confirmation"
                                };


                                base.util.send_email(res, 'mail/register.ejs', mail_data, the_mail, function (success){
                                    if (!success){
                                        req.flash('error', 'Registration confirmation e-mail failed.');
                                    }

                                    req.flash('info', 'Player registration successful.');
                                    locals.description = "You have successfully submitted a player registration.";
                                    locals.reg_player = player;

                                    res.render('player/register_success', locals);
                                });
                            }
                        });
                    }
                    else
                    {
                        locals.errors = true;
                        req.flash('error',"Could not generate a user ID number.");
                        
                        registerForm(req, res, next, locals);
                    }
                });
            }
        }
        
        api.userList(function (response){
            if (response.rows)
            {
                if (us._.map(response.rows, function (item){return item.key[1].toLowerCase();}).indexOf(player.handle.toLowerCase()) != -1)
                {
                    locals.errors = true;
                    locals.messages.handle.push("must be unique.");
                }
            }
            
            api.emailList(function (response){
                if (response.rows)
                {
                    if (us._.map(response.rows, function (item){return item.key.toLowerCase();}).indexOf(fields.email.toLowerCase()) != -1)
                    {
                        locals.errors = true;
                        locals.messages.email.push("must be unique.");
                    }
                }
                
                var host = req.headers.host.split(":")[0];
                if (host != "localhost")
                {
                    base.verifyRecaptcha(req, fields.recaptcha_challenge_field, fields.recaptcha_response_field, afterRecaptcha);
                }
                else
                {
                    afterRecaptcha({verify: true});
                }
            });
        });
    }    
}

function confirmEmail(req, res, next)
{
    var api = req.app.set('iapi');
    var locals = {description: "Please fill out the form to confirm your pending e-mail address change."};
    
    if (req.player)
    {
        locals.crumbs = [{href: "/", text: "Home"}, 
                        {href: "/player/controls", text: "Player Controls"}, 
                        {href: "/player/change_email", text: "Change E-Mail Address"},
                        {href: "/player/confirm_email", text: "Confirmation"}];
    }
    
    if (req.param('email'))
    {
        locals.pending_email = req.param('email');
    }
    else
    {
        locals.pending_email = "";
    }
    
    if (req.param('email') && !req.param('token'))
    {
        req.flash('info','Please enter the confirmation token provided.')
    }

    function showForm()
    {
        res.render('player/confirm_email', locals);
    }
    
    if (req.param('email') && req.param('token'))
    {
        api.pendingEmails({include_docs: true, key: [req.param('email'), req.param('token')]}, function (response){
            if (!response.rows.length)
            {
                req.flash('error', 'Could not confirm e-mail address.');
                showForm();
            }
            else
            {
                var player = response.rows[0].doc;
                player.email_history.push({email: req.param('email'), date: (new Date()).toISOString()});
                player.gravatar_url = base.util.gravatar_url(req.param('email'));
                delete player.pending_email_change;
                
                var validation = json_schema.validate(player, player_schema);
                if (!validation.valid)
                {   
                    validation.errors.forEach(function (error){
                        var parts = error.property.split(".");
                        if (parts.length > 1)
                        {
                            error.property = parts.pop();
                        }
                        req.flash('error',error.property + " " + error.message);
                    });
                    
                    showForm();
                }
                else
                {
                    api.putDoc(player, function (response){
                        if (response.error)
                        {
                            req.flash('error', 'Could not confirm e-mail address: '+response.error);
                            showForm();
                        }
                        else
                        {
                            if (player.email_history.length == 1)
                            {
                                var mail_data = {
                                    layout: false,
                                    alias: player.aliases[0],
                                    handle: player.handle
                                };

                                var the_mail = {
                                    //from: "EvoGames System",
                                    to: us._.last(player.email_history).email,
                                    subject: "Welcome to EvoGames"
                                };

                                base.util.send_email(res, "mail/welcome.ejs", mail_data, the_mail, function (success){
                                    if (!success){
                                        req.flash('error', 'Welcome e-mail failed to be sent.');
                                    }

                                    req.flash('info', 'E-mail address successfully confirmed.');
                                    res.render('player/confirm_register_success', locals);
                                });
                            }
                            else
                            {
                                req.flash('info', 'E-mail address successfully confirmed.');
                                res.render('player/confirm_email_success', locals);
                            }
                        }
                    });
                }
            }
        });
    }
    else
    {
        showForm();
    }
}

function lostpassForm(req, res, next){
    var api = req.app.set('iapi');

    if (req.player)
    {
        next(new base.errors.LoggedIn());
    }
    else
    {
        var locals = {description: "Please fill in the form to have a new password mailed to you."};
        res.render("player/lostpass", locals);
    }
}

function lostpassProcess(req, res, next){
    var api = req.app.set('iapi');
    var locals = {description: "Please fill in the form to have a new password mailed to you."};
    
    if (req.player)
    {
        next(new base.errors.LoggedIn());
    }
    else if (!req.body)
    {
        req.flash('error', 'The form could not be processed.');
        lostpassForm(req, res, next);
    }
    else
    {
        if (!req.body.email)
        {
            req.flash('error', 'The form could not be processed.');
            lostpassForm(req, res, next);
        }
        else
        {
            var email = req.body.email.toLowerCase();
            
            api.emailList({include_docs: true, key: email}, function (response){
                if (!response.rows.length)
                {
                    req.flash('error', 'The requested user was not found.');
                    lostpassForm(req, res, next);
                }
                else
                {
                    var player = response.rows[0].doc;
                    
                    if (player.email_history && player.email_history.length)
                    {
                        var newpass = base.util.randomString(12);
                        player.password = base.util.sha1_hex(newpass + player.salt);
                        
                        api.putDoc(player, function (response){
                            if (response.error)
                            {
                                req.flash('error', 'A new password could not be saved.');
                                lostpassForm(req, res, next);
                            }
                            else
                            {
                                var mail_data = {
                                    newpass: newpass,
                                    layout: false
                                };

                                var the_mail = {
                                    //from: "EvoGames System",
                                    to: player.email_history[player.email_history.length - 1].email,
                                    subject: "Password Reset Request"
                                }

                                base.util.send_email(res, "mail/lost_password.ejs", mail_data, the_mail, function (success){
                                    if (success)
                                    {
                                        req.flash('info', 'A new password was sent to your e-mail address.');
                                        res.redirectMeTo("/player/login");
                                    }
                                    else
                                    {
                                        req.flash('error', 'A new password could not be sent. Please file a bug report.');
                                        lostpassForm(req, res, next, locals);
                                    }
                                });
                            }
                        });
                    }
                    else
                    {
                        req.flash('error', 'The requested player record was incomplete.');
                        lostpassForm(req, res, next, locals);
                    }
                }
            });
        }
    }
}

function changePassForm(req, res, next, locals){
    var api = req.app.set('iapi');
    locals = locals || {};
    locals.description = "Fill out the form to the left to change your current password.";
    locals.crumbs = [{href: "/", text: "Home"}, 
                        {href: "/player/controls", text: "Player Controls"}, 
                        {href: "/player/change_pass", text: "Change Password"}];
    
    if (!req.player)
    {
        next(new base.errors.NotLoggedIn());
    }
    else
    {
        res.render('player/change_pass', locals);
    }
}

function changePassProcess(req, res, next){
    var api = req.app.set('iapi');
    var locals = {};
    
    if (!req.player)
    {
        next(new base.errors.NotLoggedIn());
    }
    else if (!req.body)
    {
        req.flash('error','Unable to process form submission.');
        changePassForm(req, res, next, locals);
    }
    else
    {
        if (!req.body.old_password || !req.body.new_password || !req.body.new_password_confirm)
        {
            req.flash('error','Unable to process form submission.');
            changePassForm(req, res, next, locals);
        }
        else
        {
            api.getDoc(req.player._id, function (player){
                if (!player || player.type != "player")
                {
                    req.flash('error','Unable to locate player record.');
                    changePassForm(req, res, next, locals);
                }
                else
                {
                    var json_schema = require("../json-schema");
                    var player_schema = require("./schema").player;
                    var errors = false;
                    if (player.password != base.util.sha1_hex(req.body.old_password.trim() + player.salt))
                    {
                        req.flash('error','Your current password is incorrect.');
                        errors = true;
                    }
                    
                    if (req.body.new_password.trim() != req.body.new_password_confirm.trim())
                    {
                        req.flash('error','Your new password does not match the confirmation.');
                        errors = true;
                    }
                    
                    player.password = req.body.new_password.trim();
                    var validation = json_schema.validate(player, player_schema);
                    if (!validation.valid)
                    {
                        errors = true;
                        
                        validation.errors.forEach(function (error){
                            var parts = error.property.split(".");
                            if (parts.length > 1)
                            {
                                error.property = parts.pop();
                            }
                            req.flash('error',error.property + " " + error.message);
                        });
                    }
                    
                    if (errors)
                    {
                        changePassForm(req, res, next, locals);
                    }
                    else
                    {
                        player.password = base.util.sha1_hex(player.password + player.salt);
                        api.putDoc(player, function (response){
                            if (response.error)
                            {
                                req.flash('error','Your new password could not be saved.');
                                changePassForm(req, res, next, locals);
                            }
                            else
                            {
                                req.flash('info','Your new password was saved successfully.');
                                changePassForm(req, res, next, locals);
                            }
                        });
                    }
                }
            });
        }
    }
}

function changeEmailForm(req, res, next, locals){
    var api = req.app.set('iapi');
    if (!req.player)
    {
        next(new base.errors.NotLoggedIn());
    }
    else
    {
        locals = locals || {};
        locals.description = "Fill out the form to the left to change your e-mail address.";
        locals.crumbs = [{href: "/", text: "Home"}, 
                            {href: "/player/controls", text: "Player Controls"}, 
                            {href: "/player/change_email", text: "Change E-Mail Address"}];
        if (typeof locals.pending_email_change == "undefined")
            locals.pending_email_change = req.player.pending_email_change || false;
        
        res.render("player/change_email", locals);
    }    
}

function changeEmailProcess(req, res, next){
    var api = req.app.set('iapi');
    var locals = {};
    
    if (!req.player)
    {
        next(new base.errors.NotLoggedIn());
    }
    else if (!req.body)
    {
        req.flash('error','Unable to process form submission.');
        changeEmailForm(req, res, next, locals);
    }
    else
    {
        var fields = req.body;
        if (fields.action == "change")
        {
            if (!fields.email || !fields.email_confirm)
            {
                req.flash('error','Unable to process form submission.');
                changeEmailForm(req, res, next, locals);
            }
            else
            {
                if (fields.email.trim() != fields.email_confirm.trim())
                {
                    req.flash('error','The confirmation for your new e-mail address did not match.');
                    changeEmailForm(req, res, next, locals);
                }
                else
                {
                    api.getDoc(req.player._id, function (player){
                        if (!player || player.type != "player")
                        {
                            req.flash('error','Unable to find player record.');
                            changeEmailForm(req, res, next, locals);
                        }
                        else
                        {
                            if (player.pending_email_change)
                            {
                                req.flash('error','You already have an e-mail change request pending.');
                                changeEmailForm(req, res, next, locals);
                            }
                            else
                            {
                                api.emailList({key: fields.email.trim()}, function (response){
                                    if (response.rows.length)
                                    {
                                        req.flash('error','The e-mail address you requested is already in use.');
                                        changeEmailForm(req, res, next, locals);
                                    }
                                    else
                                    {
                                        var token = base.util.sha1_hex(base.util.randomString());
                                        player.pending_email_change = {email: fields.email.trim(), token: token};
                                        
                                        var validation = json_schema.validate(player, player_schema);
                                        if (!validation.valid)
                                        {   
                                            validation.errors.forEach(function (error){
                                                var parts = error.property.split(".");
                                                if (parts.length > 1)
                                                {
                                                    error.property = parts.pop();
                                                }
                                                req.flash('error',error.property + " " + error.message);
                                            });
                                            
                                            changeEmailForm(req, res, next, locals);
                                        }
                                        else
                                        {
                                            api.putDoc(player, function(response){
                                                if (response.error)
                                                {
                                                    req.flash('error','Your e-mail change request could not be saved.');
                                                    changeEmailForm(req, res, next, locals);
                                                }
                                                else
                                                {
                                                    var mail_data = {
                                                        layout: false,
                                                        handle: player.handle,
                                                        email: player.pending_email_change.email,
                                                        token: player.pending_email_change.token
                                                    };

                                                    var the_mail = {
                                                        //from: "EvoGames System",
                                                        to: player.pending_email_change.email,
                                                        subject: "EvoGames E-Mail Confirmation"
                                                    };

                                                    base.util.send_email(res, "mail/change_email.ejs", mail_data, the_mail, function (success){
                                                        if (!success){
                                                            req.flash('error', 'Confirmation e-mail failed to be sent.');
                                                        }
                                                        req.flash('info','Your e-mail change request was saved successfully.');
                                                        locals.pending_email_change = player.pending_email_change;
                                                        changeEmailForm(req, res, next, locals);
                                                    });
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
            }
        }
        else if (fields.action == "cancel")
        {
            api.getDoc(req.player._id, function (player){
                if (!player || player.type != "player")
                {
                    req.flash('error','Unable to find player record.');
                    changeEmailForm(req, res, next, locals);
                }
                else
                {
                    if (player.pending_email_change)
                    {
                        delete player.pending_email_change;
                        var validation = json_schema.validate(player, player_schema);
                        if (!validation.valid)
                        {   
                            validation.errors.forEach(function (error){
                                var parts = error.property.split(".");
                                if (parts.length > 1)
                                {
                                    error.property = parts.pop();
                                }
                                req.flash('error',error.property + " " + error.message);
                            });
                            
                            changeEmailForm(req, res, next, locals);
                        }
                        else
                        {
                            api.putDoc(player, function (response){
                                if (response.error)
                                {
                                    req.flash('error','Your e-mail change request could not be removed.');
                                    changeEmailForm(req, res, next, locals);
                                }
                                else
                                {
                                    req.flash('info','Your e-mail change request was removed successfully.');
                                    locals.pending_email_change = false;
                                    changeEmailForm(req, res, next, locals);
                                }
                            });
                        }
                    }
                    else
                    {
                        req.flash('info','No pending e-mail change was present.');
                        changeEmailForm(req, res, next, locals);
                    }
                }
            });
        }
        else
        {
            req.flash('error','Unable to process form submission.');
            changeEmailForm(req, res, next, locals);
        } 
    }
}

function datetimeForm(req, res, next, locals){
    var api = req.app.set('iapi');
    if (!req.player)
    {
        next(new base.errors.NotLoggedIn());
    }
    else
    {
        locals = locals || {};
        locals.data = locals.data || {timezone: req.player.timezone, date_format: req.player.date_format, time_format: req.player.time_format, datetime_format: req.player.datetime_format};
        locals.timezones = locals.timezones || base.util.timezones();
        locals.date_formats = locals.date_formats || player_schema.properties.date_format["enum"];
        locals.time_formats = locals.time_formats || player_schema.properties.time_format["enum"];
        locals.datetime_formats = locals.datetime_formats || player_schema.properties.datetime_format["enum"];
        locals.crumbs = [{href: "/", text: "Home"}, 
                            {href: "/player/controls", text: "Player Controls"}, 
                            {href: "/player/datetime", text: "Date and Time Preferences"}];
        
        res.render('player/datetime', locals);
    }
}

function datetimeProcess(req, res, next){
    var api = req.app.set('iapi');
    var locals = {};
    if (!req.player)
    {
        next(new base.errors.NotLoggedIn());
    }
    else if (!req.body)
    {
        req.flash('error', 'Unable to process form submission.');
        datetimeForm(req, res, next, locals);
    }
    else
    {
        locals.data = {};
        var fields = req.body;
        ["timezone","date_format","time_format","datetime_format"].forEach(function (field){
            fields[field] = (fields[field] || "").trim();
            locals.data[field] = fields[field];
        });
        api.getDoc(req.player._id, function (player){
            if (player && player.type == "player")
            {
                player.timezone = fields["timezone"];
                player.date_format = fields["date_format"];
                player.time_format = fields["time_format"];
                player.datetime_format = fields["datetime_format"];
                
                var validation = json_schema.validate(player, player_schema);
                if (!validation.valid)
                {
                    req.flash('error','There were problems with your request.');
                    validation.errors.forEach(function (error){
                        req.flash('error',error.property+" "+error.message);
                    });
                    
                    datetimeForm(req, res, next, locals);
                }
                else
                {
                    api.putDoc(player, function (response){
                        if (response.error)
                        {
                            req.flash('error', 'Unable to save preferences: '+response.error);
                            datetimeForm(req, res, next, locals);
                        }
                        else
                        {
                            req.flash('info', 'Date and time preferences saved successfully.');
                            datetimeForm(req, res, next, locals);
                        }
                    });
                }
            }
            else
            {
                req.flash('error', 'Unable to find player record');
                datetimeForm(req, res, next);
            }
        });
    }
}

function groupControls(req, res, next){
    var api = req.app.set('iapi');
    if (!req.player)
    {
        next(new base.errors.NotLoggedIn());
    }
    else
    {
        locals = {
            owned_groups: [],
            member_groups: [],
            crumbs: [{href: "/", text: "Home"},
                        {href: "/player/controls", text: "Player Controls"},
                        {href: "/player/groups", text: "Manage Groups"}]            
        };
        
        var todo = 1;
        var done = 0;
        
        function whenDone(){
            if (done >= todo)
            {
                res.render('player/groups', locals);
            }
        }
        
        api.groupOwners({key: req.player._id, include_docs: true}, function (response){
            if (response.rows)
            {
                locals.owned_groups = us._(response.rows).pluck('doc');
            }
            
            done += 1;
            whenDone();
        });
    }
}

function displayProfile(req, res, next){
    var api = req.app.set('iapi');
    var alias;
    var handle;
    var redir_on_404;
    if (!req.params.handle && !req.player){
        res.redirectMeTo("/player/search");
    }
    else{
        if(req.params.handle){
            handle = decodeURI(req.params.handle);

            if(req.params.alias){
                alias = decodeURI(req.params.alias);
            }
            else {
                alias = false;
            }

            redir_on_404 = false;
        }
        else {
            handle = req.player.handle;
            redir_on_404 = true;
        }

        api.userList({include_docs: true, startkey: [handle.toLowerCase()], endkey: [handle.toLowerCase(), handle.toUpperCase()]}, function (response){
            if (!response.errors && response.rows.length){
                var player = response.rows[0];

                if (!alias){
                    alias = player.doc.aliases[0];
                    res.redirectMeTo("/player/profile/"+alias+"@"+handle);
                }
                else {
                    var crumbs = [{href: "/", text: "Home"},
                                    {href: "/player", text: "Players"},
                                    {href: "/player/profile", text: "Profiles"}];
                    if (!redir_on_404){
                        crumbs.push({href: "/player/profile/"+encodeURI(handle), text: handle});
                    }

                    res.render("player/profile", {player: player.doc, crumbs: crumbs});
                }
            }
            else if (redir_on_404) {
                res.redirectMeTo("/player/search");
            }
            else {
                next(new base.errors.NotFound());
            }
        });
    }
}

function displaySearch(req, res, next){
    var api = req.app.set('iapi');
    next(new base.errors.NotFound());
}

function processSearch(req, res, next){
    var api = req.app.set('iapi');
    next(new base.errors.NotFound());
}