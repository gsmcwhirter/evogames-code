$(function (){
    var nav = $.sammy("#group-events", function (){
        var speed = 200;
        var _app = this;
        var _lastgroup = "current";
        
        function show_default(){
            this.$element(".directory-nav").show();
            this.$element(".group-directory").show();
            this.$element(".current .future .past").hide();
            this.$element(".current li, .future li, .past li").show();
        }

        function do_search(){
            var string = $(this).val().toLowerCase();
            if (string === '') {
                _app.trigger("reconfigure");
                _app.trigger("show-grouping", {grouping: _lastgroup, instant: true});
            } else {
                _app.$element(".directory-nav").hide();
                _app.$element(".current li, .future li, .past li").hide();
                _app.$element(".current, .future, .past").show();
                _app.$element(".current li, .future li, .past li").each(function (index) {
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

            this.$element(".search").bind("keyup", do_search);
            this.$element(".search").bind("change", do_search);
            this.$element(".search").bind("click", do_search);
        });

        this.bind('show-grouping', function (e, data){
            var self = this;
            _lastgroup = data.grouping;
            this.$element("li.selected").removeClass("selected");
            this.$element("li.nav-"+data.grouping).addClass("selected");

            var vis = this.$element(".current, .future, .past").filter(":visible");

            if (data.instant){
                vis.hide();
                this.$element("."+data.grouping).show();
            }
            else if (vis.length){
                vis.slideUp(speed, function (){
                    self.$element("."+data.grouping).slideDown(speed);
                });
            }
            else {
                this.$element("."+data.grouping).slideDown(speed);
            }
            
        });

        function show_first(){
            var grouping = this.$element("li a[href]").first().attr('rel');
            this.trigger("show-grouping", {grouping: grouping});
        }

        this.get('', show_first);

        this.get("#!/", show_first);

        this.get("#!/events/:grouping", function (){
            this.trigger("show-grouping", {grouping: this.params.grouping});
        });
    });

    nav.run();
});