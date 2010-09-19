var base = require('../base'),
    api = require('../api/internal'),
    us = require('underscore');

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
    var done_max = 2;
    var done = 0;
    var articles = [];
    var registrations = [];
    
    function whenDone(){
        if (done == done_max)
        {
            res.render('default/index', {locals: {articles: articles, registrations: registrations}});    
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
