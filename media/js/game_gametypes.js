$(function (){
    var gametypes = $.sammy("#gametypes", function (){
        this.use("JSON");
        var _app = this;

        function _statname_change(){
           var index = $(this).parents("li").first().index();
           var modal = $(this).parents(".edit-form").first();
           $("ul.weights", modal).find("li").eq(index + 4).trigger("name-change", [$(this).val()]);
       }

        function _edit_gametype(){
            $(this).parents(".gametype").first().trigger("start-edit");
        }

        function _delete_gametype(){
            $("#delete-modal .gametype-name").text($(this).parents(".display").first().find(".gtname").text());
            $("#delete-modal").trigger("open-overlay");
        }

        function _cancel_edit(){
            $(this).parents(".gametype:first").trigger("cancel-edit");
        }

        function _new_stat(){
            var self = $(this);

            $("ul.stats li.add", self).before($("#stattype-template").clone(true).attr('id',''));
            $("ul.weights", self).append($("#weight-template").clone(true).attr('id',''));
            $("ul.stats li select[name=type]").trigger("change");
        }

        this.bind('run', function (){
            $("#delete-modal").overlay({
                mask: {
                    color: '#ccc',
                    loadSpeed: 200,
                    opacity: 0.9
                },
                top: 200,
                closeOnClick: false
            }).bind("open-overlay", function (){
                var api = $(this).data("overlay");

                api.load();
            }).bind('close-overlay', function (){
                var api = $(this).data("overlay");

                api.close();
            });

            $("li.gametype").bind("start-edit", function (){
                var self = $(this);
                _app.trigger("start-edit-gametype", {target: self});
            }).bind("cancel-edit", function (){
                var self = $(this);
                $(".form", self).empty();
                if ($.trim($(".marshal", self).text())){
                    $(".display", self).show();
                }
                else {
                    self.remove();
                }
            }).bind("commit-edit", function (event, obj, objstr){
                var self = $(this);

                $(".display .gtname", self).text(obj.gtdata.name);
                $(".marshal", self).text(objstr);
                self.trigger("cancel-edit");
            }).bind("filldata", function (event, data){
                var self = $(this);
                $("input[name=gtname]", self).val(data.name);

                if (data.wltweights){
                    $("ul.weights li", self).eq(0).find("input[name=weight]").val(data.wltweights.wins);
                    $("ul.weights li", self).eq(1).find("input[name=weight]").val(data.wltweights.losses);
                    $("ul.weights li", self).eq(2).find("input[name=weight]").val(data.wltweights.ties);
                }
                else {
                    $("ul.weights li", self).eq(0).find("input[name=weight]").val(0);
                    $("ul.weights li", self).eq(1).find("input[name=weight]").val(0);
                    $("ul.weights li", self).eq(2).find("input[name=weight]").val(0);
                }

                data.stats.forEach(function (stat, index){
                    $(".edit-form", self).trigger("new-stat");
                    $("ul.stats li", self).eq(index).find("input[name=name]").val(stat.name).trigger("keyup");
                    $("ul.stats li", self).eq(index).find("select[name=type]").val(stat.valtype).trigger("change");
                    $("ul.stats li", self).eq(index).find("input[name=extra]").val(stat.valdata);
                    $("ul.weights li", self).eq(index + 4).find("input[name=weight]").val(stat.ratingweight);
                });
            });

            $(".edit-form").bind("new-stat", _new_stat);

            $(".edit-form .cancel-edit").bind("click", _cancel_edit);

            $("a.add-gametype").bind('click', function (){
                var newgametype = $("#gametype-template").clone(true).attr("id","");

                $("li.add-gametype-li").before(newgametype);
                newgametype.trigger("start-edit");
            });

            $("a.edit-gametype").bind('click', _edit_gametype);
            $("a.delete-gametype").bind('click', _delete_gametype);
            $("a.delete-stat").bind('click', function (){
                $(this).parents("li").first().trigger("remove");
            });

            $("select[name=type]").bind("change", function (){
                var myli = $(this).parents("li").first();
                myli.trigger("stattype-change");
            });

            $("#stattype-template").bind("stattype-change", function (){
                var self = $(this);
                var stattype = $("select[name=type]", self).val();
                switch (stattype){
                    case "integer":
                    case "float":
                    case "string":
                        $(".hideable", self).hide();
                        break;
                    case "enum":
                    case "formula":
                        $(".hideable", self).show();
                        if (stattype == "enum"){
                            $(".extra-label", self).text("Choices:");
                        }
                        else if (stattype == "formula"){
                            $(".extra-label", self).text("Formula:");
                        }
                }
            }).bind("remove", function (){
                var index = $(this).index();
                $(this).parents(".edit-form").first().find("ul.weights").find("li").eq(index + 4).remove();
                $(this).remove();
            }).find("input[name=name]").bind("keyup", _statname_change).bind("change", _statname_change).bind("blur", _statname_change);

            $("#weight-template").bind('name-change', function (e, name){
                $(this).find("label").text(name);
            });

            $(".edit-form a.add-stat").bind('click', function (){
                $(this).parents(".edit-form").first().trigger("new-stat");
            });
        });

        this.bind('start-edit-gametype', function (e, data){
            var self = data.target;

            $(".form", self).empty().append($("#form-template").clone(true).attr("id",""));
            var datastr = $.trim($(".marshal", self).text());
            var obj;
            if (datastr){
                obj = this.json(datastr).gtdata;
                self.trigger("filldata", obj);
            }
            $(".display", self).hide();
            $(".form", self).show();
        });

        function noop(){}

        this.get('', noop);
        this.get("#!/", noop);
        this.post("#!/", noop);

        this.get("#!/cancel", function(){
            $("#delete-modal").trigger("close-overlay");

            this.redirect("#!/");
        });

        this.post("#!/edit", function (){
            var me = this;
            var self = $(this.target);
            var theli = self.parents(".gametype").first();

            var obj = {};
            obj.name = $("input[name=gtname]", self).val();

            obj.wltweights = {
                wins: parseFloat($("ul.weights li", self).eq(0).find("input[name=weight]").val()),
                losses: parseFloat($("ul.weights li", self).eq(1).find("input[name=weight]").val()),
                ties: parseFloat($("ul.weights li", self).eq(2).find("input[name=weight]").val())
            };

            obj.stats = [];

            var stat;
            $("ul.stats li", self).each(function (i, o){
                stat = {};
                o = $(o);
                if (!o.hasClass('add')){
                    stat.name = $("input[name=name]", o).val();
                    stat.valtype = $("select[name=type]", o).val();

                    if (stat.valtype == "enum" || stat.valtype == "formula"){
                        stat.valdata = $("input[name=extra]", o).val();
                    }

                    stat.ratingweight = parseFloat($("ul.weights li", theli).eq(i + 4).find("input[name=weight]").val());

                    obj.stats.push(stat);
                }
            });
            
            var origname = this.json($.trim($(".marshal", theli).text()) || "{}").origname || false;

            var gt = {origname: origname, gtdata: obj};

            var url = "save";
            if (window.location.pathname.substring(window.location.pathname.length - 1) == "/"){
                url = "../"+url;
            }

            $.ajax({
                type: 'put',
                url: url,
                data: gt,
                dataType: 'json',
                success: function (data){
                    if (data.ok){
                        $("#flash").trigger('info', [data.info])
                        gt.origname = gt.gtdata.name;
                        theli.trigger("commit-edit", [gt, me.json(gt)]);
                    }
                    else {
                        $("#flash").trigger('error', [data.error]);
                    }

                },
                error: function (){
                    $("#flash").trigger('error', ['Request error']);
                }
            });
        });

        this.post("#!/delete", function (){
            var self = $(this.target);
            var gtname = $.trim($(".gametype-name", self).text());

            var url = gtname;
            if (window.location.pathname.substring(window.location.pathname.length - 1) == "/"){
                url = "../"+url;
            }

            $.ajax({
                type: 'delete',
                url: url,
                dataType: 'json',
                success: function (data){
                    if (data.ok){
                        $("#flash").trigger('info', [data.info])

                        $("#gametypes li.gametype").each(function (i,o){
                            o = $(o);
                            
                            if ($.trim($(".display .gtname", o).text()) == gtname){
                                o.remove();
                            }
                        });
                    }
                    else {
                        $("#flash").trigger('error', [data.error]);
                    }

                    $("#delete-modal").trigger("close-overlay");
                },
                error: function (){
                    $("#flash").trigger('error', ['Request error']);
                }
            });
        });

    });

    gametypes.run();
});