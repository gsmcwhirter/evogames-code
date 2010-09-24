validators.create_group = function (required_fields){
    var self = this;
    
    this.fetch_codes = function (callback, force) {
        if (!this.code_cache || force)
        {
            $.get("/api/group_codes.json", function (data){
                callback(data);
            });
        }
        else
        {
            callback(this.code_cache);
        }
    };
    
    this.code_exists = function (code) {
        if (!this.code_cache)
        {
            return true;

        }
        else
        {
            if ($.inArray($.trim(code).toLowerCase(), this.code_cache) >= 0)
            {
                return true;
            }
            else
            {
                return false;
            }
        }
    }
    
    this.code_cache = false;
    
    this.code_cache_loaded = function (){
        return this.code_cache ? true : false;
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
            case "code":
                var re = new RegExp("^[a-zA-Z0-9\\-_\\[\\]]*$");
                var code = $.trim($("#"+field).val());
                if (code.length == 0)
                {
                    self.set_status_bad(sid, "Must not be empty.");
                    self.set_tooltip(field);
                }
                else if (!code.match(re))
                {
                    self.set_status_bad(sid, "Contains invalid characters.");
                    self.set_tooltip(field);
                }
                else if (self.code_exists(code))
                {
                    if (!self.code_cache_loaded())
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
            default:
                self.set_tooltip(field);
        }
    }
    
    this.fetch_codes(function (codes){
        self.code_cache = codes;
        required_fields.forEach(function (item){
            self.bind(item);
        });
    });
};

validators.create_group.prototype = new validators.validator();
validators.create_group.prototype.constructor = validators.create_group;
