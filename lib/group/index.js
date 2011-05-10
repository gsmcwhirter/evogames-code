var base = require('../base'),
    json_schema = require('../json-schema'),
    group_schema = require('./schema').group;

module.exports.urls = function (_base){
    return function (app){
        app.get(_base + "/create", createForm);

        app.post(_base + "/create", createProcess);
    };
}

function createForm(req, res, next, locals){
    if (!req.player)
    {
        next(new base.errors.NotLoggedIn());
    }
    else
    {
        locals = locals || {};
        locals.data = locals.data || {};
        locals.crumbs = [{href: "/", text: "Home"},
                            {href: "/group", text: "Groups"},
                            {href: "/group/create", text: "Create Group"}];
        
        res.render('group/create', locals);
    }
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
