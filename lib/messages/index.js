var base = require('../base'),
    parsers = require("./parsers"),
    mw = require('./middleware'),
    markdown = require('discount'),
    message_schema = require("./schema").message,
    json_schema = require("../json-schema");

var app = module.exports = base.createServer();

app.get("/", base.auth.loginCheck, showIndex);
app.get("/inbox", base.auth.loginCheckAjax, getInbox)
app.get("/drafts", base.auth.loginCheckAjax, getDrafts);
app.get("/outbox", base.auth.loginCheckAjax, getOutbox);
//app.get("/new", base.auth.loginCheckAjax, getNew);

app.put("/", base.auth.loginCheckAjax, saveMessage);
app.put("/delete", base.auth.loginCheckAjax, deleteMessagesBulk);
app.get("/:message_id", base.auth.loginCheckAjax, mw.forceViewable, getMessage);
app.put("/:message_id", base.auth.loginCheckAjax, mw.forceEditable, saveMessage);
app.del("/:message_id", base.auth.loginCheckAjax, mw.forceDeleteable, deleteMessage);
app.del("/:message_id/unread", base.auth.loginCheckAjax, mw.forceViewable, unreadMessage);

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
    if (req.param('nextpage')) opts.startkey = [req.player.handle.toLowerCase(), 0].concat(JSON.parse(decodeURI(req.param('nextpage'))));
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
                //row.doc.body_parsed = markdown.parse(row.doc.body || "(nt)\n");
                row.doc.status.date = base.datetimeHelpers.datetime(req, res)(row.doc.status.date);

                row.doc.bcc = (row.doc.bcc || []).filter(function (rec){return rec.handle.toLowerCase() == req.player.handle.toLowerCase()});
                if (row.doc.bcc.length > 0){
                    row.doc.is_read = row.doc.bcc.map(function (rec){return rec.is_read}).indexOf(true) > -1;
                }
                else {
                    for (var i = 0, cti = (row.doc.to || []).length; i < cti && !row.doc.is_read; i++){
                        if (row.doc.to[i].handle.toLowerCase() == req.player.handle.toLowerCase() && row.doc.to[i].is_read){
                            row.doc.is_read = true;
                        }
                    }

                    for (var j = 0, ctj = (row.doc.cc || []).length; j < ctj && !row.doc.is_read; j++){
                        if (row.doc.cc[j].handle.toLowerCase() == req.player.handle.toLowerCase() && row.doc.cc[j].is_read){
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
    if (req.param('nextpage')) opts.startkey = [req.player.handle.toLowerCase(), 0].concat(JSON.parse(decodeURI(req.param('nextpage'))));
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
                //row.doc.body_parsed = markdown.parse(row.doc.body || "(nt)\n");
                row.doc.status.date = base.datetimeHelpers.datetime(req, res)(row.doc.status.date);

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
    if (req.param('nextpage')) opts.startkey = [req.player.handle.toLowerCase(), 0].concat(JSON.parse(decodeURI(req.param('nextpage'))));
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
                //row.doc.body_parsed = markdown.parse(row.doc.body || "(nt)\n");
                row.doc.status.date = base.datetimeHelpers.datetime(req, res)(row.doc.status.date);

                return row.doc;
            });
        }

        res.header("Content-type", "application/json");
        res.send({messages: messages, nextpage: nextpage});
    });
}

function getMessage(req, res, next){
    res.header("Content-type", "application/json");
    var read_changed;
    //mark as read
    var handles_to = (req.message.to || []).map(function (rec){return rec.handle.toLowerCase()});
    var handles_cc = (req.message.cc || []).map(function (rec){return rec.handle.toLowerCase()});
    var handles_bcc = (req.message.bcc || []).map(function (rec){return rec.handle.toLowerCase()});

    var hindex;
    hindex = handles_to.indexOf(req.player.handle.toLowerCase());
    while (hindex > -1){
        if (!req.message.to[hindex].is_read){
            read_changed = true;
        }
        req.message.to[hindex].is_read = true;

        hindex = handles_to.indexOf(req.player.handle.toLowerCase(), hindex + 1);
    }

    hindex = handles_cc.indexOf(req.player.handle.toLowerCase());
    while (hindex > -1){
        if (!req.message.cc[hindex].is_read){
            read_changed = true;
        }

        req.message.cc[hindex].is_read = true;
        hindex = handles_cc.indexOf(req.player.handle.toLowerCase(), hindex + 1);
    }

    hindex = handles_bcc.indexOf(req.player.handle.toLowerCase());
    while (hindex > -1){
        if (!req.message.bcc[hindex].is_read){
            read_changed = true;
        }

        req.message.bcc[hindex].is_read = true;
        hindex = handles_bcc.indexOf(req.player.handle.toLowerCase(), hindex + 1);
    }

    if (read_changed){
        var message = base.util.clone(req.message);
        var api = req.app.set('iapi');
        api.putDoc(message, function (){});
    }

    req.message.body_parsed = markdown.parse(req.message.body || "(nt)\n");

    if (req.param('for_reply', false)){
        req.message.to = (req.message.to || []).filter(function (rec){return rec.handle.toLowerCase() != req.player.handle.toLowerCase()});
        req.message.cc = (req.message.cc || []).filter(function (rec){return rec.handle.toLowerCase() != req.player.handle.toLowerCase()});
        req.message.bcc = (req.message.bcc || []).filter(function (rec){return rec.handle.toLowerCase() != req.player.handle.toLowerCase()});
        req.message.from = req.message.from.toLowerCase() == req.player.handle.toLowerCase() ? req.message.from : "";
    }

    if (req.message.from.toLowerCase() != req.player.handle.toLowerCase()){
        req.message.bcc = [];
    }

    req.message.status.date = base.datetimeHelpers.datetime(req, res)(req.message.status.date);

    res.send({message: req.message});
}

function saveMessage(req, res, next){
    res.header("Content-type", "application/json");
    if (req.body){
        var api = req.app.set('iapi');

        var handles = [];
        api.players.handles(function (response){
            if (response.rows && response.rows.length){
                handles = response.rows.map(function (row){return row.key});
            }

            var errors = [];
            var handles_to = (req.body.to || "").split(",").map(function (rec){return rec.trim()}).filter(function (rec){return rec;}) || [];
            var handles_cc = (req.body.cc || "").split(",").map(function (rec){return rec.trim()}).filter(function (rec){return rec;}) || [];
            var handles_bcc = (req.body.bcc || "").split(",").map(function (rec){return rec.trim()}).filter(function (rec){return rec;}) || [];

            var hindex;
            handles_to.forEach(function (handle){
                if (handles.indexOf(handle.toLowerCase()) == -1){
                    errors.push("No player was found with handle '"+handle+"'.");
                }

                hindex = handles_cc.map(function (h){return h.toLowerCase()}).indexOf(handle.toLowerCase());
                while (hindex > -1){
                    handles_cc.splice(hindex, 1);
                    hindex = handles_cc.map(function (h){return h.toLowerCase()}).indexOf(handle.toLowerCase());
                }

                hindex = handles_bcc.map(function (h){return h.toLowerCase()}).indexOf(handle.toLowerCase());
                while (hindex > -1){
                    handles_bcc.splice(hindex, 1);
                    hindex = handles_bcc.map(function (h){return h.toLowerCase()}).indexOf(handle.toLowerCase());
                }
            });

            handles_cc.forEach(function (handle){
                if (handles.indexOf(handle.toLowerCase()) == -1){
                    errors.push("No player was found with handle '"+handle+"'.");
                }

                hindex = handles_bcc.map(function (h){return h.toLowerCase()}).indexOf(handle.toLowerCase());
                while (hindex > -1){
                    handles_bcc.splice(hindex, 1);
                    hindex = handles_bcc.map(function (h){return h.toLowerCase()}).indexOf(handle.toLowerCase());
                }
            });

            handles_bcc.forEach(function (handle){
                if (handles.indexOf(handle.toLowerCase()) == -1){
                    errors.push("No player was found with handle '"+handle+"'.");
                }
            });

            var message;
            if (req.message){
                message = base.util.clone(req.message);
            }
            else {
                message = {};
                message.type = "message";
                message.from = req.player.handle;
            }

            message.body = req.body.body;
            message.subject = req.body.subject;
            message.to = handles_to.map(function (handle){return {handle: handle, is_read: false, is_deleted: false}});
            message.cc = handles_cc.map(function (handle){return {handle: handle, is_read: false, is_deleted: false}});
            message.bcc = handles_bcc.map(function (handle){return {handle: handle, is_read: false, is_deleted: false}});
            message.status = {
                sent: req.body.action == "send",
                date: (new Date()).toISOString()
            };

            var validation = json_schema.validate(message, message_schema);
            if (validation.valid && errors.length == 0){
                if (!message._id){
                    api.uuids(function (uuids){
                        message._id = "message-"+uuids[0];

                        doSave();
                    });
                }
                else {
                    doSave();
                }

                function doSave(){
                    api.putDoc(message, function (response){
                        if (!response.error){
                            res.send({ok: true, info: "Your message was "+(message.status.sent ? "sent" : "saved")+" successfully."});
                        }
                        else {
                            res.send({ok: false, error: "Unable to save your message: "+(response.reason || response.error)});
                        }
                    });
                }
            }
            else {
                if (!validation.valid){
                    errors.push("Message format was invalid.");
                }

                errors.unshift("There were problems with your message.");

                res.send({ok: false, error: errors});
            }
        });
    }
    else {
        res.send({error: "parse error"});
    }
}

function deleteMessage(req, res, next){
    var api = req.app.set('iapi');
    res.header("Content-type", "application/json");

    var message = base.util.clone(req.message);

    if (!req.message.status.sent && req.message.from.toLowerCase() == req.player.handle.toLowerCase()){
        //delete whole message
        api.delDoc(message, function (response){
            if (!response.error){
                res.send({ok: true, info: "The message was successfully deleted."});
            }
            else {
                res.send({ok: false, error: "The message failed to be deleted: "+(response.reason || response.error)});
            }
        });
    }
    else {
        //mark as deleted
        var handles_to = (message.to || []).map(function (rec){return rec.handle.toLowerCase()});
        var handles_cc = (message.cc || []).map(function (rec){return rec.handle.toLowerCase()});
        var handles_bcc = (message.bcc || []).map(function (rec){return rec.handle.toLowerCase()});

        var hindex;
        hindex = handles_to.indexOf(req.player.handle.toLowerCase());
        while (hindex > -1){
            message.to[hindex].is_deleted = true;
            hindex = handles_to.indexOf(req.player.handle.toLowerCase(), hindex + 1);
        }

        hindex = handles_cc.indexOf(req.player.handle.toLowerCase());
        while (hindex > -1){
            message.cc[hindex].is_deleted = true;
            hindex = handles_cc.indexOf(req.player.handle.toLowerCase(), hindex + 1);
        }

        hindex = handles_bcc.indexOf(req.player.handle.toLowerCase());
        while (hindex > -1){
            message.bcc[hindex].is_deleted = true;
            hindex = handles_bcc.indexOf(req.player.handle.toLowerCase(), hindex + 1);
        }

        api.putDoc(message, function (response){
            if (!response.error){
                res.send({ok: true, info: "The message was successfully deleted."});
            }
            else {
                res.send({ok: false, error: "The message failed to be deleted: "+(response.reason || response.error)});
            }
        });
    }
    
}

function deleteMessagesBulk(req, res, next){
    res.header("Content-type", "application/json");
    if (req.body && typeof req.body.ids != "undefined"){
        var ids = [];

        for (var k in req.body.ids){
            ids.push(req.body.ids[k]);
        }

        var max = ids.length;
        var succ = 0;
        var fail = 0;
        var api = req.app.set('iapi');

        ids.forEach(function (id){
            api.getDoc(id, function (response){
                if (response && response.type == "message" && mw._isDeleteable(req, response)){
                    if(!response.status.sent && response.from.toLowerCase() == response.handle.toLowerCase()){
                        api.delDoc(response, function (response2){
                            if (!response2.error){
                                succ++;
                            }
                            else {
                                fail++;
                            }

                            whenDone();
                        });
                    }
                    else {
                        //mark as deleted
                        var handles_to = (response.to || []).map(function (rec){return rec.handle.toLowerCase()});
                        var handles_cc = (response.cc || []).map(function (rec){return rec.handle.toLowerCase()});
                        var handles_bcc = (response.bcc || []).map(function (rec){return rec.handle.toLowerCase()});

                        var hindex;
                        hindex = handles_to.indexOf(req.player.handle.toLowerCase());
                        while (hindex > -1){
                            response.to[hindex].is_deleted = true;
                            hindex = handles_to.indexOf(req.player.handle.toLowerCase(), hindex + 1);
                        }

                        hindex = handles_cc.indexOf(req.player.handle.toLowerCase());
                        while (hindex > -1){
                            response.cc[hindex].is_deleted = true;
                            hindex = handles_cc.indexOf(req.player.handle.toLowerCase(), hindex + 1);
                        }

                        hindex = handles_bcc.indexOf(req.player.handle.toLowerCase());
                        while (hindex > -1){
                            response.bcc[hindex].is_deleted = true;
                            hindex = handles_bcc.indexOf(req.player.handle.toLowerCase(), hindex + 1);
                        }

                        api.putDoc(response, function (response){
                            if (!response.error){
                                succ++;
                            }
                            else {
                                fail++;
                            }

                            whenDone();
                        });
                    }
                }
                else {
                    fail++;
                    whenDone();
                }
            });
        });

        function whenDone(){
            if ((succ + fail) == max){
                res.send({max: max, succ: succ, fail: fail});
            }
        }
    }
    else {
        res.send({error: "parse error"});
    }
}

function unreadMessage(req, res, next){
    res.header("Content-type", "application/json");
    var read_changed;
    //mark as unread
    var handles_to = (req.message.to || []).map(function (rec){return rec.handle.toLowerCase()});
    var handles_cc = (req.message.cc || []).map(function (rec){return rec.handle.toLowerCase()});
    var handles_bcc = (req.message.bcc || []).map(function (rec){return rec.handle.toLowerCase()});

    var hindex;
    hindex = handles_to.indexOf(req.player.handle.toLowerCase());
    while (hindex > -1){
        if (req.message.to[hindex].is_read){
            read_changed = true;
        }
        req.message.to[hindex].is_read = false;

        hindex = handles_to.indexOf(req.player.handle.toLowerCase(), hindex + 1);
    }

    hindex = handles_cc.indexOf(req.player.handle.toLowerCase());
    while (hindex > -1){
        if (req.message.cc[hindex].is_read){
            read_changed = true;
        }

        req.message.cc[hindex].is_read = false;
        hindex = handles_cc.indexOf(req.player.handle.toLowerCase(), hindex + 1);
    }

    hindex = handles_bcc.indexOf(req.player.handle.toLowerCase());
    while (hindex > -1){
        if (req.message.bcc[hindex].is_read){
            read_changed = true;
        }

        req.message.bcc[hindex].is_read = false;
        hindex = handles_bcc.indexOf(req.player.handle.toLowerCase(), hindex + 1);
    }

    if (read_changed){
        var message = base.util.clone(req.message);
        var api = req.app.set('iapi');
        api.putDoc(message, function (response){
            if (!response.error){
                res.send({ok: true, info: "The message was successfully marked as unread."});
            }
            else {
                res.send({ok: false, error: "The message failed to be marked as unread: "+(response.reason || response.error)});
            }
        });
    }
    else {
        res.send({ok: true, info: "The message was successfully marked as unread."});
    }
}

/*function getNew(req, res, next){
    res.header("Content-type", "application/json");
    var api = req.app.set('iapi');
    api.messages.newcount({startkey: [req.player.handle.toLowerCase(), 0], endkey: [req.player.handle.toLowerCase(), 1]}, function (response){
        if (response.rows && response.rows.length){
            res.send({count: response.rows[0].value || 0});
        }
        else {
            res.send({count: 0});
        }
    });
}*/