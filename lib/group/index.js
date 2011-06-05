var base = require('../base'),
    parsers = require("./parsers"),
    mw = require("./middleware"),
    json_schema = require('../json-schema'),
    group_schema = require('./schema').group,
    markdown = require('discount');

var app = module.exports = base.createServer();

app.get("/", showDirectory);

app.get("/create", base.auth.loginCheck, createForm);
app.post("/create", base.auth.loginCheck, createProcess);

app.get("/:code", displayProfile);

app.get("/:code/join", base.auth.loginCheck, joinForm);
app.post("/:code/join", base.auth.loginCheck, joinProcess);

app.del("/:code/decline", base.auth.loginCheckAjax, declineProcess);
app.del("/:code/leave/:alias", base.auth.loginCheckAjax, leaveProcess);

app.get("/:code/controls", base.auth.loginCheck, mw.forceGroupAdmin(), groupControls);

app.get("/:code/controls/edit", base.auth.loginCheck, mw.forceGroupAdmin("edit"), editForm);
app.post("/:code/controls/edit", base.auth.loginCheck, mw.forceGroupAdmin("edit"), editProcess);

app.get("/:code/controls/owners", base.auth.loginCheck, mw.forceGroupOwner, ownersForm);
app.put("/:code/controls/owners/add", base.auth.loginCheck, mw.forceGroupOwner, addOwner);
app.del("/:code/controls/owners/resign", base.auth.loginCheck, mw.forceGroupOwner, resignOwnership);

app.get("/:code/controls/requests", base.auth.loginCheck, mw.forceGroupAdmin("requests"), pendingForm);
app.del("/:code/controls/requests/:alias@:handle/approve", base.auth.loginCheck, mw.forceGroupAdminAjax("requests"), approvePending);
app.del("/:code/controls/requests/:alias@:handle/deny", base.auth.loginCheck, mw.forceGroupAdminAjax("requests"), denyPending);

app.get("/:code/controls/members", base.auth.loginCheck, mw.forceGroupAdmin("members"), membersForm);
app.get("/:code/controls/members/:alias@:handle", base.auth.loginCheck, mw.forceGroupAdmin("members"), permissionsForm);
app.post("/:code/controls/members/:alias@:handle", base.auth.loginCheck, mw.forceGroupAdmin("members"), permissionsProcess);
app.del("/:code/controls/members/:alias@:handle/remove", base.auth.loginCheck, mw.forceGroupAdminAjax("members"), removeMember);

app.get("/:code/controls/invites", base.auth.loginCheck, mw.forceGroupAdmin("invites"), inviteForm);
app.put("/:code/controls/invites/add", base.auth.loginCheck, mw.forceGroupAdminAjax("invites"), addInvite);
app.del("/:code/controls/invites/@:handle", base.auth.loginCheck, mw.forceGroupAdminAjax("invites"), withdrawInvite);

app.param('code', parsers.codeParser);

//Routes
function groupControls(req, res, next){
    var locals = {};
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/group", text: "Groups"},
                        {href: "/group/"+req.group.code, text: req.group.code},
                        {href: "/group/"+req.group.code+"/controls", text: "Manage"}];
    locals.group = req.group;
    locals.is_owner = req.groupAdmin.owner;
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
            locals.messages[field] = [];
        });

        locals.data = fields;
        
        var group = {};
        group.type = "group";
        group.created_at = (new Date()).toISOString();
        group.name = fields.name;
        group.code = fields.code;
        group.description = fields.description;
        group.owners = [req.player.handle];
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
                group._id = "group-"+base.util.slugify(group.code);
                
                api.putDoc(group, function (response){
                    if (response.error)
                    {
                        req.flash('error','Unable to save your group: '+response.error);
                        createForm(req, res, next, locals);
                    }
                    else
                    {
                        req.flash('info','Group created successfully.');
                        res.redirect(group.code+'/controls');
                    }
                });
            }
        }
        
        api.groups.codes(function (response){
            if (response.rows && response.rows.length){
                if (response.rows.map(function (item){return item.key;}).indexOf(group.code.toLowerCase()) > -1)
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
            req.flash('error', 'That alias is already a member of '+req.group.name);
            joinForm(req, res, next, locals);
        }
        else {
            var group = base.util.clone(req.group);
            
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

                    res.redirect(group.code);
                }
            });

            
        }

    }
}

function leaveProcess(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
    var api = req.app.set('iapi');

    var group = base.util.clone(req.group);
    
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

    var group = base.util.clone(req.group);
    
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
    var group = req.group;

    var crumbs = [{href: "/", text: "Home"},
                    {href: "/group", text: "Groups"},
                    {href: "/group/"+group.code, text: group.code}];

    var description = markdown.parse(group.description || "(no description)\n");
    var member_count = 0;
    (group.members || []).forEach(function (member){
        if (member.approved){
            member_count++;
        }
    });
    var owners = group.owners || [];

    res.render("group/profile", {group: group, gdescription: description, owners: owners, crumbs: crumbs, editable: req.groupAdmin, member_count: member_count});
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
        var group = base.util.clone(req.group);
        

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
                    res.redirect(group.code+'/controls');
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

function permissionsForm(req, res, next, locals){
    locals = locals || {};
    var alias = req.params.alias;
    var handle = req.params.handle;

    locals.crumbs = [{href: "/", text: "Home"},
                    {href: "/group", text: "Groups"},
                    {href: "/group/"+req.group.code, text: req.group.code},
                    {href: "/group/"+req.group.code+"/controls", text: "Manage"},
                    {href: "/group/"+encodeURI(req.group.code)+"/controls/members", text: "Members"},
                    {href: "/group/"+encodeURI(req.group.code)+"/controls/members/"+alias+"@"+handle, text: alias+"@"+handle}];
    locals.group = req.group;

    var found_member_index = -1;
    (req.group.members || []).forEach(function (member, index){
        if (member.approved && member.alias.toLowerCase() == alias.toLowerCase() && member.handle.toLowerCase() == handle.toLowerCase()){
            found_member_index = index;
        }
    });

    if (found_member_index > -1){
        locals.member = req.group.members[found_member_index];
        locals.member.privs = {
            edit: false,
            requests: false,
            members: false,
            invites: false,
            events: false
        };

        (locals.member.admin || []).forEach(function (admin){
            locals.member.privs[admin] = true;
        });

        res.render("group/privileges", locals);
    }
    else {
        req.flash('error','Unable to locate the requested member record.');
        res.redirect(req.group.code+"/controls/members");
    }
}

function permissionsProcess(req, res, next){
    var api = req.app.set('iapi');
    var locals = locals || {};
    var alias = req.params.alias;
    var handle = req.params.handle;

    if (!req.body){
        req.flash('error','parse error');
        permissionsForm(req, res, next, locals);
    }
    else {
        var found_member_index = -1;
        (req.group.members || []).forEach(function (member, index){
            if (member.approved && member.alias.toLowerCase() == alias.toLowerCase() && member.handle.toLowerCase() == handle.toLowerCase()){
                found_member_index = index;
            }
        });

        if (found_member_index > -1){
            //var member = req.group.members[found_member_index];
            var privs = [];
            (["edit","requests","members","invites","events"]).forEach(function (type){
                if (req.body['admin-'+type] && req.body['admin-'+type] == "1"){
                    privs.push(type);
                }
            });

            var group = base.util.clone(req.group);
            
            group.members[found_member_index].admin = privs;

            api.putDoc(group, function (response){
                if (response.error){
                    req.flash('error', 'Unable to save the member privileges: '+response.error);
                    privilegesForm(req, res, next, locals);
                }
                else {
                    req.flash('info', "Member privilges saved successfully.");
                    res.redirect(req.group.code+"/controls/members/"+alias+"@"+handle);
                }
            });
        }
        else {
            req.flash('error', 'That membership record was not found.');
            privilegesForm(req, res, next, locals);
        }
    }
}

function addInvite(req, res, next){
    var api = req.app.set('iapi');

    res.writeHead(200, {"Content-type": "application/json"});
    if (!req.body || !req.body.handle)
    {
        res.end(JSON.stringify({ok: false, error: "parse error"}));
    }
    else
    {
        api.players.handles({key: req.body.handle.toLowerCase()}, function (response){
            if (response.error || !response.rows || !response.rows.length){
                res.end(JSON.stringify({ok: false, error: "Unable to find a player with that handle."}));
            }
            else {
                var invite_exists = false;
                (req.group.invitations || []).forEach(function (invite){
                    if (invite.handle.toLowerCase() == req.body.handle.toLowerCase()){
                        invite_exists = true;
                    }
                });

                if (invite_exists){
                    res.end(JSON.stringify({ok: false, error: 'That player already has an invite.'}));
                }
                else {
                    var group = base.util.clone(req.group);
                    
                    group.invitations = group.invitations || [];
                    group.invitations.push({handle: req.body.handle, id: response.rows[0].id});
                    api.putDoc(group, function (response){
                        if (response.error){
                            res.end(JSON.stringify({ok: false, error: "Unable to save the invitation: "+response.error}));
                        }
                        else {
                            res.end(JSON.stringify({ok: true, info: "Invitation successfully saved."}));
                        }
                    });
                }
            }
        });
    }
}

function withdrawInvite(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
    var api = req.app.set('iapi');

    var handle = req.params.handle;
    var invite_index = -1;

    (req.group.invitations || []).forEach(function (invite, index){
        if (invite.handle.toLowerCase() == handle.toLowerCase()){
            invite_index = index;
        }
    });

    if (invite_index > -1){
        var group = base.util.clone(req.group);
        
        group.invitations.splice(invite_index, 1);

        api.putDoc(group, function (response){
            if (response.error){
                res.end(JSON.stringify({ok: false, error: 'Unable to withdraw the invitation: '+response.error}));
            }
            else {
                res.end(JSON.stringify({ok: true, info: "Successfully withdrew the invitation to "+req.group.name+"."}));
            }
        });
    }
    else {
        res.end(JSON.stringify({ok: false, error: 'Unable to find that group invitation record.'}));
    }
}

function approvePending(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
    var api = req.app.set('iapi');

    var alias = req.params.alias;
    var handle = req.params.handle;

    var member_index = -1;

    (req.group.members || []).forEach(function (member, index){
        if (member.handle.toLowerCase() == handle.toLowerCase() && member.alias.toLowerCase() == alias.toLowerCase()){
            member_index = index;
        }
    });

    if (member_index > -1){
        var group = base.util.clone(req.group);
        
        group.members[member_index].approved = true;

        api.putDoc(group, function (response){
            if (response.error){
                res.end(JSON.stringify({ok: false, error: 'Unable to approve the request: '+response.error}));
            }
            else {
                res.end(JSON.stringify({ok: true, info: "Successfully approved the membership request from <span class='alias'>"+alias+"</span><span class='handle'>@"+handle+"</span>."}));
            }
        });
    }
    else {
        res.end(JSON.stringify({ok: false, error: 'Unable to find that membership request.'}));
    }
}

function denyPending(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
    var api = req.app.set('iapi');

    var alias = req.params.alias;
    var handle = req.params.handle;
    var mship_index = -1;

    (req.group.members || []).forEach(function (member, index){
        if (!member.approved && member.handle.toLowerCase() == handle.toLowerCase() && member.alias.toLowerCase() == alias.toLowerCase()){
            mship_index = index;
        }
    });

    if (mship_index > -1){
        var group = base.util.clone(req.group);
        
        group.members.splice(mship_index, 1);

        api.putDoc(group, function (response){
            if (response.error){
                res.end(JSON.stringify({ok: false, error: 'Unable to deny the request: '+response.error}));
            }
            else {
                res.end(JSON.stringify({ok: true, info: "Successfully denied the membership request from <span class='alias'>"+alias+"</span><span class='handle'>@"+handle+"</span>."}));
            }
        });
    }
    else {
        res.end(JSON.stringify({ok: false, error: 'Unable to find that membership request.'}));
    }
}

function removeMember(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
    var api = req.app.set('iapi');

    var alias = req.params.alias;
    var handle = req.params.handle;
    var mship_index = -1;

    (req.group.members || []).forEach(function (member, index){
        if (member.approved && member.handle.toLowerCase() == handle.toLowerCase() && member.alias.toLowerCase() == alias.toLowerCase()){
            mship_index = index;
        }
    });

    if (mship_index > -1){
        var group = base.util.clone(req.group);
        
        group.members.splice(mship_index, 1);

        api.putDoc(group, function (response){
            if (response.error){
                res.end(JSON.stringify({ok: false, error: 'Unable to remove the member: '+response.error}));
            }
            else {
                res.end(JSON.stringify({ok: true, info: "Successfully removed <span class='alias'>"+alias+"</span><span class='handle'>@"+handle+"</span> from the group."}));
            }
        });
    }
    else {
        res.end(JSON.stringify({ok: false, error: 'Unable to find membership record.'}));
    }
}

function showDirectory(req, res, next){
    var api = req.app.set('iapi');

    var locals = {
        groups: [],
        letters: [ 'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','other'],
        crumbs: [{href: "/", text: "Home"},
                 {href: "/group", text: "Groups"}]
    };

    api.groups.names({include_docs: true}, function (response){
        if (response.error){
            req.flash('error', 'Unable to retrieve a list of groups.');
        }
        else {
            var grps = response.rows.map(function (row){return row.doc;});
            var tmpgrp = [];
            var curletter = false;
            var curindex = -1;
            var nextletter;
            var nextindex;

            grps.forEach(function (group){
                nextletter = group.name[0].toLowerCase();
                if (nextletter != curletter){
                    if (curletter){
                        locals.groups.push(tmpgrp);
                        tmpgrp = [];
                    }

                    nextindex = locals.letters.indexOf(nextletter);
                    if (nextindex > -1){
                        curletter = nextletter;
                    }
                    else {
                        curletter = "other";
                        nextindex = 26;
                    }

                    for (var i = curindex; i < nextindex - 1; i++){
                        locals.groups.push([]);
                    }

                    curindex = nextindex;
                }

                tmpgrp.push(group);
            });

            locals.groups.push(tmpgrp);

            for (var j = curindex; j < 26; j++){
                locals.groups.push([]);
            }

        }

        res.render("group/index", locals);
    });
}

function ownersForm(req, res, next){
    var group = req.group;
    var crumbs = [{href: "/", text: "Home"},
                    {href: "/group", text: "Groups"},
                    {href: "/group/"+group.code, text: group.code},
                    {href: "/group/"+group.code+"/controls", text: "Manage"},
                    {href: "/group/"+encodeURI(group.code)+"/controls/owners", text: "Owners"}];

    var locals = {
        group: group,
        crumbs: crumbs,
        owners: group.owners || []
    };

    res.render("group/owners", locals);
}

function addOwner(req, res, next){
    var api = req.app.set('iapi');

    res.writeHead(200, {"Content-type": "application/json"});
    if (!req.body || !req.body.handle)
    {
        res.end(JSON.stringify({ok: false, error: "parse error"}));
    }
    else
    {
        api.players.handles({key: req.body.handle.toLowerCase()}, function (response){
            if (response.error || !response.rows || !response.rows.length){
                res.end(JSON.stringify({ok: false, error: "Unable to find a player with that handle."}));
            }
            else {
                var owner_exists = false;
                (req.group.owners || []).forEach(function (owner){
                    if (owner.toLowerCase() == response.rows[0].handle.toLowerCase()){
                        owner_exists = true;
                    }
                });

                if (owner_exists){
                    res.end(JSON.stringify({ok: false, error: 'That player is already a group owner.'}));
                }
                else {
                    var group = base.util.clone(req.group);
                    
                    group.owners.push(response.rows[0].handle);
                    
                    api.putDoc(group, function (response){
                        if (response.error){
                            res.end(JSON.stringify({ok: false, error: "Unable to add the player as an owner: "+response.error}));
                        }
                        else {
                            res.end(JSON.stringify({ok: true, info: "Player successfully added as an owner."}));
                        }
                    });
                }
            }
        });
    }
}

function resignOwnership(req, res, next){
    res.writeHead(200, {"Content-type": "application/json"});
    var api = req.app.set('iapi');

    var owner_index = -1;

    (req.group.owners || []).forEach(function (owner, index){
        if (owner.toLowerCase() == req.player.handle.toLowerCase()){
            owner_index = index;
        }
    });

    if (owner_index > -1){
        var group = base.util.clone(req.group);
        
        group.owners.splice(owner_index, 1);

        if (group.owners.length < 1){
            res.end(JSON.stringify({ok: false, error: 'You cannot resign group ownership if you are the last owner.'}));
        }
        else {
            api.putDoc(group, function (response){
                if (response.error){
                    res.end(JSON.stringify({ok: false, error: 'Unable to resign ownership: '+response.error}));
                }
                else {
                    res.end(JSON.stringify({ok: true, info: "Successfully resigned ownership of "+req.group.name+"."}));
                }
            });
        }
    }
    else {
        res.end(JSON.stringify({ok: false, error: 'You are not a group owner.'}));
    }
}