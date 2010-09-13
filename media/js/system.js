// Bust out of frames!
if (top != self) top.location.href = location.href;

var configs = {
    lightbox: {
        overlayBgColor: '#000',
        overlayOpacity: 0.8,
        imageBlank: '/images/lightbox/blank.gif',
        imageLoading: '/images/lightbox/loading.gif',
        imageBtnClose: '/images/lightbox/btn-close.gif',
        imageBtnPrev: '/images/lightbox/btn-prev.gif',
        imageBtnNext: '/images/lightbox/btn-next.gif',
        containerResizeSpeed: 400
    }
    , tinymce_page: {
        strict_loading_mode : true,
        mode: 'specific_textareas',
        editor_selector: 'site_page_editor',
        theme : "advanced",
        plugins : "table,advhr,advimage,advlink,preview,searchreplace,contextmenu,xhtmlxtras,safari,style",
        relative_urls : false,
        remove_linebreaks : false,
        theme_advanced_buttons1_add : "fontselect,fontsizeselect",
        theme_advanced_buttons2_add : "separator,preview,zoom,separator,forecolor,backcolor",
        theme_advanced_buttons2_add_before: "cut,copy,paste,separator,search,replace,separator",
        theme_advanced_buttons3_add_before : "tablecontrols,separator",
        theme_advanced_buttons3_add : "cite,ins,del,abbr,acronym,styleprops",
        theme_advanced_toolbar_location : "top",
        theme_advanced_toolbar_align : "left",
        theme_advanced_statusbar_location : "bottom",
        theme_advanced_resizing: true,
        extended_valid_elements : "s,a[name|href|target|title|onclick],img[class|src|border=0|alt|title|hspace|vspace|width|height|align|onmouseover|onmouseout|name],hr[class|width|size|noshade],font[face|size|color|style],span[class|align|style],style,center",
        content_css : "/css/reset-fonts.css,/css/jquery-ui.css,/css/lightbox.css,/css/ifm.css",
        body_class : "tinymce"
    }
    , tinymce_bbcode: {
        strict_loading_mode : true,
        mode : "specific_textareas",
        editor_selector: 'site_bbcode_editor',
        theme : "advanced",
        plugins : "bbcode",
        relative_urls : false,
        theme_advanced_buttons1 : "bold,italic,underline,undo,redo,link,unlink,image,forecolor,styleselect,removeformat,cleanup",
        theme_advanced_buttons2 : "",
        theme_advanced_buttons3 : "",
        theme_advanced_toolbar_location : "top",
        theme_advanced_toolbar_align : "left",
        theme_advanced_styles : "quote=quoteStyle",
        content_css : "bbcode.css",
        entity_encoding : "raw",
        add_unload_trigger : false,
        remove_linebreaks : false,
        force_br_newlines : true,
        forced_root_block : ''
    }
};

var site = {
    init: function(){
        tinyMCE.init(configs.tinymce_page);
        tinyMCE.init(configs.tinymce_bbcode);
        site.config_menus();
        site.init_link_rels();
        $(".marquee-vert").scrollable({circular: true, vertical: true}).autoscroll({autoplay: true});
        $(".marquee-horiz").scrollable({circular: true}).autoscroll({autoplay: true});
        $("a.lightbox").lightBox(configs.lightbox);
        site.fade_flash();
    }
    , config_menus: function(){
        $(".menu-outer.collapse .menu-inner").hide();
        $(".menu-outer.collapse .menu-header .icon").addClass("ui-icon")
                                                    .addClass("ui-icon-triangle-1-s");
        $(".menu-outer.collapse .menu-header .clickable").toggle(menu.expand, menu.collapse);
        $(".menu-outer.expand .menu-header .icon").addClass("ui-icon")
                                                  .addClass("ui-icon-triangle-1-n");
        $(".menu-outer.expand .menu-header .clickable").toggle(menu.collapse, menu.expand);
        $(".menu-inner>li>.menu-item[title]").tooltip({
            position: "center right",
            offset: [0, 2],
            effect: "slide",
            opacity: 1.0,
            direction: 'right',
            bounce: false,
            slideOffset: 2
        });
    }
    , init_link_rels: function (){
        $("a[rel=blank]").attr("target","_blank");
    }
    , fade_flash: function (){
        setTimeout(function (){
            $("#flash .ui-widget>div.error").animate({"backgroundColor": "#ccc", "color": "#cd0a0a"}, "slow", "swing")
                                            .find(".ui-icon").addClass('alt');
        }, 1000);
    }
};

var menu = {
    expand: function(event){
        var menu_block = $(this).parent().parent();
        menu_block.removeClass('collapse').addClass('expand');
        $(".menu-header .icon",menu_block).removeClass('ui-icon-triangle-1-s')
                                          .addClass('ui-icon-triangle-1-n');
        $(".menu-inner",menu_block).slideDown(500);
        return false;
    }
    , collapse: function(event){
        var menu_block = $(this).parent().parent();
        menu_block.removeClass('expand').addClass('collapse');
        $(".menu-header .icon",menu_block).removeClass('ui-icon-triangle-1-n')
                                          .addClass('ui-icon-triangle-1-s');
        $(".menu-inner",menu_block).slideUp(500);
        return false;
    }
}

var form_validators = {
    validator: function (){
        this.set_tooltip = function (field) {
            var id = $("#"+field+"_status").attr('id');
            var classes = $("#"+field+"_status").attr('class');
            var title = $("#"+field+"_status").attr('title');
            var new_span = $("<span id='"+id+"' class='"+classes+"' title='"+title+"'>&nbsp;</span>").tooltip({
                position: "center right",
                offset: [-2, 10],
                effect: "toggle",
                opacity: 1.0
            });
            $("#"+field+"_status[title]").replaceWith(new_span);
        };
        
        this.set_status_bad = function (sid, msg){
            $(sid).removeClass("status-field-ok")
                .removeClass("status-field-maybe")
                .addClass("status-field-not-ok")
                .attr("title",msg);
        };
        
        this.set_status_ok = function (sid, msg){
            $(sid).removeClass("status-field-not-ok")
                .removeClass("status-field-maybe")
                .addClass("status-field-ok")
                .attr("title",msg);
        };
        
        this.set_status_maybe = function (sid, msg){
            $(sid).removeClass("status-field-not-ok")
                .removeClass("status-field-ok")
                .addClass("status-field-maybe")
                .attr("title",msg);
        };
    }
};

$(document).ready(site.init);
