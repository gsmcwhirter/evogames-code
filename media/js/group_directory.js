$(function (){
    var nav = $.sammy("#directory-nav", function (){
        var speed = 200;
        var _app = this;
        var _lastgroup;
        
        function reconfigure(){
            $("#directory-nav").show();
            $(".group-directory").hide();
            $('.group-directory li').show();
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

        function do_search(){
            var string = $(this).val().toLowerCase();
            if (string === '') {
                _app.trigger("reconfigure");
                _app.trigger("show-grouping", {grouping: _lastgroup, instant: true});
            } else {
                $("#directory-nav").hide();
                $('.group-directory li').hide();
                $('.group-directory').show();
                $('.group-directory li').each(function (index) {
                    var element = $(this);
                    if ($("a", element).text().toLowerCase().indexOf(string) >= 0) {
                        element.show();
                    }
                    else if ($("span.code", element).text().toLowerCase().indexOf(string) >= 0){
                        element.show();
                    }
                    else {
                        element.hide();
                    }
                });
            }
        }

        this.bind('reconfigure', reconfigure);
        this.bind('default', show_first);

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

            var vis = $(".group-directory:visible");

            if (data.instant){
                vis.hide();
                $("#grouping-"+data.grouping).show();
            }
            else if (vis.length){
                vis.slideUp(speed, function (){
                    $("#grouping-"+data.grouping).slideDown(speed);
                });
            }
            else {
                $("#grouping-"+data.grouping).slideDown(speed);
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