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
            app.get(_base + "/tos", page('default/tos'));
            app.get(_base + "/about", page('default/about'));
            app.get(_base + "/privacy", page('default/privacy'));
            app.get(_base + "/contact", page('default/contact'));
        };
    }
};

//functions go here
function index(req, res, next){
    res.render('default/index');
}

function page(template){
    return function (req, res, next){
        res.render(template);
    };
}
