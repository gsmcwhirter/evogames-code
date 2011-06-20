$(function (){
    var nav = $.sammy("#directory-nav", function (){
        var speed = 200;
        var _app = this;
        var _lastgroup;

        function reconfigure(){
            $("#directory-nav").show();
            $(".stats-display").hide();
        }

        this.bind('reconfigure', reconfigure);
        this.bind('default', show_first);

        this.bind('run', function (){
            this.trigger("reconfigure");
        });

        this.bind('show-grouping', function (e, data){
            _lastgroup = data.grouping;

            this.$element("li.selected").removeClass("selected");
            this.$element("li#nav-gametype-"+data.grouping).addClass("selected");

            var vis = $(".stats-display:visible");

            if (data.instant){
                vis.hide();
                $("#gametype-"+data.grouping).show();
            }
            else if (vis.length){
                vis.slideUp(speed, function (){
                    $("#gametype-"+data.grouping).slideDown(speed);
                });
            }
            else {
                $("#gametype-"+data.grouping).slideDown(speed);
            }

        });

        function show_first(e, data){
            var grouping = this.$element("li a[href]").first().text().toLowerCase();
            this.trigger("show-grouping", {grouping: grouping, instant: data ? data.instant : false});
        }

        this.get('', show_first);

        this.get("#!/", show_first);

        this.get("#!/:grouping", function (){
            this.trigger("show-grouping", {grouping: this.params.grouping});
        });
    });

    nav.run();
});