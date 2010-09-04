form_validators.changeemail = {
    init: function() {
        form_validators.changeemail.fetch_emails();
        setTimeout(function(){
            for(i in changeemail_required_fields)
            {
                form_validators.changeemail.bind(changeemail_required_fields[i]);
            }
        },1000);
    }
    ,fetch_emails: function(force) {
        if(!form_validators.changeemail.email_cache || force)
        {
            $.get("/media/cache/emails.json",function(data){
                form_validators.changeemail.email_cache = data;
            });
        }
    }
    ,email_exists: function(email) {
        if(!form_validators.changeemail.email_cache)
        {
            return true;

        }
        else
        {
            if($.inArray(hex_sha1($.trim(email).toLowerCase()),form_validators.changeemail.email_cache) >= 0)
            {
                return true;
            }
            else
            {
                return false;
            }
        }
    }
    ,email_cache: false
    , bind: function(field) {
        $("#"+field).bind('keyup blur',{field: field},form_validators.changeemail.validate);
        $("#"+field).keyup();
    }
    , validate: function(event, do_return) {
        switch(event.data.field)
        {
            case "email":
                var re = new RegExp("^([a-zA-Z0-9_\\-.]+)@(([a-zA-Z0-9\\-]+\\.)+)([a-zA-Z]{2,9})$");
                var email = $.trim($("#email").val());
                if(email.length == 0)
                {
                    $("#email_status").removeClass("status-field-ok")
                                      .removeClass("status-field-maybe")
                                      .addClass("status-field-not-ok")
                                      .attr("title","Must not be empty.");
                    form_validators.set_tooltip(event.data.field);
                    if(do_return) return false;
                }
                else if(!email.match(re))
                {
                    $("#email_status").removeClass("status-field-ok")
                                      .removeClass("status-field-maybe")
                                      .addClass("status-field-not-ok")
                                      .attr("title","Has invalid format.");
                    form_validators.set_tooltip(event.data.field);
                    if(do_return) return false;
                }
                else if(form_validators.changeemail.email_exists(email))
                {
                    if(!form_validators.changeemail.email_cache)
                    {
                        $("#email_status").removeClass("status-field-ok")
                                          .removeClass("status-field-not-ok")
                                          .addClass("status-field-maybe")
                                          .attr("title","May not be unique.");
                        form_validators.set_tooltip(event.data.field);
                        if(do_return) return true;
                    }
                    else
                    {
                        $("#email_status").removeClass("status-field-ok")
                                          .removeClass("status-field-maybe")
                                          .addClass("status-field-not-ok")
                                          .attr("title","Must be unique.");
                        form_validators.set_tooltip(event.data.field);
                        if(do_return) return false;
                    }
                }
                else
                {
                    $("#email_status").removeClass("status-field-not-ok")
                                      .removeClass("status-field-maybe")
                                      .addClass("status-field-ok")
                                      .attr("title","OK");
                    form_validators.set_tooltip(event.data.field);
                    if(do_return) return true;
                }
                break;
            case "email_confirm":
                var email_confirm = $.trim($("#email_confirm").val());
                if(email_confirm.length == 0)
                {
                    $("#email_confirm_status").removeClass("status-field-ok")
                                              .addClass("status-field-not-ok")
                                              .attr("title","Must not be empty.");
                    form_validators.set_tooltip(event.data.field);
                    if(do_return) return false;
                }
                else if(email_confirm != $.trim($("#email").val()))
                {
                    $("#email_confirm_status").removeClass("status-field-ok")
                                              .addClass("status-field-not-ok")
                                              .attr("title","Must match e-mail.");
                    form_validators.set_tooltip(event.data.field);
                    if(do_return) return false;
                }
                else
                {
                    $("#email_confirm_status").removeClass("status-field-not-ok")
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
