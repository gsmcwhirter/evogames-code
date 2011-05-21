var util = require('../base/util');

module.exports = function (couchdb){
    this.couchdb = couchdb;
    var self = this;

    this.uuids = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        if (options.number)
        { 
            self.couchdb.getIDs(options.number, callback);
        }
        else
        {
            self.couchdb.getIDs(callback);
        }
    };
    
    this.getDoc = function (id, callback){
        if (!id) { throw "Must be given an ID"; }
        
        var creq = new self.couchdb.Request("GET", "/"+encodeURIComponent(id), callback);
    };
    
    this.putDoc = function (doc, callback){
        if (!doc || !doc._id) { throw "Document must have an _id"; }
        
        var url = "/"+doc._id;
        if (doc._rev) url += "?rev="+doc._rev;
        
        var creq = new self.couchdb.Request(callback);
        creq.go("PUT", url, {data: JSON.stringify(doc), headers: {"Content-type": "application/json"}});
    };
    
    this.delDoc = function (doc, callback){
        if (!doc || !doc._id || !doc._rev) { throw "Document must have an _id and a _rev"; }
        
        var creq = new self.couchdb.Request("DELETE", "/"+doc._id+"?rev="+doc._rev, callback);
    };
    
    this.userList = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
    
        var creq = new self.couchdb.Request("GET", "/_design/player/_view/handles/"+util.encodeOptions(options), callback);
    };
    
    this.emailList = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/player/_view/emails/"+util.encodeOptions(options), callback);
    };
    
    this.pendingEmails = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/player/_view/pending_emails/"+util.encodeOptions(options), callback);
    };

    this.loginTokens = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/player/_view/login_tokens/"+util.encodeOptions(options), callback);
    };
    
    this.recentRegistrations = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/player/_view/recent_registrations/"+util.encodeOptions(options), callback);
    };

    this.playerSearch = function (options, callback){
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
        
        util.inParallel(
            function (cb){
                var opts = JSON.parse(opts_string);
                if (opts.endkey){
                    opts.endkey.push(1);
                }
                
                var creq = new self.couchdb.Request("GET", "/_design/player/_view/search/"+util.encodeOptions(opts), function (response){
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
                
                var creq = new self.couchdb.Request("GET", "/_design/player/_view/search/"+util.encodeOptions(opts), function (response){
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
    
    this.menus = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/admin/_view/menus/"+util.encodeOptions(options), callback);
    };
    
    this.allArticles = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/news/_view/all_articles/"+util.encodeOptions(options), callback);
    };
    
    this.draftArticles = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/news/_view/draft_articles/"+util.encodeOptions(options), callback);
    };
    
    this.publishedArticles = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/news/_view/published_articles/"+util.encodeOptions(options), callback);
    };
    
    this.tagList = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        if (typeof options.group == "undefined") options.group = true;
        
        var creq = new self.couchdb.Request("GET", "/_design/news/_view/tags/"+util.encodeOptions(options), callback);
    };
    
    this.tagArticles = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        if (typeof options.reduce == "undefined") options.reduce = false;
        
        var creq = new self.couchdb.Request("GET", "/_design/news/_view/tags/"+util.encodeOptions(options), callback);
    };
    
    this.slugList = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/news/_view/slugs/"+util.encodeOptions(options), callback);
    };

    this.groupNames = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }

        var creq = new self.couchdb.Request("GET", "/_design/group/_view/names/"+util.encodeOptions(options), callback);
    };
    
    this.groupCodes = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/group/_view/codes/"+util.encodeOptions(options), callback);
    };
    
    this.groupsByOwner = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }
        
        var creq = new self.couchdb.Request("GET", "/_design/group/_view/owners/"+util.encodeOptions(options), callback);
    };

    this.ownersByGroup = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }

        var creq = new self.couchdb.Request("GET", "/_design/group/_view/group_owners/"+util.encodeOptions(options), callback);
    }

    this.recentGroups = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }

        var creq = new self.couchdb.Request("GET", "/_design/group/_view/recently_created/"+util.encodeOptions(options), callback);
    };

    this.groupMembershipsByHandle = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }

        var creq = new self.couchdb.Request("GET", "/_design/group/_view/membership_by_handle/"+util.encodeOptions(options), callback);
    };

    this.groupMembershipsById = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }

        var creq = new self.couchdb.Request("GET", "/_design/group/_view/membership_by_id/"+util.encodeOptions(options), callback);
    };

    this.groupInvitationsByHandle = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }

        var creq = new self.couchdb.Request("GET", "/_design/group/_view/invitations_by_handle/"+util.encodeOptions(options), callback);
    };

    this.groupInvitationsById = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }

        var creq = new self.couchdb.Request("GET", "/_design/group/_view/invitations_by_id/"+util.encodeOptions(options), callback);
    };

    this.groupAdmins = function (options, callback){
        if (typeof(options) == "function") { callback = options, options = {}; }

        var creq = new self.couchdb.Request("GET", "/_design/group/_view/admins/"+util.encodeOptions(options), callback);
    };

    this.groupSearch = function (options, callback){
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

        util.inParallel(
            function (cb){
                var opts = JSON.parse(opts_string);
                if (opts.endkey){
                    opts.endkey.push(1);
                }

                var creq = new self.couchdb.Request("GET", "/_design/group/_view/search/"+util.encodeOptions(opts), function (response){
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

                var creq = new self.couchdb.Request("GET", "/_design/group/_view/search/"+util.encodeOptions(opts), function (response){
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
    
    this.ticketList = function (options, callback, reduce){
        if (typeof(options) == "function") { reduce = callback, callback = options, options = {}; }
        options.reduce = options.reduce || reduce || false;
    
        var creq = new self.couchdb.Request("GET", "/_design/ticket/_view/list/"+util.encodeOptions(options), callback);
    };
    
    this.ticketTypes = function (options, callback, reduce){
        if (typeof(options) == "function") { reduce = callback, callback = options, options = {}; }
        options.reduce = options.reduce || reduce || false;
        
        var creq = new self.couchdb.Request("GET", "/_design/ticket/_view/by_type/"+util.encodeOptions(options), callback);
    };
    
    this.ticketTags = function (options, callback, reduce){
        if (typeof(options) == "function") { reduce = callback, callback = options, options = {}; }
        options.reduce = options.reduce || reduce || false;
        
        var creq = new self.couchdb.Request("GET", "/_design/ticket/_view/by_tag/"+util.encodeOptions(options), callback);
    };
    
    this.ticketStatus = function (options, callback, reduce){
        if (typeof(options) == "function") { reduce = callback, callback = options, options = {}; }
        options.reduce = options.reduce || reduce || false;
        
        var creq = new self.couchdb.Request("GET", "/_design/ticket/_view/by_status/"+util.encodeOptions(options), callback);
    };
    
    this.ticketMilestones = function (options, callback, reduce){
        if (typeof(options) == "function") { reduce = callback, callback = options, options = {}; }
        options.reduce = options.reduce || reduce || false;
        
        var creq = new self.couchdb.Request("GET", "/_design/ticket/_view/by_milestone/"+util.encodeOptions(options), callback);
    };
    
    this.ticketOwners = function (options, callback, reduce){
        if (typeof(options) == "function") { reduce = callback, callback = options, options = {}; }
        options.reduce = options.reduce || reduce || false;
        
        var creq = new self.couchdb.Request("GET", "/_design/ticket/_view/by_owner/"+util.encodeOptions(options), callback);
    };
    
    this.ticketAssignments = function (options, callback, reduce){
        if (typeof(options) == "function") { reduce = callback, callback = options, options = {}; }
        options.reduce = options.reduce || reduce || false;
        
        var creq = new self.couchdb.Request("GET", "/_design/ticket/_view/by_assigned/"+util.encodeOptions(options), callback);
    };
};
