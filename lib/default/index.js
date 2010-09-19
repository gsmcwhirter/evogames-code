var base = require('../base');

module.exports.urls = function (ssl, _base){
    if (ssl)
    {
        return function(app){};
    }
    else
    {   
        return function (app){
            app.get(_base + "/", index);
            app.get(_base + "/tos", base.page('default/tos'));
            app.get(_base + "/about", base.page('default/about'));
            app.get(_base + "/privacy", base.page('default/privacy'));
            app.get(_base + "/contact", base.page('default/contact'));
        };
    }
};

//functions go here
function index(req, res, next){
    res.render('default/index');
}
