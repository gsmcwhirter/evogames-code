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
        'question2', 'answer2', 'agreement', 'captcha'];

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
        context.questions = require('../player/schema').security_questions;;
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
    
    context.messages["general"] = context.messages["general"] || [];
    
    if (!req.form)
    {
        context.errors = true;
        context.messages["general"].push("Unable to process form contents.");
        
        registerForm(req, res, next, context);
    }
    else
    {
        var json_schema = require('../json-schema');
        var player_schema = require('../player/schema').player;
        var security_questions = require('../player/schema').security_questions;
        req.form.complete(function (err, fields, files){
            
            register_fields.forEach(function (item){
                fields[item] = fields[item] ? fields[item].trim() : "";
                context.messages[item] = [];
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
            player.password = fields.password;
            player.name_history = [{name: fields.name, date: date.toISOString()}];
            player.email_history = [];
            player.pending_email_change = {email: fields.email, token: base.util.sha1_hex(email_token + salt)};
            player.security_questions = [{question: fields.question1, answer: fields.answer1},
                                         {question: fields.question2, answer: fields.answer2}];
            
            if (fields.email != fields.email_confirm)
            {
                context.errors = true;
                context.messages.email_confirm.push("must match e-mail.");
            }
            
            if (fields.password != fields.password_confirm)
            {
                context.errors = true;
                context.messages.password_confirm.push("must match password.");
            }
            
            if (fields.question1 == fields.question2)
            {
                context.errors = true;
                context.messages.question2.push("must be different from question 1.");
            }
            
            if (fields.answer1 == fields.answer2)
            {
                context.errors = true;
                context.messages.answer2.push("must be different from answer 1.");
            }
            
            if (fields.agreement != "yes")
            {
                context.errors = true;
                context.messages.agreement.push("must be agreed to.");
            }
            
            var validation = json_schema.validate(player, player_schema);
            if (!validation.valid)
            {
                context.errors = true;
                
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
                    context.messages[error.property] = context.messages[error.property] || []; 
                    context.messages[error.property].push(error.message);
                });
            }
            
            player.password =  base.util.sha1_hex(player.password + player.salt);
            
            for (var i in player.security_questions)
            {
                player.security_questions[i].answer = base.util.sha1_hex(player.security_questions[i].answer + player.salt); 
            }
            
            context.player = player;
            
            var after_recaptcha = function (recaptcha){
                if (!recaptcha.verify)
                {
                    context.errors = true;
                    context.messages.captcha.push("could not be verified.");
                }
                
                if (context.errors)
                {
                    context.messages["general"].push("There were problems with your request.");
                    
                    registerForm(req, res, next, context);
                }
                else
                {
                    var couchdb = require('../couchdb');
                    var url = base.config.couchdb+"/"+context.player._id;
                    var creq = new couchdb.Request(function(responseText){
                        var response = JSON.parse(responseText);
                        if (response.error)
                        {
                            context.errors = true;
                            var msg = response.error == "conflict" ? "Could not save your registration: username already exists." : response.error;
                            context.messages["general"].push(msg);
                            
                            registerForm(req, res, next, context);
                        }
                        else
                        {
                            base.renderPage(req, res,
                                    "default/register_success.jade",
                                    context,
                                    {},
                                    true);
                        }
                    }); 
                    creq.go("PUT",url,{data: JSON.stringify(context.player), "Content-type": "application/json"});  
                }
            };
            
            var host = req.headers.host.split(":")[0];
            if (host != "localhost")
            {
                base.verifyRecaptcha(req, fields.recaptcha_challenge_field, fields.recaptcha_response_field, after_recaptcha);
            }
            else
            {
                after_recaptcha({verify: true});
            }
        });
    }    
}
