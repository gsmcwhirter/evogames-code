var base = require('../base'),
    sys = require('sys');

module.exports.urls = function (ssl, _base){
    if (ssl)
    {
        return function(app){};
    }
    else
    {   
        return function (app){
            app.get(_base + "/", index);
            app.get(_base + "/form_test", formTest);
            app.get(_base + "/hello/:name?", hello);
        };
    }
};

//functions go here
function index(req, res, next){
    res.render('default/index');
}

function formTest(req, res, next){
    res.render('default/form_test');
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
