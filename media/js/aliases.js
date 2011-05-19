$(function (){
    var aliases = $.sammy("#alias-block", function (){
        this.use(Sammy.JSON);

        var _app = this;

        function clickRemove(){
            _app.trigger("remove", {target: $(this).parent()});
            return false;
        }

        function clickSetDefault(){
            _app.trigger("save-default", {target: $(this).parent()});
            return false;
        }

        this.bind('run', function (){
            this.log("H-1");
            this.$element("a.set-default").bind('click', clickSetDefault);
            this.$element("a.remove").bind('click', clickRemove);
        });

        this.bind('set-default', function (e, data){
            this.log("H1");

            var target = data.target;
            var self = this.$element("#aliases");

            this.trigger('clear-default');
            if (target){
                self.prepend(target);
            }
            else {
                target = $("li.alias", self).first();
            }

            $(".alias", target).after("<span class='default'>(Default)</span>");
        });

        this.bind('save-default', function (e, data){
            this.log("H0");

            this.log(this);
            
            var target = $(data.target);

            if (!$(".default", target).length){
                this.log("H0.5");
                var alias = $.trim($(".alias", target).html());
                $.ajax({
                    type: 'put',
                    url: '/player/controls/aliases/default',
                    data: {alias: alias},
                    dataType: 'json',
                    success: function (data, textStatus){
                        if (data.ok)
                        {
                            _app.log("H0.6");
                            $("#flash").trigger("info", ['Set default alias successfully.']);
                            _app.trigger("set-default", {target: target});
                        }
                        else
                        {
                            _app.log("H0.7")
                            $("#flash").trigger('error', ['Default alias not set: '+data.error]);
                        }
                    },
                    error: function (XMLHttpRequest, textStatus, errorThrown){
                        $("#flash").trigger('error', 'Request error');
                    }
                });
            }

            return false;
        });

        this.bind('remove-default', function (e, data){
            var target = data.target;
            $(".default", target).remove();
        });

        this.bind('remove', function (e, data){
            var target = data.target;
            var alias = $.trim($(".alias", target).html());

            $.ajax({
                type: 'delete',
                url: '/player/controls/aliases/remove/'+alias,
                success: function (data, textStatus){
                    if (data.ok){
                        $("#flash").trigger('info', ['Alias removed successfully.']);
                        target.remove();
                        _app.trigger("set-default");
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
        });

        this.bind('clear-default', function (){
            this.$element("#aliases li.alias .default").remove();
        });

        this.bind('add', function (e, data){
            var alias = data.alias;
            var self = this.$element("#aliases");
            self.append($("<li class='alias'><span class='alias'>"+alias+"</span></li>")
                            .append($("<a href='#' class='remove'>Remove</a>").bind('click.remove', clickRemove))
                            .append($("<a href='#' class='set-default'>Set Default</a>").bind('click.set-default', clickSetDefault)));
        });

        this.bind('hide-form', function (){
            var theform = $("#alias-add-form");
            theform.hide();
            $("input[name=alias]", theform).val('');
            $("a#add-link").show();
        });

        function noop(){}

        this.get("", noop);
        this.get("#!/", noop);

        this.get("#!/add", function (){
            var theform = $("#alias-add-form");
            theform.show();
            $("a#add-link").hide();
            $(".alias", theform).first().focus();
        });

        this.post("#!/add", function (context){
            var self = this;
            
            $.ajax({
                type: 'put',
                url: '/player/controls/aliases/add',
                data: $.param({alias: this.params.alias}),
                dataType: 'json',
                processData: false,
                success: function (data, textStatus){
                    if (data.ok){
                        $("#flash").trigger('info', ['Alias added successfully.']);
                        if (data.message != "alias exists"){
                            _app.trigger('add', {alias: data.alias});
                        }

                        _app.trigger("hide-form");
                        self.redirect("#!/");
                    }
                    else {
                        $("#flash").trigger('error', ['Alias not added: '+data.error]);
                    }
                },
                error: function (XMLHttpRequest, textStatus, errorThrown){
                    $("#flash").trigger('error', ['Request error']);
                }
            });

            //return false;
        });

        this.get("#!/cancel", function (){
            this.trigger('hide-form');
            this.redirect("#!/");
        });
    });

    aliases.run();
});