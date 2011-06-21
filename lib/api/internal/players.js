var util = require('../../base/util');

var API = module.exports = function (couchdb, parent){
    this.couchdb = couchdb;
    this.parent = parent;
};

API.prototype.avatars = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    var creq;
    if (typeof options.keys != "undefined"){
        this.couchdb.Request("POST", "/_design/player/_view/avatars/", {"Content-type": "application/json", data: JSON.stringify({keys: options.keys})}, callback);
    }
    else {
        this.couchdb.Request("GET", "/_design/player/_view/avatars/"+util.encodeOptions(options), callback);
    }
}

API.prototype.handles = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    this.couchdb.Request("GET", "/_design/player/_view/handles/"+util.encodeOptions(options), callback);
};

API.prototype.emails = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    this.couchdb.Request("GET", "/_design/player/_view/emails/"+util.encodeOptions(options), callback);
};

API.prototype.pendingEmails = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    this.couchdb.Request("GET", "/_design/player/_view/pending_emails/"+util.encodeOptions(options), callback);
};

API.prototype.loginTokens = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    this.couchdb.Request("GET", "/_design/player/_view/login_tokens/"+util.encodeOptions(options), callback);
};

API.prototype.recent = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    this.couchdb.Request("GET", "/_design/player/_view/recent_registrations/"+util.encodeOptions(options), callback);
};

API.prototype.search = function (options, callback){
    if (typeof(options) == "function") { callback = options, options = {}; }

    function makeKey(letter_array){
        var new_array = []
        for (var i = 0; i < letter_array.length; i++){
            new_array[2 * i] = letter_array[i].toLowerCase();
            new_array[2 * i + 1] = 0;
        }

        new_array.pop();

        return new_array;
    }

    if (options.key){
        options.key = makeKey(options.key.split(''));
    }

    if (options.startkey){
        options.startkey = makeKey(options.startkey.split(''));
    }

    if (options.endkey){
        options.endkey = makeKey(options.endkey.split(''));
    }

    var opts_string = JSON.stringify(options);

    var errors = false;
    var total_response = {
        rows: []
    };

    var self = this;

    util.inParallel(
        function (cb){
            var opts = JSON.parse(opts_string);
            if (opts.endkey){
                opts.endkey.push(1);
            }

            self.couchdb.Request("GET", "/_design/player/_view/search/"+util.encodeOptions(opts), function (response){
                if (response.error){
                    errors = true;
                    total_response = response;
                }
                else if (!errors){
                    total_response.rows = total_response.rows.concat(response.rows);
                }

                cb();
            });
        },
        function (cb){
            var opts = JSON.parse(opts_string);
            if (opts.key){
                opts.key = opts.key.reverse();
            }

            if (opts.startkey){
                opts.startkey = opts.startkey.reverse();
            }

            if (opts.endkey){
                opts.endkey = opts.endkey.reverse();
                opts.endkey.push(1);
            }

            self.couchdb.Request("GET", "/_design/player/_view/search/"+util.encodeOptions(opts), function (response){
                if (response.error){
                    errors = true;
                    total_response = response;
                }
                else if (!errors){
                    total_response.rows = total_response.rows.concat(response.rows);
                }

                cb();
            });
        },
        function (){
            callback(total_response);
        }
    );
};