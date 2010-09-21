var base = require('../base'),
    us = require('underscore'),
    api = require('../api/internal'),
    SMTP = require('../smtp'),
    json_schema = require('../json-schema'),
    player_schema = require('./schema').player;
var sys = require('sys');

module.exports.urls = function (ssl, _base){
    if (ssl)
    {
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
        };
    }
    else
    {
        return function (app){
            app.get(_base + "/login", base.forceSSL);
            app.get(_base + "/register", base.forceSSL);
            app.get(_base + "/logout", base.forceSSL);
            app.get(_base + "/confirm_email", base.forceSSL);
            app.get(_base + "/lostpass", base.forceSSL);
            app.get(_base + "/change_pass", base.forceSSL);
            app.get(_base + "/change_email", base.forceSSL);
            
            app.get(_base + "/controls", controlPanel);
            app.get(_base + "/avatar", base.page("player/avatar"));
            
            app.get(_base + "/datetime", datetimeForm);
            app.post(_base + "/datetime", datetimeProcess);
            
            app.get(_base + "/aliases", aliasForm);
            app.get(_base + "/aliases/list", listAlias);
            app.put(_base + "/aliases/add", addAlias);
            app.del(_base + "/aliases/remove/:alias", removeAlias);
            app.put(_base + "/aliases/default", defaultAlias);
        };
    }
    
};

function controlPanel(req, res, next){
    if (!req.player)
    {
        res.render('errors/not_logged_in', {locals: {redirect: {href: '/player/login'}, description: "<p>An error has occurred...</p>"}});
    }
    else
    {
        res.render("player/controls");
    }
}

function aliasForm(req, res, next){
    if (!req.player)
    {
        res.render('errors/not_logged_in', {locals: {redirect: {href: '/player/login'}, description: "<p>An error has occurred...</p>"}});
    }
    else
    {
        res.render("player/aliases", {locals: {aliases: req.player.aliases || []}});
    }
}

function listAlias(req, res, next){
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
    if (req.player)
    {
        res.render('errors/logged_in', {locals: {redirect: {href: '/'}, description: "<p>An error has occurred...</p>"}});
    }
    else
    {
        locals = locals || {messages: {}, data: {}, referrer: req.headers.referer || req.headers.referrer || "/", errors: false};
        locals.referrer = locals.referrer || "/";
    
        locals.description = "<p>Please fill in the form to the left in order to log in.</p>";
    
        res.render('player/login', {locals: locals});
    }
}



function loginProcess(req, res, next){
    var locals = {messages: {}, data: {}, errors: false};
    
    if (req.player)
    {
        loginForm(req, res, next);
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
                
                if (!record || 
                        !record.doc.email_history ||
                        !record.doc.email_history.length ||
                        record.doc.password != base.util.sha1_hex(fields.password + record.doc.salt))
                {
                    locals.errors = true;
                    req.flash('error', 'E-mail and password combination were not valid.');
                    
                    loginForm(req, res, next, locals);
                }
                else
                {
                    //valid login -- try to save it
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
                                        var date = new Date();
                                        date.setDate(date.getDate() + 30);
                                        expires = date.toUTCString();
                                    }
                                    
                                    var host = req.headers.host.split(":")[0];
                                    var hparts = host.split(".");
                                    if (hparts.length > 2) hparts = hparts.slice(-2);
                                    host = "."+hparts.join(".");
                                    if (host == ".localhost") host = false;
                                    
                                    res.setCookie(config.login_cookie, login_token.token, expires, "/", host);
                                    res.redirectMeTo(safeRedirect(locals.referrer || "/"));
                                }
                            });    
                        }
                        
                    });
                }
            }
        });        
    }
}

function logoutProcess(req, res, next, locals){
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
        'password', 'password_confirm', 'agreement', 'captcha'];

function registerForm(req, res, next, locals){   
    if (req.player)
    {
        res.render('errors/logged_in', {locals: {redirect: {href: '/'}, description: "<p>An error has occurred...</p>"}});
    }
    else
    {
        var config = req.app.set('sys config');
        var host = req.headers.host.split(":")[0];
        if (host == "localhost") host = "evogames.org";
        if (host.substring(0,4) == "www.") host = host.substring(4, host.length);
        
        var locals = locals || {messages: {}, data: {}, errors: false};
        locals.description = "<p>Please fill in the form to the left to register as a new user.</p>";
        locals.description += "<p>All fields are mandatory.</p>";
        
        locals.public_key = config.recaptcha_keys[host] ? config.recaptcha_keys[host]["public"] : '';
        locals.required_fields = JSON.stringify(register_fields);
        
        res.render('player/register', {locals: locals});
    }
}

function registerProcess(req, res, next)
{
    var locals = {messages: {}, data: {}, errors: false};
    
    if (req.player)
    {
        registerForm(req, res, next);
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
        
        if (fields.agreement != "yes")
        {
            locals.errors = true;
            locals.messages.agreement.push("must be agreed to.");
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
                                var smtp = SMTP();
                                smtp.setConfig(req.app.set('smtp config'));
                                
                                res.render('mail/register.ejs', {layout: false, locals: {
                                        alias: player.aliases[0],
                                        handle: player.handle,
                                        email: player.pending_email_change.email,
                                        token: player.pending_email_change.token
                                        }}, function (err, email_body){
                                    smtp.send("EvoGames System", player.pending_email_change.email, "EvoGames Registration Confirmation", email_body, function (success){
                                        req.flash('info', 'Player registration successful.');
                                        locals.description = "<p>You have successfully submitted a player registration.</p>";
                                        locals.reg_player = player;
                                        
                                        res.render('player/register_success', {locals: locals});
                                    });
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
        };
        
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
    var locals = {description: "<p>Please fill out the form to confirm your pending e-mail address change.</p>"};

    function showForm()
    {
        res.render('player/confirm_email', {locals: locals});
    }
    
    if (req.param('email') && req.param('token'))
    {
        //var config = req.app.set('sys config');
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
                                var smtp = SMTP();
                                smtp.setConfig(req.app.set('smtp config'));
                                
                                res.render('mail/welcome.ejs', {layout: false, locals: {
                                            alias: player.aliases[0],
                                            handle: player.handle
                                            }}, function (err, email_body){
                                    smtp.send("EvoGames System", us._.last(player.email_history).email, "Welcome to EvoGames", email_body, function (success){
                                        req.flash('info', 'E-mail address successfully confirmed.');
                                        res.render('player/confirm_register_success', {locals: locals});
                                    });
                                });
                            }
                            else
                            {
                                req.flash('info', 'E-mail address successfully confirmed.');
                                res.render('player/confirm_email_success', {locals: locals});
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
    if (req.player)
    {
        res.render('errors/logged_in', {locals: {redirect: {href: '/'}, description: "<p>An error has occurred...</p>"}});
    }
    else
    {
        var locals = {description: "<p>Please fill in the form to have a new password mailed to you.</p>"};
        res.render("player/lostpass", {locals: locals});
    }
}

function lostpassProcess(req, res, next){
    var locals = {description: "<p>Please fill in the form to have a new password mailed to you.</p>"};
    
    if (req.player)
    {
        lostpassForm(req, res, next);
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
            //var config = req.app.set('sys config');
            
            api.emailList({include_docs: true, key: email}, function (response){
                if (!response.rows.length)
                {
                    req.flash('error', 'The form could not be processed.');
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
                                var smtp = SMTP();
                                smtp.setConfig(req.app.set('smtp config'));
                                
                                res.render('mail/lost_password.ejs', {locals: {newpass: newpass}, layout: false}, function(err, email_body){
                                    smtp.send("EvoGames System", player.email_history[player.email_history.length - 1].email, "Password Reset Request", email_body, function (success){
                                        if (success)
                                        {
                                            req.flash('info', 'A new password was sent to your e-mail address.');
                                            res.redirectMeTo("/player/login");
                                        }
                                        else
                                        {
                                            req.flash('error', 'A new password could not be sent. Please file a bug report.');
                                            lostpassForm(req, res, next);
                                        }
                                    }); 
                                });
                            }
                        });
                    }
                    else
                    {
                        req.flash('error', 'The form could not be processed.');
                        lostpassForm(req, res, next);
                    }
                }
            });
        }
    }
}

function changePassForm(req, res, next, locals){
    locals = locals || {};
    locals.description = "<p>Fill out the form to the left to change your current password.</p>";
    
    if (!req.player)
    {
        res.render('errors/not_logged_in', {locals: {redirect: {href: '/player/login'}, description: "<p>An error has occurred...</p>"}});
    }
    else
    {
        res.render('player/change_pass', {locals: locals});
    }
}

function changePassProcess(req, res, next){
    var locals = {};
    
    if (!req.player)
    {
        res.render('errors/not_logged_in', {locals: {redirect: {href: '/player/login'}, description: "<p>An error has occurred...</p>"}});
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
    if (!req.player)
    {
        res.render('errors/not_logged_in', {locals: {redirect: {href: '/player/login'}, description: "<p>An error has occurred...</p>"}});
    }
    else
    {
        locals = locals || {};
        locals.description = "<p>Fill out the form to the left to change your e-mail address.</p>"
        if (typeof locals.pending_email_change == "undefined")
            locals.pending_email_change = req.player.pending_email_change || false;
        
        res.render("player/change_email", {locals: locals});
    }    
}

function changeEmailProcess(req, res, next){
    var locals = {};
    
    if (!req.player)
    {
        res.render('errors/not_logged_in', {locals: {redirect: {href: '/player/login'}, description: "<p>An error has occurred...</p>"}});
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
            if (!fields.new_email || !fields.new_email_confirm)
            {
                req.flash('error','Unable to process form submission.');
                changeEmailForm(req, res, next, locals);
            }
            else
            {
                if (fields.new_email.trim() != fields.new_email_confirm.trim())
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
                                api.emailList({key: fields.new_email.trim()}, function (response){
                                    if (response.rows.length)
                                    {
                                        req.flash('error','The e-mail address you requested is already in use.');
                                        changeEmailForm(req, res, next, locals);
                                    }
                                    else
                                    {
                                        var token = base.util.sha1_hex(base.util.randomString());
                                        player.pending_email_change = {email: fields.new_email.trim(), token: token};
                                        
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
                                                    var smtp = SMTP();
                                                    smtp.setConfig(req.app.set('smtp config'));
                                                    
                                                    res.render('mail/change_email.ejs', {layout: false, locals: {
                                                            handle: player.handle,
                                                            email: player.pending_email_change.email,
                                                            token: player.pending_email_change.token
                                                            }}, function (err, email_body){
                                                        smtp.send("EvoGames System", player.pending_email_change.email, "EvoGames E-Mail Confirmation", email_body, function (success){
                                                            req.flash('info','Your e-mail change request was saved successfully.');
                                                            locals.pending_email_change = player.pending_email_change;
                                                            changeEmailForm(req, res, next, locals);
                                                        });
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

}

function datetimeProcess(req, res, next){

}
