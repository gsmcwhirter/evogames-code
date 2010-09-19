validators.change_email = function (required_fields){
    var self = this;
    
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
    
    this.email_cache = false;
    
    this.email_cache_loaded = function (){
        return this.email_cache ? true : false;
    };
    
    this.bind = function (field) {
        $("#"+field).bind('keyup blur',{field: field}, this.validate);
        this.validate({data: {field: field}});
    };
    
    this.validate = function (event) {
        var field = event.data.field;
        var sid = "#"+field+"_status"; 
        switch(field)
        {
            case "new_email":
                var re = new RegExp("^([a-zA-Z0-9_\\-.]+)@(([a-zA-Z0-9\\-]+\\.)+)([a-zA-Z]{2,9})$");
                var email = $.trim($("#"+field).val());
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
            case "new_email_confirm":
                var email_confirm = $.trim($("#"+field).val());
                if (email_confirm != $.trim($("#"+field.substring(-8)).val()))
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
            default:
                self.set_tooltip(field);
        }
    }
    
    this.fetch_emails(function (emails){
        self.email_cache = emails;
        required_fields.forEach(function (item){
            self.bind(item);
        });
    });
};

validators.change_email.prototype = new validators.validator();
validators.change_email.prototype.constructor = validators.change_email;
