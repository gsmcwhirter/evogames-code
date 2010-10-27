$("#aliases").evently({

    _init: {
        before: function (){
            $("a.set-default").unbind('click.set-default');
            $("a.remove").unbind('click.remove');
        },
        selectors: {
            "a.set-default": {
                "click.set-default": function (){
                    $("#aliases").trigger("save_default", [$(this).parent()]);
                    return false;
                }
            },
            
            "a.remove": {
                "click.remove": function (){
                    $("#aliases").trigger("remove", [$(this).parent()]);
                    return false;
                }
            }
        },
        
        after: function (){
        
        }
    },
    
    "set_default": function (e, target){
        var self = $(this);
        
        self.trigger("clear_default");
        if (target){
            target = $(target);
        
            self.prepend(target.detach());
        }
        else {
            target = $("li.alias", self).first();
        }
        $(".alias", target).after("<span class='default'>(Default)</span>");
        
    },
    
    "save_default": function (e, target){
        var self = $(this);
        target = $(target);
        if (!$(".default", target).length){
            var alias = $.trim($(".alias", target).html());
            $.ajax({
                type: 'put',
                url: '/player/aliases/default',
                data: {alias: alias},
                dataType: 'json',
                success: function (data, textStatus){
                    if (data.ok)
                    {
                        $("#flash").trigger("info", ['Set default alias successfully.']);
                        self.trigger("set_default", [target]);
                    }
                    else
                    {
                        $("#flash").trigger('error', ['Default alias not set: '+data.error]);
                    }
                },
                error: function (XMLHttpRequest, textStatus, errorThrown){
                    $("#flash").trigger('error', 'Request error');
                }
            });
        }
    },
    
    "remove_default": function (e, target){
        $(".default", $(target)).remove();
    },
    
    "remove": function (e, target){
        var self = $(this);
        target = $(target);
        
        var alias = $.trim($(".alias", target).html());
        $.ajax({
            type: 'delete',
            url: '/player/aliases/remove/'+alias,
            success: function (data, textStatus){
                if (data.ok)
                {
                    $("#flash").trigger('info', ['Alias removed successfully.']);
                    target.remove();
                    $("#aliases").trigger("set_default");
                }
                else
                {
                    $("#flash").trigger('error', ['Alias not removed: '+data.error]);
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown){
                $("#flash").trigger('error', 'Request error');
            }
        });
    },
    
    "clear_default": function (){
        var self = $(this);
        $("li.alias .default", self).remove();
    },
    
    "add": function (e, alias){
        var self = $(this);
        self.append($("<li class='alias'><span class='alias'>"+alias+"</span></li>")
                        .append("<a href='#' class='remove'>Remove</a>")
                        .append("<a href='#' class='set-default'>Set Default</a>"));
        self.trigger("_init");
    },
    
    "refresh": function (){
        var self = $(this);
        $.get("/player/aliases/list", function (data){
            if (data.ok)
            {
                self.empty();
                data.aliases.forEach(function (alias){
                    self.trigger("add", [alias]);
                });
                self.trigger("set_default");
            }
        });
    }
});

$("a#add-link").evently({
    click: function (){
        var self = $(this);
        self.trigger("hide");
        $("#alias-add-form").trigger("show");
        
        return false;
    },
    
    hide: function (){
        var self = $(this);
        self.hide();
    },
    
    show: function (){
        var self = $(this);
        self.show();
    }
});

$("#alias-add-form").evently({
    submit: function (){
        var self = $(this);
        $.ajax({
            type: 'put',
            url: '/player/aliases/add',
            data: self.serialize(),
            dataType: 'json',
            processData: false,
            success: function (data, textStatus){
                if (data.ok){
                    $("#flash").trigger('info', ['Alias added successfully.']);
                    if (data.message != "alias exists"){
                        $("#aliases").trigger("add", [data.alias]);
                    }
                    
                    $("#alias-add-form").trigger("hide");
                }
                else {
                    $("#flash").trigger('error', ['Alias not added: '+data.error]);
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown){
                $("#flash").trigger('error', ['Request error']);
            }
        });
        
        return false;
    },
    
    show: function (){
        var self = $(this);
        self.show();
        $(".alias", self).first().focus();
    },
    
    hide: function (){
        var self = $(this);
        self.hide();
        $("input[name=alias]", self).val('');
        $("a#add-link").trigger("show");
    }
});

$("button.cancel").evently({
    click: function (){
        $("#alias-add-form").trigger("hide");
        
        return false;
    }
});

$("a#refresh-link").evently({
    click: function (){
        console.log("refresh");
        $("#aliases").trigger("refresh");
        
        return false;
    }
});

