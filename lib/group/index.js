var base = require('../base'),
    json_schema = require('../json-schema'),
    group_schema = require('./schema').group,
    markdown = require('discount'),
    us = require('underscore');

var app = module.exports = base.createServer();

app.get("/create", base.middleware.loginCheck, createForm);
app.post("/create", base.middleware.loginCheck, createProcess);

app.get("/search", displaySearch);
app.post("/search", processSearch);

app.get("/", base.page('group/index', [{href: "/", text: "Home"}, {href: "/group", text: "Groups"}]));

app.get("/profile/:code", displayProfile);

app.get("/profile/:code/edit", base.middleware.loginCheck, editForm);
app.post("/profile/:code/edit", base.middleware.loginCheck, editProcess);

app.get("/controls", base.middleware.loginCheck, base.page('group/controls', [{href: "/", text: "Home"}, {href: "/group/controls", text: "Manage Groups"}]));

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

function createForm(req, res, next, locals){
    locals = locals || {};
    locals.data = locals.data || {};
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/group", text: "Groups"},
                        {href: "/group/create", text: "Create Group"}];

    res.render('group/create', locals);
}

function createProcess(req, res, next){
    var locals = {data: {}};
    var api = req.app.set('iapi');

    if (!req.player)
    {
        next(new base.errors.NotLoggedIn());
    }
    else if (!req.body)
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
        
        var group = {};
        group.type = "group";
        group.created_at = (new Date()).toISOString();
        group.name = fields.name;
        group.code = fields.code;
        group.description = fields.description;
        group.owners = [req.player._id];
        
        function afterUnique(){
            var validation = json_schema.validate(group, group_schema);
            if (!validation.valid)
            {
                validation.errors.forEach(function (error){
                    req.flash('error', error.property+" "+error.message);
                });
                
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
                            res.redirectMeTo('/player/groups');
                        }
                    });
                });
            }
        }
        
        api.groupCodes(function (response){
            if (response.rows && response.rows.length){
                if (response.rows.map(function (item){ return item[0]; }).indexOf(group.code) > -1)
                {
                    req.flash('error','Group code must be unique.');
                    createForm(req, res, next, locals);
                }
                else
                {
                    afterUnique();
                }
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
    var group;

    if (req.group){
        group = req.group;

        var crumbs = [{href: "/", text: "Home"},
                        {href: "/group", text: "Groups"},
                        {href: "/group/profile", text: "Profiles"},
                        {href: "/group/profile/"+encodeURI(group.code), text: group.code}];

        var description = markdown.parse(group.description || "");

        api.ownersByGroup({key: group.code, include_docs: true}, function (response){
            var owners;
            if (response.rows){
                owners = us._(response.rows).pluck('doc');
            }
            else {
                owners = [];
            }

            res.render("group/profile", {group: group, gdescription: description, owners: owners, crumbs: crumbs});
        });
    }
    else {
        res.redirect("search");
    }
}

function editForm(req, res, next){


}

function editProcess(req, res, next){

}

function displaySearch(req, res, next){
    var api = req.app.set('iapi');
    next(new base.errors.NotFound());
}

function processSearch(req, res, next){
    var api = req.app.set('iapi');
    next(new base.errors.NotFound());
}