var util = require('../../base/util');

var API = module.exports = function (couchdb, parent){
    this.couchdb = couchdb;
    this.parent = parent;
};

API.prototype.inbox = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    this.couchdb.Request("GET", "/_design/messages/_view/inbox/"+util.encodeOptions(options), callback);
};

API.prototype.outbox = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    this.couchdb.Request("GET", "/_design/messages/_view/outbox/"+util.encodeOptions(options), callback);
};

API.prototype.drafts = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    this.couchdb.Request("GET", "/_design/messages/_view/drafts/"+util.encodeOptions(options), callback);
};

API.prototype.newcount = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }
    if (typeof options.reduce == "undefined") options.reduce = true;
    if (options.reduce){
        if (typeof options.group == "undefined") options.group = true;
        if (typeof options.group_level == "undefined") options.group_level = 1;
    }

    this.couchdb.Request("GET", "/_design/messages/_view/unread/"+util.encodeOptions(options), callback);
};

API.prototype.sendMessage = function (message, callback){
    if (message && typeof message == "object"){
        if (typeof callback != "function") callback = function (){};
        message.type = "message";

        if (typeof message.status == "undefined"){
            message.status = {
                sent: true,
                date: (new Date()).toISOString()
            }
        }
        else {
            message.status.sent = true;
            message.status.date = (new Date()).toISOString();
        }

        if (typeof message.to == "undefined"){
            message.to = [];
        }

        if (typeof message.cc == "undefined"){
            message.cc = [];
        }

        if (typeof message.bcc == "undefined"){
            message.bcc = [];
        }

        var self = this;

        if (!message._id){
            this.parent.uuids(function (uuids){
                message._id = "message-"+uuids[0];

                self.parent.putDoc(message, callback);
            });
        }
        else {
            self.parent.putDoc(message, callback);
        }
    }
    else {
        callback({error: "no message provided"});
    }
};