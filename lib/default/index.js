module.exports = {    
    urls: function (ssl, _base){
        if (ssl)
        {
            return function(app){
                app.get(_base + "/login", login_form);
                //app.get(_base + "/logout", logout_form);
                //app.get(_base + "/lostpass", lostpass_form);
                //app.get(_base + "/register", register_form);
                
                app.post(_base + "/login", login_process);
                
            };
        }
        else
        {
            return function (app){
                app.get(_base + "/", index);
                app.get(_base + "/hello/:name?", hello);
            };
        }
    }
}

var base = require('../base');

//functions go here
function index(req, res, next)
{
    base.renderPage(res, "base/index.jade");
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

    base.renderPage(res, "base/hello.jade", {name: name});
}

function login_form(req, res, next)
{
    base.renderPage(res, "base/login.jade", {messages: {}, data: {}, referrer: '', errors: false});    
}

function login_process(req, res, next)
{

}
