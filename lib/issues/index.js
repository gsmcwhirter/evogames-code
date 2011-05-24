var base = require('../base'),
    api = require('../api/internal'),
    us = require('underscore');

module.exports.urls = function (ssl, _base){
    if (ssl)
    {
        return function (app){}
    }
    else
    {
        return function (app){
            app.get(_base + "", ticketIndex);
            app.get(_base + "/", ticketIndex);
            app.get(_base + "/:ticket", viewTicket);
            app.get(_base + "/type/:type", viewType);
            app.get(_base + "/status/:status", viewStatus);
            app.get(_base + "/tag/:tag", viewTag);
            app.get(_base + "/milestone/:milestone", viewMilestone);
            
            app.post(_base + "/add", addTicket);
            app.post(_base + "/:ticket/comment", addComment);
            app.post(_base + "/milestone/add", addMilestone);
        }
    }
}


function ticketIndex(req, res, next){
    api.ticketList({include_docs: true}, function (response){
        var tickets = us._(response.rows).pluck('doc');
        res.render('issues/list', {locals: {tickets: tickets, list_name: "Ticket List"}});
    });
}

function viewTicket(req, res, next){

}

function viewType(req, res, next){
    api.ticketList({include_docs: true}, function (response){
        var tickets = us._(response.rows).pluck('doc');
        res.render('issues/list', {locals: {tickets: tickets, list_name: "Ticket List"}});
    });
}

function viewStatus(req, res, next){

}

function viewTag(req, res, next){

}

function viewMilestone(req, res, next){

}

function addTicket(req, res, next){

}

function addComment(req, res, next){

}

function addMilestone(req, res, next){

} 
