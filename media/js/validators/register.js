form_validators.register = function (register_required_fields){
    var self = this;
    
    this.fetch_users = function (callback, force) {
        if (!this.user_cache || force)
        {
            $.get("/api/users.json", function (data){
                callback(_.map(data, function (item){return item.toLowerCase();}));
            });
        }
        else
        {
            callback(this.user_cache);
        }
    };
    
    this.fetch_emails = function (callback, force) {
        if (!this.email_cache || force)
        {
            $.get("/api/emails.json", function (data){
                callback(data);
            });
        }
        else
        {
            callback(this.email_cache);
        }
    };
    
    this.name_exists = function (name) {
        if (!this.user_cache)
        {
            return true;

        }
        else
        {
            if ($.inArray($.trim(name).toLowerCase(), this.user_cache) >= 0)
            {
                return true;
            }
            else
            {
                return false;
            }
        }
    };
    
    this.email_exists = function (email) {
        if (!this.email_cache)
        {
            return true;

        }
        else
        {
            if ($.inArray(hex_sha1($.trim(email).toLowerCase()), this.email_cache) >= 0)
            {
                return true;
            }
            else
            {
                return false;
            }
        }
    }
    
    this.user_cache = false;
    this.email_cache = false;
    
    this.user_cache_loaded = function (){
        return this.user_cache ? true : false;
    };
    
    this.email_cache_loaded = function (){
        return this.email_cache ? true : false;
    };
    
    this.bind = function (field) {
        if (field != "agreement")
        {
            $("#"+field).bind('keyup blur',{field: field}, this.validate);
            $("#"+field).keyup();
        }
        else
        {
            $("#"+field).bind('click blur',{field: field}, this.validate);
            this.validate({data: {field: field}});
        }
    };
    
    this.validate = function (event) {
        var field = event.data.field;
        var sid = "#"+field+"_status"; 
        switch(field)
        {
            case "handle":
                var name = $.trim($("#"+field).val());
                if (name.length < 3)
                {
                    self.set_status_bad(sid, "Must be at least 3 characters long.");
                    self.set_tooltip(field);
                }
                else if (self.name_exists(name))
                {
                    if (!self.user_cache_loaded())
                    {
                        self.set_status_maybe(sid, "May not be unique.");
                        self.set_tooltip(field);
                    }
                    else
                    {
                        self.set_status_bad(sid, "Must be unique.");
                        self.set_tooltip(field);
                    }
                }
                else
                {
                    self.set_status_ok(sid, "OK");
                    self.set_tooltip(field);
                }
                break;
            case "name":
                var name = $.trim($("#"+field).val());
                if (name.length < 3)
                {
                    self.set_status_bad(sid, "Must be at least 3 characters long.");
                    self.set_tooltip(field);
                }
                else
                {
                    self.set_status_ok(sid, "OK");
                    self.set_tooltip(field);
                }
                break;
            case "email":
                var re = new RegExp("^([a-zA-Z0-9_\\-.]+)@(([a-zA-Z0-9\\-]+\\.)+)([a-zA-Z]{2,9})$");
                var email = $.trim($("#email").val());
                if (email.length == 0)
                {
                    self.set_status_bad(sid, "Must not be empty.");
                    self.set_tooltip(field);
                }
                else if (!email.match(re))
                {
                    self.set_status_bad(sid, "Has invalid format.");
                    self.set_tooltip(field);
                }
                else if (self.email_exists(email))
                {
                    if (!self.email_cache_loaded())
                    {
                        self.set_status_maybe(sid, "May not be unique.");
                        self.set_tooltip(field);
                    }
                    else
                    {
                        self.set_status_bad(sid, "Must be unique.");
                        self.set_tooltip(field);
                    }
                }
                else
                {
                    self.set_status_ok(sid, "OK");
                    self.set_tooltip(field);
                }
                break;
            case "email_confirm":
                var email_confirm = $.trim($("#email_confirm").val());
                if (email_confirm != $.trim($("#email").val()))
                {
                    self.set_status_bad(sid, "Must match e-mail.");
                    self.set_tooltip(field);
                }
                else if (email_confirm == '')
                {
                    self.set_status_maybe(sid, "Must not be empty.");
                    self.set_tooltip(field);
                }
                else
                {
                    self.set_status_ok(sid, "OK");
                    self.set_tooltip(field);
                }
                break;
            case "password":
                var re = new RegExp("[^a-zA-Z]");
                var password = $.trim($("#password").val());
                if (password.length < 8)
                {
                    self.set_status_bad(sid, "Must be at least 8 characters long.");
                    self.set_tooltip(field);
                }
                else if (!password.match(re))
                {
                    self.set_status_bad(sid, "Must contain at least one non-letter.");
                    self.set_tooltip(field);
                }
                else
                {
                    self.set_status_ok(sid, "OK");
                    self.set_tooltip(field);
                }
                break;
            case "password_confirm":
                var password_confirm = $.trim($("#password_confirm").val());
                if (password_confirm != $.trim($("#password").val()))
                {
                    self.set_status_bad(sid, "Must match password.");
                    self.set_tooltip(field);
                }
                else if (password_confirm == '')
                {
                    self.set_status_maybe(sid, "Must not be empty.");
                    self.set_tooltip(field);
                }
                else
                {
                    self.set_status_ok(sid, "OK");
                    self.set_tooltip(field);
                }
                break;
            case "agreement":
                if (!$("#agreement").is(":checked"))
                {
                    self.set_status_bad(sid, "You must agree.");
                    self.set_tooltip(field);
                }
                else
                {
                    self.set_status_ok(sid, "OK");
                    self.set_tooltip(field);
                }
                break;
            default:
                self.set_tooltip(field);
        }
    }
    
    var email_done = false;
    var user_done = false;
    var init_cb = function (type){
        type = type || '';
        
        if (email_done && user_done)
        {
            register_required_fields.forEach(function (item){
                self.bind(item);
            });
        }
        else
        {
            if (type == 'email') email_done = true;
            if (type == 'user') user_done = true;
            
            init_cb();
        }
    };
    
    this.fetch_emails(function (emails){
        self.email_cache = emails;
        init_cb('email');
    });
    
    this.fetch_users(function (users){
        self.user_cache = users;
        init_cb('user');    
    });
};

form_validators.register.prototype = new form_validators.validator();
form_validators.register.prototype.constructor = form_validators.register;
