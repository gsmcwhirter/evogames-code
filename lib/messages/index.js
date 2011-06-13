var base = require('../base'),
    parsers = require("./parsers"),
    mw = require('./middleware'),
    markdown = require('discount'),
    json_schema = require("../json-schema");

var app = module.exports = base.createServer();

app.get("/", base.auth.loginCheck, showIndex);
app.get("/inbox", base.auth.loginCheckAjax, getInbox)
app.get("/drafts", base.auth.loginCheckAjax, getDrafts);
app.get("/outbox", base.auth.loginCheckAjax, getOutbox);

app.get("/:message_id", base.auth.loginCheckAjax, mw.forceViewable, getMessage);
app.put("/", base.auth.loginCheckAjax, saveMessage);
app.put("/:message_id", base.auth.loginCheckAjax, mw.forceEditable, saveMessage);

app.param('message_id', parsers.messageId);

//Routes
function showIndex(req, res, next){
    var locals = {};
    locals.crumbs = [{href: "/", text: "Home"},
                        {href: "/messages", text: "Messages"}];

    res.render("messages/index", locals);
}

function getInbox(req, res, next){
    var api = req.app.set('iapi');

    var opts = {include_docs: true, descending: true, limit: 11};
    opts.startkey = [req.player.handle.toLowerCase(), 1];
    opts.endkey = [req.player.handle.toLowerCase(), 0];
    if (req.param('nextpage')) opts.startkey = [req.player.handle.toLowerCase(), 0].concat(decodeURI(req.param('nextpage')));
    opts.limit = parseInt(req.param('limit')) || 10;
    opts.limit += 1;

    var messages = [];
    api.messages.inbox(opts, function (response){
        var nextpage = false;
        if (response.rows && response.rows.length){
            if (response.rows.length < opts.limit)
            {
                nextpage = false;
                response.rows.push(null);
            }
            else{
                nextpage = response.rows[opts.limit - 1].key.slice(2);
            }

            response.rows.pop();

            messages = response.rows.map(function (row){
                row.doc.body_parsed = markdown.parse(row.doc.body || "(nt)\n");

                row.doc.bcc = row.doc.bcc.filter(function (rec){return rec.handle.toLowerCase() == req.player.handle.toLowerCase()});
                if (row.doc.bcc.length > 0){
                    row.doc.is_read = row.doc.bcc.map(function (rec){return rec.is_read}).indexOf(true) > -1;
                }
                else {
                    for (var i = 0, cti = row.doc.to.length; i < cti && !row.doc.is_read; i++){
                        if (row.doc.to[i].handle.toLowerCase() == req.player.handle.toLowerCase() && row.doc.to[i].is_read){
                            row.doc.is_read = true;
                        }
                    }

                    for (var j = 0, ctj = row.doc.cc.length; j < ctj && !row.doc.is_read; j++){
                        if (row.doc.cc[i].handle.toLowerCase() == req.player.handle.toLowerCase() && row.doc.cc[i].is_read){
                            row.doc.is_read = true;
                        }
                    }
                }

                return row.doc;
            });
        }

        res.header("Content-type", "application/json");
        res.send({messages: messages, nextpage: nextpage});
    });
}

function getDrafts(req, res, next){
    var api = req.app.set('iapi');

    var opts = {include_docs: true, descending: true, limit: 11};
    opts.startkey = [req.player.handle.toLowerCase(), 1];
    opts.endkey = [req.player.handle.toLowerCase(), 0];
    if (req.param('nextpage')) opts.startkey = [req.player.handle.toLowerCase(), 0].concat(decodeURI(req.param('nextpage')));
    opts.limit = parseInt(req.param('limit')) || 10;
    opts.limit += 1;

    var messages = [];
    api.messages.drafts(opts, function (response){
        var nextpage = false;
        if (response.rows && response.rows.length){
            if (response.rows.length < opts.limit)
            {
                nextpage = false;
                response.rows.push(null);
            }
            else{
                nextpage = response.rows[opts.limit - 1].key.slice(2);
            }

            response.rows.pop();

            messages = response.rows.map(function (row){
                row.doc.body_parsed = markdown.parse(row.doc.body || "(nt)\n");

                return row.doc;
            });
        }

        res.header("Content-type", "application/json");
        res.send({messages: messages, nextpage: nextpage});
    });
}

function getOutbox(req, res, next){
    var api = req.app.set('iapi');

    var opts = {include_docs: true, descending: true, limit: 11};
    opts.startkey = [req.player.handle.toLowerCase(), 1];
    opts.endkey = [req.player.handle.toLowerCase(), 0];
    if (req.param('nextpage')) opts.startkey = [req.player.handle.toLowerCase(), 0].concat(decodeURI(req.param('nextpage')));
    opts.limit = parseInt(req.param('limit')) || 10;
    opts.limit += 1;

    var messages = [];
    api.messages.outbox(opts, function (response){
        var nextpage = false;
        if (response.rows && response.rows.length){
            if (response.rows.length < opts.limit)
            {
                nextpage = false;
                response.rows.push(null);
            }
            else{
                nextpage = response.rows[opts.limit - 1].key.slice(2);
            }

            response.rows.pop();

            messages = response.rows.map(function (row){
                row.doc.body_parsed = markdown.parse(row.doc.body || "(nt)\n");

                return row.doc;
            });
        }

        res.header("Content-type", "application/json");
        res.send({messages: messages, nextpage: nextpage});
    });
}

function getMessage(req, res, next){
    res.header("Content-type", "application/json");
    req.message.body_parsed = markdown.parse(req.message.body || "(nt)\n");
    res.send(req.message);
}

function saveMessage(req, res, next){

}