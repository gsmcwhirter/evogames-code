form_validators.recover = {
    init: function() {
        for(i in recover_required_fields)
        {
            form_validators.recover.bind(recover_required_fields[i]);
        }
    }
    , bind: function(field) {
        $("#"+field).bind('keyup blur',{field: field},form_validators.recover.validate);
        $("#"+field).keyup();
    }
    , validate: function(event, do_return) {
        switch(event.data.field)
        {
            case "password":
                var re = new RegExp("[^a-zA-Z]");
                var password = $.trim($("#password").val());
                if(password.length < 8)
                {
                    $("#password_status").removeClass("status-field-ok")
                                         .addClass("status-field-not-ok")
                                         .attr("title","Must be at least 8 characters long.");
                    form_validators.set_tooltip(event.data.field);
                    if(do_return) return false;
                }
                else if(!password.match(re))
                {
                    $("#password_status").removeClass("status-field-ok")
                                         .addClass("status-field-not-ok")
                                         .attr("title","Must contain at least one non-letter.");
                    form_validators.set_tooltip(event.data.field);
                    if(do_return) return false;
                }
                else
                {
                    $("#password_status").removeClass("status-field-not-ok")
                                         .addClass("status-field-ok")
                                         .attr("title","OK");
                    form_validators.set_tooltip(event.data.field);
                    if(do_return) return false;
                }
                break;
            case "password_confirm":
                var password_confirm = $.trim($("#password_confirm").val());
                if(password_confirm.length < 8)
                {
                    $("#password_confirm_status").removeClass("status-field-ok")
                                                 .addClass("status-field-not-ok")
                                                 .attr("title","Must be at least 8 characters long.");
                    form_validators.set_tooltip(event.data.field);
                    if(do_return) return false;
                }
                else if(password_confirm != $.trim($("#password").val()))
                {
                    $("#password_confirm_status").removeClass("status-field-ok")
                                                 .addClass("status-field-not-ok")
                                                 .attr("title","Must match password.");
                    form_validators.set_tooltip(event.data.field);
                    if(do_return) return false;
                }
                else
                {
                    $("#password_confirm_status").removeClass("status-field-not-ok")
                                                 .addClass("status-field-ok")
                                                 .attr("title","OK");
                    form_validators.set_tooltip(event.data.field);
                    if(do_return) return true;
                }
                break;
            default:
                form_validators.set_tooltip(event.data.field);
                return false;
        }
    }
}
