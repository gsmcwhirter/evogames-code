form_validators.changename = {
    init: function() {
        form_validators.changename.fetch_users();
        setTimeout(function(){
            for(i in changename_required_fields)
            {
                form_validators.changename.bind(changename_required_fields[i]);
            }
        }, 1000);
    }
    ,fetch_users: function(force) {
        if(!form_validators.changename.user_cache || force)
        {
            $.get("/media/cache/users.json",function(data){
                form_validators.changename.user_cache = _.map(data,function(item){return item.toLowerCase();});
            });
        }
    }
    ,name_exists: function(name) {
        if(!form_validators.changename.user_cache)
        {
            return true;

        }
        else
        {
            if($.inArray($.trim(name).toLowerCase(),form_validators.changename.user_cache) >= 0)
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
    , bind: function(field) {

        $("#"+field).bind('keyup blur',{field: field},form_validators.changename.validate);
        $("#"+field).keyup();
    }
    , validate: function(event, do_return) {
        switch(event.data.field)
        {
            case "player_name":
                var re = new RegExp("([^a-zA-Z0-9_\\-.$!@()\\[\\]{}=+*?: ])");
                var name = $.trim($("#player_name").val());
                if(name.length < 4)
                {
                    $("#player_name_status").removeClass("status-field-ok")
                                            .removeClass("status-field-maybe")
                                            .addClass("status-field-not-ok")
                                            .attr("title","Must be at least 4 characters long.");
                    form_validators.set_tooltip(event.data.field);
                    if(do_return) return false;
                }
                else if(name.match(re))
                {
                    $("#player_name_status").removeClass("status-field-ok")
                                            .removeClass("status-field-maybe")
                                            .addClass("status-field-not-ok")
                                            .attr("title","Contains in-valid characters.");
                    form_validators.set_tooltip(event.data.field);
                    if(do_return) return false;
                }
                else if(form_validators.changename.name_exists(name))
                {
                    if(!form_validators.changename.user_cache)
                    {
                        $("#player_name_status").removeClass("status-field-ok")
                                                .removeClass("status-field-not-ok")
                                                .addClass("status-field-maybe")
                                                .attr("title","May not be unique.");
                        form_validators.set_tooltip(event.data.field);
                        if(do_return) return true;
                    }
                    else
                    {
                        $("#player_name_status").removeClass("status-field-ok")
                                                .removeClass("status-field-maybe")
                                                .addClass("status-field-not-ok")
                                                .attr("title","Must be unique.");
                        form_validators.set_tooltip(event.data.field);
                        if(do_return) return false;
                    }
                }
                else
                {
                    $("#player_name_status").removeClass("status-field-not-ok")
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
