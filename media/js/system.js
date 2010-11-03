$("a[rel=blank]").evently({
    _init: function (){
        $(this).attr("target","_blank");
    }
});

$("#flash").evently({
    _init: {
        before: function (){
            var self = $(this);
            $("div", self).unbind("delayhighlight")
                .unbind("highlight");
            $("div>.x", self).remove();
            $("div", self).prepend("<span class='x'>x</span>");
        },
        selectors: {
            "div": {
                "delayhighlight": function (){
                    var self = $(this);
                    if (!self.hasClass("done")){
                        self.addClass("done");
                        setTimeout(function (){ self.trigger("highlight"); }, 1000);
                    }
                },
                
                "highlight": function (){
                    var self = $(this);
                    self.fadeTo("slow",0.5);
                }
            },
            "div>.x": {
                click: function (){
                    var self = $(this);
                    self.parent().remove();
                }
            }
        },
        after: function (){
            var self = $(this)
            $("div", self).trigger("delayhighlight");
        }
    },
    
    "info": function (e, msg){
        var self = $(this);
        self.append("<div class='info'><span><strong>Info:</strong> "+msg+"</span></div>");
        self.trigger("_init");
    },
    
    "error": function (e, msg){
        var self = $(this);
        self.append("<div class='error'><span><strong>Error:</strong> "+msg+"</span></div>");
        self.trigger("_init");
    }
});

$(".menu-outer").evently({
    _init: {
        selectors: {
            ".menu-inner": {
                "show": function (){
                    $(this).show();
                },
                "hide": function (){
                    $(this).hide();
                },
                "slideDown": function (){
                    $(this).slideDown(500);
                },
                "slideUp": function (){
                    $(this).slideUp(500);
                }
            },
            ".menu-header .icon": {
                "up_arrow": function (){
                    $(this).removeClass("ui-icon-triangle-1-s")
                        .addClass("ui-icon-triangle-1-n");
                },
                "down_arrow": function (){
                    $(this).removeClass("ui-icon-triangle-1-n")
                        .addClass("ui-icon-triangle-1-s");
                }
            },
            ".menu-inner>li>.menu-item[title]": {
                "set_tooltip": function (){
                    $(this).tooltip({
                        position: "center right",
                        offset: [0, 2],
                        effect: "slide",
                        opacity: 1.0,
                        direction: 'right',
                        bounce: false,
                        slideOffset: 2
                    });
                }
            }
        },
        
        after: function (){
            var self = $(this);
            
            $(".menu-header .icon").addClass("ui-icon");
            $(".menu-inner>li>.menu-item[title]", self).trigger("set_tooltip");
            
            if (self.hasClass("collapse")){
                $(".menu-header .clickable", self).toggle(
                    function (){ self.trigger("expand"); },
                    function (){ self.trigger("collapse"); }
                );
                self.trigger("collapse", [true]);
            } 
            else if (self.hasClass("expand")){
                $(".menu-header .clickable", self).toggle(
                    function (){ self.trigger("collapse"); },
                    function (){ self.trigger("expand"); }
                );
                self.trigger("expand", [true]);
            }
        }
    },
    
    collapse: function (e, instant){
        var self = $(this)
        self.removeClass("expand").addClass("collapse");
        if (instant){
            $(".menu-inner", self).trigger("hide");
        }
        else{
            $(".menu-inner", self).trigger("slideUp");
        }
        $(".menu-header .icon", self).trigger("down_arrow");
    },
    
    expand: function (e, instant){
        var self = $(this);
        self.removeClass("collapse").addClass("expand");
        if (instant){
            $(".menu-inner", self).trigger("show");
        }
        else {
            $(".menu-inner", self).trigger("slideDown");
        }
        $(".menu-header .icon", self).trigger("up_arrow");
    }
    
});

$(".field-status").evently({
    "refresh": function (){
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
    },
    
    "bad": function (e, msg){
        var self = $(this);
        self.css("border-color", "#800");
        $("span", self).removeClass("status-field-ok")
                       .removeClass("status-field-maybe")
                       .addClass("status-field-not-ok")
                       .attr("title",msg);
        self.trigger("refresh");
    },
    
    "ok": function (e, msg){
        var self = $(this);
        msg = msg || "OK";
        
        self.css("border-color", "#080");
        $("span", self).removeClass("status-field-not-ok")
                       .removeClass("status-field-maybe")
                       .addClass("status-field-ok")
                       .attr("title",msg);
        self.trigger("refresh");
    },
    
    "maybe": function (e, msg){
        var self = $(this);
        self.css("border-color", "#008");
        $("span", self).removeClass("status-field-not-ok")
                       .removeClass("status-field-ok")
                       .addClass("status-field-maybe")
                       .attr("title",msg);
        self.trigger("refresh");
    }
});
