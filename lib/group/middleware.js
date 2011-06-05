var base = require("../base");

module.exports = {
    checkGroupAdmin: checkGroupAdmin,
    forceGroupAdmin: forceGroupAdmin,
    forceGroupAdminAjax: forceGroupAdminAjax,
    forceGroupOwner: forceGroupOwner,
    forceGroupOwnerAjax: forceGroupOwnerAjax
}

function checkGroupAdmin(req, res, next){
    if (req.player && req.group){
        if (req.group.owners.map(function (owner){return owner.toLowerCase()}).indexOf(req.player.handle.toLowerCase()) > -1 || req.player.is_sysop){
            req.groupAdmin = {
                _edit: true,
                _requests: true,
                _members: true,
                _invites: true,
                _events: true,
                owner: true
            };
        }
        else {
            req.groupAdmin = {
                _edit: false,
                _requests: false,
                _members: false,
                _invites: false,
                _events: false
            };
            var nonempty = false;

            (req.group.members || []).forEach(function (member){
                if (member.id == req.player._id){
                    (member.admin || []).forEach(function (admin){
                        req.groupAdmin["_"+admin] = true;
                        nonempty = true;
                    });
                }
            });

            if (!nonempty){
                req.groupAdmin = false;
            }
        }
        next();
    }
    else {
        req.groupAdmin = false;
        next();
    }
}

function forceGroupAdmin(type){
    return function (req, res, next){
        if (!req.groupAdmin || (type && !req.groupAdmin["_"+type])){
            next(new base.errors.AccessDenied());
        }
        else {
            next();
        }
    };
}

function forceGroupAdminAjax(type){
    return function (req, res, next){
        if (!req.groupAdmin || (type && !req.groupAdmin["_"+type])){
            res.writeHead(200, {"Content-type": "application/json"});
            res.end(JSON.stringify({error: "access denied"}));
        }
        else {
            next();
        }
    }
}

function forceGroupOwner(req, res, next){
    if (!req.groupAdmin || !req.groupAdmin.owner){
        next(new base.errors.AccessDenied());
    }
    else {
        next();
    }
}

function forceGroupOwnerAjax(req, res, next){
    if (!req.groupAdmin || !req.groupAdmin.owner){
        res.writeHead(200, {"Content-type": "application/json"});
        res.end(JSON.stringify({error: "access denied"}));
    }
    else {
        next();
    }
}