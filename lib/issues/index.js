var base = require('../base'),
    us = require('underscore'),
    json_schema = require('../json-schema');

module.exports.urls = function (_base){
    return function (app){
        app.get(_base + "", ticketIndex);
        app.get(_base + "/", ticketIndex);
        app.get(_base + "/:ticket", viewTicket);
        app.get(_base + "/type/:type", viewType);
        app.get(_base + "/status/:status", viewStatus);
        app.get(_base + "/tag/:tag", viewTag);
        app.get(_base + "/milestone/:milestone", viewMilestone);

        app.put(_base + "/add", addTicket);
        app.put(_base + "/:ticket/update", updateTicket);
        app.put(_base + "/milestone/add", addMilestone);
    }
}

function processRows(rows){
    var tickets = [];
    var last_ticket = false;

    rows.forEach(function (row){
        if (row.key.pop() == 0)
        {
            if (last_ticket)
            {
                tickets.push(last_ticket);
            }
            
            last_ticket = row.value.ticket;
            last_ticket.owner_real = row.doc;
            last_ticket.assigned_to_real = [];
        }
        else
        {
            last_ticket.assigned_to_real.push(row.doc);
        }
    });
    
    if (last_ticket)
    {
        tickets.push(last_ticket);
    }
    
    return tickets;
}

function ticketIndex(req, res, next){
    var crumbs = [{href: "/", text: "Home"},
                    {href: "/issues", text: "Issues"}];
    var api = req.app.set('iapi');

    api.ticketList({include_docs: true}, function (response){
        var tickets;
        if (response.rows)
        {
            tickets = processRows(response.rows);
        }
        else
        {
            tickets = [];
        }
        res.render('issues/list', {locals: {tickets: tickets, list_name: "Open Issues", crumbs: crumbs}});
    });
}

//todo below here
function viewTicket(req, res, next){

}

function viewType(req, res, next){
    
}

function viewStatus(req, res, next){

}

function viewTag(req, res, next){

}

function viewMilestone(req, res, next){

}

function addTicket(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
    if (!req.player)
    {
        res.end(JSON.stringify({error: "not logged in"}));
    }
    else if (!req.body)
    {
        res.end(JSON.stringify({error: "parse error"}));
    }
    else
    {
        var schema_mod = require('./schema');
        var ticket_schema = schema_mod.ticket;
        var watcher_schema = schema_mod.watcher;
    
        var ticket = {};
        ticket.type = "ticket";
        ticket.subject = req.body.subject;
        ticket.body = req.body.body;
        ticket.ticket_type = req.body.type;
        ticket.owner = req.player._id;
        ticket.created_at = (new Date()).toISOString();
        ticket.status = {category: "new", status: schema_mod.statuses["new"][0]};
        ticket.tags = [];
        ticket.assigned_to = [];
        
        var watcher = {};
        watcher.type = "watcher";
        watcher.watcher = req.player._id;
        watcher.notifications = {email: false, pm: false};
        
        var verify_ticket = json_schema.validate(ticket, ticket_schema);
        var verify_watcher = json_schema.validate(watcher, watcher_schema);
        
        if (verify_ticket.valid)
        {    
            api.uuids({number: 2}, function (uuids){
                if (uuids.length)
                {
                    ticket._id = uuids[0];
                    watcher._id = uuids[1];
                    watcher.ticket = uuids[0];
                    
                    api.putDoc(ticket, function (response){
                        if (response.error)
                        {
                            res.end(JSON.stringify({error: "save error", details: response.error, step: "ticket"}));
                        }
                        else
                        {
                            api.putDoc(watcher, function (response){
                                if (response.error)
                                {
                                    res.end(JSON.stringify({ok: true, message: "ticket saved, but error watching", error: "save error", details: response.error, step: "watcher", ticket: ticket}));
                                }
                                else
                                {
                                    res.end(JSON.stringify({ok: true, message: "ticket saved", ticket: ticket}));
                                }
                            });
                        }
                    });
                }
                else
                {
                    res.end(JSON.stringify({error: "internal server error"}));
                }
            });
        }
        else
        {
            res.end(JSON.stringify({error: "ticket had invalid format", details: verify_ticket.errors, ticket: ticket   }));
        }
    }
}

function updateTicket(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
}

function addMilestone(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
} 
