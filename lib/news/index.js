var base = require('../base'),
    us = require('underscore'),
    jade = require('jade'),
    json_schema = require("../json-schema");

var app = module.exports = base.createServer();

app.get("/", showPublished);
app.get("/drafts", base.middleware.loginCheck, canPostNews, showDrafts);
app.get("/post", base.middleware.loginCheck, canPostNews, postForm);
app.get("/tag/:tag?", showTags);

app.get("/id/:post_id", viewPost);
app.get("/:slug", viewPost);

app.get("/:slug/edit", base.middleware.loginCheck, canPostNews, editForm);
app.get("/id/:post_id/edit", base.middleware.loginCheck, canPostNews, editForm);

app.post("/post", base.middleware.loginCheck, canPostNews, postProcessGen(postForm));
app.post("/id/:post_id/edit", base.middleware.loginCheck, canPostNews, postProcessGen(editForm));
app.post("/:slug/edit", base.middleware.loginCheck, canPostNews, postProcessGen(editForm));

app.param('post_id', function (req, res, next, post_id){
    var api = req.app.set('iapi');

    api.getDoc(req.params.id, function (article){
        if (article && article.type == "article"){
            req.article = article;
            next();
        }
        else {
            next(new base.errors.NotFound());
        }
    });
});

app.param('slug', function (req, res, next, slug){
    var api = req.app.set('iapi');

    api.slugList({include_docs: true, key: req.params.slug}, function (response){
            if (response.rows && response.rows.length){
                req.article = response.rows[0].doc;
                next();
            }
            else {
                next(new base.errors.NotFound());
            }
    });
});

function canPostNews(req, res, next){
    if (req.player.is_sysop || us._(req.player.permissions || []).include("post news")){
        next();
    }
    else {
        next(new base.errors.AccessDenied());
    }
}

function showPublished(req, res, next){
    var api = req.app.set('iapi');
    var opts = {include_docs: true, descending: true, limit: 11};
    if (req.param('nextpage')) opts.startkey = decodeURI(req.param('nextpage'));
    opts.limit = parseInt(req.param('limit')) || 10;
    opts.limit += 1;
    
    api.publishedArticles(opts, function (response){
        var articles = response.rows || [];
        var nextpage;
        if (articles.length < opts.limit)
        {
            nextpage = false;
            articles.push(null);
        }
        else
            nextpage = response.rows[opts.limit - 1].key;
            
        articles.pop();
        articles = us._(articles).pluck('doc');
        
        for (var i in articles)
        {
            articles[i].article_body = jade.render(articles[i].body, {cache: true, filename: articles[i].slug+"-"+articles[i]._rev+".js"});
        }
        
        var locals = {
            articles: articles,
            title: "Recent News",
            nextpage: nextpage,
            limit: opts.limit - 1,
            self: "/news/",
            crumbs: [{href: "/", text: "Home"}, 
                        {href: "/news", text: "Recent News"}]
        };
        
        res.render("news/list", locals);
    });
}

function showDrafts(req, res, next){
    var api = req.app.set('iapi');

    var opts = {include_docs: true, descending: true, limit: 11};
    if (req.param('nextpage')) opts.startkey = decodeURI(req.param('nextpage'));
    opts.limit = parseInt(req.param('limit')) || 10;
    opts.limit += 1;

    api.draftArticles(opts, function (response){
        var articles = response.rows || [];
        var nextpage;
        if (articles.length < opts.limit)
        {
            nextpage = false;
            articles.push(null);
        }
        else
            nextpage = response.rows[opts.limit - 1].key;

        articles.pop();
        articles = us._(articles).pluck('doc');

        for (var i in articles)
        {
            articles[i].article_body = jade.render(articles[i].body, {cache: true, filename: articles[i].slug+"-"+articles[i]._rev+".js"});
        }

        var locals = {
            articles: articles,
            title: "Recent Drafts",
            nextpage: nextpage,
            limit: opts.limit - 1,
            self: "/news/drafts",
            crumbs: [{href: "/", text: "Home"},
                        {href: "/news/drafts", text: "Recent Drafts"}]
        };

        res.render("news/list", locals);
    });
    
}

function showTags(req, res, next){
    var api = req.app.set('iapi');

    if (req.params.tag)
    {
        var opts = {include_docs: true, descending: true, limit: 11};
        opts.startkey = opts.endkey = decodeURI(req.params.tag);
        if (req.param('nextpage')) opts.startkey_docid = decodeURI(req.param('nextpage'));
        opts.limit = parseInt(req.param('limit')) || 10;
        opts.limit += 1;
        
        api.tagArticles(opts, function (response){
            var articles = response.rows || [];
            var nextpage;
            if (articles.length < opts.limit)
            {
                nextpage = false;
                articles.push(null);
            }
            else
                nextpage = response.rows[opts.limit - 1].doc._id;
                
            articles.pop();
            articles = us._(articles).pluck('doc');
            
            for (var i in articles)
            {
                articles[i].article_body = jade.render(articles[i].body, {cache: true, filename: articles[i].slug+"-"+articles[i]._rev+".js"});
            }
            
            var locals = {
                articles: articles,
                title: "Tagged News: "+req.params.tag,
                nextpage: nextpage,
                limit: opts.limit - 1,
                self: "/news/tag/"+req.params.tag,
                crumbs: [{href: "/", text: "Home"}, 
                            {href: "/news/tag", text: "Tagged News"},
                            {href: "/news/tag/"+req.params.tag, text: req.params.tag}]
            };
            
            res.render("news/list", locals);
        });
    }
    else
    {
        api.tagList(function (response){
            if (response.rows && response.rows.length){
                var minsize = 100;
                var maxsize = 182;
                var total = 0;
                response.rows.forEach(function (row){
                    total += row.value;
                });
                var tags = response.rows.map(function (row){ return {tag: row.key, size: Math.floor((maxsize - minsize) * (row.value / total)) + minsize};});
                
                var locals = {
                    tags: tags,
                    total: total,
                    crumbs: [{href: "/", text: "Home"}, 
                                {href: "/news/tag", text: "Tagged News"}]
                };
                
                res.render("news/tagcloud", locals);
            }
            else
            {
                next("Unable to get tag cloud information");
            }
        });
    }
}

function viewPost(req, res, next){
    var api = req.app.set('iapi');

    if (req.article){
        if (req.article.status.published || (req.player && (req.player.is_sysop || us._(req.player.permissions || []).include("post news")))){
            var locals = {
                article: req.article,
                full: true,
                crumbs: [{href: "/", text: "Home"},
                            {href: "/news"+(!article.status.published ? "/drafts" : ""), text: "Recent "+(!article.status.published ? "Drafts" : "News")},
                            {href: "/news/"+(article.slug ? article.slug : "id/"+article._id), text: article.subject}]
            };

            article.article_body = jade.render(article.body, {cache: true, filename: article.slug+"-"+article._rev+".js"});
            res.render("news/article", locals);
        }
    }
    else {
        next(new base.errors.NotFound());
    }
}

function postForm(req, res, next, locals){
    var api = req.app.set('iapi');

    locals = locals || {messages: {}, data: {}, errors: false};
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/news", text: "News"},
                        {href: "/news/post", text: "New Article"}];

    res.render("news/post", locals);
}

function editForm(req, res, next, locals){
    var api = req.app.set('iapi');
    var article;

    locals = locals || {messages: {}, errors: false};

    if (req.article){
        article = req.article;

        locals.data = locals.data || article;
        locals.data._sslug = article.slug;
        locals.published = article.status.published;
        locals.crumbs = [{href: "/", text: "Home"},
                            {href: "/news", text: "News"},
                            {href: "/news/post", text: "Edit Article"}]

        res.render("news/post", locals);
    }
    else {
        req.flash('error','Unable to find the requested post');
        res.redirect(req.params.slug ? req.params.slug : 'id/'+req.params.id);
    }
}

function postProcessGen(callback){
    var article_schema = require('./schema').article;
    
    return function (req, res, next){
        var api = req.app.set('iapi');
        var article;
        var validation;
        
        if (req.body && req.body.action)
        {
            var locals = {messages: {}, data: {}, errors: false};

            var fields = req.body;
            ['subject','slug','tags','body'].forEach(function (field){
                fields[field] = req.body[field] ? req.body[field].trim() : "";
                locals.messages[field] = [];
            });

            locals.data = fields;

            if (!req.article)
            {
                //new article

                article = {};
                article.type = "article";
                article.subject = fields.subject;
                article.slug = fields.slug;
                article.body = fields.body;
                article.authors = ["@"+req.player.handle];
                article.status = {published: fields.action == "publish", date: (new Date()).toISOString()};
                article.tags = us._(fields.tags.split(",")).map(function (tag){ return tag.trim();});
                locals.data.tags = article.tags;

                validation = json_schema.validate(article, article_schema);
                if (!validation.valid)
                {
                    validation.errors.forEach(function (error){
                        if (locals.messages[error.property])
                            locals.messages[error.property].push(error.message);
                    });

                    locals.errors = true;
                }

                api.slugList(function (response){
                    if (response.rows)
                    {
                        if (us._(response.rows).pluck('key').indexOf(article.slug) > -1)
                        {
                            locals.errors = true;
                            locals.messages.slug.push("must be unique");
                        }

                        if (locals.errors)
                        {
                            req.flash('error', 'There were problems with your post.');
                            callback(req, res, next, locals);
                        }
                        else
                        {
                            api.uuids(function (uuids){
                                article._id = uuids[0];

                                api.putDoc(article, function (response){
                                    if (response.error)
                                    {
                                        locals.errors = true;
                                        req.flash('error', 'Unable to '+(req.body.action == "publish" ? "publish" : "save")+' news post.');
                                        callback(req, res, next, locals);
                                    }
                                    else
                                    {
                                        req.flash('info', 'News post '+ (req.body.action == "published" ? "publish" : "saved")+' successfully.');
                                        res.redirect(article.slug);
                                    }
                                });
                            });
                        }
                    }
                    else
                    {
                        req.flash('error', 'Unable to retrieve list of existing slugs.');
                        callback(req, res, next, locals);
                    }
                });
            }
            else
            {
                article = req.article;
                
                article.subject = fields.subject;
                article.body = fields.body;
                var slug_changed = article.slug != fields.slug;
                article.slug = fields.slug;
                article.tags = us._(fields.tags.split(",")).map(function (tag){ return tag.trim();});
                locals.data.tags = article.tags;
                if (article.status.published)
                {
                    article.edits = article.edits || [];
                    article.edits.push({name: "@"+req.player.handle, date: (new Date()).toISOString()});
                }
                else
                {
                    article.authors.push("@"+req.player.handle);
                    article.authors = us._(article.authors).uniq();
                    if (req.body.action == "publish")
                    {
                        article.status.published = true;
                        article.status.date = (new Date()).toISOString();
                    }
                }

                validation = json_schema.validate(article, article_schema);
                if (!validation.valid)
                {
                    validation.errors.forEach(function (error){
                        if (locals.messages[error.property])
                            locals.messages[error.property].push(error.message);
                    });

                    locals.errors = true;
                }

                function afterSlugCheck(){
                    if (locals.errors)
                    {
                        req.flash('error', 'There were problems with your post.');
                        callback(req, res, next, locals);
                    }
                    else
                    {
                        api.putDoc(article, function (response){
                            if (response.error)
                            {
                                locals.errors = true;
                                req.flash('error', 'Unable to '+(req.body.action == "publish" ? "publish" : "save")+' news post.');
                                callback(req, res, next, locals);
                            }
                            else
                            {
                                req.flash('info', 'News post '+ (req.body.action == "published" ? "publish" : "saved")+' successfully.');
                                res.redirect(article.slug);
                            }
                        });
                    }
                }

                if (slug_changed)
                {
                    api.slugList(function (response){
                        if (response.rows)
                        {
                            if (us._(response.rows).pluck('key').indexOf(article.slug) > -1)
                            {
                                locals.errors = true;
                                locals.messages.slug.push("must be unique");
                            }
                        }
                        else
                        {
                            locals.errors = true;
                            req.flash('error', 'Unable to retrieve list of existing slugs.');
                        }

                        afterSlugCheck();
                    });
                }
                else
                {
                    afterSlugCheck();
                }
            }

        }
        else
        {
            req.flash('error','Could not process form.');
            callback(req, res, next, locals);
        }
            
    }
}
