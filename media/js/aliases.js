var aliases = {
    remove: function (event){
        var li = $(event.target).parent();
        var alias = $.trim(li.find(".alias").html());
        $.ajax({
            type: 'delete',
            url: '/player/aliases/remove/'+alias,
            success: function (data, textStatus){
                if (data.ok)
                {
                    site.flash('info', 'Alias removed successfully.');
                    li.remove();
                    $("#aliases .default").remove();
                    $("#aliases").children().first().children(".alias").after($("<span class='default'>(Default)</span>"));
                }
                else
                {
                    site.flash('error', 'Alias not removed: '+data.error);
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown){
                site.flash('error', 'Request error');
            }
        });
        
        return false;
    },
    set_default: function (event){
        var li = $(event.target).parent();
        var alias = $.trim(li.find(".alias").html());
        $.ajax({
            type: 'put',
            url: '/player/aliases/default',
            data: {alias: alias},
            dataType: 'json',
            success: function (data, textStatus){
                if (data.ok)
                {
                    site.flash('info', 'Set default alias successfully.');
                    $("#aliases").find(".default").remove();
                    li.detach().prependTo("#aliases").children(".alias").after($("<span class='default'>(Default)</span>"));
                }
                else
                {
                    site.flash('error', 'Default alias not set: '+data.error);
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown){
                site.flash('error', 'Request error');
            }
        });
        
        return false;
    },
    add: function (event){
        $.ajax({
            type: 'put',
            url: '/player/aliases/add',
            data: $(this).serialize(),
            dataType: 'json',
            processData: false,
            success: function (data, textStatus){
                if (data.ok)
                {
                    site.flash('info', 'Alias added successfully.');
                    if (data.message != "alias exists")
                    {
                        aliases.display_alias(data.alias);
                    }
                    
                    $("#add-link").show();
                    $("#alias-add-form").hide();
                    $("#alias").val('');
                }
                else
                {
                    site.flash('error', 'Alias not added: '+data.error);
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown){
                site.flash('error', 'Request error');
            }
        });
        
        return false;
    },
    refresh: function (event){
        $.get("/player/aliases/list", function (data){
            if (data.ok)
            {
                $("#aliases").empty();
                data.aliases.forEach(function (alias){
                    aliases.display_alias(alias);
                });
            }
        });
        
        return false;
    },
    display_alias: function (alias){
        $("#aliases").append($("<li><span class='alias'>"+alias+"</span></li>")
                        .append($("<a href='#' class='remove'>Remove</a>").bind('click', aliases.remove))
                        .append($("<a href='#' class='set-default'>Set Default</a>").bind('click', aliases.set_default)));
    }
};
