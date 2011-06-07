$(function (){
    var gametypes = $.sammy("#gtform", function (){
        var _speed = 200;
        this.use("JSON");

        function _statname_change(){
           var index = $(this).parents("li").first().index();
           var modal = $(this).parents("#gtform").first();
           $("ul.weights", modal).find("li").eq(index).trigger("name-change", [$(this).val()]);
       }

        function _new_stat(){
            var self = $(this);

            $("ul.stats li.add", self).before($("#stattype-template").clone(true).attr('id',''));
            $("ul.weights", self).append($("#weight-template").clone(true).attr('id',''));
            $("ul.stats li select[name=type]").trigger("change");
        }

        this.bind('run', function (){
            var _app = this;

            $("form").bind("submit", function (){
                var self = $(this);

                var obj = {};
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

                        stat.ratingweight = parseFloat($("ul.weights li", self).eq(i).find("input[name=weight]").val());

                        obj.stats.push(stat);
                    }
                });

                console.log(obj);

                $("input[name=marshal]").val(_app.json(obj));

                return true;
            });

            $("#gametype_name").bind("change", function (){
                var self = $(this);
                if (self.val() == "custom"){
                    $("#gtform").slideDown(_speed);
                }
                else {
                    $("#gtform").slideUp(_speed);
                }
            }).trigger("change");

            $("#gtform").bind("filldata", function (event, data){
                var self = $(this);
                $("input[name=gtname]", self).val(data.name);
                data.stats.forEach(function (stat, index){
                    self.trigger("new-stat");
                    $("ul.stats li", self).eq(index).find("input[name=name]").val(stat.name).trigger("keyup");
                    $("ul.stats li", self).eq(index).find("select[name=type]").val(stat.valtype).trigger("change");
                    $("ul.stats li", self).eq(index).find("input[name=extra]").val(stat.valdata);
                    $("ul.weights li", self).eq(index).find("input[name=weight]").val(stat.ratingweight);
                });
            }).bind("new-stat", _new_stat);

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
                $(this).parents("#gtform").first().find("ul.weights").find("li").eq(index).remove();
                $(this).remove();
            }).find("input[name=name]").bind("keyup", _statname_change).bind("change", _statname_change).bind("blur", _statname_change);

            $("#weight-template").bind('name-change', function (e, name){
                $(this).find("label").text(name);
            });

            $("#gtform a.add-stat").bind('click', function (){
                $(this).parents("#gtform").trigger("new-stat");
            });

            this.trigger("start-edit-gametype", {target: $("#gtform")});
        });

        this.bind('start-edit-gametype', function (e, data){
            var self = data.target;

            var datastr = $.trim($("input[name=marshal]", self).val());
            var obj;
            if (datastr){
                obj = this.json(datastr);

                console.log(obj);

                self.trigger("filldata", obj);
            }
        });

        function noop(){}

        this.get('', noop);
        this.get("#!/", noop);
        this.post("#!/", noop);

    });

    gametypes.run();
});