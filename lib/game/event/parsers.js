var base = require("../../base"),
    mw = require("./middleware");

module.exports = {
    slugParser: slugParser,
    matchIdParser: matchIdParser,
    inviteParser: inviteParser,
    requestParser: requestParser,
    registrationParser: registrationParser,
    adminParser: adminParser
}

function slugParser(req, res, next, slug){
    var api = req.app.set('iapi');
    api.events.slugs({key: slug.toLowerCase(), include_docs: true}, function (response){
        if (response.rows && response.rows.length){
            req.event = response.rows[0].doc;
            mw.checkEventAdmin(req, res, function (err){
                if (err){
                    next(err);
                }
                else {
                    next();
                }
            });
        }
        else {
            next(new base.errors.NotFound());
        }
    });

}

function matchIdParser(req, res, next, matchid){
    var api = req.app.set('iapi');
    if (req.event){
        api.getDoc(matchid, function (response){
            if (!response.error && response.type == "match" && response.event == req.event._id){
                req.match = response;
                next();
            }
            else {
                next(new base.errors.NotFound());
            }
        });
    }
    else {
        next(new base.errors.NotFound());
    }
}

function inviteParser(req, res, next, _invite){
    if (req.event){
        var iindex = (req.event.invitations || []).map(function (invite){return invite.id.toLowerCase()}).indexOf(_invite.toLowerCase());
        if (iindex > -1){
            req.invite_index = iindex;
            next();
        }
        else {
            res.writeHead(404, {"Content-type": "application/json"});
            res.end(JSON.stringify({error: "not found"}));
        }
    }
    else {
        res.writeHead(404, {"Content-type": "application/json"});
        res.end(JSON.stringify({error: "not found"}));
    }
}

function requestParser(req, res, next, _request){
    if (req.event){
        var requests = (req.event.registrations || []).map(function (request, index){return [request, index]}).filter(function (request){return !request[0].approved;});
        var rindex = requests.map(function (request){return request[0].id.toLowerCase()}).indexOf(_request.toLowerCase());
        if (rindex > -1){
            req.request_index = requests[rindex][1];
            next();
        }
        else {
            res.writeHead(404, {"Content-type": "application/json"});
            res.end(JSON.stringify({error: "not found"}));
        }
    }
    else {
        res.writeHead(404, {"Content-type": "application/json"});
        res.end(JSON.stringify({error: "not found"}));
    }
}

function registrationParser(req, res, next, _registration){
    if (req.event){
        var requests = (req.event.registrations || []).map(function (request, index){return [request, index]}).filter(function (request){return request[0].approved;});
        var rindex = requests.map(function (request){return request[0].id.toLowerCase()}).indexOf(_registration.toLowerCase());
        if (rindex > -1){
            req.registration_index = requests[rindex][1];
            next();
        }
        else {
            res.writeHead(404, {"Content-type": "application/json"});
            res.end(JSON.stringify({error: "not found"}));
        }
    }
    else {
        res.writeHead(404, {"Content-type": "application/json"});
        res.end(JSON.stringify({error: "not found"}));
    }
}

function adminParser(req, res, next, _admin){
    if (req.event){
        var aindex = (req.event.admins || []).map(function (admin){return admin.toLowerCase()}).indexOf(_admin.toLowerCase());
        if (aindex > -1){
            req.invite_index = aindex;
            next();
        }
        else {
            res.writeHead(404, {"Content-type": "application/json"});
            res.end(JSON.stringify({error: "not found"}));
        }
    }
    else {
        res.writeHead(404, {"Content-type": "application/json"});
        res.end(JSON.stringify({error: "not found"}));
    }
}