var base = require('../base'),
    sys = require('sys');

var urls = function (ssl, _base){
    if (ssl)
    {
        return function(app){
            app.get(_base + "/login", loginForm);
            app.get(_base + "/register", registerForm);
            //app.get(_base + "/logout", logout_form);
            //app.get(_base + "/lostpass", lostpass_form);
            
            app.post(_base + "/login", loginProcess);
            app.post(_base + "/register", registerProcess);
            
        };
    }
    else
    {
        var regfuncs = function (app){
            app.get(_base + "/", index);
            app.get(_base + "/hello/:name?", hello);
        }
        
        var redirfuncs = function (app){
            app.get(_base + "/login", base.forceSSL);
            app.get(_base + "/register", base.forceSSL);
        }
        
        if(!base.config.use_ssl)
        {
            var tmp = urls(true, _base);
            return function (app){
                regfuncs(app);
                tmp(app);
            };
        }
        else
        {
            return function (app){
                regfuncs(app);
                redirfuncs(app);
            };
        }
    }
}

module.exports.urls = urls;

//functions go here
function index(req, res, next)
{
    base.renderPage(req, res, "default/index.jade");
}

function hello(req, res, next)
{
    var name;
    if (req.params.name)
    {
        name = req.params.name;
    }
    else
    {
        name = "World";
    }

    base.renderPage(req, res, "default/hello.jade", {name: name});
}

function loginForm(req, res, next)
{
    if (req.player)
    {
        base.renderPage(req, res, "errors/logged_in.jade", {redirect: {href: ''}}, {}, true);
    }
    else
    {
        base.renderPage(req, res, 
                "default/login.jade", 
                {messages: {}, data: {}, referrer: '', errors: false},
                {},
                true);
    }
}

function loginProcess(req, res, next)
{

}

var register_fields = ['username','name','email', 'email_confirm', 
        'password', 'password_confirm', 'question1', 'answer1', 
        'question2', 'answer2', 'agreement'];

function registerForm(req, res, next, context)
{   
    if (req.player)
    {
        base.renderPage(req, res, "errors/logged_in.jade", {redirect: {href: ''}}, {}, true);
    }
    else
    {
        var host = req.headers.host.split(":")[0];
        if (host == "localhost") host = "djo-dev.org";
        
        if (!base.config.recaptcha_keys) base.loadRecaptchaKeys();
        
        var public_key = base.config.recaptcha_keys[host] ? base.config.recaptcha_keys[host]["public"] : '';
        var context = context || {messages: {}, data: {}, errors: false};
        
        context.public_key = public_key;
        context.questions = [];
        context.required_fields = JSON.stringify(register_fields);
        
        base.renderPage(req, res,
                "default/register.jade",
                context,
                {},
                true);
    }
}

function registerProcess(req, res, next)
{
    var context = {messages: {}, data: {}, errors: false};
    
    if (!req.form)
    {
        context.errors = true;
        context.messages["general"] = context.messages["general"] || [];
        context.messages["general"].push("Unable to process form contents.");
        
        registerForm(req, res, next, context);
    }
    else
    {
        req.form.complete(function (err, fields, files){
            var schema = require('../player/schema').player;
            var dt = require('../datetime');
            
            register_fields.forEach(function (item){
                fields[item] = fields[item] ? fields[item].trim() : "";
            });
            
            context.data = fields;
            
            var player = {};
            var date = new Date();
            var salt = base.util.randomString(20,true);
            var email_token = base.util.randomString(20, true);
            
            
            player.type = "player";
            player._id = fields.username; 
            player.username = fields.username;
            player.created_at = date.toISOString();
            player.status = "pending";
            player.salt = salt;
            player.password = base.util.sha1_hex(fields.password + salt);
            player.name_history = [{name: fields.name, date: date.toISOString()}];
            player.email_history = [];
            player.lost_password_token = "";
            player.pending_email_change = {email: fields.email, token: base.util.sha1_hex(email_token + salt)};
            player.security_questions = [{question: fields.question1, answer: base.util.sha1_hex(fields.answer1 + salt)},
                                            {question: fields.question2, answer: base.util.sha1_hex(fields.answer2 + salt)}];
            
            //var user_re = new RegExp("([^a-zA-Z0-9_\\-.$!@()\\[\\]{}=+*?: ])");
            var email_re = new RegExp("^([a-zA-Z0-9_\\-.]+)@(([a-zA-Z0-9\\-]+\\.)+)([a-zA-Z]{2,9})$");
            var pass_re = new RegExp("[^a-zA-Z]");
            
            /*if (player.username.match(user_re))
            {
                context.errors = true;
                context.messages.username = context.messages.username || [];
                context.messages.username.push("contains invalid characters");
            }*/
            
            if (!fields.email.match(email_re))
            {
                context.errors = true;
                context.messages.email = context.messages.email || [];
                context.messages.email.push("has invalid format.");
            }
            
            if (fields.email != fields.email_confirm)
            {
                context.errors = true;
                context.messages.email_confirm = context.messages.email_confirm || [];
                context.messages.email_confirm.push("must match e-mail.");
            }
            
            if (!fields.password.match(pass_re))
            {
                context.errors = true;
                context.messages.password = context.messages.password || [];
                context.messages.password.push("must contain at least one non-letter.");
            }
            
            if (fields.password != fields.password_confirm)
            {
                context.errors = true;
                context.messages.password_confirm = context.messages.password_confirm || [];
                context.messages.password_confirm.push("must match password.");
            }
            
            if (fields.question1 == fields.question2)
            {
                context.errors = true;
                context.messages.question2 = context.messages.question2 || [];
                context.messages.question2.push("must be different from question 1.");
            }
            
            if (fields.answer1 == fields.answer2)
            {
                context.errors = true;
                context.messages.answer2 = context.messages.answer2 || [];
                context.messages.answer2.push("must be different from answer 1.");
            }
            
            if (fields.agreement != "yes")
            {
                context.errors = true;
                context.messages.agreement = context.messages.agreement || [];
                context.messages.agreement.push("must be agreed to.");
            }
            
            /*player = schema.validate(player);
            
            if (player.isError())
            {
                context.errors = true;
                player.errors.forEach(function (error){
                    context.messages[error.name] = context.messages[error.name] || [];
                    context.messages[error.name].push(error.message);
                });
            }*/
            
            context.player = player;
            
            base.verifyRecaptcha(req, fields.recaptcha_challenge_field, fields.recaptcha_response_field, function(recaptcha){
                if (!recaptcha.verify)
                {
                    context.errors = true;
                    context.messages.captcha = context.messages.captcha || [];
                    context.messages.captcha.push("could not be verified.");
                }
                
                if (context.errors)
                {
                    context.messages["general"] = context.messages["general"] || [];
                    context.messages["general"].push("There were problems with your request.");
                    
                    registerForm(req, res, next, context);
                }
                else
                {
                    sys.debug("now here");
                    //registerForm(req, res, next, context);
                    //try to save stuff
                }
            });
            
            
        });
    }    
}
