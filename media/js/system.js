var validators = {
    _ready: false,
    _validators: [],
    run: function (){
        if (arguments.length > 0){
            var argarray = [];
            for (var k in arguments){
                if (arguments[k] instanceof Array){
                    argarray = argarray.concat(arguments[k]);
                }
                else {
                    argarray.push(arguments[k]);
                }
            }

            if (this._ready){
                for (var i = 0; i < argarray.length; i++){
                    $(argarray[i]).trigger("run");
                }
            }
            else {
                this._validators = this._validators.concat(argarray);
            }
        }
    },
    ready: function (){
        var self = this;
        $(function (){
            self._ready = true;
            
            var num = self._validators.length;
            self._validators.reverse();
            var selector;
            for(var i = 0; i < num; i++){
                selector = self._validators.pop();
                $(selector).trigger("run");
            }
        });
    }
};

$(function (){
    function bindings(selector){
        $(selector).prepend("<span class='x'>x</span>");
        selector.bind("delayhighlight", function (){
            var self = $(this);
            if (!self.hasClass("done")){
                self.addClass("done");
                setTimeout(function (){self.trigger("highlight");}, 1000);
            }
        }).bind("highlight", function (){
            $(this).fadeTo("slow", 0.5);
        }).bind("bind-xs", function (){
            var self = $(this);
            $(">.x", self).bind('click', function (){
                $(this).parent().remove();
            });
        });

        return selector;
    }

    $("#flash").bind('run', function (){
        var self = $(this);
        bindings($("div", self)).trigger("bind-xs").trigger("delayhighlight");
    }).bind("info", function (e, msg){
        var self = $(this)
        var newdiv = $("<div class='info'><span><strong>Info:</strong> "+msg+"</span></div>");
        bindings(newdiv);
        self.append(newdiv);
        newdiv.trigger("bind-xs");
        newdiv.trigger("delayhighlight");
    }).bind("error", function (e, msg){
        var self = $(this);
        var newdiv = $("<div class='error'><span><strong>Error:</strong> "+msg+"</span></div>");
        bindings(newdiv);
        self.append(newdiv);
        newdiv.trigger("bind-xs");
        newdiv.trigger("delayhighlight");
    }).trigger("run");
});

$(function (){
    $("#menu").bind('run', function (){
        var self = $(this);

        $(".menu-header .icon", self).bind("up-arrow", function (){
            $(this).removeClass("ui-icon-triangle-1-s").addClass("ui-icon-triangle-1-n");
        }).bind("down-arrow", function (){
            $(this).removeClass("ui-icon-triangle-1-n").addClass("ui-icon-triangle-1-s");
        }).addClass("ui-icon");

        $(".menu-inner>li>.menu-item[title]", self).bind('set-tooltip', function (){
            $(this).tooltip({
                position: "center right",
                offset: [0, 2],
                effect: "slide",
                opacity: 1.0,
                direction: 'right',
                bounce: false,
                slideOffset: 2
            });
        }).trigger("set-tooltip");

        $(".menu-outer", self).bind("collapse", function (e, instant){
            var self = $(this)
            self.removeClass("expand").addClass("collapse");
            if (instant){
                $(".menu-inner", self).hide();
            }
            else{
                $(".menu-inner", self).slideUp(500);
            }
            $(".menu-header .icon", self).trigger("down-arrow");
        }).bind("expand", function (e, instant){
            var self = $(this);
            self.removeClass("collapse").addClass("expand");
            if (instant){
                $(".menu-inner", self).show();
            }
            else {
                $(".menu-inner", self).slideDown(500);
            }
            $(".menu-header .icon", self).trigger("up-arrow");
        }).each(function (){
            var self = $(this);
            if (self.hasClass("collapse")){
                $(".menu-header .clickable", self).toggle(
                    function (){self.trigger("expand");},
                    function (){self.trigger("collapse");}
                );

                self.trigger("collapse", [true]);
            }
            else if (self.hasClass("expand")) {
                $(".menu-header .clickable", self).toggle(
                    function (){self.trigger("collapse");},
                    function (){self.trigger("expand");}
                );

                self.trigger("expand", [true]);
            }
        });
    }).trigger("run");
});

$(function (){
    $(".field-status").bind("refresh", function (){
        var self = $(this);
        var span = $("span", self);
        var classes = span.attr('class');
        var title = span.attr('title');
        var new_span = $("<span class='"+classes+"' title='"+title+"'>&nbsp;</span>").tooltip({
            position: "center right",
            offset: [-2, 10],
            effect: "toggle",
            opacity: 1.0
        });

        span.replaceWith(new_span);
    }).bind("bad", function (e, msg){
        var self = $(this);
        self.css("border-color", "#800");
        $("span", self).removeClass("status-field-ok")
                       .removeClass("status-field-maybe")
                       .addClass("status-field-not-ok")
                       .attr("title",msg);
        self.trigger("refresh");
    }).bind("ok", function (e, msg){
        var self = $(this);
        msg = msg || "OK";

        self.css("border-color", "#080");
        $("span", self).removeClass("status-field-not-ok")
                       .removeClass("status-field-maybe")
                       .addClass("status-field-ok")
                       .attr("title",msg);
        self.trigger("refresh");
    }).bind("maybe", function (e, msg){
        var self = $(this);
        self.css("border-color", "#008");
        $("span", self).removeClass("status-field-not-ok")
                       .removeClass("status-field-ok")
                       .addClass("status-field-maybe")
                       .attr("title",msg);
        self.trigger("refresh");
    });

    validators.ready();
});

$(function (){
    $("a[rel=blank]").attr("target", "_blank");
});