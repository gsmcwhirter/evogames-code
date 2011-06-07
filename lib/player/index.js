var base = require('../base'),
    parsers = require("./parsers"),
    json_schema = require('../json-schema'),
    player_schema = require('./schema').player;

var app = module.exports = base.createServer();

app.get("/register", base.auth.logoutCheck, registerForm);
app.get("/lostpass", base.auth.logoutCheck, lostpassForm);

app.post("/register", base.auth.logoutCheck, registerProcess);
app.post("/lostpass", base.auth.logoutCheck, lostpassProcess);

app.get("/confirm_email", confirmEmail);
app.post("/confirm_email", confirmEmail);

app.get("/search", displaySearch);

app.get("/", displayProfile);
app.get("/@:handle", displayProfile);
app.get("/:alias@:handle", displayProfile);

app.get("/controls", base.auth.loginCheck, base.page('player/controls', [{href: "/", text: "Home"}, {href: "/player", text: "Players"}, {href: "/player/controls", text: "Controls"}]));
app.get("/controls/avatar", base.auth.loginCheck, base.page("player/avatar", [{href: "/", text: "Home"},
                                                        {href: "/player", text: "Players"},
                                                        {href: "/player/controls", text: "Controls"},
                                                        {href: "/player/avatar", text: "Player Avatar"}]));

app.get("/controls/datetime", base.auth.loginCheck, datetimeForm);
app.post("/controls/datetime", base.auth.loginCheck, datetimeProcess);

app.get("/controls/change_pass", base.auth.loginCheck, changePassForm);
app.post("/controls/change_pass", base.auth.loginCheck, changePassProcess);

app.get("/controls/change_email", base.auth.loginCheck, changeEmailForm);
app.post("/controls/change_email", base.auth.loginCheck, changeEmailProcess);

app.get("/controls/memberships", base.auth.loginCheck, membershipControls)
app.get("/controls/groups", base.auth.loginCheck, groupControls);
app.get("/controls/events", base.auth.loginCheck, eventControls);
app.get("/controls/einvites", base.auth.loginCheck, eInviteControls);
app.get("/controls/eregistrations", base.auth.loginCheck, eRegistrationControls);

app.get("/controls/aliases", base.auth.loginCheck, aliasForm);
app.get("/controls/aliases/list", base.auth.loginCheckAjax, listAlias);
app.put("/controls/aliases/add", base.auth.loginCheckAjax, addAlias);
app.del("/controls/aliases/remove/:alias", base.auth.loginCheckAjax, removeAlias);
app.put("/controls/aliases/default", base.auth.loginCheckAjax, defaultAlias);

app.param('handle', parsers.handleParser);


//Routes
function aliasForm(req, res, next){
    var locals = {
        crumbs: [{href: "/", text: "Home"},
                    {href: "/player", text: "Players"},
                    {href: "/player/controls", text: "Controls"},
                    {href: "/player/controls/aliases", text: "Player Aliases"}],
        aliases: req.player.aliases || []
    };

    res.render("player/aliases", locals);
}

function listAlias(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
    res.end(JSON.stringify({ok: true, aliases: req.player.aliases}));
}

function addAlias(req, res, next){
    var api = req.app.set('iapi');

    res.writeHead(200, {"Content-type": "application/json"});
    if (!req.body || !req.body.alias)
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
                player.aliases = player.aliases.filter(function (alias){return alias.toLowerCase() != req.params.alias.toLowerCase()});
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

function defaultAlias(req, res, next){
    var api = req.app.set('iapi');

    res.writeHead(200, {"Content-type": "application/json"});
    if (!req.body || !req.body.alias)
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
                    player.aliases = player.aliases.filter(function (alias){return alias.toLowerCase() != req.body.alias.toLowerCase()});
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

function registerForm(req, res, next, locals){
    locals = locals || {messages: {}, data: {}, errors: false};
    locals.description = "Please fill in the form to the left to register as a new user.";
    locals.description += "All fields are mandatory.";

    locals.recaptcha_form = base.generateRecaptcha(req).toHTML();

    locals.crumbs = [{href: "/", text: "Home"},
                    {href: "/player", text: "Players"},
                    {href: "/player/register", text: "Register"}];

    res.render('player/register', locals);
}

function registerProcess(req, res, next)
{
    var api = req.app.set('iapi');
    var locals = {messages: {}, data: {}, errors: false};
    
    if (!req.body)
    {
        locals.errors = true;
        req.flash('error', "Unable to process form contents.");
        
        registerForm(req, res, next, locals);
    }
    else
    {
        var fields = req.body || {};
            
        ['handle','name','email','email_confirm','password','password_confirm','captcha'].forEach(function (item){
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
                player._id = "player-"+base.util.slugify(player.handle);
                
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
                            locals.crumbs = [{href: "/", text: "Home"},
                                                {href: "/player", text: "Players"},
                                                {href: "/player/register", text: "Register"}];
                            locals.reg_player = player;

                            res.render('player/register_success', locals);
                        });
                    }
                });
                    
            }
        }
        
        api.players.handles(function (response){
            if (response.rows)
            {
                if (response.rows.map(function (item){return item.key}).indexOf(player.handle.toLowerCase()) != -1)
                {
                    locals.errors = true;
                    locals.messages.handle.push("must be unique.");
                }
            }
            
            api.players.emails(function (response){
                if (response.rows)
                {
                    if (response.rows.map(function (item){return item.key.toLowerCase();}).indexOf(fields.email.toLowerCase()) != -1)
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
                        {href: "/player", text: "Players"},
                        {href: "/player/controls", text: "Controls"}, 
                        {href: "/player/controls/change_email", text: "Change E-Mail Address"},
                        {href: "/player/confirm_email", text: "Confirmation"}];
    }
    else {
        locals.crumbs = [{href: "/", text: "Home"},
                    {href: "/player/confirm_email", text: "Confirm Registration"}];
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
        api.players.pendingEmails({include_docs: true, key: [req.param('email'), req.param('token')]}, function (response){
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
                                var mail_data = {
                                    layout: false,
                                    alias: player.aliases[0],
                                    handle: player.handle
                                };

                                var the_mail = {
                                    //from: "EvoGames System",
                                    to: player.email_history[player.email_history.length - 1].email,
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

function lostpassForm(req, res, next, locals){
    locals.description = locals.description || "Please fill in the form to have a new password mailed to you.";
    locals.crumbs = [{href: "/", text: "Home"},
                    {href: "/player", text: "Players"},
                    {href: "/player/lostpass", text: "Lost Password"}];
    res.render("player/lostpass", locals);
}

function lostpassProcess(req, res, next){
    var api = req.app.set('iapi');
    var locals = {description: "Please fill in the form to have a new password mailed to you."};
    
    if (!req.body)
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
            
            api.players.emails({include_docs: true, key: email.toLowerCase()}, function (response){
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
                                        res.redirect("back");
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
                        {href: "/player", text: "Players"},
                        {href: "/player/controls", text: "Controls"}, 
                        {href: "/player/controls/change_pass", text: "Change Password"}];
    
   
    res.render('player/change_pass', locals);
}

function changePassProcess(req, res, next){
    var api = req.app.set('iapi');
    var locals = {};
    
    if (!req.body)
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
    locals = locals || {};
    locals.description = "Fill out the form to the left to change your e-mail address.";
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/player", text: "Players"},
                        {href: "/player/controls", text: "Controls"},
                        {href: "/player/controls/change_email", text: "Change E-Mail Address"}];
    if (typeof locals.pending_email_change == "undefined")
        locals.pending_email_change = req.player.pending_email_change || false;

    res.render("player/change_email", locals);
}

function changeEmailProcess(req, res, next){
    var api = req.app.set('iapi');
    var locals = {};
    
    if (!req.body)
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
                                api.players.emails({key: fields.email.trim().toLowerCase()}, function (response){
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
    locals = locals || {};
    locals.data = locals.data || {timezone: req.player.timezone, date_format: req.player.date_format, time_format: req.player.time_format, datetime_format: req.player.datetime_format};
    locals.timezones = locals.timezones || base.util.timezones();
    locals.date_formats = locals.date_formats || player_schema.properties.date_format["enum"];
    locals.time_formats = locals.time_formats || player_schema.properties.time_format["enum"];
    locals.datetime_formats = locals.datetime_formats || player_schema.properties.datetime_format["enum"];
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/player", text: "Players"},
                        {href: "/player/controls", text: "Controls"},
                        {href: "/player/controls/datetime", text: "Date and Time Preferences"}];

    res.render('player/datetime', locals);
}

function datetimeProcess(req, res, next){
    var api = req.app.set('iapi');
    var locals = {};

    if (!req.body)
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

function membershipControls(req, res, next){
    var api = req.app.set('iapi');

    var locals = {
        member_group_keys: [],
        member_group_key_aliases: {},
        member_groups: {},
        invited_groups: [],
        crumbs: [{href: "/", text: "Home"},
                    {href: "/player", text: "Players"},
                    {href: "/player/controls", text: "Controls"},
                    {href: "/player/controls/memberships", text: "Memberships"}]
    };

    base.util.inParallel(
        function (callback){
            api.groups.memberships({startkey: [req.player._id], endkey: [req.player._id, 1], include_docs: true}, function (response){
                req.player.aliases.sort(function (a, b){return a.toLowerCase() < b.toLowerCase() ? -1 : 1;}).forEach(function (alias){
                    if (locals.member_group_keys.indexOf(alias.toLowerCase()) == -1){
                        locals.member_group_keys.push(alias.toLowerCase());
                        locals.member_groups[alias.toLowerCase()] = [];
                        locals.member_group_key_aliases[alias.toLowerCase()] = alias;
                    }
                });

                if (response.rows && response.rows.length){
                    response.rows.forEach(function (row){
                        if (locals.member_group_keys.indexOf(row.value.alias.toLowerCase()) == -1){
                            locals.member_group_keys.push(row.value.alias.toLowerCase());
                            locals.member_groups[row.value.alias.toLowerCase()] = [];
                            locals.member_group_key_aliases[row.value.alias.toLowerCase()] = row.value.alias;
                        }

                        locals.member_groups[row.value.alias.toLowerCase()].push(row);
                    });
                }

                callback();
            });
        },
        function (callback){
            api.groups.invitations({startkey: [req.player._id], endkey: [req.player._id, 1], include_docs: true}, function (response){
                if (response.rows && response.rows.length){
                    response.rows.forEach(function (row){
                        locals.invited_groups.push(row);
                    });
                }

                callback();
            });
        },
        function (){
            res.render('player/memberships', locals);
        }
    );
}

function displayProfile(req, res, next){
    var api = req.app.set('iapi');
    var alias;
    var hplayer;

    if (typeof(req.hplayer) == "undefined" && !req.player){
        res.redirect('search');
    }
    else {
        if (typeof(req.hplayer) == "undefined"){
            hplayer = req.player;
        }
        else {
            hplayer = req.hplayer;
        }

        if (hplayer){
            var handle = hplayer.handle;

            if (req.params.alias || !req.hplayer){
                alias = req.hplayer ? decodeURI(req.params.alias) : hplayer.aliases[0];

                if (hplayer.aliases.indexOf(alias) < 0){
                    next(new base.errors.NotFound());
                }
                else {
                    var crumbs = [{href: "/", text: "Home"},
                                    {href: "/player", text: "Players"}];

                    if (typeof(req.hplayer) != "undefined"){
                        crumbs.push({href: "/player/"+encodeURI(alias)+"@"+encodeURI(handle), text: alias+"@"+handle});
                    }

                    var ogroups = [];
                    var mgroups = [];

                    base.util.inParallel(
                        function (callback){
                            api.groups.owners({startkey: [hplayer.handle.toLowerCase()], endkey: [hplayer.handle.toLowerCase(), 1], include_docs: true}, function (response){
                                if (response.rows){
                                    ogroups = response.rows.map(function (row){return row.doc});
                                }

                                callback();
                            });
                        },
                        function (callback){
                            api.groups.memberships({startkey: [hplayer._id], endkey: [hplayer._id, 1], include_docs: true}, function (response){
                                if (response.rows){
                                    response.rows.forEach(function (row){
                                        if (row.value.alias.toLowerCase() == alias.toLowerCase()){
                                            mgroups.push(row.doc);
                                        }
                                    });
                                }

                                callback();
                            });
                        },
                        function (){
                            res.render("player/profile", {pplayer: hplayer, alias: alias, ogroups: ogroups, mgroups: mgroups, crumbs: crumbs});
                        }
                    );
                }
            }
            else {
                res.redirect(encodeURI(hplayer.aliases[0])+"@"+encodeURI(handle));
            }
        }
        else {
            next(new base.errors.NotFound());
        }
    }
    
}

function groupControls(req, res, next){
    var api = req.app.set('iapi');

    var locals = {
        crumbs: [{href: "/", text: "Home"},
                 {href: "/player", text: "Players"},
                 {href: "/player/controls", text: "Controls"},
                 {href: "/player/controls/groups", text: "Groups"}],
        ogroups: [],
        agroups: []
    };

    var agroupcodes = [];

    base.util.inParallel(
        function (callback){
            api.groups.owners({startkey: [req.player.handle.toLowerCase()], endkey: [req.player.handle.toLowerCase(), 1], include_docs: true}, function (response){
               if (response.rows){
                   locals.ogroups = response.rows.map(function (row){return row.doc});
               }

               callback();
            });
        },
        function (callback){
            api.groups.admins({key: req.player._id, include_docs: true}, function (response){
                if (response.rows){
                    response.rows.forEach(function (row){
                        if (agroupcodes.indexOf(row.doc.code) == -1){
                            locals.agroups.push(row.doc);
                            agroupcodes.push(row.doc.code);
                        }
                    });
                }

                callback();
            });
        },
        function (){
            res.render("player/groups", locals);
        }
    );

}

function displaySearch(req, res, next){
    var api = req.app.set('iapi');

    var locals = {
        query: '',
        results: false,
        crumbs: [{href: "/", text: "Home"},
                 {href: "/player", text: "Players"},
                 {href: "/player/search", text: "Search"}]
    }

    if (req.param("query")){
        locals.query = req.param("query").trim();

        if (locals.query.length < 3){
            req.flash('error', "Search terms must be at least 3 characters long.");
            res.render("player/search", locals);
        }
        else {
            api.players.search({startkey: locals.query, endkey: locals.query}, function (response){
                if (response.error){
                    req.flash('error', 'There was an error processing your request: '+response.error);
                }
                else {
                    locals.results = [];

                    var _results = [];

                    var result;
                    var stringrep;
                    (response.rows || []).forEach(function (row){
                        stringrep = JSON.stringify([row.value.handle, row.value.alias, row.value.source]);
                        if (_results.indexOf(stringrep) == -1){
                            result = {
                                alias: row.value.alias,
                                handle: row.value.handle,
                                source: row.value.source
                            };

                            locals.results.push(result);
                            _results.push(stringrep);
                        }
                    });

                    locals.results.sort(function (a, b){
                        if (a.handle.toLowerCase() == b.handle.toLowerCase()){
                            return a.alias.toLowerCase() < b.alias.toLowerCase() ? -1 : 1;
                        }
                        else {
                            return a.handle.toLowerCase() < b.handle.toLowerCase() ? -1 : 1;
                        }
                    });
                }

                res.render("player/search", locals);
            });
        }
    }
    else {
        res.render("player/search", locals);
    }
}

function eventControls(req, res, next){
    var api = req.app.set('iapi');

    var locals = {
        crumbs: [{href: "/", text: "Home"},
                 {href: "/player", text: "Players"},
                 {href: "/player/controls", text: "Controls"},
                 {href: "/player/controls/events", text: "Events"}],
        current_events: [],
        future_events: []
    };

    var now = (new Date()).toISOString();
    api.events.admin_enddates({startkey: [req.player.handle.toLowerCase(), now], include_docs: true}, function (response){
        if (response.rows && response.rows.length){
            response.rows.forEach(function (row){
                if (row.value.event.startdate < now){
                    locals.current_events.push({event: row.value.event, game: row.doc});
                }
                else {
                    locals.future_events.push({event: row.value.event, game: row.doc});
                }
            });
        }

        res.render("player/events", locals);
    });
}

function eInviteControls(req, res, next){
    var api = req.app.set('iapi');

    var locals = {
        crumbs: [{href: "/", text: "Home"},
                 {href: "/player", text: "Players"},
                 {href: "/player/controls", text: "Controls"},
                 {href: "/player/controls/einvites", text: "Event Invitations"}],
        invitations: []
    };

    base.util.inParallel(
        function (callback){
            api.events.invitations({startkey: [req.player._id], endkey: [req.player._id, 1], include_docs: true}, function (response){
                if (response.rows && response.rows.length){
                    locals.invitations = response.rows.map(function (row){return {event: row.value.event, game: row.doc};}).filter(function (invite){return invite.event.event_type == "player_register";});
                }

                callback();
            })
        },
        function (){
            res.render("player/einvites", locals);
        }
    );
}

function eRegistrationControls(req, res, next){
    var api = req.app.set('iapi');

    var locals = {
        crumbs: [{href: "/", text: "Home"},
                 {href: "/player", text: "Players"},
                 {href: "/player/controls", text: "Controls"},
                 {href: "/player/controls/eregistrations", text: "Event Registrations"}],
        approved_registrations: {
            current: [],
            future: []
        },
        pending_registrations: {
            current: [],
            future: []
        }
    };

    var now = (new Date()).toISOString();
    base.util.inParallel(
        function (callback){
            api.events.registration_enddates({startkey: [req.player._id, 0, now], endkey: [req.player._id, 1], include_docs: true}, function (response){
                if (response.rows && response.rows.length){
                    response.rows.forEach(function (row){
                        var obj = {event: row.value.event, game: row.doc, alias: row.value.registration.name_or_alias};
                        if (row.value.event.startdate < now){
                            if (row.value.registration.approved){
                                locals.approved_registrations.current.push(obj);
                            }
                            else {
                                locals.pending_registrations.current.push(obj);
                            }
                        }
                        else {
                            if (row.value.registration.approved){
                                locals.approved_registrations.future.push(obj);
                            }
                            else {
                                locals.pending_registrations.future.push(obj);
                            }
                        }
                    });
                }

                callback();
            })
        },
        function (){
            res.render("player/eregistrations", locals);
        }
    );
}