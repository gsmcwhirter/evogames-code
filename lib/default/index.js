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
        
        var public_key = base.config.recaptcha_keys[host] ? base.config.recaptcha_keys[host]["public"] : '';
        var context = context || {messages: {}, data: {}, errors: false};
        
        context.public_key = public_key;
        context.questions = [];
        
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
    
    
}
