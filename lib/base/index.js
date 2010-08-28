var ejs = require('ejs');
var quip = require('quip');

//functions go here
function index(req, res, next)
{
    res.html(ejs.render("<html><body><h1>Index!</h1></body></html>",{}));
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

    res.html(ejs.render("<html><body><h1>Hello, <%= name %>!</h1></body></html>",{locals: {name: name}}));
}

module.exports = {
    urls: function (_base)
    {
        return function (app)
        {
            app.get(_base + "/", index);
            app.get(_base + "/hello/:name?", hello);
        }
    }
}
