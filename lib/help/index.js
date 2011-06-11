var base = require('../base'),
    parsers = require("./parsers"),
    markdown = require('discount'),
    json_schema = require("../json-schema"),
    question_schema = require("./schema").question;

var app = module.exports = base.createServer();

app.get("/", showAnswered);
app.get("/unanswered", base.auth.loginCheck, base.auth.permissionCheck("answer help"), showPending);

app.get("/ask", base.auth.loginCheck, askForm);
app.post("/ask", base.auth.loginCheck, askProcess);

app.get("/id/:question_id", viewQuestion);
app.get("/:slug", viewQuestion);

app.get("/id/:question_id/edit", base.auth.loginCheck, base.auth.permissionCheck("answer help"), editForm);
app.post("/id/:question_id/edit", base.auth.loginCheck, base.auth.permissionCheck("answer help"), editProcess);
app.del("/id/:question_id/delete", base.auth.loginCheckAjax, base.auth.permissionCheckAjax("answer help"), deleteQuestion);

app.param('question_id', parsers.questionIdParser);
app.param('slug', parsers.slugParser);


//Routes
function showAnswered(req, res, next){
    var api = req.app.set('iapi');

    var locals = {};

    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/help", text: "Help"}];
    locals.tags = [];

    var tags = {
        untagged: {tag: "Untagged", questions: []}
    };
    
    api.help.answered({include_docs: true}, function (response){
        if (response.rows && response.rows.length){
            response.rows.forEach(function (row){
                row.doc.question_answer = markdown.parse(row.doc.answer || "(no answer)\n");

                if (row.doc.tags && row.doc.tags.length){
                    row.doc.tags.forEach(function (tag){
                        var ltag = tag.toLowerCase();
                        if (!tags[ltag]) tags[ltag] = {tag: tag, questions: []};

                        tags[ltag].questions.push(row.doc);
                    });
                }
                else {
                    tags.untagged.questions.push(row.doc);
                }
            });
        }

        for (var k in tags){
            if (tags[k].questions.length){
                locals.tags.push(tags[k]);
            }
        }

        locals.tags.sort(function (a, b){
            return a.tag.toLowerCase() < b.tag.toLowerCase() ? -1 : 1;
        });
        
        res.render("help/index", locals);
    });
}

function showPending(req, res, next){
    var api = req.app.set('iapi');
    var locals = {};

    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/help", text: "Help"},
                        {href: "/help/unanswered", text: "Unanswered Questions"}];
    locals.questions = [];

    api.help.unanswered({include_docs: true}, function (response){

        if (response.rows && response.rows.length){
            locals.questions = response.rows.map(function (row){return row.doc;});
        }

        res.render("help/unanswered", locals);
    });
    
}

function viewQuestion(req, res, next){
    
    if (req.question.status.answered || (req.player && (req.player.is_sysop || (req.player.permissions || []).indexOf("answer help") > -1))){
        var locals = {
            question: req.question,
            full: true,
            crumbs: [{href: "/", text: "Home"},
                        {href: "/help", text: "Help"},
                        {href: "/news/"+(req.question.slug ? req.question.slug : "id/"+req.question._id), text: req.question.question}]
        };

        locals.question.question_answer = markdown.parse(locals.question.answer || "(no answer available)\n");
        
        res.render("help/question", locals);
    }
}

function askForm(req, res, next, locals){
    var api = req.app.set('iapi');

    locals = locals || {messages: {}, data: {}, errors: false};
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/help", text: "Help"},
                        {href: "/help/ask", text: "Ask a Question"}];

    res.render("help/ask", locals);
}

function askProcess(req, res, next){
    if (req.body && typeof req.body.question != "undefined"){
        var api = req.app.set('iapi');
        var locals = {messages: {}, data: {}, errors: false};

        var question = {};
        question.type = "help-question";
        question.question = (req.body.question || "").trim();
        question.status = {answered: false, date: (new Date()).toISOString()};

        locals.data.question = question.question;

        var validation = json_schema.validate(question, question_schema);

        if (!validation.valid)
        {
            validation.errors.forEach(function (error){
                if (locals.messages[error.property])
                    locals.messages[error.property].push(error.message);
            });

            locals.errors = true;
        }

        if (locals.errors)
        {
            req.flash('error', 'There were problems with your question.');
            askForm(req, res, next, locals);
        }
        else
        {
            api.uuids(function (uuids){
                question._id = "help-question-"+uuids[0];

                api.putDoc(question, function (response){
                    if (response.error)
                    {
                        locals.errors = true;
                        req.flash('error', 'Unable to save your question: '+(response.reason || response.error));
                        askForm(req, res, next, locals);
                    }
                    else
                    {
                        req.flash('info', 'Your question has been saved. Someone should post an answer on the main help page soon.');
                        res.redirect("");
                    }
                });
            });
        }
    }
    else {
        req.flash('error', 'parse error');
        askForm(req, res, next);
    }
}

function editForm(req, res, next, locals){
    locals = locals || {messages: {}, errors: false};

    locals.data = locals.data || req.question;
    locals.data._sslug = req.question.slug;
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/help", text: "Help"},
                        {href: "/help/id/"+req.question._id, text: req.question.question},
                        {href: "/help/id/"+req.question._id+"/edit", text: "Edit"}]

    res.render("help/edit", locals);
}

function editProcess(req, res, next){
    var api = req.app.set('iapi');

    if (req.body)
    {
        var locals = {messages: {}, data: {}, errors: false};

        var fields = req.body;
        ['question','slug','tags','answer'].forEach(function (field){
            fields[field] = req.body[field] ? req.body[field].trim() : "";
            locals.messages[field] = [];
        });

        locals.data = fields;

        var question = base.util.clone(req.question);

        question.question = fields.question;
        question.answer = fields.answer;
        var slug_changed = question.slug != fields.slug;
        question.slug = fields.slug;
        question.tags = fields.tags.split(",").map(function (tag){ return tag.trim();});
        locals.data.tags = question.tags;

        if (!question.status.answered)
        {
            question.status.answered = true;
            question.status.date = (new Date()).toISOString();
        }

        question.edits = question.edits || [];
        question.edits.push({name: "@"+req.player.handle, date: (new Date()).toISOString()});


        var validation = json_schema.validate(question, question_schema);
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
                req.flash('error', 'There were problems saving the question.');
                editForm(req, res, next, locals);
            }
            else
            {
                api.putDoc(question, function (response){
                    if (response.error)
                    {
                        locals.errors = true;
                        req.flash('error', 'Unable to save the question: '+(response.reason || response.error));
                        editForm(req, res, next, locals);
                    }
                    else
                    {
                        req.flash('info', 'Question saved successfully.');
                        res.redirect(question.slug);
                    }
                });
            }
        }

        if (slug_changed)
        {
            api.help.slugs(function (response){
                if (response.rows)
                {
                    if (response.rows.map(function (row){return row.key;}).indexOf(question.slug) > -1)
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
    else
    {
        req.flash('error','Could not process form.');
        editForm(req, res, next, locals);
    }
}

function deleteQuestion(req, res, next){
    var api = req.app.set('iapi');

    api.delDoc(req.question, function (response){
        if (!response.error){
            res.writeHead(200, {"Content-type": "application/json"});
            res.end(JSON.stringify({ok: true, info: "The question was successfully deleted."}));
        }
        else {
            res.writeHead(200, {"Content-type": "application/json"});
            res.end(JSON.stringify({ok: false, error: "There was an error deleting the question: "+(response.reason || response.error)}));
        }
    });
}