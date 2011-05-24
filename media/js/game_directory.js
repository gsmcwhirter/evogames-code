$(function (){
    var nav = $.sammy("#directory-nav", function (){
        var speed = 200;
        
        function show_default(){
            $("#by-genre, #by-name").hide();

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
                    function (){self.trigger("expand");},
                    function (){self.trigger("collapse");}
                );

                self.trigger("collapse", [true]);
            });
        }

        this.bind('run', show_default);

        this.bind('show-grouping', function (e, data){
            this.$element("li.selected").removeClass("selected");
            this.$element("li#nav-"+data.grouping).addClass("selected");

            var vis = $("#by-name:visible, #by-genre:visible");

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