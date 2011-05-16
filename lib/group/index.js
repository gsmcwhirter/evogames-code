var base = require('../base'),
    json_schema = require('../json-schema'),
    group_schema = require('./schema').group,
    markdown = require('discount'),
    us = require('underscore');

var app = module.exports = base.createServer();

app.get("/", base.page('group/index', [{href: "/", text: "Home"}, {href: "/group", text: "Groups"}]));

app.get("/search", displaySearch);
app.post("/search", processSearch);

app.get("/profile/:code", displayProfile);

app.get("/create", base.middleware.loginCheck, createForm);
app.post("/create", base.middleware.loginCheck, createProcess);

app.get("/controls", base.middleware.loginCheck, groupControlsAll);

app.get("/controls/:code", base.middleware.loginCheck, groupControlsSingle);

app.get("/controls/:code/edit", base.middleware.loginCheck, editForm);
app.post("/controls/:code/edit", base.middleware.loginCheck, editProcess);

app.get("/controls/:code/pending", base.middleware.loginCheck, pendingForm);

app.get("/controls/:code/members", base.middleware.loginCheck, membersForm);

app.get("/controls/:code/invite", base.middleware.loginCheck, inviteForm);

app.param('code', function(req, res, next, code){
    var api = req.app.set('iapi');

    api.groupCodes({include_docs: true, startkey: [code.toLowerCase()], endkey: [code.toLowerCase(), code.toUpperCase()]}, function (response){
        if (!response.errors && response.rows.length){
            req.group = response.rows[0].doc;
            next();
        }
        else {
            next(new base.errors.NotFound());
        }
    });
});

function groupControlsAll(req, res, next){
    var api = req.app.set('iapi');

    var locals = {
        crumbs: [{href: "/", text: "Home"}, {href: "/group", text: "Groups"}, {href: "/group/controls", text: "Manage"}],
        ogroups: [],
        agroups: []
    };

    base.util.inParallel(
        function (callback){
            api.groupsByOwner({key: req.player._id, include_docs: true}, function (response){
                if (response.rows){
                    locals.ogroups = us._(response.rows).pluck('doc');
                }

                callback();
            });
        },
        function (){
            res.render("group/controls", locals);
        }
    );

}

function groupControlsSingle(req, res, next){
    var locals = {};
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/group", text: "Groups"},
                        {href: "/group/controls", text: "Manage"},
                        {href: "/group/controls/"+req.group.code, text: req.group.code}];
    locals.group = req.group;
    locals.is_full = true;

    res.render("group/group_controls", locals);
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
                    if (locals.messages[error.property])
                        locals.messages[error.property].push(error.message);
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
                if (response.rows.map(function (item){ return item[0]; }).indexOf(group.code) > -1)
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

function displayProfile(req, res, next){
    var api = req.app.set('iapi');
    var group = req.group;

    var crumbs = [{href: "/", text: "Home"},
                    {href: "/group", text: "Groups"},
                    {href: "/group/profile", text: "Profiles"},
                    {href: "/group/profile/"+encodeURI(group.code), text: group.code}];

    var description = markdown.parse(group.description || "");
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
            res.render("group/profile", {group: group, gdescription: description, owners: owners, crumbs: crumbs});
        }
    );
}

function editForm(req, res, next, locals){
    locals = locals || {messages: {}, errors: false};
    locals.data = locals.data || {
        name: req.group.name,
        description: req.group.description,
        join_type: req.group.join_type,
        website: req.group.website
    };
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/group", text: "Groups"},
                        {href: "/group/controls", text: "Manage"},
                        {href: "/group/controls/"+req.group.code, text: req.group.code},
                        {href: "/group/controls/"+req.group.code+"/edit", text: "Edit Info"}];

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
        ["name","website","join_type","description"].forEach(function (field){
            fields[field] = (fields[field] || "").trim();
            locals.messages[field] = []
        });

        locals.data = fields;

        group.name = fields.name;
        group.description = fields.description;
        group.join_type = fields.join_type;
        group.website = fields.website;

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
    next(new base.errors.NotFound());
}

function pendingForm(req, res, next){
    next(new base.errors.NotFound());
}

function inviteForm(req, res, next){
    next(new base.errors.NotFound());
}

function displaySearch(req, res, next){
    var api = req.app.set('iapi');
    next(new base.errors.NotFound());
}

function processSearch(req, res, next){
    var api = req.app.set('iapi');
    next(new base.errors.NotFound());
}