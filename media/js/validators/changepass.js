validators.change_pass = function (required_fields){
    var self = this;
    
    this.bind = function (field) {
        $("#"+field).bind('click blur',{field: field}, this.validate);
        this.validate({data: {field: field}});
    };
    
    this.validate = function (event) {
        var field = event.data.field;
        var sid = "#"+field+"_status"; 
        switch(field)
        {
            case "new_password":
                var re = new RegExp("[^a-zA-Z]");
                var password = $.trim($("#"+field).val());
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
            case "new_password_confirm":
                var password_confirm = $.trim($("#"+field).val());
                if (password_confirm != $.trim($("#"+field.substring(-8)).val()))
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
            default:
                self.set_tooltip(field);
        }
    }
    
    
    required_fields.forEach(function (item){
        self.bind(item);
    });
        
};

validators.change_pass.prototype = new validators.validator();
validators.change_pass.prototype.constructor = validators.change_pass;
