$(function (){
    var nav = $.sammy("#directory-nav", function (){
        var speed = 200;
        var _app = this;
        var _lastgroup = "by-genre";
        
        function show_default(){
            $("#directory-nav").show();
            $("#by-genre, #by-name").hide();
            $("#by-genre li, #by-name li").show();
        }

        function do_search(){
            var string = $(this).val().toLowerCase();
            if (string === '') {
                _app.trigger("reconfigure");
                _app.trigger("show-grouping", {grouping: _lastgroup, instant: true});
            } else {
                $("#directory-nav, #by-genre").hide();
                $("#by-name li").hide();
                $("#by-name").show();
                $('#by-name li').each(function (index) {
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

            $(".genre-link .icon").bind("up-arrow", function (){
                $(this).removeClass("ui-icon-triangle-1-s").addClass("ui-icon-triangle-1-n");
            }).bind("down-arrow", function (){
                $(this).removeClass("ui-icon-triangle-1-n").addClass("ui-icon-triangle-1-s");
            }).addClass("ui-icon");

            $(".genre-link").bind("collapse", function (e, instant){
                var self = $(this);
                if (instant){
                    $(".game-list", self).hide();
                }
                else{
                    $(".game-list", self).slideUp(speed);
                }
                $(".icon", self).trigger("down-arrow");
            }).bind("expand", function (e, instant){
                var self = $(this);
                if (instant){
                    $(".game-list", self).show();
                }
                else {
                    $(".game-list", self).slideDown(speed);
                }
                $(".icon", self).trigger("up-arrow");
            }).each(function (){
                var self = $(this);
                $(".clickable", self).toggle(
                    function (){self.trigger("collapse");},
                    function (){self.trigger("expand");}
                );

                self.trigger("expand", [true]);
            });

            $("#search").bind("keyup", do_search);
            $("#search").bind("change", do_search);
            $("#search").bind("click", do_search);
        });

        this.bind('show-grouping', function (e, data){
            _lastgroup = data.grouping;
            this.$element("li.selected").removeClass("selected");
            this.$element("li#nav-"+data.grouping).addClass("selected");

            var vis = $("#by-name:visible, #by-genre:visible");

            if (data.instant){
                vis.hide();
                $("#"+data.grouping).show();
            }
            else if (vis.length){
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