var base = require('../base'),
    us = require('underscore');

module.exports.urls = function (_base){
    return function (app){
        app.get(_base + "/", index);
        app.get(_base + "/tos", base.page('default/tos', [{href: "/", text: "Home"}, {href: "/tos", text: "Terms of Service"}]));
        app.get(_base + "/about", base.page('default/about', [{href: "/", text: "Home"}, {href: "/about", text: "About"}]));
        app.get(_base + "/privacy", base.page('default/privacy', [{href: "/", text: "Home"}, {href: "/privacy", text: "Privacy Policy"}]));
        app.get(_base + "/contact", base.page('default/contact', [{href: "/", text: "Home"}, {href: "/contact", text: "Contact Information"}]));
    };
};

//functions go here
function index(req, res, next){
    var done_max = 2;
    var done = 0;
    var articles = [];
    var registrations = [];
    var api = req.app.set('iapi');
    
    function whenDone(){
        if (done == done_max)
        {
            res.render('default/index', {articles: articles, registrations: registrations});    
        }
    }
    
    api.publishedArticles({include_docs: true, descending: true, limit: 10}, function (response){
        if (response.rows)
        {
            articles = us._(response.rows).pluck('doc');
        }
        
        done++;
        whenDone();
    });
    
    api.recentRegistrations({include_docs: true, descending: true, limit: 10}, function (response){
        if (response.rows)
        {
            registrations = us._(response.rows).pluck('doc');
        }
        
        done++;
        whenDone();
    });
    
}
