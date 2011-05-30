$(function (){
    var gametypes = $.sammy("#gametypes", function (){
        this.use("JSON");
        var _app = this;

        function _statname_change(){
           var index = $(this).parents("li").first().index();
           var modal = $(this).parents(".edit-form").first();
           $("ul.weights", modal).find("li").eq(index).trigger("name-change", [$(this).val()]);
       }

        function _edit_gametype(){
            console.log("edit_gametype");
        }

        function _delete_gametype(){
            console.log("delete_gametype");
        }

        function _cancel_edit(){
            $(this).parents(".gametype:first").trigger("cancel-edit");
        }

        function _new_stat(){
            var self = $(this);

            $("ul.stats li.add", self).before($("#stattype-template").clone(true));
            $("ul.weights", self).append($("#weight-template").clone(true));
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
                $(".form", self).empty().append($("#form-template").clone(true).attr("id",""));
                var datastr = $.trim($(".marshal", self).text());
                var obj;
                if (datastr){
                    obj = _app.json(datastr);
                    self.trigger("filldata", obj);
                }
                $(".display", self).hide();
                $(".form", self).show();
            }).bind("cancel-edit", function (){
                var self = $(this);
                $(".form", self).empty();
                if ($.trim($(".marshal", self).text())){
                    $(".display", self).show();
                }
                else {
                    self.remove();
                }
            }).bind("commit-edit", function (event, objstr){
                var self = $(this);

                console.log("commit-edit");
                console.log(objstr);

                $(".marshal", self).text(objstr);
            }).bind("filldata", function (event, data){
                var self = $(this);
                $("input[name=gtname]").val(data.name);
                data.stats.forEach(function (stat, index){
                    $(".edit-form", self).trigger("new-stat");
                    $("ul.stats li", self).eq(index).find("input[name=name]").val(stat.name).trigger("keyup");
                    $("ul.stats li", self).eq(index).find("select[name=type]").val(stat.valtype).trigger("change");
                    $("ul.stats li", self).eq(index).find("input[name=extra]").val(stat.valdata);
                    $("ul.weights li", self).eq(index).find("input[name=weight]").val(data.rating[index].weight);
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
                $(this).parents(".edit-form").first().find("ul.weights").find("li").eq(index).remove();
                $(this).remove();
            }).find("input[name=name]").bind("keyup", _statname_change).bind("change", _statname_change).bind("blur", _statname_change);

            $("#weight-template").bind('name-change', function (e, name){
                $(this).find("label").text(name);
            });

            $(".edit-form a.add-stat").bind('click', function (){
                $(this).parents(".edit-form").first().trigger("new-stat");
            });
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
            var self = $(this.target);
            var theli = self.parents(".gametype").first();

            var obj = {};
            obj.name = $("input[name=gtname]", self).val();
            obj.stats = [];
            obj.rating = [];

            var stat;
            var rate;
            var sname;
            $("ul.stats li", self).each(function (o, i){
                stat = new Object();
                rate = new Object();
                o = $(o);
                if (!o.hasClass('add')){
                    sname = $("input[name=name]", o).val();
                    stat.name = sname;
                    stat.valtype = $("select[name=type]", o).val();

                    if (stat.type == "enum" || stat.type == "formula"){
                        stat.valdata = $("input[name=extra]", o).val();
                    }

                    rate.name = sname;
                    rate.weight = $("ul.weights li", theli).eq(i).find("input[name=weight]").val();

                    obj.stats.push(stat);
                    obj.rating.push(rate);
                }
            });

            console.log("editing!");
            console.log(obj);

            theli.trigger("commit-edit", [this.json(obj)]);
        });

    });

    gametypes.run();
});