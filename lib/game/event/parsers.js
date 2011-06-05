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
            req.invite_id = _invite;
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
        var splitind = _request.indexOf("-");
        var rtype = _request.substring(0, splitind);
        var rdata = _request.substring(splitind + 1);

        var requests = (req.event.registrations || []).map(function (request, index){return [request, index]}).filter(function (request){return !request[0].approved && request[0].type == rtype;});
        var rindex;
        if (rtype == "player"){
            rindex = requests.map(function (request){return request[0].name_or_alias.toLowerCase()+"@"+request[0].code_or_handle.toLowerCase()}).indexOf(rdata.toLowerCase());
        }
        else {
            rindex = requests.map(function (request){return request[0].code_or_handle.toLowerCase()}).indexOf(rdata.toLowerCase());
        }
        
        if (rindex > -1){
            req.request_index = requests[rindex][1];
            req.request_data = requests[rindex][0];
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

function registrationParser(req, res, next, _request){
    if (req.event){
        var splitind = _request.indexOf("-");
        var rtype = _request.substring(0, splitind);
        var rdata = _request.substring(splitind + 1);

        var requests = (req.event.registrations || []).map(function (request, index){return [request, index]}).filter(function (request){return request[0].approved && request[0].type == rtype;});
        var rindex;
        if (rtype == "player"){
            rindex = requests.map(function (request){return request[0].name_or_alias.toLowerCase()+"@"+request[0].code_or_handle.toLowerCase()}).indexOf(rdata.toLowerCase());
        }
        else {
            rindex = requests.map(function (request){return request[0].code_or_handle.toLowerCase()}).indexOf(rdata.toLowerCase());
        }

        if (rindex > -1){
            req.regis_index = requests[rindex][1];
            req.regis_data = requests[rindex][0];
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
            req.admin_index = aindex;
            req.admin_handle = _admin;
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