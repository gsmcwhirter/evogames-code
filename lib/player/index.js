var base = require('../base'),
    us = require('underscore'),
    couchdb = require('../couchdb');

module.exports.urls = function (ssl, _base){
    if (ssl)
    {
        return function (app){
            app.get("/login", loginForm);
            app.get("/register", registerForm);
            app.get("/lostpass", lostpassForm);
            
            app.post("/login", loginProcess);
            app.post("/register", registerProcess);
            app.post("/lostpass", lostpassProcess);
            
            app.get("/confirm_email", confirmEmail);
            app.post("/confirm_email", confirmEmail);
            
            app.get("/logout", logoutProcess);
            app.post("/logout", logoutProcess);           
        };
    }
    else
    {
        return function (app){
            app.get("/login", base.forceSSL);
            app.get("/register", base.forceSSL);
            app.get("/logout", base.forceSSL);
            app.get("/confirm_email", base.forceSSL);
            app.get("/lostpass", base.forceSSL);
        };
    }
    
};

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
        
        var url = config.couchdb_server+"/"+config.couchdb+"/_design/player/_view/emails/"+base.util.encodeOptions({include_docs: true, key: fields.email.toLowerCase()}); 
        var creq = new couchdb.Request("GET", url, function (response){
            if (response.errors || !response.rows.length)
            {
                locals.errors = true;
                req.flash('error', 'E-mail and password combination were not valid.');
                
                loginForm(req, res, next, locals);
            }
            else
            {
                var record = response.rows.shift();
                
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
                    
                    couchdb.getIDs(config.couchdb_server, function (uuids){
                        login_token._id = uuids.shift();
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
                            var url = config.couchdb_server+"/"+config.couchdb+"/"+login_token._id;
                            var creq = new couchdb.Request(function (response){
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
                                    res.redirectMeTo(locals.referrer || "/");
                                }
                            });
                            
                            creq.go("PUT",url,{data: JSON.stringify(login_token), headers: {"Content-type": "application/json"}});    
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
        var url = config.couchdb_server+"/"+config.couchdb+"/"+lcookie;
        var creq = new couchdb.Request("GET", url, function (response){
            if (response.type == "login_token")
            {
                var creq = new couchdb.Request("DELETE", url+"?rev="+response._rev, function (response){
                    if (response.error)
                    {
                        req.flash('error', response.error);
                    }
                    else
                    {
                        req.flash('info', 'You have been successfully logged out.');
                    }
                    
                    res.redirectMeTo(req.headers.referer || req.headers.referrer || "/");
                });
            }
        });
    }
    else
    {
        res.redirectMeTo(req.headers.referer || req.headers.referrer || "/");
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
        var config = req.app.set('sys config');
        var json_schema = require('../json-schema');
        var player_schema = require('./schema').player;
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
                    if (error.property == "question" || error.property == "answer")
                    {
                        var prev = parts.pop();
                        error.property += parseInt(prev.substring(prev.indexOf("[")+1,prev.indexOf("]"))) + 1 + '';
                    }
                    
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
                couchdb.getIDs(config.couchdb_server, function (uuids){
                    player._id = uuids.shift();
                    if (player._id)
                    {
                        var url = config.couchdb_server+"/"+config.couchdb+"/"+player._id;
                        var creq = new couchdb.Request(function(response){
                            if (response.error)
                            {
                                locals.errors = true;
                                req.flash('error', "Unable to save player record: "+response.error);
                                
                                registerForm(req, res, next, locals);
                            }
                            else
                            {
                                var smtp = require('../smtp')();
                                smtp.setConfig(req.app.set('smtp config'));
                                
                                res.render('mail/register.ejs', {layout: false, locals: {
                                        alias: us._.last(player.aliases),
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
                        creq.go("PUT",url,{data: JSON.stringify(player), headers: {"Content-type": "application/json"}});
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
        
        var url = config.couchdb_server+"/"+config.couchdb+"/_design/player/_view/handles/";
        var creq = new couchdb.Request("GET", url, function (response){
            if (response.rows)
            {
                if (us._.map(response.rows, function (item){return item.key[1].toLowerCase();}).indexOf(player.handle.toLowerCase()) != -1)
                {
                    locals.errors = true;
                    locals.messages.handle.push("must be unique.");
                }
            }
            
            var url = config.couchdb_server+"/"+config.couchdb+"/_design/player/_view/emails/";
            var creq = new couchdb.Request("GET", url, function (response){
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
        var config = req.app.set('sys config');
        var url = config.couchdb_server+"/"+config.couchdb+"/_design/player/_view/pending_emails/"+base.util.encodeOptions({include_docs: true, key: [req.param('email'), req.param('token')]});
        var creq = new couchdb.Request(function (response){
            if (!response.rows.length)
            {
                req.flash('error', 'Could not confirm e-mail address.');
                showForm();
            }
            else
            {
                var player = response.rows.shift().doc;
                player.email_history.push({email: req.param('email'), date: (new Date()).toUTCString()});
                delete player.pending_email_change;
                
                var url = config.couchdb_server+"/"+config.couchdb+"/"+player._id+"/?rev="+player._rev;
                var creq = new couchdb.Request(function (response){
                    if (response.error)
                    {
                        req.flash('error', 'Could not confirm e-mail address: '+response.error);
                        showForm();
                    }
                    else
                    {
                        if (player.email_history.length == 1)
                        {
                            var smtp = require('../smtp')();
                            smtp.setConfig(req.app.set('smtp config'));
                            
                            res.render('mail/welcome.ejs', {layout: false, locals: {
                                        alias: us._.last(player.aliases),
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
                creq.go("PUT", url, {data: JSON.stringify(player), headers: {"Content-type": "application/json"}});
            }
        });
        creq.go("GET", url);
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
            var config = req.app.set('sys config');
            var url = config.couchdb_server+"/"+config.couchdb+"/_design/player/_view/emails/"+base.util.encodeOptions({include_docs: true, key: email});
            var creq = new couchdb.Request("GET",url, function (response){
                if (!response.rows.length)
                {
                    req.flash('error', 'The form could not be processed.');
                    lostpassForm(req, res, next);
                }
                else
                {
                    var player = response.rows.shift().doc;
                    
                    if (player.email_history && player.email_history.length)
                    {
                        var newpass = base.util.randomString(12);
                        player.password = base.util.sha1_hex(newpass + player.salt);
                        
                        var url = config.couchdb_server+"/"+config.couchdb+"/"+player._id+"?rev="+player._rev;
                        var creq = new couchdb.Request(function (response){
                            if (response.error)
                            {
                                req.flash('error', 'A new password could not be saved.');
                                lostpassForm(req, res, next);
                            }
                            else
                            {
                                var smtp = require('../smtp')();
                                smtp.setConfig(req.app.set('smtp config'));
                                
                                res.render('mail/lost_password.ejs', {locals: {newpass: newpass}, layout: false}, function(err, email_body){
                                    smtp.send("EvoGames System", player.email_history[player.email_history.length - 1].email, "Password Reset Request", email_body, function (success){
                                        if (success)
                                        {
                                            req.flash('info', 'A new password was sent to your e-mail address.');
                                            lostpassForm(req, res, next);
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
                        creq.go("PUT",url,{data: JSON.stringify(player), headers: {"Content-type": "application/json"}});
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
