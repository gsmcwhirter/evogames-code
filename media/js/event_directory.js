$(function (){
    var nav = $.sammy("#directory-nav", function (){
        var speed = 200;
        var _app = this;
        var _lastgroup = "current-events";
        
        function show_default(){
            $("#directory-nav").show();
            $("#current-events, #future-events, #past-events").hide();
            $("#current-events li, #future-events li, #past-events li").show();
        }

        function do_search(){
            var string = $(this).val().toLowerCase();
            if (string === '') {
                _app.trigger("reconfigure");
                _app.trigger("show-grouping", {grouping: _lastgroup, instant: true});
            } else {
                $("#directory-nav").hide();
                $("#current-events li, #future-events li, #past-events li").hide();
                $("#current-events, #future-events, #past-events").show();
                $("#current-events li, #future-events li, #past-events li").each(function (index) {
                    var element = $(this);
                    if ($("a", element).text().toLowerCase().indexOf(string) >= 0) {
                        element.show();
                    }
                    else {
                        element.hide();
                    }
                });
            }
        }

        this.bind("reconfigure", show_default);

        this.bind('run', function (){
            this.trigger("reconfigure");

            $("#search").bind("keyup", do_search);
            $("#search").bind("change", do_search);
            $("#search").bind("click", do_search);
        });

        this.bind('show-grouping', function (e, data){
            _lastgroup = data.grouping;
            this.$element("li.selected").removeClass("selected");
            this.$element("li#nav-"+data.grouping).addClass("selected");

            var vis = $("#current-events:visible, #future-events:visible, #past-events:visible");

            if (data.instant){
                vis.hide();
                $("#"+data.grouping).show();
            }
            if (vis.length){
                vis.slideUp(speed, function (){
                    $("#"+data.grouping).slideDown(speed);
                });
            }
            else {
                $("#"+data.grouping).slideDown(speed);
            }
            
        });

        function show_first(){
            var grouping = this.$element("li a[href]").first().attr('rel');
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