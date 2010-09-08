var base = require('../base'),
    sys = require('sys');

module.exports.urls = function (ssl, _base){
    if (ssl)
    {
        return function(app){
            app.get(_base + "/login", loginForm);
            app.get(_base + "/register", registerForm);
            //app.get(_base + "/logout", logoutForm);
            //app.get(_base + "/lostpass", lostpassForm);
            
            app.post(_base + "/login", loginProcess);
            app.post(_base + "/register", registerProcess);
            
        };
    }
    else
    {   
        return function (app){
            app.get(_base + "/", index);
            app.get(_base + "/hello/:name?", hello);
            
            app.get(_base + "/login", base.forceSSL);
            app.get(_base + "/register", base.forceSSL);
        };
    }
};

//functions go here
function index(req, res, next){
    res.render('default/index');
}

function hello(req, res, next){
    var name;
    if (req.params.name)
    {
        name = req.params.name;
    }
    else
    {
        name = "World";
    }
    
    res.render('default/hello', {locals: {name: name}});
}

function loginForm(req, res, next){
    if (req.player)
    {
        res.render('errors/logged_in', {locals: {redirect: {href: '/'}}});
    }
    else
    {
        res.render('default/login', {locals: {messages: {}, data: {}, referrer: '', errors: false}});
    }
}

function loginProcess(req, res, next){

}

var register_fields = ['username','name','email', 'email_confirm', 
        'password', 'password_confirm', 'question1', 'answer1', 
        'question2', 'answer2', 'agreement', 'captcha'];

function registerForm(req, res, next, locals){   
    if (req.player)
    {
        res.render('errors/logged_in', {locals: {redirect: {href: '/'}}});
    }
    else
    {
        var config = req.app.set('config');
        var host = req.headers.host.split(":")[0];
        if (host == "localhost") host = "djo-dev.org";
        if (host.substring(0,4) == "www.") host = host.substring(4, host.length);
        
        var locals = locals || {messages: {}, data: {}, errors: false};
        
        locals.public_key = config.recaptcha_keys[host] ? config.recaptcha_keys[host]["public"] : '';
        locals.questions = require('../player/schema').security_questions;;
        locals.required_fields = JSON.stringify(register_fields);
        
        res.render('default/register', {locals: locals});
    }
}

function registerProcess(req, res, next)
{
    var locals = {messages: {}, data: {}, errors: false};
    
    locals.messages["general"] = [];
    
    if (!req.body)
    {
        locals.errors = true;
        //req.flash('error', "Unable to process form contents.");
        locals.messages["general"].push("Unable to process form contents.");
        
        registerForm(req, res, next, locals);
    }
    else
    {
        var json_schema = require('../json-schema');
        var player_schema = require('../player/schema').player;
        var security_questions = require('../player/schema').security_questions;
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
            locals.errors = true;
            locals.messages.email_confirm.push("must match e-mail.");
        }
        
        if (fields.password != fields.password_confirm)
        {
            locals.errors = true;
            locals.messages.password_confirm.push("must match password.");
        }
        
        if (fields.question1 == fields.question2)
        {
            locals.errors = true;
            locals.messages.question2.push("must be different from question 1.");
        }
        
        if (fields.answer1 == fields.answer2)
        {
            locals.errors = true;
            locals.messages.answer2.push("must be different from answer 1.");
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
        
        for (var i in player.security_questions)
        {
            player.security_questions[i].answer = base.util.sha1_hex(player.security_questions[i].answer + player.salt); 
        }
        
        var after_recaptcha = function (recaptcha){
            if (!recaptcha.verify)
            {
                locals.errors = true;
                locals.messages.captcha.push("could not be verified.");
            }
            
            if (locals.errors)
            {
                locals.messages["general"].push("There were problems with your request.");
                
                registerForm(req, res, next, locals);
            }
            else
            {
                var couchdb = require('../couchdb');
                var url = config.couchdb+"/"+player._id;
                var creq = new couchdb.Request(function(responseText){
                    var response = JSON.parse(responseText);
                    if (response.error)
                    {
                        locals.errors = true;
                        var msg = response.error == "conflict" ? "Could not save your registration: username already exists." : response.error;
                        locals.messages["general"].push(msg);
                        
                        registerForm(req, res, next, locals);
                    }
                    else
                    {
                        res.render('default/register_success', {locals: locals});
                    }
                }); 
                creq.go("PUT",url,{data: JSON.stringify(player), "Content-type": "application/json"});  
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
    }    
}
