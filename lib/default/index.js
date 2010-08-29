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

module.exports = {    
    urls: function (_base){
        return function (app){
            app.get(_base + "/", index);
            app.get(_base + "/hello/:name?", hello);
        }
    }
    , sslurls: function (_base){
        return function(app){
            app.get(_base + "/:name?", hello);
        }
    }
}
