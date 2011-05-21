$(function (){
    var nav = $.sammy("#directory-nav", function (){
        var speed = 200;
        
        function show_default(){
            $(".group-directory").hide();
            this.$element("li").each(function (i, o){
                o = $(o);
                var grouping = o.attr('id').substring(4);
                var a = o.find("a");
                var text = a.text();

                if ($("#grouping-"+grouping+" li").length < 2){
                    a.replaceWith("<span>"+text+"</span>");
                }
            });
        }

        this.bind('run', show_default);

        this.bind('show-grouping', function (e, data){
            this.$element("li.selected").removeClass("selected");
            this.$element("li#nav-"+data.grouping).addClass("selected");

            var vis = $(".group-directory:visible");

            if (vis.length){
                vis.slideUp(speed, function (){
                    $("#grouping-"+data.grouping).slideDown(speed);
                });
            }
            else {
                $("#grouping-"+data.grouping).slideDown(speed);
            }
            
        });

        function show_first(){
            var grouping = this.$element("li a[href]").first().text().toLowerCase();
            this.trigger("show-grouping", {grouping: grouping});
        }

        this.get('', show_first);

        this.get("#!/", show_first);

        this.get("#!/:grouping", function (){
            this.trigger("show-grouping", {grouping: this.params.grouping});
        });
    });

    nav.run();
});