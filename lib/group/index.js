var base = require('../base'),
    json_schema = require('../json-schema'),
    group_schema = require('./schema').group,
    markdown = require('discount'),
    us = require('underscore');

var app = module.exports = base.createServer();

app.get("/", base.page('group/index', [{href: "/", text: "Home"}, {href: "/group", text: "Groups"}]));

app.get("/search", displaySearch);
app.post("/search", processSearch);

app.get("/create", base.middleware.loginCheck, createForm);
app.post("/create", base.middleware.loginCheck, createProcess);

app.get("/:code", function (req, res, next){
    res.redirect(req.group.code+"/profile");
});

app.get("/:code/profile", checkGroupAdmin, displayProfile);

app.get("/:code/join", base.middleware.loginCheck, joinForm);
app.post("/:code/join", base.middleware.loginCheck, joinProcess);

app.del("/:code/decline", base.middleware.loginCheckAjax, declineProcess);
app.del("/:code/leave/:alias", base.middleware.loginCheckAjax, leaveProcess);

app.get("/:code/controls", base.middleware.loginCheck, checkGroupAdmin, forceGroupAdmin, groupControls);

app.get("/:code/controls/edit", base.middleware.loginCheck, checkGroupAdmin, forceGroupAdmin, editForm);
app.post("/:code/controls/edit", base.middleware.loginCheck, checkGroupAdmin, forceGroupAdmin, editProcess);

app.get("/:code/controls/requests", base.middleware.loginCheck, checkGroupAdmin, forceGroupAdmin, pendingForm);
app.get("/:code/controls/members", base.middleware.loginCheck, checkGroupAdmin, forceGroupAdmin, membersForm);
app.get("/:code/controls/members/:alias@:handle", base.middleware.loginCheck, checkGroupAdmin, forceGroupAdmin, membersForm);
app.del("/:code/controls/members/:alias@:handle/approve", base.middleware.loginCheck, checkGroupAdmin, forceGroupAdmin, membersForm)
app.del("/:code/controls/members/:alias@:handle/remove", base.middleware.loginCheck, checkGroupAdmin, forceGroupAdmin, membersForm);

app.get("/:code/controls/invites", base.middleware.loginCheck, checkGroupAdmin, forceGroupAdmin, inviteForm);
app.put("/:code/controls/invites", base.middleware.loginCheck, checkGroupAdmin, forceGroupAdmin, inviteForm);
app.del("/:code/controls/invites/@:handle", base.middleware.loginCheck, checkGroupAdmin, forceGroupAdmin, inviteForm);

app.param('code', function(req, res, next, code){
    var api = req.app.set('iapi');

    api.groupCodes({include_docs: true, startkey: [code.toLowerCase()], endkey: [code.toLowerCase(), code.toUpperCase()]}, function (response){
        if (!response.errors && response.rows.length){
            req.group = response.rows[0].doc;
            next();
        }
        else {
            req.group = false;
            next(new base.errors.NotFound());
        }
    });
});

function checkGroupAdmin(req, res, next){
    if (req.player && req.group){
        if (req.group.owners.indexOf(req.player._id) > -1 || req.player.is_sysop){
            req.isGroupAdmin = true;
        }
        //TODO: Admin checks as well as owners
        else {
            req.isGroupAdmin = false;
        }
        next();
    }
    else {
        req.isGroupAdmin = false;
        next();
    }
}

function forceGroupAdmin(req, res, next){
    if (!req.isGroupAdmin){
        next(new base.errors.AccessDenied());
    }
    else {
        next();
    }
}

//Routes
function groupControls(req, res, next){
    var locals = {};
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/group", text: "Groups"},
                        {href: "/group/"+req.group.code, text: req.group.code},
                        {href: "/group/"+req.group.code+"/controls", text: "Manage"}];
    locals.group = req.group;
    locals.is_full = true;

    res.render("group/controls", locals);
}

function createForm(req, res, next, locals){
    locals = locals || {messages: {}, errors: false};
    locals.data = locals.data || {};
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/group", text: "Groups"},
                        {href: "/group/create", text: "Create Group"}];

    res.render('group/create', locals);
}

function createProcess(req, res, next){
    var locals = {data: {}, messages: {}, errors: false};
    var api = req.app.set('iapi');

    if (!req.body)
    {
        req.flash('error', 'Unable to process form.');
        createForm(req, res, next, locals);
    }
    else
    {
        var fields = req.body;
        ["name","code","description"].forEach(function (field){
            fields[field] = (fields[field] || "").trim();
        });

        locals.data = fields;
        
        var group = {};
        group.type = "group";
        group.created_at = (new Date()).toISOString();
        group.name = fields.name;
        group.code = fields.code;
        group.description = fields.description;
        group.owners = [req.player._id];
        group.join_type = 'approval';
        
        function afterUnique(){
            var validation = json_schema.validate(group, group_schema);
            if (!validation.valid)
            {
                validation.errors.forEach(function (error){
                    if (locals.messages[error.property]){
                        locals.messages[error.property].push(error.message);
                    }
                    
                });

                locals.errors = true;
            }

            if (locals.errors){
                req.flash('error', 'There were problems saving your group.');
                createForm(req, res, next, locals);
            }
            else
            {
                api.uuids(function (uuids){
                    group._id = uuids[0];
                    
                    api.putDoc(group, function (response){
                        if (response.error)
                        {
                            req.flash('error','Unable to save your group: '+response.error);
                            createForm(req, res, next, locals);
                        }
                        else
                        {
                            req.flash('info','Group created successfully.');
                            res.redirect('controls/'+group.code);
                        }
                    });
                });
            }
        }
        
        api.groupCodes(function (response){
            if (response.rows && response.rows.length){
                if (response.rows.map(function (item){return item[0];}).indexOf(group.code) > -1)
                {
                    locals.errors = true;
                    locals.messages.code.push("must be unique.");
                }
                
                afterUnique();
            }
            else
            {
                afterUnique();
            }
        }); 
    }
}

function joinForm(req, res, next, locals){
    var group = req.group;

    locals = locals || {};
    locals.group = req.group;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/group", text: "Groups"},
                        {href: "/group/"+group.code, text: group.code},
                        {href: "/group/"+group.code+"/join", text: "Join"}];

    res.render('group/join', locals);
}

function joinProcess(req, res, next){
    var api = req.app.set('iapi');
    var locals = locals || {};

    var is_invited = false;
    var invitation_index = false;
    (req.group.invitations || []).forEach(function (member, index){
        if (member.handle == req.player.handle){
            is_invited = true;
            invitation_index = index;
        }
    });

    if (!req.body){
        req.flash('error', 'Unable to process form.');
        joinForm(req, res, next, locals);
    }
    else if (req.group.join_type != "approval" && req.group.join_type != "open" && !is_invited){
        req.flash('error', req.group.name+' is not accepting new member requests.');
        joinForm(req, res, next, locals);
    }
    else {
        var fields = req.body;
        ["alias"].forEach(function (field){
            fields[field] = (fields[field] || "").trim();
        });
        
        var group_members = [];
        (req.group.members || []).forEach(function (member){
            group_members.push(member.alias + "@" + member.handle);
        });

        if (req.player.aliases.indexOf(fields.alias) == -1){
            req.flash('error', 'You must choose one of your own aliases.');
            joinForm(req, res, next, locals);
        }
        else if (group_members.indexOf(fields.alias+"@"+req.player.handle) > -1) {
            req.flash('error', 'You are already a member of '+req.group.name);
            joinForm(req, res, next, locals);
        }
        else {
            var group = req.group;
            group.members = group.members || [];
            group.members.push({
                alias: fields.alias,
                handle: req.player.handle,
                id: req.player._id,
                approved: group.join_type == "open" || is_invited,
                admin: []
            });

            if (is_invited){
                group.invitations.splice(invitation_index, 1);
            }

            api.putDoc(group, function (response){
                if (response.error){
                    req.flash('error', 'Unable to save your join request.');
                    joinForm(req, res, next, locals);
                }
                else {
                    if (group.join_type == "open" || is_invited){
                        req.flash('info', 'You have successfully joined '+group.name);
                    }
                    else {
                        req.flash('info', 'You have successfully applied to join '+group.name);
                    }

                    res.redirect("profile/"+group.code+"/members");
                }
            });

            
        }

    }
}

function leaveProcess(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
    var api = req.app.set('iapi');

    var group = req.group;
    var mship_index;
    var mship_found = false;

    (group.members || []).forEach(function (member, index){
        if (member.id == req.player._id && member.alias.toLowerCase() == req.params.alias.toLowerCase()){
            mship_found = true;
            mship_index = index;
        }
    });

    if (mship_found){
        group.members.splice(mship_index, 1);

        api.putDoc(group, function (response){
            if (response.error){
                res.end(JSON.stringify({ok: false, error: 'Unable to leave the group: '+response.error}));
            }
            else {
                res.end(JSON.stringify({ok: true, info: "Successfully left "+group.name+"."}));
            }
        });
    }
    else {
        res.end(JSON.stringify({ok: false, error: 'Unable to find that group membership record.'}));
    }
        
}

function declineProcess(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
    var api = req.app.set('iapi');

    var group = req.group;
    var invite_index;
    var invite_found = false;

    (group.invitations || []).forEach(function (invite, index){
        if (invite.id == req.player._id){
            invite_found = true;
            invite_index = index;
        }
    });

    if (invite_found){
        group.invitations.splice(invite_index, 1);

        api.putDoc(group, function (response){
            if (response.error){
                res.end(JSON.stringify({ok: false, error: 'Unable to decline the invitation: '+response.error}));
            }
            else {
                res.end(JSON.stringify({ok: true, info: "Successfully declined the invitation to "+group.name+"."}));
            }
        });
    }
    else {
        res.end(JSON.stringify({ok: false, error: 'Unable to find that group invitation record.'}));
    }
}

function displayProfile(req, res, next){
    var api = req.app.set('iapi');
    var group = req.group;

    var crumbs = [{href: "/", text: "Home"},
                    {href: "/group", text: "Groups"},
                    {href: "/group/"+group.code, text: group.code},
                    {href: "/group/"+group.code+"/profile", text: "Profile"}];

    var description = markdown.parse(group.description || "");
    var member_count = 0;
    (group.members || []).forEach(function (member){
        if (member.approved){
            member_count++;
        }
    });
    var owners = [];

    base.util.inParallel(
        function (callback){
            api.ownersByGroup({key: group.code, include_docs: true}, function (response){
                if (response.rows){
                    owners = us._(response.rows).pluck('doc');
                }

                callback();
            });
        },
        function (){
            res.render("group/profile", {group: group, gdescription: description, owners: owners, crumbs: crumbs, editable: req.isGroupAdmin, member_count: member_count});
        }
    );
}

function editForm(req, res, next, locals){
    locals = locals || {messages: {}, errors: false};
    locals.data = locals.data || {
        name: req.group.name,
        description: req.group.description,
        join_type: req.group.join_type,
        website: req.group.website,
        logo: req.group.logo
    };
    locals.group = req.group;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/group", text: "Groups"},
                        {href: "/group/"+req.group.code, text: req.group.code},
                        {href: "/group/"+req.group.code+"/controls", text: "Manage"},
                        {href: "/group/"+req.group.code+"/controls/edit", text: "Edit Info"}];

    res.render('group/edit', locals);
}

function editProcess(req, res, next){
    var locals = {data: {}, messages: {}, errors: false};
    var api = req.app.set('iapi');

    if (!req.body)
    {
        req.flash('error', 'Unable to process form.');
        editForm(req, res, next, locals);
    }
    else
    {
        var group = req.group;

        var fields = req.body;
        ["name","website","logo","join_type","description"].forEach(function (field){
            fields[field] = (fields[field] || "").trim();
            locals.messages[field] = []
        });

        locals.data = fields;

        group.name = fields.name;
        group.description = fields.description;
        group.join_type = fields.join_type;
        group.website = fields.website;
        group.logo = fields.logo;

        var validation = json_schema.validate(group, group_schema);
        if (!validation.valid)
        {
            validation.errors.forEach(function (error){
                if (locals.messages[error.property])
                    locals.messages[error.property].push(error.message);
            });

            locals.errors = true;
            req.flash('error', 'There were problems saving your group information.');

            editForm(req, res, next, locals);
        }
        else
        {
            api.putDoc(group, function (response){
                if (response.error)
                {
                    locals.errors = true;
                    req.flash('error','Unable to save your group information: '+response.error);
                    editForm(req, res, next, locals);
                }
                else
                {
                    req.flash('info','Group information saved successfully.');
                    res.redirect('controls/'+group.code);
                }
            });
        }
    }
}

function membersForm(req, res, next){
    var group = req.group;
    var crumbs = [{href: "/", text: "Home"},
                    {href: "/group", text: "Groups"},
                    {href: "/group/"+group.code, text: group.code},
                    {href: "/group/"+group.code+"/controls", text: "Manage"},
                    {href: "/group/"+encodeURI(group.code)+"/controls/members", text: "Current Members"}];

    var locals = {
        group: group,
        crumbs: crumbs,
        members: []
    };

    (group.members || []).forEach(function (member){
        if (member.approved){
            locals.members.push(member);
        }
    });

    locals.members.sort(function (a, b){
        if (a.handle.toLowerCase() == b.handle.toLowerCase()){
            return a.alias.toLowerCase() < b.alias.toLowerCase() ? -1 : 1;
        }
        else {
            return a.handle.toLowerCase() < b.handle.toLowerCase() ? -1 : 1;
        }
    });

    res.render("group/members", locals);
}

function pendingForm(req, res, next){
    var group = req.group;
    var crumbs = [{href: "/", text: "Home"},
                    {href: "/group", text: "Groups"},
                    {href: "/group/"+group.code, text: group.code},
                    {href: "/group/"+group.code+"/controls", text: "Manage"},
                    {href: "/group/"+encodeURI(group.code)+"/controls/requests", text: "Membership Requests"}];

    var locals = {
        group: group,
        crumbs: crumbs,
        pending_requests: []
    };

    (group.members || []).forEach(function (member){
        if (!member.approved){
            locals.pending_requests.push(member);
        }
    });

    locals.pending_requests.sort(function (a, b){
        if (a.handle.toLowerCase() == b.handle.toLowerCase()){
            return a.alias.toLowerCase() < b.alias.toLowerCase() ? -1 : 1;
        }
        else {
            return a.handle.toLowerCase() < b.handle.toLowerCase() ? -1 : 1;
        }
    });

    res.render("group/requests", locals);
}

function inviteForm(req, res, next){
    var group = req.group;
    var crumbs = [{href: "/", text: "Home"},
                    {href: "/group", text: "Groups"},
                    {href: "/group/"+group.code, text: group.code},
                    {href: "/group/"+group.code+"/controls", text: "Manage"},
                    {href: "/group/"+encodeURI(group.code)+"/controls/invites", text: "Invitations"}];

    var locals = {
        group: group,
        crumbs: crumbs,
        invites: []
    };

    locals.invites = group.invitations || [];
    locals.invites.sort(function (a, b){
        return a.handle.toLowerCase() < b.handle.toLowerCase() ? -1 : 1;
    });

    res.render("group/invites", locals);
}

function displaySearch(req, res, next){
    var api = req.app.set('iapi');
    next(new base.errors.NotFound());
}

function processSearch(req, res, next){
    var api = req.app.set('iapi');
    next(new base.errors.NotFound());
}