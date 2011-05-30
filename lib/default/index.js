var base = require('../base'),
    json_schema = require('../json-schema'),
    login_schema = require('./schema').login_token,
    us = require('underscore');

var app = module.exports = base.createServer();

app.get("/", index);
app.get("/tos", base.page('default/tos', [{href: "/", text: "Home"}, {href: "/tos", text: "Terms of Service"}]));
app.get("/about", base.page('default/about', [{href: "/", text: "Home"}, {href: "/about", text: "About"}]));
app.get("/privacy", base.page('default/privacy', [{href: "/", text: "Home"}, {href: "/privacy", text: "Privacy Policy"}]));
app.get("/contact", base.page('default/contact', [{href: "/", text: "Home"}, {href: "/contact", text: "Contact Information"}]));

app.get("/login", base.auth.logoutCheck, loginForm);
app.post("/login", base.auth.logoutCheck, loginProcess);

app.get("/logout", logoutProcess);
app.post("/logout", logoutProcess);

function index(req, res, next){
    var articles = [];
    var registrations = [];
    var groups = [];
    var api = req.app.set('iapi');

    var crumbs = [
        {href: "/", text: "Home"}
    ];

    base.util.inParallel(
        function (callback){
            api.publishedArticles({include_docs: true, descending: true, limit: 10}, function (response){
                if (response.rows)
                {
                    articles = us._(response.rows).pluck('doc');
                }

                callback();
            });
        },
        function (callback){
            api.recentRegistrations({include_docs: true, descending: true, limit: 10}, function (response){
                if (response.rows)
                {
                    registrations = us._(response.rows).pluck('doc');
                }

                callback();
            });
        },
        function (callback){
            api.recentGroups({include_docs: true, descending: true, limit: 10}, function (response){
                if (response.rows){
                    groups = us._(response.rows).pluck('doc');
                }

                callback();
            })
        },
        function (){
            res.render('default/index', {crumbs: crumbs, articles: articles, registrations: registrations, groups: groups});
        }
    );
    
}

function loginForm(req, res, next, locals){
    var api = req.app.set('iapi');
    
    locals = locals || {messages: {}, data: {}, referrer: req.headers.referer || req.headers.referrer || "/", errors: false};
    locals.referrer = locals.referrer || "/";
    locals.crumbs = [
        {href: "/", text: "Home"},
        {href: "/login", text: "Log In"}
    ];

    locals.description = "Please fill in the form to the left in order to log in.";

    res.render('default/login', locals);
}



function loginProcess(req, res, next){
    var api = req.app.set('iapi');

    var locals = {messages: {}, data: {}, errors: false};

    if (!req.body)
    {
        locals.errors = true;
        req.flash('error', 'Unable to process form contents.');

        loginForm(req, res, next, locals);
    }
    else
    {
        var config = req.app.set('sys config');
        var fields = req.body || {};

        ['email','password','remember_me'].forEach(function (item){
            fields[item] = fields[item] ? fields[item].trim() : "";
            locals.messages[item] = [];
        });

        locals.data = fields;
        locals.referrer = fields.referrer || "/";

        api.emailList({include_docs: true, key: fields.email.toLowerCase()}, function (response){
            if (response.errors || !response.rows.length)
            {
                locals.errors = true;
                req.flash('error', 'E-mail and password combination were not valid.');

                loginForm(req, res, next, locals);
            }
            else
            {
                var record = response.rows.length ? response.rows[0] : null;

                var maxtries = (record &&
                                 record.doc.login_tries &&
                                 parseInt(record.doc.login_tries) >= 5);

                var lodate;
                if (record.doc.login_last_try){
                    lodate = new Date(record.doc.login_last_try);
                }
                else {
                    lodate = new Date();
                }

                var lockedout = (maxtries &&
                                 lodate.getTime() + 3600 >= (new Date()).getTime());

                var badpass = record.doc.password != base.util.sha1_hex(fields.password + record.doc.salt);

                if (!record ||
                        !record.doc.email_history ||
                        !record.doc.email_history.length ||
                        lockedout ||
                        badpass)
                {
                    function done(response){
                        if (response && response.errors){
                            req.flash('error', 'There was an unexpected problem.');
                        }

                        loginForm(req, res, next, locals);
                    }

                    locals.errors = true;
                    if (lockedout){
                        req.flash('error', 'That account is currently locked.');
                        done();
                    }
                    else if (badpass){
                        req.flash('error', 'E-mail and password combination were not valid.');

                        if (maxtries){
                            record.doc.login_tries = 0;
                        }

                        record.doc.login_tries = (parseInt(record.doc.login_tries) || 0) + 1;
                        record.doc.login_last_try = (new Date()).toISOString();
                        api.putDoc(record.doc, done);
                    }
                    else {
                        req.flash('error', 'E-mail and password combination were not valid.');
                        done();
                    }
                }
                else
                {
                    //valid login -- try to save it
                    function savetoken(response){
                        if (response && response.errors){
                            req.flash('error','There was an unexpected problem.');
                        }

                        var login_token = {};
                        login_token.type = "login_token";
                        login_token.created_at = (new Date()).toISOString();
                        login_token.player = record.doc._id;

                        api.uuids(function (uuids){
                            login_token._id = uuids[0];
                            login_token.token = login_token._id;

                            var validation = json_schema.validate(login_token, login_schema);
                            if (!validation.valid)
                            {
                                locals.errors = true;
                                req.flash('error', 'Unable to validate login token format.');

                                loginForm(req, res,next, locals);
                            }
                            else
                            {
                                api.putDoc(login_token, function (response){
                                    if (response.error)
                                    {
                                        locals.errors = true;
                                        req.flash('error', 'Unable to save login token: '+response.error);

                                        loginForm(req, res, next, locals);
                                    }
                                    else
                                    {
                                        req.flash('info', 'You have successfully logged in.');
                                        var expires = false;
                                        if (fields.remember_me == "yes")
                                        {
                                            expires = new Date();
                                            expires.setDate(expires.getDate() + 30);
                                        }

                                        var host = req.headers.host.split(":")[0];
                                        var hparts = host.split(".");
                                        if (hparts.length > 2) hparts = hparts.slice(-2);
                                        host = "."+hparts.join(".");
                                        if (host == ".localhost") host = false;

                                        res.cookie(config.login_cookie, login_token.token, {expires: expires, path: "/", host: host, httponly: true, secure: host ? true : false});
                                        res.redirect(base.util.safeRedirect(locals.referrer || "/"));
                                    }
                                });
                            }

                        });
                    }

                    if (record.doc.login_tries > 0){
                        record.doc.login_tries = 0;
                        record.doc.login_last_try = (new Date()).toISOString();
                        api.putDoc(record.doc, savetoken);
                    }
                    else {
                        savetoken();
                    }
                }
            }
        });
    }
}

function logoutProcess(req, res, next, locals){
    var api = req.app.set('iapi');
    var config = req.app.set('sys config');

    var lcookie = false;
    if (req.cookies && req.cookies[config.login_cookie.toLowerCase()])
    {
        lcookie = req.cookies[config.login_cookie.toLowerCase()];
        res.clearCookie(config.login_cookie);
    }

    if (lcookie)
    {
        api.getDoc(lcookie, function (response){
            if (response.type == "login_token")
            {
                api.delDoc(response, function (response){
                    if (response.error)
                    {
                        req.flash('error', response.error);
                    }
                    else
                    {
                        req.flash('info', 'You have been successfully logged out.');
                    }

                    res.redirect(base.util.safeRedirect(req.headers.referer || req.headers.referrer || "/"));
                });
            }
        });
    }
    else
    {
        res.redirect(base.util.safeRedirect(req.headers.referer || req.headers.referrer || "/"));
    }
}