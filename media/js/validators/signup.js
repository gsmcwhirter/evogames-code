form_validators.signup = {
    init: function(club_id) {
        form_validators.signup.fetch_users(club_id, function(){
            for(i in signup_required_fields)
            {
                form_validators.signup.bind(signup_required_fields[i]);
            }
        });
    }
    ,fetch_users: function(club_id, callback, force) {
        if(!form_validators.signup.user_cache || force)
        {
            $.get("/media/cache/aliases_"+club_id+".json",function(data){
                form_validators.signup.user_cache = _.map(data,function(item){return item.toLowerCase();});
                callback();
            });
        }
    }
    ,name_exists: function(name) {
        if(!form_validators.signup.user_cache)
        {
            return true;

        }
        else
        {
            if($.inArray($.trim(name).toLowerCase(),form_validators.signup.user_cache) >= 0)
            {
                return true;
            }
            else
            {
                return false;
            }
        }
    }
    ,user_cache: false
    ,bind: function(field) {
        $("#"+field).bind('keyup blur',{field: field},form_validators.signup.validate);
        $("#"+field).keyup();
    }
    ,validate: function(event, do_return) {
        switch(event.data.field)
        {
            case "player_alias":
                var re = new RegExp("([^a-zA-Z0-9_\\-.$!@()\\[\\]{}=+*?: ])");
                var name = $.trim($("#player_alias").val());
                if(name.length > 0 && name.length < 4)
                {
                    $("#player_alias_status").removeClass("status-field-ok")
                                            .removeClass("status-field-maybe")
                                            .addClass("status-field-not-ok")
                                            .attr("title","Must be empty or at least 4 characters long.");
                    form_validators.set_tooltip(event.data.field);
                    if(do_return) return false;
                }
                else if(name.match(re))
                {
                    $("#player_alias_status").removeClass("status-field-ok")
                                            .removeClass("status-field-maybe")
                                            .addClass("status-field-not-ok")
                                            .attr("title","Contains in-valid characters.");
                    form_validators.set_tooltip(event.data.field);
                    if(do_return) return false;
                }
                else if(form_validators.signup.name_exists(name))
                {
                    if(form_validators.signup.user_cache === false)
                    {
                        $("#player_alias_status").removeClass("status-field-ok")
                                                .removeClass("status-field-not-ok")
                                                .addClass("status-field-maybe")
                                                .attr("title","May not be unique.");
                        form_validators.set_tooltip(event.data.field);
                        if(do_return) return true;
                    }
                    else
                    {
                        $("#player_alias_status").removeClass("status-field-ok")
                                                .removeClass("status-field-maybe")
                                                .addClass("status-field-not-ok")
                                                .attr("title","Must be unique.");
                        form_validators.set_tooltip(event.data.field);
                        if(do_return) return false;
                    }
                }
                else
                {
                    $("#player_alias_status").removeClass("status-field-not-ok")
                                            .removeClass("status-field-maybe")
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
